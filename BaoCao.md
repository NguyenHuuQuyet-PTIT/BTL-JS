# BÁO CÁO BÀI TẬP LỚN MÔN LẬP TRÌNH WEB

## 1. Giới thiệu chung
Dự án **Edu Report LMS** là hệ thống quản lý học tập và điều phối đào tạo dành cho ngành Công nghệ thông tin. Hệ thống phân quyền thành **3 vai trò**: **Quản trị viên (Admin)**, **Giảng viên**, và **Sinh viên**.

Hệ thống hỗ trợ quản lý tài khoản tập trung, điều phối lớp học phần, lịch học, điểm danh, bảng điểm và thông báo.

---

## 2. Công nghệ sử dụng
- **Frontend:**
  - **HTML5** — Cấu trúc trang web
  - **CSS3** — Giao diện hiện đại, hiệu ứng Glassmorphism, responsive
  - **JavaScript (ES6)** — Xử lý tương tác, điều hướng, tính toán
  - **Chart.js** — Biểu đồ thống kê học lực và chuyên cần
- **Backend:**
  - **Node.js & Express** — RESTful API xử lý đăng nhập, quản lý tài khoản
- **Database:**
  - **MongoDB Atlas** — Lưu trữ tài khoản người dùng qua Mongoose
  - **LocalStorage** — Lưu trữ lịch sử, lớp học, thông báo (hỗ trợ ngoại tuyến)

---

## 3. Phân quyền & Chức năng chính

### A. Phân quyền
1. **Quản trị viên (Admin):**
   - Quản trị tài khoản (tạo, sửa, xóa trực tiếp trên MongoDB Atlas)
   - Điều phối lớp học (tạo lớp, sửa/xóa lớp, thêm/gỡ sinh viên, quản lý buổi học)
   - Bật/tắt cổng đăng ký tín chỉ trực tuyến
2. **Giảng viên:**
   - Quản lý lớp được phân công, nhập điểm, điểm danh
   - Soạn, sửa, gửi và xóa thông báo lớp học
3. **Sinh viên:**
   - Xem kết quả học tập, thời khóa biểu, tiến trình lớp học
   - Tra cứu điểm số và bảng điểm danh
   - Đăng ký/hủy lớp học phần khi cổng tín chỉ mở
   - Nhận thông báo từ giảng viên và hệ thống

---

## 4. Chú thích chức năng các hàm trong hệ thống

### A. Backend (`backend/server.js`)
- `taoDuLieuMau()`: Khởi tạo 3 tài khoản mẫu (Admin, Giảng viên, Sinh viên) khi cơ sở dữ liệu trống.
- `POST /api/auth/dang-ky`: Đăng ký tài khoản mới cho người dùng, kiểm tra trùng ID/Email trước khi lưu.
- `POST /api/auth/dang-nhap`: Xác thực đăng nhập bằng cách so khớp mật khẩu và vai trò, hỗ trợ đăng nhập qua ID hoặc Email.
- `GET /api/nguoi-dung`: Trả về toàn bộ danh sách tài khoản người dùng từ database.
- `PUT /api/nguoi-dung/:id`: Cập nhật thông tin chi tiết của tài khoản (Họ tên, email, mật khẩu, vai trò, ngày sinh, SĐT).
- `DELETE /api/nguoi-dung/:id`: Xóa tài khoản vĩnh viễn khỏi database.

### B. Core ứng dụng (`frontend/js/app.js`)
- `hienThiAlertTuyBien(noiDung, tieuDe, kieu, callback)`: Tạo popup thông báo đẹp thay thế alert trình duyệt.
- `hienThiConfirmTuyBien(noiDung, hamDongY)`: Tạo popup xác nhận thao tác (Đồng ý / Hủy bỏ) thay thế confirm mặc định.
- `layCSDL(key)` / `ghiCSDL(key, data)`: Hàm phụ trợ đọc/ghi dữ liệu trực tiếp với LocalStorage.
- `capNhatLopCSDL(idLop, callback)`: Hàm cập nhật thông tin lớp học cụ thể và đồng bộ lại LocalStorage.
- `chuyenTrang(url)`: Chuyển hướng người dùng sang trang giao diện khác.
- `dangXuat()`: Xóa phiên đăng nhập hiện tại và quay về màn hình đăng nhập.
- `khoiTaoGiaoDienChung()`: Nạp thông tin cá nhân lên thanh tiêu đề và xử lý form đổi mật khẩu.

