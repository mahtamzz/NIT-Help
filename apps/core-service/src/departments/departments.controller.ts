import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser, Roles } from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import { DepartmentsService } from './departments.service';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

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
  async create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: { name: string; code: string; description?: string; managerId?: string | null },
  ) {
    return this.departmentsService.create(body, actor);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'ویرایش مشخصات دپارتمان (فقط مدیر سیستم)' })
  async update(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: { name?: string; description?: string; managerId?: string | null; isActive?: boolean },
  ) {
    return this.departmentsService.update(id, body, actor);
  }
}
