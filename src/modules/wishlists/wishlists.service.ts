import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { CreateWishlistItemDto } from './dto/create-wishlist-item.dto';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  async create(
    userId: string,
    createWishlistDto: CreateWishlistDto,
  ): Promise<Wishlist> {
    const wishlist = this.wishlistRepository.create({
      userId,
      ...createWishlistDto,
    });

    return this.wishlistRepository.save(wishlist);
  }

  async findAll(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { userId },
      relations: ['items', 'items.product', 'items.variant'],
    });
  }

  async findPublic(): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { isPublic: true },
      relations: ['items', 'items.product', 'items.variant', 'user'],
    });
  }

  async findOne(id: string, userId?: string): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.variant', 'user'],
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with ID ${id} not found`);
    }

    // Nếu danh sách không công khai và người dùng không phải là chủ sở hữu
    if (!wishlist.isPublic && userId !== wishlist.userId) {
      throw new ForbiddenException(
        'You do not have permission to access this wishlist',
      );
    }

    return wishlist;
  }

  async update(
    id: string,
    userId: string,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<Wishlist> {
    const wishlist = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this wishlist',
      );
    }

    // Áp dụng cập nhật
    Object.assign(wishlist, updateWishlistDto);

    return this.wishlistRepository.save(wishlist);
  }

  async remove(id: string, userId: string): Promise<void> {
    const wishlist = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this wishlist',
      );
    }

    await this.wishlistRepository.remove(wishlist);
  }

  async addItem(
    wishlistId: string,
    userId: string,
    createWishlistItemDto: CreateWishlistItemDto,
  ): Promise<Wishlist> {
    const wishlist = await this.findOne(wishlistId);

    // Kiểm tra quyền sở hữu
    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add items to this wishlist',
      );
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await this.productRepository.findOne({
      where: { id: createWishlistItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createWishlistItemDto.productId} not found`,
      );
    }

    // Kiểm tra biến thể tồn tại nếu được cung cấp
    if (createWishlistItemDto.variantId) {
      const variant = await this.productVariantRepository.findOne({
        where: {
          id: createWishlistItemDto.variantId,
          productId: createWishlistItemDto.productId,
        },
      });

      if (!variant) {
        throw new NotFoundException(
          `Product variant with ID ${createWishlistItemDto.variantId} not found`,
        );
      }
    }

    // Kiểm tra xem sản phẩm đã tồn tại trong danh sách yêu thích chưa
    const existingItem = wishlist.items.find(
      (item) =>
        item.productId === createWishlistItemDto.productId &&
        item.variantId === createWishlistItemDto.variantId,
    );

    if (existingItem) {
      // Nếu sản phẩm đã tồn tại, cập nhật ghi chú và ưu tiên nếu được cung cấp
      if (createWishlistItemDto.note !== undefined) {
        existingItem.note = createWishlistItemDto.note;
      }

      if (createWishlistItemDto.priority !== undefined) {
        existingItem.priority = createWishlistItemDto.priority;
      }

      await this.wishlistItemRepository.save(existingItem);
    } else {
      // Tạo mục mới
      const newItem = this.wishlistItemRepository.create({
        wishlistId,
        ...createWishlistItemDto,
      });

      await this.wishlistItemRepository.save(newItem);
    }

    return this.findOne(wishlistId);
  }

  async updateItem(
    wishlistId: string,
    itemId: string,
    userId: string,
    updateWishlistItemDto: UpdateWishlistItemDto,
  ): Promise<Wishlist> {
    const wishlist = await this.findOne(wishlistId);

    // Kiểm tra quyền sở hữu
    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update items in this wishlist',
      );
    }

    const item = wishlist.items.find((item) => item.id === itemId);
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${itemId} not found`);
    }

    // Áp dụng cập nhật
    Object.assign(item, updateWishlistItemDto);

    await this.wishlistItemRepository.save(item);

    return this.findOne(wishlistId);
  }

  async removeItem(
    wishlistId: string,
    itemId: string,
    userId: string,
  ): Promise<Wishlist> {
    const wishlist = await this.findOne(wishlistId);

    // Kiểm tra quyền sở hữu
    if (wishlist.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to remove items from this wishlist',
      );
    }

    const item = wishlist.items.find((item) => item.id === itemId);
    if (!item) {
      throw new NotFoundException(`Wishlist item with ID ${itemId} not found`);
    }

    await this.wishlistItemRepository.remove(item);

    return this.findOne(wishlistId);
  }

  async getDefaultWishlist(userId: string): Promise<Wishlist> {
    // Tìm danh sách yêu thích mặc định hoặc tạo mới nếu chưa có
    let defaultWishlist = await this.wishlistRepository.findOne({
      where: { userId, name: 'Default' },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!defaultWishlist) {
      defaultWishlist = await this.create(userId, {
        name: 'Default',
        description: 'Default wishlist',
        isPublic: false,
      });
    }

    return defaultWishlist;
  }

  async addToDefaultWishlist(
    userId: string,
    createWishlistItemDto: CreateWishlistItemDto,
  ): Promise<Wishlist> {
    const defaultWishlist = await this.getDefaultWishlist(userId);

    return this.addItem(defaultWishlist.id, userId, createWishlistItemDto);
  }

  async checkIfProductInWishlist(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<boolean> {
    const wishlists = await this.findAll(userId);

    for (const wishlist of wishlists) {
      const found = wishlist.items.some(
        (item) =>
          item.productId === productId &&
          (variantId ? item.variantId === variantId : true),
      );

      if (found) {
        return true;
      }
    }

    return false;
  }
}
