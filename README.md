## 🛠️ Hướng dẫn cài đặt & Chạy ứng dụng


### Bước 1: Kích hoạt venv & Cài đặt thư viện Python
1. Mở Terminal (PowerShell hoặc CMD) tại thư mục gốc `BTL JS`.
2. Kích hoạt môi trường ảo:
   - **Trên PowerShell:**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Trên CMD:**
     ```cmd
     venv\Scripts\activate.bat
     ```
3. Cài đặt các thư viện Python từ file `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

---

### Bước 2: Cài đặt thư viện Node.js & Chạy Backend
1. Từ thư mục gốc, di chuyển terminal vào thư mục `backend/`:
   ```bash
   cd backend
   ```
2. Cài đặt các gói npm:
   ```bash
   npm install
   ```
3. Khởi động server:
   ```bash
   npm run dev
   ```
   *(Lưu ý: Không chạy `node server.js` trực tiếp từ thư mục gốc vì Node sẽ không tìm thấy file. Bạn bắt buộc phải vào thư mục `backend/` trước).*

---

### Bước 3: Mở Giao diện Frontend
Mở file [frontend/index.html](file:///c:/Users/quyet/Desktop/BTL%20JS/frontend/index.html) trực tiếp bằng trình duyệt của bạn để trải nghiệm hệ thống!

---

## 🔑 Tài khoản thử nghiệm mẫu (Đã lưu sẵn trên MongoDB Atlas)

* **Tài khoản Sinh viên:**
  - Email: `sv1@gmail.com` | Mật khẩu: `123` (Nguyễn Hữu Quyết)
* **Tài khoản Giảng viên:**
  - Email: `gv1@gmail.com` | Mật khẩu: `123` (ThS. Nguyễn Văn A)

---

## ❔ File `backend/models/User.js` dùng để làm gì?

Tệp tin [backend/models/User.js](file:///c:/Users/quyet/Desktop/BTL%20JS/backend/models/User.js) định nghĩa cấu trúc dữ liệu người dùng (Schema) thông qua **Mongoose** bao gồm các trường:
* `id` (mã số định danh), `name` (họ và tên), `email` (email đăng nhập), `password` (mật khẩu), `role` (vai trò: sinh-vien hoặc giang-vien), `dob` (ngày sinh), `phone` (số điện thoại), và `readNotifs` (danh sách ID thông báo đã đọc).
* Mongoose sẽ tự động kiểm tra tính hợp lệ của dữ liệu trước khi lưu trữ vào MongoDB Atlas.
