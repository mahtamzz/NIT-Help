import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser, Roles } from '@nit-help/microservice-common';
import { UserRole as SharedUserRole } from '@nit-help/shared';
import { UserRole } from '.prisma/iam-client';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(SharedUserRole.ADMIN, SharedUserRole.MANAGER)
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
  @Roles(SharedUserRole.ADMIN, SharedUserRole.MANAGER)
  @ApiOperation({ summary: 'مشخصات کاربر' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(SharedUserRole.ADMIN)
  @ApiOperation({ summary: 'ایجاد کاربر جدید (فقط مدیر سیستم)' })
  async create(
    @CurrentUser() actor: AuthenticatedUser,
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
    return this.usersService.create(body, actor);
  }

  @Patch(':id')
  @Roles(SharedUserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش مشخصات کاربر (فقط مدیر سیستم)' })
  async update(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
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
    return this.usersService.update(id, body, actor);
  }

  @Patch(':id/status')
  @Roles(SharedUserRole.ADMIN)
  @ApiOperation({ summary: 'تغییر وضعیت فعال/غیرفعال کاربر (فقط مدیر سیستم)' })
  async toggleStatus(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.toggleStatus(id, actor);
  }
}
