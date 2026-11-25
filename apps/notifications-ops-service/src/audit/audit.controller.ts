import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'مشاهده گزارش لاگ‌های امنیتی و سیستمی (فقط مدیر سیستم)' })
  async findAll(@Query('limit') limit?: string) {
    return this.auditService.findAll(limit ? Number(limit) : 50);
  }
}
