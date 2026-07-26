import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignTicketDto {
  @IsUUID()
  technicianUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  complaint?: string;
}
