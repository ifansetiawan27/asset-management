import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

import { DisposalReason } from '../disposal.enums';

export class CreateDisposalDto {
  @IsUUID()
  assetId: string;

  @IsEnum(DisposalReason)
  reason: DisposalReason;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saleValue?: number;
}
