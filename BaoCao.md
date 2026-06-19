# Báo cáo Bài tập lớn môn Lập trình Web
## Đề tài: Hệ thống Quản lý Học tập & Điều phối Đào tạo LMS

---

## 1. Giới thiệu tổng quan về đề tài
Hệ thống **Edu Report LMS** được phát triển nhằm tối ưu hóa việc quản lý thông tin đào tạo của khoa CNTT. Hệ thống phân chia người dùng thành **3 nhóm vai trò**:
1.  **Quản trị viên (Admin):** Quản lý nhân sự, tài khoản và thiết lập các lớp học phần.
2.  **Giảng viên:** Theo dõi lớp dạy, chấm điểm thành phần, điểm danh và gửi thông báo.
3.  **Sinh viên:** Tra cứu lịch học, xem kết quả học tập (điểm số, chuyên cần) và đăng ký tín chỉ trực tuyến.

---

## 2. Công nghệ sử dụng trong dự án
*   **Giao diện (Frontend):** Sử dụng HTML5 làm khung xương, CSS3 tạo giao diện (phong cách Glassmorphism hiện đại) và Javascript (ES6) để xử lý logic tương tác. Thống kê điểm số và chuyên cần của sinh viên được hiển thị bằng thư viện **Chart.js**.
*   **Máy chủ (Backend):** Sử dụng môi trường Node.js kết hợp framework Express để viết các API xác thực, CRUD tài khoản.
*   **Cơ sở dữ liệu (Database):** Lưu trữ tài khoản tập trung trên **MongoDB Atlas** (thông qua Mongoose). Lưu trữ lịch học, kết quả điểm danh, điểm số học tập và thông báo cục bộ qua **LocalStorage** của trình duyệt (để hỗ trợ chạy offline khi mất mạng).

---

## 3. Phân chia chức năng chính theo vai trò

### Quản trị viên (Admin)
*   Thực hiện thêm mới, cập nhật thông tin hoặc xóa tài khoản giảng viên/sinh viên (đồng bộ trực tiếp lên MongoDB Atlas).
*   Tạo lớp học phần mới, phân phòng học, gán giảng viên đứng lớp và tính lịch học tự động trong kỳ.
*   Quản lý danh sách sinh viên ghi danh trong lớp, thêm/bớt sinh viên hoặc điều chỉnh lịch ca học.
*   Đóng hoặc mở cổng đăng ký tín chỉ trực tuyến cho toàn bộ sinh viên.

### Giảng viên
*   Xem danh sách các lớp học phần được phân công giảng dạy và lịch dạy hàng tuần.
*   Nhập và lưu điểm thành phần (chuyên cần, giữa kỳ, cuối kỳ) cho sinh viên trong lớp học phần.
*   Tích điểm danh (có mặt, đi muộn, vắng mặt) cho sinh viên theo từng buổi học.
*   Soạn thảo, gửi thông báo hoặc sửa/xóa các thông báo đã gửi cho sinh viên.

### Sinh viên
*   Xem thời khóa biểu tuần học cá nhân.
*   Theo dõi tiến trình học tập, bảng điểm chi tiết và thống kê số buổi chuyên cần (biểu đồ trực quan).
*   Đăng ký lớp học phần mới hoặc hủy học phần cũ khi cổng đăng ký được Admin mở.
*   Nhận và đọc thông báo của giảng viên đứng lớp.

---

## 4. Chú thích chức năng của các hàm cốt lõi

### A. Server Backend (`backend/server.js`)
*   `taoDuLieuMau()`: Tự động tạo 3 tài khoản thử nghiệm nếu cơ sở dữ liệu trống.
*   `POST /api/auth/dang-ky`: API tạo tài khoản người dùng mới (kiểm tra trùng mã ID/Email).
*   `POST /api/auth/dang-nhap`: API xác thực tài khoản (hỗ trợ nhập cả Email hoặc mã ID định danh).
*   `GET /api/nguoi-dung`: API lấy toàn bộ danh sách tài khoản đang có trong hệ thống.
*   `PUT /api/nguoi-dung/:id`: API cập nhật thông tin cá nhân hoặc mật khẩu của người dùng.
*   `DELETE /api/nguoi-dung/:id`: API xóa tài khoản vĩnh viễn khỏi database.

