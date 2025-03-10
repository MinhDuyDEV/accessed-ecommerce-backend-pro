import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductReview } from './entities/product-review.entity';
import { ProductsController } from './controllers/products.controller';
import { ProductVariantsController } from './controllers/product-variants.controller';
import { ProductReviewsController } from './controllers/product-reviews.controller';
import { ProductsService } from './services/products.service';
import { ProductVariantsService } from './services/product-variants.service';
import { ProductReviewsService } from './services/product-reviews.service';
import { ShopsModule } from '../shops/shops.module';
import { SharedModule } from '../shared/shared.module';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductImage,
      ProductAttribute,
      ProductReview,
      Category,
    ]),
    ShopsModule,
    SharedModule,
  ],
  controllers: [
    ProductsController,
    ProductVariantsController,
    ProductReviewsController,
  ],
  providers: [ProductsService, ProductVariantsService, ProductReviewsService],
  exports: [ProductsService, ProductVariantsService, ProductReviewsService],
})
export class ProductsModule {}
