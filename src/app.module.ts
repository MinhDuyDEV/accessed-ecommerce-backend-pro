import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShopsModule } from './modules/shops/shops.module';
import { RedisModule } from './modules/redis/redis.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartsModule } from './modules/carts/carts.module';
import { WishlistsModule } from './modules/wishlists/wishlists.module';
// import { UploadsModule } from './modules/uploads/uploads.module';
import { ElasticsearchModule } from './modules/elasticsearch/elasticsearch.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ShopsModule,
    CategoriesModule,
    ProductsModule,
    CartsModule,
    WishlistsModule,
    ElasticsearchModule,
    // UploadsModule,
  ],
})
export class AppModule {}
