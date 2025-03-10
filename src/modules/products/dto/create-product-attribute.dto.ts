import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';

export class CreateProductAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  values: string[];

  @IsBoolean()
  @IsOptional()
  isVariant?: boolean;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}
