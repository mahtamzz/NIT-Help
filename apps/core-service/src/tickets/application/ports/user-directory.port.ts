import { DirectoryUserRecord } from '../../domain/ticket.types';

export const USER_DIRECTORY_PORT = Symbol('USER_DIRECTORY_PORT');

export interface UserDirectoryPort {
  resolveUsersByIds(
    ids: Array<string | null | undefined>,
  ): Promise<Map<string, DirectoryUserRecord>>;

  getFreshUserById(id: string): Promise<DirectoryUserRecord | null>;
}
