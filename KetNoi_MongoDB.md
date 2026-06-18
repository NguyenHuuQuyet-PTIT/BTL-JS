# Kết nối MongoDB Atlas

---

## I. Chuỗi kết nối trong `backend/server.js`

### 1. Thư viện Mongoose
```javascript
const mongoose = require('mongoose');
```
Mongoose giúp Node.js giao tiếp và quản lý dữ liệu với MongoDB.

### 2. Chuỗi kết nối (URI)
```javascript
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://...:...@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority';
```
- Ưu tiên đọc từ file `.env`, nếu không có thì dùng chuỗi mặc định.
- Database sử dụng: `edu-report`

### 3. Thực hiện kết nối
```javascript
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Kết nối thành công đến MongoDB Atlas.');
        await taoDuLieuMau();
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err.message);
    });
```
- Kết nối thành công → khởi tạo tài khoản mẫu nếu DB trống.
- Kết nối thất bại → in thông tin lỗi ra console.

---

## II. Luồng dữ liệu Frontend ↔ Backend

1. **Đăng nhập:** Frontend gửi `POST /api/auth/dang-nhap` → Backend tra cứu MongoDB → trả về thông tin user.
2. **Tạo tài khoản (Admin):** Frontend gửi `POST /api/auth/dang-ky` → Backend lưu vào MongoDB.
3. **Sửa/Xóa tài khoản:** Admin gửi `PUT /api/nguoi-dung/:id` hoặc `DELETE /api/nguoi-dung/:id`.
4. **Đồng bộ:** Sau mỗi thao tác, Frontend cập nhật LocalStorage để hỗ trợ chế độ ngoại tuyến.
