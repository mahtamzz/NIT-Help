import { StorageDownloadTarget } from '../../domain/attachment.types';

export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
  save(storageKey: string, content: Buffer): Promise<void>;

  getDownloadTarget(storageKey: string): Promise<StorageDownloadTarget | null>;

  delete(storageKey: string): Promise<void>;
}
