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
- **Lớp học (LopHoc):** Lưu thông tin chi tiết lớp học phần (phòng học, thứ học, thời gian bắt đầu/kết thúc học phần, danh sách sinh viên ghi danh, nhật ký điểm danh từng buổi học, và bảng điểm chi tiết của sinh viên).

## 3. Kiến trúc lưu trữ Dual-Store

Hệ thống kết hợp đồng bộ linh hoạt giữa cơ sở dữ liệu đám mây (Cloud Database) và bộ nhớ cục bộ (Local Cache):
- **MongoDB Atlas (Database chính trực tuyến):** Lưu trữ toàn bộ tài nguyên dùng chung bao gồm tài khoản người dùng, thông báo hệ thống, tài liệu/bài tập, bài làm của sinh viên nộp lên, và danh sách các lớp học phần kèm thông tin điểm số, điểm danh.
- **LocalStorage (Bộ nhớ cục bộ dự phòng):** Cache toàn bộ dữ liệu từ MongoDB Atlas về máy khách mỗi khi tải trang. Khi mất kết nối internet (chạy ngoại tuyến), LocalStorage đóng vai trò làm cơ sở dữ liệu thay thế để lưu trữ tạm thời tất cả các hành động ghi danh, điểm danh, chấm điểm và nộp bài, sau đó tự động đẩy lên server khi khôi phục mạng.
