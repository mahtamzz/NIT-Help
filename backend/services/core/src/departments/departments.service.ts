import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AuthenticatedUser,
  EVENT_PATTERNS,
  EventBusService,
} from '@nit-help/microservice-common';
import { UserDirectoryService } from '../clients/user-directory.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userDirectory: UserDirectoryService,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll() {
    const departments = await this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            services: true,
            tickets: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const managerMap = await this.userDirectory.resolveUsersByIds(
      departments.map((d) => d.managerId),
    );

    const memberCounts = await Promise.all(
      departments.map(async (d) => {
        const members = await this.userDirectory.getDepartmentMembers(d.id);
        return [d.id, members.length] as const;
      }),
    );
    const membersCountMap = new Map(memberCounts);

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      managerId: d.managerId,
      managerName: d.managerId ? managerMap.get(d.managerId)?.fullName || null : null,
      isActive: d.isActive,
      membersCount: membersCountMap.get(d.id) ?? 0,
      servicesCount: d._count.services,
      openTicketsCount: d._count.tickets,
    }));
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('واحد مورد نظر یافت نشد');
    }

    const [managerMap, members] = await Promise.all([
      this.userDirectory.resolveUsersByIds([department.managerId]),
      this.userDirectory.getDepartmentMembers(department.id),
    ]);

    const manager = department.managerId ? managerMap.get(department.managerId) : null;

    return {
      ...department,
      manager: manager
        ? { id: manager.id, fullName: manager.fullName, email: manager.email }
        : null,
      members,
    };
  }

  async findByIdForRpc(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      select: { id: true, name: true, code: true, managerId: true, isActive: true },
    });
  }

  async create(
    data: { name: string; code: string; description?: string; managerId?: string | null },
    actor?: AuthenticatedUser,
  ) {
    const normalizedCode = data.code.toUpperCase().trim();
    const existing = await this.prisma.department.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictException('کد واحد تکراری است');
    }

    const created = await this.prisma.department.create({
      data: {
        name: data.name.trim(),
        code: normalizedCode,
        description: data.description?.trim(),
        managerId: data.managerId || null,
        isActive: true,
      },
    });

    await this.eventBus.publish(EVENT_PATTERNS.DEPARTMENT_CREATED, {
      id: created.id,
      name: created.name,
      code: created.code,
      managerId: created.managerId,
      isActive: created.isActive,
      actorId: actor?.id,
      actor,
    });

    return created;
  }

  async update(
    id: string,
    data: { name?: string; description?: string; managerId?: string | null; isActive?: boolean },
    actor?: AuthenticatedUser,
  ) {
    await this.findOne(id);

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await this.eventBus.publish(EVENT_PATTERNS.DEPARTMENT_UPDATED, {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      managerId: updated.managerId,
      isActive: updated.isActive,
      actorId: actor?.id,
      actor,
    });

    return updated;
  }
}
