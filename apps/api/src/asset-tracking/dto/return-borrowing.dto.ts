import { IsOptional, IsString } from 'class-validator';

export class ReturnBorrowingDto {
  @IsOptional()
  @IsString()
  conditionAfter?: string;
}
