import { Injectable } from '@nestjs/common';
import { UserRole } from '.prisma/ops-client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(data: {
    actorId: string;
    actorName: string;
    actorEmail: string;
    actorRole: UserRole;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        actorName: data.actorName,
        actorEmail: data.actorEmail,
        actorRole: data.actorRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  async findAll(limit = 50) {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((l) => ({
      id: l.id,
      actorId: l.actorId,
      actorName: l.actorName,
      actorEmail: l.actorEmail,
      actorRole: l.actorRole,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}
