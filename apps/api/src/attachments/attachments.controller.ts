import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'بارگذاری فایل پیوست برای تیکت یا پیام' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('ticketId') ticketId: string,
    @Body('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    if (!ticketId) {
      throw new BadRequestException('شناسه تیکت الزامی است');
    }
    return this.attachmentsService.createAttachment(file, user.id, ticketId, messageId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'دانلود فایل پیوست با اعتبارسنجی سطح دسترسی' })
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { filePath, originalName, mimeType } = await this.attachmentsService.getAttachmentFile(
      id,
      user,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
    res.sendFile(filePath);
  }
}

