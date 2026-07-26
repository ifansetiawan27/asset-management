import { Controller, Get } from '@nestjs/common';

import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.service.findAll();
  }
}
