import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashToken() {
    if (this.token) {
      const salt = await bcrypt.genSalt();
      this.token = await bcrypt.hash(this.token, salt);
    }
  }

  async compareToken(plainToken: string): Promise<boolean> {
    return bcrypt.compare(plainToken, this.token);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
