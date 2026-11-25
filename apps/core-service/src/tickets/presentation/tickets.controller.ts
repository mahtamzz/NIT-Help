import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '@nit-help/microservice-common';
import {
  ObjectionStatus,
  TicketPriority,
  TicketStatus,
} from '@nit-help/shared';
import { AddTicketMessageUseCase } from '../application/use-cases/add-ticket-message.use-case';
import { AssignTicketUseCase } from '../application/use-cases/assign-ticket.use-case';
import { CreateTicketUseCase } from '../application/use-cases/create-ticket.use-case';
import { GetTicketDetailUseCase } from '../application/use-cases/get-ticket-detail.use-case';
import { ListTicketsUseCase } from '../application/use-cases/list-tickets.use-case';
import { ManageTicketObjectionUseCase } from '../application/use-cases/manage-ticket-objection.use-case';
import { SubmitTicketFeedbackUseCase } from '../application/use-cases/submit-ticket-feedback.use-case';
import { UpdateTicketStatusUseCase } from '../application/use-cases/update-ticket-status.use-case';
import { TicketDomainExceptionFilter } from './ticket-domain-exception.filter';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseFilters(TicketDomainExceptionFilter)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly listTicketsUseCase: ListTicketsUseCase,
    private readonly getTicketDetailUseCase: GetTicketDetailUseCase,
    private readonly updateTicketStatusUseCase: UpdateTicketStatusUseCase,
    private readonly assignTicketUseCase: AssignTicketUseCase,
    private readonly addTicketMessageUseCase: AddTicketMessageUseCase,
    private readonly submitTicketFeedbackUseCase: SubmitTicketFeedbackUseCase,
    private readonly manageTicketObjectionUseCase: ManageTicketObjectionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'ثبت تیکت جدید توسط درخواست‌کننده' })
  async createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      serviceId: string;
      subject: string;
      description: string;
      priority?: TicketPriority;
    },
  ) {
    return this.createTicketUseCase.execute(user, body);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت فهرست تیکت‌ها با فیلتر و صفحه‌بندی' })
  async getTickets(
    @CurrentUser() user: AuthenticatedUser,
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
    return this.listTicketsUseCase.execute(user, {
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
  async getTicketById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getTicketDetailUseCase.execute(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت تیکت' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { status: TicketStatus; note?: string },
  ) {
    return this.updateTicketStatusUseCase.execute(id, user, body);
  }

  @Patch(':id/assignment')
  @ApiOperation({ summary: 'تخصیص یا ارجاع تیکت به کارشناس یا واحد دیگر' })
  async assignTicket(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { departmentId?: string; assignedToId: string | null; note?: string },
  ) {
    return this.assignTicketUseCase.execute(id, user, body);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'ارسال پیام جدید در تیکت (عمومی یا یادداشت داخلی)' })
  async addMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { content: string; isInternal?: boolean },
  ) {
    return this.addTicketMessageUseCase.execute(id, user, body);
  }

  @Post(':id/feedback')
  @ApiOperation({ summary: 'ثبت نظر و امتیاز رضایت‌سنجی برای تیکت حل شده' })
  async addFeedback(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.submitTicketFeedbackUseCase.execute(id, user, body);
  }

  @Post(':id/objections')
  @ApiOperation({ summary: 'ثبت اعتراض نسبت به پاسخ تیکت' })
  async addObjection(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { description: string },
  ) {
    return this.manageTicketObjectionUseCase.submit(id, user, body);
  }

  @Patch(':id/objections/review')
  @ApiOperation({ summary: 'بررسی و پاسخ به اعتراض کاربر توسط مدیر یا کارشناس' })
  async reviewObjection(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { status: ObjectionStatus; resolutionNote: string },
  ) {
    return this.manageTicketObjectionUseCase.review(id, user, body);
  }
}
