import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IAM_PATTERNS, MEDIA_PATTERNS } from '@nit-help/microservice-common';
import { UserRole } from '.prisma/core-client';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface ResolvedUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  departmentId: string | null;
  isActive: boolean;
}

@Injectable()
export class UserDirectoryService {
  private readonly logger = new Logger(UserDirectoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject('IAM_CLIENT') private readonly iamClient?: ClientProxy,
    @Optional() @Inject('MEDIA_CLIENT') private readonly mediaClient?: ClientProxy,
  ) {}

  async resolveUsersByIds(ids: Array<string | null | undefined>): Promise<Map<string, ResolvedUser>> {
    const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
    const map = new Map<string, ResolvedUser>();
    if (uniqueIds.length === 0) {
      return map;
    }

    const replicas = await this.prisma.userReplica.findMany({
      where: { id: { in: uniqueIds } },
    });

    for (const r of replicas) {
      map.set(r.id, r);
    }

    const missingIds = uniqueIds.filter((id) => !map.has(id));
    if (missingIds.length > 0 && this.iamClient) {
      const fetched = await firstValueFrom(
        this.iamClient.send<any[]>(IAM_PATTERNS.GET_USERS_BY_IDS, { ids: missingIds }).pipe(
          timeout(1500),
          catchError((err) => {
            this.logger.warn(`IAM RPC GET_USERS_BY_IDS failed: ${err?.message || err}`);
            return of([]);
          }),
        ),
      );

      for (const u of fetched || []) {
        const record: ResolvedUser = {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          username: u.username,
          role: u.role as UserRole,
          departmentId: u.departmentId ?? null,
          isActive: u.isActive ?? true,
        };
        map.set(record.id, record);
        await this.prisma.userReplica
          .upsert({
            where: { id: record.id },
            update: record,
            create: record,
          })
          .catch(() => undefined);
      }
    }

    return map;
  }

  async getFreshUserById(id: string): Promise<ResolvedUser | null> {
    if (this.iamClient) {
      let rpcErrored = false;
      const fetched = await firstValueFrom(
        this.iamClient.send<any>(IAM_PATTERNS.GET_USER_BY_ID, { id }).pipe(
          timeout(1500),
          catchError((err) => {
            rpcErrored = true;
            this.logger.warn(`IAM RPC GET_USER_BY_ID failed: ${err?.message || err}`);
            return of(null);
          }),
        ),
      );

      if (!rpcErrored) {
        if (!fetched) {
          return null;
        }
        const record: ResolvedUser = {
          id: fetched.id,
          fullName: fetched.fullName,
          email: fetched.email,
          username: fetched.username,
          role: fetched.role as UserRole,
          departmentId: fetched.departmentId ?? null,
          isActive: fetched.isActive ?? true,
        };
        await this.prisma.userReplica
          .upsert({
            where: { id: record.id },
            update: record,
            create: record,
          })
          .catch(() => undefined);
        return record;
      }
    }

    return this.prisma.userReplica.findUnique({ where: { id } });
  }

  async getDepartmentMembers(departmentId: string) {
    if (this.iamClient) {
      let rpcErrored = false;
      const fetched = await firstValueFrom(
        this.iamClient
          .send<any[]>(IAM_PATTERNS.GET_USERS_BY_DEPARTMENT, { departmentId })
          .pipe(
            timeout(1500),
            catchError(() => {
              rpcErrored = true;
              return of([]);
            }),
          ),
      );
      if (!rpcErrored) {
        return fetched || [];
      }
    }

    return this.prisma.userReplica.findMany({
      where: { departmentId, isActive: true },
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async getTicketAttachments(ticketId: string): Promise<any[]> {
    if (!this.mediaClient) {
      return [];
    }
    return firstValueFrom(
      this.mediaClient.send<any[]>(MEDIA_PATTERNS.GET_TICKET_ATTACHMENTS, { ticketId }).pipe(
        timeout(1500),
        catchError((err) => {
          this.logger.warn(`Media RPC GET_TICKET_ATTACHMENTS failed: ${err?.message || err}`);
          return of([]);
        }),
      ),
    );
  }

  async getAttachmentsCountByTickets(ticketIds: string[]): Promise<Record<string, number>> {
    if (!this.mediaClient || ticketIds.length === 0) {
      return {};
    }
    return firstValueFrom(
      this.mediaClient
        .send<Record<string, number>>(MEDIA_PATTERNS.GET_ATTACHMENTS_COUNT_BY_TICKETS, {
          ticketIds,
        })
        .pipe(
          timeout(1500),
          catchError((err) => {
            this.logger.warn(`Media RPC COUNT_BY_TICKETS failed: ${err?.message || err}`);
            return of({});
          }),
        ),
    );
  }
}
