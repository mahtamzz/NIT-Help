import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AttachmentRepositoryPort } from '../../application/ports/attachment-repository.port';
import { AttachmentEntity } from '../../domain/attachment.types';

@Injectable()
export class PrismaAttachmentRepository implements AttachmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    ticketId: string;
    messageId: string | null;
    uploadedById: string;
    originalName: string;
    storageKey: string;
    mimeType: string;
    size: number;
  }): Promise<AttachmentEntity> {
    return this.prisma.ticketAttachment.create({ data: input });
  }

  findById(id: string): Promise<AttachmentEntity | null> {
    return this.prisma.ticketAttachment.findUnique({ where: { id } });
  }

  findByTicketId(ticketId: string): Promise<AttachmentEntity[]> {
    return this.prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { originalName: 'asc' },
    });
  }

  async countByTicketIds(ticketIds: string[]): Promise<Record<string, number>> {
    const grouped = await this.prisma.ticketAttachment.groupBy({
      by: ['ticketId'],
      where: { ticketId: { in: ticketIds } },
      _count: { _all: true },
    });

    const result: Record<string, number> = {};
    for (const row of grouped) {
      result[row.ticketId] = row._count._all;
    }
    return result;
  }
}
