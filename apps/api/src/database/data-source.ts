import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

import { buildDbSsl } from '../config/db-ssl';
import { Tenant } from '../platform/tenant/tenant.entity';
import { User } from '../platform/user/user.entity';
import { Role } from '../platform/role/role.entity';
import { Permission } from '../platform/role/permission.entity';
import { AssetCategory } from '../asset-catalog/entities/asset-category.entity';
import { Vendor } from '../asset-catalog/entities/vendor.entity';
import { Asset } from '../asset-catalog/entities/asset.entity';
import { AssetDocument } from '../asset-catalog/entities/asset-document.entity';
import { AssetAssignment } from '../asset-tracking/entities/asset-assignment.entity';
import { AssetTransfer } from '../asset-tracking/entities/asset-transfer.entity';
import { AssetBorrowing } from '../asset-tracking/entities/asset-borrowing.entity';
import { Handover } from '../asset-tracking/entities/handover.entity';
import { AssetHistory } from '../asset-tracking/entities/asset-history.entity';
import { ApprovalRequest } from '../asset-tracking/approval/approval-request.entity';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { MaintenanceTicket } from '../maintenance/entities/maintenance-ticket.entity';
import { WorkOrder } from '../maintenance/entities/work-order.entity';
import { WorkOrderPart } from '../maintenance/entities/work-order-part.entity';
import { MaintenanceHistory } from '../maintenance/entities/maintenance-history.entity';
import { TicketAttachment } from '../maintenance/entities/ticket-attachment.entity';
import { DepreciationEntry } from '../finance-audit/entities/depreciation-entry.entity';
import { AuditSession } from '../finance-audit/entities/audit-session.entity';
import { AuditItem } from '../finance-audit/entities/audit-item.entity';
import { DisposalRequest } from '../disposal/entities/disposal-request.entity';
import { DisposalDocument } from '../disposal/entities/disposal-document.entity';
import { Subscription } from '../billing/entities/subscription.entity';
import { UsageMetric } from '../billing/entities/usage-metric.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationTemplate } from '../notification/entities/notification-template.entity';
import { InitPlatform1720000000001 } from './migrations/1720000000001-InitPlatform';
import { EnableRls1720000000002 } from './migrations/1720000000002-EnableRls';
import { InitAssetCatalog1720000000003 } from './migrations/1720000000003-InitAssetCatalog';
import { InitTracking1720000000004 } from './migrations/1720000000004-InitTracking';
import { InitMaintenance1720000000005 } from './migrations/1720000000005-InitMaintenance';
import { InitFinanceAudit1720000000006 } from './migrations/1720000000006-InitFinanceAudit';
import { InitDisposal1720000000007 } from './migrations/1720000000007-InitDisposal';
import { InitBilling1720000000008 } from './migrations/1720000000008-InitBilling';
import { InitNotification1720000000009 } from './migrations/1720000000009-InitNotification';

// Muat .env dari root proyek jika ada
loadEnv();

/**
 * DataSource untuk CLI TypeORM (migrasi) dan skrip seed.
 * Menggunakan kredensial ADMIN (owner) agar dapat membuat tabel & policy RLS.
 * Runtime aplikasi memakai user non-superuser (lihat database.module.ts).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_ADMIN_USERNAME ?? process.env.DB_USERNAME ?? 'ams_admin',
  password: process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD ?? 'ams_admin_pw',
  database: process.env.DB_NAME ?? 'ams',
  // TLS untuk DB terkelola (mis. Supabase). Aktifkan dengan DB_SSL=true.
  ssl: buildDbSsl(),
  entities: [
    Tenant,
    User,
    Role,
    Permission,
    AssetCategory,
    Vendor,
    Asset,
    AssetDocument,
    AssetAssignment,
    AssetTransfer,
    AssetBorrowing,
    Handover,
    AssetHistory,
    ApprovalRequest,
    MaintenanceSchedule,
    MaintenanceTicket,
    WorkOrder,
    WorkOrderPart,
    MaintenanceHistory,
    TicketAttachment,
    DepreciationEntry,
    AuditSession,
    AuditItem,
    DisposalRequest,
    DisposalDocument,
    Subscription,
    UsageMetric,
    Notification,
    NotificationTemplate,
  ],
  migrations: [
    InitPlatform1720000000001,
    EnableRls1720000000002,
    InitAssetCatalog1720000000003,
    InitTracking1720000000004,
    InitMaintenance1720000000005,
    InitFinanceAudit1720000000006,
    InitDisposal1720000000007,
    InitBilling1720000000008,
    InitNotification1720000000009,
  ],
  synchronize: false,
  logging: ['error', 'warn', 'migration'],
});
