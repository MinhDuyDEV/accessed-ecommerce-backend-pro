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
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() createCartDto: CreateCartDto, @Req() req) {
    // If user is authenticated, associate cart with user
    if (req.user) {
      createCartDto.userId = req.user.id;
    }

    return this.cartsService.create(createCartDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findUserCart(@Req() req) {
    return this.cartsService.findByUser(req.user.id);
  }

  @Get('session/:sessionId')
  findBySession(@Param('sessionId') sessionId: string) {
    return this.cartsService.findBySession(sessionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartsService.update(id, updateCartDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.cartsService.remove(id);
  }

  @Post(':id/items')
  addItem(
    @Param('id') id: string,
    @Body() createCartItemDto: CreateCartItemDto,
  ) {
    return this.cartsService.addItem(id, createCartItemDto);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(id, itemId, updateCartItemDto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.cartsService.removeItem(id, itemId);
  }

  @Delete(':id/items')
  clearCart(@Param('id') id: string) {
    return this.cartsService.clearCart(id);
  }

  @Post(':id/coupon')
  applyCoupon(@Param('id') id: string, @Body('couponCode') couponCode: string) {
    return this.cartsService.applyCoupon(id, couponCode);
  }

  @Delete(':id/coupon')
  removeCoupon(@Param('id') id: string) {
    return this.cartsService.removeCoupon(id);
  }

  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@Param('id') id: string) {
    return this.cartsService.checkout(id);
  }
}
