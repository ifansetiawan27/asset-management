import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAuditSessionDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsObject()
  scope?: Record<string, unknown>;
}