### C. Giao diện Sinh viên (`frontend/js/sinhvien.js`)
- `khoiTaoGiaoDienSinhVien(user)`: Hàm chính chạy khi load trang, điều phối tải dữ liệu thời khóa biểu, điểm số, thông báo.
- `hienThiThoiKhoaBieuSinhVien(user)`: Hiển thị thời khóa biểu tuần theo danh sách lớp sinh viên đã đăng ký học phần.
- `hienThiBaoCaoHocTapSinhVien(user)`: Tính điểm GPA hệ 4, vẽ biểu đồ tròn biểu thị xếp loại học tập và biểu đồ chuyên cần bằng Chart.js.
- `hienThiTabDangKyTinChi(user)`: Hiển thị giao diện đăng ký lớp học phần, kiểm tra trạng thái đóng/mở cổng đăng ký từ admin.
- `huyDangKyLopHoc(idLop)`: Hủy học phần, xóa tên sinh viên khỏi danh sách lớp và xóa các đầu điểm liên quan.
- `hienThiThongBaoSinhVien(user)`: Hiển thị toàn bộ thông báo từ các giảng viên dạy lớp học phần của sinh viên.

### D. Giao diện Giảng viên (`frontend/js/giaovien.js`)
- `khoiTaoGiaoDienGiangVien(user)`: Hàm chính chạy khi load trang giảng viên, hiển thị danh sách lớp giảng dạy và thống kê.
- `hienThiDanhSachLopGiangDay(user)`: Hiển thị danh sách các lớp học phần được phân công giảng dạy cho giảng viên.
- `hienThiBangDiemLop(idLop)`: Hiển thị danh sách sinh viên trong lớp để giảng viên nhập điểm chuyên cần, giữa kỳ, cuối kỳ.
- `luuDiemHocPhan(e)`: Xử lý sự kiện lưu bảng điểm của lớp học phần vào cơ sở dữ liệu.
- `hienThiDiemDanhLop(idLop)`: Hiển thị lịch sử các buổi học để tích điểm danh (Có mặt / Vắng mặt) cho từng sinh viên.
- `luuDiemDanhBuoiHoc(e)`: Xử lý lưu kết quả điểm danh của buổi học.
- `hienThiLichSuGuiGiangVien()`: Hiển thị danh sách các thông báo giảng viên đã soạn và gửi đi.
- `guiThongBaoMoi(e)`: Tạo thông báo mới và gửi đến sinh viên thuộc lớp học phần được chọn.

### E. Giao diện Admin (`frontend/js/admin.js`)
- `khoiTaoGiaoDienAdmin(user)`: Hàm khởi tạo chính, tải danh sách tài khoản, môn học, giáo viên và lớp học.
- `hienThiDanhSachTaiKhoan()`: Quản lý danh sách người dùng, tích hợp các nút Thêm, Sửa, Xóa tài khoản.
- `xuLyThemTaiKhoan(e)` / `xuLySuaTaiKhoan(e)`: Gửi dữ liệu qua API để tạo/cập nhật thông tin tài khoản trên MongoDB Atlas.
- `xoaTaiKhoan(idNguoiDung)`: Gửi yêu cầu DELETE qua API để xóa tài khoản và cập nhật lại danh sách.
- `khoiTaoTabDieuPhoiLop()`: Tải danh sách lớp học phần để thực hiện điều phối lịch học và nhân sự.
- `xoaLopDieuPhoi(idLop)`: Xóa một lớp học phần và toàn bộ dữ liệu điểm danh, điểm số đi kèm.
- `moChiTietLopDieuPhoi(idLop, tenHienThi)`: Mở giao diện quản lý sâu một lớp học phần (thêm/gỡ sinh viên, quản lý ca học).
- `themSinhVienVaoLopDieuPhoi()` / `xoaSinhVienKhoiLopDieuPhoi(idSinhVien)`: Thêm hoặc gỡ sinh viên khỏi lớp học phần được chọn.
- `xoaBuoiHocDieuPhoi(idBuoi)`: Xóa một buổi học cụ thể trong lịch trình lớp học phần.
- `hienThiNutBatTatCongDangKy()`: Điều khiển bật hoặc tắt cổng đăng ký tín chỉ trực tuyến dành cho sinh viên.

---

## 5. Cấu trúc thư mục
- `/backend` — Mã nguồn server và MongoDB
  - `/models/User.js` — Mongoose schema người dùng
  - `server.js` — API Server kết nối MongoDB Atlas
- `/frontend` — Giao diện ứng dụng
  - `/css/style.css` — Giao diện chung
  - `/js` — Mã nguồn JS: `app.js`, `sinhvien.js`, `giaovien.js`, `admin.js`
  - `index.html` — Trang đăng nhập
  - `student-dashboard.html` — Dashboard sinh viên
  - `teacher-dashboard.html` — Dashboard giảng viên
  - `admin.html` — Dashboard quản trị viên