### B. Core xử lý chung (`frontend/js/app.js`)
*   `hienThiAlertTuyBien()`: Hiển thị popup thông báo lỗi/thành công thay thế alert mặc định của trình duyệt.
*   `hienThiConfirmTuyBien()`: Hiển thị popup xác nhận thao tác (Đồng ý/Hủy) thay thế confirm mặc định.
*   `layCSDL()` / `ghiCSDL()`: Hàm đọc/ghi dữ liệu với LocalStorage.
*   `capNhatLopCSDL()`: Cập nhật thông tin chi tiết của một lớp học phần và lưu lại.
*   `xuLyDangXuat()`: Xóa phiên làm việc hiện tại và chuyển hướng về màn hình đăng nhập.
*   `khoiTaoGiaoDienChung()`: Cấu hình sidebar, hành động chuyển đổi qua lại giữa các Tab và đổi mật khẩu.

### C. Vai trò Sinh viên (`frontend/js/sinhvien.js`)
*   `khoiTaoGiaoDienSinhVien()`: Khởi chạy khi load trang sinh viên, tải thời khóa biểu, điểm số và thông báo.
*   `hienThiBaoCaoHocTapSinhVien()`: Tính GPA hệ 4, xếp loại học tập và vẽ biểu đồ chuyên cần (sử dụng Chart.js).
*   `hienThiTabDangKyTinChi()`: Hiển thị danh sách lớp tín chỉ được phép đăng ký/hủy khi cổng mở.
*   `huyDangKyLopHoc()`: Hủy đăng ký học phần và xóa bảng điểm của môn học đó.

### D. Vai trò Giảng viên (`frontend/js/giaovien.js`)
*   `khoiTaoGiaoDienGiangVien()`: Khởi chạy tải danh sách lớp giảng dạy và số liệu thống kê nhanh.
*   `hienThiBangDiemLop()`: Vẽ bảng danh sách sinh viên lớp để nhập các cột điểm thành phần.
*   `luuDiemHocPhan()`: Lưu bảng điểm đã nhập của sinh viên vào cơ sở dữ liệu.
*   `hienThiDiemDanhLop()`: Hiển thị bảng tích chuyên cần theo từng buổi học của lớp học phần.
*   `guiThongBaoMoi()`: Gửi thông báo từ giảng viên đến toàn thể sinh viên trong lớp học phần được chọn.

### E. Vai trò Quản trị viên (`frontend/js/admin.js`)
*   `khoiTaoGiaoDienAdmin()`: Khởi chạy tải danh sách tài khoản, môn học và thiết lập bảng điều phối lớp.
*   `hienThiDanhSachTaiKhoan()`: Hiển thị bảng tài khoản kèm các nút Sửa/Xóa.
*   `xuLyThemTaiKhoan()` / `xuLySuaTaiKhoan()`: Gửi dữ liệu qua API để ghi nhận tài khoản lên MongoDB Atlas.
*   `xoaTaiKhoan()`: Gửi yêu cầu xóa tài khoản thông qua API.
*   `moChiTietLopDieuPhoi()`: Mở giao diện quản lý danh sách sinh viên ghi danh và các ca học cụ thể của lớp.
*   `themSinhVienVaoLopDieuPhoi()` / `xoaSinhVienKhoiLopDieuPhoi()`: Thêm/gỡ sinh viên khỏi lớp học phần được chọn.

---

## 5. Tổ chức cấu trúc thư mục dự án
*   `/backend`: Chứa mã nguồn server Node.js/Express và Mongoose schema.
*   `/frontend`: Chứa mã nguồn giao diện HTML tĩnh và CSS.
*   `/frontend/js`: Chứa 4 file xử lý Javascript tương ứng với từng tác vụ phân quyền.
