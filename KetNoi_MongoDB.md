# Giải thích kết nối MongoDB Atlas

---

## I. Phân tích mã nguồn kết nối trong `backend/server.js`

### 1. Nạp thư viện Mongoose
```javascript
const mongoose = require('mongoose');
```
* **Giải thích:** Dòng này nạp thư viện `mongoose` vào dự án. Mongoose là một thư viện giúp NodeJS giao tiếp, gửi truy vấn và quản lý cấu trúc dữ liệu với cơ sở dữ liệu MongoDB một cách dễ dàng.

### 2. Định nghĩa chuỗi kết nối (URI)
```javascript
const LINK_MONGODB = process.env.MONGO_URI || 'mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority';
```
* **Giải thích:** Khai báo biến chứa địa chỉ máy chủ cơ sở dữ liệu MongoDB Atlas của bạn.
  - `process.env.MONGO_URI`: Hệ thống sẽ ưu tiên đọc link từ file cấu hình bảo mật `.env`.
  - Nếu file `.env` trống, hệ thống sẽ sử dụng chuỗi dự phòng trực tiếp chính là link MongoDB Atlas của bạn.
  - `quyetnguyen15112007_db_user`: Tên tài khoản truy cập DB.
  - `BTL-JS`: Mật khẩu đăng nhập DB.
  - `edu-report`: Tên database lưu trữ dữ liệu.

### 3. Thực hiện kết nối
```javascript
mongoose.connect(LINK_MONGODB)
```
* **Giải thích:** Gọi hàm kết nối của Mongoose với tham số là địa chỉ cơ sở dữ liệu đã định nghĩa ở trên để thiết lập đường truyền dữ liệu.

### 4. Xử lý phản hồi khi thành công
```javascript
    .then(async () => {
        console.log('>>> Kết nối thành công đến MongoDB Atlas!');
        await taoDuLieuNguoiDungMau();
    })
```
* **Giải thích:** 
  - `.then()` sẽ được kích hoạt nếu kết nối database thành công.
  - In ra dòng chữ thông báo trên console để lập trình viên biết server đã thông suốt.
  - Gọi hàm `taoDuLieuNguoiDungMau()` để tự động kiểm tra và đẩy dữ liệu các môn học, tài khoản mẫu ngành CNTT vào database nếu đây là lần đầu tiên chạy.

### 5. Xử lý lỗi khi thất bại
```javascript
    .catch(err => {
        console.error('Lỗi khi kết nối MongoDB:', err.message);
    });
```
* **Giải thích:**
  - `.catch()` sẽ hứng toàn bộ các lỗi phát sinh (sai mật khẩu, mất mạng, hết hạn cluster...) nếu không thể kết nối tới MongoDB.
  - In ra màn hình console chi tiết thông tin lỗi (`err.message`) giúp bạn dễ dàng sửa lỗi.

---

## II. Phân tích luồng đồng bộ từ Frontend (`frontend/js/app.js`)

Khi người dùng thực hiện Đăng ký hoặc Đăng nhập trên giao diện web:

1. **Gọi API:** Frontend sử dụng lệnh `fetch('http://localhost:5000/api/auth/dang-nhap')` (hoặc `/dang-ky` khi đăng ký tài khoản mới) để gửi thông tin tài khoản người dùng nhập lên Express server.
2. **Xử lý ở Backend:** Backend tiếp nhận thông tin, dùng model `NguoiDungModel.findOne(...)` để tra cứu trong cơ sở dữ liệu MongoDB Atlas.
3. **Phản hồi:** 
   - Nếu thông tin chính xác, MongoDB trả về thông tin tài khoản, Backend gửi phản hồi JSON thành công kèm thông tin người dùng về cho trình duyệt.
   - Trình duyệt lưu thông tin đó vào `localStorage.setItem('currentUser', ...)` để lưu phiên đăng nhập và tải đúng giao diện tương ứng của Sinh viên hoặc Giảng viên.
