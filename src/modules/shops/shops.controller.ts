import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';
import { PolicyGuard } from '../auth/guards/policy.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Policy } from '../auth/decorators/policy.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ShopStatus } from './entities/shop.entity';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createShopDto: CreateShopDto, @CurrentUser() user: User) {
    return this.shopsService.create(createShopDto, user);
  }

  @Get()
  findAll(
    @Query('status') status?: ShopStatus,
    @Query('featured') featured?: boolean,
    @Query('verified') verified?: boolean,
  ) {
    return this.shopsService.findAll({
      status,
      isFeatured: featured,
      isVerified: verified,
    });
  }

  @Get('my-shop')
  @UseGuards(JwtAuthGuard)
  findMyShop(@CurrentUser() user: User) {
    return this.shopsService.findByOwnerId(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.shopsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PolicyGuard)
  @Policy('update', 'shop')
  update(
    @Param('id') id: string,
    @Body() updateShopDto: UpdateShopDto,
    @CurrentUser() user: User,
  ) {
    return this.shopsService.update(id, updateShopDto, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('shop:update-status')
  updateStatus(@Param('id') id: string, @Body('status') status: ShopStatus) {
    return this.shopsService.updateStatus(id, status);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('shop:verify')
  verifyShop(@Param('id') id: string) {
    return this.shopsService.verifyShop(id);
  }

  @Patch(':id/feature')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('shop:feature')
  featureShop(
    @Param('id') id: string,
    @Body('isFeatured') isFeatured: boolean,
  ) {
    return this.shopsService.featureShop(id, isFeatured);
  }

  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, PolicyGuard)
  @Policy('view-analytics', 'shop')
  getShopAnalytics(@Param('id') id: string) {
    return this.shopsService.getShopAnalytics(id);
  }

  @Get(':id/staff')
  @UseGuards(JwtAuthGuard, PolicyGuard)
  @Policy('manage-staff', 'shop')
  getShopStaff(@Param('id') id: string) {
    // Implement get shop staff logic
    return this.shopsService.getShopStaff(id);
  }

  @Post(':id/staff')
  @UseGuards(JwtAuthGuard, PolicyGuard)
  @Policy('manage-staff', 'shop')
  addShopStaff(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('role') role: string,
  ) {
    // Implement add shop staff logic
    return this.shopsService.addShopStaff(id, userId, role);
  }

  @Delete(':id/staff/:userId')
  @UseGuards(JwtAuthGuard, PolicyGuard)
  @Policy('manage-staff', 'shop')
  removeShopStaff(@Param('id') id: string, @Param('userId') userId: string) {
    // Implement remove shop staff logic
    return this.shopsService.removeShopStaff(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PolicyGuard)
  @Policy('delete', 'shop')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.shopsService.remove(id, user.id);
  }
}
