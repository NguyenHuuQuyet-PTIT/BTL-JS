# Báo cáo Bài tập lớn môn Lập trình Web
## Đề tài: Hệ thống Quản lý Học tập & Điều phối Đào tạo LMS

---

## 1. Giới thiệu tổng quan về đề tài
Hệ thống **Edu Report LMS** được phát triển nhằm tối ưu hóa việc quản lý thông tin đào tạo của khoa CNTT. Hệ thống phân chia người dùng thành **3 nhóm vai trò**:
1.  **Quản trị viên (Admin):** Quản lý nhân sự, tài khoản, thiết lập lớp học phần và gửi thông báo chung toàn trường.
2.  **Giảng viên:** Theo dõi lớp dạy, chấm điểm thành phần, điểm danh và gửi thông báo lớp học.
3.  **Sinh viên:** Tra cứu lịch học, xem kết quả học tập (điểm số, chuyên cần) và đăng ký tín chỉ trực tuyến.

---

## 2. Công nghệ sử dụng trong dự án
*   **Giao diện (Frontend):** Sử dụng HTML5 làm khung xương, CSS3 tạo giao diện (phong cách Glassmorphism hiện đại) và Javascript (ES6) để xử lý logic tương tác. Thống kê điểm số và chuyên cần của sinh viên được hiển thị bằng thư viện **Chart.js**.
*   **Máy chủ (Backend):** Sử dụng môi trường Node.js kết hợp framework Express để viết các API xác thực, CRUD tài khoản, quản lý thông báo.
*   **Cơ sở dữ liệu (Database):** Lưu trữ tài khoản tập trung và thông báo trên **MongoDB Atlas** (thông qua Mongoose). Lưu trữ lịch học, kết quả điểm danh, điểm số học tập cục bộ qua **LocalStorage** của trình duyệt.

---

## 3. Phân chia chức năng chính theo vai trò

### Quản trị viên (Admin)
*   Thực hiện thêm mới, cập nhật thông tin hoặc xóa tài khoản giảng viên/sinh viên (đồng bộ trực tiếp lên MongoDB Atlas).
*   Tạo lớp học phần mới, phân phòng học, gán giảng viên đứng lớp và tính lịch học tự động trong kỳ.
*   Quản lý danh sách sinh viên ghi danh trong lớp, thêm/bớt sinh viên hoặc điều chỉnh lịch ca học.
*   Đóng hoặc mở cổng đăng ký tín chỉ trực tuyến cho toàn bộ sinh viên.
*   **Gửi thông báo hệ thống:** Soạn và gửi thông báo tới tất cả sinh viên hoặc tất cả giảng viên. Dữ liệu được lưu trữ tập trung trên MongoDB Atlas để đồng bộ thời gian thực cho mọi thiết bị.

### Giảng viên
*   Xem danh sách các lớp học phần được phân công giảng dạy và lịch dạy hàng tuần.
*   Nhập và lưu điểm thành phần (chuyên cần, giữa kỳ, cuối kỳ) cho sinh viên trong lớp học phần.
*   Tích điểm danh (có mặt, đi muộn, vắng mặt) cho sinh viên theo từng buổi học.
*   Soạn thảo, gửi thông báo hoặc sửa/xóa các thông báo đã gửi cho sinh viên (lưu trữ đồng bộ trên MongoDB).
*   Đăng tải, chia sẻ các tài liệu giảng dạy, slide bài giảng hoặc bài tập tự học lên lớp học phần phụ trách để sinh viên cùng lớp xem (đồng bộ trực tuyến).

### Sinh viên
*   Xem thời khóa biểu tuần học cá nhân.
*   Theo dõi tiến trình học tập, bảng điểm chi tiết và thống kê số buổi chuyên cần (biểu đồ trực quan).
*   Đăng ký lớp học phần mới hoặc hủy học phần cũ khi cổng đăng ký được Admin mở.
*   Nhận và đọc thông báo từ Admin hệ thống hoặc giảng viên đứng lớp gửi tới lớp học phần của mình.
*   Xem danh sách bài giảng, bài tập hoặc tài liệu tham khảo do chính giảng viên đứng lớp đó đăng tải.

---

## 4. Chú thích chức năng của các hàm cốt lõi

