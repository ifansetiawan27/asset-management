import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export interface UploadableFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

/**
 * Penyimpanan file lokal untuk dev (prefix per-tenant untuk isolasi).
 * Pada produksi diganti adapter S3/MinIO dengan antarmuka yang sama.
 */
@Injectable()
export class FileStorageService {
  private readonly baseDir: string;

  constructor(config: ConfigService) {
    this.baseDir = path.resolve(process.cwd(), config.get<string>('storage.dir') ?? 'uploads');
  }

  async save(tenantId: string, assetId: string, file: UploadableFile): Promise<string> {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relDir = path.join('tenants', tenantId, assetId);
    const relKey = path.join(relDir, `${randomUUID()}-${safeName}`);

    await fs.mkdir(path.join(this.baseDir, relDir), { recursive: true });
    await fs.writeFile(path.join(this.baseDir, relKey), file.buffer);

    return relKey.split(path.sep).join('/');
  }
}
