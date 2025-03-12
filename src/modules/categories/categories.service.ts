// src/modules/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: TreeRepository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Kiểm tra tên và slug đã tồn tại chưa
    const existingCategory = await this.categoryRepository.findOne({
      where: [
        { name: createCategoryDto.name },
        { slug: createCategoryDto.slug },
      ],
    });

    if (existingCategory) {
      throw new ConflictException('Category name or slug already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);

    // Nếu có parentId, tìm parent category
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryDto.parentId} not found`,
        );
      }

      category.parent = parentCategory;
    }

    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.findRoots();
  }

  async findAllTree(): Promise<Category[]> {
    return this.categoryRepository.findTrees();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async findDescendants(id: string): Promise<Category[]> {
    const category = await this.findOne(id);
    return this.categoryRepository.findDescendants(category);
  }

  async findAncestors(id: string): Promise<Category[]> {
    const category = await this.findOne(id);
    return this.categoryRepository.findAncestors(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Kiểm tra nếu cập nhật name hoặc slug
    if (updateCategoryDto.name || updateCategoryDto.slug) {
      const existingCategory = await this.categoryRepository.findOne({
        where: [
          { name: updateCategoryDto.name, id: Not(id) },
          { slug: updateCategoryDto.slug, id: Not(id) },
        ],
      });

      if (existingCategory) {
        throw new ConflictException('Category name or slug already exists');
      }
    }

    // Nếu có parentId, tìm parent category
    if (updateCategoryDto.parentId) {
      // Không cho phép đặt parent là chính nó
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${updateCategoryDto.parentId} not found`,
        );
      }

      // Kiểm tra xem parent mới có phải là con cháu của category hiện tại không
      const descendants = await this.findDescendants(id);
      const isDescendant = descendants.some(
        (desc) => desc.id === updateCategoryDto.parentId,
      );

      if (isDescendant) {
        throw new ConflictException('Cannot set a descendant as parent');
      }

      category.parent = parentCategory;
    } else if (updateCategoryDto.parentId === null) {
      // Nếu parentId là null, đặt category thành root
      category.parent = null;
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Kiểm tra xem category có con không
    const children = await this.categoryRepository.findDescendants(category);

    if (children.length > 1) {
      // > 1 vì findDescendants bao gồm cả category hiện tại
      throw new ConflictException(
        'Cannot delete category with children. Please delete or move children first.',
      );
    }

    await this.categoryRepository.softDelete(id);
  }
}
