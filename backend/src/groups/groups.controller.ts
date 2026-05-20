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
import { GroupsService } from './groups.service.js';
import { CreateGroupDto, SendGroupMessageDto, AddGroupMemberDto } from './dto/index.js';

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getMyGroups(@Req() req: AuthenticatedRequest) {
    return this.groupsService.getMyGroups(this.getUserId(req));
  }

  @Post()
  async createGroup(@Body() body: CreateGroupDto, @Req() req: AuthenticatedRequest) {
    return this.groupsService.createGroup(this.getUserId(req), body.name, body.memberIds);
  }

  @Get(':id')
  async getGroupInfo(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.groupsService.getGroupInfo(this.getUserId(req), id);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string, @Query('page') page: string, @Req() req: AuthenticatedRequest) {
    return this.groupsService.getGroupMessages(this.getUserId(req), id, parseInt(page || '1', 10));
  }

  @Post(':id/messages')
  async sendMessage(@Param('id') id: string, @Body() body: SendGroupMessageDto, @Req() req: AuthenticatedRequest) {
    return this.groupsService.sendGroupMessage(this.getUserId(req), id, body.text);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() body: AddGroupMemberDto, @Req() req: AuthenticatedRequest) {
    return this.groupsService.addMember(this.getUserId(req), id, body.userId);
  }

  @Delete(':id/leave')
  async leaveGroup(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.groupsService.leaveGroup(this.getUserId(req), id);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub?.trim();
    if (!userId) throw new UnauthorizedException('Authenticated user is required');
    return userId;
  }
}
