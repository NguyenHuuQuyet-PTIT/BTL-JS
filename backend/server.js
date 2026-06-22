const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const dns = require('dns');
const path = require('path');
const bcrypt = require('bcryptjs'); // Import thư viện BcryptJS để băm và kiểm tra mật khẩu bảo mật

// Cấu hình DNS dự phòng tránh lỗi kết nối MongoDB
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.log('Cảnh báo: Không thể đổi DNS, sử dụng DNS mặc định.');
}

const NguoiDungModel = require('./models/NguoiDung');
const ThongBaoModel = require('./models/ThongBao'); // Thêm model thông báo
const TaiLieuModel = require('./models/TaiLieu'); // Thêm model tài liệu & bài tập
const NopBaiModel = require('./models/NopBai'); // Thêm model nộp bài tập
const LopHocModel = require('./models/LopHoc'); // Thêm model lớp học

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware xác thực quyền hạn dựa trên ID người gọi gửi lên trong headers
const xacThucQuyenHan = (cacVaiTroChoPhep) => {
    return async (req, res, next) => {
        try {
            // Lấy mã ID người thực hiện yêu cầu từ Custom Headers 'x-requester-id'
            const requesterId = req.headers['x-requester-id'];
            
            // Nếu không có thông tin định danh người gọi, chặn truy cập ngay lập tức để bảo mật
            if (!requesterId) { // Kiểm tra biến requesterId xem có rỗng không
                return res.status(401).json({ success: false, message: 'Yêu cầu bị từ chối: Thiếu thông tin định danh x-requester-id trong headers!' }); // Trả về mã lỗi 401 Unauthorized
            }

            // Tìm thông tin tài khoản người gọi trong database thông qua Mongoose
            const user = await NguoiDungModel.findOne({ id: requesterId }); // Truy vấn tìm người dùng có mã ID tương ứng
            
            // Nếu không tìm thấy người dùng hoặc vai trò không hợp lệ trong danh sách được cấp phép
            if (!user || !cacVaiTroChoPhep.includes(user.role)) { // Kiểm tra sự tồn tại và vai trò quyền hạn
                return res.status(403).json({ success: false, message: 'Yêu cầu bị từ chối: Bạn không có quyền truy cập chức năng này!' }); // Trả về mã lỗi 403 Forbidden
            }

            // Gắn thông tin người dùng vào request để sử dụng tiếp ở các API handler phía sau
            req.user = user; // Lưu đối tượng user đã tìm thấy vào request
            
            // Chuyển sang middleware/handler tiếp theo trong chuỗi Express router
            next(); // Gọi hàm next() để Express tiếp tục điều phối
        } catch (err) { // Bắt các lỗi ngoại lệ phát sinh trong quá trình chạy
            // Xử lý lỗi ngoại lệ hệ thống và trả về mã lỗi 500
            res.status(500).json({ success: false, message: 'Lỗi kiểm duyệt phân quyền hệ thống.' }); // Phản hồi lỗi hệ thống
        }
    };
};

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

const MONGO_URI = process.env.MONGO_URI;

mongoose.set('bufferCommands', false);

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Kết nối thành công đến MongoDB Atlas.');
        await taoDuLieuMau();
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err.message);
    });

