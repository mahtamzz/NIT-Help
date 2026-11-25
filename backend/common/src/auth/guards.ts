import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '@nit-help/shared';
import {
  DEFAULT_GATEWAY_SECRET,
  DEFAULT_JWT_ACCESS_SECRET,
  GATEWAY_HEADERS,
} from '../constants';
import { AuthenticatedUser, decodeUserContext } from '../contracts';
import { IS_PUBLIC_KEY, ROLES_KEY } from './decorators';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 1. Trust Nginx API Gateway auth_request context when gateway secret matches
    const gatewaySecretHeader = this.readHeader(request.headers, GATEWAY_HEADERS.GATEWAY_SECRET);
    const expectedGatewaySecret =
      process.env.GATEWAY_INTERNAL_SECRET || DEFAULT_GATEWAY_SECRET;
    const encodedContext = this.readHeader(request.headers, GATEWAY_HEADERS.USER_CONTEXT);

    if (gatewaySecretHeader && gatewaySecretHeader === expectedGatewaySecret && encodedContext) {
      const user = decodeUserContext(encodedContext);
      if (user) {
        request.user = user;
        return true;
      }
    }

    // 2. Fallback: verify Bearer JWT directly (enables direct service testing without Nginx)
    const authHeader = this.readHeader(request.headers, 'authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || DEFAULT_JWT_ACCESS_SECRET,
        ) as Record<string, any>;

        const user: AuthenticatedUser = {
          id: payload.sub,
          email: payload.email,
          username: payload.username,
          fullName: payload.fullName || payload.username,
          role: payload.role as UserRole,
          departmentId: payload.departmentId ?? null,
          departmentName: payload.departmentName ?? null,
        };
        if (user.id && user.role) {
          request.user = user;
          return true;
        }
      } catch {
        throw new UnauthorizedException('لطفاً جهت دسترسی به این بخش وارد سامانه شوید');
      }
    }

    throw new UnauthorizedException('لطفاً جهت دسترسی به این بخش وارد سامانه شوید');
  }

  private readHeader(
    headers: Record<string, string | string[] | undefined>,
    key: string,
  ): string | undefined {
    const value = headers?.[key];
    return Array.isArray(value) ? value[0] : value;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('شما دسترسی لازم برای این عملیات را ندارید');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('سطح دسترسی شما برای این عملیات مجاز نمی‌باشد');
    }

    return true;
  }
}
