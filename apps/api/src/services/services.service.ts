import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketPriority } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getCategories(onlyActive = true) {
    return this.prisma.serviceCategory.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      include: {
        services: {
          where: onlyActive ? { isActive: true } : undefined,
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getServices(params?: { categoryId?: string; departmentId?: string; onlyActive?: boolean }) {
    const where: any = {};
    if (params?.onlyActive !== false) {
      where.isActive = true;
    }
    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }
    if (params?.departmentId) {
      where.departmentId = params.departmentId;
    }

    const services = await this.prisma.service.findMany({
      where,
      include: {
        category: true,
        department: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      categoryId: s.categoryId,
      categoryName: s.category?.name,
      departmentId: s.departmentId,
      departmentName: s.department?.name,
      defaultPriority: s.defaultPriority,
      targetResolutionHours: s.targetResolutionHours,
      isActive: s.isActive,
    }));
  }

  async getServiceById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
      },
    });

    if (!service) {
      throw new NotFoundException('خدمت مورد نظر یافت نشد');
    }

    return service;
  }

  async createCategory(data: { name: string; description?: string; icon?: string; displayOrder?: number }) {
    return this.prisma.serviceCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        icon: data.icon || 'Folder',
        displayOrder: data.displayOrder ?? 0,
        isActive: true,
      },
    });
  }

  async updateCategory(id: string, data: { name?: string; description?: string; icon?: string; displayOrder?: number; isActive?: boolean }) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async createService(data: {
    name: string;
    description?: string;
    categoryId: string;
    departmentId: string;
    defaultPriority?: TicketPriority;
    targetResolutionHours?: number;
  }) {
    return this.prisma.service.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        categoryId: data.categoryId,
        departmentId: data.departmentId,
        defaultPriority: data.defaultPriority || TicketPriority.NORMAL,
        targetResolutionHours: data.targetResolutionHours || 48,
        isActive: true,
      },
    });
  }

  async updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      categoryId?: string;
      departmentId?: string;
      defaultPriority?: TicketPriority;
      targetResolutionHours?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }
}

