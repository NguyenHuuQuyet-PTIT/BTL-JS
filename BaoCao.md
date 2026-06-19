# Báo cáo Bài tập lớn môn Lập trình Web
## Đề tài: Hệ thống Quản lý Học tập & Điều phối Đào tạo LMS - Edu Report

---

## 1. Giới thiệu tổng quan

**Edu Report LMS** là ứng dụng web quản lý học tập được phát triển cho khoa CNTT, phân chia người dùng thành **3 nhóm vai trò** với giao diện riêng biệt:

1. **Quản trị viên (Admin):** Quản lý nhân sự, tài khoản, thiết lập lớp học phần, đóng/mở cổng đăng ký tín chỉ và gửi thông báo chung toàn trường.
2. **Giảng viên:** Theo dõi lớp dạy, chấm điểm thành phần, điểm danh theo buổi, **giao bài tập có file đính kèm**, xem bài SV nộp trực tiếp trong trình duyệt.
3. **Sinh viên:** Tra cứu lịch học, xem điểm số & chuyên cần, đăng ký tín chỉ, **nhận thông báo bài tập**, xem file GV giao và nộp bài trực tuyến.

---

## 2. Công nghệ sử dụng

| Tầng | Công nghệ | Mục đích |
|------|-----------|---------|
| **Frontend** | HTML5 + CSS3 + JavaScript ES6 | Giao diện Glassmorphism, Canva-style |
| **Biểu đồ** | Chart.js | Thống kê điểm số và chuyên cần |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | MongoDB Atlas + Mongoose | Lưu trữ tài khoản, thông báo, tài liệu |
| **Cache local** | LocalStorage (Browser) | Lưu lớp học, điểm số, điểm danh offline |
| **File** | Base64 encoding | Lưu file đính kèm bài tập và bài nộp |

---

## 3. Chức năng theo từng vai trò

### 🔧 Quản trị viên (Admin)
- **CRUD tài khoản:** Thêm/sửa/xóa tài khoản GV và SV, đồng bộ lên MongoDB Atlas
- **Điều phối lớp học:** Tạo lớp học phần, phân giảng viên, phòng học, tự động tính lịch kỳ học
- **Quản lý sinh viên:** Thêm/xóa SV khỏi lớp học phần
- **Cổng đăng ký:** Mở/đóng chức năng đăng ký tín chỉ trực tuyến
- **Thông báo toàn trường:** Soạn và gửi thông báo tới tất cả SV hoặc tất cả GV

### 👨‍🏫 Giảng viên
- **Quản lý lớp dạy:** Xem danh sách lớp học phần được phân công và lịch giảng tuần
- **Nhập điểm:** Cập nhật điểm chuyên cần (20%), giữa kỳ (30%), cuối kỳ (50%)
- **Điểm danh:** Tích điểm danh từng buổi học (Có mặt / Đi muộn / Vắng mặt)
- **Giao bài tập:** Upload file đính kèm (PDF, ảnh, Word...) + viết mô tả đề bài → hệ thống tự động tạo thông báo gửi lớp
- **Xem bài nộp:** Xem file bài làm SV trực tiếp trong trình duyệt hoặc tải xuống máy
- **Thông báo lớp:** Soạn/sửa/xóa thông báo cho sinh viên trong lớp phụ trách

### 🎓 Sinh viên
- **Lịch học:** Xem thời khóa biểu tuần cá nhân, lịch các lớp đã đăng ký
- **Kết quả học tập:** Bảng điểm chi tiết, GPA, biểu đồ chuyên cần & phân loại học lực
- **Đăng ký tín chỉ:** Đăng ký/hủy lớp học phần khi Admin mở cổng đăng ký
- **Thông báo bài tập:** Click vào thông báo → hiện popup chi tiết bài tập đầy đủ (tiêu đề, mô tả, file)
- **Xem file GV giao:** Mở file (PDF/ảnh/Word...) trực tiếp trong tab trình duyệt, không cần tải về
- **Nộp bài:** Upload file bài làm hoặc gửi đường dẫn URL (Google Drive, GitHub...)

---

## 4. Luồng hoạt động tính năng Giao bài - Nộp bài

```
[GV] Soạn bài tập + upload file → Ấn "Tải lên lớp học"
         ↓
[Hệ thống] Tự động tạo thông báo → Lưu MongoDB + LocalStorage
         ↓
[SV] Đăng nhập → Thấy badge 🔴 ở Thông báo
         ↓
[SV] Vào Thông báo → Thấy card bài tập có badge "📋 BÀI TẬP"
         ↓
[SV] Click vào → Modal chi tiết bài tập: tiêu đề, mô tả, file đính kèm
         ↓
[SV] Nhấn "👁️ Xem trực tiếp" → File mở trong tab trình duyệt mới
         ↓
[SV] Làm bài xong → Nhấn "📤 Nộp bài ngay" → Modal nộp bài
         ↓
[SV] Upload file hoặc nhập URL → Xác nhận nộp
         ↓
[GV] Tab "Xem bài nộp" → Danh sách SV nộp + nút xem/tải file từng bài
```

---

## 5. Mô tả các hàm cốt lõi

### A. Backend (`backend/server.js`)
| Endpoint | Phương thức | Chức năng |
|----------|------------|-----------|
| `/api/auth/dang-ky` | POST | Tạo tài khoản người dùng mới |
| `/api/auth/dang-nhap` | POST | Đăng nhập bằng email hoặc mã ID |
| `/api/nguoi-dung` | GET | Lấy toàn bộ danh sách tài khoản |
| `/api/nguoi-dung/:id` | PUT/DELETE | Sửa/xóa tài khoản |
| `/api/thong-bao` | GET/POST | Lấy và tạo thông báo (hỗ trợ `materialId`) |
| `/api/thong-bao/:id` | DELETE | Xóa thông báo |
| `/api/tai-lieu` | GET/POST | Lấy và tạo tài liệu/bài tập (có `description`, `fileName`) |
| `/api/tai-lieu/:id` | DELETE | Xóa tài liệu/bài tập |
| `/api/nop-bai` | GET/POST | Lấy và lưu bài nộp (có `fileName`) |

