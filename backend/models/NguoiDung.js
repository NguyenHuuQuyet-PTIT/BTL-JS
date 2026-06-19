const mongoose = require('mongoose'); // Import thư viện Mongoose để làm việc với MongoDB

// Định nghĩa cấu trúc Schema người dùng hệ thống (Sinh viên, Giảng viên, Admin)
const NguoiDungSchema = new mongoose.Schema({
    id: {
        type: String,       // Kiểu dữ liệu là chuỗi (String)
        required: true,     // Bắt buộc phải có trường này khi tạo tài khoản
        unique: true,       // Ràng buộc giá trị là duy nhất, không trùng lặp (Mã SV, Mã GV, Mã AD)
        trim: true          // Tự động cắt bỏ khoảng trắng thừa ở hai đầu
    },
    name: {
        type: String,       // Kiểu dữ liệu là chuỗi
        required: true      // Bắt buộc phải có họ và tên
    },
    email: {
        type: String,       // Kiểu dữ liệu là chuỗi
        required: true,     // Bắt buộc phải có email
        unique: true,       // Ràng buộc email là duy nhất để tránh tạo tài khoản trùng
        trim: true,         // Tự động cắt khoảng trắng thừa hai đầu
        lowercase: true     // Tự động chuyển tất cả các ký tự thành chữ thường
    },
    password: {
        type: String,       // Kiểu dữ liệu là chuỗi
        required: true      // Bắt buộc phải có mật khẩu đăng nhập
    },
    role: {
        type: String,       // Kiểu dữ liệu là chuỗi
        required: true,     // Bắt buộc phải chọn một trong ba vai trò
        enum: ['sinh-vien', 'giang-vien', 'admin'] // Giới hạn giá trị nằm trong mảng định sẵn
    },
    dob: {
        type: String,       // Kiểu dữ liệu là chuỗi định dạng YYYY-MM-DD
        default: ''         // Giá trị mặc định là chuỗi rỗng nếu chưa cập nhật
    },
    phone: {
        type: String,       // Kiểu dữ liệu là chuỗi lưu số điện thoại
        default: ''         // Giá trị mặc định là chuỗi rỗng nếu chưa cập nhật
    },
    readNotifs: {
        type: [String],     // Mảng chứa các mã ID của thông báo người dùng đã bấm đọc
        default: []         // Giá trị mặc định ban đầu là mảng rỗng
    }
}, {
    timestamps: true        // Tự động thêm hai trường là createdAt và updatedAt lưu thời gian tạo/sửa
});

// Xuất Schema này ra dưới dạng Model có tên là User để import sử dụng ở nơi khác
module.exports = mongoose.model('User', NguoiDungSchema);
