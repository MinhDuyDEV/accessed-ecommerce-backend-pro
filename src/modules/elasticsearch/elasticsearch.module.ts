import { Module } from '@nestjs/common';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';
import { ProductSearchService } from './product-search.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    NestElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const node =
          configService.get('elasticsearch.node') || 'http://localhost:9200';
        const username = configService.get('elasticsearch.username');
        const password = configService.get('elasticsearch.password');

        const config: any = {
          node,
          maxRetries: 10,
          requestTimeout: 60000,
        };

        // Chỉ thêm auth nếu cả username và password đều được cung cấp
        if (username && password) {
          config.auth = {
            username,
            password,
          };
        }

        return config;
      },
    }),
    TypeOrmModule.forFeature([Product]),
    AuthModule,
  ],
  controllers: [ElasticsearchController],
  providers: [ElasticsearchService, ProductSearchService],
  exports: [ElasticsearchService, ProductSearchService],
})
export class ElasticsearchModule {}
