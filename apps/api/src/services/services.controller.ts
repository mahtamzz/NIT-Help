import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, TicketPriority } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'فهرست دسته‌بندی‌های خدمات دانشگاه همراه با خدمات تابعه' })
  async getCategories(@Query('includeInactive') includeInactive?: string) {
    return this.servicesService.getCategories(includeInactive !== 'true');
  }

  @Post('categories')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ایجاد دسته‌بندی خدمات جدید (فقط مدیر سیستم)' })
  async createCategory(@Body() body: { name: string; description?: string; icon?: string; displayOrder?: number }) {
    return this.servicesService.createCategory(body);
  }

  @Patch('categories/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش دسته‌بندی خدمات (فقط مدیر سیستم)' })
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; icon?: string; displayOrder?: number; isActive?: boolean },
  ) {
    return this.servicesService.updateCategory(id, body);
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
    return this.servicesService.createService(body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش مشخصات خدمت (فقط مدیر سیستم)' })
  async updateService(
    @Param('id') id: string,
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
    return this.servicesService.updateService(id, body);
  }
}

