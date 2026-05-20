import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, WebhookReceiver } from 'livekit-server-sdk';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateMeetingInput = {
  title: string;
  hostId: string;
  roomName?: string;
  isPasswordProtected?: boolean;
  roomPassword?: string;
  waitingRoomEnabled?: boolean;
  scheduledFor?: Date;
};

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createMeeting(input: CreateMeetingInput) {
    const host = await this.prisma.user.findUnique({
      where: { id: input.hostId },
      select: { id: true },
    });

    if (!host) {
      throw new NotFoundException('Host user not found');
    }

    const title = input.title.trim();
    if (!title) {
      throw new BadRequestException('title is required');
    }

    const protectedRoom = Boolean(input.isPasswordProtected);
    if (protectedRoom && !input.roomPassword?.trim()) {
      throw new BadRequestException('roomPassword is required when isPasswordProtected=true');
    }

    const roomName = (input.roomName || '').trim() || this.generateRoomName();
    const passwordHash = protectedRoom ? await bcrypt.hash(input.roomPassword!.trim(), 10) : null;

    try {
      const meeting = await this.prisma.meeting.create({
        data: {
          title,
          roomName,
          isPasswordProtected: protectedRoom,
          roomPassword: passwordHash,
          waitingRoomEnabled: Boolean(input.waitingRoomEnabled),
          hostId: input.hostId,
          scheduledFor: input.scheduledFor,
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return this.toMeetingResponse(meeting);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Meeting with this roomName already exists');
      }
      throw error;
    }
  }

  async getMeetingById(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return this.toMeetingResponse(meeting);
  }

  async getMeetingsForHost(hostId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [meetings, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where: { hostId },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.meeting.count({ where: { hostId } }),
    ]);

    return {
      data: meetings.map((meeting) => this.toMeetingResponse(meeting)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async finishMeeting(meetingId: string, hostId: string) {
    // Atomic update with condition to prevent race conditions
    const now = new Date();
    const result = await this.prisma.meeting.updateMany({
      where: {
        id: meetingId,
        hostId,
        endedAt: null, // Only finish if not already finished
      },
      data: {
        startedAt: now, // Will be overwritten below if already started
        endedAt: now,
      },
    });

    if (result.count === 0) {
      // Either meeting doesn't exist, user isn't host, or already finished
      const meeting = await this.prisma.meeting.findFirst({
        where: { id: meetingId, hostId },
        select: { id: true, endedAt: true },
      });

      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }

      // Already finished — return current state
      return this.getMeetingById(meetingId);
    }

    // If meeting was already started, preserve the original startedAt
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { startedAt: true },
    });

    // The updateMany above set startedAt=now, but if it was already set we need to keep original
    // Actually let's do a proper conditional update
    await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        endedAt: now,
      },
    });

    return this.getMeetingById(meetingId);
  }

  async ensureRoomJoinAllowed(roomName: string, roomPassword?: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { roomName },
      select: {
        id: true,
        isPasswordProtected: true,
        roomPassword: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting room not found');
    }

    if (!meeting.isPasswordProtected) {
      return;
    }

    const candidate = roomPassword?.trim();
    if (!candidate) {
      throw new UnauthorizedException('This room requires a password');
    }

    if (!meeting.roomPassword) {
      throw new UnauthorizedException('Room password is not configured');
    }

    const passwordMatches = await bcrypt.compare(candidate, meeting.roomPassword);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid room password');
    }
  }

  async createToken(roomName: string, participantName: string): Promise<string> {
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new BadRequestException('LiveKit credentials are missing in environment variables');
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return at.toJwt();
  }

  async processLivekitWebhook(rawBody: string, authHeader?: string) {
    const body = rawBody?.trim();
    if (!body) {
      throw new BadRequestException('Webhook body is empty');
    }

    const eventPayload = await this.parseWebhook(body, authHeader);
    const eventName = String(eventPayload?.event || '');
    if (!eventName) {
      throw new BadRequestException('LiveKit event is missing');
    }

    const roomName = this.extractRoomName(eventPayload);
    const now = new Date();

    if (roomName) {
      if (eventName === 'room_started') {
        await this.prisma.meeting.updateMany({
          where: { roomName, startedAt: null },
          data: { startedAt: now },
        });
      }

      if (eventName === 'room_finished') {
        await this.prisma.meeting.updateMany({
          where: { roomName, endedAt: null },
          data: { endedAt: now },
        });
      }
    }

    return {
      received: true,
      event: eventName,
      roomName: roomName || null,
      timestamp: now.toISOString(),
    };
  }

  private async parseWebhook(rawBody: string, authHeader?: string): Promise<any> {
    const skipAuth = this.configService.get<string>('LIVEKIT_WEBHOOK_SKIP_AUTH') === 'true';

    if (skipAuth) {
      try {
        return JSON.parse(rawBody);
      } catch {
        throw new BadRequestException('Webhook body is not valid JSON');
      }
    }

    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new BadRequestException('LiveKit credentials are missing in environment variables');
    }

    if (!authHeader?.trim()) {
      throw new UnauthorizedException('LiveKit Authorization header is missing');
    }

    try {
      const receiver = new WebhookReceiver(apiKey, apiSecret);
      return await receiver.receive(rawBody, authHeader);
    } catch {
      throw new UnauthorizedException('Invalid LiveKit webhook signature');
    }
  }

  private extractRoomName(payload: any): string | undefined {
    const roomName =
      payload?.room?.name ||
      payload?.room?.roomName ||
      payload?.egressInfo?.roomName ||
      payload?.ingressInfo?.roomName;

    if (!roomName || typeof roomName !== 'string') {
      return undefined;
    }

    return roomName;
  }

  private generateRoomName(): string {
    return `room-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  // === Waiting Room ===

  async updateMeeting(meetingId: string, hostId: string, data: { title?: string; isPasswordProtected?: boolean; roomPassword?: string; waitingRoomEnabled?: boolean; scheduledFor?: Date }) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, hostId },
    });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    if (meeting.endedAt) {
      throw new BadRequestException('Cannot edit a finished meeting');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.waitingRoomEnabled !== undefined) updateData.waitingRoomEnabled = data.waitingRoomEnabled;
    if (data.scheduledFor !== undefined) updateData.scheduledFor = data.scheduledFor;
    if (data.isPasswordProtected !== undefined) {
      updateData.isPasswordProtected = data.isPasswordProtected;
      if (data.isPasswordProtected && data.roomPassword) {
        updateData.roomPassword = await bcrypt.hash(data.roomPassword.trim(), 10);
      } else if (!data.isPasswordProtected) {
        updateData.roomPassword = null;
      }
    }

    await this.prisma.meeting.update({ where: { id: meetingId }, data: updateData });
    return this.getMeetingById(meetingId);
  }

  async deleteMeeting(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, hostId },
    });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    await this.prisma.waitingRoomEntry.deleteMany({ where: { meetingId } });
    await this.prisma.meeting.delete({ where: { id: meetingId } });
    return { message: 'Meeting deleted' };
  }

  async joinWaitingRoom(roomName: string, participantName: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { roomName },
      select: { id: true, waitingRoomEnabled: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting room not found');
    }

    if (!meeting.waitingRoomEnabled) {
      return { status: 'no_waiting_room', message: 'Waiting room is not enabled' };
    }

    // Upsert waiting entry
    await this.prisma.waitingRoomEntry.upsert({
      where: {
        meetingId_participantName: { meetingId: meeting.id, participantName },
      },
      create: { meetingId: meeting.id, participantName, status: 'waiting' },
      update: { status: 'waiting' },
    });

    return { status: 'waiting', message: 'You are in the waiting room' };
  }

  async getWaitingList(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, hostId },
      select: { id: true },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return this.prisma.waitingRoomEntry.findMany({
      where: { meetingId, status: 'waiting' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async respondToWaitingEntry(entryId: string, hostId: string, status: 'approved' | 'rejected') {
    const entry = await this.prisma.waitingRoomEntry.findUnique({
      where: { id: entryId },
      include: { meeting: { select: { hostId: true } } },
    });

    if (!entry || entry.meeting.hostId !== hostId) {
      throw new NotFoundException('Waiting room entry not found');
    }

    await this.prisma.waitingRoomEntry.update({
      where: { id: entryId },
      data: { status },
    });

    return { status, participantName: entry.participantName };
  }

  async checkWaitingStatus(roomName: string, participantName: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { roomName },
      select: { id: true, waitingRoomEnabled: true },
    });

    if (!meeting) {
      return { status: 'not_found' };
    }

    if (!meeting.waitingRoomEnabled) {
      return { status: 'no_waiting_room' };
    }

    const entry = await this.prisma.waitingRoomEntry.findUnique({
      where: {
        meetingId_participantName: { meetingId: meeting.id, participantName },
      },
      select: { status: true },
    });

    return { status: entry?.status || 'not_found' };
  }

  private toMeetingResponse(meeting: {
    id: string;
    title: string;
    roomName: string;
    isPasswordProtected: boolean;
    hostId: string;
    createdAt: Date;
    scheduledFor: Date | null;
    startedAt: Date | null;
    endedAt: Date | null;
    host: {
      id: string;
      name: string | null;
      email: string;
    };
  }) {
    return {
      id: meeting.id,
      title: meeting.title,
      roomName: meeting.roomName,
      isPasswordProtected: meeting.isPasswordProtected,
      hostId: meeting.hostId,
      createdAt: meeting.createdAt,
      scheduledFor: meeting.scheduledFor,
      startedAt: meeting.startedAt,
      endedAt: meeting.endedAt,
      host: meeting.host,
    };
  }
}
