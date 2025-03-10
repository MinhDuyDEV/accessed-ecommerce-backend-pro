import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
} from 'class-validator';

export class CreateProductImageDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  alt?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}
