import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_PATTERNS, EventBusService } from '@nit-help/microservice-common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../node_modules/.prisma/iam-client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService (IAM Microservice)', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    departmentReplica: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects inactive accounts during validateUser', async () => {
    const hash = await bcrypt.hash('Secret@123', 4);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'u-1',
      email: 'student@nit.ac.ir',
      username: 'student',
      passwordHash: hash,
      isActive: false,
      role: UserRole.STUDENT,
    });

    await expect(service.validateUser('student', 'Secret@123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('issues tokens, stores rotated refresh token hash, and publishes auth.logged_in event', async () => {
    mockPrisma.departmentReplica.findUnique.mockResolvedValue({
      id: 'dept-1',
      name: 'IT',
    });
    mockJwtService.sign
      .mockReturnValueOnce('access-token-123')
      .mockReturnValueOnce('refresh-token-456');

    const mockRes: any = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const user = {
      id: 'u-1',
      email: 'student@nit.ac.ir',
      username: 'student',
      fullName: 'علی اکبری',
      role: UserRole.STUDENT,
      departmentId: 'dept-1',
      createdAt: new Date(),
    };

    const result = await service.login(user, mockRes);

    expect(result.accessToken).toBe('access-token-123');
    expect(result.user.departmentName).toBe('IT');
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token-456',
      expect.objectContaining({ httpOnly: true, path: '/api/auth' }),
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      EVENT_PATTERNS.AUTH_LOGGED_IN,
      expect.objectContaining({ userId: 'u-1' }),
    );
  });

  it('rejects reused revoked refresh tokens', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'u-1' });
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    const mockRes: any = { cookie: jest.fn() };
    await expect(service.refresh('old-refresh-token', mockRes)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('verifies access token for Nginx auth_request and rejects deactivated users', async () => {
    mockJwtService.verify.mockReturnValue({ sub: 'u-1' });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'student@nit.ac.ir',
      username: 'student',
      fullName: 'علی اکبری',
      role: UserRole.STUDENT,
      departmentId: null,
      isActive: true,
    });

    const verified = await service.verifyAccessToken('Bearer access-token-123');
    expect(verified.id).toBe('u-1');
    expect(verified.role).toBe(UserRole.STUDENT);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      isActive: false,
    });
    await expect(service.verifyAccessToken('Bearer access-token-123')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
