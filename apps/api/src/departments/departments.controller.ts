import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست تمامی دپارتمان‌ها و واحدهای دانشگاه' })
  async findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشخصات کامل یک دپارتمان' })
  async findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ایجاد دپارتمان جدید (فقط مدیر سیستم)' })
  async create(@Body() body: { name: string; code: string; description?: string; managerId?: string | null }) {
    return this.departmentsService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش مشخصات دپارتمان (فقط مدیر سیستم)' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; managerId?: string | null; isActive?: boolean },
  ) {
    return this.departmentsService.update(id, body);
  }
}

