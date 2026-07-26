import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';

import { TicketSeverity } from '../maintenance.enums';

export class CreateTicketDto {
  @IsUUID()
  assetId: string;

  @IsString()
  @MaxLength(2000)
  problem: string;

  @IsEnum(TicketSeverity)
  severity: TicketSeverity;
}
