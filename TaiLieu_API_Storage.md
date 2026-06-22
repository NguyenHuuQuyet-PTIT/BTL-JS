# BÁO CÁO CHI TIẾT HỆ THỐNG API & KIẾN TRÚC LƯU TRỮ (STORAGE ARCHITECTURE)
## DỰ ÁN: EDU REPORT LMS (QUẢN LÝ ĐÀO TẠO TRỰC TUYẾN)

Tài liệu này cung cấp cái nhìn toàn diện về kiến trúc truyền tải dữ liệu, cấu trúc lưu trữ và hướng dẫn kiểm tra/triển khai ứng dụng **Edu Report LMS** dành cho cả mục đích phát triển và thuyết trình báo cáo học tập.

---

## 1. TỔNG QUAN KIẾN TRÚC LƯU TRỮ 3 TẦNG (3-TIER STORAGE)

Hệ thống được thiết kế theo mô hình **Client - Server - Database** linh hoạt kết hợp với cơ chế đồng bộ hóa dữ liệu lai:

```mermaid
graph LR
    subgraph Client [Trình duyệt Client]
        UI[Giao diện HTML/CSS] <--> LS[(Local Storage Cache)]
    end
    subgraph Server [Backend Node/Express]
        API[Express Router & Controllers]
    end
    subgraph Database [Cơ sở dữ liệu đám mây]
        DB[(MongoDB Atlas Cloud)]
    end
    UI <-->|Fetch API HTTP| API
    API <-->|Mongoose ODM| DB
```

- **Tầng 1: Trình duyệt Client (Giao diện & LocalStorage Cache):**
  Lưu trữ tạm thời trạng thái người dùng đăng nhập hiện tại và bản sao dữ liệu của hệ thống để hiển thị nhanh chóng, giảm tải lượng request mạng và hỗ trợ chạy offline khi mất kết nối mạng.
- **Tầng 2: Backend API Server (Node.js & Express):**
  Lớp trung gian thực hiện tiếp nhận yêu cầu từ client, xử lý logic nghiệp vụ đào tạo, xác thực người dùng, và bảo vệ cơ sở dữ liệu.
- **Tầng 3: Cloud Database (MongoDB Atlas):**
  Cơ sở dữ liệu quan trọng nhất lưu trữ vĩnh viễn toàn bộ các bản ghi của hệ thống như tài khoản, thông báo, bài tập, lớp học và điểm số.

---

## 2. DANH SÁCH CHI TIẾT CÁC API ENDPOINT (BACKEND ROUTERS)

