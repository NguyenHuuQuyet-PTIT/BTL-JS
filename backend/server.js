// Import các thư viện cần thiết cho Backend Express Server
const express = require('express'); // Thư viện Express để tạo API web server
const mongoose = require('mongoose'); // Thư viện Mongoose để thao tác với MongoDB
const cors = require('cors'); // Middleware CORS cho phép Frontend truy cập API từ domain khác
require('dotenv').config(); // Cấu hình đọc các biến môi trường từ file .env
const dns = require('dns'); // Thư viện DNS tích hợp của Node.js
const path = require('path'); // Thư viện để xử lý đường dẫn tệp tin

// Tự động cấu hình ứng dụng sử dụng DNS Google (8.8.8.8) và Cloudflare (1.1.1.1)
// Việc này giúp sửa lỗi kết nối MongoDB Atlas (querySrv ECONNREFUSED) trên mạng FPT/Viettel/VNPT hoặc mạng trường học
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (saiSo) {
    console.log('>>> Cảnh báo: Không thể đổi DNS nội bộ Node.js, sử dụng DNS mặc định của máy.');
}

// Import model User từ file models/User.js để truy vấn trong database
const NguoiDungModel = require('./models/User');

const app = express(); // Khởi tạo đối tượng ứng dụng express
const CONG_CHAY = process.env.PORT || 5000; // Lấy cổng từ file .env, mặc định là cổng 5000

// Kích hoạt các Middleware cần thiết
app.use(cors()); // Cho phép chia sẻ tài nguyên nguồn gốc chéo (CORS) giữa front-end và back-end
app.use(express.json()); // Cho phép Express đọc được dữ liệu JSON gửi từ body request
app.use(express.static(path.join(__dirname, '../frontend'))); // Phục vụ các tệp tin tĩnh (HTML, CSS, JS) từ thư mục frontend

// Lấy link kết nối MongoDB Atlas từ môi trường hoặc dùng link mặc định của bạn
const LINK_MONGODB = process.env.MONGO_URI || 'mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority';

// Kết nối đến cơ sở dữ liệu MongoDB Atlas
mongoose.connect(LINK_MONGODB)
    .then(async () => {
        console.log('>>> Kết nối thành công đến MongoDB Atlas!');
        // Gọi hàm tự động tạo dữ liệu người dùng CNTT mẫu nếu chưa có tài khoản nào
        await taoDuLieuNguoiDungMau();
    })
    .catch(err => {
        // Hiển thị lỗi chi tiết nếu kết nối database thất bại
        console.error('Lỗi khi kết nối MongoDB:', err.message);
    });

// Hàm tự động tạo sẵn các tài khoản CNTT demo vào MongoDB Atlas
async function taoDuLieuNguoiDungMau() {
    try {
        const taiKhoanMau = [
            { id: 'GV001', role: 'giang-vien', name: 'ThS. Nguyễn Văn A', email: 'gv1@gmail.com', password: '123', dob: '1985-05-10', phone: '0988111222', readNotifs: [] },
            { id: 'SV202501', role: 'sinh-vien', name: 'Nguyễn Hữu Quyết', email: 'sv1@gmail.com', password: '123', dob: '2005-01-15', phone: '0901000001', readNotifs: [] }
        ];

        // Dọn sạch bảng người dùng cũ để giữ đúng 2 tài khoản mẫu theo yêu cầu
        await NguoiDungModel.deleteMany({});
        await NguoiDungModel.insertMany(taiKhoanMau);
        console.log('>>> Đã dọn sạch database và khởi tạo đúng 2 tài khoản mẫu (1 GV, 1 SV) vào MongoDB Atlas.');
    } catch (error) {
        console.error('Lỗi khi khởi tạo dữ liệu mẫu:', error);
    }
}

// ==========================================================
// CÁC API ENDPOINTS XỬ LÝ ĐĂNG KÝ / ĐĂNG NHẬP
// ==========================================================

