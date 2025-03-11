const fs = require('fs');
const path = require('path');
const { createConnection } = require('typeorm');

// Đường dẫn tới file JSON
const CATEGORIES_JSON_PATH = path.join(__dirname, 'categories.json');

// Hàm để import categories
async function importCategories() {
  let connection;
  try {
    // Đọc cấu hình database từ file ormconfig.js hoặc .env
    // Kết nối đến database
    connection = await createConnection({
      type: process.env.DB_TYPE || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'ecommerce',
      entities: [
        path.join(__dirname, 'src/modules/**/entities/*.entity{.ts,.js}'),
      ],
      synchronize: false,
    });
    console.log('Đã kết nối đến database');

    // Lấy repository của Category
    const categoryRepository = connection.getRepository('Category');

    // Đọc file JSON
    const categoriesData = JSON.parse(
      fs.readFileSync(CATEGORIES_JSON_PATH, 'utf8'),
    );
    console.log(`Đã đọc ${categoriesData.length} danh mục gốc từ file JSON`);

    // Xóa tất cả categories hiện có (nếu cần)
    await categoryRepository.clear();
    console.log('Đã xóa tất cả categories hiện có');

    // Hàm đệ quy để import categories
    async function importCategory(categoryData, parent = null) {
      const category = categoryRepository.create({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        image: categoryData.image,
        order: categoryData.order,
        isActive: categoryData.isActive,
        parent: parent,
      });

      // Lưu category
      const savedCategory = await categoryRepository.save(category);
      console.log(`Đã import category: ${savedCategory.name}`);

      // Import các category con (nếu có)
      if (categoryData.children && categoryData.children.length > 0) {
        for (const childData of categoryData.children) {
          await importCategory(childData, savedCategory);
        }
      }

      return savedCategory;
    }

    // Import tất cả categories gốc
    for (const categoryData of categoriesData) {
      await importCategory(categoryData);
    }

    console.log('Import categories hoàn tất');
  } catch (error) {
    console.error('Lỗi khi import categories:', error);
  } finally {
    if (connection) {
      await connection.close();
      console.log('Đã đóng kết nối database');
    }
  }
}

// Chạy script
importCategories();
