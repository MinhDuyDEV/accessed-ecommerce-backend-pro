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
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductStatus } from '../entities/product.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permission.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:create')
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.create(createProductDto, user.id);
  }

  @Get()
  findAll(
    @Query('status') status?: ProductStatus,
    @Query('shopId') shopId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('featured') featured?: boolean,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sort') sort?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.productsService.findAll({
      status,
      shopId,
      categoryId,
      isFeatured: featured,
      search,
      minPrice,
      maxPrice,
      sort,
      limit,
      offset,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:update')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.update(id, updateProductDto, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:update')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductStatus,
    @CurrentUser() user: User,
  ) {
    return this.productsService.updateStatus(id, status, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:delete')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.remove(id, user.id);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  incrementViewCount(@Param('id') id: string) {
    return this.productsService.incrementViewCount(id);
  }
}
