import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { NotificationChannel } from '../notification.enums';

export class CreateTemplateDto {
  @IsString()
  @MaxLength(50)
  code: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsString()
  body: string;
}
