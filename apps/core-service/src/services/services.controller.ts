import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser, Roles } from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import { TicketPriority } from '.prisma/core-client';
import { ServicesService } from './services.service';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'فهرست دسته‌بندی‌های خدمات دانشگاه همراه با خدمات تابعه' })
  async getCategories(@Query('includeInactive') includeInactive?: string) {
    return this.servicesService.getCategories(includeInactive !== 'true');
  }

  @Post('categories')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ایجاد دسته‌بندی خدمات جدید (فقط مدیر سیستم)' })
  async createCategory(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: { name: string; description?: string; icon?: string; displayOrder?: number },
  ) {
    return this.servicesService.createCategory(body, actor);
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش دسته‌بندی خدمات (فقط مدیر سیستم)' })
  async updateCategory(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: { name?: string; description?: string; icon?: string; displayOrder?: number; isActive?: boolean },
  ) {
    return this.servicesService.updateCategory(id, body, actor);
  }

  @Get()
  @ApiOperation({ summary: 'فهرست تمامی خدمات فعال دانشگاه' })
  async getServices(
    @Query('categoryId') categoryId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.servicesService.getServices({
      categoryId,
      departmentId,
      onlyActive: includeInactive !== 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشخصات کامل یک خدمت' })
  async getServiceById(@Param('id') id: string) {
    return this.servicesService.getServiceById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ایجاد خدمت جدید (فقط مدیر سیستم)' })
  async createService(
    @CurrentUser() actor: AuthenticatedUser,
    @Body()
    body: {
      name: string;
      description?: string;
      categoryId: string;
      departmentId: string;
      defaultPriority?: TicketPriority;
      targetResolutionHours?: number;
    },
  ) {
    return this.servicesService.createService(body, actor);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش مشخصات خدمت (فقط مدیر سیستم)' })
  async updateService(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body()
    body: {
      name?: string;
      description?: string;
      categoryId?: string;
      departmentId?: string;
      defaultPriority?: TicketPriority;
      targetResolutionHours?: number;
      isActive?: boolean;
    },
  ) {
    return this.servicesService.updateService(id, body, actor);
  }
}
