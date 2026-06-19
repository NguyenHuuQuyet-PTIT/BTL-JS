# Tài liệu Kết nối & Kiến trúc Database - Edu Report LMS

File này mô tả chi tiết cấu hình kết nối MongoDB Atlas, cấu trúc các Schema và luồng đồng bộ dữ liệu giữa Frontend - Backend - Database.

---

## 1. Cấu hình kết nối Server (`backend/server.js`)

### Import Mongoose Models
```javascript
const NguoiDungModel = require('./models/NguoiDung'); // Model tài khoản người dùng
const ThongBaoModel  = require('./models/ThongBao');  // Model thông báo hệ thống
const TaiLieuModel   = require('./models/TaiLieu');   // Model tài liệu/bài tập
const NopBaiModel    = require('./models/NopBai');    // Model bài nộp của sinh viên
```

### Chuỗi kết nối MongoDB Atlas
```javascript
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://user:pass@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority';
```

> Khi kết nối thành công, hàm `taoDuLieuMau()` sẽ tự động tạo tài khoản mẫu và thông báo mẫu nếu collections còn trống.

---

## 2. Cấu trúc Schema MongoDB

### A. Người dùng - `NguoiDung.js`
```javascript
{
    id:          String,   // Mã định danh: 'AD001', 'GV001', 'SV202501'
    role:        String,   // Vai trò: 'admin' | 'giang-vien' | 'sinh-vien'
    name:        String,   // Họ và tên đầy đủ
    email:       String,   // Email đăng nhập (unique)
    password:    String,   // Mật khẩu (plain text - demo only)
    dob:         String,   // Ngày sinh YYYY-MM-DD
    phone:       String,   // Số điện thoại
    readNotifs:  [String]  // Mảng ID thông báo đã đọc
}
```

### B. Thông báo - `ThongBao.js`
```javascript
{
    id:           String,  // Mã thông báo duy nhất (unique)
    senderName:   String,  // Tên người gửi (Admin / Giảng viên)
    target:       String,  // 'tat-ca-sinh-vien' | 'tat-ca-giang-vien' | Mã lớp học
    text:         String,  // Nội dung thông báo
    date:         String,  // Ngày gửi YYYY-MM-DD
    materialId:   String,  // [MỚI] Mã bài tập liên kết (nếu là thông báo giao bài)
    materialType: String   // [MỚI] 'assignment' | '' (phân biệt loại thông báo)
}
```
> **Ghi chú:** Trường `materialId` và `materialType` được thêm mới để hỗ trợ tính năng **click vào thông báo → xem chi tiết bài tập**. Khi GV upload bài tập, hệ thống tự tạo thông báo với `materialId = baiTap.id`.

### C. Tài liệu & Bài tập - `TaiLieu.js`
```javascript
{
    id:          String,   // Mã tài liệu duy nhất (unique)
    classId:     String,   // Mã lớp học phần tương ứng
    title:       String,   // Tiêu đề tài liệu/bài tập
    type:        String,   // 'lecture' | 'assignment' | 'other'
    link:        String,   // URL đường dẫn HOẶC chuỗi Base64 của file đính kèm
    date:        String,   // Ngày đăng tải YYYY-MM-DD
    description: String,   // [MỚI] Nội dung mô tả/đề bài chi tiết
    fileName:    String    // [MỚI] Tên file đính kèm (nếu GV upload file)
}
```
> **Ghi chú:** Trường `description` chứa đề bài đầy đủ. Trường `fileName` giúp phân biệt tài liệu có file đính kèm (Base64 trong `link`) với tài liệu chỉ có URL bên ngoài.

### D. Bài nộp của Sinh viên - `NopBai.js`
```javascript
{
    id:          String,   // Mã bài nộp duy nhất (unique)
    materialId:  String,   // Mã bài tập tương ứng (khóa ngoại → TaiLieu)
    studentId:   String,   // Mã số sinh viên
    studentName: String,   // Họ tên sinh viên
    link:        String,   // URL bài làm HOẶC chuỗi Base64 của file nộp
    date:        String,   // Ngày nộp bài YYYY-MM-DD
    fileName:    String    // [MỚI] Tên file nộp (nếu SV upload file)
}
```

---

## 3. Luồng đồng bộ dữ liệu chi tiết

### 🔐 Luồng Đăng nhập
```
[Browser] POST /api/auth/dang-nhap { email, password }
    → [Server] Tìm user trong MongoDB Atlas
    → [Server] Trả về { success: true, user: {...} }
    → [Browser] Lưu vào localStorage['currentUser']
    → [Browser] Redirect sang dashboard tương ứng
```

