const mongoose = require('mongoose'); // Import thư viện Mongoose hỗ trợ quản lý cơ sở dữ liệu MongoDB

// Định nghĩa cấu trúc Schema cho các thông báo hệ thống
const ThongBaoSchema = new mongoose.Schema({
    id: {
        type: String,       // Kiểu dữ liệu là chuỗi định danh thông báo
        required: true,     // Bắt buộc phải nhập ID khi lưu thông báo
        unique: true        // Mỗi thông báo có duy nhất một mã ID không trùng lặp
    },
    senderName: {
        type: String,       // Kiểu dữ liệu chuỗi lưu tên người gửi (Hệ thống hoặc Họ tên giảng viên)
        required: true      // Trường này là bắt buộc
    },
    target: {
        type: String,       // Kiểu dữ liệu chuỗi chỉ định đối tượng nhận thông báo
        required: true      // Nhận giá trị: 'tat-ca-sinh-vien', 'tat-ca-giang-vien' hoặc Mã lớp học phần
    },
    text: {
        type: String,       // Kiểu dữ liệu chuỗi nội dung văn bản của thông báo
        required: true      // Trường này bắt buộc phải điền
    },
    date: {
        type: String,       // Kiểu dữ liệu chuỗi định dạng YYYY-MM-DD lưu ngày gửi thông báo
        required: true      // Trường ngày gửi là bắt buộc
    },
    materialId: {
        type: String,       // Mã tài liệu/bài tập liên kết (nếu thông báo này là thông báo giao bài tập)
        default: ''         // Mặc định rỗng - chỉ có giá trị khi GV đăng bài tập lên lớp
    },
    materialType: {
        type: String,       // Loại tài liệu liên kết: 'assignment' | 'lecture' | 'other'
        default: ''         // Mặc định rỗng
    }
}, {
    timestamps: true        // Tự động lưu vết thời gian ghi nhận bản ghi (createdAt, updatedAt)
});

// Xuất Schema dưới tên model là Notification phục vụ truy vấn
module.exports = mongoose.model('Notification', ThongBaoSchema);
