import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { PlanCode, SubscriptionStatus } from '../billing.enums';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(PlanCode)
  planCode?: PlanCode;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  assetQuota?: number;
}
