import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';

export enum ShopStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  banner: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  businessInfo: {
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

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  @Column({
    type: 'enum',
    enum: ShopStatus,
    default: ShopStatus.ACTIVE,
  })
  status: ShopStatus;

  @Column({ default: 0 })
  followersCount: number;

  @Column({ default: 0 })
  productsCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedAt: Date;

  @OneToOne(() => User, (user) => user.shop)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
