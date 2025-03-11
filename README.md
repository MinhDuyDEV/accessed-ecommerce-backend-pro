# E-Commerce Backend API

Backend API cho ứng dụng thương mại điện tử, được xây dựng với NestJS.

## Công nghệ sử dụng

- **NestJS**: Framework Node.js để xây dựng ứng dụng server-side hiệu quả và có khả năng mở rộng
- **PostgreSQL**: Cơ sở dữ liệu chính
- **Redis**: Cache và quản lý phiên
- **AWS S3**: Lưu trữ file
- **CloudFront**: CDN cho tài nguyên tĩnh
- **Stripe**: Xử lý thanh toán

## Cài đặt

### Yêu cầu

- Node.js (phiên bản mới nhất)
- PostgreSQL
- Redis
- Tài khoản AWS (cho S3 và CloudFront)
- Tài khoản Stripe

### Các bước cài đặt

1. Clone repository:

```bash
git clone <repository-url>
cd e-commerce-backend
```

2. Cài đặt các dependencies:

```bash
npm install
```

3. Cấu hình các biến môi trường trong file .env

4. Khởi động server:

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Endpoints

### Xác thực (Auth)

| Phương thức | Endpoint             | Mô tả                             | Quyền truy cập        |
| ----------- | -------------------- | --------------------------------- | --------------------- |
| POST        | `/api/auth/register` | Đăng ký tài khoản mới             | Public                |
| POST        | `/api/auth/login`    | Đăng nhập                         | Public                |
| POST        | `/api/auth/refresh`  | Làm mới token                     | Yêu cầu refresh token |
| POST        | `/api/auth/logout`   | Đăng xuất                         | Yêu cầu xác thực      |
| GET         | `/api/auth/me`       | Lấy thông tin người dùng hiện tại | Yêu cầu xác thực      |

### Quản lý quyền (Permissions)

| Phương thức | Endpoint              | Mô tả               | Quyền truy cập           |
| ----------- | --------------------- | ------------------- | ------------------------ |
| GET         | `/api/permission`     | Lấy danh sách quyền | Yêu cầu xác thực + quyền |
| POST        | `/api/permission`     | Tạo quyền mới       | Yêu cầu xác thực + quyền |
| GET         | `/api/permission/:id` | Lấy thông tin quyền | Yêu cầu xác thực + quyền |
| PATCH       | `/api/permission/:id` | Cập nhật quyền      | Yêu cầu xác thực + quyền |
| DELETE      | `/api/permission/:id` | Xóa quyền           | Yêu cầu xác thực + quyền |

### Vai trò (Roles)

| Phương thức | Endpoint        | Mô tả                 | Quyền truy cập           |
| ----------- | --------------- | --------------------- | ------------------------ |
| GET         | `/api/role`     | Lấy danh sách vai trò | Yêu cầu xác thực + quyền |
| POST        | `/api/role`     | Tạo vai trò mới       | Yêu cầu xác thực + quyền |
| GET         | `/api/role/:id` | Lấy thông tin vai trò | Yêu cầu xác thực + quyền |
| PATCH       | `/api/role/:id` | Cập nhật vai trò      | Yêu cầu xác thực + quyền |
| DELETE      | `/api/role/:id` | Xóa vai trò           | Yêu cầu xác thực + quyền |

### Sản phẩm (Products)

