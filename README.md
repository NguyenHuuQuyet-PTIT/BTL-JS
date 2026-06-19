# Bài tập lớn: Hệ thống Quản lý Học tập Edu Report LMS

Dự án này là trang web quản lý học tập (LMS) dành cho khoa CNTT, phân chia rõ rệt 3 vai trò: Sinh viên, Giảng viên và Quản trị viên (Admin). 

---

## 🚀 Hướng dẫn chạy thử dự án

### 1. Chạy Backend (Server Node.js)
```bash
# Truy cập vào thư mục server
cd backend

# Cài đặt các thư viện cần thiết
npm install

# Khởi động server Express chạy local
npm run dev
```
*Mặc định backend sẽ chạy ở cổng `http://localhost:5000` và kết nối trực tiếp đến database MongoDB Atlas.*

### 2. Chạy Frontend (Giao diện)
*   **Cách chạy:** Bạn chỉ cần mở file [index.html](file:///c:/Users/quyet/Desktop/BTL%20%20JS/frontend/index.html) bằng trình duyệt web hoặc chạy thông qua extension Live Server của VS Code.
*   **Deploy online:** Hiện tại dự án đã được deploy giao diện lên Vercel tại địa chỉ: `https://edu--report.vercel.app/`.

---

## 🔑 Thông tin tài khoản thử nghiệm có sẵn

| Phân quyền | Username / Email đăng nhập | Mật khẩu | Chức năng cốt lõi |
|-----------|---------------------------|----------|-------------------|
| **Admin** | `admin` | `admin` | Tạo mới, chỉnh sửa và xóa tài khoản trên MongoDB Atlas; điều phối lớp học và lịch học; mở/khóa cổng đăng ký tín chỉ. |
| **Giảng viên** | `giaovien` | `giaovien` | Xem danh sách lớp phụ trách; nhập điểm thành phần cho SV; điểm danh từng buổi học; soạn và gửi thông báo. |
| **Sinh viên** | `sinhvien` | `sinhvien` | Xem thời khóa biểu theo tuần; theo dõi kết quả học tập và chuyên cần; đăng ký hoặc hủy đăng ký lớp tín chỉ khi cổng mở. |

---

## 📁 Tổ chức cấu trúc thư mục dự án

*   `backend/`: Chứa mã nguồn server Node.js, file cấu hình và Mongoose Model (`models/User.js`).
*   `frontend/`: Chứa file giao diện HTML (`index.html`, `admin.html`, `student-dashboard.html`, `teacher-dashboard.html`).
*   `frontend/css/`: File định dạng style giao diện (`style.css`).
*   `frontend/js/`: Các tệp xử lý logic Javascript:
    *   `app.js`: Xử lý đăng nhập, quản lý thông tin cá nhân và định tuyến trang chung.
    *   `admin.js`: Logic CRUD tài khoản và quản lý điều phối lớp của Admin.
    *   `sinhvien.js`: Giao diện thời khóa biểu, đăng ký học phần và xem điểm của Sinh viên.
    *   `giaovien.js`: Giao diện quản lý lớp dạy, nhập điểm và điểm danh của Giảng viên.