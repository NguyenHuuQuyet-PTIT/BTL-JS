## 🛠️ Hướng dẫn cài đặt & Chạy ứng dụng

### Bước 1: Kích hoạt venv & Cài đặt thư viện
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

## 🔑 Tài khoản thử nghiệm mẫu

* **Tài khoản Sinh viên:**
  - Email: `sv1@gmail.com` | Mật khẩu: `123`
* **Tài khoản Giảng viên:**
  - Email: `gv1@gmail.com` | Mật khẩu: `123`
