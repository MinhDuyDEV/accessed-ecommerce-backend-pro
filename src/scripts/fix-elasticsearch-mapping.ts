import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { ElasticsearchService } from '../modules/elasticsearch/elasticsearch.service';
import { ProductSearchService } from '../modules/elasticsearch/product-search.service';

async function bootstrap() {
  const logger = new Logger('FixElasticsearchMapping');
  logger.log('Starting Elasticsearch mapping fix script...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const elasticsearchService = app.get(ElasticsearchService);
    const productSearchService = app.get(ProductSearchService);

    // 1. Delete the existing index
    const indexName = 'products';
    const fullIndexName = `ecommerce_${indexName}`;

    logger.log(`Checking if index ${fullIndexName} exists...`);
    const indexExists = await elasticsearchService.indexExists(fullIndexName);

    if (indexExists) {
      logger.log(`Deleting index ${fullIndexName}...`);
      await elasticsearchService.deleteIndex(indexName);
      logger.log(`Index ${fullIndexName} deleted successfully.`);
    } else {
      logger.log(`Index ${fullIndexName} does not exist, skipping deletion.`);
    }

    // 2. Create a new index with the correct mapping
    logger.log(`Creating new index ${fullIndexName} with correct mapping...`);
    await productSearchService.initIndex();
    logger.log(`Index ${fullIndexName} created successfully.`);

    // 3. Reindex all products
    logger.log('Reindexing all products...');
    await productSearchService.reindexAll();
    logger.log('All products reindexed successfully.');

    await app.close();
    logger.log('Elasticsearch mapping fix completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Error fixing Elasticsearch mapping: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

bootstrap();
