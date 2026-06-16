# BÁO CÁO BÀI TẬP LỚN MÔN LẬP TRÌNH WEB
**ĐỀ TÀI: HỆ THỐNG QUẢN LÝ HỌC TẬP & ĐÀO TẠO (EDU REPORT LMS)**

---

## 1. Giới thiệu chung
Dự án **Edu Report LMS** là một ứng dụng quản lý học tập dành riêng cho cơ sở đào tạo, hỗ trợ hai đối tượng sử dụng chính là **Sinh viên** và **Giảng viên** ngành Công nghệ thông tin. Hệ thống cung cấp đầy đủ các tính năng hỗ trợ học tập, giảng dạy trực tuyến, quản lý điểm và chuyên cần.

---

## 2. Công nghệ sử dụng
- **Frontend (Giao diện):**
  - **HTML5:** Xây dựng khung cấu trúc trang web động và biểu mẫu.
  - **Vanilla CSS3:** Thiết kế giao diện hiện đại, sử dụng hệ màu xanh nhẹ chủ đạo, bo góc tròn, đổ bóng mờ mềm mại và tương thích tốt trên các thiết bị di động (Responsive UI).
  - **JavaScript (ES6):** Xử lý tương tác DOM trực tiếp, tính toán điểm trung bình, lọc dữ liệu thông báo và vẽ biểu đồ trực quan thông qua thư viện `Chart.js`.
- **Backend (Máy chủ):**
  - **Node.js & Express:** Xây dựng hệ thống API web xử lý các yêu cầu đăng ký tài khoản mới và xác thực đăng nhập.
- **Database (Cơ sở dữ liệu):**
  - **MongoDB Atlas (Cloud):** Lưu trữ tập trung cơ sở dữ liệu người dùng (User).
  - **Local Storage:** Lưu trữ đệm thông tin lớp học, lịch học, lịch giảng dạy mẫu và phục vụ làm cơ chế chạy ngoại tuyến (Offline fallback) khi server backend không hoạt động.

---

## 3. Các chức năng chính của dự án

### A. Chức năng chung (Hệ thống)
- **Đăng ký tài khoản:** Cho phép người dùng đăng ký tài khoản Sinh viên hoặc Giảng viên với các thông tin cá nhân.
- **Đăng nhập phân quyền:** Xác thực tài khoản trực tiếp qua MongoDB Atlas. Tự động chuyển hướng về trang Dashboard tương ứng dựa trên quyền truy cập.
- **Thay đổi hồ sơ cá nhân:** Cho phép cập nhật lại mật khẩu mới, số điện thoại hoặc ngày sinh trực tiếp trên giao diện.

### B. Chức năng dành cho Sinh viên
- **Thống kê tổng hợp:** Xem nhanh số môn học đã tham gia, điểm trung bình chung tích lũy (GPA) và tỷ lệ chuyên cần.
- **Thời khóa biểu tuần:** Xem lịch học cụ thể theo các thứ trong tuần kèm phòng học và tiết học cụ thể.
- **Tiến trình lớp học:** Theo dõi tỷ lệ phần trăm số buổi học đã diễn ra của từng lớp học phần đã đăng ký.
- **Biểu đồ trực quan:** Vẽ biểu đồ cột thống kê số buổi đi học/muộn/vắng và biểu đồ tròn phân loại học lực cá nhân.
- **Đăng ký học phần:** Đăng ký hoặc hủy đăng ký lớp học phần trực tiếp khi cổng đăng ký tín chỉ mở (có hệ thống kiểm tra tránh trùng thời khóa biểu).
- **Hộp thư thông báo:** Nhận và lọc thông báo liên quan từ nhà trường hoặc giảng viên lớp học.

### C. Chức năng dành cho Giảng viên
- **Quản lý giảng dạy:** Thống kê tổng số lớp đang phụ trách và tổng số sinh viên đang giảng dạy.
- **Lịch dạy tuần:** Xem lịch biểu đứng lớp trong tuần cụ thể.
- **Quản lý điểm số:** Tra cứu danh sách sinh viên theo từng lớp và thực hiện nhập điểm Chuyên cần, Giữa kỳ, Cuối kỳ trực tiếp. Hệ thống sẽ tự động tính điểm trung bình tổng kết.
- **Điểm danh học viên:** Thực hiện điểm danh (Có mặt, Muộn, Vắng) cho từng buổi học cụ thể của lớp học phần.
- **Quản lý thông báo:** Soạn thảo và gửi thông báo mới cho các lớp học phụ trách, có tính năng sửa/xóa các thông báo đã gửi.
- **Điều phối lớp học:** Khởi tạo lớp học mới chuyên ngành CNTT, thiết lập thời gian học, chỉnh sửa thông tin lớp, thêm học viên thủ công vào lớp hoặc đóng/mở cổng đăng ký học phần của sinh viên.

---

## 4. Cấu trúc thư mục dự án
- `/backend`: Thư mục chứa mã nguồn backend Node.js.
  - `/models`: Định nghĩa Schema dữ liệu MongoDB (User.js).
  - `server.js`: Trình khởi chạy máy chủ Express kết nối MongoDB Atlas.
  - `.env`: Lưu trữ cấu hình biến môi trường và cổng kết nối.
  - `package.json`: Khai báo các thư viện phụ thuộc của backend.
- `/frontend`: Thư mục chứa mã nguồn giao diện người dùng tĩnh.
  - `/css`: Thư mục lưu trữ file thiết kế giao diện (`style.css`).
  - `/js`: Thư mục lưu file logic JavaScript (`app.js`).
  - `index.html`: Giao diện trang đăng nhập và đăng ký tài khoản.
  - `student-dashboard.html`: Giao diện trang làm việc của sinh viên.
  - `teacher-dashboard.html`: Giao diện trang làm việc của giảng viên.
- `/venv`: Thư mục môi trường ảo Python.
- `requirements.txt`: Khai báo các thư viện Python hỗ trợ quản lý dự án.
- `README.md`: Hướng dẫn cài đặt và chạy nhanh dự án.
- `KetNoi_MongoDB.md`: Tài liệu giải thích cách thức kết nối database.
- `HuongDan_MongoDB.md`: Hướng dẫn cài đặt chi tiết và vận hành hệ thống.
