import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { AssigneeType } from '../tracking.enums';

export class CreateAssignmentDto {
  @IsUUID()
  assetId: string;

  @IsEnum(AssigneeType)
  assigneeType: AssigneeType;

  @IsUUID()
  assigneeId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