### 📣 Luồng Thông báo (kể cả thông báo bài tập)
```
[Admin/GV] POST /api/thong-bao { id, senderName, target, text, date, materialId?, materialType? }
    → [MongoDB] Lưu vào collection 'notifications'
    → [Browser] Thêm vào localStorage['Notifications']

[Khi load trang Dashboard]
GET /api/thong-bao
    → [MongoDB] Lấy toàn bộ thông báo
    → [Browser] Cập nhật localStorage['Notifications']
    → [Browser] Hiển thị badge số thông báo chưa đọc
```

### 📚 Luồng Giao bài tập (GV → SV)
```
[GV] Soạn bài tập + upload file → Submit form
    → [Browser] Đọc file bằng FileReader → Base64
    → POST /api/tai-lieu { ..., link: base64, fileName, description }
    → [MongoDB] Lưu vào collection 'materials'
    → [Browser] Thêm vào localStorage['Materials']
    → [Browser] Gọi tuDongTaoThongBaoBaiTap()
        → POST /api/thong-bao { ..., materialId, materialType: 'assignment' }
        → [MongoDB] Lưu thông báo liên kết bài tập
        → [Browser] Thêm vào localStorage['Notifications']
```

### 📤 Luồng Nộp bài (SV → GV)
```
[SV] Click thông báo bài tập → moModalChiTietBaiTap()
    → [Browser] Tìm bài tập trong localStorage['Materials']
    → Hiển thị modal: tiêu đề, mô tả, file đính kèm
    → SV xem file → xemFileTrucTiep() → Blob URL → Tab mới

[SV] Click "Nộp bài ngay" → moModalNopBai()
    → Upload file → FileReader → Base64
    → POST /api/nop-bai { materialId, studentId, link: base64, fileName }
    → [MongoDB] Lưu vào collection 'submissions'
    → [Browser] Cập nhật localStorage['Submissions']
```

### 👁️ Luồng Xem bài nộp (GV)
```
[GV] Click "Xem bài nộp" → xemDanhSachNopBai()
    → [Browser] Lọc localStorage['Submissions'] theo materialId
    → Hiển thị danh sách SV kèm nút:
        - "👁️ Xem trực tiếp" → xemFileTrucTiep() → Blob → Tab mới
        - "⬇️ Tải xuống" → taiFileDinhKem() → download
```

---

## 4. Hàm xemFileTrucTiep() - Kỹ thuật mở file Base64

```javascript
function xemFileTrucTiep(base64Data, fileName) {
    // 1. Xác định MIME type từ header Data URL hoặc phần mở rộng file
    let mimeType = base64Data.startsWith('data:')
        ? base64Data.split(';')[0].split(':')[1]
        : mimeMap[ext] || 'application/octet-stream';

    // 2. Chuyển Base64 → Uint8Array → Blob
    let blob = new Blob([byteArray], { type: mimeType });

    // 3. Tạo Object URL tạm thời và mở trong tab mới
    let blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');

    // 4. Giải phóng bộ nhớ sau 60 giây
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}
```

**Các loại file được hỗ trợ xem trực tiếp:**
| Loại file | MIME type | Trình duyệt hỗ trợ |
|-----------|-----------|-------------------|
| PDF | application/pdf | Chrome, Firefox, Edge |
| Ảnh (PNG, JPG, GIF, WebP) | image/* | Tất cả |
| Text | text/plain | Tất cả |
| Video (MP4) | video/mp4 | Tất cả |
| Audio (MP3) | audio/mpeg | Tất cả |
| Word/Excel/PPT | application/vnd... | Tải xuống |

---

## 5. API Endpoints tổng hợp

| Method | Endpoint | Body | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/dang-ky` | `{ role, name, email, password }` | Tạo tài khoản mới |
| POST | `/api/auth/dang-nhap` | `{ email, password }` | Đăng nhập |
| GET | `/api/nguoi-dung` | - | Lấy tất cả tài khoản |
| PUT | `/api/nguoi-dung/:id` | `{ ...fields }` | Cập nhật tài khoản |
| DELETE | `/api/nguoi-dung/:id` | - | Xóa tài khoản |
| GET | `/api/thong-bao` | - | Lấy tất cả thông báo |
| POST | `/api/thong-bao` | `{ id, senderName, target, text, date, materialId?, materialType? }` | Tạo thông báo |
| DELETE | `/api/thong-bao/:id` | - | Xóa thông báo |
| GET | `/api/tai-lieu` | - | Lấy tất cả tài liệu |
| POST | `/api/tai-lieu` | `{ id, classId, title, type, link, date, description?, fileName? }` | Tạo tài liệu/bài tập |
| DELETE | `/api/tai-lieu/:id` | - | Xóa tài liệu |
| GET | `/api/nop-bai` | - | Lấy tất cả bài nộp |
| POST | `/api/nop-bai` | `{ id, materialId, studentId, studentName, link, date, fileName? }` | Nộp/cập nhật bài làm |
