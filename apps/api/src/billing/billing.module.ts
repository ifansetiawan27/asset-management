import { Module } from '@nestjs/common';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

/** Modul Billing (SaaS): subscription & usage/metering per tenant. */
@Module({
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
