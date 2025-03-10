import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PolicyGuard } from '../../auth/guards/policy.guard';
import { Policy } from '../../auth/decorators/policy.decorator';
import { CreateAddressDto } from '../dto/create-address.dto';
import { AddressService } from '../services/address.service';
import { UpdateAddressDto } from '../dto/update-address.dto';

@Controller('users/:userId/addresses')
@UseGuards(JwtAuthGuard, PolicyGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @Policy('create', 'address')
  create(
    @Param('userId') userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressService.create(userId, createAddressDto);
  }

  @Get()
  @Policy('read', 'address')
  findAll(@Param('userId') userId: string) {
    return this.addressService.findAllByUserId(userId);
  }

  @Get(':id')
  @Policy('read', 'address')
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.addressService.findOne(id, userId);
  }

  @Patch(':id')
  @Policy('update', 'address')
  update(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressService.update(id, userId, updateAddressDto);
  }

  @Delete(':id')
  @Policy('delete', 'address')
  remove(@Param('userId') userId: string, @Param('id') id: string) {
    return this.addressService.remove(id, userId);
  }

  @Patch(':id/set-default')
  @Policy('update', 'address')
  setDefault(@Param('userId') userId: string, @Param('id') id: string) {
    return this.addressService.setDefault(id, userId);
  }
}
