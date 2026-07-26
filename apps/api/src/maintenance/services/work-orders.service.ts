import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { AssetStatus } from '../../asset-catalog/enums/asset-status.enum';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { AddPartDto } from '../dto/add-part.dto';
import { CompleteWorkOrderDto } from '../dto/complete-work-order.dto';
import { CreateWorkOrderDto } from '../dto/create-work-order.dto';
import { UpdateWorkOrderDto } from '../dto/update-work-order.dto';
import { MaintenanceHistory } from '../entities/maintenance-history.entity';
import { MaintenanceTicket } from '../entities/maintenance-ticket.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { WorkOrderPart } from '../entities/work-order-part.entity';
import { MaintenanceType, TicketStatus, WorkOrderStatus } from '../maintenance.enums';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly tenant: TenantService) {}

  create(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    return this.tenant.withTenant(async (em) => {
      const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }
      const wo = em.create(WorkOrder, {
        tenantId: getTenantId() as string,
        assetId: dto.assetId,
        ticketId: dto.ticketId ?? null,
        technicianUserId: dto.technicianUserId ?? null,
        locationId: dto.locationId ?? null,
        complaint: dto.complaint ?? null,
        estimatedCost: dto.estimatedCost ?? null,
        maintenanceType: MaintenanceType.CORRECTIVE,
        status: WorkOrderStatus.OPEN,
      });
      return em.save(wo);
    });
  }

  list(assetId?: string, ticketId?: string): Promise<WorkOrder[]> {
    return this.tenant.withTenant((em) => {
      const where: Record<string, string> = {};
      if (assetId) where.assetId = assetId;
      if (ticketId) where.ticketId = ticketId;
      return em.find(WorkOrder, { where, order: { createdAt: 'DESC' } });
    });
  }

  findOne(id: string): Promise<WorkOrder> {
    return this.tenant.withTenant((em) => this.getOrFail(em, id));
  }

  update(id: string, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    return this.tenant.withTenant(async (em) => {
      const wo = await this.getOrFail(em, id);
      Object.assign(wo, dto);
      return em.save(wo);
    });
  }

  addPart(id: string, dto: AddPartDto): Promise<WorkOrderPart> {
    return this.tenant.withTenant(async (em) => {
      await this.getOrFail(em, id);
      const part = em.create(WorkOrderPart, {
        tenantId: getTenantId() as string,
        workOrderId: id,
        partName: dto.partName,
        qty: dto.qty,
        unitCost: dto.unitCost ?? null,
      });
      return em.save(part);
    });
  }

  listParts(id: string): Promise<WorkOrderPart[]> {
    return this.tenant.withTenant((em) =>
      em.find(WorkOrderPart, { where: { workOrderId: id } }),
    );
  }

  start(id: string): Promise<WorkOrder> {
    return this.tenant.withTenant(async (em) => {
      const wo = await this.getOrFail(em, id);
      wo.status = WorkOrderStatus.IN_PROGRESS;
      wo.startedAt = new Date();
      await em.save(wo);

      if (wo.ticketId) {
        await em.update(MaintenanceTicket, { id: wo.ticketId }, { status: TicketStatus.IN_PROGRESS });
      }
      const asset = await em.findOne(Asset, { where: { id: wo.assetId } });
      if (asset) {
        asset.status = AssetStatus.IN_MAINTENANCE;
        await em.save(asset);
      }
      return wo;
    });
  }

  /** Selesaikan work order → catat maintenance history + aset kembali ACTIVE. */
  complete(
    id: string,
    dto: CompleteWorkOrderDto,
  ): Promise<{ workOrder: WorkOrder; history: MaintenanceHistory }> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const wo = await this.getOrFail(em, id);

      wo.status = WorkOrderStatus.COMPLETED;
      wo.completedAt = new Date();
      if (dto.actualCost !== undefined) {
        wo.actualCost = dto.actualCost;
      }
      await em.save(wo);

      const parts = await em.find(WorkOrderPart, { where: { workOrderId: id } });
      const partsJson = parts.map((p) => ({
        partName: p.partName,
        qty: p.qty,
        unitCost: p.unitCost,
      }));
      const partsTotal = parts.reduce((sum, p) => sum + p.qty * (p.unitCost ?? 0), 0);
      const cost = wo.actualCost ?? partsTotal;

      const history = em.create(MaintenanceHistory, {
        tenantId,
        assetId: wo.assetId,
        workOrderId: wo.id,
        technicianUserId: wo.technicianUserId,
        type: wo.maintenanceType,
        parts: partsJson,
        cost,
        attachmentKeys: dto.attachmentKeys ?? [],
      });
      const savedHistory = await em.save(history);

      if (wo.ticketId) {
        await em.update(MaintenanceTicket, { id: wo.ticketId }, { status: TicketStatus.COMPLETED });
      }
      const asset = await em.findOne(Asset, { where: { id: wo.assetId } });
      if (asset && asset.status === AssetStatus.IN_MAINTENANCE) {
        asset.status = AssetStatus.ACTIVE;
        await em.save(asset);
      }

      return { workOrder: wo, history: savedHistory };
    });
  }

  private async getOrFail(em: EntityManager, id: string): Promise<WorkOrder> {
    const wo = await em.findOne(WorkOrder, { where: { id } });
    if (!wo) {
      throw new NotFoundException('Work order tidak ditemukan');
    }
    return wo;
  }
}
