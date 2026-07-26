import { IsEnum } from 'class-validator';

import { TicketStatus } from '../maintenance.enums';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
