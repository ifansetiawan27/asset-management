import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { tenantStorage } from './tenant-context';

/**
 * Meresolusi tenant dari header `X-Tenant-ID` (UUID tenant).
 * Catatan: resolusi via subdomain -> tenant memerlukan lookup ke Tenant Registry
 * dan akan ditambahkan bersama integrasi SSO (Keycloak) pada Step 3.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers['x-tenant-id'];
    const tenantId = (Array.isArray(header) ? header[0] : header) ?? null;

    tenantStorage.run({ tenantId }, () => next());
  }
}
