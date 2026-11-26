import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  DEFAULT_GATEWAY_SECRET,
  DEFAULT_JWT_ACCESS_SECRET,
  encodeUserContext,
  GATEWAY_HEADERS,
  GatewayAuthGuard,
  RolesGuard,
} from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import * as jwt from 'jsonwebtoken';

function createMockContext(headers: Record<string, string>, user?: any) {
  const req: any = { headers, user };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any;
}

describe('GatewayAuthGuard & RolesGuard', () => {
  const reflector = new Reflector();
  const authGuard = new GatewayAuthGuard(reflector);
  const rolesGuard = new RolesGuard(reflector);

  it('authenticates request from Nginx auth_request when gateway secret matches', () => {
    const contextUser = {
      id: 'u-1',
      email: 'student@nit.ac.ir',
      username: 'student',
      fullName: 'علی اکبری',
      role: UserRole.STUDENT,
      departmentId: null,
    };

    const ctx = createMockContext({
      [GATEWAY_HEADERS.USER_CONTEXT]: encodeUserContext(contextUser),
      [GATEWAY_HEADERS.GATEWAY_SECRET]: DEFAULT_GATEWAY_SECRET,
    });

    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(ctx.switchToHttp().getRequest().user).toMatchObject({
      id: 'u-1',
      fullName: 'علی اکبری',
      role: UserRole.STUDENT,
    });
  });

  it('rejects spoofed x-user-context when gateway secret does not match', () => {
    const spoofedUser = {
      id: 'u-admin',
      email: 'admin@nit.ac.ir',
      username: 'admin',
      fullName: 'Admin',
      role: UserRole.ADMIN,
      departmentId: null,
    };

    const ctx = createMockContext({
      [GATEWAY_HEADERS.USER_CONTEXT]: encodeUserContext(spoofedUser),
      [GATEWAY_HEADERS.GATEWAY_SECRET]: 'wrong-secret',
    });

    expect(() => authGuard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('falls back to Bearer JWT verification when called directly', () => {
    const token = jwt.sign(
      {
        sub: 'u-2',
        email: 'spec@nit.ac.ir',
        username: 'it_spec',
        fullName: 'کارشناس',
        role: UserRole.SPECIALIST,
        departmentId: 'dept-1',
      },
      DEFAULT_JWT_ACCESS_SECRET,
    );

    const ctx = createMockContext({
      authorization: `Bearer ${token}`,
    });

    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(ctx.switchToHttp().getRequest().user.role).toBe(UserRole.SPECIALIST);
  });

  it('enforces @Roles metadata via RolesGuard', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const studentCtx = createMockContext({}, { id: 'u-1', role: UserRole.STUDENT });
    expect(() => rolesGuard.canActivate(studentCtx)).toThrow(ForbiddenException);

    const adminCtx = createMockContext({}, { id: 'u-2', role: UserRole.ADMIN });
    expect(rolesGuard.canActivate(adminCtx)).toBe(true);
  });
});