// Khởi tạo dữ liệu mẫu cho database
async function taoDuLieuMau() {
    try {
        // 1. Tạo người dùng mẫu nếu bảng trống
        const soTaiKhoan = await NguoiDungModel.countDocuments(); // Đếm tổng số tài khoản người dùng đang có trên database
        if (soTaiKhoan === 0) { // Nếu bảng người dùng hoàn toàn trống thì tiến hành gieo mầm dữ liệu
            const hashedAdminPassword = bcrypt.hashSync('admin', 10); // Thực hiện băm (hash) mật khẩu của Admin với độ mạnh salt = 10
            const hashedTeacherPassword = bcrypt.hashSync('giaovien', 10); // Thực hiện băm mật khẩu của Giảng viên mẫu
            const hashedStudentPassword = bcrypt.hashSync('sinhvien', 10); // Thực hiện băm mật khẩu của Sinh viên mẫu

            const taiKhoanMau = [
                { id: 'AD001', role: 'admin', name: 'Quản trị viên HT', email: 'admin', password: hashedAdminPassword, dob: '1990-01-01', phone: '0999888777', readNotifs: [] }, // Tài khoản quản trị hệ thống
                { id: 'GV001', role: 'giang-vien', name: 'ThS. Nguyễn Văn A', email: 'giaovien', password: hashedTeacherPassword, dob: '1985-05-10', phone: '0988111222', readNotifs: [] }, // Tài khoản giảng viên mẫu
                { id: 'SV202501', role: 'sinh-vien', name: 'Nguyễn Hữu Quyết', email: 'sinhvien', password: hashedStudentPassword, dob: '2005-01-15', phone: '0901000001', readNotifs: [] } // Tài khoản sinh viên mẫu
            ];
            await NguoiDungModel.insertMany(taiKhoanMau); // Lưu mảng tài khoản mẫu vào database MongoDB thông qua Mongoose
            console.log('Đã khởi tạo tài khoản mẫu vào MongoDB Atlas (mật khẩu đã được mã hóa Bcrypt).'); // In thông báo log thành công
        }

        // 2. Tạo thông báo mẫu nếu bảng trống
        const soThongBao = await ThongBaoModel.countDocuments();
        if (soThongBao === 0) {
            const thongBaoMau = [
                { 
                    id: 'NOTIF_1', 
                    senderName: 'Hệ thống Đào tạo', 
                    target: 'tat-ca-sinh-vien', 
                    text: 'Chào mừng các sinh viên ngành Công nghệ thông tin bước vào kỳ chuyên ngành mới!\nHãy đăng ký tín chỉ đầy đủ trước ngày 30/06.', 
                    date: new Date().toLocaleDateString('en-CA') 
                },
                { 
                    id: 'NOTIF_2', 
                    senderName: 'ThS. Nguyễn Văn A', 
                    target: 'tat-ca-sinh-vien', 
                    text: 'Lưu ý lớp Lập trình Web nâng cao chuẩn bị cài đặt Node.js phiên bản v18+ trước buổi Lab 1 tuần sau.', 
                    date: new Date().toLocaleDateString('en-CA') 
                }
            ];
            await ThongBaoModel.insertMany(thongBaoMau);
            console.log('Đã khởi tạo thông báo mẫu vào MongoDB Atlas.');
        }

        // 3. Tạo tài liệu mẫu nếu bảng trống
        const soTaiLieu = await TaiLieuModel.countDocuments();
        if (soTaiLieu === 0) {
            const taiLieuMau = [
                {
                    id: 'MAT_1',
                    classId: 'WEB_SAMPLE',
                    title: 'Giáo trình Lập trình Web nâng cao - Tập 1',
                    type: 'lecture',
                    link: 'https://drive.google.com/file/d/sample1/view',
                    date: new Date().toLocaleDateString('en-CA')
                },
                {
                    id: 'MAT_2',
                    classId: 'WEB_SAMPLE',
                    title: 'Bài tập lớn thực hành HTML5 & CSS3',
                    type: 'assignment',
                    link: 'https://drive.google.com/file/d/sample2/view',
                    date: new Date().toLocaleDateString('en-CA')
                }
            ];
            await TaiLieuModel.insertMany(taiLieuMau);
            console.log('Đã khởi tạo tài liệu mẫu vào MongoDB Atlas.');
        }

        // 4. Tạo lớp học mẫu nếu bảng trống
        const soLopHoc = await LopHocModel.countDocuments();
        if (soLopHoc === 0) {
            const lopHocMau = [
                { 
                    id: 'WEB_CLASS_2026', 
                    subjectId: 'SUB01', 
                    teacherId: 'GV001', 
                    room: 'Phòng A101 - Lab 1', 
                    dayOfWeek: 'Thứ 2', 
                    startDate: '2026-06-01', 
                    endDate: '2026-07-31', 
                    startPeriod: 1, 
                    endPeriod: 3, 
                    enrolledStudents: ['SV202501'], 
                    sessions: [ 
                        { id: 'S1', date: '2026-06-01', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} },
                        { id: 'S2', date: '2026-06-08', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'late'} }
                    ], 
                    grades: { 
                        'SV202501': { cc: 10, gk: 8.5, ck: 9 } 
                    } 
                },
                {
                    id: 'CTDL_CLASS_2026', 
                    subjectId: 'SUB02', 
                    teacherId: 'GV001', 
                    room: 'Phòng A102 - Lý thuyết', 
                    dayOfWeek: 'Thứ 4', 
                    startDate: '2026-06-03', 
                    endDate: '2026-07-29', 
                    startPeriod: 4, 
                    endPeriod: 6, 
                    enrolledStudents: ['SV202501'], 
                    sessions: [ 
                        { id: 'S3', date: '2026-06-03', startPeriod: 4, endPeriod: 6, attendance: {'SV202501': 'absent'} },
                        { id: 'S4', date: '2026-06-10', startPeriod: 4, endPeriod: 6, attendance: {'SV202501': 'present'} }
                    ], 
                    grades: { 
                        'SV202501': { cc: 10, gk: 9, ck: 8.5 } 
                    }
                },
                {
                    id: 'CSDL_CLASS_2026', 
                    subjectId: 'SUB03', 
                    teacherId: 'GV001', 
                    room: 'Phòng B201 - Lab 2', 
                    dayOfWeek: 'Thứ 3', 
                    startDate: '2026-06-02', 
                    endDate: '2026-07-28', 
                    startPeriod: 7, 
                    endPeriod: 9, 
                    enrolledStudents: ['SV202501'], 
                    sessions: [ 
                        { id: 'S5', date: '2026-06-02', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'present'} },
                        { id: 'S5b', date: '2026-06-09', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'late'} }
                    ], 
                    grades: { 
                        'SV202501': { cc: 9, gk: 7, ck: 6.5 } 
                    }
                },
                {
                    id: 'OOP_CLASS_2026', 
                    subjectId: 'SUB04', 
                    teacherId: 'GV001', 
                    room: 'Phòng A304 - Lý thuyết', 
                    dayOfWeek: 'Thứ 5', 
                    startDate: '2026-06-04', 
                    endDate: '2026-07-30', 
                    startPeriod: 1, 
                    endPeriod: 3, 
                    enrolledStudents: ['SV202501'], 
                    sessions: [ 
                        { id: 'S6', date: '2026-06-04', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} },
                        { id: 'S6b', date: '2026-06-11', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} }
                    ], 
                    grades: { 
                        'SV202501': { cc: 8, gk: 5.5, ck: 6 } 
                    }
                },
                {
                    id: 'AI_CLASS_2026', 
                    subjectId: 'SUB05', 
                    teacherId: 'GV001', 
                    room: 'Phòng A101 - Lab 1', 
                    dayOfWeek: 'Thứ 6', 
                    startDate: '2026-06-05', 
                    endDate: '2026-07-31', 
                    startPeriod: 7, 
                    endPeriod: 9, 
                    enrolledStudents: ['SV202501'], 
                    sessions: [ 
                        { id: 'S7', date: '2026-06-05', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'present'} },
                        { id: 'S7b', date: '2026-06-12', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'present'} }
                    ], 
                    grades: { 
                        'SV202501': { cc: 10, gk: 9.5, ck: 9 } 
                    }
                },
                {
                    id: 'UIUX_CLASS_2026', 
                    subjectId: 'SUB07', 
                    teacherId: 'GV001', 
                    room: 'Phòng C102 - Creative Room', 
                    dayOfWeek: 'Thứ 4', 
                    startDate: '2026-06-03', 
                    endDate: '2026-07-29', 
                    startPeriod: 1, 
                    endPeriod: 3, 
                    enrolledStudents: ['SV202501'], 
                    sessions: [ 
                        { id: 'S8', date: '2026-06-03', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'absent'} },
                        { id: 'S8b', date: '2026-06-10', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} }
                    ], 
                    grades: { 
                        'SV202501': { cc: 6, gk: 4.5, ck: 4 } 
                    }
                }
            ];
            await LopHocModel.insertMany(lopHocMau);
            console.log('Đã khởi tạo lớp học mẫu vào MongoDB Atlas.');
        }
    } catch (error) {
        console.error('Lỗi khởi tạo dữ liệu mẫu:', error);
    }
}

