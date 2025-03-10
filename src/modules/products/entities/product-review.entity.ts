import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';
import { Min, Max } from 'class-validator';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  @Min(1)
  @Max(5)
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ default: 0 })
  helpfulCount: number;

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
