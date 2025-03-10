import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductReviewsService } from '../services/product-reviews.service';
import { CreateProductReviewDto } from '../dto/create-product-review.dto';
import { UpdateProductReviewDto } from '../dto/update-product-review.dto';
import { ReviewStatus } from '../entities/product-review.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permission.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('products/:productId/reviews')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ProductReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('productId') productId: string,
    @Body() createReviewDto: CreateProductReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.create(productId, createReviewDto, user.id);
  }

  @Get()
  findAll(
    @Param('productId') productId: string,
    @Query('status') status?: ReviewStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.reviewsService.findAll(productId, { status, limit, offset });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateProductReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.update(id, updateReviewDto, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:update')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReviewStatus,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.updateStatus(id, status, user.id);
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  markHelpful(@Param('id') id: string, @CurrentUser() user: User) {
    return this.reviewsService.markHelpful(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.reviewsService.remove(id, user.id);
  }
}
