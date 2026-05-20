import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(senderId: string, receiverId: string, text: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Verify they are friends
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (!friendship) {
      throw new ForbiddenException('You can only message friends');
    }

    const message = await this.prisma.directMessage.create({
      data: { senderId, receiverId, text: text.trim() },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    return message;
  }

  async getConversation(userId: string, friendId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    // Mark unread messages as read
    await this.prisma.directMessage.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    return messages.reverse(); // Return in chronological order
  }

  async getConversationsList(userId: string) {
    // Get all friends
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

    const conversations = await Promise.all(
      friendships.map(async (f) => {
        const friend = f.senderId === userId ? f.receiver : f.sender;

        // Get last message
        const lastMessage = await this.prisma.directMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: friend.id },
              { senderId: friend.id, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: { text: true, createdAt: true, senderId: true },
        });

        // Count unread
        const unreadCount = await this.prisma.directMessage.count({
          where: {
            senderId: friend.id,
            receiverId: userId,
            read: false,
          },
        });

        return {
          friend,
          lastMessage,
          unreadCount,
        };
      }),
    );

    // Sort by last message time (most recent first)
    return conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt?.getTime() || 0;
      const timeB = b.lastMessage?.createdAt?.getTime() || 0;
      return timeB - timeA;
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.directMessage.count({
      where: { receiverId: userId, read: false },
    });
    return { unreadCount: count };
  }
}
