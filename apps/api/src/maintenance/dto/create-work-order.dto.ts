import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateWorkOrderDto {
  @IsUUID()
  assetId: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsOptional()
  @IsUUID()
  technicianUserId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  complaint?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;
}
