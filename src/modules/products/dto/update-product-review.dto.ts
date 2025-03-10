import { PartialType } from '@nestjs/mapped-types';
import { CreateProductReviewDto } from './create-product-review.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ReviewStatus } from '../entities/product-review.entity';

export class UpdateProductReviewDto extends PartialType(
  CreateProductReviewDto,
) {
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;
}
