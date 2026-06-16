# Hướng dẫn Cài đặt & Chạy dự án (MongoDB Atlas + venv)

Tài liệu này hướng dẫn chi tiết cách cài đặt môi trường ảo Python, cài đặt thư viện cần thiết, thiết lập máy chủ backend Express và chạy dự án kết nối với cơ sở dữ liệu đám mây **MongoDB Atlas**.

---

## 1. Kích hoạt môi trường ảo Python (`venv`) & Cài đặt thư viện

Dự án đã khởi tạo sẵn môi trường ảo `venv` và file danh sách thư viện `requirements.txt`. Hãy thực hiện:

1. Mở Terminal (Command Prompt hoặc PowerShell) ngay tại thư mục gốc của dự án (`BTL JS/`).
2. Kích hoạt môi trường ảo:
   - **Trên PowerShell (Windows):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Trên Command Prompt (CMD Windows):**
     ```cmd
     venv\Scripts\activate.bat
     ```
3. Chạy lệnh cài đặt các thư viện Python:
   ```bash
   pip install -r requirements.txt
   ```

---

## 2. Cài đặt các thư viện Backend (Node.js)

1. Đảm bảo máy tính của bạn đã cài đặt **Node.js** (phiên bản v18 trở lên).
2. Mở Terminal trên máy tính, di chuyển vào thư mục `backend/` của dự án:
   ```bash
   cd backend
   ```
3. Chạy lệnh cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

---

## 3. Cấu hình biến môi trường kết nối (.env)

Mở file `backend/.env` bằng trình biên dịch mã nguồn và điền link MongoDB Atlas của bạn:

```env
PORT=5000
MONGO_URI=mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority
```

*Lưu ý:* Backend cũng được viết mã nguồn tự động kết nối trực tiếp đến liên kết Atlas này nếu file cấu hình `.env` bị thiếu hoặc bị xóa.

---

## 4. Chạy Backend Server

Trong thư mục `backend/`, khởi động server:

```bash
npm run dev
```

Khi chạy thành công, terminal sẽ thông báo:
```text
>>> Server đang chạy tại địa chỉ: http://localhost:5000
>>> Kết nối thành công đến MongoDB Atlas!
>>> Đã dọn sạch database và khởi tạo đúng 2 tài khoản mẫu (1 GV, 1 SV) vào MongoDB Atlas.
```

*(Chú ý: Không chạy lệnh khởi động server từ thư mục gốc `BTL JS` vì Node sẽ báo lỗi không tìm thấy module).*

---

## 5. Tài khoản thử nghiệm mẫu (Đã lưu sẵn trên MongoDB Atlas)

Sau khi chạy server thành công lần đầu, hệ thống tự động dọn dẹp cơ sở dữ liệu và đẩy chính xác 2 tài khoản mẫu sau đây vào MongoDB Atlas của bạn để đăng nhập thử nghiệm:

| Vai trò | Email đăng nhập | Mật khẩu | Mã định danh | Họ và tên | Ngành học |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giảng viên** | `gv1@gmail.com` | `123` | `GV001` | ThS. Nguyễn Văn A | CNTT |
| **Sinh viên** | `sv1@gmail.com` | `123` | `SV202501` | Nguyễn Hữu Quyết | CNTT |

---

## 6. Chế độ Ngoại tuyến thông minh (Hybrid Fallback)

- **Khi BẬT Server Backend:** Giao diện web đăng nhập và đăng ký sẽ giao tiếp trực tuyến với MongoDB Atlas.
- **Khi TẮT Server Backend:** Giao diện tự động chuyển sang chế độ LocalStorage để bạn có thể mở chạy trực tiếp các file HTML trên trình duyệt để chấm điểm ngoại tuyến mà không gặp bất cứ lỗi hiển thị nào.
