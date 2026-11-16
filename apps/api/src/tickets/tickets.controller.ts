import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TicketStatus, TicketPriority, ObjectionStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'ثبت تیکت جدید توسط درخواست‌کننده' })
  async createTicket(
    @CurrentUser() user: any,
    @Body()
    body: {
      serviceId: string;
      subject: string;
      description: string;
      priority?: TicketPriority;
    },
  ) {
    return this.ticketsService.createTicket(user, body);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت فهرست تیکت‌ها با فیلتر و صفحه‌بندی' })
  async getTickets(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('serviceId') serviceId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('requesterId') requesterId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.ticketsService.findAll(user, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
      priority,
      serviceId,
      departmentId,
      assignedToId,
      requesterId,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده کامل جزئیات تیکت، گفتگوها و سوابق' })
  async getTicketById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketsService.findOne(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت تیکت' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { status: TicketStatus; note?: string },
  ) {
    return this.ticketsService.updateStatus(id, user, body);
  }

  @Patch(':id/assignment')
  @ApiOperation({ summary: 'تخصیص یا ارجاع تیکت به کارشناس یا واحد دیگر' })
  async assignTicket(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { departmentId?: string; assignedToId: string | null; note?: string },
  ) {
    return this.ticketsService.assignTicket(id, user, body);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'ارسال پیام جدید در تیکت (عمومی یا یادداشت داخلی)' })
  async addMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { content: string; isInternal?: boolean },
  ) {
    return this.ticketsService.addMessage(id, user, body);
  }

  @Post(':id/feedback')
  @ApiOperation({ summary: 'ثبت نظر و امتیاز رضایت‌سنجی برای تیکت حل شده' })
  async addFeedback(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.ticketsService.addFeedback(id, user, body);
  }

  @Post(':id/objections')
  @ApiOperation({ summary: 'ثبت اعتراض نسبت به پاسخ تیکت' })
  async addObjection(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { description: string },
  ) {
    return this.ticketsService.addObjection(id, user, body);
  }

  @Patch(':id/objections/review')
  @ApiOperation({ summary: 'بررسی و پاسخ به اعتراض کاربر توسط مدیر یا کارشناس' })
  async reviewObjection(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { status: ObjectionStatus; resolutionNote: string },
  ) {
    return this.ticketsService.reviewObjection(id, user, body);
  }
}

