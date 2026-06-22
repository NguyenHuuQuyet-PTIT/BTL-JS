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

const crypto = require('crypto'); // Thư viện mật mã học của Node.js để tạo và xác minh Token chữ ký bảo mật
const JWT_SECRET = process.env.JWT_SECRET || 'BiMatHeThongSieuBaoMat2026'; // Khóa bảo mật của server

// Hàm tự phát hành token chữ ký điện tử HMAC-SHA256 (tương tự cơ chế của JWT)
function generateToken(userId, role) {
    const exp = Date.now() + 24 * 60 * 60 * 1000; // Token có giá trị trong 24 giờ
    const payload = `${userId}:${role}:${exp}`;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    return `${Buffer.from(payload).toString('base64')}.${signature}`;
}

// Hàm xác thực tính nguyên vẹn và hạn dùng của token
function verifyToken(token) {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 2) return null;
        const [payloadBase64, signature] = parts;
        const payload = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const [userId, role, exp] = payload.split(':');
        
        // Kiểm tra token đã hết hạn chưa
        if (Date.now() > parseInt(exp)) return null;
        
        // So khớp chữ ký số để bảo đảm dữ liệu không bị sửa đổi ở Client
        const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
        if (signature !== expectedSignature) return null;
        
        return { id: userId, role, exp: parseInt(exp) };
    } catch (e) {
        return null;
    }
}

