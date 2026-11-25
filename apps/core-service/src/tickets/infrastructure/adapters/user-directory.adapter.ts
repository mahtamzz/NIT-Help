import { Injectable } from '@nestjs/common';
import { UserRole } from '@nit-help/shared';
import { UserDirectoryService } from '../../../clients/user-directory.service';
import { UserDirectoryPort } from '../../application/ports/user-directory.port';
import { DirectoryUserRecord } from '../../domain/ticket.types';

@Injectable()
export class UserDirectoryAdapter implements UserDirectoryPort {
  constructor(private readonly userDirectory: UserDirectoryService) {}

  async resolveUsersByIds(
    ids: Array<string | null | undefined>,
  ): Promise<Map<string, DirectoryUserRecord>> {
    const resolved = await this.userDirectory.resolveUsersByIds(ids);
    const result = new Map<string, DirectoryUserRecord>();
    resolved.forEach((value, key) => {
      result.set(key, {
        ...value,
        role: value.role as unknown as UserRole,
      });
    });
    return result;
  }

  async getFreshUserById(id: string): Promise<DirectoryUserRecord | null> {
    const user = await this.userDirectory.getFreshUserById(id);
    if (!user) return null;
    return {
      ...user,
      role: user.role as unknown as UserRole,
    };
  }
}
