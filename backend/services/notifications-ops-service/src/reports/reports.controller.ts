import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser, Roles } from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'گزارش تحلیلی جامع و آمارهای تیکت‌ها' })
  async getOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getOverview(user, departmentId);
  }

  @Get('specialists')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'گزارش بار کاری و عملکرد کارشناسان' })
  async getSpecialistsWorkload(
    @CurrentUser() user: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getSpecialistsWorkload(user, departmentId);
  }
}