### B. Core Engine (`frontend/js/app.js`)
| Hàm | Chức năng |
|-----|-----------|
| `hienThiAlertTuyBien()` | Popup thông báo đẹp thay alert mặc định |
| `hienThiConfirmTuyBien()` | Popup xác nhận thao tác |
| `layCSDL()` / `ghiCSDL()` | Đọc/ghi LocalStorage |
| `moHopThoaiDocThongBao()` | Mở chi tiết thông báo - nếu là bài tập sẽ mở modal bài tập |
| `moModalChiTietBaiTap()` | Hiển thị popup đầy đủ thông tin bài tập + file |
| `xemFileTrucTiep()` | Mở file Base64 xem trực tiếp trong tab mới |
| `taiFileDinhKem()` | Tải file Base64 về máy |
| `hienThiTheThongBaoChung()` | Render danh sách thông báo, gắn badge bài tập |
| `capNhatHuyHieuThongBao()` | Cập nhật chấm đỏ số thông báo chưa đọc |
| `khoiTaoDuLieuMau()` | Khởi tạo dữ liệu mẫu LocalStorage nếu chưa có |

### C. Sinh viên (`frontend/js/sinhvien.js`)
| Hàm | Chức năng |
|-----|-----------|
| `khoiTaoGiaoDienSinhVien()` | Khởi động toàn bộ giao diện SV sau đăng nhập |
| `hienThiBaoCaoHocTapSinhVien()` | Tính GPA, vẽ biểu đồ chuyên cần & học lực |
| `hienThiTabDangKyTinChi()` | Hiển thị danh sách lớp để đăng ký/hủy |
| `moHopThoaiLopSinhVien()` | Mở popup chi tiết lớp: buổi học, điểm danh, tài liệu |
| `moModalNopBai()` | Mở form nộp bài tập trực tuyến |
| `hienThiThongBaoSinhVien()` | Tải và hiển thị hộp thư thông báo của SV |

### D. Giảng viên (`frontend/js/giaovien.js`)
| Hàm | Chức năng |
|-----|-----------|
| `hienThiBaoCaoGiangVien()` | Dashboard tổng quan lớp dạy và lịch giảng |
| `luuDiemHocSinhGiangVien()` | Lưu điểm thành phần vào LocalStorage |
| `luuDiemDanhGiangVien()` | Cập nhật điểm danh buổi học |
| `hienThiTaiLieuGiangVien()` | Hiển thị danh sách tài liệu đã tải lên |
| `xemDanhSachNopBai()` | Xem bài SV nộp + nút xem trực tiếp/tải xuống |
| `tuDongTaoThongBaoBaiTap()` | **[MỚI]** Tự động tạo thông báo lớp khi GV giao bài tập |

### E. Admin (`frontend/js/admin.js`)
| Hàm | Chức năng |
|-----|-----------|
| `hienThiDanhSachTaiKhoan()` | Lấy và hiển thị toàn bộ tài khoản từ API |
| `moChiTietLopDieuPhoi()` | Mở chi tiết điều phối lớp học phần |
| `themSinhVienVaoLopDieuPhoi()` | Thêm SV vào danh sách lớp học |
| `khoiTaoLangNgheThongBaoAdmin()` | Lắng nghe form soạn thông báo của Admin |
| `xoaThongBaoAdmin()` | Xóa thông báo khỏi hệ thống |

---

## 6. Cấu trúc thư mục dự án

```
BTL JS/
├── backend/
│   ├── models/
│   │   ├── NguoiDung.js    ← Schema tài khoản
│   │   ├── ThongBao.js     ← Schema thông báo (+ materialId)
│   │   ├── TaiLieu.js      ← Schema bài tập (+ description, fileName)
│   │   └── NopBai.js       ← Schema bài nộp SV (+ fileName)
│   ├── server.js           ← Express API + MongoDB kết nối
│   ├── package.json
│   └── .env
├── frontend/
│   ├── css/style.css       ← Toàn bộ CSS (1500+ dòng)
│   ├── js/
│   │   ├── app.js          ← Core engine, đồng bộ, thông báo thông minh
│   │   ├── admin.js        ← Dashboard Admin
│   │   ├── giaovien.js     ← Dashboard Giảng viên
│   │   └── sinhvien.js     ← Dashboard Sinh viên
│   ├── index.html
│   ├── admin.html
│   ├── teacher-dashboard.html
│   └── student-dashboard.html
├── README.md
├── BaoCao.md
└── KetNoi_MongoDB.md
```

---

## 7. Ghi chú kỹ thuật

- **File Base64:** Tất cả file đính kèm (bài tập GV, bài nộp SV) được mã hóa Base64 và lưu vào trường `link` của document MongoDB. Phù hợp cho demo nhưng không nên dùng cho file lớn trong môi trường production.
- **Dual-Store:** Hệ thống dùng MongoDB Atlas làm nguồn chính (source of truth) và LocalStorage làm cache offline. Mỗi lần tải trang, hệ thống tự đồng bộ dữ liệu mới nhất từ server về local.
- **MIME detection:** Hàm `xemFileTrucTiep()` tự phát hiện kiểu MIME từ Data URL hoặc phần mở rộng file để mở đúng cách trong trình duyệt.
