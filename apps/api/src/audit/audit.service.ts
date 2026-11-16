import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(data: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
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
      include: {
        actor: {
          select: { id: true, fullName: true, role: true, email: true },
        },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      actorId: l.actorId,
      actorName: l.actor.fullName,
      actorEmail: l.actor.email,
      actorRole: l.actor.role,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}

