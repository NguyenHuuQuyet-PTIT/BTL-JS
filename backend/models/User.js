const mongoose = require('mongoose');

// Định nghĩa cấu trúc Schema lưu trữ thông tin Người dùng (Sinh viên và Giảng viên)
const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true, // Mã số định danh duy nhất (MSSV hoặc mã Giảng viên)
        trim: true
    },
    name: {
        type: String,
        required: true // Họ và tên đầy đủ
    },
    email: {
        type: String,
        required: true,
        unique: true, // Địa chỉ email duy nhất dùng để đăng nhập
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true // Mật khẩu đăng nhập
    },
    role: {
        type: String,
        required: true,
        enum: ['sinh-vien', 'giang-vien'] // Vai trò: chỉ nhận giá trị 'sinh-vien' (sinh viên) hoặc 'giang-vien' (giảng viên)
    },
    dob: {
        type: String,
        default: '' // Ngày sinh
    },
    phone: {
        type: String,
        default: '' // Số điện thoại liên lạc
    },
    readNotifs: {
        type: [String],
        default: [] // Mảng lưu trữ danh sách ID thông báo đã đọc
    }
}, {
    timestamps: true // Tự động thêm trường ngày tạo (createdAt) và ngày cập nhật (updatedAt)
});

// Xuất Schema thành Model 'User' để các file khác (ví dụ: server.js) sử dụng
module.exports = mongoose.model('User', UserSchema);

