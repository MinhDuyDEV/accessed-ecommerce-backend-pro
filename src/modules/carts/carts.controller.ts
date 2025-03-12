import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateCartItemQuantityDto } from './dto/update-cart-item-quantity.dto';

@Controller('carts')
@UseGuards(JwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  findUserCart(@CurrentUser() user: User) {
    return this.cartsService.findByUser(user.id);
  }

  @Post(':cartId/items')
  async addToCart(
    @Body() createCartItemDto: CreateCartItemDto,
    @CurrentUser() user: User,
    @Param('cartId', new ParseUUIDPipe()) cartId: string,
  ) {
    // Nếu có cartId, kiểm tra quyền sở hữu và thêm vào giỏ hàng đó
    const cart = await this.cartsService.findOne(cartId);

    // Đảm bảo người dùng chỉ có thể thêm sản phẩm vào giỏ hàng của chính họ
    if (cart.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to add items to this cart',
      );
    }

    return this.cartsService.addItem(cartId, createCartItemDto);
  }

  @Patch(':cartId/items/:itemId')
  async updateItem(
    @Param('cartId', new ParseUUIDPipe()) cartId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser() user: User,
  ) {
    return this.cartsService.updateItem(
      cartId,
      itemId,
      updateCartItemDto,
      user,
    );
  }

  @Delete(':cartId/items/:itemId')
  async removeItem(
    @Param('cartId', new ParseUUIDPipe()) cartId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @CurrentUser() user: User,
  ) {
    const cart = await this.cartsService.findOne(cartId);

    // Đảm bảo người dùng chỉ có thể xóa sản phẩm trong giỏ hàng của chính họ
    if (cart.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to remove items from this cart',
      );
    }

    return this.cartsService.removeItem(cartId, itemId);
  }

  @Delete(':cartId/items')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(
    @Param('cartId', new ParseUUIDPipe()) cartId: string,
    @CurrentUser() user: User,
  ) {
    const cart = await this.cartsService.findOne(cartId);

    // Đảm bảo người dùng chỉ có thể xóa tất cả sản phẩm trong giỏ hàng của chính họ
    if (cart.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to clear this cart',
      );
    }

    return this.cartsService.clearCart(cartId);
  }

  @Post(':id/coupon')
  async applyCoupon(
    @Param('id') id: string,
    @Body('couponCode') couponCode: string,
    @Req() req,
  ) {
    const cart = await this.cartsService.findOne(id);

    // Đảm bảo người dùng chỉ có thể áp dụng mã giảm giá cho giỏ hàng của chính họ
    if (cart.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to apply coupon to this cart',
      );
    }

    return this.cartsService.applyCoupon(id, couponCode);
  }

  @Delete(':id/coupon')
  async removeCoupon(@Param('id') id: string, @Req() req) {
    const cart = await this.cartsService.findOne(id);

    // Đảm bảo người dùng chỉ có thể xóa mã giảm giá khỏi giỏ hàng của chính họ
    if (cart.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to remove coupon from this cart',
      );
    }

    return this.cartsService.removeCoupon(id);
  }

  @Post(':id/checkout')
  async checkout(@Param('id') id: string, @Req() req) {
    const cart = await this.cartsService.findOne(id);

    // Đảm bảo người dùng chỉ có thể thanh toán giỏ hàng của chính họ
    if (cart.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to checkout this cart',
      );
    }

    return this.cartsService.checkout(id);
  }

  @Patch(':cartId/items/:itemId/quantity')
  async updateItemQuantity(
    @Param('cartId', new ParseUUIDPipe()) cartId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateCartItemQuantityDto: UpdateCartItemQuantityDto,
    @CurrentUser() user: User,
  ) {
    const cart = await this.cartsService.findOne(cartId);

    // Đảm bảo người dùng chỉ có thể cập nhật sản phẩm trong giỏ hàng của chính họ
    if (cart.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update items in this cart',
      );
    }

    // Tìm sản phẩm trong giỏ hàng
    const item = cart.items.find((item) => item.id === itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    // Tính toán số lượng mới bằng cách cộng giá trị quantity (có thể là +1 hoặc -1)
    const newQuantity = item.quantity + updateCartItemQuantityDto.quantity;

    console.log('newQuantity', newQuantity);

    // Cập nhật số lượng
    return this.cartsService.updateItem(
      cartId,
      itemId,
      { quantity: newQuantity },
      user,
    );
  }
}
