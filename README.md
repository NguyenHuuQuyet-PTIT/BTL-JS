# 📚 Edu Report LMS

Hệ thống quản lý học tập và điều phối đào tạo dành cho khoa CNTT. Dự án phân chia rõ 3 vai trò: Sinh viên, Giảng viên và Admin.

## 🚀 Hướng dẫn chạy dự án

### 1. Khởi chạy Backend
```bash
cd backend
npm install
npm run dev
```
> Server chạy tại `http://localhost:5000` và tự động kết nối tới MongoDB Atlas.

### 2. Khởi chạy Frontend
- Mở file `frontend/index.html` trực tiếp trên trình duyệt hoặc chạy qua **Live Server** trên VS Code.
- Đã deploy tại: `https://edu--report.vercel.app/`

---

## 🔑 Tài khoản đăng nhập demo

- **Admin:** `admin` / `admin` (Quản lý tài khoản, lớp học, cổng đăng ký tín chỉ, gửi thông báo).
- **Giảng viên:** `giaovien` / `giaovien` (Điểm danh, nhập điểm, giao bài tập có đính kèm file, xem bài làm SV).
- **Sinh viên:** `sinhvien` / `sinhvien` (Xem lịch học, bảng điểm, đăng ký tín chỉ, xem bài tập và nộp bài).

---