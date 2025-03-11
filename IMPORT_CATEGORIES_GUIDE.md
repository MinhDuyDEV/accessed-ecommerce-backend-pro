# Hướng dẫn Import Categories

Hướng dẫn này mô tả các phương pháp khác nhau để import dữ liệu danh mục từ file JSON vào cơ sở dữ liệu, đồng thời duy trì mối quan hệ cha-con.

## Chuẩn bị

1. Đảm bảo file `categories.json` đã được đặt trong thư mục gốc của dự án.
2. Đảm bảo cấu hình cơ sở dữ liệu của bạn đã được thiết lập chính xác trong file `.env` hoặc `ormconfig.js`.

## Phương pháp 1: Sử dụng NestJS CLI (Khuyến nghị)

Đây là phương pháp được khuyến nghị vì nó sử dụng cấu hình NestJS hiện có của bạn.

1. Chạy lệnh sau để import categories:

```bash
npm run import-categories
```

Script này sẽ:

- Đọc file JSON
- Xóa tất cả categories hiện có (bao gồm xử lý khóa ngoại)
- Xử lý trùng lặp tên và slug danh mục
- Import categories mới, duy trì mối quan hệ cha-con

## Phương pháp 2: Sử dụng Script với Dotenv

Phương pháp này sử dụng một script độc lập đọc cấu hình từ file `.env`.

1. Đảm bảo bạn đã cài đặt `dotenv`:

```bash
npm install dotenv
```

2. Chạy script:

```bash
node import-categories-dotenv.js
```

Script này sẽ:

- Đọc cấu hình cơ sở dữ liệu từ file `.env`
- Đọc file JSON
- Xóa dữ liệu từ bảng `product_categories` (bảng tham chiếu)
- Xóa dữ liệu từ bảng `categories` (xử lý khóa ngoại)
- Xử lý trùng lặp tên và slug danh mục
- Import categories mới, duy trì mối quan hệ cha-con

## Phương pháp 3: Sử dụng Script Độc lập

Phương pháp này sử dụng một script với cấu hình cơ sở dữ liệu được mã hóa cứng.

1. Chỉnh sửa file `import-categories-standalone.js` để cập nhật cấu hình cơ sở dữ liệu của bạn:

```javascript
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
```

2. Chạy script:

```bash
node import-categories-standalone.js
```

Script này cũng xử lý khóa ngoại bằng cách tắt tạm thời ràng buộc khóa ngoại, xóa dữ liệu từ bảng tham chiếu trước, sau đó xóa dữ liệu từ bảng categories. Ngoài ra, script cũng xử lý trùng lặp tên và slug danh mục.

## Phương pháp 4: Sử dụng SQL

Bạn có thể sử dụng SQL trực tiếp để import dữ liệu:

1. Chuẩn bị file SQL `import-categories.sql` với dữ liệu từ file JSON.
2. Chạy file SQL trong PostgreSQL:

```bash
psql -U postgres -d ecommerce -f import-categories.sql
```

Lưu ý: Khi sử dụng SQL, bạn cần xử lý khóa ngoại bằng cách:

```sql
-- Tắt tạm thời ràng buộc khóa ngoại
SET CONSTRAINTS ALL DEFERRED;

-- Xóa dữ liệu từ bảng tham chiếu trước
DELETE FROM product_categories;

-- Sau đó xóa dữ liệu từ bảng categories
DELETE FROM categories;

-- Bật lại ràng buộc khóa ngoại
SET CONSTRAINTS ALL IMMEDIATE;

-- Tiếp tục với các lệnh INSERT
```

## Phương pháp 5: Sử dụng API

Bạn có thể sử dụng API để import dữ liệu:

1. Cài đặt axios:

```bash
npm install axios
```

2. Chỉnh sửa file `import-categories-api.js` để cập nhật URL API của bạn.
3. Chạy script:

```bash
node import-categories-api.js
```

## Xử lý lỗi

### Lỗi kết nối TypeORM

Nếu bạn gặp lỗi "TypeORM không tìm thấy tùy chọn kết nối", hãy thử:

- Kiểm tra cấu hình cơ sở dữ liệu trong file `.env` hoặc `ormconfig.js`
- Sử dụng Phương pháp 2 hoặc 3 với cấu hình trực tiếp

### Lỗi khóa ngoại

Nếu bạn gặp lỗi "violates foreign key constraint", đó là do bảng `categories` đang được tham chiếu bởi bảng khác (như `product_categories`). Các script đã được cập nhật để xử lý vấn đề này bằng cách:

1. Tắt tạm thời ràng buộc khóa ngoại với `SET CONSTRAINTS ALL DEFERRED`
2. Xóa dữ liệu từ bảng tham chiếu trước (`product_categories`)
3. Sau đó xóa dữ liệu từ bảng chính (`categories`)
4. Bật lại ràng buộc khóa ngoại với `SET CONSTRAINTS ALL IMMEDIATE`

### Lỗi trùng lặp tên danh mục

Nếu bạn gặp lỗi "duplicate key value violates unique constraint", đó là do trong file JSON của bạn có nhiều danh mục có cùng tên hoặc slug. Các script đã được cập nhật để xử lý vấn đề này bằng cách:

1. Theo dõi các tên và slug đã được sử dụng trong quá trình import
2. Nếu phát hiện trùng lặp tên, tự động thêm số vào sau tên (ví dụ: "Khác" -> "Khác (1)")
3. Nếu phát hiện trùng lặp slug, tự động thêm số vào sau slug (ví dụ: "quan-nu-khac" -> "quan-nu-khac-1")

### Lỗi module không tìm thấy

Nếu bạn gặp lỗi "Cannot find module", hãy cài đặt module thiếu:

```bash
npm install <tên-module>
```

## Lưu ý

- Tất cả các phương pháp đều sẽ **xóa tất cả categories hiện có** trước khi import dữ liệu mới.
- Đảm bảo bạn đã sao lưu dữ liệu trước khi chạy bất kỳ script nào.
- Cấu trúc của file JSON phải khớp với cấu trúc của bảng `categories` trong cơ sở dữ liệu.
- Các script đã được cập nhật để xử lý ràng buộc khóa ngoại và trùng lặp tên/slug, đảm bảo quá trình import không bị lỗi.
