import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { ElasticsearchService } from '../modules/elasticsearch/elasticsearch.service';
import { ProductSearchService } from '../modules/elasticsearch/product-search.service';

async function bootstrap() {
  const logger = new Logger('ResetElasticsearch');
  logger.log('Bắt đầu quá trình reset Elasticsearch...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const elasticsearchService = app.get(ElasticsearchService);
    const productSearchService = app.get(ProductSearchService);

    // 1. Xóa index hiện tại nếu tồn tại
    const indexName = 'products';
    const fullIndexName = `ecommerce_${indexName}`;

    logger.log(`Kiểm tra xem index ${fullIndexName} có tồn tại không...`);
    const indexExists = await elasticsearchService.indexExists(fullIndexName);

    if (indexExists) {
      logger.log(`Đang xóa index ${fullIndexName}...`);
      await elasticsearchService.deleteIndex(indexName);
      logger.log(`Index ${fullIndexName} đã được xóa thành công.`);
    } else {
      logger.log(`Index ${fullIndexName} không tồn tại, bỏ qua bước xóa.`);
    }

    // 2. Tạo index mới với mapping đúng
    logger.log(`Đang tạo index mới ${fullIndexName} với mapping đúng...`);
    await productSearchService.initIndex();
    logger.log(`Index ${fullIndexName} đã được tạo thành công.`);

    // 3. Reindex tất cả sản phẩm
    logger.log('Đang reindex tất cả sản phẩm...');
    await productSearchService.reindexAll();
    logger.log('Tất cả sản phẩm đã được reindex thành công.');

    await app.close();
    logger.log('Quá trình reset Elasticsearch đã hoàn tất!');
    process.exit(0);
  } catch (error) {
    logger.error(`Lỗi khi reset Elasticsearch: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

bootstrap();