| Phương thức | Endpoint                   | Mô tả                                                     | Quyền truy cập           |
| ----------- | -------------------------- | --------------------------------------------------------- | ------------------------ |
| GET         | `/api/products`            | Lấy danh sách sản phẩm (hỗ trợ lọc, tìm kiếm, phân trang) | Public                   |
| POST        | `/api/products`            | Tạo sản phẩm mới                                          | Yêu cầu xác thực + quyền |
| GET         | `/api/products/:id`        | Lấy thông tin sản phẩm theo ID                            | Public                   |
| GET         | `/api/products/slug/:slug` | Lấy thông tin sản phẩm theo slug                          | Public                   |
| PATCH       | `/api/products/:id`        | Cập nhật sản phẩm                                         | Yêu cầu xác thực + quyền |
| PATCH       | `/api/products/:id/status` | Cập nhật trạng thái sản phẩm                              | Yêu cầu xác thực + quyền |
| DELETE      | `/api/products/:id`        | Xóa sản phẩm                                              | Yêu cầu xác thực + quyền |
| POST        | `/api/products/:id/view`   | Tăng lượt xem sản phẩm                                    | Public                   |

### Danh mục (Categories)

| Phương thức | Endpoint              | Mô tả                  | Quyền truy cập           |
| ----------- | --------------------- | ---------------------- | ------------------------ |
| GET         | `/api/categories`     | Lấy danh sách danh mục | Public                   |
| POST        | `/api/categories`     | Tạo danh mục mới       | Yêu cầu xác thực + quyền |
| GET         | `/api/categories/:id` | Lấy thông tin danh mục | Public                   |
| PATCH       | `/api/categories/:id` | Cập nhật danh mục      | Yêu cầu xác thực + quyền |
| DELETE      | `/api/categories/:id` | Xóa danh mục           | Yêu cầu xác thực + quyền |

### Cửa hàng (Shops)

| Phương thức | Endpoint         | Mô tả                  | Quyền truy cập           |
| ----------- | ---------------- | ---------------------- | ------------------------ |
| GET         | `/api/shops`     | Lấy danh sách cửa hàng | Public                   |
| POST        | `/api/shops`     | Tạo cửa hàng mới       | Yêu cầu xác thực         |
| GET         | `/api/shops/:id` | Lấy thông tin cửa hàng | Public                   |
| PATCH       | `/api/shops/:id` | Cập nhật cửa hàng      | Yêu cầu xác thực + quyền |
| DELETE      | `/api/shops/:id` | Xóa cửa hàng           | Yêu cầu xác thực + quyền |

### Giỏ hàng (Carts)

| Phương thức | Endpoint                        | Mô tả                              | Quyền truy cập       |
| ----------- | ------------------------------- | ---------------------------------- | -------------------- |
| POST        | `/api/carts`                    | Tạo giỏ hàng mới                   | Public/Authenticated |
| GET         | `/api/carts`                    | Lấy giỏ hàng của người dùng        | Yêu cầu xác thực     |
| GET         | `/api/carts/session/:sessionId` | Lấy giỏ hàng theo session          | Public               |
| GET         | `/api/carts/:id`                | Lấy thông tin giỏ hàng             | Public               |
| PATCH       | `/api/carts/:id`                | Cập nhật giỏ hàng                  | Public               |
| DELETE      | `/api/carts/:id`                | Xóa giỏ hàng                       | Public               |
| POST        | `/api/carts/:id/items`          | Thêm sản phẩm vào giỏ hàng         | Public               |
| PATCH       | `/api/carts/:id/items/:itemId`  | Cập nhật sản phẩm trong giỏ hàng   | Public               |
| DELETE      | `/api/carts/:id/items/:itemId`  | Xóa sản phẩm khỏi giỏ hàng         | Public               |
| DELETE      | `/api/carts/:id/items`          | Xóa tất cả sản phẩm trong giỏ hàng | Public               |
| POST        | `/api/carts/:id/coupon`         | Áp dụng mã giảm giá                | Public               |
| DELETE      | `/api/carts/:id/coupon`         | Xóa mã giảm giá                    | Public               |
| POST        | `/api/carts/:id/checkout`       | Thanh toán giỏ hàng                | Yêu cầu xác thực     |

### Danh sách yêu thích (Wishlists)

