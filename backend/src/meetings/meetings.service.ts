import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessToken, WebhookReceiver } from 'livekit-server-sdk';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

type CreateMeetingInput = {
  title: string;
  hostId: string;
  roomName?: string;
  isPasswordProtected?: boolean;
  roomPassword?: string;
  scheduledFor?: Date;
};

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getMeetingsForHost(hostId: string) {
    const meetings = await this.prisma.meeting.findMany({
      where: { hostId },
      orderBy: [{ createdAt: 'desc' }],
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

    return meetings.map((meeting) => this.toMeetingResponse(meeting));
  }

  async finishMeeting(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, hostId },
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.endedAt) {
      return this.getMeetingById(meetingId);
    }

    const now = new Date();
    const updated = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        startedAt: meeting.startedAt ?? now,
        endedAt: now,
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

    return this.toMeetingResponse(updated);
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
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

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
    const skipAuth = process.env.LIVEKIT_WEBHOOK_SKIP_AUTH === 'true';

    if (skipAuth) {
      try {
        return JSON.parse(rawBody);
      } catch {
        throw new BadRequestException('Webhook body is not valid JSON');
      }
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

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
