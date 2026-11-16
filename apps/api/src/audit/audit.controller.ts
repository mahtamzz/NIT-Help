import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'مشاهده گزارش لاگ‌های امنیتی و سیستمی (فقط مدیر سیستم)' })
  async findAll(@Query('limit') limit?: string) {
    return this.auditService.findAll(limit ? Number(limit) : 50);
  }
}

