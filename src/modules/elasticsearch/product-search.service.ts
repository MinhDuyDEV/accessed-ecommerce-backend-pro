import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ElasticsearchService } from './elasticsearch.service';

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);
  private readonly indexName = 'products';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Initialize the product index with proper mappings
   */
  async initIndex() {
    const settings = {
      analysis: {
        analyzer: {
          product_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding', 'trim'],
          },
        },
      },
    };

    const mappings = {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'product_analyzer',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        slug: { type: 'keyword' },
        description: { type: 'text', analyzer: 'product_analyzer' },
        shortDescription: { type: 'text', analyzer: 'product_analyzer' },
        status: { type: 'keyword' },
        type: { type: 'keyword' },
        price: { type: 'float' },
        compareAtPrice: { type: 'float' },
        costPrice: { type: 'float' },
        quantity: { type: 'integer' },
        trackInventory: { type: 'boolean' },
        isFeatured: { type: 'boolean' },
        isDigital: { type: 'boolean' },
        soldCount: { type: 'integer' },
        averageRating: { type: 'float' },
        reviewCount: { type: 'integer' },
        sku: { type: 'keyword' },
        barcode: { type: 'keyword' },
        weight: { type: 'float' },
        weightUnit: { type: 'keyword' },
        dimensions: {
          properties: {
            length: { type: 'float' },
            width: { type: 'float' },
            height: { type: 'float' },
            unit: { type: 'keyword' },
          },
        },
        tags: { type: 'keyword' },
        brand: { type: 'keyword' },
        manufacturer: { type: 'keyword' },
        viewCount: { type: 'integer' },
        imageUrl: { type: 'keyword' },
        shopId: { type: 'keyword' },
        categories: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'keyword' },
            slug: { type: 'keyword' },
          },
        },
        images: {
          properties: {
            id: { type: 'keyword' },
            url: { type: 'keyword' },
            isDefault: { type: 'boolean' },
          },
        },
        attributes: {
          properties: {
            name: { type: 'keyword' },
            values: { type: 'keyword' },
          },
        },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    };

    await this.elasticsearchService.createIndex(
      this.indexName,
      settings,
      mappings,
    );
  }

  /**
   * Index a single product
   */
  async indexProduct(product: Product) {
    const productDocument = this.transformProductToDocument(product);
    await this.elasticsearchService.indexDocument(
      this.indexName,
      product.id,
      productDocument,
    );
  }

  /**
   * Update a product in the index
   */
  async updateProduct(product: Product) {
    const productDocument = this.transformProductToDocument(product);
    await this.elasticsearchService.updateDocument(
      this.indexName,
      product.id,
      productDocument,
    );
  }

  /**
   * Remove a product from the index
   */
  async removeProduct(productId: string) {
    await this.elasticsearchService.deleteDocument(this.indexName, productId);
  }

  /**
   * Reindex all products
   */
  async reindexAll() {
    try {
      // Initialize the index
      await this.initIndex();

      // Fetch all products with their relations
      const products = await this.productRepository.find({
        relations: ['categories', 'images', 'attributes'],
      });

      if (products.length === 0) {
        this.logger.log('No products found to index');
        return;
      }

      // Prepare bulk indexing data
      const bulkData = products.map((product) => ({
        id: product.id,
        document: this.transformProductToDocument(product),
      }));

      // Perform bulk indexing
      await this.elasticsearchService.bulkIndex(this.indexName, bulkData);
      this.logger.log(`Indexed ${products.length} products successfully`);
    } catch (error) {
      this.logger.error(`Error reindexing products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search products with various filters
   */
  async searchProducts(options: ProductSearchOptions) {
    try {
      const {
        query = '',
        page = 1,
        limit = 10,
        sort = 'createdAt:desc',
        minPrice,
        maxPrice,
        categoryIds = [],
        brands = [],
        status,
        isFeatured,
        tags = [],
        attributes = [],
      } = options;

      const from = (page - 1) * limit;
      const size = limit;

      // Build query
      const must = [];
      const filter = [];

      // Text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: [
              'name^3',
              'description',
              'shortDescription',
              'brand^2',
              'tags',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      }

      // Status filter
      if (status) {
        filter.push({ term: { status } });
      }

      // Featured filter
      if (isFeatured !== undefined) {
        filter.push({ term: { isFeatured } });
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        const rangeFilter: any = { range: { price: {} } };

        if (minPrice !== undefined) {
          rangeFilter.range.price.gte = minPrice;
        }

        if (maxPrice !== undefined) {
          rangeFilter.range.price.lte = maxPrice;
        }

        filter.push(rangeFilter);
      }

      // Category filter - supports multiple categories (OR condition)
      if (categoryIds.length > 0) {
        filter.push({
          terms: { 'categories.id': categoryIds },
        });
      }

      // Brand filter - supports multiple brands (OR condition)
      if (brands.length > 0) {
        filter.push({
          terms: { brand: brands },
        });
      }

      // Tags filter - supports multiple tags (OR condition)
      if (tags.length > 0) {
        filter.push({
          terms: { tags: tags },
        });
      }

      // Attributes filter - supports multiple attributes with multiple values
      if (attributes.length > 0) {
        for (const attr of attributes) {
          filter.push({
            nested: {
              path: 'attributes',
              query: {
                bool: {
                  must: [
                    { term: { 'attributes.name': attr.name } },
                    { terms: { 'attributes.values': attr.values } },
                  ],
                },
              },
            },
          });
        }
      }

      // Build sort
      const [sortField, sortOrder] = sort.split(':');
      const sortConfig = {};
      sortConfig[sortField] = { order: sortOrder || 'desc' };

      // Build aggregations for faceted search
      const aggregations = {
        categories: {
          terms: {
            field: 'categories.id',
            size: 50,
          },
        },
        brands: {
          terms: {
            field: 'brand',
            size: 50,
          },
        },
        price_range: {
          stats: {
            field: 'price',
          },
        },
        tags: {
          terms: {
            field: 'tags',
            size: 50,
          },
        },
      };

      // Execute search
      const searchQuery = {
        from,
        size,
        sort: [sortConfig],
        query: {
          bool: {
            must,
            filter,
          },
        },
        aggregations,
      };

      const result = await this.elasticsearchService.search(
        this.indexName,
        searchQuery,
      );

      // Transform results
      const products = result.hits.map((hit) => {
        const source = hit._source as Record<string, any>;
        return {
          ...source,
          score: hit._score,
        };
      });

      return {
        products,
        total:
          typeof result.total === 'number'
            ? result.total
            : result.total?.value || 0,
        page,
        limit,
        aggregations: result.aggregations,
      };
    } catch (error) {
      this.logger.error(`Error searching products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transform a product entity to an Elasticsearch document
   */
  private transformProductToDocument(product: Product) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      status: product.status,
      type: product.type,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      costPrice: product.costPrice,
      quantity: product.quantity,
      trackInventory: product.trackInventory,
      isFeatured: product.isFeatured,
      isDigital: product.isDigital,
      soldCount: product.soldCount,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      sku: product.sku,
      barcode: product.barcode,
      weight: product.weight,
      weightUnit: product.weightUnit,
      dimensions: {
        length: product.length,
        width: product.width,
        height: product.height,
        unit: product.dimensionUnit,
      },
      tags: product.tags,
      brand: product.brand,
      manufacturer: product.manufacturer,
      viewCount: product.viewCount,
      imageUrl: product.imageUrl,
      shopId: product.shopId,
      categories:
        product.categories?.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        })) || [],
      images:
        product.images?.map((image) => ({
          id: image.id,
          url: image.url,
          isDefault: image.isDefault,
        })) || [],
      attributes:
        product.attributes?.map((attribute) => ({
          name: attribute.name,
          values: attribute.values,
        })) || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

/**
 * Interface for product search options
 */
export interface ProductSearchOptions {
  query?: string;
  page?: number;
  limit?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryIds?: string[];
  brands?: string[];
  status?: string;
  isFeatured?: boolean;
  tags?: string[];
  attributes?: Array<{ name: string; values: string[] }>;
}
