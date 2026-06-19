# Tài liệu kết nối database MongoDB Atlas

File này lưu lại cách cấu hình và luồng đồng bộ dữ liệu giữa Server Node.js với database đám mây MongoDB Atlas phục vụ cho bài tập lớn.

---

## 1. Cấu hình kết nối trên Server (`backend/server.js`)

*   **Sử dụng Mongoose:** Import các schema bằng lệnh:
    ```javascript
    const NguoiDungModel = require('./models/NguoiDung');
    const ThongBaoModel = require('./models/ThongBao');
    const TaiLieuModel = require('./models/TaiLieu');
    const NopBaiModel = require('./models/NopBai');
    ```
*   **Địa chỉ kết nối (URI):**
    ```javascript
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority';
    ```
*   **Xử lý kết nối:** Kết nối thành công sẽ kích hoạt `taoDuLieuMau()` để chèn tài khoản mẫu và thông báo mẫu nếu dữ liệu trống.

---

## 2. Các Schema cơ sở dữ liệu trên MongoDB Atlas

### A. Người dùng (`backend/models/NguoiDung.js`)
Gồm các trường định danh tài khoản, mật khẩu, họ tên, email, ngày sinh, số điện thoại và mảng lưu trữ trạng thái các thông báo đã đọc.

### B. Thông báo (`backend/models/ThongBao.js`)
Lưu trữ thông báo do Admin phát hoặc Giảng viên gửi:
```javascript
const NotificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    senderName: { type: String, required: true },
    target: { type: String, required: true }, // 'tat-ca-sinh-vien', 'tat-ca-giang-vien' hoặc Mã lớp
    text: { type: String, required: true },
    date: { type: String, required: true }
});
```

### C. Tài liệu & Bài tập (`backend/models/TaiLieu.js`)
Lưu trữ tài liệu giảng dạy, slide bài giảng hoặc bài tập do giảng viên chia sẻ lên lớp học phần:
```javascript
const TaiLieuSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    classId: { type: String, required: true }, // Mã lớp học phần tương ứng
    title: { type: String, required: true }, // Tiêu đề tài liệu
    type: { type: String, required: true, enum: ['lecture', 'assignment', 'other'] }, // Bài giảng, Bài tập, Khác
    link: { type: String, required: true }, // Đường dẫn liên kết liên quan
    date: { type: String, required: true } // Ngày đăng tải YYYY-MM-DD
});
```

### D. Bài tập nộp trực tuyến (`backend/models/NopBai.js`)
Lưu trữ các bài làm sinh viên đã nộp:
```javascript
const NopBaiSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    materialId: { type: String, required: true }, // Mã bài tập tương ứng
    studentId: { type: String, required: true }, // Mã số sinh viên nộp bài
    studentName: { type: String, required: true }, // Họ tên sinh viên nộp bài
    link: { type: String, required: true }, // Đường dẫn bài làm trực tuyến
    date: { type: String, required: true } // Ngày nộp bài
});
```

---

## 3. Luồng đi của dữ liệu giữa Frontend, Backend và Database

*   **Luồng đăng nhập & Tài khoản:** Sử dụng các endpoint `/api/auth/dang-nhap`, `/api/auth/dang-ky`, `/api/nguoi-dung`. Dữ liệu ghi nhận trực tiếp trên MongoDB Atlas.
*   **Luồng thông báo hệ thống:**
    1.  Khi Admin gửi thông báo chung toàn trường hoặc Giảng viên gửi thông báo lớp -> Frontend gửi `POST /api/thong-bao`.
    2.  Dữ liệu lưu trữ tập trung trên MongoDB.
    3.  Khi bất kỳ người dùng nào F5 tải trang Dashboard, Frontend sẽ gửi ngầm `GET /api/thong-bao` để kéo toàn bộ thông báo mới nhất về cập nhật vào LocalStorage của trình duyệt. Điều này đảm bảo tính đồng bộ tức thì trên mọi thiết bị và phân quyền.
*   **Luồng tài liệu & bài tập học phần:**
    1.  Khi giảng viên tải lên bài giảng/bài tập mới ở chi tiết lớp học -> Frontend gửi request `POST /api/tai-lieu`.
    2.  Dữ liệu được lưu trữ tập trung trong collection `materials` trên MongoDB Atlas.
    3.  Khi sinh viên hoặc giảng viên tải trang, trình duyệt tự động gửi `GET /api/tai-lieu` để nạp danh sách tài liệu mới nhất về LocalStorage (`Materials`).
    4.  Khi mở xem chi tiết lớp học, hệ thống lọc và hiển thị chính xác các tài liệu tương ứng cho giảng viên và sinh viên lớp đó.
*   **Luồng nộp bài tập trực tuyến:**
    1.  Khi sinh viên nộp/cập nhật liên kết bài làm -> Frontend gửi request `POST /api/nop-bai`.
    2.  Dữ liệu lưu trữ tập trung trong collection `submissions` trên MongoDB Atlas.
    3.  Khi load trang Dashboard, trình duyệt tự động fetch `GET /api/nop-bai` để kéo toàn bộ bài nộp về LocalStorage (`Submissions`).
    4.  Giảng viên bấm xem bài nộp sẽ kéo dữ liệu từ cache Local này để hiển thị chi tiết.
