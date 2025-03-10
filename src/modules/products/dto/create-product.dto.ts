import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUrl,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, ProductType } from '../entities/product.entity';
import { CreateProductVariantDto } from './create-product-variant.dto';
import { CreateProductImageDto } from './create-product-image.dto';
import { CreateProductAttributeDto } from './create-product-attribute.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType = ProductType.SIMPLE;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  compareAtPrice?: number;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isDigital?: boolean;

  @IsUrl()
  @IsOptional()
  digitalFileUrl?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  weightUnit?: string;

  @IsNumber()
  @IsOptional()
  length?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsString()
  @IsOptional()
  dimensionUnit?: string;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  metaKeywords?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsUUID()
  @IsNotEmpty()
  shopId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variants?: CreateProductVariantDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductAttributeDto)
  @IsOptional()
  attributes?: CreateProductAttributeDto[];
}
