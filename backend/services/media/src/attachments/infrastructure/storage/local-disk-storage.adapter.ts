import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StoragePort } from '../../application/ports/storage.port';
import { StorageDownloadTarget } from '../../domain/attachment.types';

@Injectable()
export class LocalDiskStorageAdapter implements StoragePort {
  private readonly uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private resolveSafePath(storageKey: string): string {
    const baseName = path.basename(storageKey);
    return path.join(this.uploadDir, baseName);
  }

  async save(storageKey: string, content: Buffer): Promise<void> {
    await fs.promises.writeFile(this.resolveSafePath(storageKey), content);
  }

  async getDownloadTarget(storageKey: string): Promise<StorageDownloadTarget | null> {
    const filePath = this.resolveSafePath(storageKey);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return { kind: 'file', filePath };
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = this.resolveSafePath(storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
