import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: {
            members: true,
            services: true,
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      managerId: d.managerId,
      managerName: d.manager?.fullName || null,
      isActive: d.isActive,
      membersCount: d._count.members,
      servicesCount: d._count.services,
      openTicketsCount: d._count.tickets,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          where: { isActive: true },
          select: { id: true, fullName: true, email: true, role: true },
        },
        services: {
          where: { isActive: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('واحد مورد نظر یافت نشد');
    }

    return department;
  }

  async create(data: { name: string; code: string; description?: string; managerId?: string | null }) {
    const existing = await this.prisma.department.findUnique({
      where: { code: data.code.toUpperCase().trim() },
    });

    if (existing) {
      throw new ConflictException('کد واحد تکراری است');
    }

    return this.prisma.department.create({
      data: {
        name: data.name.trim(),
        code: data.code.toUpperCase().trim(),
        description: data.description?.trim(),
        managerId: data.managerId || null,
        isActive: true,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string; managerId?: string | null; isActive?: boolean }) {
    await this.findOne(id);

    return this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }
}

