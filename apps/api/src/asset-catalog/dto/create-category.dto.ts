import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { DepreciationMethod } from '../enums/depreciation-method.enum';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(30)
  code: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultUsefulLifeYears?: number;

  @IsOptional()
  @IsEnum(DepreciationMethod)
  defaultDepreciationMethod?: DepreciationMethod;
}
