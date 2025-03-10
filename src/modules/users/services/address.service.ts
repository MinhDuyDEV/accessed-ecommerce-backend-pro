import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';

import { UsersService } from './users.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private usersService: UsersService,
  ) {}

  async create(
    userId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    // Kiểm tra xem user có tồn tại không
    await this.usersService.findOne(userId);

    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
    });

    // Nếu là địa chỉ mặc định, cập nhật các địa chỉ khác
    if (createAddressDto.isDefault) {
      await this.addressRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    return this.addressRepository.save(address);
  }

  async findAllByUserId(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${id} not found for user ${userId}`,
      );
    }

    return address;
  }

  async update(
    id: string,
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    // Nếu đang cập nhật thành địa chỉ mặc định
    if (updateAddressDto.isDefault && !address.isDefault) {
      await this.addressRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);

    // Không cho phép xóa địa chỉ mặc định nếu có nhiều địa chỉ
    if (address.isDefault) {
      const addressCount = await this.addressRepository.count({
        where: { userId },
      });
      if (addressCount > 1) {
        throw new BadRequestException(
          'Cannot delete default address. Please set another address as default first.',
        );
      }
    }

    await this.addressRepository.remove(address);
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    const address = await this.findOne(id, userId);

    if (address.isDefault) {
      return address; // Đã là mặc định rồi
    }

    // Cập nhật tất cả địa chỉ khác thành không mặc định
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // Cập nhật địa chỉ này thành mặc định
    address.isDefault = true;
    return this.addressRepository.save(address);
  }
}