### A. Server Backend (`backend/server.js`)
*   `taoDuLieuMau()`: Tự động tạo tài khoản thử nghiệm, các thông báo mẫu và tài liệu mẫu nếu cơ sở dữ liệu trống.
*   `POST /api/auth/dang-ky`: API tạo tài khoản người dùng mới.
*   `POST /api/auth/dang-nhap`: API đăng nhập (hỗ trợ cả Email hoặc mã ID).
*   `GET /api/nguoi-dung`: API lấy toàn bộ danh sách tài khoản.
*   `PUT /api/nguoi-dung/:id` & `DELETE /api/nguoi-dung/:id`: API sửa/xóa tài khoản.
*   `GET /api/thong-bao`: API lấy danh sách toàn bộ thông báo từ MongoDB Atlas.
*   `POST /api/thong-bao`: API lưu thông báo mới (Admin gửi hoặc Giảng viên gửi).
*   `DELETE /api/thong-bao/:id`: API xóa thông báo khỏi hệ thống.
*   `GET /api/tai-lieu`: API lấy danh sách tài liệu học tập của các lớp học phần.
*   `POST /api/tai-lieu`: API lưu tài liệu học tập mới (giảng viên chia sẻ).
*   `DELETE /api/tai-lieu/:id`: API xóa tài liệu học tập khỏi lớp.
*   `GET /api/nop-bai`: API lấy danh sách bài làm sinh viên đã nộp.
*   `POST /api/nop-bai`: API lưu hoặc cập nhật liên kết nộp bài làm trực tuyến.

### B. Core xử lý chung (`frontend/js/app.js`)
*   `hienThiAlertTuyBien()`: Hiển thị popup thông báo thay thế alert mặc định của trình duyệt.
*   `hienThiConfirmTuyBien()`: Hiển thị popup xác nhận thao tác thay thế confirm mặc định.
*   `layCSDL()` / `ghiCSDL()`: Hàm đọc/ghi dữ liệu LocalStorage.
*   `capNhatLopCSDL()`: Cập nhật thông tin lớp học phần.
*   `xuLyDangXuat()`: Xóa phiên làm việc hiện tại và quay lại trang đăng nhập.
*   `khoiTaoGiaoDienChung()`: Cấu hình sidebar và hành động chuyển đổi Tab.
*   **Đồng bộ ngầm (DOMContentLoaded):** Tự động fetch danh sách người dùng, thông báo, tài liệu học tập và danh sách bài nộp từ MongoDB Atlas về LocalStorage mỗi lần người dùng tải lại trang.

### C. Vai trò Sinh viên (`frontend/js/sinhvien.js`)
*   `khoiTaoGiaoDienSinhVien()`: Khởi chạy tải thời khóa biểu, điểm số và thông báo.
*   `hienThiBaoCaoHocTapSinhVien()`: Tính GPA hệ 4 và vẽ biểu đồ chuyên cần.
*   `hienThiTabDangKyTinChi()`: Cho phép đăng ký/hủy lớp tín chỉ khi cổng mở.
*   `moHopThoaiLopSinhVien()` & `moModalNopBai()`: Xem chi tiết lớp học, kết quả chuyên cần, slide tài liệu học tập và nộp bài làm trực tuyến.

### D. Giao diện Giảng viên (`frontend/js/giaovien.js`)
*   `hienThiDiemHocSinhGiangVien()` & `luuDiemHocSinhGiangVien()`: Hiển thị và lưu điểm thành phần học sinh.
*   `hienThiBuoiHocGiangVien()` & `moHopThoaiDiemDanhGiangVien()` & `luuDiemDanhGiangVien()`: Xem buổi học và chốt điểm danh.
*   `hienThiTaiLieuGiangVien()` & `xoaTaiLieuGiangVien()` & `xemDanhSachNopBai()`: Hiển thị danh sách tài liệu, xử lý tải/xóa tài liệu và xem chi tiết danh sách bài nộp của sinh viên.
*   `hienThiThongBaoGiangVien()` & `xoaThongBaoGiangVien()`: Gửi/nhận và quản lý thông báo.

### E. Giao diện Admin (`frontend/js/admin.js`)
*   `hienThiDanhSachTaiKhoan()` & `xoaTaiKhoan()`: Quản trị tài khoản người dùng qua API.
*   `moChiTietLopDieuPhoi()` & `themSinhVienVaoLopDieuPhoi()`: Điều phối nhân sự lớp học.
*   `hienThiDanhSachThongBaoAdmin()`: Tải và hiển thị danh sách thông báo do Admin gửi.
*   `khoiTaoLangNgheThongBaoAdmin()`: Bắt sự kiện form soạn và gửi thông báo của Admin lên MongoDB Atlas qua API.
*   `xoaThongBaoAdmin()`: Gửi yêu cầu xóa thông báo lên MongoDB qua API.

---

## 5. Tổ chức cấu trúc thư mục dự án
*   `/backend`: Chứa mã nguồn server Node.js/Express, file cấu hình và các schema model Mongoose (`NguoiDung.js`, `ThongBao.js`, `TaiLieu.js`, `NopBai.js`).
*   `/frontend`: Chứa giao diện tĩnh HTML và tệp style CSS.
*   `/frontend/js`: Chứa các tệp logic nghiệp vụ JavaScript.
