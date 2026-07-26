import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import configuration from './config/configuration';
import { validationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './shared/tenant/tenant.module';
import { TenantMiddleware } from './shared/tenant/tenant.middleware';
import { IdentityModule } from './identity/identity.module';
import { PlatformModule } from './platform/platform.module';
import { HealthModule } from './platform/health/health.module';
import { AssetCatalogModule } from './asset-catalog/asset-catalog.module';
import { AssetTrackingModule } from './asset-tracking/asset-tracking.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { FinanceAuditModule } from './finance-audit/finance-audit.module';
import { DisposalModule } from './disposal/disposal.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TenantModule,
    IdentityModule,
    PlatformModule,
    HealthModule,
    AssetCatalogModule,
    AssetTrackingModule,
    MaintenanceModule,
    FinanceAuditModule,
    DisposalModule,
    AnalyticsModule,
    BillingModule,
    NotificationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Resolusi tenant untuk seluruh route.
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