// ==========================================================================
// CÁC ROUTE API DÀNH CHO XÁC THỰC & NGƯỜI DÙNG (USER & AUTHENTICATION ENDPOINTS)
// ==========================================================================

// API đăng ký tài khoản mới trực tuyến
app.post('/api/auth/dang-ky', async (req, res) => {
    try {
        // Lấy các tham số gửi lên trong phần Body của Request
        const { id, name, email, password, role, dob, phone } = req.body;
        
        // Kiểm tra tính hợp lệ: bắt buộc phải có đầy đủ ID, Họ tên, Email, Mật khẩu và Vai trò
        if (!id || !name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
        }

        // Chuẩn hóa chuỗi email: viết thường toàn bộ và cắt bỏ các khoảng trắng thừa hai đầu
        const emailLower = email.toLowerCase().trim();
        
        // Kiểm tra xem Email đã được đăng ký trong database chưa
        if (await NguoiDungModel.findOne({ email: emailLower })) {
            return res.status(400).json({ success: false, message: 'Email này đã tồn tại!' });
        }
        
        // Kiểm tra xem Mã ID (MSSV/MSGV) đã tồn tại trong database chưa
        if (await NguoiDungModel.findOne({ id: id.trim() })) {
            return res.status(400).json({ success: false, message: 'Mã ID này đã tồn tại!' });
        }

        // Thực hiện băm (hash) mật khẩu đăng ký đầu vào bằng BcryptJS trước khi lưu trữ để bảo mật
        const matKhauMaHoa = bcrypt.hashSync(password, 10); // Băm mật khẩu người dùng gửi lên với salt rounds = 10
        
        // Tạo một tài khoản người dùng mới dựa trên mô hình NguoiDungModel với thông tin đã băm mật khẩu
        const nguoiDungMoi = new NguoiDungModel({
            id: id.trim(), // Gán mã định danh đã cắt khoảng trắng
            name: name.trim(), // Gán họ tên đầy đủ đã cắt khoảng trắng
            email: emailLower, // Gán email đã viết thường
            password: matKhauMaHoa, // Lưu mật khẩu đã được mã hóa bảo mật thay vì lưu plain text
            role, // Gán vai trò (admin/sinh-vien/giang-vien)
            dob: dob || '', // Gán ngày sinh (hoặc chuỗi rỗng)
            phone: phone ? phone.trim() : '', // Gán số điện thoại
            readNotifs: [] // Ban đầu danh sách thông báo đã đọc là rỗng
        });
        
        // Thực hiện lưu tài khoản này vào cơ sở dữ liệu MongoDB Atlas
        await nguoiDungMoi.save();

        // Trả về mã trạng thái 201 (Đã khởi tạo) kèm thông tin tài khoản thành công, loại bỏ mật khẩu để bảo mật
        const userObj = nguoiDungMoi.toObject();
        delete userObj.password;
        res.status(201).json({ success: true, message: 'Tạo tài khoản thành công.', user: userObj });
    } catch (error) {
        // Trả về mã trạng thái 500 nếu gặp lỗi hệ thống hoặc kết nối cơ sở dữ liệu
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// API đăng nhập tài khoản hỗ trợ bằng cả Email hoặc Mã định danh (ID)
app.post('/api/auth/dang-nhap', async (req, res) => {
    try {
        // Lấy thông tin đăng nhập từ Body của Request gửi lên
        const { email, password, role } = req.body;
        
        // Kiểm tra nếu thiếu một trong ba thông tin bắt buộc
        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng nhập!' });
        }

        const input = email.trim(); // Cắt bỏ khoảng trắng thừa của tài khoản đầu vào
        
        // Tìm tài khoản khớp với Email hoặc Mã số ID và khớp với Vai trò, đồng thời gọi thêm trường mật khẩu đã bị ẩn (select: false)
        const nguoiDung = await NguoiDungModel.findOne({
            $or: [{ email: input.toLowerCase() }, { id: input }], // So khớp tài khoản đầu vào là email hoặc mã ID
            role // Khớp cả vai trò
        }).select('+password'); // Buộc Mongoose phải nạp thêm trường password (vốn đã bị ẩn bởi select: false trong Schema)
        
        // Nếu không tìm thấy người dùng phù hợp thì báo sai tài khoản/vai trò
        if (!nguoiDung) { // Trường hợp tài khoản hoặc vai trò bị sai lệch
            return res.status(400).json({ success: false, message: 'Thông tin tài khoản hoặc vai trò sai!' }); // Phản hồi lỗi 400
        }

        // So khớp mật khẩu đầu vào với mật khẩu đã được mã hóa bằng hàm compareSync của BcryptJS
        const hopLeMatKhau = bcrypt.compareSync(password, nguoiDung.password); // So sánh mật khẩu rõ với chuỗi đã băm
        if (!hopLeMatKhau) { // Nếu so khớp thất bại (sai mật khẩu)
            return res.status(400).json({ success: false, message: 'Thông tin tài khoản hoặc vai trò sai!' }); // Trả về thông báo lỗi đồng nhất
        }

        // Trả về mã trạng thái 200 (OK) và đối tượng người dùng đã ẩn mật khẩu để bảo mật
        const userObj = nguoiDung.toObject();
        delete userObj.password;
        res.status(200).json({ success: true, user: userObj });
    } catch (error) {
        // Báo lỗi 500 nếu xảy ra sự cố phía máy chủ
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// API lấy toàn bộ danh sách tài khoản người dùng có trên hệ thống (Yêu cầu vai trò: admin, giang-vien, sinh-vien)
app.get('/api/nguoi-dung', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        // Lấy toàn bộ tài khoản người dùng từ MongoDB Atlas
        const users = await NguoiDungModel.find({});
        // Trả về danh sách tài khoản cho client
        res.status(200).json({ success: true, users });
    } catch (error) {
        // Phản hồi lỗi nếu quá trình truy vấn gặp sự cố
        res.status(500).json({ success: false, message: 'Không thể lấy danh sách người dùng.' });
    }
});

// API cập nhật thông tin chi tiết một tài khoản theo Mã ID định danh (Yêu cầu vai trò: admin, giang-vien, sinh-vien)
app.put('/api/nguoi-dung/:id', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        const { id } = req.params; // Lấy mã ID tài khoản từ tham số URL
        
        // BẢO MẬT (BOLA): Chỉ cho phép Admin hoặc chính tài khoản sở hữu tự chỉnh sửa thông tin của mình
        if (req.user.role !== 'admin' && req.user.id !== id) { // Nếu không phải admin và không tự sửa chính mình
            return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa thông tin tài khoản của người khác!' }); // Từ chối với lỗi 403
        }
        const { name, email, password, role, dob, phone, readNotifs } = req.body; // Các thông tin cần chỉnh sửa

        // Tìm người dùng hiện tại có mã ID khớp với tham số
        const nguoiDung = await NguoiDungModel.findOne({ id });
        if (!nguoiDung) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        }

        // Nếu thông tin cập nhật hợp lệ thì tiến hành gán đè dữ liệu mới
        if (name !== undefined) nguoiDung.name = name.trim();
        if (email !== undefined) nguoiDung.email = email.toLowerCase().trim();
        if (password !== undefined && password.trim() !== '') nguoiDung.password = password; // Sửa mật khẩu nếu không rỗng
        if (role !== undefined) nguoiDung.role = role;
        if (dob !== undefined) nguoiDung.dob = dob;
        if (phone !== undefined) nguoiDung.phone = phone.trim();
        if (readNotifs !== undefined) nguoiDung.readNotifs = readNotifs; // Cập nhật mảng thông báo đã đọc

        // Lưu thông tin chỉnh sửa mới vào database MongoDB
        await nguoiDung.save();
        // Trả về kết quả cập nhật thành công cho client, loại bỏ mật khẩu để bảo mật
        const userObj = nguoiDung.toObject();
        delete userObj.password;
        res.status(200).json({ success: true, message: 'Cập nhật thành công.', user: userObj });
    } catch (error) {
        // Phản hồi lỗi hệ thống
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// API xóa tài khoản người dùng ra khỏi hệ thống theo Mã ID định danh (Yêu cầu vai trò: admin)
app.delete('/api/nguoi-dung/:id', xacThucQuyenHan(['admin']), async (req, res) => {
    try {
        const { id } = req.params; // Lấy mã ID tài khoản từ tham số trên URL
        
        // Tìm và thực hiện xóa trực tiếp bản ghi tài khoản trên cơ sở dữ liệu
        const result = await NguoiDungModel.findOneAndDelete({ id });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        }
        
        // Báo kết quả xóa tài khoản thành công
        res.status(200).json({ success: true, message: 'Xóa tài khoản thành công.' });
    } catch (error) {
        // Báo lỗi 500 nếu gặp sự cố khi xóa dữ liệu
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// ==========================================================================
// CÁC ROUTE API DÀNH CHO QUẢN LÝ THÔNG BÁO (SYSTEM NOTIFICATIONS ENDPOINTS)
// ==========================================================================

// API lấy toàn bộ danh sách thông báo hệ thống và sắp xếp theo thứ tự mới nhất (Xác thực quyền hạn: Tất cả tài khoản đã đăng nhập hệ thống đều được đọc)
app.get('/api/thong-bao', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        // Truy vấn danh sách thông báo và sắp xếp theo ngày khởi tạo giảm dần
        const notifications = await ThongBaoModel.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        // Báo lỗi nếu truy vấn database thất bại
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách thông báo.' });
    }
});

// API tạo và lưu trữ một thông báo mới (Xác thực quyền hạn: Admin, Giảng viên tạo thông báo hệ thống, Sinh viên gửi thông báo nộp bài)
app.post('/api/thong-bao', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        // Nhận thông tin thông báo từ phần Body của Request
        const { id, senderName, target, text, date, materialId, materialType, submissionId, fileName, link } = req.body;
        
        // Yêu cầu bắt buộc đầy đủ thông tin trước khi thực hiện ghi vào database
        if (!id || !senderName || !target || !text || !date) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin thông báo!' });
        }

        // Khởi tạo đối tượng model thông báo mới (kèm các trường liên kết động nếu có)
        const thongBaoMoi = new ThongBaoModel({ 
            id, senderName, target, text, date, 
            materialId: materialId || '',     // Mã bài tập liên kết (nếu có)
            materialType: materialType || '', // Loại tài liệu liên kết (nếu có)
            submissionId: submissionId || '',  // Mã bài nộp liên kết (nếu có)
            fileName: fileName || '',
            link: link || ''
        });
        // Lưu thông báo mới vào database MongoDB
        await thongBaoMoi.save();

        // Báo lưu thông báo thành công và trả đối tượng vừa lưu về client
        res.status(201).json({ success: true, message: 'Lưu thông báo thành công.', notification: thongBaoMoi });
    } catch (error) {
        // Trả lỗi 500
        res.status(500).json({ success: false, message: 'Lỗi lưu thông báo.' });
    }
});

