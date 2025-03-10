import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview, ReviewStatus } from '../entities/product-review.entity';
import { Product } from '../entities/product.entity';
import { CreateProductReviewDto } from '../dto/create-product-review.dto';
import { UpdateProductReviewDto } from '../dto/update-product-review.dto';
import { ShopsService } from '../../shops/shops.service';

@Injectable()
export class ProductReviewsService {
  constructor(
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private shopsService: ShopsService,
  ) {}

  async create(
    productId: string,
    createReviewDto: CreateProductReviewDto,
    userId: string,
  ): Promise<ProductReview> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await this.reviewRepository.findOne({
      where: { productId, userId },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      productId,
      userId,
      status: ReviewStatus.PENDING,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Cập nhật thông tin đánh giá trung bình của sản phẩm
    await this.updateProductRating(productId);

    return savedReview;
  }

  async findAll(
    productId: string,
    options?: {
      status?: ReviewStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ reviews: ProductReview[]; total: number }> {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .where('review.productId = :productId', { productId })
      .leftJoinAndSelect('review.user', 'user');

    if (options?.status) {
      queryBuilder.andWhere('review.status = :status', {
        status: options.status,
      });
    } else {
      // Mặc định chỉ hiển thị các đánh giá đã được phê duyệt
      queryBuilder.andWhere('review.status = :status', {
        status: ReviewStatus.APPROVED,
      });
    }

    queryBuilder.orderBy('review.createdAt', 'DESC');

    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    queryBuilder.take(limit).skip(offset);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return { reviews, total };
  }

  async findOne(id: string): Promise<ProductReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateProductReviewDto,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<ProductReview> {
    const review = await this.findOne(id);

    // Chỉ người tạo đánh giá hoặc admin mới có thể cập nhật
    if (review.userId !== userId && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this review',
      );
    }

    // Nếu không phải admin, không cho phép cập nhật trạng thái
    if (!isAdmin && updateReviewDto.status) {
      delete updateReviewDto.status;
    }

    Object.assign(review, updateReviewDto);
    const updatedReview = await this.reviewRepository.save(review);

    // Nếu cập nhật rating, cập nhật lại rating trung bình của sản phẩm
    if (updateReviewDto.rating) {
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  async updateStatus(
    id: string,
    status: ReviewStatus,
    userId: string,
  ): Promise<ProductReview> {
    const review = await this.findOne(id);

    // Kiểm tra quyền sở hữu shop
    const product = await this.productRepository.findOne({
      where: { id: review.productId },
    });
    const shop = await this.shopsService.findOne(product.shopId);

    if (shop.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this review status',
      );
    }

    review.status = status;
    const updatedReview = await this.reviewRepository.save(review);

    // Cập nhật lại rating trung bình của sản phẩm nếu trạng thái thay đổi
    await this.updateProductRating(review.productId);

    return updatedReview;
  }

  async remove(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    const review = await this.findOne(id);

    // Chỉ người tạo đánh giá, chủ shop hoặc admin mới có thể xóa
    if (review.userId !== userId && !isAdmin) {
      const product = await this.productRepository.findOne({
        where: { id: review.productId },
      });
      const shop = await this.shopsService.findOne(product.shopId);

      if (shop.ownerId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to delete this review',
        );
      }
    }

    await this.reviewRepository.remove(review);

    // Cập nhật lại rating trung bình của sản phẩm
    await this.updateProductRating(review.productId);
  }

  async markHelpful(id: string, userId: string): Promise<ProductReview> {
    console.log('userId', userId);
    const review = await this.findOne(id);

    // Tăng số lượng helpful
    review.helpfulCount += 1;
    return this.reviewRepository.save(review);
  }

  private async updateProductRating(productId: string): Promise<void> {
    // Lấy tất cả đánh giá đã được phê duyệt của sản phẩm
    const reviews = await this.reviewRepository.find({
      where: { productId, status: ReviewStatus.APPROVED },
    });

    if (reviews.length === 0) {
      // Nếu không có đánh giá, đặt rating về 0
      await this.productRepository.update(productId, {
        averageRating: 0,
        reviewCount: 0,
      });
      return;
    }

    // Tính toán rating trung bình
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Cập nhật sản phẩm
    await this.productRepository.update(productId, {
      averageRating,
      reviewCount: reviews.length,
    });
  }
}
