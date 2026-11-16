import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        departmentId: u.departmentId,
        departmentName: u.department?.name || null,
        createdAt: u.createdAt.toISOString(),
      })),
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
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId,
      departmentName: u.department?.name || null,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async create(data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    departmentId?: string | null;
  }) {
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
      include: {
        department: true,
      },
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
      createdAt: user.createdAt.toISOString(),
    };
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
      include: {
        department: true,
      },
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      username: updated.username,
      role: updated.role,
      isActive: updated.isActive,
      departmentId: updated.departmentId,
      departmentName: updated.department?.name || null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async toggleStatus(id: string) {
    const user = await this.findOne(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
    return { id: updated.id, isActive: updated.isActive };
  }
}

