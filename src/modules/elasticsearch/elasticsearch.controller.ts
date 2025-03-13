import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductSearchService } from './product-search.service';

@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly productSearchService: ProductSearchService) {}

  @Get('products/search')
  async searchProducts(@Query() queryParams) {
    // Xử lý categoryIds nếu là chuỗi phân tách bằng dấu phẩy
    if (
      queryParams.categoryIds &&
      typeof queryParams.categoryIds === 'string'
    ) {
      queryParams.categoryIds = queryParams.categoryIds
        .split(',')
        .filter((id) => id.trim());
    }

    // Xử lý brands nếu là chuỗi phân tách bằng dấu phẩy
    if (queryParams.brands && typeof queryParams.brands === 'string') {
      queryParams.brands = queryParams.brands
        .split(',')
        .filter((brand) => brand.trim());
    }

    // Xử lý tags nếu là chuỗi phân tách bằng dấu phẩy
    if (queryParams.tags && typeof queryParams.tags === 'string') {
      queryParams.tags = queryParams.tags
        .split(',')
        .filter((tag) => tag.trim());
    }

    // Chuyển đổi các tham số số
    if (queryParams.page) queryParams.page = parseInt(queryParams.page);
    if (queryParams.limit) queryParams.limit = parseInt(queryParams.limit);
    if (queryParams.minPrice)
      queryParams.minPrice = parseFloat(queryParams.minPrice);
    if (queryParams.maxPrice)
      queryParams.maxPrice = parseFloat(queryParams.maxPrice);
    if (queryParams.isFeatured)
      queryParams.isFeatured = queryParams.isFeatured === 'true';

    const searchResults =
      await this.productSearchService.searchProducts(queryParams);

    // Chỉ trả về những thông tin cần thiết của sản phẩm
    const simplifiedProducts = searchResults.products.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      isFeatured: product.isFeatured,
      status: product.status,
      imageUrl: product.imageUrl,
      brand: product.brand,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      categories:
        product.categories?.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        })) || [],
      tags: product.tags || [],
      attributes:
        product.attributes?.map((attr: any) => ({
          name: attr.name,
          values: attr.values,
        })) || [],
      score: product.score,
    }));

    return {
      products: simplifiedProducts,
      total: searchResults.total,
      page: searchResults.page,
      limit: searchResults.limit,
      aggregations: searchResults.aggregations,
    };
  }

  @Post('products/reindex')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reindexProducts() {
    await this.productSearchService.reindexAll();
    return { message: 'Products reindexed successfully' };
  }
}
