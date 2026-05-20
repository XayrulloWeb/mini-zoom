import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GroupsService {
  private readonly db: any;

  constructor(private readonly prisma: PrismaService) {
    this.db = prisma as any;
  }

  async createGroup(creatorId: string, name: string, memberIds: string[]) {
    if (!name.trim()) throw new BadRequestException('Group name is required');

    const allMembers = [...new Set([creatorId, ...memberIds])];

    const group = await this.db.groupChat.create({
      data: {
        name: name.trim(),
        creatorId,
        members: {
          create: allMembers.map((userId: string) => ({ userId })),
        },
      },
      include: {
        members: { select: { userId: true } },
      },
    });

    return { id: group.id, name: group.name, memberCount: group.members.length };
  }

  async getMyGroups(userId: string) {
    const memberships = await this.db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: { select: { userId: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { text: true, senderId: true, createdAt: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m: any) => ({
      id: m.group.id,
      name: m.group.name,
      memberCount: m.group.members.length,
      lastMessage: m.group.messages[0] || null,
    }));
  }

  async getGroupMessages(userId: string, groupId: string, page = 1, limit = 50) {
    const member = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this group');

    const messages = await this.db.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return messages.reverse();
  }

  async sendGroupMessage(userId: string, groupId: string, text: string) {
    const member = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this group');

    return this.db.groupMessage.create({
      data: { groupId, senderId: userId, text: text.trim() },
    });
  }

  async addMember(userId: string, groupId: string, newUserId: string) {
    const group = await this.db.groupChat.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.creatorId !== userId) throw new ForbiddenException('Only creator can add members');

    await this.db.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: newUserId } },
      create: { groupId, userId: newUserId },
      update: {},
    });

    return { message: 'Member added' };
  }

  async leaveGroup(userId: string, groupId: string) {
    await this.db.groupMember.deleteMany({ where: { groupId, userId } });
    return { message: 'Left group' };
  }

  async getGroupInfo(userId: string, groupId: string) {
    const member = await this.db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this group');

    const group = await this.db.groupChat.findUnique({
      where: { id: groupId },
      include: { members: { select: { userId: true } } },
    });

    return group;
  }
}
