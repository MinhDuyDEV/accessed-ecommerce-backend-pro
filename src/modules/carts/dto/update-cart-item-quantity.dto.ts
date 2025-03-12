import { IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemQuantityDto {
  @IsIn([1, -1], { message: 'Quantity must be either 1 or -1' })
  @Type(() => Number)
  quantity: number;
}
