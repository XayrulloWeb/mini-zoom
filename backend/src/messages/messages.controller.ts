import {
  Body,
  Controller,
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
import { MessagesService } from './messages.service.js';
import { SendMessageDto } from './dto/index.js';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getConversations(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.messagesService.getConversationsList(userId);
  }

  @Get('unread')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.messagesService.getUnreadCount(userId);
  }

  @Get(':friendId')
  async getConversation(
    @Param('friendId') friendId: string,
    @Query('page') page?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req!);
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    return this.messagesService.getConversation(userId, friendId, pageNum);
  }

  @Post()
  async sendMessage(@Body() body: SendMessageDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.messagesService.sendMessage(userId, body.receiverId, body.text);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub?.trim();
    if (!userId) throw new UnauthorizedException('Authenticated user is required');
    return userId;
  }
}