Hệ thống sử dụng các API RESTful để đồng bộ và thao tác dữ liệu. Chi tiết các route được viết trong [server.js](file:///c:/Users/quyet/Desktop/BTL%20%20JS/backend/server.js):

| Phương thức | Đường dẫn API | Mục tiêu tác động | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/dang-ky` | Bảng `users` | Đăng ký tài khoản mới cho sinh viên hoặc giảng viên. |
| **POST** | `/api/auth/dang-nhap` | Bảng `users` | Xác thực đăng nhập tài khoản người dùng. |
| **GET** | `/api/nguoi-dung` | Bảng `users` | Lấy danh sách tài khoản trong hệ thống. |
| **PUT** | `/api/nguoi-dung/:id` | Bảng `users` | Cập nhật hồ sơ cá nhân và danh sách thông báo đã đọc. |
| **DELETE** | `/api/nguoi-dung/:id` | Bảng `users` | Xóa tài khoản người dùng khỏi hệ thống (Quyền Admin). |
| **GET** | `/api/thong-bao` | Bảng `notifications` | Lấy danh sách toàn bộ thông báo hệ thống. |
| **POST** | `/api/thong-bao` | Bảng `notifications` | Tạo thông báo mới (Admin hoặc Giảng viên giao bài). |
| **PUT** | `/api/thong-bao/:id` | Bảng `notifications` | Sửa tiêu đề, nội dung hoặc tệp đính kèm thông báo. |
| **DELETE** | `/api/thong-bao/:id` | Bảng `notifications` | Xóa thông báo khỏi cơ sở dữ liệu. |
| **GET** | `/api/tai-lieu` | Bảng `materials` | Lấy toàn bộ tài liệu giảng dạy và đề bài tập. |
| **GET** | `/api/tai-lieu/:id` | Bảng `materials` | Lấy chi tiết nội dung tệp đính kèm của tài liệu theo ID. |
| **POST** | `/api/tai-lieu` | Bảng `materials` | Tải lên tài liệu/bài tập mới (chứa file dạng base64). |
| **PUT** | `/api/tai-lieu/:id` | Bảng `materials` | Chỉnh sửa tên tệp hoặc đường dẫn tài liệu. |
| **DELETE** | `/api/tai-lieu/:id` | Bảng `materials` | Xóa tài liệu khỏi hệ thống. |
| **GET** | `/api/nop-bai` | Bảng `submissions` | Lấy danh sách toàn bộ các bài làm của sinh viên. |
| **GET** | `/api/nop-bai/:id` | Bảng `submissions` | Lấy thông tin bài làm cụ thể theo ID bài nộp. |
| **POST** | `/api/nop-bai` | Bảng `submissions` | Sinh viên nộp bài làm trực tuyến (chứa link/file). |
| **GET** | `/api/lop-hoc` | Bảng `classes` | Lấy danh sách lớp học trực tuyến. |
| **POST** | `/api/lop-hoc` | Bảng `classes` | Tạo lớp học phần mới (Admin quản trị). |
| **PUT** | `/api/lop-hoc/:id` | Bảng `classes` | Cập nhật thông tin điểm danh, điểm số của sinh viên. |
| **DELETE** | `/api/lop-hoc/:id` | Bảng `classes` | Xóa lớp học phần khỏi hệ thống. |

---

## 3. THIẾT KẾ PHÂN TÁCH LƯU TRỮ DỮ LIỆU

### A. Dữ liệu lưu tại LocalStorage (Client Browser)
Mã nguồn frontend sử dụng LocalStorage để đệm dữ liệu nhằm tối đa hóa tốc độ phản hồi:
- `currentUser`: Lưu trữ đối tượng người dùng hiện tại đang đăng nhập (bao gồm ID, Họ tên, Vai trò, danh sách ID thông báo đã đọc `readNotifs`).
- `Users`: Mảng lưu trữ danh sách tài khoản người dùng phục vụ tra cứu.
- `Classes`: Mảng lưu trữ thông tin các lớp học phần gồm danh sách buổi học, trạng thái chuyên cần và bảng điểm của sinh viên.
- `Notifications`: Mảng chứa thông báo nội bộ.
- `Materials`: Bản sao danh sách tiêu đề tài liệu.
- `Submissions`: Bản sao danh sách bài nộp của học sinh.

### B. Dữ liệu lưu tại MongoDB Atlas (Cloud Database)
Cơ sở dữ liệu tập trung lưu trữ toàn bộ các bảng ghi nhị phân dài hạn:
- **Bảng `users` (Users Collection):** Lưu thông tin tài khoản đăng nhập (mã ID, email, mật khẩu băm, họ tên, vai trò `sinh-vien`/`giang-vien`/`admin`).
- **Bảng `classes` (Classes Collection):** Lưu chi tiết các lớp học phần, lịch học tuần, danh sách sinh viên ghi danh, trạng thái điểm danh và điểm số.
- **Bảng `notifications` (Notifications Collection):** Lưu toàn bộ các dòng thông báo kèm thời gian đăng và liên kết ID bài tập.
- **Bảng `materials` (Materials Collection):** Lưu trữ tài liệu. Đặc biệt trường `link` chứa chuỗi dữ liệu Base64 đầy đủ của các tệp tin đính kèm (PDF, Word, Ảnh) để tải trực tuyến.
- **Bảng `submissions` (Submissions Collection):** Lưu bài làm nộp trực tuyến của sinh viên (liên kết học viên, lớp học phần, file đính kèm dạng Base64 và liên kết bài nộp).

---

## 4. GIẢI THÍCH CHI TIẾT MÃ NGUỒN CỐT LÕI

### A. Viết API Endpoint và Lưu Cơ sở dữ liệu MongoDB (Backend - Express & Mongoose)
Đoạn mã sau nằm trong `server.js` xử lý yêu cầu sinh viên nộp bài tập và lưu trữ vào MongoDB:

```javascript
// POST API: Nhận bài nộp trực tuyến của sinh viên từ client
app.post('/api/nop-bai', async (req, res) => {
    try {
        // Khởi tạo đối tượng tài liệu mới từ Schema đã được khai báo
        const assignment = new NopBaiModel({
            id: req.body.id,                 // ID bài nộp (ví dụ sinh ra từ Date.now())
            materialId: req.body.materialId, // ID của bài tập được giao
            studentId: req.body.studentId,   // ID mã sinh viên nộp bài
            studentName: req.body.studentName,// Họ tên sinh viên nộp bài
            classId: req.body.classId,       // Lớp học phần
            submitTime: req.body.submitTime, // Thời điểm nộp bài
            link: req.body.link || '',       // Link URL (nếu nộp link)
            fileName: req.body.fileName || ''// Tên file (nếu nộp file từ máy)
        });
        
        // Gọi phương thức lưu trữ trực tiếp của Mongoose để đẩy dữ liệu lên MongoDB Atlas
        const saved = await assignment.save();
        
        // Trả về kết quả JSON trạng thái 201 cho client
        res.status(201).json(saved);
    } catch (err) {
        // Xử lý lỗi nếu kết nối MongoDB bị gián đoạn
        res.status(400).json({ message: err.message });
    }
});
```

* **Giải thích chi tiết:**
  - `new NopBaiModel(...)`: Khởi tạo một Document mới dựa trên Mongoose Model `NopBai`. Mongoose tự động kiểm duyệt kiểu dữ liệu của các trường xem có khớp với Schema thiết lập hay không.
  - `await assignment.save()`: Đây là câu lệnh bất đồng bộ (`async/await`) gửi dữ liệu qua giao thức TCP đến máy chủ đám mây MongoDB Atlas. Hàm sẽ dừng thực thi tạm thời và chỉ chạy tiếp khi MongoDB phản hồi đã ghi nhận dữ liệu thành công.

---

### B. Gọi API từ Frontend bằng Fetch API (Client-side)
Đoạn mã xử lý đồng bộ hóa tự động từ máy khách lên server nằm trong `app.js`:

```javascript
// Hàm đồng bộ dữ liệu tự động giữa máy khách (LocalStorage) và MongoDB Server
async function dongBoDuLieuTuDong() {
    try {
        // Thực hiện cuộc gọi GET API bất đồng bộ đến server backend để lấy danh sách thông báo mới nhất
        const res = await fetch(`${API_BASE}/api/thong-bao`);
        if (res.ok) {
            // Chuyển đổi dữ liệu thô nhận được sang định dạng mảng JSON
            const serverNotifs = await res.json();
            // Cập nhật lại kho dữ liệu đệm LocalStorage
            localStorage.setItem('Notifications', JSON.stringify(serverNotifs));
        }
    } catch (error) {
        console.warn("Mất kết nối mạng. Ứng dụng tự động chạy ở chế độ offline.", error);
    }
}
```

* **Giải thích chi tiết:**
  - `fetch(`${API_BASE}/api/thong-bao`)`: Trình duyệt gửi một HTTP Request dạng GET đến server Node.js. Biến `API_BASE` tự động nhận giá trị qua origin giúp tránh lỗi xung đột cổng.
  - `await res.json()`: Giải mã luồng dữ liệu phản hồi (Response Stream) từ server và chuyển sang mảng đối tượng JavaScript gốc.
  - `localStorage.setItem(...)`: Ghi đè mảng thông báo vừa lấy được vào LocalStorage dưới dạng chuỗi văn bản JSON để phục vụ hiển thị offline.

---

### C. Đọc/Ghi dữ liệu LocalStorage kèm theo cơ chế bắt lỗi bộ nhớ
Đoạn mã hai hàm đa dụng của hệ thống nằm trong `app.js`:

```javascript
// Hàm đọc dữ liệu an toàn từ LocalStorage
function layCSDL(key) {
    try {
        const data = localStorage.getItem(key);
        // Nếu không có dữ liệu, trả về mảng rỗng làm mặc định để tránh lỗi crash chương trình
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Lỗi đọc dữ liệu LocalStorage khóa: " + key, e);
        return [];
    }
}

// Hàm ghi dữ liệu an toàn vào LocalStorage, xử lý lỗi đầy bộ nhớ (QuotaExceededError)
function ghiCSDL(key, duLieu) {
    try {
        // Chuyển đối tượng/mảng sang dạng chuỗi JSON và lưu vào bộ nhớ trình duyệt
        localStorage.setItem(key, JSON.stringify(duLieu));
    } catch (e) {
        // Kiểm tra mã lỗi xem có phải do bộ nhớ LocalStorage bị đầy (giới hạn 5MB)
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn("Cảnh báo: Bộ nhớ LocalStorage đã đầy! Đang tự động dọn dẹp các tệp đính kèm cũ...");
            // Thực hiện dọn dẹp các file đính kèm lớn trong Materials để nhường chỗ cho dữ liệu mới
            let taiLieu = layCSDL('Materials');
            taiLieu.forEach(m => {
                if (m.link && m.link.startsWith('data:')) {
                    m.link = ""; // Xóa dữ liệu Base64 của tệp đính kèm cũ để giải phóng dung lượng
                }
            });
            localStorage.setItem('Materials', JSON.stringify(taiLieu));
            // Thử lưu lại dữ liệu mong muốn sau khi đã giải phóng bộ nhớ
            localStorage.setItem(key, JSON.stringify(duLieu));
        } else {
            console.error("Lỗi ghi dữ liệu LocalStorage:", e);
        }
    }
}
```

* **Giải thích chi tiết:**
  - `localStorage.getItem` / `setItem`: Hàm tương tác trực tiếp với bộ lưu trữ ổ cứng của trình duyệt. Dữ liệu bắt buộc phải là dạng chuỗi (`string`), nên ta dùng `JSON.stringify` để nén mảng/đối tượng và `JSON.parse` để giải nén lại.
  - `QuotaExceededError`: Trình duyệt chỉ cấp tối đa 5MB cho mỗi tên miền. Nếu ứng dụng chứa quá nhiều tệp đính kèm base64 dung lượng lớn, khối `catch` sẽ kích hoạt tự động cắt giảm dữ liệu tệp đính kèm cũ để bảo vệ ứng dụng khỏi bị đơ/tắt đột ngột.

---

## 5. HƯỚNG DẪN CHI TIẾT MỞ LOCAL STORAGE XEM CÁC DỮ LIỆU ĐANG LƯU TRỮ

Để xem chi tiết dữ liệu lưu trữ tạm thời bên trong trình duyệt (Chrome hoặc Microsoft Edge), bạn thực hiện theo các bước sau:

1. **Bước 1:** Mở trang ứng dụng (Ví dụ: `http://localhost:5000` hoặc mở file HTML).
2. **Bước 2:** Nhấn phím **F12** trên bàn phím (hoặc click chuột phải vào vùng trống bất kỳ trên trang web và chọn **Kiểm tra - Inspect**).
3. **Bước 3:** Trên thanh công cụ trên cùng của cửa sổ công cụ lập trình hiện ra, chọn tab **Application** (Nếu không thấy, nhấn vào ký hiệu mũi tên kép `>>` để hiện menu ẩn).
4. **Bước 4:** Ở thanh menu danh mục bên trái, tìm mục **Storage** -> nhấn mở rộng mục **Local Storage**.
5. **Bước 5:** Nhấn chọn vào dòng URL trang web hiện tại của bạn (Ví dụ: `http://localhost:5000`).
6. **Bước 6:** Bạn sẽ nhìn thấy bảng dữ liệu gồm hai cột: **Key** (Khóa) và **Value** (Giá trị tương ứng). Bạn có thể bấm vào từng Khóa (như `currentUser`, `Classes`, `Notifications`) để xem nội dung chi tiết bên dưới.

