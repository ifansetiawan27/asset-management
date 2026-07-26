import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

import { MaintenanceFrequency } from '../maintenance.enums';

export class CreateScheduleDto {
  @IsUUID()
  assetId: string;

  @IsEnum(MaintenanceFrequency)
  frequency: MaintenanceFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @IsDateString()
  nextDueDate: string;
}