// API cập nhật thông báo trực tuyến theo ID (Xác thực quyền hạn: Chỉ Admin và Giảng viên được phép sửa đổi thông báo)
app.put('/api/thong-bao/:id', xacThucQuyenHan(['admin', 'giang-vien']), async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID thông báo từ URL
        const { text, fileName, link } = req.body; // Lấy nội dung mới từ body

        const updateData = {};
        if (text !== undefined) updateData.text = text;
        if (fileName !== undefined) updateData.fileName = fileName;
        if (link !== undefined) updateData.link = link;

        // Tìm và cập nhật thông tin nội dung thông báo
        const result = await ThongBaoModel.findOneAndUpdate({ id }, updateData, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo!' });
        }
        
        // Phản hồi cập nhật thành công cho client
        res.status(200).json({ success: true, message: 'Cập nhật thông báo thành công.', notification: result });
    } catch (error) {
        // Phản hồi lỗi hệ thống
        res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo.' });
    }
});

// API xóa thông báo khỏi hệ thống theo Mã ID thông báo tương ứng (Xác thực quyền hạn: Chỉ Admin và Giảng viên được phép xóa thông báo)
app.delete('/api/thong-bao/:id', xacThucQuyenHan(['admin', 'giang-vien']), async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID thông báo từ URL
        
        // Tiến hành truy vấn tìm kiếm và xóa thông báo khỏi database
        const result = await ThongBaoModel.findOneAndDelete({ id });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo!' });
        }
        
        // Trả kết quả thành công cho client
        res.status(200).json({ success: true, message: 'Xóa thông báo thành công.' });
    } catch (error) {
        // Phản hồi lỗi hệ thống
        res.status(500).json({ success: false, message: 'Lỗi xóa thông báo.' });
    }
});

