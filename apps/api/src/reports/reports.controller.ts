import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'گزارش تحلیلی جامع و آمارهای تیکت‌ها' })
  async getOverview(@CurrentUser() user: any, @Query('departmentId') departmentId?: string) {
    return this.reportsService.getOverview(user, departmentId);
  }

  @Get('specialists')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'گزارش بار کاری و عملکرد کارشناسان' })
  async getSpecialistsWorkload(
    @CurrentUser() user: any,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getSpecialistsWorkload(user, departmentId);
  }
}

