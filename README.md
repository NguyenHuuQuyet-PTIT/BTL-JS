# 🏫 Hệ thống Quản lý Học tập Edu Report LMS

Hệ thống quản lý điểm số, chuyên cần, lịch học và thông báo dành cho Sinh viên, Giảng viên và Quản trị viên chuyên ngành Công nghệ thông tin.

---

## 🛠️ Hướng dẫn cài đặt và vận hành

### Bước 1: Khởi tạo cơ sở dữ liệu & Chạy Server Backend
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện cần thiết
npm install

# Khởi chạy server ở chế độ phát triển
npm run dev
```
- Server chạy mặc định tại cổng `5000` (`http://localhost:5000`).
- Cơ sở dữ liệu tự động kết nối tới MongoDB Atlas.

### Bước 2: Mở giao diện Frontend
- Chạy trực tiếp qua Live Server hoặc mở file [index.html](file:///c:/Users/quyet/Desktop/BTL%20%20JS/frontend/index.html) bằng trình duyệt web.

---

## 🔑 Danh sách tài khoản mẫu

| Vai trò | Tên đăng nhập / Email | Mật khẩu | Chức năng chính |
|---------|-----------------------|----------|-----------------|
| **Quản trị viên** | `admin` | `admin` | CRUD tài khoản trên MongoDB Atlas, điều phối lớp học phần, lịch học, giảng viên, sinh viên và đóng/mở cổng tín chỉ. |
| **Giảng viên** | `giaovien` | `giaovien` | Xem danh sách lớp dạy, nhập điểm thành phần, điểm danh từng buổi, soạn và gửi thông báo tới sinh viên. |
| **Sinh viên** | `sinhvien` | `sinhvien` | Xem thời khóa biểu, điểm số tích lũy, biểu đồ học lực, biểu đồ chuyên cần, đăng ký hoặc hủy lớp học phần. |

---

## 📁 Cấu trúc thư mục chính của dự án

- `backend/` — Server Node.js/Express và kết nối database MongoDB Atlas.
- `frontend/` — Giao diện HTML/CSS và mã nguồn điều hướng JavaScript.
  - `frontend/index.html` — Trang đăng nhập hệ thống.
  - `frontend/admin.html` — Giao diện của Quản trị viên.
  - `frontend/teacher-dashboard.html` — Giao diện của Giảng viên.
  - `frontend/student-dashboard.html` — Giao diện của Sinh viên.
  - `frontend/js/` — Các file JavaScript xử lý nghiệp vụ cho từng vai trò.