const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Cấu hình
const API_URL = 'http://localhost:8000/api'; // Thay đổi URL API nếu cần
const CATEGORIES_JSON_PATH = path.join(__dirname, 'categories.json');
const AUTH_TOKEN = ''; // Thêm token xác thực nếu cần

// Đọc file JSON
const categoriesData = JSON.parse(
  fs.readFileSync(CATEGORIES_JSON_PATH, 'utf8'),
);

// Cấu hình axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
  },
});

// Hàm đệ quy để import categories
async function importCategory(categoryData, parentId = null) {
  try {
    // Chuẩn bị dữ liệu để gửi lên API
    const categoryToCreate = {
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      image: categoryData.image,
      order: categoryData.order,
      isActive: categoryData.isActive,
      parentId: parentId,
    };

    // Gọi API để tạo category
    const response = await api.post('/categories', categoryToCreate);
    const savedCategory = response.data;
    console.log(`Đã import category: ${savedCategory.name}`);

    // Import các category con (nếu có)
    if (categoryData.children && categoryData.children.length > 0) {
      for (const childData of categoryData.children) {
        await importCategory(childData, savedCategory.id);
      }
    }

    return savedCategory;
  } catch (error) {
    console.error(
      `Lỗi khi import category ${categoryData.name}:`,
      error.message,
    );
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Hàm chính để import tất cả categories
async function importAllCategories() {
  try {
    console.log(
      `Bắt đầu import ${categoriesData.length} danh mục gốc từ file JSON`,
    );

    // Xóa tất cả categories hiện có (nếu cần)
    try {
      await api.delete('/categories/all');
      console.log('Đã xóa tất cả categories hiện có');
    } catch (error) {
      console.warn(
        'Không thể xóa categories hiện có, tiếp tục import:',
        error.message,
      );
    }

    // Import tất cả categories gốc
    for (const categoryData of categoriesData) {
      await importCategory(categoryData);
    }

    console.log('Import categories hoàn tất');
  } catch (error) {
    console.error('Lỗi khi import categories:', error.message);
  }
}

// Chạy hàm import
importAllCategories();
