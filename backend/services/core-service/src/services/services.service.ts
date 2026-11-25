import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AuthenticatedUser,
  EVENT_PATTERNS,
  EventBusService,
} from '@nit-help/microservice-common';
import { TicketPriority } from '.prisma/core-client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

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

  async getServices(params?: {
    categoryId?: string;
    departmentId?: string;
    onlyActive?: boolean;
  }) {
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

  async createCategory(
    data: { name: string; description?: string; icon?: string; displayOrder?: number },
    actor?: AuthenticatedUser,
  ) {
    const created = await this.prisma.serviceCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        icon: data.icon || 'Folder',
        displayOrder: data.displayOrder ?? 0,
        isActive: true,
      },
    });

    await this.eventBus.publish(EVENT_PATTERNS.SERVICE_CATEGORY_CREATED, {
      category: created,
      actor,
    });

    return created;
  }

  async updateCategory(
    id: string,
    data: { name?: string; description?: string; icon?: string; displayOrder?: number; isActive?: boolean },
    actor?: AuthenticatedUser,
  ) {
    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data,
    });

    await this.eventBus.publish(EVENT_PATTERNS.SERVICE_CATEGORY_UPDATED, {
      category: updated,
      actor,
    });

    return updated;
  }

  async createService(
    data: {
      name: string;
      description?: string;
      categoryId: string;
      departmentId: string;
      defaultPriority?: TicketPriority;
      targetResolutionHours?: number;
    },
    actor?: AuthenticatedUser,
  ) {
    const created = await this.prisma.service.create({
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

    await this.eventBus.publish(EVENT_PATTERNS.SERVICE_CREATED, {
      service: created,
      actor,
    });

    return created;
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
    actor?: AuthenticatedUser,
  ) {
    const updated = await this.prisma.service.update({
      where: { id },
      data,
    });

    await this.eventBus.publish(EVENT_PATTERNS.SERVICE_UPDATED, {
      service: updated,
      actor,
    });

    return updated;
  }
}
