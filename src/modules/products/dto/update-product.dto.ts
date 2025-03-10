import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsUUID, IsArray } from 'class-validator';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['shopId'] as const),
) {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];
}
