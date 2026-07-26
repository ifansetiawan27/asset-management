import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddPartDto {
  @IsString()
  @MaxLength(150)
  partName: string;

  @IsInt()
  @Min(1)
  qty: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}
