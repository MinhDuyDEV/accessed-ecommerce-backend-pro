import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateProductReviewDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];
}
