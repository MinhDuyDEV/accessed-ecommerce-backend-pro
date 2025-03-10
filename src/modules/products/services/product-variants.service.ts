import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';
import { Product } from '../entities/product.entity';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { ShopsService } from '../../shops/shops.service';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private shopsService: ShopsService,
  ) {}

  async create(
    productId: string,
    createVariantDto: CreateProductVariantDto,
    userId: string,
  ): Promise<ProductVariant> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(product.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add variants to this product',
      );
    }

    const variant = this.variantRepository.create({
      ...createVariantDto,
      productId,
    });

    return this.variantRepository.save(variant);
  }

  async findAll(productId: string): Promise<ProductVariant[]> {
    return this.variantRepository.find({
      where: { productId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    return variant;
  }

  async update(
    id: string,
    updateVariantDto: UpdateProductVariantDto,
    userId: string,
  ): Promise<ProductVariant> {
    const variant = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(variant.product.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this variant',
      );
    }

    Object.assign(variant, updateVariantDto);
    return this.variantRepository.save(variant);
  }

  async remove(id: string, userId: string): Promise<void> {
    const variant = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(variant.product.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this variant',
      );
    }

    await this.variantRepository.remove(variant);
  }
}
