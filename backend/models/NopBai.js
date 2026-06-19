const mongoose = require('mongoose'); // Import thư viện Mongoose giúp tương tác với cơ sở dữ liệu MongoDB Atlas

// Định nghĩa cấu trúc Schema lưu trữ thông tin nộp bài tập của sinh viên
const NopBaiSchema = new mongoose.Schema({
    id: {
        type: String,       // Kiểu dữ liệu chuỗi định danh duy nhất cho bản ghi nộp bài
        required: true,     // Bắt buộc phải có mã ID khi khởi tạo
        unique: true        // Ràng buộc giá trị mã bài nộp không trùng lặp
    },
    materialId: {
        type: String,       // Kiểu dữ liệu chuỗi liên kết với mã tài liệu (bài tập) tương ứng
        required: true      // Trường này bắt buộc phải có để xác định bài nộp thuộc bài tập nào
    },
    studentId: {
        type: String,       // Kiểu dữ liệu chuỗi lưu mã số sinh viên nộp bài
        required: true      // Bắt buộc phải lưu MSSV nộp bài
    },
    studentName: {
        type: String,       // Kiểu dữ liệu chuỗi lưu họ tên đầy đủ của sinh viên
        required: true      // Bắt buộc phải điền để giảng viên dễ theo dõi danh sách
    },
    link: {
        type: String,       // Kiểu dữ liệu chuỗi lưu liên kết nộp bài làm (ví dụ Drive, Github...)
        required: true      // Bắt buộc phải điền liên kết nộp bài tập
    },
    date: {
        type: String,       // Kiểu dữ liệu chuỗi lưu ngày sinh viên gửi bài nộp (YYYY-MM-DD)
        required: true      // Bắt buộc phải ghi nhận ngày nộp bài tập
    },
    fileName: {
        type: String,       // Kiểu dữ liệu chuỗi lưu tên file đính kèm bài làm sinh viên tải lên
        default: ''         // Mặc định là chuỗi rỗng
    }
}, {
    timestamps: true        // Tự động lưu vết ngày giờ tạo và ngày giờ chỉnh sửa bài nộp (createdAt, updatedAt)
});

// Xuất Schema dưới tên model là Submission để phục vụ các route xử lý nghiệp vụ
module.exports = mongoose.model('Submission', NopBaiSchema);
