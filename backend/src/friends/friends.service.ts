import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    // Check receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true },
    });
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists (in either direction)
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Already friends');
      }
      if (existing.status === FriendshipStatus.PENDING) {
        throw new ConflictException('Friend request already pending');
      }
      // If rejected, allow re-sending by updating
      await this.prisma.friendship.update({
        where: { id: existing.id },
        data: { status: FriendshipStatus.PENDING, senderId, receiverId },
      });
      return { message: 'Friend request sent' };
    }

    await this.prisma.friendship.create({
      data: { senderId, receiverId },
    });

    return { message: 'Friend request sent' };
  }

  async respondToRequest(userId: string, friendshipId: string, action: 'accept' | 'reject') {
    const friendship = await this.prisma.friendship.findFirst({
      where: { id: friendshipId, receiverId: userId, status: FriendshipStatus.PENDING },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    const status = action === 'accept' ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED;
    await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status },
    });

    return { message: action === 'accept' ? 'Friend request accepted' : 'Friend request rejected' };
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    return friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return { friendshipId: f.id, ...friend };
    });
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: { receiverId: userId, status: FriendshipStatus.PENDING },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      friendshipId: r.id,
      from: r.sender,
      createdAt: r.createdAt,
    }));
  }

  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    return { message: 'Friend removed' };
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: query.trim(), mode: 'insensitive' } },
          { email: { contains: query.trim(), mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    return users;
  }
}
