import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  private uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async createAttachment(
    file: Express.Multer.File,
    uploadedById: string,
    ticketId: string,
    messageId?: string,
  ) {
    const ext = path.extname(file.originalname).toLowerCase();
    const storageKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const targetPath = path.join(this.uploadDir, storageKey);

    fs.writeFileSync(targetPath, file.buffer);

    return this.prisma.ticketAttachment.create({
      data: {
        ticketId,
        messageId: messageId || null,
        uploadedById,
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'), // fix Persian filename encoding if needed
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  }

  async getAttachmentFile(attachmentId: string, user: any) {
    const attachment = await this.prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        ticket: true,
        message: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('فایل پیوست یافت نشد');
    }

    // Authorization check
    if (user.role === UserRole.STUDENT || user.role === UserRole.FACULTY) {
      if (attachment.ticket.requesterId !== user.id) {
        throw new ForbiddenException('شما دسترسی به این فایل ندارید');
      }
      // If message is internal, requester cannot download
      if (attachment.message?.isInternal) {
        throw new ForbiddenException('شما دسترسی به این فایل ندارید');
      }
    } else if (user.role === UserRole.SPECIALIST) {
      if (
        attachment.ticket.assignedToId !== user.id &&
        attachment.ticket.departmentId !== user.departmentId
      ) {
        throw new ForbiddenException('شما دسترسی به فایل‌های این دپارتمان ندارید');
      }
    } else if (user.role === UserRole.MANAGER) {
      if (attachment.ticket.departmentId !== user.departmentId) {
        throw new ForbiddenException('شما دسترسی به فایل‌های این دپارتمان ندارید');
      }
    }

    const filePath = path.join(this.uploadDir, attachment.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('فایل فیزیکی روی سرور یافت نشد');
    }

    return {
      filePath,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }
}

