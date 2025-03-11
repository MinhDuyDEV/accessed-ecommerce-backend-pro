import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { BecomeSellerDto } from '../dto/become-seller.dto';
// Sửa lại đường dẫn import để tránh sử dụng alias path
import { ShopsService } from '../../shops/shops.service';
import { RoleService } from '../../auth/services/role.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,
    private readonly shopsService: ShopsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneWithRoles(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOneWithAddresses(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async findByRoleId(roleId: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .getMany();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async becomeSeller(userId: string, becomeSellerDto: BecomeSellerDto) {
    // Tìm user
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'shop'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Kiểm tra xem user đã là seller chưa
    const isAlreadySeller = user.roles.some((role) => role.name === 'seller');
    if (isAlreadySeller) {
      throw new BadRequestException('User is already a seller');
    }

    // Kiểm tra xem user đã có shop chưa
    if (user.shop) {
      throw new BadRequestException('User already has a shop');
    }

    // Lấy seller role
    const sellerRole = await this.roleService.findByName('seller');
    if (!sellerRole) {
      throw new NotFoundException('Seller role not found');
    }

    // Tạo slug từ tên shop
    const slug = becomeSellerDto.shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Cập nhật thông tin seller profile trước
    user.isVerifiedSeller = false;
    user.sellerProfile = {
      shopName: becomeSellerDto.shopName,
      description: becomeSellerDto.description,
      address:
        `${becomeSellerDto.address || ''}, ${becomeSellerDto.ward || ''}, ${becomeSellerDto.district || ''}, ${becomeSellerDto.city || ''}, ${becomeSellerDto.country || ''}`
          .replace(/^,\s*|,\s*$|(?:,\s*)+/g, ', ')
          .trim(),
      verificationStatus: 'pending',
    };

    // Thêm seller role cho user
    user.roles.push(sellerRole);

    // Lưu user trước
    const savedUser = await this.usersRepository.save(user);

    // Tạo shop mới với ownerId được gán trực tiếp
    const shopData = {
      name: becomeSellerDto.shopName,
      slug,
      description: becomeSellerDto.description,
      logo: becomeSellerDto.logo,
      banner: becomeSellerDto.banner,
      businessInfo: {
        address: becomeSellerDto.address,
        city: becomeSellerDto.city,
        state: becomeSellerDto.district,
        country: becomeSellerDto.country,
        postalCode: becomeSellerDto.postalCode,
        phoneNumber: becomeSellerDto.phoneNumber,
      },
      ownerId: userId,
    };

    const shop = await this.shopsService.create(shopData, savedUser);

    return {
      message: 'Successfully registered as a seller',
      shop,
    };
  }
}
