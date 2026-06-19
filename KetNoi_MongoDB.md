# 🗄️ Kết nối & Kiến trúc Database - Edu Report LMS

Tài liệu tóm tắt về cấu hình MongoDB Atlas, cấu trúc dữ liệu và cơ chế đồng bộ dữ liệu.

## 1. Cấu hình MongoDB (`backend/server.js`)

Kết nối tới cơ sở dữ liệu MongoDB Atlas bằng Mongoose qua biến môi trường hoặc chuỗi kết nối mặc định:
```javascript
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://...';
mongoose.connect(MONGO_URI);
```
Dữ liệu mẫu (tài khoản demo, môn học, thông báo) sẽ tự động được khởi tạo trên DB nếu các collection trống khi server chạy lần đầu.

## 2. Cấu trúc Schema chính

- **Người dùng (NguoiDung):** Lưu thông tin tài khoản, mật khẩu, vai trò (`admin`, `giang-vien`, `sinh-vien`) và danh sách thông báo đã đọc.
- **Thông báo (ThongBao):** Nội dung thông báo hệ thống, đính kèm `materialId` (nếu liên kết với bài tập cụ thể).
- **Tài liệu/Bài tập (TaiLieu):** Lưu file đề bài (Base64 trong trường `link`), tên file, mô tả chi tiết và loại tài nguyên (`lecture` hoặc `assignment`).
- **Bài nộp (NopBai):** Lưu thông tin SV nộp bài, thời gian nộp và nội dung bài nộp (Base64 hoặc link liên kết).

## 3. Kiến trúc lưu trữ Dual-Store

Hệ thống kết hợp đồng bộ giữa Cloud Database và Local Cache:
- **MongoDB Atlas (Database chính):** Quản lý tài khoản (Users), thông báo (Notifications), tài liệu bài tập (Materials) và các bài nộp của học sinh (Submissions).
- **LocalStorage (Cache & Offline):** Cache dữ liệu từ server khi load trang, đồng thời trực tiếp quản lý các tính năng chạy local bao gồm thời khóa biểu lớp học, thông tin điểm số thành phần và danh sách điểm danh.
