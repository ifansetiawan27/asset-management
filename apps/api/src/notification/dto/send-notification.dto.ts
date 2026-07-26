import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { NotificationChannel } from '../notification.enums';

export class SendNotificationDto {
  /** Kosongkan untuk broadcast ke seluruh tenant. */
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  templateCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsString()
  @MaxLength(4000)
  body: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
