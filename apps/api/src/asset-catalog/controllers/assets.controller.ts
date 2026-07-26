import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthUser } from '../../identity/auth-user.interface';
import { CurrentUser } from '../../identity/current-user.decorator';
import { Roles } from '../../shared/rbac/roles.decorator';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { QueryAssetDto } from '../dto/query-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { AssetDocumentService } from '../services/asset-document.service';
import { AssetsService } from '../services/assets.service';
import { UploadableFile } from '../services/file-storage.service';

@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assets: AssetsService,
    private readonly documents: AssetDocumentService,
  ) {}

  @Get()
  findAll(@Query() query: QueryAssetDto) {
    return this.assets.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assets.findOne(id);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.PROCUREMENT)
  @Post()
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: AuthUser) {
    return this.assets.create(dto, user?.sub);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assets.update(id, dto, user?.sub);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.assets.remove(id);
  }

  /** Generate ulang QR label (FR-M1-3). */
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.PROCUREMENT)
  @Post(':id/label')
  regenerateLabel(@Param('id', ParseUUIDPipe) id: string) {
    return this.assets.regenerateLabel(id);
  }

  /** Label aset siap cetak (FR-M1-4) — HTML berisi kode + QR. */
  @Get(':id/label')
  @Header('Content-Type', 'text/html; charset=utf-8')
  label(@Param('id', ParseUUIDPipe) id: string): Promise<string> {
    return this.assets.renderLabelHtml(id);
  }

  @Get(':id/documents')
  listDocuments(@Param('id', ParseUUIDPipe) id: string) {
    return this.documents.list(id);
  }

  /** Upload dokumen aset (FR-M1-2). */
  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR, SystemRole.PROCUREMENT)
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadableFile,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.upload(id, file, dto.docType, user?.sub);
  }
}
