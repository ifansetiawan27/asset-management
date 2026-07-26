import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CompleteWorkOrderDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentKeys?: string[];
}
