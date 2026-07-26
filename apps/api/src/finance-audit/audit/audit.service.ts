import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateAuditSessionDto } from '../dto/create-audit-session.dto';
import { SubmitAuditItemDto } from '../dto/submit-audit-item.dto';
import { AuditItem } from '../entities/audit-item.entity';
import { AuditSession } from '../entities/audit-session.entity';
import { AuditItemStatus, AuditSessionStatus } from '../finance-audit.enums';

export interface AuditReport {
  sessionId: string;
  total: number;
  byStatus: Record<AuditItemStatus, number>;
  items: AuditItem[];
}

@Injectable()
export class AuditService {
  constructor(private readonly tenant: TenantService) {}

  createSession(dto: CreateAuditSessionDto): Promise<AuditSession> {
    return this.tenant.withTenant((em) => {
      const session = em.create(AuditSession, {
        tenantId: getTenantId() as string,
        name: dto.name,
        scope: dto.scope ?? {},
        status: AuditSessionStatus.PLANNED,
      });
      return em.save(session);
    });
  }

  listSessions(): Promise<AuditSession[]> {
    return this.tenant.withTenant((em) =>
      em.find(AuditSession, { order: { createdAt: 'DESC' } }),
    );
  }

  getSession(id: string): Promise<AuditSession> {
    return this.tenant.withTenant((em) => this.getSessionOrFail(em, id));
  }

  startSession(id: string, userId?: string): Promise<AuditSession> {
    return this.tenant.withTenant(async (em) => {
      const session = await this.getSessionOrFail(em, id);
      session.status = AuditSessionStatus.IN_PROGRESS;
      session.startedAt = new Date();
      session.startedBy = userId ?? null;
      return em.save(session);
    });
  }

  closeSession(id: string): Promise<AuditSession> {
    return this.tenant.withTenant(async (em) => {
      const session = await this.getSessionOrFail(em, id);
      session.status = AuditSessionStatus.CLOSED;
      session.closedAt = new Date();
      return em.save(session);
    });
  }

  submitItem(sessionId: string, dto: SubmitAuditItemDto, userId?: string): Promise<AuditItem> {
    return this.tenant.withTenant(async (em) => {
      const session = await this.getSessionOrFail(em, sessionId);
      this.assertOpen(session);
      return this.upsertItem(em, session, dto, userId);
    });
  }

  syncBatch(
    sessionId: string,
    items: SubmitAuditItemDto[],
    userId?: string,
  ): Promise<{ synced: number; items: AuditItem[] }> {
    return this.tenant.withTenant(async (em) => {
      const session = await this.getSessionOrFail(em, sessionId);
      this.assertOpen(session);
      const saved: AuditItem[] = [];
      for (const dto of items) {
        saved.push(await this.upsertItem(em, session, dto, userId));
      }
      return { synced: saved.length, items: saved };
    });
  }

  report(sessionId: string): Promise<AuditReport> {
    return this.tenant.withTenant(async (em) => {
      await this.getSessionOrFail(em, sessionId);
      const items = await em.find(AuditItem, {
        where: { auditSessionId: sessionId },
        order: { auditedAt: 'DESC' },
      });
      const byStatus: Record<AuditItemStatus, number> = {
        [AuditItemStatus.FOUND]: 0,
        [AuditItemStatus.MISSING]: 0,
        [AuditItemStatus.DAMAGED]: 0,
        [AuditItemStatus.RELOCATED]: 0,
      };
      for (const item of items) {
        if (item.status in byStatus) {
          byStatus[item.status as AuditItemStatus] += 1;
        }
      }
      return { sessionId, total: items.length, byStatus, items };
    });
  }

  lookupByCode(code?: string): Promise<Asset> {
    if (!code) {
      throw new BadRequestException('Parameter "code" wajib diisi');
    }
    return this.tenant.withTenant(async (em) => {
      const asset = await em.findOne(Asset, { where: { assetCode: code } });
      if (!asset) {
        throw new NotFoundException('Asset dengan kode tersebut tidak ditemukan');
      }
      return asset;
    });
  }

  private async upsertItem(
    em: EntityManager,
    session: AuditSession,
    dto: SubmitAuditItemDto,
    userId?: string,
  ): Promise<AuditItem> {
    const tenantId = getTenantId() as string;
    const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset ${dto.assetId} tidak ditemukan`);
    }

    if (dto.clientId) {
      const existing = await em.findOne(AuditItem, {
        where: { auditSessionId: session.id, clientId: dto.clientId },
      });
      if (existing) {
        existing.status = dto.status;
        existing.actualLocationId = dto.actualLocationId ?? null;
        existing.conditionNote = dto.conditionNote ?? null;
        existing.photoKeys = dto.photoKeys ?? [];
        existing.auditorUserId = userId ?? existing.auditorUserId;
        return em.save(existing);
      }
    }

    const item = em.create(AuditItem, {
      tenantId,
      auditSessionId: session.id,
      assetId: dto.assetId,
      auditorUserId: userId ?? null,
      status: dto.status,
      expectedLocationId: asset.locationId,
      actualLocationId: dto.actualLocationId ?? null,
      conditionNote: dto.conditionNote ?? null,
      photoKeys: dto.photoKeys ?? [],
      clientId: dto.clientId ?? null,
    });
    return em.save(item);
  }

  private assertOpen(session: AuditSession): void {
    if (session.status === AuditSessionStatus.CLOSED) {
      throw new ConflictException('Sesi audit sudah ditutup');
    }
  }

  private async getSessionOrFail(em: EntityManager, id: string): Promise<AuditSession> {
    const session = await em.findOne(AuditSession, { where: { id } });
    if (!session) {
      throw new NotFoundException('Sesi audit tidak ditemukan');
    }
    return session;
  }
}