// ==========================================================================
// CÁC ROUTE API DÀNH CHO QUẢN LÝ TÀI LIỆU & BÀI TẬP (MATERIALS ENDPOINTS)
// ==========================================================================

// API lấy danh sách toàn bộ bài giảng, bài tập và tài liệu môn học (Xác thực quyền hạn: Tất cả tài khoản đã đăng nhập đều được lấy tài liệu)
app.get('/api/tai-lieu', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        // Lấy tất cả tài liệu môn học và sắp xếp theo thời gian mới nhất lên đầu
        const materials = await TaiLieuModel.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, materials });
    } catch (error) {
        // Báo lỗi kết nối database
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách tài liệu.' });
    }
});

// API lấy thông tin chi tiết một tài liệu môn học theo Mã ID (Xác thực quyền hạn: Tất cả các vai trò hợp lệ đã đăng nhập)
app.get('/api/tai-lieu/:id', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        const { id } = req.params;
        const material = await TaiLieuModel.findOne({ id });
        if (!material) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu!' });
        }
        res.status(200).json({ success: true, material });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết tài liệu học phần.' });
    }
});

// API đăng tải một tài liệu môn học hoặc bài tập mới từ phía Giảng viên (Xác thực quyền hạn: Chỉ Admin hoặc Giảng viên có quyền tải lên tài liệu mới)
app.post('/api/tai-lieu', xacThucQuyenHan(['admin', 'giang-vien']), async (req, res) => {
    try {
        // Nhận dữ liệu tài liệu truyền từ Client
        const { id, classId, title, type, link, date, description, fileName } = req.body;
        
        // Kiểm tra các trường dữ liệu bắt buộc của một tài liệu lớp học
        if (!id || !classId || !title || !type || !link || !date) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin tài liệu bắt buộc!' });
        }

        // Tạo đối tượng tài liệu mới và tiến hành lưu vào cơ sở dữ liệu MongoDB
        const taiLieuMoi = new TaiLieuModel({ id, classId, title, type, link, date, description, fileName });
        await taiLieuMoi.save();

        // Báo lưu tài liệu thành công về cho giảng viên
        res.status(201).json({ success: true, message: 'Tải tài liệu lên thành công.', material: taiLieuMoi });
    } catch (error) {
        // Báo lỗi 500
        res.status(500).json({ success: false, message: 'Lỗi lưu tài liệu lên server.' });
    }
});

