import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
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
        // Skema dikelola oleh migrasi, bukan synchronize.
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
