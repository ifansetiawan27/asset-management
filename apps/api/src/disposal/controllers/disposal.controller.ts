import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploadableFile } from '../../asset-catalog/services/file-storage.service';
import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateDisposalDto } from '../dto/create-disposal.dto';
import { UploadDisposalDocumentDto } from '../dto/upload-disposal-document.dto';
import { DisposalDocumentService } from '../services/disposal-document.service';
import { DisposalService } from '../services/disposal.service';

const ADMIN_ROLES = [SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR];

@Controller('disposals')
export class DisposalController {
  constructor(
    private readonly disposal: DisposalService,
    private readonly documents: DisposalDocumentService,
  ) {}

  @Get()
  list(@Query('assetId') assetId?: string) {
    return this.disposal.list(assetId);
  }

  @Roles(...ADMIN_ROLES)
  @Post()
  create(@Body() dto: CreateDisposalDto, @CurrentUser() user: AuthUser) {
    return this.disposal.create(dto, user?.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.disposal.findOne(id);
  }

  /** Finalisasi setelah approval: DISPOSED (jika approved) / ACTIVE kembali (jika rejected). */
  @Roles(...ADMIN_ROLES)
  @Post(':id/finalize')
  finalize(@Param('id', ParseUUIDPipe) id: string) {
    return this.disposal.finalize(id);
  }

  @Roles(...ADMIN_ROLES)
  @Post(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.disposal.archive(id);
  }

  @Roles(...ADMIN_ROLES)
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadableFile,
    @Body() dto: UploadDisposalDocumentDto,
  ) {
    return this.documents.upload(id, file, dto.docType);
  }

  @Get(':id/documents')
  listDocuments(@Param('id', ParseUUIDPipe) id: string) {
    return this.documents.list(id);
  }
}