// API xóa tài liệu học tập khỏi lớp học theo Mã ID tài liệu được truyền (Xác thực quyền hạn: Chỉ Admin và Giảng viên được phép xóa tài liệu)
app.delete('/api/tai-lieu/:id', xacThucQuyenHan(['admin', 'giang-vien']), async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID tài liệu từ tham số truyền
        
        // Tìm tài liệu tương ứng và thực hiện xóa khỏi MongoDB database
        const result = await TaiLieuModel.findOneAndDelete({ id });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu!' });
        }
        
        // Trả kết quả xóa thành công
        res.status(200).json({ success: true, message: 'Xóa tài liệu thành công.' });
    } catch (error) {
        // Phản hồi lỗi hệ thống
        res.status(500).json({ success: false, message: 'Lỗi xóa tài liệu khỏi server.' });
    }
});

// API cập nhật tài liệu học tập / bài tập theo ID (Xác thực quyền hạn: Chỉ Admin và Giảng viên được phép cập nhật tài liệu)
app.put('/api/tai-lieu/:id', xacThucQuyenHan(['admin', 'giang-vien']), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, type, link, description, fileName } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (type !== undefined) updateData.type = type;
        if (link !== undefined) updateData.link = link;
        if (description !== undefined) updateData.description = description;
        if (fileName !== undefined) updateData.fileName = fileName;

        const result = await TaiLieuModel.findOneAndUpdate({ id }, updateData, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu!' });
        }
        
        res.status(200).json({ success: true, message: 'Cập nhật tài liệu thành công.', material: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật tài liệu.' });
    }
});

