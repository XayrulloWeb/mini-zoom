import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

type CreateMeetingBody = {
  title?: string;
  roomName?: string;
  isPasswordProtected?: boolean;
  roomPassword?: string;
  scheduledFor?: string;
};

type JoinRoomBody = {
  roomName?: string;
  participantName?: string;
  roomPassword?: string;
};

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
  async getMyMeetings(@Req() request: AuthenticatedRequest) {
    const hostId = request.user?.sub?.trim();
    if (!hostId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    return this.meetingsService.getMeetingsForHost(hostId);
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
    @Body() body: CreateMeetingBody,
    @Req() request: AuthenticatedRequest,
  ) {
    const title = body.title?.trim();
    const hostId = request.user?.sub?.trim();

    if (!hostId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    if (!title) {
      throw new BadRequestException('title is required');
    }

    if (body.isPasswordProtected && !body.roomPassword?.trim()) {
      throw new BadRequestException('roomPassword is required when isPasswordProtected=true');
    }

    let scheduledFor: Date | undefined;
    if (body.scheduledFor) {
      scheduledFor = new Date(body.scheduledFor);
      if (Number.isNaN(scheduledFor.getTime())) {
        throw new BadRequestException('scheduledFor must be a valid ISO date');
      }
    }

    return this.meetingsService.createMeeting({
      title,
      hostId,
      roomName: body.roomName?.trim(),
      isPasswordProtected: body.isPasswordProtected,
      roomPassword: body.roomPassword?.trim(),
      scheduledFor,
    });
  }

  @Get(':id')
  async getMeeting(@Param('id') id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    return this.meetingsService.getMeetingById(id);
  }

  @Post('join')
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  async joinRoom(@Body() body: JoinRoomBody) {
    const roomName = body.roomName?.trim();
    const participantName = body.participantName?.trim();
    const roomPassword = body.roomPassword?.trim();

    if (!roomName || !participantName) {
      throw new BadRequestException('roomName and participantName are required');
    }

    await this.meetingsService.ensureRoomJoinAllowed(roomName, roomPassword);
    const token = await this.meetingsService.createToken(roomName, participantName);

    return {
      token,
      roomName,
      livekitUrl: process.env.LIVEKIT_URL,
    };
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
}
