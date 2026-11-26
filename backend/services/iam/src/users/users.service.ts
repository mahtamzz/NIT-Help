import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuthenticatedUser,
  EVENT_PATTERNS,
  EventBusService,
} from '@nit-help/microservice-common';
import { UserRole as SharedUserRole } from '@nit-help/shared';
import * as bcrypt from 'bcrypt';
import { UserRole } from '.prisma/iam-client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  private async getDepartmentNameMap(departmentIds: Array<string | null | undefined>) {
    const ids = Array.from(new Set(departmentIds.filter((id): id is string => Boolean(id))));
    if (ids.length === 0) {
      return new Map<string, string>();
    }
    const depts = await this.prisma.departmentReplica.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(depts.map((d) => [d.id, d.name]));
  }

  private formatUser(user: any, deptMap: Map<string, string>) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role as SharedUserRole,
      isActive: user.isActive,
      departmentId: user.departmentId ?? null,
      departmentName: user.departmentId ? deptMap.get(user.departmentId) || null : null,
    };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    departmentId?: string;
    isActive?: boolean;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
      }),
    ]);

    const deptMap = await this.getDepartmentNameMap(users.map((u) => u.departmentId));

    return {
      data: users.map((u) => this.formatUser(u, deptMap)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSpecialists(departmentId?: string) {
    const where: any = {
      isActive: true,
      role: { in: [UserRole.SPECIALIST, UserRole.MANAGER] },
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        departmentId: true,
      },
      orderBy: { fullName: 'asc' },
    });

    const deptMap = await this.getDepartmentNameMap(users.map((u) => u.departmentId));

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId,
      departmentName: u.departmentId ? deptMap.get(u.departmentId) || null : null,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد');
    }
    const deptMap = await this.getDepartmentNameMap([user.departmentId]);
    return this.formatUser(user, deptMap);
  }

  async create(
    data: {
      fullName: string;
      email: string;
      username: string;
      password: string;
      role: UserRole;
      departmentId?: string | null;
    },
    actor?: AuthenticatedUser,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase().trim() },
          { username: data.username.trim() },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('ایمیل یا نام کاربری تکراری است');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        username: data.username.trim(),
        passwordHash,
        role: data.role,
        departmentId: data.departmentId || null,
        isActive: true,
      },
    });

    const deptMap = await this.getDepartmentNameMap([user.departmentId]);
    const formatted = this.formatUser(user, deptMap);

    await this.eventBus.publish(EVENT_PATTERNS.USER_CREATED, {
      ...formatted,
      actorId: actor?.id,
      actor,
    });

    return formatted;
  }

  async update(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      role?: UserRole;
      departmentId?: string | null;
      isActive?: boolean;
      password?: string;
    },
    actor?: AuthenticatedUser,
  ) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName.trim();
    if (data.email) updateData.email = data.email.toLowerCase().trim();
    if (data.role) updateData.role = data.role;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const deptMap = await this.getDepartmentNameMap([updated.departmentId]);
    const formatted = this.formatUser(updated, deptMap);

    await this.eventBus.publish(EVENT_PATTERNS.USER_UPDATED, {
      ...formatted,
      actorId: actor?.id,
      actor,
    });

    return formatted;
  }

  async toggleStatus(id: string, actor?: AuthenticatedUser) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    const deptMap = await this.getDepartmentNameMap([updated.departmentId]);
    const formatted = this.formatUser(updated, deptMap);

    await this.eventBus.publish(EVENT_PATTERNS.USER_STATUS_CHANGED, {
      ...formatted,
      actorId: actor?.id,
      actor,
    });

    return { id: updated.id, isActive: updated.isActive };
  }

  // Internal RPC Helpers
  async findByIdForRpc(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    const deptMap = await this.getDepartmentNameMap([user.departmentId]);
    return this.formatUser(user, deptMap);
  }

  async findByIdsForRpc(ids: string[]) {
    const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)));
    if (uniqueIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
    });
    const deptMap = await this.getDepartmentNameMap(users.map((u) => u.departmentId));
    return users.map((u) => this.formatUser(u, deptMap));
  }

  async findUsersByDepartmentForRpc(departmentId: string) {
    const users = await this.prisma.user.findMany({
      where: { departmentId, isActive: true },
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
    });
    return users;
  }

  async exportAllForRpc() {
    const users = await this.prisma.user.findMany({
      orderBy: { fullName: 'asc' },
    });
    const deptMap = await this.getDepartmentNameMap(users.map((u) => u.departmentId));
    return users.map((u) => this.formatUser(u, deptMap));
  }
}
