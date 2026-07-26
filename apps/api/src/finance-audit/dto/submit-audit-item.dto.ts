import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { AuditItemStatus } from '../finance-audit.enums';

export class SubmitAuditItemDto {
  @IsUUID()
  assetId: string;

  @IsEnum(AuditItemStatus)
  status: AuditItemStatus;

  @IsOptional()
  @IsUUID()
  actualLocationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  conditionNote?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoKeys?: string[];

  /** Idempotency key untuk sinkronisasi offline (mobile). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientId?: string;
}
