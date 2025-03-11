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
  ForbiddenException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: User,
  ) {
    // Kiểm tra xem người dùng có phải là admin không
    const isAdmin = user.roles.some((role) => role.name === 'admin');
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can create categories');
    }

    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query('tree') tree?: boolean) {
    if (tree) {
      return this.categoriesService.findAllTree();
    }
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id/descendants')
  findDescendants(@Param('id') id: string) {
    return this.categoriesService.findDescendants(id);
  }

  @Get(':id/ancestors')
  findAncestors(@Param('id') id: string) {
    return this.categoriesService.findAncestors(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: User,
  ) {
    // Kiểm tra xem người dùng có phải là admin không
    const isAdmin = user.roles.some((role) => role.name === 'admin');
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can update categories');
    }

    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    // Kiểm tra xem người dùng có phải là admin không
    const isAdmin = user.roles.some((role) => role.name === 'admin');
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can delete categories');
    }

    return this.categoriesService.remove(id);
  }
}