```
+---------------------------------------------------------------------------------+
| Developer Tools (F12)                                                           |
+---------------------------------------------------------------------------------+
| Elements  Console  Sources  Network  Performance  [Application]  >>             |
+---------------------------------------------------------------------------------+
| Application    | Key            | Value                                         |
| - Storage      | -------------- | --------------------------------------------- |
|   - Local Sto..| currentUser    | {"id":"SV202501","role":"sinh-vien",...}     |
|     > http://..| Notifications  | [{"id":"171890123","title":"Bài tập mới",..}]|
|   - Session S..| Classes        | [{"id":"WEB_CLASS_2026","subjectId":...}]     |
|   - IndexedDB  |                |                                               |
+---------------------------------------------------------------------------------+
```

---

## 6. HƯỚNG DẪN CẤU HÌNH BIẾN MÔI TRƯỜNG KHI DEPLOY LÊN RENDER/VERCEL

Khi bạn đưa dự án lên máy chủ trực tuyến, các thông tin bảo mật và cổng kết nối phải được lưu trực tiếp vào trình quản trị của Hosting để mã nguồn đọc qua `process.env`.

### A. Triển khai trên Render (Cho Backend Server Express)
Render là nền tảng phù hợp nhất để host server Node.js chạy liên tục:
1. Truy cập vào trang quản lý Render Dashboard, chọn Web Service của bạn.
2. Nhấn vào mục **Environment** ở menu cấu hình bên trái.
3. Nhấn nút **Add Environment Variable** để thêm 2 biến bắt buộc sau:

| Tên biến (Key) | Giá trị (Value) | Giải thích chức năng |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority` | Chuỗi kết nối MongoDB Atlas trực tuyến bảo mật. |
| `PORT` | `10000` *(Hoặc để trống, Render tự cấu hình)* | Cổng mạng của dịch vụ Web Service Render. |

4. Nhấn **Save Changes** để cập nhật. Render sẽ tự động build lại server và kết nối dữ liệu.

### B. Triển khai trên Vercel (Nếu đưa cả dự án lên Vercel)
Nếu bạn triển khai Express Server dưới dạng Serverless Functions trên Vercel:
1. Truy cập vào trang dự án trên Vercel Dashboard, chọn tab **Settings**.
2. Nhấp chọn mục **Environment Variables** từ menu bên trái.
3. Nhập thông tin biến môi trường vào các ô nhập:
   - **Key**: `MONGO_URI`
   - **Value**: `mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority`
4. Nhấn nút **Add** để lưu biến.
5. Thực hiện redeploy lại dự án để Vercel áp dụng biến môi trường vào máy chủ Serverless.
