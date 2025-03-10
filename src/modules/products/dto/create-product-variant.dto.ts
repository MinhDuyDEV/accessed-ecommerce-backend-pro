import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  compareAtPrice?: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

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
}