// Middleware xác thực quyền hạn dựa trên Token chữ ký điện tử được gửi lên trong headers
const xacThucQuyenHan = (cacVaiTroChoPhep) => {
    return async (req, res, next) => {
        try {
            // Lấy token xác thực từ header 'Authorization: Bearer <token>'
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'Yêu cầu bị từ chối: Thiếu token xác thực hợp lệ!' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ success: false, message: 'Yêu cầu bị từ chối: Token không hợp lệ hoặc đã hết hạn!' });
            }

            // Tìm thông tin tài khoản người gọi trong database
            const user = await NguoiDungModel.findOne({ id: decoded.id });
            
            // Nếu không tìm thấy người dùng hoặc vai trò không được cấp phép
            if (!user || !cacVaiTroChoPhep.includes(user.role)) {
                return res.status(403).json({ success: false, message: 'Yêu cầu bị từ chối: Bạn không có quyền truy cập chức năng này!' });
            }

            // Gắn thông tin người dùng vào request để sử dụng tiếp ở các API handler phía sau
            req.user = user;
            
            // Chuyển sang middleware tiếp theo
            next();
        } catch (err) {
            res.status(500).json({ success: false, message: 'Lỗi kiểm duyệt phân quyền hệ thống.' });
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

async function taoDuLieuMau() {
    try {
        // 1. Tạo hoặc đặt lại mật khẩu các người dùng mẫu trong database
        let admin = await NguoiDungModel.findOne({ id: 'AD001' });
        const hashedAdminPassword = bcrypt.hashSync('admin', 10);
        if (!admin) {
            await NguoiDungModel.create({
                id: 'AD001',
                role: 'admin',
                name: 'Quản trị viên HT',
                email: 'admin',
                password: hashedAdminPassword,
                dob: '1990-01-01',
                phone: '0999888777',
                readNotifs: []
            });
            console.log('Đã khởi tạo tài khoản Admin mẫu vào MongoDB Atlas.');
        } else {
            admin.password = hashedAdminPassword;
            await admin.save();
        }

        let teacher = await NguoiDungModel.findOne({ id: 'GV001' });
        const hashedTeacherPassword = bcrypt.hashSync('giaovien', 10);
        if (!teacher) {
            await NguoiDungModel.create({
                id: 'GV001',
                role: 'giang-vien',
                name: 'ThS. Nguyễn Văn A',
                email: 'giaovien',
                password: hashedTeacherPassword,
                dob: '1985-05-10',
                phone: '0988111222',
                readNotifs: []
            });
            console.log('Đã khởi tạo tài khoản Giảng viên mẫu vào MongoDB Atlas.');
        } else {
            teacher.password = hashedTeacherPassword;
            await teacher.save();
        }

        let student = await NguoiDungModel.findOne({ id: 'SV202501' });
        const hashedStudentPassword = bcrypt.hashSync('sinhvien', 10);
        if (!student) {
            await NguoiDungModel.create({
                id: 'SV202501',
                role: 'sinh-vien',
                name: 'Nguyễn Hữu Quyết',
                email: 'sinhvien',
                password: hashedStudentPassword,
                dob: '2005-01-15',
                phone: '0901000001',
                readNotifs: []
            });
            console.log('Đã khởi tạo tài khoản Sinh viên mẫu vào MongoDB Atlas.');
        } else {
            student.password = hashedStudentPassword;
            await student.save();
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

// API đăng ký tài khoản mới trực tuyến (Yêu cầu quyền Admin)
app.post('/api/auth/dang-ky', xacThucQuyenHan(['admin']), async (req, res) => {
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

        // Tạo token xác thực bảo mật chữ ký số HMAC-SHA256
        const token = generateToken(nguoiDung.id, nguoiDung.role);

        res.status(200).json({ success: true, user: userObj, token });
    } catch (error) {
        // Báo lỗi 500 nếu xảy ra sự cố phía máy chủ
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// API lấy toàn bộ danh sách tài khoản người dùng có trên hệ thống (Yêu cầu vai trò: admin)
app.get('/api/nguoi-dung', xacThucQuyenHan(['admin']), async (req, res) => {
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

// API lấy danh sách thông tin công khai rút gọn (chỉ gồm id, name, role) phục vụ hiển thị (Yêu cầu vai trò: admin, giang-vien, sinh-vien)
app.get('/api/nguoi-dung/cong-khai', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        // Chỉ lấy các trường id, name, role để tránh rò rỉ dữ liệu nhạy cảm
        const users = await NguoiDungModel.find({}, 'id name role');
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể lấy danh sách người dùng công khai.' });
    }
});

// API lấy chi tiết tài khoản của cá nhân (Yêu cầu vai trò: admin, giang-vien, sinh-vien)
app.get('/api/nguoi-dung/:id', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        const { id } = req.params;
        // BẢO MẬT (BOLA): Chỉ cho phép Admin hoặc chính chủ tài khoản xem thông tin cá nhân chi tiết
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông tin tài khoản này!' });
        }
        const user = await NguoiDungModel.findOne({ id });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        }
        const userObj = user.toObject();
        delete userObj.password;
        res.status(200).json({ success: true, user: userObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết người dùng.' });
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
        if (password !== undefined && password.trim() !== '') nguoiDung.password = bcrypt.hashSync(password, 10); // Sửa mật khẩu đã băm nếu không rỗng
        if (role !== undefined) {
            // BẢO MẬT: Chỉ Admin mới có quyền thay đổi vai trò tài khoản (tránh leo thang đặc quyền)
            if (req.user.role !== 'admin' && role !== nguoiDung.role) {
                return res.status(403).json({ success: false, message: 'Từ chối: Bạn không có quyền tự thay đổi vai trò tài khoản của mình!' });
            }
            nguoiDung.role = role;
        }
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

        // BẢO MẬT: Kiểm soát danh tính người gửi (tránh giả mạo tên người gửi)
        if (req.user.role !== 'admin' && senderName !== req.user.name) {
            return res.status(403).json({ success: false, message: 'Từ chối: Tên người gửi không hợp lệ (không khớp với thông tin tài khoản đăng nhập)!' });
        }

        // BẢO MẬT: Phân quyền đối tượng nhận thông báo (target)
        if (req.user.role === 'sinh-vien') {
            // Học sinh chỉ được gửi target đến ID giảng viên cụ thể hoặc Admin
            const targetUser = await NguoiDungModel.findOne({ id: target });
            if (!targetUser || (targetUser.role !== 'giang-vien' && targetUser.role !== 'admin')) {
                return res.status(403).json({ success: false, message: 'Từ chối: Sinh viên chỉ được gửi thông báo đến Giảng viên hoặc Admin!' });
            }
        } else if (req.user.role === 'giang-vien') {
            // Giảng viên chỉ được gửi target cho tất cả giảng viên hoặc các lớp do mình dạy
            if (target !== 'tat-ca-giang-vien') {
                const targetClass = await LopHocModel.findOne({ id: target });
                if (!targetClass || targetClass.teacherId !== req.user.id) {
                    return res.status(403).json({ success: false, message: 'Từ chối: Giảng viên chỉ được gửi thông báo đến các lớp học phần mình phụ trách dạy hoặc đến tất cả giảng viên!' });
                }
            }
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

        const currentNotif = await ThongBaoModel.findOne({ id });
        if (!currentNotif) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo!' });
        }

        // BẢO MẬT: Giảng viên chỉ được sửa thông báo do chính mình viết
        if (req.user.role !== 'admin' && currentNotif.senderName !== req.user.name) {
            return res.status(403).json({ success: false, message: 'Từ chối: Bạn không có quyền chỉnh sửa thông báo của người khác!' });
        }

        const updateData = {};
        if (text !== undefined) updateData.text = text;
        if (fileName !== undefined) updateData.fileName = fileName;
        if (link !== undefined) updateData.link = link;

        // Tìm và cập nhật thông tin nội dung thông báo
        const result = await ThongBaoModel.findOneAndUpdate({ id }, updateData, { new: true });
        
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
        
        const currentNotif = await ThongBaoModel.findOne({ id });
        if (!currentNotif) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo!' });
        }

        // BẢO MẬT: Giảng viên chỉ được xóa thông báo do chính mình viết
        if (req.user.role !== 'admin' && currentNotif.senderName !== req.user.name) {
            return res.status(403).json({ success: false, message: 'Từ chối: Bạn không có quyền xóa thông báo của người khác!' });
        }

        // Tiến hành truy vấn tìm kiếm và xóa thông báo khỏi database
        await ThongBaoModel.findOneAndDelete({ id });
        
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

        // BẢO MẬT: Giảng viên chỉ được tải lên tài liệu thuộc lớp mình dạy
        if (req.user.role === 'giang-vien') {
            const cls = await LopHocModel.findOne({ id: classId });
            if (!cls || cls.teacherId !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Từ chối: Bạn không giảng dạy lớp học phần này nên không thể tải tài liệu lên!' });
            }
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
        
        const currentMaterial = await TaiLieuModel.findOne({ id });
        if (!currentMaterial) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu!' });
        }

        // BẢO MẬT: Giảng viên chỉ được xóa tài liệu thuộc lớp mình dạy
        if (req.user.role === 'giang-vien') {
            const cls = await LopHocModel.findOne({ id: currentMaterial.classId });
            if (!cls || cls.teacherId !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Từ chối: Bạn không có quyền xóa tài liệu của lớp học phần do giảng viên khác phụ trách!' });
            }
        }

        // Tìm tài liệu tương ứng và thực hiện xóa khỏi MongoDB database
        await TaiLieuModel.findOneAndDelete({ id });
        
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

        const currentMaterial = await TaiLieuModel.findOne({ id });
        if (!currentMaterial) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu!' });
        }

        // BẢO MẬT: Giảng viên chỉ được cập nhật tài liệu thuộc lớp mình dạy
        if (req.user.role === 'giang-vien') {
            const cls = await LopHocModel.findOne({ id: currentMaterial.classId });
            if (!cls || cls.teacherId !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Từ chối: Bạn không có quyền cập nhật tài liệu của lớp học phần do giảng viên khác phụ trách!' });
            }
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (type !== undefined) updateData.type = type;
        if (link !== undefined) updateData.link = link;
        if (description !== undefined) updateData.description = description;
        if (fileName !== undefined) updateData.fileName = fileName;

        const result = await TaiLieuModel.findOneAndUpdate({ id }, updateData, { new: true });
        
        res.status(200).json({ success: true, message: 'Cập nhật tài liệu thành công.', material: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật tài liệu.' });
    }
});

// ==========================================================================
// CÁC ROUTE API DÀNH CHO NỘP BÀI TẬP TRỰC TUYẾN (ASSIGNMENT SUBMISSIONS ENDPOINTS)
// ==========================================================================

// API lấy toàn bộ danh sách bài nộp của tất cả sinh viên (Xác thực quyền hạn: Cả Admin, Giảng viên và Sinh viên đều được phép tải danh sách theo giới hạn)
app.get('/api/nop-bai', xacThucQuyenHan(['admin', 'giang-vien', 'sinh-vien']), async (req, res) => {
    try {
        let submissions = [];
        if (req.user.role === 'admin') {
            // Admin được xem toàn bộ
            submissions = await NopBaiModel.find({}).sort({ createdAt: -1 });
        } else if (req.user.role === 'giang-vien') {
            // Giảng viên chỉ xem các bài nộp của các lớp mình dạy
            const myClasses = await LopHocModel.find({ teacherId: req.user.id });
            const myClassIds = myClasses.map(c => c.id);
            const myMaterials = await TaiLieuModel.find({ classId: { $in: myClassIds } });
            const myMaterialIds = myMaterials.map(m => m.id);
            submissions = await NopBaiModel.find({ materialId: { $in: myMaterialIds } }).sort({ createdAt: -1 });
        } else if (req.user.role === 'sinh-vien') {
            // Sinh viên chỉ được xem bài nộp của chính mình
            submissions = await NopBaiModel.find({ studentId: req.user.id }).sort({ createdAt: -1 });
        }
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

        // BẢO MẬT (BOLA): Kiểm soát quyền truy cập chi tiết bài nộp
        if (req.user.role === 'sinh-vien' && submission.studentId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Từ chối: Bạn không được phép xem bài nộp của sinh viên khác!' });
        }
        if (req.user.role === 'giang-vien') {
            const material = await TaiLieuModel.findOne({ id: submission.materialId });
            if (material) {
                const cls = await LopHocModel.findOne({ id: material.classId });
                if (cls && cls.teacherId !== req.user.id) {
                    return res.status(403).json({ success: false, message: 'Từ chối: Bạn không giảng dạy lớp học phần chứa bài nộp này!' });
                }
            }
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

        // BẢO MẬT: Kiểm soát quyền nộp bài, chỉ được phép nộp dưới danh nghĩa chính mình
        if (req.user.role === 'sinh-vien' && studentId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Từ chối: Bạn không được phép nộp bài tập thay cho sinh viên khác!' });
        }

        // BẢO MẬT: Kiểm tra xem sinh viên có thực sự đăng ký lớp học chứa bài tập này không
        const material = await TaiLieuModel.findOne({ id: materialId });
        if (!material) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài liệu/bài tập tương ứng!' });
        }
        const cls = await LopHocModel.findOne({ id: material.classId });
        if (!cls || (req.user.role === 'sinh-vien' && (!cls.enrolledStudents || !cls.enrolledStudents.includes(studentId)))) {
            return res.status(403).json({ success: false, message: 'Từ chối: Bạn chưa đăng ký học lớp học phần chứa bài tập này!' });
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
        
        // BẢO MẬT (Broken Access Control): Kiểm tra sâu tại Backend dựa trên vai trò người gửi
        const currentClass = await LopHocModel.findOne({ id });
        if (!currentClass) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lớp học!' });
        }

        if (req.user.role === 'sinh-vien') {
            // Sinh viên CHỈ được ghi danh/hủy ghi danh cho chính mình, cấm đổi thông tin lớp học, môn học, lịch dạy và điểm số người khác
            if (classData.subjectId !== currentClass.subjectId ||
                classData.teacherId !== currentClass.teacherId ||
                classData.room !== currentClass.room ||
                classData.dayOfWeek !== currentClass.dayOfWeek ||
                JSON.stringify(classData.sessions) !== JSON.stringify(currentClass.sessions)) {
                return res.status(403).json({ success: false, message: 'Từ chối: Sinh viên không có quyền thay đổi thông tin cấu trúc lớp học!' });
            }

            const oldEnrolled = currentClass.enrolledStudents || [];
            const newEnrolled = classData.enrolledStudents || [];
            const added = newEnrolled.filter(s => !oldEnrolled.includes(s));
            const removed = oldEnrolled.filter(s => !newEnrolled.includes(s));

            if (added.length > 1 || removed.length > 1 || (added.length === 1 && added[0] !== req.user.id) || (removed.length === 1 && removed[0] !== req.user.id)) {
                return res.status(403).json({ success: false, message: 'Từ chối: Bạn chỉ có thể đăng ký hoặc hủy đăng ký học cho chính tài khoản của mình!' });
            }

            // Đồng bộ tự động khởi tạo bảng điểm trống cho sinh viên mới vào lớp hoặc xóa đi khi hủy đăng ký
            if (added.length === 1) {
                if (!classData.grades) classData.grades = currentClass.grades || {};
                classData.grades[req.user.id] = { cc: '', gk: '', ck: '' };
            }
            if (removed.length === 1) {
                if (classData.grades) {
                    delete classData.grades[req.user.id];
                }
            }
        } else if (req.user.role === 'giang-vien') {
            // Giảng viên chỉ được sửa lớp do mình phụ trách dạy, và cấm đổi môn học/giảng viên của lớp
            if (currentClass.teacherId !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Từ chối: Bạn không có quyền chỉnh sửa lớp học của giảng viên khác!' });
            }
            if (classData.subjectId !== currentClass.subjectId ||
                classData.teacherId !== currentClass.teacherId) {
                return res.status(403).json({ success: false, message: 'Từ chối: Giảng viên không được phép đổi môn học hoặc giảng viên của lớp học phần!' });
            }
        }
        // Admin giữ toàn quyền cập nhật

        const result = await LopHocModel.findOneAndUpdate({ id }, classData, { new: true });
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
