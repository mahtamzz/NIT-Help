import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import {
  AuthenticatedUser,
  CORE_PATTERNS,
  DEFAULT_JWT_ACCESS_SECRET,
  DEFAULT_JWT_REFRESH_SECRET,
  EVENT_PATTERNS,
  EventBusService,
} from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Response } from 'express';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBusService,
    @Optional() @Inject('CORE_CLIENT') private readonly coreClient?: ClientProxy,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async resolveDepartmentName(departmentId?: string | null): Promise<string | null> {
    if (!departmentId) {
      return null;
    }

    const replica = await this.prisma.departmentReplica.findUnique({
      where: { id: departmentId },
    });
    if (replica) {
      return replica.name;
    }

    if (!this.coreClient) {
      return null;
    }

    const dept = await firstValueFrom(
      this.coreClient.send(CORE_PATTERNS.GET_DEPARTMENT_BY_ID, { id: departmentId }).pipe(
        timeout(1500),
        catchError(() => of(null)),
      ),
    );
    if (dept?.id && dept?.name) {
      await this.prisma.departmentReplica
        .upsert({
          where: { id: dept.id },
          update: { name: dept.name, code: dept.code || '', isActive: dept.isActive ?? true },
          create: { id: dept.id, name: dept.name, code: dept.code || '', isActive: dept.isActive ?? true },
        })
        .catch(() => undefined);
      return dept.name;
    }

    return null;
  }

  async validateUser(usernameOrEmail: string, pass: string) {
    const normalized = usernameOrEmail.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalized.toLowerCase() },
          { username: normalized },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید',
      );
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است');
    }

    return user;
  }

  async login(user: any, res: Response) {
    const departmentName = await this.resolveDepartmentName(user.departmentId);

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId || null,
      departmentName,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || DEFAULT_JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await this.eventBus.publish(EVENT_PATTERNS.AUTH_LOGGED_IN, {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        departmentId: user.departmentId,
        departmentName,
      },
    };
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('توکن بازنشانی یافت نشد');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET,
      });

      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (storedToken) {
        if (storedToken.revokedAt || storedToken.expiresAt < new Date()) {
          throw new UnauthorizedException('توکن بازنشانی نامعتبر یا منقضی شده است');
        }
        await this.prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('حساب کاربری نامعتبر یا غیرفعال است');
      }

      return this.login(user, res);
    } catch {
      throw new UnauthorizedException('توکن بازنشانی نامعتبر یا منقضی شده است');
    }
  }

  async logout(refreshToken: string | undefined, res: Response) {
    if (refreshToken) {
      await this.prisma.refreshToken
        .updateMany({
          where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
          data: { revokedAt: new Date() },
        })
        .catch(() => undefined);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/api/auth',
    });

    return { success: true, message: 'با موفقیت از سامانه خارج شدید' };
  }

  async verifyAccessToken(authHeader?: string): Promise<AuthenticatedUser> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('لطفاً جهت دسترسی به این بخش وارد سامانه شوید');
    }

    const token = authHeader.slice(7).trim();
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || DEFAULT_JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('لطفاً جهت دسترسی به این بخش وارد سامانه شوید');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری یافت نشد یا غیرفعال است');
    }

    const departmentName = await this.resolveDepartmentName(user.departmentId);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role as UserRole,
      departmentId: user.departmentId ?? null,
      departmentName,
    };
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری یافت نشد یا غیرفعال است');
    }
    const departmentName = await this.resolveDepartmentName(user.departmentId);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role as UserRole,
      departmentId: user.departmentId ?? null,
      departmentName,
    };
  }
}
