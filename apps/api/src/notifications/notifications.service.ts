import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: string, limit = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        recipient: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return notifications.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      ticketId: n.ticketId,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createNotification(data: {
    recipientId: string;
    ticketId?: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    const notif = await this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        ticketId: data.ticketId || null,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
      },
    });

    // Check optional email dispatch
    this.dispatchEmailNotification(data);

    return notif;
  }

  private async dispatchEmailNotification(data: {
    recipientId: string;
    title: string;
    message: string;
  }) {
    // If SMTP is not configured, we log the email event cleanly
    this.logger.log(
      `[Email Dispatcher] Notified User ${data.recipientId}: "${data.title}" - ${data.message}`,
    );
  }
}

