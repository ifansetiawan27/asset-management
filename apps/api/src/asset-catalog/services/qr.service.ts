import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import * as QRCode from 'qrcode';

/**
 * Membuat & memverifikasi QR aset (SDD §8.3).
 * Payload di-sign HMAC-SHA256 agar tidak dapat dipalsukan lintas tenant.
 */
@Injectable()
export class QrService {
  constructor(private readonly config: ConfigService) {}

  private get secret(): string {
    return this.config.get<string>('qr.secret') ?? '';
  }

  sign(tenantId: string, assetId: string, code: string): string {
    return createHmac('sha256', this.secret)
      .update(`${tenantId}|${assetId}|${code}`)
      .digest('hex');
  }

  buildPayload(tenantId: string, assetId: string, code: string): string {
    return JSON.stringify({
      t: tenantId,
      a: assetId,
      c: code,
      s: this.sign(tenantId, assetId, code),
    });
  }

  async generateDataUrl(tenantId: string, assetId: string, code: string): Promise<string> {
    const payload = this.buildPayload(tenantId, assetId, code);
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
    });
  }

  verify(tenantId: string, assetId: string, code: string, sig: string): boolean {
    return this.sign(tenantId, assetId, code) === sig;
  }
}
