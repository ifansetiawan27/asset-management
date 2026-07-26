import { IsEnum } from 'class-validator';

import { DisposalDocType } from '../disposal.enums';

export class UploadDisposalDocumentDto {
  @IsEnum(DisposalDocType)
  docType: DisposalDocType;
}
