import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  assetId: string;

  @IsOptional()
  @IsUUID()
  toLocationId?: string;

  @IsOptional()
  @IsUUID()
  toDepartmentId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
