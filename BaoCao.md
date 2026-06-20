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

---

## 4. Các hàm chức năng cốt lõi và hay dùng nhất (Dành cho thuyết trình và báo cáo)
Dưới đây là danh sách các hàm quan trọng nhất của hệ thống, được chú thích dễ hiểu để phục vụ báo cáo và thuyết trình:

### 1. Hàm hiển thị file đính kèm trực quan (`hienThiXemFileInline` - nằm trong `app.js`)
* **Vai trò:** Tự động nhận dạng loại file (Word `.docx`, `.pdf`, hình ảnh, video, âm thanh, text thuần) và dựng bản xem trước trực tiếp trên web.
* **Cách hoạt động:** Dựng file Word thành HTML thông qua thư viện `mammoth.js`, nhúng PDF qua Blob URL trong thẻ `<iframe>`, và dựng các trình phát đa phương tiện HTML5 cho video/audio.

### 2. Bộ đôi đọc ghi dữ liệu cục bộ an toàn (`layCSDL` & `ghiCSDL` - nằm trong `app.js`)
* **Vai trò:** Làm nhiệm vụ đọc/ghi dữ liệu tạm thời vào bộ nhớ trình duyệt `LocalStorage`.
* **Đặc điểm nổi bật:** Tự động bắt lỗi tràn bộ nhớ (giới hạn 5MB của trình duyệt). Nếu phát hiện bộ nhớ đầy, hàm sẽ tự động xóa bớt các file đính kèm cũ để ứng dụng luôn chạy ổn định.

### 3. Hàm đồng bộ dữ liệu tự động (`dongBoDuLieuTuDong` - nằm trong `app.js`)
* **Vai trò:** Chạy ngầm liên tục (mỗi 15 giây) để đồng bộ dữ liệu giữa máy khách và cơ sở dữ liệu MongoDB Atlas trực tuyến.
* **Cách hoạt động:** Thực hiện các cuộc gọi `fetch` đến các API endpoint để kéo về các thông tin mới nhất về tài khoản, thông báo, lớp học phần, bài tập và bài nộp của sinh viên.

### 4. Hàm đăng ký lớp học phần (`dangKyLopHoc` - nằm trong `sinhvien.js`)
* **Vai trò:** Xử lý thao tác sinh viên bấm đăng ký học phần tín chỉ.
* **Cách hoạt động:** Ghi danh ID sinh viên vào lớp học tương ứng, khởi tạo bảng điểm trống (chuyên cần, giữa kỳ, cuối kỳ) cho sinh viên đó và gọi API đồng bộ lên server trực tuyến.