const fs = require('fs');
const path = require('path');
const { createConnection } = require('typeorm');

// Đường dẫn tới file JSON
const CATEGORIES_JSON_PATH = path.join(__dirname, 'categories.json');

// Cấu hình kết nối database
const dbConfig = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'ecommerce',
  entities: [path.join(__dirname, 'src/modules/**/entities/*.entity{.ts,.js}')],
  synchronize: false,
};

// Hàm để import categories
async function importCategories() {
  let connection;
  try {
    // Kết nối đến database
    connection = await createConnection(dbConfig);
    console.log('Đã kết nối đến database');

    // Lấy repository của Category
    const categoryRepository = connection.getRepository('Category');

    // Đọc file JSON
    const categoriesData = JSON.parse(
      fs.readFileSync(CATEGORIES_JSON_PATH, 'utf8'),
    );
    console.log(`Đã đọc ${categoriesData.length} danh mục gốc từ file JSON`);

    // Xóa tất cả categories hiện có (xử lý khóa ngoại)
    try {
      // Tắt tạm thời ràng buộc khóa ngoại
      await connection.query('SET CONSTRAINTS ALL DEFERRED');

      // Xóa dữ liệu từ bảng product_categories trước (bảng tham chiếu đến categories)
      await connection.query('DELETE FROM product_categories');
      console.log('Đã xóa dữ liệu từ bảng product_categories');

      // Sau đó xóa dữ liệu từ bảng categories
      await connection.query('DELETE FROM categories');
      console.log('Đã xóa tất cả categories hiện có');

      // Bật lại ràng buộc khóa ngoại
      await connection.query('SET CONSTRAINTS ALL IMMEDIATE');
    } catch (error) {
      console.error('Lỗi khi xóa dữ liệu:', error);
      throw error;
    }

    // Theo dõi các tên danh mục đã được sử dụng để tránh trùng lặp
    const usedNames = new Set();
    const usedSlugs = new Set();

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