// ==========================================================================
// CÁC ROUTE API DÀNH CHO NỘP BÀI TẬP TRỰC TUYẾN (ASSIGNMENT SUBMISSIONS ENDPOINTS)
// ==========================================================================

// API lấy toàn bộ danh sách bài nộp của tất cả sinh viên (Xác thực quyền hạn: Cả Admin, Giảng viên và Sinh viên đều được phép tải danh sách)
app.get('/api/nop-bai', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        // Lấy danh sách toàn bộ bài làm sinh viên đã nộp lên hệ thống
        const submissions = await NopBaiModel.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, submissions });
    } catch (error) {
        // Phản hồi lỗi truy vấn
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách bài nộp.' });
    }
});

// API lấy chi tiết một bài nộp theo Mã ID (Xác thực quyền hạn: Tất cả các vai trò trong hệ thống đã đăng nhập)
app.get('/api/nop-bai/:id', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await NopBaiModel.findOne({ id });
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài nộp!' });
        }
        res.status(200).json({ success: true, submission });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết bài nộp.' });
    }
});

// API nộp bài tập mới hoặc cập nhật lại liên kết bài làm của Sinh viên (Xác thực quyền hạn: Cho phép Sinh viên thực hiện nộp bài tập)
app.post('/api/nop-bai', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        // Nhận dữ liệu nộp bài gửi lên từ form của sinh viên
        const { id, materialId, studentId, studentName, link, date, fileName } = req.body;
        
        // Xác thực thông tin: tất cả các trường dữ liệu đều là bắt buộc
        if (!id || !materialId || !studentId || !studentName || !link || !date) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin nộp bài tập!' });
        }

        // Tìm kiếm xem sinh viên này đã từng nộp bài cho bài tập này chưa
        let duplicate = await NopBaiModel.findOne({ materialId, studentId });
        
        if (duplicate) {
            // Nếu đã tồn tại, thực hiện cập nhật đè liên kết bài làm mới và ngày cập nhật mới
            duplicate.link = link;
            duplicate.date = date;
            if (fileName !== undefined) duplicate.fileName = fileName;
            await duplicate.save(); // Lưu thay đổi vào MongoDB Atlas
            return res.status(200).json({ success: true, message: 'Cập nhật bài nộp thành công.', submission: duplicate });
        }

        // Nếu chưa nộp lần nào, tạo một bản ghi nộp bài tập mới tinh
        const baiNopMoi = new NopBaiModel({ id, materialId, studentId, studentName, link, date, fileName });
        await baiNopMoi.save(); // Lưu vào MongoDB Atlas

        // Phản hồi kết quả nộp bài thành công về client
        res.status(201).json({ success: true, message: 'Nộp bài tập thành công.', submission: baiNopMoi });
    } catch (error) {
        // Phản hồi lỗi hệ thống
        res.status(500).json({ success: false, message: 'Lỗi lưu bài nộp lên máy chủ.' });
    }
});

