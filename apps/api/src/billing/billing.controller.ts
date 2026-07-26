import { Body, Controller, Get, Put } from '@nestjs/common';

import { Roles } from '../shared/rbac/roles.decorator';
import { SystemRole } from '../shared/rbac/roles.enum';
import { BillingService } from './billing.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Get('subscription')
  getSubscription() {
    return this.service.getSubscription();
  }

  @Roles(SystemRole.SUPER_ADMIN)
  @Put('subscription')
  update(@Body() dto: UpdateSubscriptionDto) {
    return this.service.update(dto);
  }

  @Roles(SystemRole.SUPER_ADMIN, SystemRole.ASSET_ADMINISTRATOR)
  @Get('usage')
  usage() {
    return this.service.usage();
  }
}
