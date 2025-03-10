import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { Address } from './entities/address.entity';
import { AddressController } from './controllers/address.controller';
import { AddressService } from './services/address.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Address]), SharedModule],
  controllers: [UsersController, AddressController],
  providers: [UsersService, AddressService],
  exports: [UsersService, AddressService],
})
export class UsersModule {}
