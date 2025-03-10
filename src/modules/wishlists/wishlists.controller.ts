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
  Query,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWishlistItemDto } from './dto/create-wishlist-item.dto';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createWishlistDto: CreateWishlistDto,
    @CurrentUser() user: User,
  ) {
    return this.wishlistsService.create(user.id, createWishlistDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.wishlistsService.findAll(user.id);
  }

  @Get('public')
  findPublic() {
    return this.wishlistsService.findPublic();
  }

  @Get('default')
  @UseGuards(JwtAuthGuard)
  getDefaultWishlist(@CurrentUser() user: User) {
    return this.wishlistsService.getDefaultWishlist(user.id);
  }

  @Post('default/items')
  @UseGuards(JwtAuthGuard)
  addToDefaultWishlist(
    @Body() createWishlistItemDto: CreateWishlistItemDto,
    @CurrentUser() user: User,
  ) {
    return this.wishlistsService.addToDefaultWishlist(
      user.id,
      createWishlistItemDto,
    );
  }

  @Get('check-product')
  @UseGuards(JwtAuthGuard)
  checkIfProductInWishlist(
    @Query('productId') productId: string,
    @Query('variantId') variantId: string,
    @CurrentUser() user: User,
  ) {
    return this.wishlistsService.checkIfProductInWishlist(
      user.id,
      productId,
      variantId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    // Nếu người dùng đã đăng nhập, truyền userId để kiểm tra quyền truy cập
    const userId = req.user?.id;
    return this.wishlistsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
    @CurrentUser() user: User,
  ) {
    return this.wishlistsService.update(id, user.id, updateWishlistDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.wishlistsService.remove(id, user.id);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  addItem(
    @Param('id') id: string,
    @Body() createWishlistItemDto: CreateWishlistItemDto,
    @CurrentUser() user: User,
  ) {
    return this.wishlistsService.addItem(id, user.id, createWishlistItemDto);
  }

  @Patch(':id/items/:itemId')
  @UseGuards(JwtAuthGuard)
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateWishlistItemDto: UpdateWishlistItemDto,
    @CurrentUser() user: User,
  ) {
    return this.wishlistsService.updateItem(
      id,
      itemId,
      user.id,
      updateWishlistItemDto,
    );
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard)
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    return this.wishlistsService.removeItem(id, itemId, user.id);
  }
}
