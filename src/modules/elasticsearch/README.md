# Elasticsearch Module

This module provides Elasticsearch integration for the e-commerce application, with a focus on product search functionality.

## Features

- Full-text search for products
- Filtering by categories, price range, brands, tags, and more
- Faceted search with aggregations
- Support for sorting and pagination
- Automatic indexing of products

## Setup

1. Make sure Elasticsearch is running and accessible
2. Configure Elasticsearch connection in your `.env` file:

```
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_INDEX_PREFIX=ecommerce_
```

## API Endpoints

### Search Products

```
GET /elasticsearch/products/search
```

Query Parameters:

- `query` (string, optional): Search term
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 10): Items per page
- `sort` (string, optional, default: 'createdAt:desc'): Sort field and direction (e.g., 'price:asc')
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `categoryIds` (string[], optional): Category IDs to filter by
- `brands` (string[], optional): Brands to filter by
- `status` (string, optional): Product status filter
- `isFeatured` (boolean, optional): Filter by featured status
- `tags` (string[], optional): Tags to filter by

Example:

```
GET /elasticsearch/products/search?query=laptop&categoryIds=123,456&minPrice=500&maxPrice=2000&sort=price:asc&page=1&limit=20
```

### Reindex Products

```
POST /elasticsearch/products/reindex
```

This endpoint requires admin authentication. It will reindex all products in the database.

## Usage in Code

### Inject the ProductSearchService

```typescript
import { ProductSearchService } from '../elasticsearch/product-search.service';

@Injectable()
export class YourService {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async searchProducts() {
    const results = await this.productSearchService.searchProducts({
      query: 'laptop',
      categoryIds: ['123', '456'],
      minPrice: 500,
      maxPrice: 2000,
      sort: 'price:asc',
      page: 1,
      limit: 20,
    });

    return results;
  }
}
```

### Index a New Product

When creating a new product, you should index it:

```typescript
await this.productSearchService.indexProduct(newProduct);
```

### Update an Indexed Product

When updating a product, update the index:

```typescript
await this.productSearchService.updateProduct(updatedProduct);
```

### Remove a Product from the Index

When deleting a product, remove it from the index:

```typescript
await this.productSearchService.removeProduct(productId);
```

## Search Response Format

The search response includes:

```typescript
{
  products: Product[],  // Array of product documents
  total: number,        // Total number of matching products
  page: number,         // Current page
  limit: number,        // Items per page
  aggregations: {       // Facet data for filtering
    categories: {
      buckets: [{ key: string, doc_count: number }]
    },
    brands: {
      buckets: [{ key: string, doc_count: number }]
    },
    price_range: {
      min: number,
      max: number,
      avg: number
    },
    tags: {
      buckets: [{ key: string, doc_count: number }]
    }
  }
}
```
