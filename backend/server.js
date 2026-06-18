const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const dns = require('dns');
const path = require('path');

// Cấu hình DNS dự phòng để tránh lỗi kết nối MongoDB Atlas trên một số nhà mạng
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.log('Cảnh báo: Không thể đổi DNS, sử dụng DNS mặc định.');
}

const NguoiDungModel = require('./models/User');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://quyetnguyen15112007_db_user:BTL-JS@cluster0.yz79rrw.mongodb.net/edu-report?retryWrites=true&w=majority';

// Tắt bufferCommands để frontend nhận lỗi ngay khi mất kết nối DB
mongoose.set('bufferCommands', false);

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Kết nối thành công đến MongoDB Atlas.');
        await taoDuLieuMau();
    })
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err.message);
    });

// Chỉ khởi tạo tài khoản mẫu nếu DB chưa có tài khoản nào
async function taoDuLieuMau() {
    try {
        const soTaiKhoan = await NguoiDungModel.countDocuments();
        if (soTaiKhoan === 0) {
            const taiKhoanMau = [
                { id: 'AD001', role: 'admin', name: 'Quản trị viên HT', email: 'admin', password: 'admin', dob: '1990-01-01', phone: '0999888777', readNotifs: [] },
                { id: 'GV001', role: 'giang-vien', name: 'ThS. Nguyễn Văn A', email: 'giaovien', password: 'giaovien', dob: '1985-05-10', phone: '0988111222', readNotifs: [] },
                { id: 'SV202501', role: 'sinh-vien', name: 'Nguyễn Hữu Quyết', email: 'sinhvien', password: 'sinhvien', dob: '2005-01-15', phone: '0901000001', readNotifs: [] }
            ];
            await NguoiDungModel.insertMany(taiKhoanMau);
            console.log('Đã khởi tạo 3 tài khoản mẫu vào MongoDB Atlas.');
        } else {
            console.log(`Database đã có ${soTaiKhoan} tài khoản, bỏ qua khởi tạo.`);
        }
    } catch (error) {
        console.error('Lỗi khởi tạo dữ liệu mẫu:', error);
    }
}

// API: Đăng ký tài khoản mới (Admin tạo)
app.post('/api/auth/dang-ky', async (req, res) => {
    try {
        const { id, name, email, password, role, dob, phone } = req.body;
        if (!id || !name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc!' });
        }

        const emailLower = email.toLowerCase().trim();
        if (await NguoiDungModel.findOne({ email: emailLower })) {
            return res.status(400).json({ success: false, message: 'Email/tên đăng nhập này đã được sử dụng!' });
        }
        if (await NguoiDungModel.findOne({ id: id.trim() })) {
            return res.status(400).json({ success: false, message: 'Mã định danh đã tồn tại!' });
        }

        const nguoiDungMoi = new NguoiDungModel({
            id: id.trim(), name: name.trim(), email: emailLower,
            password, role, dob: dob || '', phone: phone ? phone.trim() : '', readNotifs: []
        });
        await nguoiDungMoi.save();

        res.status(201).json({
            success: true, message: 'Tạo tài khoản thành công.',
            user: { id: nguoiDungMoi.id, name: nguoiDungMoi.name, email: nguoiDungMoi.email, role: nguoiDungMoi.role, dob: nguoiDungMoi.dob, phone: nguoiDungMoi.phone }
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// API: Đăng nhập (hỗ trợ cả Email lẫn Mã định danh)
app.post('/api/auth/dang-nhap', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng nhập!' });
        }

        const input = email.trim();
        const nguoiDung = await NguoiDungModel.findOne({
            $or: [{ email: input.toLowerCase() }, { id: input }],
            password, role
        });

        if (!nguoiDung) {
            return res.status(400).json({ success: false, message: 'Sai tài khoản, mật khẩu hoặc vai trò!' });
        }

        res.status(200).json({
            success: true, message: 'Đăng nhập thành công.',
            user: { id: nguoiDung.id, name: nguoiDung.name, email: nguoiDung.email, role: nguoiDung.role, dob: nguoiDung.dob, phone: nguoiDung.phone, readNotifs: nguoiDung.readNotifs }
        });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// API: Lấy danh sách người dùng
app.get('/api/nguoi-dung', async (req, res) => {
    try {
        const users = await NguoiDungModel.find({});
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Không thể lấy danh sách người dùng.' });
    }
});

// API: Cập nhật thông tin người dùng
app.put('/api/nguoi-dung/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, dob, phone } = req.body;

        const nguoiDung = await NguoiDungModel.findOne({ id });
        if (!nguoiDung) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        }

        if (name !== undefined) nguoiDung.name = name.trim();
        if (email !== undefined) nguoiDung.email = email.toLowerCase().trim();
        if (password !== undefined && password.trim() !== '') nguoiDung.password = password;
        if (role !== undefined) nguoiDung.role = role;
        if (dob !== undefined) nguoiDung.dob = dob;
        if (phone !== undefined) nguoiDung.phone = phone.trim();

        await nguoiDung.save();
        res.status(200).json({ success: true, message: 'Cập nhật thành công.', user: nguoiDung });
    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

// API: Xóa người dùng
app.delete('/api/nguoi-dung/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await NguoiDungModel.findOneAndDelete({ id });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        }
        res.status(200).json({ success: true, message: 'Xóa tài khoản thành công.' });
    } catch (error) {
        console.error('Lỗi khi xóa:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
