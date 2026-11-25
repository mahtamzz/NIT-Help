import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '@nit-help/microservice-common';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست اعلان‌های کاربر جاری' })
  async getUserNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    const [list, unreadCount] = await Promise.all([
      this.notificationsService.getUserNotifications(
        user.id,
        limit ? Number(limit) : 20,
      ),
      this.notificationsService.getUnreadCount(user.id),
    ]);
    return { data: list, unreadCount };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'تعداد اعلان‌های خوانده‌نشده' })
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'علامت‌گذاری یک اعلان به عنوان خوانده‌شده' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'علامت‌گذاری همه اعلان‌ها به عنوان خوانده‌شده' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
