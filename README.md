# 📚 Edu Report LMS - Hệ thống Quản lý Học tập

Dự án **Edu Report** là ứng dụng web LMS (Learning Management System) dành cho khoa CNTT, phân chia rõ ràng 3 vai trò: **Sinh viên**, **Giảng viên** và **Quản trị viên (Admin)**.

---

## 🚀 Hướng dẫn chạy dự án

### 1. Chạy Backend (Server Node.js + MongoDB)
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt thư viện phụ thuộc
npm install

# Khởi động server Express (chạy local)
npm run dev
```
> Server chạy tại `http://localhost:5000` và kết nối MongoDB Atlas tự động.

### 2. Chạy Frontend (Giao diện)
- **Cách 1:** Mở file `frontend/index.html` trực tiếp trong trình duyệt
- **Cách 2:** Dùng extension **Live Server** của VS Code để chạy Hot Reload
- **Deploy online:** Frontend đã deploy lên Vercel tại `https://edu--report.vercel.app/`

---

## 🔑 Tài khoản thử nghiệm

| Vai trò | Email / Username | Mật khẩu | Chức năng chính |
|---------|-----------------|----------|----------------|
| **Admin** | `admin` | `admin` | Quản lý tài khoản, lớp học, cổng đăng ký, thông báo toàn trường |
| **Giảng viên** | `giaovien` | `giaovien` | Nhập điểm, điểm danh, giao bài tập (có file), xem bài SV nộp trực tiếp |
| **Sinh viên** | `sinhvien` | `sinhvien` | Xem lịch học, điểm số, nhận thông báo bài tập, xem file & nộp bài |

---

## ✨ Tính năng nổi bật

### 🎯 Luồng Giao bài - Nộp bài hoàn chỉnh
1. **GV giao bài tập** → upload file (PDF/ảnh/Word/...) + viết mô tả đề bài
2. **Hệ thống tự động tạo thông báo** gửi vào hộp thư lớp học của SV
3. **SV nhận thông báo** → click vào → hiện popup chi tiết bài tập đầy đủ
4. **SV xem file đính kèm** trực tiếp trong trình duyệt (không tải về máy)
5. **SV làm bài xong → nộp lại** bằng file upload hoặc đường dẫn URL
6. **GV xem danh sách bài nộp** → xem trực tiếp hoặc tải file bài làm của từng SV

### 📋 Thông báo thông minh
- Thông báo bài tập hiển thị **badge "📋 BÀI TẬP"** nổi bật trong hộp thư
- Click vào thông báo bài tập → **modal chi tiết** hiện đầy đủ (tiêu đề, mô tả, file, nút nộp bài)
- Thông báo thường vẫn hiện bình thường như cũ

### 🗂️ Xem file không cần tải về
- **PDF, ảnh, video, text** → mở trực tiếp trong tab trình duyệt mới
- Các loại file khác có nút **"Tải xuống"** dự phòng

---

## 📁 Cấu trúc thư mục dự án

```
BTL JS/
├── backend/
│   ├── models/
│   │   ├── NguoiDung.js    # Schema tài khoản người dùng (admin/GV/SV)
│   │   ├── ThongBao.js     # Schema thông báo (có trường materialId liên kết bài tập)
│   │   ├── TaiLieu.js      # Schema tài liệu/bài tập (có trường description, fileName)
│   │   └── NopBai.js       # Schema bài nộp của sinh viên (có trường fileName)
│   ├── server.js           # Express API server - tất cả route endpoints
│   ├── package.json
│   └── .env                # Chuỗi kết nối MongoDB Atlas (MONGO_URI)
├── frontend/
│   ├── css/
│   │   └── style.css       # Toàn bộ style CSS Glassmorphism (1500+ dòng)
│   ├── js/
│   │   ├── app.js          # Core engine: đăng nhập, đồng bộ dữ liệu, thông báo chung
│   │   ├── admin.js        # Logic dashboard Quản trị viên
│   │   ├── giaovien.js     # Logic dashboard Giảng viên
│   │   └── sinhvien.js     # Logic dashboard Sinh viên
│   ├── index.html          # Trang đăng nhập
│   ├── admin.html          # Dashboard Admin
│   ├── teacher-dashboard.html  # Dashboard Giảng viên
│   └── student-dashboard.html  # Dashboard Sinh viên
├── README.md
├── BaoCao.md
└── KetNoi_MongoDB.md
```

---

## 🗄️ Kiến trúc dữ liệu (Dual-Store)

| Loại dữ liệu | MongoDB Atlas | LocalStorage |
|-------------|--------------|-------------|
| Tài khoản (Users) | ✅ | ✅ Cache |
| Thông báo (Notifications) | ✅ | ✅ Cache |
| Tài liệu/Bài tập (Materials) | ✅ | ✅ Cache |
| Bài nộp (Submissions) | ✅ | ✅ Cache |
| Lớp học, Điểm số, Điểm danh | ❌ | ✅ Chính |

> **Ghi chú:** File nộp và file đính kèm bài tập được mã hóa Base64 và lưu trong trường `link`.