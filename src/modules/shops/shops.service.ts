import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Shop, ShopStatus } from './entities/shop.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { User } from '../users/entities/user.entity';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
  ) {}

  async create(createShopDto: CreateShopDto, owner: User): Promise<Shop> {
    // Kiểm tra tên shop đã tồn tại chưa
    const existingShop = await this.shopsRepository.findOne({
      where: [{ name: createShopDto.name }, { slug: createShopDto.slug }],
    });

    if (existingShop) {
      throw new ConflictException('Shop name or slug already exists');
    }

    // Kiểm tra user đã có shop chưa
    const existingUserShop = await this.shopsRepository.findOne({
      where: { ownerId: owner.id },
    });

    if (existingUserShop) {
      throw new ConflictException('User already has a shop');
    }

    // Đảm bảo ownerId được gán đúng
    const shop = this.shopsRepository.create({
      ...createShopDto,
      ownerId: owner.id,
    });

    // Lưu shop vào database
    const savedShop = await this.shopsRepository.save(shop);

    // Gán shop cho owner
    owner.shop = savedShop;

    return savedShop;
  }

  async findAll(options?: {
    status?: ShopStatus;
    isFeatured?: boolean;
    isVerified?: boolean;
  }): Promise<Shop[]> {
    const queryBuilder = this.shopsRepository.createQueryBuilder('shop');

    if (options?.status) {
      queryBuilder.andWhere('shop.status = :status', {
        status: options.status,
      });
    }

    if (options?.isFeatured !== undefined) {
      queryBuilder.andWhere('shop.isFeatured = :isFeatured', {
        isFeatured: options.isFeatured,
      });
    }

    if (options?.isVerified !== undefined) {
      queryBuilder.andWhere('shop.isVerified = :isVerified', {
        isVerified: options.isVerified,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    return shop;
  }

  async findBySlug(slug: string): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({
      where: { slug },
      relations: ['owner'],
    });

    if (!shop) {
      throw new NotFoundException(`Shop with slug ${slug} not found`);
    }

    return shop;
  }

  async findByOwnerId(ownerId: string): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({
      where: { ownerId },
    });

    if (!shop) {
      throw new NotFoundException(`Shop for user with ID ${ownerId} not found`);
    }

    return shop;
  }

  async update(
    id: string,
    updateShopDto: UpdateShopDto,
    userId: string,
  ): Promise<Shop> {
    const shop = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this shop',
      );
    }

    // Kiểm tra nếu cập nhật name hoặc slug
    if (updateShopDto.name || updateShopDto.slug) {
      const existingShop = await this.shopsRepository.findOne({
        where: [
          { name: updateShopDto.name, id: Not(id) },
          { slug: updateShopDto.slug, id: Not(id) },
        ],
      });

      if (existingShop) {
        throw new ConflictException('Shop name or slug already exists');
      }
    }

    Object.assign(shop, updateShopDto);
    return this.shopsRepository.save(shop);
  }

  async updateStatus(id: string, status: ShopStatus): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.status = status;
    return this.shopsRepository.save(shop);
  }

  async verifyShop(id: string): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.isVerified = true;
    shop.verifiedAt = new Date();
    return this.shopsRepository.save(shop);
  }

  async featureShop(id: string, isFeatured: boolean): Promise<Shop> {
    const shop = await this.findOne(id);
    shop.isFeatured = isFeatured;
    return this.shopsRepository.save(shop);
  }

  async getShopAnalytics(id: string): Promise<any> {
    // Đảm bảo shop tồn tại
    await this.findOne(id);

    // Triển khai logic phân tích dữ liệu shop
    // Đây chỉ là dữ liệu mẫu, bạn cần triển khai logic thực tế
    return {
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      revenueByMonth: [],
      topProducts: [],
      customerDemographics: {},
    };
  }

  async getShopStaff(id: string): Promise<any[]> {
    // Đảm bảo shop tồn tại
    await this.findOne(id);

    // Triển khai logic lấy danh sách nhân viên shop
    // Đây chỉ là dữ liệu mẫu, bạn cần triển khai logic thực tế
    return [];
  }

  async addShopStaff(id: string, userId: string, role: string): Promise<any> {
    // Đảm bảo shop tồn tại
    await this.findOne(id);

    // Triển khai logic thêm nhân viên shop
    // Đây chỉ là dữ liệu mẫu, bạn cần triển khai logic thực tế
    return {
      id: userId,
      shopId: id,
      role: role,
      addedAt: new Date(),
    };
  }

  async removeShopStaff(id: string, staffUserId: string): Promise<void> {
    // Đảm bảo shop tồn tại
    await this.findOne(id);

    // Triển khai logic xóa nhân viên shop
    // Đây chỉ là dữ liệu mẫu, bạn cần triển khai logic thực tế
    console.log(`Removing staff ${staffUserId} from shop ${id}`);
  }

  async remove(id: string, userId: string): Promise<void> {
    const shop = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this shop',
      );
    }

    await this.shopsRepository.softDelete(id);
  }
}
