# Báo cáo Bài tập lớn môn Lập trình Web
## Đề tài: Hệ thống Quản lý Học tập & Điều phối Đào tạo LMS - Edu Report

---

## 1. Giới thiệu tổng quan
Hệ thống **Edu Report LMS** hỗ trợ quản lý đào tạo trực tuyến dành cho khoa CNTT, chia làm 3 phân hệ chính:
- **Quản trị viên (Admin):** Quản lý tài khoản, điều phối lớp học phần, đóng/mở cổng đăng ký tín chỉ và gửi thông báo chung.
- **Giảng viên:** Quản lý lịch dạy, nhập điểm thành phần, điểm danh, giao bài tập (kèm file) và chấm bài sinh viên trực tiếp.
- **Sinh viên:** Đăng ký tín chỉ, tra cứu lịch học, xem điểm số, nhận thông báo giao bài tập và nộp bài trực tuyến.

---

## 2. Công nghệ sử dụng
- **Frontend:** HTML5, CSS3 (Glassmorphism Canva-style), JavaScript ES6.
- **Biểu đồ:** Chart.js hiển thị học lực và chuyên cần.
- **Backend:** Node.js, Express.js REST API.
- **Database:** MongoDB Atlas (lưu tài khoản, thông báo, tài liệu, bài nộp).
- **Cache:** LocalStorage lưu lịch học, điểm, danh sách điểm danh và hỗ trợ chạy offline.
- **Thư viện xem tài liệu:** `mammoth.js` đọc trực tuyến file Word (.docx) chuyển đổi sang HTML.

---

## 3. Các tính năng nổi bật & Nâng cấp cốt lõi

### A. Giao bài & Nộp bài tự động hiển thị trực quan (Inline Preview)
- **Tự động xem thử:** Loại bỏ nút "Xem trực tiếp" trước đây dễ gây lỗi tải file không mong muốn. Tệp đính kèm bài tập (Word, PDF, Ảnh, Video, Audio, Txt) sẽ tự động được kết xuất và hiển thị trực tiếp ngay bên dưới phần mô tả đề bài (ở phía SV) hoặc ngay dưới danh sách bài nộp (ở phía GV).
- **Mammoth.js Word Reader:** Dịch động tệp Word (.docx) lưu ở dạng Base64 trên DB sang HTML hiển thị cục bộ mượt mà, không yêu cầu Office online.

### B. Đóng hộp thoại thông minh bằng Click ngoài (Click Outside to Close)
- Bất kể modal nào (nhập điểm, điểm danh, nộp bài, xem file) hoặc thông báo Alert/Confirm tùy biến đều có thể đóng nhanh bằng cách click ra vùng nền tối bên ngoài.
- Hệ thống tự tắt âm thanh/video hoặc dừng tải iframe tài liệu chạy ngầm khi modal đóng đột ngột.

### C. Cơ chế lưu trữ lai (Dual-Store Architecture)
- Dữ liệu tài khoản, thông báo hệ thống và bài nộp được lưu trữ tập trung trên MongoDB Cloud Atlas.
- Các dữ liệu học tập cá nhân như thời khóa biểu lớp, điểm số và thông tin điểm danh được lưu local để tăng tốc độ phản hồi và hoạt động offline.