// 1. API Xử lý Đăng ký tài khoản mới
app.post('/api/auth/dang-ky', async (yeuCau, phanHoi) => {
    try {
        // Lấy thông tin gửi lên từ form qua body request
        const { id, name, email, password, role, dob, phone } = yeuCau.body;

        // Kiểm tra xem người dùng có nhập thiếu các trường thông tin bắt buộc không
        if (!id || !name || !email || !password || !role) {
            return phanHoi.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc để đăng ký!' });
        }

        // Kiểm tra xem email này đã tồn tại trong MongoDB hay chưa
        const kiemTraEmail = await NguoiDungModel.findOne({ email: email.toLowerCase() });
        if (kiemTraEmail) {
            return phanHoi.status(400).json({ success: false, message: 'Email này đã được sử dụng trên hệ thống!' });
        }

        // Kiểm tra xem mã số SV hoặc mã số GV đã tồn tại chưa
        const kiemTraId = await NguoiDungModel.findOne({ id: id.trim() });
        if (kiemTraId) {
            return phanHoi.status(400).json({ success: false, message: 'Mã định danh SV/GV này đã tồn tại!' });
        }

        // Tạo đối tượng người dùng mới theo Schema của User
        const nguoiDungMoi = new NguoiDungModel({
            id: id.trim(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: role,
            dob: dob,
            phone: phone,
            readNotifs: []
        });

        // Lưu lại thông tin đối tượng đó vào database MongoDB
        await nguoiDungMoi.save();

        // Trả về phản hồi thành công kèm theo dữ liệu tài khoản vừa tạo
        phanHoi.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản mới thành công!',
            user: {
                id: nguoiDungMoi.id,
                name: nguoiDungMoi.name,
                email: nguoiDungMoi.email,
                role: nguoiDungMoi.role,
                dob: nguoiDungMoi.dob,
                phone: nguoiDungMoi.phone
            }
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        phanHoi.status(500).json({ success: false, message: 'Lỗi hệ thống trong quá trình đăng ký!' });
    }
});

// 2. API Xử lý Đăng nhập
app.post('/api/auth/dang-nhap', async (yeuCau, phanHoi) => {
    try {
        // Lấy thông tin email, mật khẩu và vai trò từ request body gửi lên
        const { email, password, role } = yeuCau.body;

        // Kiểm tra thông tin gửi lên phải đầy đủ
        if (!email || !password || !role) {
            return phanHoi.status(400).json({ success: false, message: 'Thiếu thông tin đăng nhập!' });
        }

        // Truy vấn người dùng trên MongoDB hợp lệ với email, mật khẩu và vai trò tương ứng
        const nguoiDung = await NguoiDungModel.findOne({
            email: email.toLowerCase().trim(),
            password: password,
            role: role
        });

        // Nếu không tìm thấy tài khoản phù hợp thì báo lỗi về client
        if (!nguoiDung) {
            return phanHoi.status(400).json({ success: false, message: 'Sai email, mật khẩu hoặc vai trò truy cập!' });
        }

        // Trả về phản hồi đăng nhập thành công kèm thông tin người dùng đăng nhập
        phanHoi.status(200).json({
            success: true,
            message: 'Đăng nhập hệ thống thành công!',
            user: {
                id: nguoiDung.id,
                name: nguoiDung.name,
                email: nguoiDung.email,
                role: nguoiDung.role,
                dob: nguoiDung.dob,
                phone: nguoiDung.phone,
                readNotifs: nguoiDung.readNotifs
            }
        });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        phanHoi.status(500).json({ success: false, message: 'Lỗi hệ thống trong quá trình đăng nhập!' });
    }
});

// 3. API Lấy danh sách toàn bộ người dùng trong hệ thống
app.get('/api/nguoi-dung', async (yeuCau, phanHoi) => {
    try {
        // Lấy tất cả người dùng ra và ẩn mật khẩu đi để đảm bảo an toàn thông tin
        const nguoiDungs = await NguoiDungModel.find({}, '-password');
        phanHoi.status(200).json({ success: true, users: nguoiDungs });
    } catch (error) {
        phanHoi.status(500).json({ success: false, message: 'Không thể truy xuất danh sách người dùng!' });
    }
});

// Định tuyến trang chủ mặc định để tải giao diện frontend/index.html khi truy cập localhost:5000
app.get('/', (yeuCau, phanHoi) => {
    phanHoi.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Khởi chạy Server trên cổng đã chọn
app.listen(CONG_CHAY, () => {
    console.log(`>>> Server đang chạy tại địa chỉ: http://localhost:${CONG_CHAY}`);
});
