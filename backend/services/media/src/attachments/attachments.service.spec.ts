import { AuthenticatedUser, EVENT_PATTERNS } from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import { AttachmentRepositoryPort } from './application/ports/attachment-repository.port';
import { MediaEventPublisherPort } from './application/ports/media-event-publisher.port';
import { StoragePort } from './application/ports/storage.port';
import { TicketAccessPort } from './application/ports/ticket-access.port';
import { DownloadAttachmentUseCase } from './application/use-cases/download-attachment.use-case';
import { UploadAttachmentUseCase } from './application/use-cases/upload-attachment.use-case';
import { AttachmentForbiddenError } from './domain/attachment.errors';

describe('Media Attachments Use Cases (StoragePort + Clean Architecture)', () => {
  const mockRepo: jest.Mocked<AttachmentRepositoryPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTicketId: jest.fn(),
    countByTicketIds: jest.fn(),
  };

  const mockStorage: jest.Mocked<StoragePort> = {
    save: jest.fn(),
    getDownloadTarget: jest.fn(),
    delete: jest.fn(),
  };

  const mockTicketAccess: jest.Mocked<TicketAccessPort> = {
    getTicketAccessContext: jest.fn(),
  };

  const mockEventPublisher: jest.Mocked<MediaEventPublisherPort> = {
    publish: jest.fn(),
  };

  const student: AuthenticatedUser = {
    id: 'student-1',
    email: 's@nit.ac.ir',
    username: 'student',
    fullName: 'دانشجو',
    role: UserRole.STUDENT,
    departmentId: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('blocks student from downloading attachment on an internal note', async () => {
    const downloadUseCase = new DownloadAttachmentUseCase(
      mockRepo,
      mockStorage,
      mockTicketAccess,
    );

    mockRepo.findById.mockResolvedValue({
      id: 'att-1',
      ticketId: 't-1',
      messageId: 'msg-internal',
      uploadedById: 'spec-1',
      storageKey: 'test.txt',
      originalName: 'test.txt',
      mimeType: 'text/plain',
      size: 12,
    });

    mockTicketAccess.getTicketAccessContext.mockResolvedValue({
      exists: true,
      ticketId: 't-1',
      requesterId: 'student-1',
      departmentId: 'dept-1',
      assignedToId: 'spec-1',
      messageIsInternal: true,
    });

    await expect(downloadUseCase.execute('att-1', student)).rejects.toThrow(
      AttachmentForbiddenError,
    );
    expect(mockStorage.getDownloadTarget).not.toHaveBeenCalled();
  });

  it('blocks student from uploading attachment to another student ticket', async () => {
    const uploadUseCase = new UploadAttachmentUseCase(
      mockRepo,
      mockStorage,
      mockTicketAccess,
      mockEventPublisher,
    );

    mockTicketAccess.getTicketAccessContext.mockResolvedValue({
      exists: true,
      ticketId: 't-1',
      requesterId: 'student-2',
      departmentId: 'dept-1',
      assignedToId: null,
      messageIsInternal: false,
    });

    await expect(
      uploadUseCase.execute(
        {
          originalname: 'screenshot.png',
          mimetype: 'image/png',
          size: 5,
          buffer: Buffer.from('hello'),
        },
        student,
        't-1',
      ),
    ).rejects.toThrow(AttachmentForbiddenError);
    expect(mockStorage.save).not.toHaveBeenCalled();
  });

  it('compensates by deleting stored file if repository persistence fails', async () => {
    const uploadUseCase = new UploadAttachmentUseCase(
      mockRepo,
      mockStorage,
      mockTicketAccess,
      mockEventPublisher,
    );

    mockTicketAccess.getTicketAccessContext.mockResolvedValue({
      exists: true,
      ticketId: 't-1',
      requesterId: 'student-1',
      departmentId: 'dept-1',
      assignedToId: null,
      messageIsInternal: false,
    });
    mockStorage.save.mockResolvedValue(undefined);
    mockStorage.delete.mockResolvedValue(undefined);
    mockRepo.create.mockRejectedValue(new Error('DB write failure'));

    await expect(
      uploadUseCase.execute(
        {
          originalname: 'doc.pdf',
          mimetype: 'application/pdf',
          size: 5,
          buffer: Buffer.from('hello'),
        },
        student,
        't-1',
      ),
    ).rejects.toThrow('DB write failure');

    expect(mockStorage.save).toHaveBeenCalledTimes(1);
    expect(mockStorage.delete).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it('persists file via StoragePort and publishes attachment.uploaded event on success', async () => {
    const uploadUseCase = new UploadAttachmentUseCase(
      mockRepo,
      mockStorage,
      mockTicketAccess,
      mockEventPublisher,
    );

    mockTicketAccess.getTicketAccessContext.mockResolvedValue({
      exists: true,
      ticketId: 't-1',
      requesterId: 'student-1',
      departmentId: 'dept-1',
      assignedToId: null,
      messageIsInternal: false,
    });
    mockStorage.save.mockResolvedValue(undefined);
    mockRepo.create.mockResolvedValue({
      id: 'att-new',
      ticketId: 't-1',
      messageId: null,
      uploadedById: 'student-1',
      originalName: 'doc.pdf',
      storageKey: 'key.pdf',
      mimeType: 'application/pdf',
      size: 5,
    });

    const created = await uploadUseCase.execute(
      {
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 5,
        buffer: Buffer.from('hello'),
      },
      student,
      't-1',
    );

    expect(created.id).toBe('att-new');
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      EVENT_PATTERNS.ATTACHMENT_UPLOADED,
      expect.objectContaining({ attachmentId: 'att-new', ticketId: 't-1' }),
    );
  });
});
