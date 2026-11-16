import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'فهرست کاربران سامانه با فیلتر و صفحه‌بندی' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('departmentId') departmentId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      role,
      departmentId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('specialists')
  @ApiOperation({ summary: 'فهرست کارشناسان فعال جهت تخصیص تیکت' })
  async findSpecialists(@Query('departmentId') departmentId?: string) {
    return this.usersService.findSpecialists(departmentId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'مشخصات کاربر' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ایجاد کاربر جدید (فقط مدیر سیستم)' })
  async create(
    @Body()
    body: {
      fullName: string;
      email: string;
      username: string;
      password: string;
      role: UserRole;
      departmentId?: string | null;
    },
  ) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش مشخصات کاربر (فقط مدیر سیستم)' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      email?: string;
      role?: UserRole;
      departmentId?: string | null;
      isActive?: boolean;
      password?: string;
    },
  ) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'تغییر وضعیت فعال/غیرفعال کاربر (فقط مدیر سیستم)' })
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }
}

