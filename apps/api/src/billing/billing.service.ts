import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { getTenantId } from '../shared/tenant/tenant-context';
import { TenantService } from '../shared/tenant/tenant.service';
import { PlanCode, SubscriptionStatus } from './billing.enums';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';

export interface UsageSummary {
  plan: string | null;
  status: string | null;
  assets: { used: number; quota: number | null };
  users: { used: number; seats: number | null };
}

@Injectable()
export class BillingService {
  constructor(private readonly tenant: TenantService) {}

  getSubscription(): Promise<Subscription> {
    return this.tenant.withTenant((em) => this.getOrCreate(em));
  }

  update(dto: UpdateSubscriptionDto): Promise<Subscription> {
    return this.tenant.withTenant(async (em) => {
      const subscription = await this.getOrCreate(em);
      Object.assign(subscription, dto);
      return em.save(subscription);
    });
  }

  usage(): Promise<UsageSummary> {
    return this.tenant.withTenant(async (em) => {
      const subscription = await this.getOrCreate(em);
      const [assetRow] = await em.query(
        `SELECT COUNT(*)::int AS count FROM asset WHERE deleted_at IS NULL`,
      );
      const [userRow] = await em.query(`SELECT COUNT(*)::int AS count FROM app_user`);
      return {
        plan: subscription.planCode,
        status: subscription.status,
        assets: { used: Number(assetRow.count), quota: subscription.assetQuota },
        users: { used: Number(userRow.count), seats: subscription.seats },
      };
    });
  }

  private async getOrCreate(em: EntityManager): Promise<Subscription> {
    const tenantId = getTenantId() as string;

    // Coba temukan subscription yang sudah ada untuk tenant ini
    const existing = await em.findOne(Subscription, { where: { tenantId } });
    if (existing) return existing;

    // Jika belum ada, buat default — tangani race condition:
    // Billing page memanggil /subscription DAN /usage secara paralel,
    // keduanya bisa masuk sini sebelum salah satu sempat INSERT.
    // Solusi: tangkap error unique_violation (23505) dan ambil ulang.
    try {
      const subscription = em.create(Subscription, {
        tenantId,
        planCode: PlanCode.STANDARD,
        status: SubscriptionStatus.ACTIVE,
        seats: 10,
        assetQuota: 1000,
        currentPeriodStart: new Date(),
      });
      return await em.save(subscription);
    } catch (err: unknown) {
      // PostgreSQL 23505 = unique_violation — request lain sudah INSERT duluan
      if ((err as { code?: string }).code === '23505') {
        const found = await em.findOne(Subscription, { where: { tenantId } });
        if (found) return found;
      }
      throw err;
    }
  }
}
