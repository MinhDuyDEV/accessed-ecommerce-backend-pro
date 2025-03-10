import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductVariantsService } from '../services/product-variants.service';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permission.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@Controller('products/:productId/variants')
export class ProductVariantsController {
  constructor(private readonly variantsService: ProductVariantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:update')
  create(
    @Param('productId') productId: string,
    @Body() createVariantDto: CreateProductVariantDto,
    @CurrentUser() user: User,
  ) {
    return this.variantsService.create(productId, createVariantDto, user.id);
  }

  @Get()
  findAll(@Param('productId') productId: string) {
    return this.variantsService.findAll(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:update')
  update(
    @Param('id') id: string,
    @Body() updateVariantDto: UpdateProductVariantDto,
    @CurrentUser() user: User,
  ) {
    return this.variantsService.update(id, updateVariantDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:update')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.variantsService.remove(id, user.id);
  }
}
