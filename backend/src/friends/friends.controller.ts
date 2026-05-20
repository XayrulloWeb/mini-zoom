import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { FriendsService } from './friends.service.js';
import { AddFriendDto, RespondFriendDto } from './dto/index.js';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.friendsService.getFriends(userId);
  }

  @Get('requests')
  async getPendingRequests(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.friendsService.getPendingRequests(userId);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.friendsService.searchUsers(query, userId);
  }

  @Post('add')
  async addFriend(@Body() body: AddFriendDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.friendsService.sendFriendRequest(userId, body.friendId);
  }

  @Post(':id/respond')
  async respondToRequest(
    @Param('id') id: string,
    @Body() body: RespondFriendDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.friendsService.respondToRequest(userId, id, body.action);
  }

  @Delete(':id')
  async removeFriend(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.friendsService.removeFriend(userId, id);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub?.trim();
    if (!userId) throw new UnauthorizedException('Authenticated user is required');
    return userId;
  }
}
