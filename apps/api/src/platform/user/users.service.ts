import { Injectable } from '@nestjs/common';

import { TenantService } from '../../shared/tenant/tenant.service';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly tenant: TenantService) {}

  /**
   * Mengambil user milik tenant aktif.
   * RLS PostgreSQL memfilter otomatis berdasarkan app.current_tenant,
   * sehingga hanya user tenant tersebut yang dikembalikan.
   */
  findAll(): Promise<User[]> {
    return this.tenant.withTenant((em) =>
      em.find(User, { order: { createdAt: 'ASC' } }),
    );
  }
}
