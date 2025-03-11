import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class BecomeSellerDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  shopName: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  description: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  banner?: string;
}
