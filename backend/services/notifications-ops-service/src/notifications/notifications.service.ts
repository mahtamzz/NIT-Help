import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '.prisma/ops-client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string, limit = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    ticketId?: string | null;
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

    this.dispatchEmailNotification(data);
    return notif;
  }

  private dispatchEmailNotification(data: {
    recipientId: string;
    title: string;
    message: string;
  }) {
    this.logger.log(
      `[Email Dispatcher] Notified User ${data.recipientId}: "${data.title}" - ${data.message}`,
    );
  }
}
