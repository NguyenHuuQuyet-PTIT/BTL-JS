const mongoose = require('mongoose');

// Định nghĩa Schema lưu trữ thông tin các lớp học phần và điểm số trực tuyến
const LopHocSchema = new mongoose.Schema({
    id: {
        type: String,       // Mã định danh lớp học phần (Ví dụ: WEB_CLASS_2026)
        required: true,
        unique: true
    },
    subjectId: {
        type: String,       // Mã liên kết môn học (Ví dụ: SUB01)
        required: true
    },
    teacherId: {
        type: String,       // Mã giảng viên phụ trách lớp (Ví dụ: GV001)
        required: true
    },
    room: {
        type: String,       // Phòng học (Ví dụ: Phòng A101 - Lab 1)
        required: true
    },
    dayOfWeek: {
        type: String,       // Thứ học trong tuần (Ví dụ: Thứ 2)
        required: true
    },
    startDate: {
        type: String,       // Ngày bắt đầu (YYYY-MM-DD)
        required: true
    },
    endDate: {
        type: String,       // Ngày kết thúc (YYYY-MM-DD)
        required: true
    },
    startPeriod: {
        type: Number,       // Tiết học bắt đầu
        required: true
    },
    endPeriod: {
        type: Number,       // Tiết học kết thúc
        required: true
    },
    enrolledStudents: {
        type: [String],     // Danh sách các sinh viên ghi danh trong lớp học
        default: []
    },
    sessions: {
        type: mongoose.Schema.Types.Mixed, // Danh sách các buổi học và thông tin điểm danh
        default: []
    },
    grades: {
        type: mongoose.Schema.Types.Mixed, // Bảng điểm của sinh viên (cc, gk, ck)
        default: {}
    }
}, {
    timestamps: true        // Tự động theo dõi mốc thời gian ghi nhận (createdAt, updatedAt)
});

// Xuất Schema dưới tên model Class phục vụ các truy vấn Mongoose
module.exports = mongoose.model('Class', LopHocSchema);