// ==========================================================================
// CÁC ROUTE API DÀNH CHO QUẢN LÝ LỚP HỌC (CLASSES ENDPOINTS)
// ==========================================================================

// API lấy toàn bộ danh sách lớp học phần (Xác thực quyền hạn: Tất cả các vai trò hợp lệ đều có quyền xem danh sách lớp học)
app.get('/api/lop-hoc', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        const classes = await LopHocModel.find({});
        res.status(200).json({ success: true, classes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lớp học.' });
    }
});

// API tạo lớp học phần mới (Xác thực quyền hạn: Chỉ Admin mới có quyền tạo lớp học phần mới)
app.post('/api/lop-hoc', xacThucQuyenHan(['admin']), async (req, res) => {
    try {
        const classData = req.body;
        if (!classData.id || !classData.subjectId || !classData.teacherId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin lớp học!' });
        }
        const newClass = new LopHocModel(classData);
        await newClass.save();
        res.status(201).json({ success: true, message: 'Khởi tạo lớp học thành công.', class: newClass });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khởi tạo lớp học phần.' });
    }
});

// API cập nhật thông tin lớp học phần (Xác thực quyền hạn: Cho phép Admin, Giảng viên và Sinh viên thực hiện cập nhật theo vai trò được thiết lập)
app.put('/api/lop-hoc/:id', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        const { id } = req.params;
        const classData = req.body;
        
        const result = await LopHocModel.findOneAndUpdate({ id }, classData, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học!' });
        }
        res.status(200).json({ success: true, message: 'Cập nhật lớp học thành công.', class: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật lớp học phần.' });
    }
});

// API xóa lớp học phần theo ID (Xác thực quyền hạn: Chỉ Admin mới có quyền xóa lớp học phần khỏi hệ thống)
app.delete('/api/lop-hoc/:id', xacThucQuyenHan(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await LopHocModel.findOneAndDelete({ id });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học!' });
        }
        res.status(200).json({ success: true, message: 'Xóa lớp học thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa lớp học phần.' });
    }
});

// API mặc định phục vụ gửi trang giao diện HTML chính
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Khởi chạy lắng nghe server Express tại cổng kết nối chỉ định
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
