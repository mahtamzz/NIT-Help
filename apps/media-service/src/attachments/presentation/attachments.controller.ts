import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '@nit-help/microservice-common';
import { Response } from 'express';
import { DownloadAttachmentUseCase } from '../application/use-cases/download-attachment.use-case';
import { UploadAttachmentUseCase } from '../application/use-cases/upload-attachment.use-case';
import { AttachmentDomainExceptionFilter } from './attachment-domain-exception.filter';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseFilters(AttachmentDomainExceptionFilter)
@Controller('attachments')
export class AttachmentsController {
  constructor(
    private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
    private readonly downloadAttachmentUseCase: DownloadAttachmentUseCase,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'بارگذاری فایل پیوست برای تیکت یا پیام' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('ticketId') ticketId: string,
    @Body('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.uploadAttachmentUseCase.execute(file, user, ticketId, messageId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'دانلود فایل پیوست با اعتبارسنجی سطح دسترسی' })
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { target, originalName, mimeType } =
      await this.downloadAttachmentUseCase.execute(id, user);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`,
    );

    if (target.kind === 'file') {
      res.sendFile(target.filePath);
    } else {
      res.send(target.buffer);
    }
  }
}
