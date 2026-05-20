import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { MeetingsService } from './meetings.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateMeetingDto, JoinRoomDto, UpdateMeetingDto, WaitingRoomJoinDto, WaitingRoomRespondDto } from './dto/index.js';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
    role?: UserRole;
  };
};

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @SkipThrottle()
  @HttpCode(200)
  @Post('webhooks/livekit')
  async livekitWebhook(
    @Req() request: Request,
    @Body() body: unknown,
    @Headers('authorization') authorizationHeader?: string,
    @Headers('authorize') authorizeHeader?: string,
  ) {
    const rawBody = this.extractRawBody(request, body);
    return this.meetingsService.processLivekitWebhook(
      rawBody,
      authorizationHeader || authorizeHeader,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyMeetings(
    @Req() request: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const hostId = request.user?.sub?.trim();
    if (!hostId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10) || 50));

    return this.meetingsService.getMeetingsForHost(hostId, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @Post(':id/finish')
  async finishMeeting(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const hostId = request.user?.sub?.trim();
    if (!hostId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    return this.meetingsService.finishMeeting(id, hostId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @Post()
  async createMeeting(
    @Body() body: CreateMeetingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const hostId = request.user?.sub?.trim();

    if (!hostId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    return this.meetingsService.createMeeting({
      title: body.title.trim(),
      hostId,
      roomName: body.roomName?.trim(),
      isPasswordProtected: body.isPasswordProtected,
      roomPassword: body.roomPassword?.trim(),
      waitingRoomEnabled: body.waitingRoomEnabled,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    });
  }

  // Protected — only authenticated users can view meeting details
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMeeting(@Param('id') id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    return this.meetingsService.getMeetingById(id);
  }

  @Post('join')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async joinRoom(@Body() body: JoinRoomDto) {
    await this.meetingsService.ensureRoomJoinAllowed(body.roomName.trim(), body.roomPassword?.trim());
    const token = await this.meetingsService.createToken(body.roomName.trim(), body.participantName.trim());

    return {
      token,
      roomName: body.roomName.trim(),
      livekitUrl: process.env.LIVEKIT_URL,
    };
  }

  // === Edit / Delete ===

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @Patch(':id')
  async updateMeeting(
    @Param('id') id: string,
    @Body() body: UpdateMeetingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const hostId = this.getHostId(request);
    return this.meetingsService.updateMeeting(id, hostId, {
      title: body.title,
      isPasswordProtected: body.isPasswordProtected,
      roomPassword: body.roomPassword,
      waitingRoomEnabled: body.waitingRoomEnabled,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  @Delete(':id')
  async deleteMeeting(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const hostId = this.getHostId(request);
    return this.meetingsService.deleteMeeting(id, hostId);
  }

  private extractRawBody(request: Request, parsedBody: unknown): string {
    const candidate = request.body;

    if (typeof candidate === 'string') {
      return candidate;
    }

    if (Buffer.isBuffer(candidate)) {
      return candidate.toString('utf8');
    }

    if (typeof parsedBody === 'string') {
      return parsedBody;
    }

    return JSON.stringify(parsedBody || {});
  }

  // === Waiting Room ===

  @Post('waiting-room/join')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async joinWaitingRoom(@Body() body: WaitingRoomJoinDto) {
    return this.meetingsService.joinWaitingRoom(body.roomName.trim(), body.participantName.trim());
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/waiting-room')
  async getWaitingList(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    const hostId = this.getHostId(request);
    return this.meetingsService.getWaitingList(id, hostId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('waiting-room/:entryId/respond')
  async respondToWaiting(
    @Param('entryId') entryId: string,
    @Body() body: WaitingRoomRespondDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const hostId = this.getHostId(request);
    return this.meetingsService.respondToWaitingEntry(entryId, hostId, body.status);
  }

  @Get('waiting-room/status/:roomName/:participantName')
  async checkWaitingStatus(
    @Param('roomName') roomName: string,
    @Param('participantName') participantName: string,
  ) {
    return this.meetingsService.checkWaitingStatus(roomName, participantName);
  }

  private getHostId(req: AuthenticatedRequest): string {
    const hostId = req.user?.sub?.trim();
    if (!hostId) throw new UnauthorizedException('Authenticated user is required');
    return hostId;
  }
}
