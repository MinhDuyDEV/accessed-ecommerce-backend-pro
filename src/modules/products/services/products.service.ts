import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import {
  Product,
  ProductStatus,
  ProductType,
} from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { Category } from '../../categories/entities/category.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ShopsService } from '../../shops/shops.service';
import { ProductSearchService } from '../../elasticsearch/product-search.service';

// Interface cho sản phẩm với các trường bổ sung
export interface ProductWithImageUrl extends Omit<Product, 'imageUrl'> {
  imageUrl?: string;
}

// Tạo interface mới cho chi tiết sản phẩm
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  status: ProductStatus;
  type: ProductType;
  price: string | number;
  compareAtPrice: string | number;
  quantity: number;
  isFeatured: boolean;
  soldCount: number;
  averageRating: string | number;
  reviewCount: number;
  weight: string | number;
  weightUnit: string;
  tags: string[];
  brand: string;
  imageUrl: string;
  shopId: string;
  images: {
    id: string;
    url: string;
    alt: string;
    isDefault: boolean;
    order: number;
  }[];
  variants: {
    id: string;
    name: string;
    price: string | number;
    compareAtPrice: string | number;
    quantity: number;
    options: {
      name: string;
      value: string;
    }[];
    imageUrl: string;
  }[];
  attributes: {
    id: string;
    name: string;
    values: string[];
    isVariant: boolean;
    isRequired: boolean;
    isVisible: boolean;
    order: number;
  }[];
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

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
    private productSearchService: ProductSearchService,
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

    try {
      // Tạo sản phẩm mới (không bao gồm các thực thể con)
      const product = this.productRepository.create({
        ...createProductDto,
        shopId: shop.id,
        variants: undefined,
        images: undefined,
        attributes: undefined,
        // Sử dụng imageUrl từ DTO nếu được cung cấp
        imageUrl: createProductDto.imageUrl || undefined,
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

      // Lưu sản phẩm (không bao gồm các thực thể con)
      const savedProduct = await this.productRepository.save(product);

      // Xử lý variants nếu có
      if (createProductDto.variants && createProductDto.variants.length > 0) {
        const variants = createProductDto.variants.map((variantDto) => ({
          ...variantDto,
          productId: savedProduct.id,
        }));
        await this.variantRepository.save(variants);
      }

      // Xử lý images nếu có
      if (createProductDto.images && createProductDto.images.length > 0) {
        const images = createProductDto.images.map((imageDto) => ({
          ...imageDto,
          productId: savedProduct.id,
        }));
        const savedImages = await this.imageRepository.save(images);

        // Chỉ cập nhật imageUrl nếu chưa được cung cấp trong DTO
        if (!createProductDto.imageUrl) {
          // Cập nhật imageUrl từ hình ảnh mặc định hoặc hình ảnh đầu tiên
          const defaultImage =
            savedImages.find((img) => img.isDefault) || savedImages[0];
          if (defaultImage) {
            await this.productRepository.update(savedProduct.id, {
              imageUrl: defaultImage.url,
            });
          }
        }
      }

      // Xử lý attributes nếu có
      if (
        createProductDto.attributes &&
        createProductDto.attributes.length > 0
      ) {
        const attributes = createProductDto.attributes.map((attributeDto) => ({
          ...attributeDto,
          productId: savedProduct.id,
        }));
        await this.attributeRepository.save(attributes);
      }

      // Trả về sản phẩm đã được định dạng thông qua findOne
      const finalProduct = (await this.findOne(
        savedProduct.id,
      )) as unknown as Product;

      // Index sản phẩm vào Elasticsearch
      try {
        await this.productSearchService.indexProduct(finalProduct);
      } catch (error) {
        console.error('Failed to index product in Elasticsearch:', error);
        // Không throw lỗi ở đây để không ảnh hưởng đến luồng chính
      }

      return finalProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
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
  }): Promise<{ products: ProductWithImageUrl[]; total: number }> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
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

    if (options?.minPrice !== undefined && !isNaN(options.minPrice)) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: options.minPrice,
      });
    }

    if (options?.maxPrice !== undefined && !isNaN(options.maxPrice)) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: options.maxPrice,
      });
    }

    // Đếm tổng số sản phẩm
    const total = await queryBuilder.getCount();

    // Áp dụng sắp xếp
    if (options?.sort) {
      const [field, order] = options.sort.split(':');
      queryBuilder.orderBy(
        `product.${field}`,
        order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      );
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // Áp dụng phân trang
    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    // Lấy dữ liệu
    const products = await queryBuilder.getMany();

    // Xử lý dữ liệu trước khi trả về
    const processedProducts = products.map((product) => {
      // Chỉ lấy các trường cần thiết
      const simplifiedProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        status: product.status,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        quantity: product.quantity,
        isFeatured: product.isFeatured,
        soldCount: product.soldCount,
        averageRating: product.averageRating,
        reviewCount: product.reviewCount,
        weight: product.weight,
        weightUnit: product.weightUnit,
        tags: product.tags,
        brand: product.brand,
        imageUrl: product.imageUrl,
        shopId: product.shopId,
        categories: product.categories
          ? product.categories.map((category) => ({
              id: category.id,
              name: category.name,
              slug: category.slug,
            }))
          : [],
      } as ProductWithImageUrl;

      return simplifiedProduct;
    });

    return {
      products: processedProducts,
      total,
    };
  }

  async findOne(id: string): Promise<ProductDetail> {
    // Sử dụng raw query để lấy sản phẩm và các mối quan hệ
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        images: true,
        variants: true,
        attributes: true,
        categories: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.formatProductDetail(product);
  }

  async findBySlug(slug: string): Promise<ProductDetail> {
    // Sử dụng raw query để lấy sản phẩm và các mối quan hệ
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: {
        images: true,
        variants: true,
        attributes: true,
        categories: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    return this.formatProductDetail(product);
  }

  // Phương thức hỗ trợ để định dạng chi tiết sản phẩm
  private formatProductDetail(product: Product): ProductDetail {
    // Xử lý variants - loại bỏ trùng lặp dựa trên ID
    const uniqueVariants = [];
    const variantIds = new Set<string>();

    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (!variantIds.has(variant.id)) {
          variantIds.add(variant.id);
          uniqueVariants.push({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            quantity: variant.quantity,
            options: variant.options,
            imageUrl: variant.imageUrl,
          });
        }
      }
    }

    // Xử lý images - loại bỏ trùng lặp dựa trên ID
    const uniqueImages = [];
    const imageIds = new Set<string>();

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (!imageIds.has(image.id)) {
          imageIds.add(image.id);
          uniqueImages.push({
            id: image.id,
            url: image.url,
            alt: image.alt,
            isDefault: image.isDefault,
            order: image.order,
          });
        }
      }
    }

    // Xử lý attributes - loại bỏ trùng lặp dựa trên ID
    const uniqueAttributes = [];
    const attributeIds = new Set<string>();

    if (product.attributes && product.attributes.length > 0) {
      for (const attr of product.attributes) {
        if (!attributeIds.has(attr.id)) {
          attributeIds.add(attr.id);
          uniqueAttributes.push({
            id: attr.id,
            name: attr.name,
            values: attr.values,
            isVariant: attr.isVariant,
            isRequired: attr.isRequired,
            isVisible: attr.isVisible,
            order: attr.order,
          });
        }
      }
    }

    // Xử lý categories - loại bỏ trùng lặp dựa trên ID
    const uniqueCategories = [];
    const categoryIds = new Set<string>();

    if (product.categories && product.categories.length > 0) {
      for (const category of product.categories) {
        if (!categoryIds.has(category.id)) {
          categoryIds.add(category.id);
          uniqueCategories.push({
            id: category.id,
            name: category.name,
            slug: category.slug,
          });
        }
      }
    }

    // Tạo đối tượng chi tiết sản phẩm đã được tối ưu
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      status: product.status,
      type: product.type,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: product.quantity,
      isFeatured: product.isFeatured,
      soldCount: product.soldCount,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      weight: product.weight,
      weightUnit: product.weightUnit,
      tags: product.tags,
      brand: product.brand,
      imageUrl:
        product.imageUrl ||
        (uniqueImages.length > 0 ? uniqueImages[0].url : null),
      shopId: product.shopId,

      // Sử dụng các mảng đã được xử lý
      variants: uniqueVariants,
      images: uniqueImages,
      attributes: uniqueAttributes,
      categories: uniqueCategories,
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    // Lấy thông tin chi tiết sản phẩm để kiểm tra
    const productDetail = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(productDetail.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    // Lấy sản phẩm gốc từ repository để cập nhật
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variants', 'images', 'attributes', 'categories'],
    });

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

    // Nếu có cập nhật trực tiếp imageUrl, sử dụng giá trị đó
    if (updateProductDto.imageUrl) {
      product.imageUrl = updateProductDto.imageUrl;
    }
    // Nếu có cập nhật hình ảnh, cập nhật lại imageUrl (chỉ khi không có imageUrl trực tiếp)
    else if (updateProductDto.images && updateProductDto.images.length > 0) {
      // Xóa hình ảnh cũ
      await this.imageRepository.delete({ productId: id });

      // Thêm hình ảnh mới
      const images = updateProductDto.images.map((imageDto) =>
        this.imageRepository.create({
          ...imageDto,
          productId: id,
        }),
      );

      const savedImages = await this.imageRepository.save(images);

      // Cập nhật imageUrl từ hình ảnh mặc định hoặc hình ảnh đầu tiên
      const defaultImage =
        savedImages.find((img) => img.isDefault) || savedImages[0];
      if (defaultImage) {
        product.imageUrl = defaultImage.url;
      }
    }

    // Cập nhật variants nếu có
    if (updateProductDto.variants && updateProductDto.variants.length > 0) {
      // Xóa variants cũ
      await this.variantRepository.delete({ productId: id });

      // Thêm variants mới
      const variants = updateProductDto.variants.map((variantDto) =>
        this.variantRepository.create({
          ...variantDto,
          productId: id,
        }),
      );

      await this.variantRepository.save(variants);
    }

    // Cập nhật attributes nếu có
    if (updateProductDto.attributes && updateProductDto.attributes.length > 0) {
      // Xóa attributes cũ
      await this.attributeRepository.delete({ productId: id });

      // Thêm attributes mới
      const attributes = updateProductDto.attributes.map((attributeDto) =>
        this.attributeRepository.create({
          ...attributeDto,
          productId: id,
        }),
      );

      await this.attributeRepository.save(attributes);
    }

    // Cập nhật categories nếu có
    if (
      updateProductDto.categoryIds &&
      updateProductDto.categoryIds.length > 0
    ) {
      const categories = await this.categoryRepository.find({
        where: { id: In(updateProductDto.categoryIds) },
      });

      if (categories.length !== updateProductDto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }

      product.categories = categories;
    }

    // Lưu sản phẩm đã cập nhật vào database
    const updatedProduct = await this.productRepository.save(product);

    // Cập nhật sản phẩm trong Elasticsearch
    try {
      await this.productSearchService.updateProduct(updatedProduct);
    } catch (error) {
      console.error('Failed to update product in Elasticsearch:', error);
      // Không throw lỗi ở đây để không ảnh hưởng đến luồng chính
    }

    return updatedProduct;
  }

  async updateStatus(
    id: string,
    status: ProductStatus,
    userId: string,
  ): Promise<Product> {
    // Lấy thông tin chi tiết sản phẩm để kiểm tra
    const productDetail = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(productDetail.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    // Lấy sản phẩm gốc từ repository để cập nhật
    const product = await this.productRepository.findOne({
      where: { id },
    });

    product.status = status;

    // Lưu sản phẩm đã cập nhật vào database
    const updatedProduct = await this.productRepository.save(product);

    // Cập nhật sản phẩm trong Elasticsearch
    try {
      await this.productSearchService.updateProduct(updatedProduct);
    } catch (error) {
      console.error('Failed to update product status in Elasticsearch:', error);
      // Không throw lỗi ở đây để không ảnh hưởng đến luồng chính
    }

    return updatedProduct;
  }

  async remove(id: string, userId: string): Promise<void> {
    // Lấy thông tin chi tiết sản phẩm để kiểm tra
    const productDetail = await this.findOne(id);

    // Kiểm tra quyền sở hữu
    const shop = await this.shopsService.findOne(productDetail.shopId);
    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    await this.productRepository.softDelete(id);

    // Xóa sản phẩm khỏi Elasticsearch
    try {
      await this.productSearchService.removeProduct(id);
    } catch (error) {
      console.error('Failed to remove product from Elasticsearch:', error);
      // Không throw lỗi ở đây để không ảnh hưởng đến luồng chính
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.productRepository.increment({ id }, 'viewCount', 1);
  }
}
