import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../modules/categories/entities/category.entity';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  try {
    // Tạo ứng dụng NestJS
    const app = await NestFactory.createApplicationContext(AppModule);

    // Lấy repository của Category
    const categoryRepository = app.get(getRepositoryToken(Category));

    // Lấy DataSource để thực hiện các truy vấn SQL trực tiếp
    const dataSource = app.get(DataSource);

    // Đọc file JSON
    const categoriesJsonPath = path.join(__dirname, '../../categories.json');
    const categoriesData = JSON.parse(
      fs.readFileSync(categoriesJsonPath, 'utf8'),
    );
    console.log(`Đã đọc ${categoriesData.length} danh mục gốc từ file JSON`);

    // Xóa tất cả categories hiện có (xử lý khóa ngoại)
    try {
      // Tắt tạm thời ràng buộc khóa ngoại
      await dataSource.query('SET CONSTRAINTS ALL DEFERRED');

      // Xóa dữ liệu từ bảng product_categories trước (bảng tham chiếu đến categories)
      await dataSource.query('DELETE FROM product_categories');
      console.log('Đã xóa dữ liệu từ bảng product_categories');

      // Sau đó xóa dữ liệu từ bảng categories
      await dataSource.query('DELETE FROM categories');
      console.log('Đã xóa tất cả categories hiện có');

      // Bật lại ràng buộc khóa ngoại
      await dataSource.query('SET CONSTRAINTS ALL IMMEDIATE');
    } catch (error) {
      console.error('Lỗi khi xóa dữ liệu:', error);
      throw error;
    }

    // Theo dõi các tên danh mục đã được sử dụng để tránh trùng lặp
    const usedNames = new Set<string>();
    const usedSlugs = new Set<string>();

    // Hàm đệ quy để import categories
    async function importCategory(
      categoryData,
      parent = null,
      parentPath = '',
    ) {
      // Xử lý trùng lặp tên
      let categoryName = categoryData.name;
      let nameCounter = 1;

      // Nếu tên đã tồn tại, thêm số vào sau tên
      while (usedNames.has(categoryName)) {
        categoryName = `${categoryData.name} (${nameCounter})`;
        nameCounter++;
      }

      // Thêm tên vào danh sách đã sử dụng
      usedNames.add(categoryName);

      // Xử lý trùng lặp slug
      let categorySlug = categoryData.slug;
      let slugCounter = 1;

      // Nếu slug đã tồn tại, thêm số vào sau slug
      while (usedSlugs.has(categorySlug)) {
        categorySlug = `${categoryData.slug}-${slugCounter}`;
        slugCounter++;
      }

      // Thêm slug vào danh sách đã sử dụng
      usedSlugs.add(categorySlug);

      // Tạo đường dẫn hiển thị cho log
      const displayPath = parentPath
        ? `${parentPath} > ${categoryName}`
        : categoryName;

      const category = categoryRepository.create({
        name: categoryName,
        slug: categorySlug,
        description: categoryData.description,
        image: categoryData.image,
        order: categoryData.order,
        isActive: categoryData.isActive,
        parent: parent,
      });

      // Lưu category
      const savedCategory = await categoryRepository.save(category);
      console.log(`Đã import category: ${displayPath}`);

      // Import các category con (nếu có)
      if (categoryData.children && categoryData.children.length > 0) {
        for (const childData of categoryData.children) {
          await importCategory(childData, savedCategory, displayPath);
        }
      }

      return savedCategory;
    }

    // Import tất cả categories gốc
    for (const categoryData of categoriesData) {
      await importCategory(categoryData);
    }

    console.log('Import categories hoàn tất');

    // Đóng ứng dụng
    await app.close();
  } catch (error) {
    console.error('Lỗi khi import categories:', error);
    process.exit(1);
  }
}

bootstrap();