| Phương thức | Endpoint                    | Mô tả                                  | Quyền truy cập   |
| ----------- | --------------------------- | -------------------------------------- | ---------------- |
| GET         | `/api/wishlists`            | Lấy danh sách yêu thích của người dùng | Yêu cầu xác thực |
| POST        | `/api/wishlists`            | Thêm sản phẩm vào danh sách yêu thích  | Yêu cầu xác thực |
| DELETE      | `/api/wishlists/:productId` | Xóa sản phẩm khỏi danh sách yêu thích  | Yêu cầu xác thực |

### Tải lên (Uploads)

| Phương thức | Endpoint            | Mô tả        | Quyền truy cập   |
| ----------- | ------------------- | ------------ | ---------------- |
| POST        | `/api/uploads`      | Tải lên file | Yêu cầu xác thực |
| DELETE      | `/api/uploads/:key` | Xóa file     | Yêu cầu xác thực |

### Người dùng (Users)

| Phương thức | Endpoint                   | Mô tả                             | Quyền truy cập           | Mô tả chi tiết                                                                                                                                                |
| ----------- | -------------------------- | --------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/api/users`               | Lấy danh sách người dùng          | Yêu cầu xác thực + quyền |                                                                                                                                                               |
| POST        | `/api/users`               | Tạo người dùng mới                | Yêu cầu xác thực + quyền |                                                                                                                                                               |
| GET         | `/api/users/me`            | Lấy thông tin người dùng hiện tại | Yêu cầu xác thực         |                                                                                                                                                               |
| GET         | `/api/users/:id`           | Lấy thông tin người dùng theo ID  | Yêu cầu xác thực + quyền |                                                                                                                                                               |
| PATCH       | `/api/users/:id`           | Cập nhật thông tin người dùng     | Yêu cầu xác thực + quyền |                                                                                                                                                               |
| DELETE      | `/api/users/:id`           | Xóa người dùng                    | Yêu cầu xác thực + quyền |                                                                                                                                                               |
| POST        | `/api/users/become-seller` | Đăng ký trở thành người bán       | Yêu cầu xác thực         | Yêu cầu thông tin: tên cửa hàng, mô tả, địa chỉ chi tiết (địa chỉ, phường/xã, quận/huyện, tỉnh/thành phố, mã bưu điện, quốc gia), số điện thoại, logo, banner |

## Cấu trúc dự án

```
src/
├── common/         # Các utility và helper functions
├── config/         # Cấu hình ứng dụng
├── database/       # Cấu hình và migrations database
└── modules/        # Các module của ứng dụng
    ├── auth/       # Xác thực và phân quyền
    ├── carts/      # Quản lý giỏ hàng
    ├── categories/ # Quản lý danh mục
    ├── products/   # Quản lý sản phẩm
    ├── redis/      # Cấu hình Redis
    ├── shops/      # Quản lý cửa hàng
    ├── shared/     # Các module dùng chung
    ├── uploads/    # Quản lý upload file
    ├── users/      # Quản lý người dùng
    └── wishlists/  # Quản lý danh sách yêu thích
```

## Môi trường

Dự án sử dụng các biến môi trường được cấu hình trong file `.env`:

- **Server**: Cấu hình môi trường và cổng
- **Database**: Kết nối PostgreSQL
- **JWT**: Cấu hình token xác thực
- **AWS S3**: Lưu trữ file
- **Cloudfront**: CDN cho tài nguyên tĩnh
- **Stripe**: Xử lý thanh toán
- **Redis**: Cache và quản lý phiên
- **Email**: Cấu hình gửi email

## Bảo mật

- Sử dụng JWT cho xác thực
- Phân quyền dựa trên vai trò và quyền
- Mã hóa mật khẩu
- Rate limiting để ngăn chặn tấn công brute force
- Validation input để ngăn chặn tấn công injection

## Liên hệ

Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, vui lòng liên hệ:

- Email: [your-email@example.com](mailto:your-email@example.com)
- GitHub: [your-github-profile](https://github.com/your-github-profile)
