import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { MaintenanceFrequency } from '../maintenance.enums';

export class UpdateScheduleDto {
  @IsOptional()
  @IsEnum(MaintenanceFrequency)
  frequency?: MaintenanceFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
