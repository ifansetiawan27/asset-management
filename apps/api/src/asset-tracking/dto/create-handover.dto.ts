import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { HandoverRefType } from '../tracking.enums';

export class CreateHandoverDto {
  @IsUUID()
  assetId: string;

  @IsOptional()
  @IsEnum(HandoverRefType)
  refType?: HandoverRefType;

  @IsOptional()
  @IsUUID()
  refId?: string;

  @IsOptional()
  @IsUUID()
  toUserId?: string;

  @IsOptional()
  @IsString()
  signatureKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoKeys?: string[];

  @IsOptional()
  @IsString()
  conditionNote?: string;
}
