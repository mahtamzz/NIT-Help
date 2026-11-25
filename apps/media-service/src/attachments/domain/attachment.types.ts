export interface AttachmentEntity {
  id: string;
  ticketId: string;
  messageId: string | null;
  uploadedById: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export type StorageDownloadTarget =
  | { kind: 'file'; filePath: string }
  | { kind: 'buffer'; buffer: Buffer };
