const mongoose = require('mongoose'); // Import Mongoose để thao tác kết nối với cơ sở dữ liệu MongoDB Atlas

// Định nghĩa cấu trúc Schema cho tài liệu, bài tập và slide môn học
const TaiLieuSchema = new mongoose.Schema({
    id: {
        type: String,       // Kiểu dữ liệu chuỗi định danh tài liệu
        required: true,     // Bắt buộc phải có mã ID tài liệu khi tạo mới
        unique: true        // Ràng buộc giá trị là duy nhất trên toàn hệ thống
    },
    classId: {
        type: String,       // Kiểu dữ liệu chuỗi liên kết tài liệu với lớp học học phần
        required: true      // Trường này là bắt buộc để lọc tài liệu theo từng lớp học
    },
    title: {
        type: String,       // Kiểu dữ liệu chuỗi tiêu đề hiển thị của tài liệu/bài tập
        required: true      // Trường này là bắt buộc
    },
    type: {
        type: String,       // Kiểu dữ liệu chuỗi xác định loại tài liệu
        required: true,     // Bắt buộc phải chọn phân loại
        enum: ['lecture', 'assignment', 'other'] // Giới hạn gồm: Bài giảng (lecture), Bài tập (assignment), Khác (other)
    },
    link: {
        type: String,       // Kiểu dữ liệu chuỗi đường dẫn liên kết tải tài liệu (ví dụ Google Drive)
        required: true      // Bắt buộc phải có liên kết đi kèm
    },
    date: {
        type: String,       // Kiểu dữ liệu chuỗi lưu ngày đăng tài liệu (YYYY-MM-DD)
        required: true      // Bắt buộc phải lưu trữ ngày đăng tải
    },
    description: {
        type: String,       // Kiểu dữ liệu chuỗi lưu mô tả, đề bài giảng/bài tập
        default: ''         // Mặc định là chuỗi rỗng
    },
    fileName: {
        type: String,       // Kiểu dữ liệu chuỗi lưu tên file đính kèm nếu tải trực tiếp từ máy
        default: ''         // Mặc định là chuỗi rỗng
    }
}, {
    timestamps: true        // Tự động ghi nhận thời gian tạo và sửa bản ghi (createdAt, updatedAt)
});

// Xuất Schema dưới dạng Model có tên là Material để sử dụng ở các API routes
module.exports = mongoose.model('Material', TaiLieuSchema);
