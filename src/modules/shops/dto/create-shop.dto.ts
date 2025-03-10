import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsUrl,
} from 'class-validator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsUrl()
  @IsOptional()
  banner?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };

  @IsObject()
  @IsOptional()
  businessInfo?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phoneNumber?: string;
    email?: string;
    taxId?: string;
    businessRegistrationNumber?: string;
  };

  @IsObject()
  @IsOptional()
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
}
