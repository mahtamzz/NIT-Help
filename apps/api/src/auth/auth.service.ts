import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(usernameOrEmail: string, pass: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: usernameOrEmail.toLowerCase().trim() },
          { username: usernameOrEmail.trim() },
        ],
      },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است');
    }

    return user;
  }

  async login(user: any, res: Response) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'nit_help_jwt_access_super_secret_key_2026_secure!',
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'nit_help_jwt_refresh_super_secret_key_2026_secure!',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Set secure HTTP-only cookie for refresh token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        departmentName: user.department?.name || null,
        createdAt: user.createdAt,
      },
    };
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('توکن بازنشانی یافت نشد');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'nit_help_jwt_refresh_super_secret_key_2026_secure!',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { department: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('حساب کاربری نامعتبر یا غیرفعال است');
      }

      return this.login(user, res);
    } catch (e) {
      throw new UnauthorizedException('توکن بازنشانی نامعتبر یا منقضی شده است');
    }
  }

  async logout(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/api/auth',
    });
    return { success: true, message: 'با موفقیت از سامانه خارج شدید' };
  }
}

