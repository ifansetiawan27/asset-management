import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { SubmitAuditItemDto } from './submit-audit-item.dto';

export class SyncAuditDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitAuditItemDto)
  items: SubmitAuditItemDto[];
}
