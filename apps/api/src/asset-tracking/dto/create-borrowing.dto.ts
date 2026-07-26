import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBorrowingDto {
  @IsUUID()
  assetId: string;

  @IsOptional()
  @IsUUID()
  borrowerUserId?: string;

  @IsOptional()
  @IsDateString()
  dueReturnDate?: string;

  @IsOptional()
  @IsString()
  conditionBefore?: string;
}
