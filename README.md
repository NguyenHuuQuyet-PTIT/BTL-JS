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

## ✨ Các tính năng cốt lõi

- **Giao bài & Nộp bài trực tuyến:** Giảng viên upload đề bài (kèm file); Sinh viên làm và nộp trực tiếp.
- **Xem file inline không cần tải về:** Tự động mở xem trước PDF, ảnh, video, âm thanh, file văn bản và Word (.docx sử dụng `mammoth.js`) ngay trong trang.
- **Đóng hộp thoại thông minh:** Click ra vùng ngoài (overlay) để tự động ẩn các modal hoặc hộp thoại thông báo, tự động dừng audio/video chạy ngầm.
- **Đồng bộ cơ sở dữ liệu:** Kết hợp lưu MongoDB Atlas (dữ liệu chính) và LocalStorage (cache offline).