import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { AssetStatus } from '../../asset-catalog/enums/asset-status.enum';
import { FileStorageService, UploadableFile } from '../../asset-catalog/services/file-storage.service';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { AssignTicketDto } from '../dto/assign-ticket.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { MaintenanceTicket } from '../entities/maintenance-ticket.entity';
import { TicketAttachment } from '../entities/ticket-attachment.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { MaintenanceType, TicketStatus, WorkOrderStatus } from '../maintenance.enums';

@Injectable()
export class TicketsService {
  constructor(
    private readonly tenant: TenantService,
    private readonly storage: FileStorageService,
  ) {}

  create(dto: CreateTicketDto, userId?: string): Promise<MaintenanceTicket> {
    return this.tenant.withTenant(async (em) => {
      const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }
      const ticket = em.create(MaintenanceTicket, {
        tenantId: getTenantId() as string,
        assetId: dto.assetId,
        reporterUserId: userId ?? null,
        problem: dto.problem,
        severity: dto.severity,
        status: TicketStatus.OPEN,
        type: MaintenanceType.CORRECTIVE,
      });
      return em.save(ticket);
    });
  }

  list(assetId?: string, status?: string): Promise<MaintenanceTicket[]> {
    return this.tenant.withTenant((em) => {
      const where: Record<string, string> = {};
      if (assetId) where.assetId = assetId;
      if (status) where.status = status;
      return em.find(MaintenanceTicket, { where, order: { createdAt: 'DESC' } });
    });
  }

  findOne(id: string): Promise<MaintenanceTicket> {
    return this.tenant.withTenant((em) => this.getOrFail(em, id));
  }

  updateStatus(id: string, dto: UpdateTicketStatusDto): Promise<MaintenanceTicket> {
    return this.tenant.withTenant(async (em) => {
      const ticket = await this.getOrFail(em, id);
      ticket.status = dto.status;
      return em.save(ticket);
    });
  }

  /** Assign teknisi → status ASSIGNED + buat Work Order + aset IN_MAINTENANCE. */
  assign(
    id: string,
    dto: AssignTicketDto,
    _userId?: string,
  ): Promise<{ ticket: MaintenanceTicket; workOrder: WorkOrder }> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const ticket = await this.getOrFail(em, id);

      ticket.status = TicketStatus.ASSIGNED;
      await em.save(ticket);

      const workOrder = em.create(WorkOrder, {
        tenantId,
        ticketId: ticket.id,
        assetId: ticket.assetId,
        technicianUserId: dto.technicianUserId,
        complaint: dto.complaint ?? ticket.problem,
        maintenanceType: MaintenanceType.CORRECTIVE,
        status: WorkOrderStatus.OPEN,
      });
      const savedWo = await em.save(workOrder);

      const asset = await em.findOne(Asset, { where: { id: ticket.assetId } });
      if (asset) {
        asset.status = AssetStatus.IN_MAINTENANCE;
        await em.save(asset);
      }

      return { ticket, workOrder: savedWo };
    });
  }

  uploadAttachment(
    ticketId: string,
    file: UploadableFile | undefined,
    _userId?: string,
  ): Promise<TicketAttachment> {
    if (!file) {
      throw new BadRequestException('File wajib diunggah (field form-data: "file")');
    }
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      await this.getOrFail(em, ticketId);
      const fileKey = await this.storage.save(tenantId, ticketId, file);
      const attachment = em.create(TicketAttachment, {
        tenantId,
        ticketId,
        fileKey,
        fileName: file.originalname,
        mime: file.mimetype,
      });
      return em.save(attachment);
    });
  }

  listAttachments(ticketId: string): Promise<TicketAttachment[]> {
    return this.tenant.withTenant((em) =>
      em.find(TicketAttachment, { where: { ticketId }, order: { createdAt: 'DESC' } }),
    );
  }

  private async getOrFail(em: EntityManager, id: string): Promise<MaintenanceTicket> {
    const ticket = await em.findOne(MaintenanceTicket, { where: { id } });
    if (!ticket) {
      throw new NotFoundException('Ticket tidak ditemukan');
    }
    return ticket;
  }
}
