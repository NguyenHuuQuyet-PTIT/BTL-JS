# Tài liệu kết nối database MongoDB Atlas

File này lưu lại cách cấu hình và luồng đồng bộ dữ liệu giữa Server Node.js với database đám mây MongoDB Atlas phục vụ cho bài tập lớn.

---

## 1. Cấu hình kết nối trên Server (`backend/server.js`)

*   **Sử dụng Mongoose:** Import thư viện bằng lệnh `const mongoose = require('mongoose');`.
*   **Địa chỉ kết nối (URI):**
    ```javascript
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority';
    ```
    Chuỗi kết nối này được cấu hình ưu tiên đọc từ file môi trường `.env`. Nếu không có, mặc định sẽ kết nối trực tiếp vào database tên là `edu-report` trên cụm Cluster0 của Atlas.
*   **Xử lý kết nối:**
    ```javascript
    mongoose.connect(MONGO_URI)
        .then(async () => {
            console.log('Kết nối thành công đến MongoDB Atlas.');
            await taoDuLieuMau();
        })
    ```
    Khi kết nối thành công, hệ thống sẽ kiểm tra xem database đã có tài khoản nào chưa. Nếu chưa có gì, hàm `taoDuLieuMau()` sẽ tự động chèn 3 tài khoản thử nghiệm của Admin, Giảng viên và Sinh viên.

---

## 2. Luồng đi của dữ liệu giữa Frontend, Backend và Database

*   **Bước 1: Đăng nhập** -> Giao diện gửi yêu cầu lên API `/api/auth/dang-nhap`. Server kiểm tra thông tin trong bảng `users` trên MongoDB Atlas. Nếu khớp thì cho phép đăng nhập và lưu tạm thông tin user vào `localStorage`.
*   **Bước 2: Quản lý tài khoản (Admin)** -> Khi Admin thêm mới hoặc sửa/xóa tài khoản, client gửi lệnh đến các API (`/api/auth/dang-ky`, `/api/nguoi-dung/:id`). Server sẽ thực hiện ghi trực tiếp vào MongoDB Atlas.
*   **Bước 3: Đồng bộ ngược** -> Khi bất kỳ phân quyền nào đăng nhập thành công hoặc tải trang dashboard, một tác vụ chạy ngầm sẽ gọi API `/api/nguoi-dung` để kéo toàn bộ danh sách tài khoản mới nhất từ MongoDB Atlas về lưu đè vào `localStorage` của trình duyệt. Điều này đảm bảo dữ liệu hiển thị của cả Sinh viên, Giảng viên và Quản trị viên luôn trùng khớp với nhau.
