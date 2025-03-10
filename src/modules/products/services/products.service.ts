import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { Category } from '../../categories/entities/category.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ShopsService } from '../../shops/shops.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
    @InjectRepository(ProductAttribute)
    private attributeRepository: Repository<ProductAttribute>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private shopsService: ShopsService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product> {
    // Kiểm tra shop tồn tại và người dùng có quyền
    const shop = await this.shopsService.findOne(createProductDto.shopId);

    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create products for this shop',
      );
    }

    // Kiểm tra slug đã tồn tại chưa
    const existingProduct = await this.productRepository.findOne({
      where: { slug: createProductDto.slug },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists');
    }

    // Tạo sản phẩm mới
    const product = this.productRepository.create({
      ...createProductDto,
      shopId: shop.id,
    });

    // Xử lý categories nếu có
    if (
      createProductDto.categoryIds &&
      createProductDto.categoryIds.length > 0
    ) {
      const categories = await this.categoryRepository.find({
        where: { id: In(createProductDto.categoryIds) },
      });

      if (categories.length !== createProductDto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }

      product.categories = categories;
    }

    // Lưu sản phẩm
    const savedProduct = await this.productRepository.save(product);

    // Xử lý variants nếu có
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      const variants = createProductDto.variants.map((variantDto) =>
        this.variantRepository.create({
          ...variantDto,
          productId: savedProduct.id,
        }),
      );

      const savedVariants = await this.variantRepository.save(variants);
      savedProduct.variants = savedVariants;
    }

    // Xử lý images nếu có
    if (createProductDto.images && createProductDto.images.length > 0) {
      const images = createProductDto.images.map((imageDto) =>
        this.imageRepository.create({
          ...imageDto,
          productId: savedProduct.id,
        }),
      );

      const savedImages = await this.imageRepository.save(images);
      savedProduct.images = savedImages;
    }

    // Xử lý attributes nếu có
    if (createProductDto.attributes && createProductDto.attributes.length > 0) {
      const attributes = createProductDto.attributes.map((attributeDto) =>
        this.attributeRepository.create({
          ...attributeDto,
          productId: savedProduct.id,
        }),
      );

      const savedAttributes = await this.attributeRepository.save(attributes);
      savedProduct.attributes = savedAttributes;
    }

    return savedProduct;
  }

  async findAll(options?: {
    status?: ProductStatus;
    shopId?: string;
    categoryId?: string;
    isFeatured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.categories', 'category');

    // Áp dụng các điều kiện lọc
    if (options?.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: options.status,
      });
    }

    if (options?.shopId) {
      queryBuilder.andWhere('product.shopId = :shopId', {
        shopId: options.shopId,
      });
    }

    if (options?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: options.categoryId,
      });
    }

    if (options?.isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', {
        isFeatured: options.isFeatured,
      });
    }

    if (options?.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    if (options?.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: options.minPrice,
      });
    }

    if (options?.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: options.maxPrice,
      });
    }

    // Sắp xếp
    if (options?.sort) {
      const [field, order] = options.sort.split(':');
      queryBuilder.orderBy(
        `product.${field}`,
        order.toUpperCase() as 'ASC' | 'DESC',
      );
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // Phân trang
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    queryBuilder.take(limit).skip(offset);

    const [products, total] = await queryBuilder.getManyAndCount();

    return { products, total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variants', 'images', 'attributes', 'categories'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['variants', 'images', 'attributes', 'categories'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(product.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    // Kiểm tra slug nếu có cập nhật
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug, id: Not(id) },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    // Cập nhật thông tin cơ bản
    Object.assign(product, updateProductDto);

    // Cập nhật categories nếu có
    if (updateProductDto.categoryIds) {
      const categories = await this.categoryRepository.find({
        where: { id: In(updateProductDto.categoryIds) },
      });

      if (categories.length !== updateProductDto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }

      product.categories = categories;
    }

    // Lưu sản phẩm
    return this.productRepository.save(product);
  }

  async updateStatus(
    id: string,
    status: ProductStatus,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(product.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    product.status = status;
    return this.productRepository.save(product);
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(product.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    await this.productRepository.softDelete(id);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.productRepository.increment({ id }, 'viewCount', 1);
  }
}
