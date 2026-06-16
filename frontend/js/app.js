// ==========================================================================
// HỆ THỐNG QUẢN LÝ HỌC TẬP EDU REPORT (FRONTEND UNIFIED ENGINE)
// CÁC HÀM ĐÃ ĐƯỢC VIỆT HÓA ĐỂ DỄ HIỂU VÀ PHÙ HỢP TIÊU CHÍ BÁO CÁO
// ==========================================================================

// --------------------------------------------------------------------------
// 1. CƠ SỞ DỮ LIỆU LOCALSTORAGE & TRUY XUẤT (DATABASE & HELPERS)
// --------------------------------------------------------------------------
function layCSDL(khoa) {
    // Lấy dữ liệu từ localStorage, trả về mảng rỗng nếu không tồn tại
    return JSON.parse(localStorage.getItem(khoa)) || [];
}

function ghiCSDL(khoa, duLieu) {
    // Ghi mảng dữ liệu vào localStorage dưới dạng chuỗi JSON
    localStorage.setItem(khoa, JSON.stringify(duLieu));
}

function capNhatLopCSDL(maLop, hamCapNhat) {
    // Tìm và cập nhật thông tin lớp học cụ thể trong CSDL
    let danhSachLop = layCSDL('Classes');
    let lopCanTim = danhSachLop.find(l => l.id === maLop);
    if (lopCanTim) { 
        hamCapNhat(lopCanTim, danhSachLop); 
        ghiCSDL('Classes', danhSachLop); 
    }
}

// Danh sách giờ học tương ứng với các tiết học trong ngày
const GIO_TIET_HOC = { 
    1: "07:00-07:50", 2: "08:00-08:50", 3: "09:00-09:50", 4: "10:00-10:50", 
    5: "11:00-11:50", 6: "12:00-12:50", 7: "13:00-13:50", 8: "14:00-14:50", 
    9: "15:00-15:50", 10: "16:00-16:50", 11: "17:00-17:50", 12: "18:00-18:50" 
};

function layThongTinTietHoc(tietBatDau, tietKetThuc) {
    // Lấy chuỗi hiển thị thông tin ca học
    let gioBatDau = GIO_TIET_HOC[tietBatDau].split("-")[0];
    let gioKetThuc = GIO_TIET_HOC[tietKetThuc].split("-")[1];
    return `Tiết ${tietBatDau}-${tietKetThuc} (${gioBatDau} - ${gioKetThuc})`;
}

function layTenLopHienThi(maLop) {
    // Trả về tên hiển thị gọn gàng của lớp (Ví dụ: WEB_L1, CSDL_L2)
    let danhSachLop = layCSDL('Classes');
    let danhSachMon = layCSDL('Subjects');
    let lop = danhSachLop.find(l => l.id === maLop);
    if (!lop) return maLop;
    
    let mon = danhSachMon.find(s => s.id === lop.subjectId);
    let vietTat = mon ? mon.abbr : 'CLASS';
    let danhSachLopCungMon = danhSachLop.filter(l => l.subjectId === lop.subjectId);
    let viTri = danhSachLopCungMon.findIndex(l => l.id === maLop);
    
    return vietTat + '_L' + (viTri + 1);
}

function tinhDiemTrungBinh(diemChuyenCan, diemGiuaKy, diemCuoiKy) {
    // Tính điểm tổng kết hệ số 20% - 30% - 50%
    if (diemChuyenCan === null || diemChuyenCan === "" || 
        diemGiuaKy === null || diemGiuaKy === "" || 
        diemCuoiKy === null || diemCuoiKy === "") {
        return null;
    }
    return parseFloat((parseFloat(diemChuyenCan) * 0.2 + parseFloat(diemGiuaKy) * 0.3 + parseFloat(diemCuoiKy) * 0.5).toFixed(1));
}

function layHtmlXepLoai(diemSo) {
    // Xếp loại học lực theo thang điểm 10
    if (diemSo === null) return '<span class="text-muted">--</span>';
    if (diemSo >= 9.0) return '<span style="color: #9C27B0; font-weight: bold;">Xuất sắc</span>';
    if (diemSo >= 8.0) return '<span class="text-primary font-bold">Giỏi</span>';
    if (diemSo >= 6.5) return '<span class="text-success font-bold">Khá</span>';
    if (diemSo >= 5.0) return '<span class="text-warning font-bold">Trung bình</span>';
    return '<span class="text-danger font-bold">Yếu</span>';
}

function layHtmlDiemDanh(trangThai) {
    // Định dạng màu sắc nhãn điểm danh
    if (trangThai === 'present') return '<span class="text-success font-bold">Có mặt</span>';
    if (trangThai === 'late') return '<span class="text-warning font-bold">Đi muộn</span>';
    if (trangThai === 'absent') return '<span class="text-danger font-bold">Vắng mặt</span>';
    return '<span class="text-muted">Chưa điểm danh</span>';
}

function xuLyDangXuat() {
    // Đăng xuất khỏi hệ thống
    localStorage.removeItem('currentUser'); 
    window.location.href = 'index.html'; 
}

function moHopThoai(idModal) { 
    let el = document.getElementById(idModal);
    if (el) el.style.display = 'block'; 
}

// --------------------------------------------------------------------------
// 7. KHỞI CHẠY KHẨN CẤP KHI LOAD TRANG (BOOTSTRAP PROCESS)
// --------------------------------------------------------------------------
function dongHopThoai(idModal) { 
    let el = document.getElementById(idModal);
    if (el) el.style.display = 'none'; 
}

function khoiTaoGiaoDienChung() {
    // Đăng ký sự kiện tắt hộp thoại modal
    document.querySelectorAll('.close-modal').forEach(nut => {
        nut.addEventListener('click', function() { 
            this.closest('.modal').style.display = 'none'; 
        });
    });

    // Xử lý chuyển tab chính trên thanh menu sidebar
    document.querySelectorAll('.menu-item').forEach(nutMenu => {
        nutMenu.addEventListener('click', function(e) {
            e.preventDefault(); 
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-section').forEach(tab => tab.style.display = 'none');
            let mucTieu = document.getElementById(this.getAttribute('data-target'));
            if (mucTieu) mucTieu.style.display = 'block';
        });
    });

    // Xử lý chuyển sub-tab (phân mục nhỏ bên trong)
    document.querySelectorAll('.sub-btn').forEach(nutSub => {
        nutSub.addEventListener('click', function() {
            let menuCha = this.closest('.sub-menu');
            menuCha.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            let vungChua = menuCha.parentElement;
            vungChua.querySelectorAll('.sub-tab-content').forEach(tab => tab.style.display = 'none');
            
            let mucTieu = document.getElementById(this.getAttribute('data-target'));
            if (mucTieu) mucTieu.style.display = 'block';
        });
    });
}

function khoiTaoHoSoCaNhan(nguoiDung) {
    // Điền dữ liệu cá nhân vào giao diện thông tin cá nhân
    let vungChua = document.getElementById('profile-tab');
    if (!vungChua) return;

    let idEl = document.getElementById('profId');
    let dobEl = document.getElementById('profDob');
    let phoneEl = document.getElementById('profPhone');

    if (idEl) idEl.textContent = nguoiDung.id; 
    if (dobEl) dobEl.textContent = nguoiDung.dob ? nguoiDung.dob.split('-').reverse().join('/') : 'Chưa cập nhật';
    if (phoneEl) phoneEl.textContent = nguoiDung.phone || 'Chưa cập nhật';
    
    let hopThoaiSua = document.getElementById('editProfileFormContainer');
    let formSua = document.getElementById('editProfileForm');

    let btnShow = document.getElementById('btnShowEditProfile');
    if (btnShow) {
        btnShow.addEventListener('click', () => { 
            formSua.elements['phone'].value = nguoiDung.phone || ''; 
            formSua.elements['dob'].value = nguoiDung.dob || ''; 
            hopThoaiSua.style.display = 'block'; 
        });
    }
    
    let btnCancel = document.getElementById('btnCancelEditProfile');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => { 
            hopThoaiSua.style.display = 'none'; 
        });
    }

    if (formSua) {
        formSua.addEventListener('submit', function(e) {
            e.preventDefault(); 
            let matKhauMoi = formSua.elements['password'].value.trim();
            
            if (matKhauMoi !== '') {
                nguoiDung.password = matKhauMoi;
            }
            nguoiDung.phone = formSua.elements['phone'].value.trim();
            nguoiDung.dob = formSua.elements['dob'].value;
            
            localStorage.setItem('currentUser', JSON.stringify(nguoiDung)); 
            
            let danhSachNguoiDung = layCSDL('Users');
            let viTri = danhSachNguoiDung.findIndex(u => u.id === nguoiDung.id); 
            if (viTri > -1) {
                danhSachNguoiDung[viTri] = nguoiDung; 
                ghiCSDL('Users', danhSachNguoiDung);
            }
            
            alert("Cập nhật thông tin cá nhân thành công!"); 
            if (dobEl) dobEl.textContent = nguoiDung.dob.split('-').reverse().join('/');
            if (phoneEl) phoneEl.textContent = nguoiDung.phone;
            hopThoaiSua.style.display = 'none';
            formSua.reset();
        });
    }
}

function dinhDangThongBao(noiDung) {
    // Định dạng văn bản thông báo, phát hiện link liên kết
    let vanBan = noiDung.replace(/\n/g, '<br>');
    let regexLink = /(https?:\/\/[^\s]+)/g;
    return vanBan.replace(regexLink, function(url) {
        return '<a href="' + url + '" target="_blank" class="text-primary font-bold">' + url + '</a>';
    });
}

function capNhatHuyHieuThongBao(nguoiDung) {
    // Đếm số thông báo chưa đọc và hiển thị chấm đỏ báo hiệu
    if (!nguoiDung) return;
    let thongBao = layCSDL('Notifications');
    let thongBaoDaDoc = nguoiDung.readNotifs || [];
    let soChuaDoc = 0;
    
    if (nguoiDung.role === 'sinh-vien') {
        let lopCuaToi = layCSDL('Classes').filter(c => c.enrolledStudents.includes(nguoiDung.id)).map(c => c.id);
        let tbCuaToi = thongBao.filter(n => n.target === 'tat-ca-sinh-vien' || lopCuaToi.includes(n.target));
        soChuaDoc = tbCuaToi.filter(n => !thongBaoDaDoc.includes(n.id)).length;
        
        let huyHieu = document.getElementById('stuNotifBadge');
        if (huyHieu) huyHieu.innerHTML = soChuaDoc > 0 ? '<span style="background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size:10px;">●</span>' : '';
    } else if (nguoiDung.role === 'giang-vien') {
        let tbGiangVien = thongBao.filter(n => n.target === 'tat-ca-giang-vien');
        soChuaDoc = tbGiangVien.filter(n => !thongBaoDaDoc.includes(n.id)).length;
        
        let huyHieu = document.getElementById('tcNotifBadge');
        if (huyHieu) huyHieu.innerHTML = soChuaDoc > 0 ? '<span style="background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size:10px;">●</span>' : '';
    }
}

function hienThiTheThongBaoChung(idVungChua, danhSachTB, nguoiDung) {
    // Tạo thẻ HTML danh sách thông báo
    let vungChua = document.getElementById(idVungChua);
    if (!vungChua) return;
    
    let daDoc = nguoiDung.readNotifs || [];
    let html = danhSachTB.map(n => {
        let checkDaDoc = daDoc.includes(n.id);
        let lopNen = checkDaDoc ? 'bg-light' : '';
        let lopChu = checkDaDoc ? 'text-muted' : 'text-primary';
        let dotDo = checkDaDoc ? '' : '<span class="text-danger ml-10">●</span>';
        let xemTruoc = n.text.length > 80 ? n.text.substring(0, 80) + '...' : n.text;
        
        return `
            <div class="border-box border-left-dark mb-10 cursor-pointer ${lopNen}" onclick="moHopThoaiDocThongBao('${n.id}')">
                <div class="flex-row justify-between mb-10">
                    <strong class="${lopChu}">${n.senderName} ${dotDo}</strong>
                    <span class="text-muted text-sm">${n.date}</span>
                </div>
                <p class="${checkDaDoc ? 'text-muted' : ''}">${xemTruoc}</p>
            </div>
        `;
    }).join('');
    
    vungChua.innerHTML = html || '<p class="border-box">Chưa có thông báo nào.</p>';
}

function moHopThoaiDocThongBao(idThongBao) {
    // Đọc chi tiết thông báo và đánh dấu đã đọc
    let thongBao = layCSDL('Notifications');
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;
    
    let nguoiDung = layCSDL('currentUser');
    if (nguoiDung) {
        if (!nguoiDung.readNotifs) nguoiDung.readNotifs = [];
        if (!nguoiDung.readNotifs.includes(idThongBao)) {
            nguoiDung.readNotifs.push(idThongBao);
            localStorage.setItem('currentUser', JSON.stringify(nguoiDung));
            
            let dsNguoiDung = layCSDL('Users');
            let vt = dsNguoiDung.findIndex(u => u.id === nguoiDung.id);
            if (vt > -1) {
                dsNguoiDung[vt].readNotifs = nguoiDung.readNotifs;
                ghiCSDL('Users', dsNguoiDung);
            }
            
            capNhatHuyHieuThongBao(nguoiDung);
            
            if (nguoiDung.role === 'sinh-vien') {
                hienThiThongBaoSinhVien(nguoiDung);
            } else if (nguoiDung.role === 'giang-vien') {
                hienThiHopThuDenGiangVien(nguoiDung);
            }
        }
    }
    
    document.getElementById('readNotifTitle').textContent = tb.senderName;
    document.getElementById('readNotifDate').textContent = tb.date;
    document.getElementById('readNotifContent').innerHTML = dinhDangThongBao(tb.text);
    
    let vungHanhDong = document.getElementById('readNotifActions');
    if (vungHanhDong) vungHanhDong.innerHTML = '';
    
    moHopThoai('readNotifModal');
}

// --------------------------------------------------------------------------
// 2. KHỞI TẠO DỮ LIỆU MẪU (CNTT DATA SEEDING)
// --------------------------------------------------------------------------
function khoiTaoDuLieuMau() {
    let dataVersion = localStorage.getItem('DataVersion');
    if (dataVersion !== '5') {
        localStorage.removeItem('Users');
        localStorage.removeItem('Subjects');
        localStorage.removeItem('Classes');
        localStorage.removeItem('Notifications');
        localStorage.setItem('DataVersion', '5');
    }

    // Khởi tạo chỉ có 2 tài khoản mẫu (1 Giảng viên, 1 Sinh viên) theo yêu cầu của bạn
    if (!localStorage.getItem('Users')) {
        ghiCSDL('Users', [
            { id: 'GV001', role: 'giang-vien', name: 'ThS. Nguyễn Văn A', email: 'gv1@gmail.com', password: '123', dob: '1985-05-10', phone: '0988111222', readNotifs: [] },
            { id: 'SV202501', role: 'sinh-vien', name: 'Nguyễn Hữu Quyết', email: 'sv1@gmail.com', password: '123', dob: '2005-01-15', phone: '0901000001', readNotifs: [] }
        ]);
    }
    
    // Khởi tạo các môn học
    if (!localStorage.getItem('Subjects')) {
        ghiCSDL('Subjects', [ 
            { id: 'SUB01', name: 'Lập trình Web nâng cao', abbr: 'WEB' }, 
            { id: 'SUB02', name: 'Cấu trúc dữ liệu & Giải thuật', abbr: 'CTDL_GT' }, 
            { id: 'SUB03', name: 'Cơ sở dữ liệu lớn (NoSQL)', abbr: 'CSDL' },
            { id: 'SUB04', name: 'Lập trình hướng đối tượng (OOP)', abbr: 'OOP' },
            { id: 'SUB05', name: 'Trí tuệ nhân tạo (AI & Machine Learning)', abbr: 'AI' },
            { id: 'SUB06', name: 'Mạng máy tính & An ninh mạng', abbr: 'MMT' },
            { id: 'SUB07', name: 'Thiết kế giao diện UI/UX', abbr: 'UIUX' },
            { id: 'SUB08', name: 'Điện toán đám mây (AWS/Azure)', abbr: 'CLOUD' }
        ]);
    }
    
    // Khởi tạo các lớp học mẫu với phân phối Điểm và Điểm danh
    if (!localStorage.getItem('Classes')) {
        let thoiGian = Date.now();
        let maLopWeb = 'WEB_' + thoiGian;
        let maLopCtdl = 'CTDL_' + (thoiGian + 100);
        let maLopCsdl = 'CSDL_' + (thoiGian + 200);
        let maLopOop = 'OOP_' + (thoiGian + 300);
        let maLopAi = 'AI_' + (thoiGian + 400);
        let maLopUiUx = 'UIUX_' + (thoiGian + 500);
        
        ghiCSDL('Classes', [
            { 
                id: maLopWeb, 
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
                    'SV202501': { cc: 10, gk: 8.5, ck: 9 } // Điểm tổng kết: 9.05 -> XUẤT SẮC (Màu tím)
                } 
            },
            {
                id: maLopCtdl, 
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
                    'SV202501': { cc: 10, gk: 9, ck: 8.5 } // Điểm tổng kết: 8.95 -> GIỎI (Màu xanh dương)
                }
            },
            {
                id: maLopCsdl, 
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
                    'SV202501': { cc: 9, gk: 7, ck: 6.5 } // Điểm tổng kết: 7.15 -> KHÁ (Màu xanh lá)
                }
            },
            {
                id: maLopOop, 
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
                    'SV202501': { cc: 8, gk: 5.5, ck: 6 } // Điểm tổng kết: 6.25 -> TRUNG BÌNH (Màu vàng cam)
                }
            },
            {
                id: maLopAi, 
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
                    'SV202501': { cc: 10, gk: 9.5, ck: 9 } // Điểm tổng kết: 9.35 -> XUẤT SẮC (Màu tím)
                }
            },
            {
                id: maLopUiUx, 
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
                    'SV202501': { cc: 6, gk: 4.5, ck: 4 } // Điểm tổng kết: 4.55 -> YẾU (Màu đỏ)
                }
            }
        ]);
    }

    if (!localStorage.getItem('Notifications')) {
        ghiCSDL('Notifications', [
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
        ]);
    }

    if (localStorage.getItem('RegistrationOpen') === null) {
        localStorage.setItem('RegistrationOpen', JSON.stringify(true)); // Mở đăng ký mặc định
    }
}
khoiTaoDuLieuMau();

// --------------------------------------------------------------------------
// 3. XỬ LÝ ĐĂNG NHẬP & ĐĂNG KÝ (AUTH LOGIC - HYBRID MODE)
// --------------------------------------------------------------------------
const DUONG_DAN_API = 'http://localhost:5000/api/auth';

let loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let emailValue = loginForm.elements['email'].value.trim();
        let passwordValue = loginForm.elements['password'].value;
        let roleValue = document.querySelector('input[name="loginRole"]:checked').value;
        
        try {
            // Kết nối API tới MongoDB Atlas
            let response = await fetch(`${DUONG_DAN_API}/dang-nhap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValue, password: passwordValue, role: roleValue })
            });
            let data = await response.json();
            
            if (response.ok && data.success) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // Đồng bộ người dùng này vào mảng offline local
                let users = layCSDL('Users');
                let vt = users.findIndex(u => u.id === data.user.id);
                if (vt === -1) {
                    users.push({ ...data.user, password: passwordValue });
                } else {
                    users[vt] = { ...users[vt], ...data.user, password: passwordValue };
                }
                ghiCSDL('Users', users);
                
                alert("Đăng nhập thành công! (Dữ liệu xác thực từ MongoDB Atlas)");
                chuyenHuongTrangQuanLy(roleValue);
            } else {
                alert(data.message || "Sai thông tin đăng nhập!");
            }
        } catch (error) {
            console.warn("Server không phản hồi. Chuyển sang chế độ LocalStorage offline...");
            
            // Xử lý Offline thông qua CSDL LocalStorage
            let users = layCSDL('Users');
            let user = users.find(u => u.email === emailValue && u.password === passwordValue && u.role === roleValue);
            
            if (user) { 
                localStorage.setItem('currentUser', JSON.stringify(user)); 
                alert("Đăng nhập thành công! (Chế độ ngoại tuyến Local Storage)");
                chuyenHuongTrangQuanLy(roleValue);
            } else {
                alert("Sai tài khoản/mật khẩu hoặc quyền truy cập không đúng!"); 
            }
        }
    });
}

let registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let idValue = registerForm.elements['id'].value.trim();
        let nameValue = registerForm.elements['name'].value.trim();
        let emailValue = registerForm.elements['email'].value.trim();
        let passwordValue = registerForm.elements['password'].value;
        let roleValue = document.querySelector('input[name="regRole"]:checked').value;
        let dobValue = registerForm.elements['dob'].value;
        let phoneValue = registerForm.elements['phone'].value.trim();

        if (passwordValue.length < 6) {
            alert("Mật khẩu phải từ 6 ký tự trở lên!");
            return;
        }

        let taiKhoanGui = {
            id: idValue,
            name: nameValue,
            email: emailValue,
            password: passwordValue,
            role: roleValue,
            dob: dobValue,
            phone: phoneValue
        };

        try {
            // Gửi dữ liệu đăng ký tới MongoDB
            let response = await fetch(`${DUONG_DAN_API}/dang-ky`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taiKhoanGui)
            });
            let data = await response.json();

            if (response.ok && data.success) {
                // Đăng ký thành công, đồng bộ offline
                let users = layCSDL('Users');
                users.push({ ...taiKhoanGui, readNotifs: [] });
                ghiCSDL('Users', users);

                alert(data.message || "Đăng ký thành công trên MongoDB!");
                chuyenTabDangNhapDangKy('dang-nhap');
                if (loginForm) loginForm.elements['email'].value = emailValue;
            } else {
                alert(data.message || "Đăng ký thất bại!");
            }
        } catch (error) {
            console.warn("Lỗi kết nối server đăng ký. Đang lưu tài khoản offline...");
            
            // Xử lý Đăng ký offline
            let users = layCSDL('Users');
            if (users.some(u => u.email.toLowerCase() === emailValue.toLowerCase())) {
                alert("Email này đã có người đăng ký offline!");
                return;
            }
            if (users.some(u => u.id === idValue)) {
                alert("Mã định danh (MSSV/GV) đã tồn tại offline!");
                return;
            }

            users.push({ ...taiKhoanGui, readNotifs: [] });
            ghiCSDL('Users', users);

            alert("Đăng ký thành công (Lưu trên LocalStorage)");
            chuyenTabDangNhapDangKy('dang-nhap');
            if (loginForm) loginForm.elements['email'].value = emailValue;
        }
    });
}

function chuyenHuongTrangQuanLy(vaiTro) {
    if (vaiTro === 'giang-vien') {
        window.location.href = 'teacher-dashboard.html';
    } else if (vaiTro === 'sinh-vien') {
        window.location.href = 'student-dashboard.html';
    } else {
        localStorage.removeItem('currentUser');
    }
}

// --------------------------------------------------------------------------
// 4. TRANG SINH VIÊN (STUDENT DASHBOARD ENGINE)
// --------------------------------------------------------------------------
let bieuDoChuyenCan = null;
let bieuDoHocLuc = null;

function kiemTraTrungLich(lopA, lopB) {
    // Kiểm tra xem 2 lớp có bị học cùng thứ và cùng khoảng tiết hay không
    let cungThu = (lopA.dayOfWeek === lopB.dayOfWeek);
    let trungTiet = (lopA.startPeriod <= lopB.endPeriod && lopB.startPeriod <= lopA.endPeriod);
    return cungThu && trungTiet;
}

function taoHtmlDongDiem(tenMon, tenGiangVien, diemSo) {
    let diemKTHS = tinhDiemTrungBinh(diemSo.cc, diemSo.gk, diemSo.ck);
    let hienThiCC = (diemSo.cc !== null && diemSo.cc !== "") ? diemSo.cc : "--";
    let hienThiGK = (diemSo.gk !== null && diemSo.gk !== "") ? diemSo.gk : "--";
    let hienThiCK = (diemSo.ck !== null && diemSo.ck !== "") ? diemSo.ck : "--";
    let hienThiTB = diemKTHS !== null ? diemKTHS.toFixed(1) : "--";
    let xepLoaiHtml = layHtmlXepLoai(diemKTHS);

    return `
        <tr>
            <td><strong>${tenMon}</strong></td>
            <td>${tenGiangVien}</td>
            <td>${hienThiCC}</td>
            <td>${hienThiGK}</td>
            <td>${hienThiCK}</td>
            <td><strong>${hienThiTB}</strong></td>
            <td>${xepLoaiHtml}</td>
        </tr>
    `;
}

function hienThiBaoCaoHocTapSinhVien(sinhVien) {
    let lopHocs = layCSDL('Classes');
    let monHocs = layCSDL('Subjects');
    let nguoiDungs = layCSDL('Users');
    
    let lopCuaToi = lopHocs.filter(c => c.enrolledStudents.includes(sinhVien.id));
    let homNay = new Date().toLocaleDateString('en-CA');
    
    let lichHocTuan = { 
        'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] 
    };
    
    let theLopHtml = '';
    let bangDiemHtml = '';
    let tongDiemTB = 0; 
    let soMonCoDiem = 0; 
    let soLopDatLoaiGioi = 0;
    
    let thongKeChuyenCan = { present: 0, late: 0, absent: 0 };
    let thongKeBieuDoTron = { xuatSac: 0, gioi: 0, kha: 0, tb: 0, yeu: 0 };

    lopCuaToi.forEach(c => {
        let mon = monHocs.find(s => s.id === c.subjectId);
        let tenMon = mon ? mon.name : 'Môn học';
        let tenGV = nguoiDungs.find(u => u.id === c.teacherId)?.name || 'Chưa phân công';
        
        let chuoiGio = layThongTinTietHoc(c.startPeriod, c.endPeriod);
        lichHocTuan[c.dayOfWeek].push({ 
            subName: tenMon, 
            room: c.room, 
            timeStr: chuoiGio 
        });
        
        let tongSoBuoi = c.sessions.length;
        let soBuoiDaHoc = c.sessions.filter(s => s.date <= homNay).length;
        let phanTramTienDo = tongSoBuoi > 0 ? Math.round((soBuoiDaHoc / tongSoBuoi) * 100) : 0;
        
        let diem = c.grades[sinhVien.id] || { cc: null, gk: null, ck: null };
        let diemTBMon = tinhDiemTrungBinh(diem.cc, diem.gk, diem.ck);
        
        if (diemTBMon !== null) {
            soMonCoDiem++; 
            tongDiemTB += diemTBMon; 
            if (diemTBMon >= 8.0) soLopDatLoaiGioi++;
            
            if (diemTBMon >= 9.0) thongKeBieuDoTron.xuatSac++; 
            else if (diemTBMon >= 8.0) thongKeBieuDoTron.gioi++; 
            else if (diemTBMon >= 6.5) thongKeBieuDoTron.kha++; 
            else if (diemTBMon >= 5.0) thongKeBieuDoTron.tb++; 
            else thongKeBieuDoTron.yeu++;
        }
        
        bangDiemHtml += taoHtmlDongDiem(tenMon, tenGV, diem);
        
        c.sessions.forEach(s => { 
            let status = s.attendance[sinhVien.id]; 
            if (status) thongKeChuyenCan[status]++; 
        });

        let tenHienThi = layTenLopHienThi(c.id);
        theLopHtml += `
            <div class="border-box border-left-dark flex-row align-center justify-between mb-10 cursor-pointer" onclick="moHopThoaiLopSinhVien('${c.id}')">
                <div class="flex-1">
                    <h4 class="mb-10 text-primary">${tenMon} - ${tenHienThi}</h4>
                    <p class="text-sm text-muted mb-10">Giảng viên: <span class="font-bold">${tenGV}</span> | Phòng: <span class="font-bold">${c.room}</span></p>
                    <div class="progress-bg mt-10">
                        <div class="progress-fill" style="width:${phanTramTienDo}%;"></div>
                    </div>
                    <span class="text-sm font-bold text-muted">Tiến độ lớp: ${phanTramTienDo}% (${soBuoiDaHoc}/${tongSoBuoi} buổi học)</span>
                </div>
                <div style="padding-left: 20px;">
                    <p class="font-bold text-success">Điểm TB: ${diemTBMon !== null ? diemTBMon.toFixed(1) : "--"}</p>
                </div>
            </div>
        `;
    });

    let elBangDiem = document.getElementById('stuGradesTableBody');
    if (elBangDiem) elBangDiem.innerHTML = bangDiemHtml || '<tr><td colspan="7">Sinh viên chưa có điểm môn học nào.</td></tr>';

    let htmlLich = Object.keys(lichHocTuan).filter(thu => lichHocTuan[thu].length > 0).map(thu => {
        let monHocHtml = lichHocTuan[thu].map(m => `
            <div class="bg-light p-10 mt-10" style="border-radius: 6px;">
                <strong class="text-primary">${m.subName}</strong><br>
                <span class="text-sm text-muted">${m.timeStr} | P.${m.room}</span>
            </div>
        `).join('');
        return `
            <div class="border-box">
                <h3 class="border-bottom">${thu}</h3>
                ${monHocHtml}
            </div>
        `;
    }).join('');

    let elSchedule = document.getElementById('weeklyScheduleContainer');
    if (elSchedule) elSchedule.innerHTML = htmlLich || '<p>Tuần này bạn không có lịch học.</p>';
    
    let elEnrolled = document.getElementById('enrolledClassesCards');
    if (elEnrolled) elEnrolled.innerHTML = theLopHtml || '<p class="border-box">Bạn chưa đăng ký tham gia lớp học nào.</p>';
    
    let elTotalSub = document.getElementById('stat-total-subjects');
    if (elTotalSub) elTotalSub.textContent = lopCuaToi.length;
    
    let elGpa = document.getElementById('stat-gpa');
    if (elGpa) elGpa.textContent = soMonCoDiem > 0 ? (tongDiemTB / soMonCoDiem).toFixed(1) : '--';
    
    let elExcel = document.getElementById('stat-excellent');
    if (elExcel) elExcel.textContent = soLopDatLoaiGioi;
    
    let tongDiemDanh = thongKeChuyenCan.present + thongKeChuyenCan.late + thongKeChuyenCan.absent;
    let elRate = document.getElementById('stat-attendance-rate');
    if (elRate) {
        elRate.textContent = tongDiemDanh > 0 ? ((thongKeChuyenCan.present / tongDiemDanh) * 100).toFixed(1) + '%' : '0%';
    }
    
    veBieuDoSinhVien(thongKeChuyenCan, thongKeBieuDoTron);
}

function veBieuDoSinhVien(att, grades) {
    let canvasAtt = document.getElementById('attendanceChart');
    if (!canvasAtt) return;
    
    if (bieuDoChuyenCan) bieuDoChuyenCan.destroy(); 
    if (bieuDoHocLuc) bieuDoHocLuc.destroy();

    bieuDoChuyenCan = new Chart(canvasAtt, { 
        type: 'bar', 
        data: { 
            labels: ['Có mặt', 'Đi muộn', 'Vắng'], 
            datasets: [{ 
                label: 'Số buổi', 
                data: [att.present, att.late, att.absent], 
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
            }] 
        }, 
        options: { 
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { stepSize: 1 } } } 
        } 
    });
    
    let tongLoai = grades.xuatSac + grades.gioi + grades.kha + grades.tb + grades.yeu;
    if (tongLoai > 0) {
        let canvasPie = document.getElementById('gradePieChart');
        if (canvasPie) {
            bieuDoHocLuc = new Chart(canvasPie, { 
                type: 'pie', 
                data: { 
                    labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'], 
                    datasets: [{ 
                        data: [grades.xuatSac, grades.gioi, grades.kha, grades.tb, grades.yeu], 
                        backgroundColor: ['#9C27B0', '#2563eb', '#10b981', '#f59e0b', '#ef4444'] 
                    }] 
                } 
            });
        }
    }
}

function moHopThoaiLopSinhVien(idLop) {
    let lopHocs = layCSDL('Classes');
    let monHocs = layCSDL('Subjects');
    let nguoiDungs = layCSDL('Users');
    let user = layCSDL('currentUser');
    
    let lop = lopHocs.find(c => c.id === idLop); 
    if (!lop) return;
    
    let tenMon = monHocs.find(s => s.id === lop.subjectId)?.name || '';
    let tenGV = nguoiDungs.find(u => u.id === lop.teacherId)?.name || '';
    let tenHienThi = layTenLopHienThi(lop.id);
    
    document.getElementById('modalClassName').textContent = `${tenMon} (${tenHienThi})`;
    document.getElementById('modalTeacherName').textContent = `Giảng viên phụ trách: ${tenGV}`;
    
    let homNay = new Date().toLocaleDateString('en-CA');
    
    let htmlDong = lop.sessions.map(s => {
        let trangThai = (s.date <= homNay) ? layHtmlDiemDanh(s.attendance[user.id]) : "Chưa diễn ra";
        let tietChuoi = layThongTinTietHoc(s.startPeriod, s.endPeriod);
        
        return `
            <tr>
                <td>Ngày học: ${s.date} <span class="text-muted text-sm ml-10">${tietChuoi}</span></td>
                <td>${trangThai}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('modalSessionList').innerHTML = htmlDong || '<tr><td colspan="2">Lớp này chưa được tạo buổi học.</td></tr>';
    moHopThoai('stuClassModal');
}

function hienThiTabDangKyTinChi(sinhVien) {
    let lopHocs = layCSDL('Classes');
    let monHocs = layCSDL('Subjects');
    let nguoiDungs = layCSDL('Users');
    
    let vungChua = document.getElementById('registrationContainer'); 
    if (!vungChua) return;
    
    let congDangKyMo = JSON.parse(localStorage.getItem('RegistrationOpen'));
    let lopDaDangKy = lopHocs.filter(cls => cls.enrolledStudents.includes(sinhVien.id));
    let htmlResult = '';
    
    if (!congDangKyMo) {
        htmlResult += `
            <div class="border-box bg-light mb-20" style="border-left: 5px solid var(--danger);">
                <strong class="text-danger">Hệ thống hiện tại đang khóa cổng đăng ký học phần trực tuyến.</strong>
            </div>
        `;
    }
    
    monHocs.forEach(mon => {
        let dsLopCuaMon = lopHocs.filter(c => c.subjectId === mon.id); 
        if (dsLopCuaMon.length === 0) return;
        
        let lopMonNayDaDangKy = dsLopCuaMon.find(c => c.enrolledStudents.includes(sinhVien.id));
        htmlResult += `<h3 class="border-bottom mt-20 mb-10 text-primary font-bold">${mon.name}</h3>`;

        dsLopCuaMon.forEach(c => {
            let tenGV = nguoiDungs.find(u => u.id === c.teacherId)?.name || '';
            let tenHienThi = layTenLopHienThi(c.id);
            let thongTinTiet = layThongTinTietHoc(c.startPeriod, c.endPeriod);
            
            let daDangKy = c.enrolledStudents.includes(sinhVien.id);
            let daDangKyLopKhacCungMon = (lopMonNayDaDangKy && lopMonNayDaDangKy.id !== c.id);
            let biTrungLich = lopDaDangKy.some(lopDaDK => kiemTraTrungLich(c, lopDaDK));
            
            let biVoHieuCard = !congDangKyMo || (!daDangKy && (daDangKyLopKhacCungMon || biTrungLich));
            let thuocTinhDisabled = biVoHieuCard ? 'disabled' : '';
            
            let htmlNutAction = '';
            if (congDangKyMo) {
                if (daDangKy) {
                    htmlNutAction = `<button class="btn-danger" style="width: auto;" onclick="huyDangKyLopHoc('${c.id}')">Hủy đăng ký</button>`;
                } else if (!daDangKyLopKhacCungMon && !biTrungLich) {
                    htmlNutAction = `<button class="btn-primary" style="width: auto;" onclick="dangKyLopHoc('${c.id}')">Đăng ký</button>`;
                }
            } else {
                htmlNutAction = daDangKy ? `<strong class="text-success">Đã đăng ký</strong>` : `<span class="text-muted">Đã khóa</span>`;
            }

            let suKienClick = biVoHieuCard ? '' : `onclick="moHopThoaiLopSinhVien('${c.id}')"`;

            htmlResult += `
                <div class="border-box border-left-dark flex-row align-center justify-between mb-10 ${thuocTinhDisabled}">
                    <div class="flex-1 cursor-pointer" ${suKienClick}>
                        <h4 class="mb-10 text-primary">Tên lớp: ${tenHienThi}</h4>
                        <p class="text-sm text-muted">Giáo viên: ${tenGV} | Phòng: ${c.room}</p>
                        <p class="text-sm">Lịch học: ${c.dayOfWeek} (${thongTinTiet})</p>
                    </div>
                    <div>
                        ${htmlNutAction}
                    </div>
                </div>
            `;
        }); 
    }); 
    
    vungChua.innerHTML = htmlResult || '<p>Chưa có học phần nào mở lớp đăng ký.</p>';
}

function dangKyLopHoc(idLop) { 
    let user = layCSDL('currentUser');
    capNhatLopCSDL(idLop, function(c) { 
        if (!c.enrolledStudents.includes(user.id)) {
            c.enrolledStudents.push(user.id); 
            c.grades[user.id] = { cc: null, gk: null, ck: null };
        }
    }); 
    
    alert("Đăng ký lớp học thành công!"); 
    hienThiTabDangKyTinChi(user); 
    hienThiBaoCaoHocTapSinhVien(user); 
    hienThiThongBaoSinhVien(user);
}

function huyDangKyLopHoc(idLop) { 
    if (confirm("Xác nhận hủy đăng ký học phần này? Dữ liệu điểm của bạn ở lớp này sẽ bị xóa!")) { 
        let user = layCSDL('currentUser');
        capNhatLopCSDL(idLop, function(c) { 
            c.enrolledStudents = c.enrolledStudents.filter(id => id !== user.id); 
            delete c.grades[user.id];
        }); 
        
        alert("Hủy đăng ký học phần thành công!"); 
        hienThiTabDangKyTinChi(user); 
        hienThiBaoCaoHocTapSinhVien(user); 
        hienThiThongBaoSinhVien(user);
    } 
}

function hienThiThongBaoSinhVien(sinhVien) {
    let lopHocs = layCSDL('Classes');
    let lopCuaToi = lopHocs.filter(c => c.enrolledStudents.includes(sinhVien.id));
    
    let locSelect = document.getElementById('stuNotifFilter');
    if (locSelect && locSelect.options.length <= 2) {
        let htmlOptions = `<option value="all">Tất cả thông báo</option>`;
        htmlOptions += `<option value="tat-ca-sinh-vien">Thông báo chung từ nhà trường</option>`;
        
        lopCuaToi.forEach(c => {
            htmlOptions += `<option value="${c.id}">Lớp ${layTenLopHienThi(c.id)}</option>`;
        });
        locSelect.innerHTML = htmlOptions;
    }
    
    let giaTriLoc = locSelect ? locSelect.value : 'all';
    let thongBao = layCSDL('Notifications');
    let dsMaLopCuaToi = lopCuaToi.map(c => c.id);
    
    let tbLoc = thongBao.filter(n => {
        if (giaTriLoc === 'all') {
            return n.target === 'tat-ca-sinh-vien' || dsMaLopCuaToi.includes(n.target);
        } else {
            return n.target === giaTriLoc;
        }
    }).reverse();
    
    hienThiTheThongBaoChung('studentNotifList', tbLoc, sinhVien);
}

function locThongBaoSinhVien() {
    let user = layCSDL('currentUser');
    hienThiThongBaoSinhVien(user);
}

function danhDauDaDocTatCaThongBaoSinhVien() {
    let user = layCSDL('currentUser');
    let locSelect = document.getElementById('stuNotifFilter');
    let giaTriLoc = locSelect ? locSelect.value : 'all';
    
    let thongBao = layCSDL('Notifications');
    let dsMaLopCuaToi = layCSDL('Classes').filter(c => c.enrolledStudents.includes(user.id)).map(c => c.id);
    
    let tbLoc = thongBao.filter(n => {
        if (giaTriLoc === 'all') {
            return n.target === 'tat-ca-sinh-vien' || dsMaLopCuaToi.includes(n.target);
        } else {
            return n.target === giaTriLoc;
        }
    });
    
    let coThayDoi = false;
    if (!user.readNotifs) user.readNotifs = [];
    
    tbLoc.forEach(n => {
        if (!user.readNotifs.includes(n.id)) {
            user.readNotifs.push(n.id);
            coThayDoi = true;
        }
    });
    
    if (coThayDoi) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        let dsNguoiDung = layCSDL('Users');
        let vt = dsNguoiDung.findIndex(u => u.id === user.id);
        if (vt > -1) {
            dsNguoiDung[vt].readNotifs = user.readNotifs;
            ghiCSDL('Users', dsNguoiDung);
        }
        capNhatHuyHieuThongBao(user);
        hienThiThongBaoSinhVien(user);
    }
}

// --------------------------------------------------------------------------
// 5. TRANG GIẢNG VIÊN (TEACHER DASHBOARD ENGINE)
// --------------------------------------------------------------------------
function hienThiBaoCaoGiangVien(giangVien) {
    let lopHocs = layCSDL('Classes');
    let monHocs = layCSDL('Subjects');
    
    let lopCuaToi = lopHocs.filter(cls => cls.teacherId === giangVien.id);
    let homNay = new Date().toLocaleDateString('en-CA');
    
    let tongSoSinhVienLop = 0;
    let theLopHtml = '';
    
    let lichDayTuan = { 
        'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] 
    };

    let selectNotifTarget = document.getElementById('tcNotifTarget');
    if (selectNotifTarget) {
        selectNotifTarget.innerHTML = lopCuaToi.map(c => `<option value="${c.id}">Lớp ${layTenLopHienThi(c.id)}</option>`).join('');
    }

    lopCuaToi.forEach(c => {
        let mon = monHocs.find(s => s.id === c.subjectId);
        let tenMon = mon ? mon.name : 'Unknown';
        tongSoSinhVienLop += c.enrolledStudents.length;
        
        lichDayTuan[c.dayOfWeek].push({ 
            subName: tenMon, 
            room: c.room, 
            timeStr: layThongTinTietHoc(c.startPeriod, c.endPeriod) 
        });
    });

    monHocs.forEach(mon => {
        let lopCuaMon = lopCuaToi.filter(c => c.subjectId === mon.id);
        if (lopCuaMon.length === 0) return;
        
        theLopHtml += `<h3 class="border-bottom mt-20 mb-10 text-primary font-bold">${mon.name}</h3>`;

        lopCuaMon.forEach(c => {
            let tongBuoi = c.sessions.length;
            let buoiDaQua = c.sessions.filter(s => s.date <= homNay).length;
            let phanTram = tongBuoi > 0 ? Math.round((buoiDaQua / tongBuoi) * 100) : 0;
            let tenHienThi = layTenLopHienThi(c.id);

            theLopHtml += `
                <div class="border-box border-left-dark flex-row align-center justify-between mb-10 cursor-pointer" onclick="moLopPhuTrachGiangVien('${c.id}', '${tenHienThi}')">
                    <div class="flex-1">
                        <h4 class="mb-10 text-primary">Tên lớp: ${tenHienThi}</h4>
                        <p class="text-sm text-muted mb-10">Phòng học: <span class="font-bold">${c.room}</span> | <span class="text-success font-bold">${c.enrolledStudents.length} Sinh viên</span></p>
                        <div class="progress-bg mt-10">
                            <div class="progress-fill" style="width:${phanTram}%;"></div>
                        </div>
                        <span class="text-sm font-bold text-muted">Tiến trình lớp: ${phanTram}% (${buoiDaQua}/${tongBuoi} buổi)</span>
                    </div>
                </div>
            `;
        });
    });

    let htmlLichDay = Object.keys(lichDayTuan).filter(t => lichDayTuan[t].length > 0).map(t => {
        let itemsHtml = lichDayTuan[t].map(item => `
            <div class="bg-light p-10 mt-10" style="border-radius: 6px;">
                <strong class="text-primary">${item.subName}</strong><br>
                <span class="text-sm text-muted">${item.timeStr} | P.${item.room}</span>
            </div>
        `).join('');
        return `
            <div class="border-box">
                <h3 class="border-bottom">${t}</h3>
                ${itemsHtml}
            </div>
        `;
    }).join('');

    let elTotalLop = document.getElementById('tc-total-classes');
    if (elTotalLop) elTotalLop.textContent = lopCuaToi.length;
    
    let elTotalSV = document.getElementById('tc-total-students');
    if (elTotalSV) elTotalSV.textContent = tongSoSinhVienLop;
    
    let elClassList = document.getElementById('teacherClassList');
    if (elClassList) elClassList.innerHTML = theLopHtml || '<p style="padding: 20px;">Giảng viên chưa có lịch giảng dạy lớp nào.</p>';
    
    let elLich = document.getElementById('tcWeeklyScheduleContainer');
    if (elLich) elLich.innerHTML = htmlLichDay || '<p>Trống lịch giảng dạy tuần này.</p>';
}

function hienThiThongBaoGiangVien(giangVien) {
    if (!giangVien) giangVien = layCSDL('currentUser');
    hienThiHopThuDenGiangVien(giangVien);
    hienThiLichSuGuiGiangVien(giangVien);
}

function hienThiHopThuDenGiangVien(giangVien) {
    if (!giangVien) giangVien = layCSDL('currentUser');
    let thongBao = layCSDL('Notifications');
    let tbGiangVien = thongBao.filter(n => n.target === 'tat-ca-giang-vien').reverse();
    hienThiTheThongBaoChung('teacherInboxList', tbGiangVien, giangVien);
}

function hienThiLichSuGuiGiangVien(giangVien) {
    if (!giangVien) giangVien = layCSDL('currentUser');
    let thongBao = layCSDL('Notifications').filter(n => n.senderName === giangVien.name).reverse();
    
    let html = thongBao.map(n => {
        let tenLopNhan = layTenLopHienThi(n.target);
        let xemTruoc = n.text.length > 50 ? n.text.substring(0, 50) + '...' : n.text;
        
        return `
            <tr class="cursor-pointer" onclick="moQuanLyThongBaoGiangVien('${n.id}')">
                <td>${n.date}</td>
                <td><strong class="text-primary">Lớp ${tenLopNhan}</strong></td>
                <td>${xemTruoc}</td>
            </tr>
        `;
    }).join('');
    
    let container = document.getElementById('teacherSentNotifs');
    if (container) {
        container.innerHTML = html || '<tr><td colspan="3">Giảng viên chưa gửi thông báo nào cho lớp học.</td></tr>';
    }
}

function danhDauDaDocTatCaThongBaoGiangVien() {
    let user = layCSDL('currentUser');
    let thongBao = layCSDL('Notifications').filter(n => n.target === 'tat-ca-giang-vien');
    let coThayDoi = false;
    
    if (!user.readNotifs) user.readNotifs = [];
    thongBao.forEach(n => {
        if (!user.readNotifs.includes(n.id)) {
            user.readNotifs.push(n.id);
            coThayDoi = true;
        }
    });
    
    if (coThayDoi) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        let users = layCSDL('Users');
        let vt = users.findIndex(u => u.id === user.id);
        if (vt > -1) {
            users[vt].readNotifs = user.readNotifs;
            ghiCSDL('Users', users);
        }
        capNhatHuyHieuThongBao(user);
        hienThiHopThuDenGiangVien(user);
    }
}

let formGuiTB = document.getElementById('teacherNotifForm');
if (formGuiTB) {
    formGuiTB.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let user = layCSDL('currentUser');
        let targetLop = formGuiTB.elements['target'].value;
        let noiDung = formGuiTB.elements['text'].value;
        
        let newNotif = {
            id: 'NOTIF_' + Date.now(),
            senderName: user.name,
            target: targetLop,
            text: noiDung,
            date: new Date().toLocaleDateString('en-CA')
        };
        
        let notifs = layCSDL('Notifications');
        notifs.push(newNotif);
        ghiCSDL('Notifications', notifs);
        
        alert("Gửi thông báo lớp thành công!");
        this.reset();
        hienThiLichSuGuiGiangVien(user);
    });
}

function moQuanLyThongBaoGiangVien(idThongBao) {
    let thongBao = layCSDL('Notifications');
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;

    document.getElementById('readNotifTitle').textContent = tb.senderName;
    document.getElementById('readNotifDate').textContent = tb.date;
    document.getElementById('readNotifContent').innerHTML = dinhDangThongBao(tb.text);

    let vungHanhDong = document.getElementById('readNotifActions');
    if (vungHanhDong) {
        vungHanhDong.innerHTML = `
            <button class="action-btn" onclick="suaThongBaoGiangVien('${tb.id}')">Chỉnh sửa</button>
            <button class="btn-danger" onclick="xoaThongBaoGiangVien('${tb.id}')">Xóa thông báo</button>
        `;
    }
    moHopThoai('readNotifModal');
}

function xoaThongBaoGiangVien(idThongBao) {
    if (confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
        let thongBao = layCSDL('Notifications').filter(n => n.id !== idThongBao);
        ghiCSDL('Notifications', thongBao);
        dongHopThoai('readNotifModal');
        hienThiLichSuGuiGiangVien();
    }
}

function suaThongBaoGiangVien(idThongBao) {
    let thongBao = layCSDL('Notifications');
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;

    let contentDiv = document.getElementById('readNotifContent');
    contentDiv.innerHTML = `
        <textarea id="editNotifTextarea" rows="6" class="input-group" style="width:100%; border:1px solid var(--border-color); border-radius:6px; padding:10px;">${tb.text}</textarea>
    `;

    let actions = document.getElementById('readNotifActions');
    if (actions) {
        actions.innerHTML = `
            <button class="btn-primary" style="width: auto;" onclick="luuThongBaoGiangVien('${tb.id}')">Cập nhật</button>
        `;
    }
}

function luuThongBaoGiangVien(idThongBao) {
    let vanBanMoi = document.getElementById('editNotifTextarea').value;
    let thongBao = layCSDL('Notifications');
    let tb = thongBao.find(x => x.id === idThongBao);
    if (tb) {
        tb.text = vanBanMoi;
        ghiCSDL('Notifications', thongBao);
    }
    
    document.getElementById('readNotifContent').innerHTML = dinhDangThongBao(vanBanMoi);
    let actions = document.getElementById('readNotifActions');
    if (actions) {
        actions.innerHTML = `
            <button class="action-btn" onclick="suaThongBaoGiangVien('${tb.id}')">Chỉnh sửa</button>
            <button class="btn-danger" onclick="xoaThongBaoGiangVien('${tb.id}')">Xóa thông báo</button>
        `;
    }
    hienThiLichSuGuiGiangVien();
}

function moLopPhuTrachGiangVien(idLop, tenHienThi) {
    let vungChiTiet = document.getElementById('class-detail-tab');
    vungChiTiet.dataset.classId = idLop; 
    document.getElementById('teacherDetailClassName').textContent = `${tenHienThi} (Mã HT: ${idLop})`;
    
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
    vungChiTiet.style.display = 'block';
    
    document.querySelector('[data-target="tc-sub-grades"]').click();
    hienThiDiemHocSinhGiangVien();
}

function hienThiDiemHocSinhGiangVien() {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let lop = layCSDL('Classes').find(cls => cls.id === idLop);
    let users = layCSDL('Users');
    
    let htmlDong = lop.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (!stu) return '';
        
        let diem = lop.grades[studentId] || { cc: null, gk: null, ck: null };
        let diemTBMon = tinhDiemTrungBinh(diem.cc, diem.gk, diem.ck);
        
        let valCC = diem.cc !== null ? diem.cc : '';
        let valGK = diem.gk !== null ? diem.gk : '';
        let valCK = diem.ck !== null ? diem.ck : '';
        
        return `
            <tr>
                <td>
                    <strong class="text-primary">${stu.name}</strong><br>
                    <span class="text-muted text-sm">${stu.id}</span>
                </td>
                <td><input type="number" id="cc_${stu.id}" value="${valCC}" min="0" max="10" step="0.1" style="width:70px; padding:5px; border: 1px solid var(--border-color); border-radius:4px;"></td>
                <td><input type="number" id="gk_${stu.id}" value="${valGK}" min="0" max="10" step="0.1" style="width:70px; padding:5px; border: 1px solid var(--border-color); border-radius:4px;"></td>
                <td><input type="number" id="ck_${stu.id}" value="${valCK}" min="0" max="10" step="0.1" style="width:70px; padding:5px; border: 1px solid var(--border-color); border-radius:4px;"></td>
                <td class="text-success font-bold">${diemTBMon !== null ? diemTBMon : "--"}</td>
                <td><button class="action-btn" onclick="luuDiemHocSinhGiangVien('${stu.id}')">Lưu</button></td>
            </tr>
        `;
    }).join('');
    
    let tbody = document.getElementById('tcStudentGrades');
    if (tbody) tbody.innerHTML = htmlDong || '<tr><td colspan="6">Chưa có sinh viên nào tham gia lớp này.</td></tr>';
}

function luuDiemHocSinhGiangVien(idSinhVien) {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    
    let ccInp = document.getElementById('cc_' + idSinhVien).value;
    let gkInp = document.getElementById('gk_' + idSinhVien).value;
    let ckInp = document.getElementById('ck_' + idSinhVien).value;
    
    let valCC = ccInp === "" ? null : parseFloat(ccInp);
    let valGK = gkInp === "" ? null : parseFloat(gkInp);
    let valCK = ckInp === "" ? null : parseFloat(ckInp);
    
    if ((valCC !== null && (valCC < 0 || valCC > 10)) || 
        (valGK !== null && (valGK < 0 || valGK > 10)) || 
        (valCK !== null && (valCK < 0 || valCK > 10))) { 
        alert("Điểm số phải nằm trong khoảng từ 0 đến 10!"); 
        return; 
    }
    
    capNhatLopCSDL(idLop, function(c) {
        if (!c.grades[idSinhVien]) c.grades[idSinhVien] = {};
        c.grades[idSinhVien] = { cc: valCC, gk: valGK, ck: valCK };
    });
    
    alert("Đã lưu điểm cho sinh viên!"); 
    hienThiDiemHocSinhGiangVien();
}

function hienThiBuoiHocGiangVien() {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let lop = layCSDL('Classes').find(cls => cls.id === idLop);
    
    let htmlDong = lop.sessions.map(s => {
        let daDiemDanh = Object.keys(s.attendance).length > 0;
        let nhanNut = daDiemDanh 
            ? `<button class="action-btn" onclick="moHopThoaiDiemDanhGiangVien('${s.id}')">Sửa điểm danh</button>` 
            : `<button class="btn-primary" style="padding:6px 12px; width:auto;" onclick="moHopThoaiDiemDanhGiangVien('${s.id}')">Điểm danh</button>`;
            
        return `
            <tr>
                <td>Ngày học: ${s.date}</td>
                <td>${layThongTinTietHoc(s.startPeriod, s.endPeriod)}</td>
                <td>${nhanNut}</td>
            </tr>
        `;
    }).join('');
    
    let tbody = document.getElementById('tcSessionList');
    if (tbody) tbody.innerHTML = htmlDong || '<tr><td colspan="3">Chưa có lịch học nào.</td></tr>';
}

function moHopThoaiDiemDanhGiangVien(idBuoiHoc) {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let lop = layCSDL('Classes').find(cls => cls.id === idLop);
    let buoi = lop.sessions.find(x => x.id === idBuoiHoc);
    let users = layCSDL('Users');
    
    document.getElementById('tcAttModal').dataset.sessionId = idBuoiHoc;
    document.getElementById('tcAttSessionInfo').textContent = `Điểm danh chuyên cần (Ngày ${buoi.date})`;
    
    let htmlDong = lop.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (!stu) return ''; 
        
        let status = buoi.attendance[studentId] || '';
        let isPresent = status === 'present' ? 'checked' : '';
        let isLate = status === 'late' ? 'checked' : '';
        let isAbsent = status === 'absent' ? 'checked' : '';
        
        return `
            <tr>
                <td>
                    <strong class="text-primary">${stu.name}</strong><br>
                    <span class="text-muted text-sm">${stu.id}</span>
                </td>
                <td>
                    <div class="radio-group">
                        <label class="text-success font-bold"><input type="radio" name="att_${stu.id}" value="present" ${isPresent}> Có mặt</label>
                        <label class="text-warning font-bold"><input type="radio" name="att_${stu.id}" value="late" ${isLate}> Muộn</label>
                        <label class="text-danger font-bold"><input type="radio" name="att_${stu.id}" value="absent" ${isAbsent}> Vắng</label>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    let tbody = document.getElementById('tcAttendanceList');
    if (tbody) tbody.innerHTML = htmlDong || '<tr><td colspan="2">Lớp này trống.</td></tr>';
    moHopThoai('tcAttModal');
}

function luuDiemDanhGiangVien() {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let idBuoiHoc = document.getElementById('tcAttModal').dataset.sessionId;

    capNhatLopCSDL(idLop, function(c) {
        let buoi = c.sessions.find(x => x.id === idBuoiHoc);
        c.enrolledStudents.forEach(studentId => { 
            let radioInp = document.querySelector(`input[name="att_${studentId}"]:checked`); 
            if (radioInp) {
                buoi.attendance[studentId] = radioInp.value; 
            }
        });
    });
    
    alert("Đã lưu danh sách điểm danh thành công!"); 
    dongHopThoai('tcAttModal');
    hienThiBuoiHocGiangVien();
}

// --------------------------------------------------------------------------
// 6. ĐIỀU PHỐI LỚP HỌC (COORDINATOR LOGIC BY TEACHER)
// --------------------------------------------------------------------------
function khoiTaoTabDieuPhoiLop() {
    thietLapLuaChonDieuPhoi();
    hienThiDanhSachLopDieuPhoi();
    hienThiNutBatTatCongDangKy();
}

function taoDanhSachNgayHoc(startDateStr, endDateStr, dayText) {
    let dayMap = { 'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6 };
    let targetDay = dayMap[dayText];
    let results = [];
    
    let partsStart = startDateStr.split('-');
    let partsEnd = endDateStr.split('-');
    
    let currentDate = new Date(partsStart[0], partsStart[1] - 1, partsStart[2]);
    let endDate = new Date(partsEnd[0], partsEnd[1] - 1, partsEnd[2]);
    
    while (currentDate <= endDate) { 
        if (currentDate.getDay() === targetDay) {
            let y = currentDate.getFullYear();
            let m = String(currentDate.getMonth() + 1).padStart(2, '0');
            let d = String(currentDate.getDate()).padStart(2, '0');
            results.push(`${y}-${m}-${d}`); 
        }
        currentDate.setDate(currentDate.getDate() + 1); 
    }
    return results;
}

function thietLapLuaChonDieuPhoi() {
    let users = layCSDL('Users');
    let subjects = layCSDL('Subjects');
    
    let formTao = document.forms['adminCreateClassForm'];
    let formSua = document.forms['editClassForm'];
    
    let optionsMon = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    let optionsGV = users.filter(u => u.role === 'giang-vien').map(t => {
        return `<option value="${t.id}">${t.name}</option>`;
    }).join('');
    
    if (formTao && formTao.elements['subId']) {
        formTao.elements['subId'].innerHTML = optionsMon;
        formTao.elements['teacherId'].innerHTML = optionsGV;
    }
    
    if (formSua && formSua.elements['subId']) {
        formSua.elements['subId'].innerHTML = optionsMon;
        formSua.elements['teacherId'].innerHTML = optionsGV;
    }
}

function hienThiDanhSachLopDieuPhoi() {
    let classes = layCSDL('Classes');
    let subjects = layCSDL('Subjects');
    let users = layCSDL('Users');
    let container = document.getElementById('adminClassList'); 
    
    if (!container) return;
    
    let htmlResult = '';
    subjects.forEach(sub => {
        let classesOfSubject = classes.filter(c => c.subjectId === sub.id); 
        if (classesOfSubject.length === 0) return;
        
        htmlResult += `<h3 class="border-bottom mt-20 mb-10 text-primary font-bold">${sub.name}</h3>`;

        classesOfSubject.forEach(c => {
            let tcName = users.find(u => u.id === c.teacherId)?.name || 'Unknown';
            let displayClassName = layTenLopHienThi(c.id);
            let timeStr = layThongTinTietHoc(c.startPeriod, c.endPeriod);
            
            htmlResult += `
                <div class="border-box border-left-dark flex-row align-center justify-between mb-10 cursor-pointer" onclick="moChiTietLopDieuPhoi('${c.id}', '${displayClassName}')">
                    <div>
                        <h4 class="mb-10 text-primary">Tên lớp: ${displayClassName}</h4>
                        <p class="text-sm text-muted mb-10">GV: <span class="font-bold">${tcName}</span> | P.${c.room}</p>
                        <p class="text-sm">Lịch: ${c.dayOfWeek} (${timeStr})</p>
                        <p class="font-bold text-success mt-10">${c.enrolledStudents.length} SV | ${c.sessions.length} Buổi</p>
                    </div>
                    <div class="flex-row">
                        <button class="action-btn" onclick="event.stopPropagation(); suaThongTinLopDieuPhoi('${c.id}')">Sửa</button>
                        <button class="btn-danger" onclick="event.stopPropagation(); xoaLopDieuPhoi('${c.id}')">Xóa</button>
                    </div>
                </div>
            `;
        }); 
    }); 
    
    container.innerHTML = htmlResult || '<p style="padding: 20px;">Hệ thống chưa được thiết lập lớp học nào.</p>';
}

function suaThongTinLopDieuPhoi(idLop) {
    let targetClass = layCSDL('Classes').find(c => c.id === idLop); 
    if (!targetClass) return;
    
    let form = document.forms['editClassForm'];
    form.elements['classId'].value = targetClass.id;
    form.elements['subId'].value = targetClass.subjectId;
    form.elements['teacherId'].value = targetClass.teacherId;
    form.elements['room'].value = targetClass.room;
    form.elements['dayOfWeek'].value = targetClass.dayOfWeek;
    form.elements['startDate'].value = targetClass.startDate || '';
    form.elements['endDate'].value = targetClass.endDate || '';
    form.elements['startPeriod'].value = targetClass.startPeriod;
    form.elements['endPeriod'].value = targetClass.endPeriod;
    
    moHopThoai('admEditClassModal');
}

function xoaLopDieuPhoi(idLop) {
    if (confirm("Chắc chắn muốn xóa lớp học này cùng toàn bộ thông tin điểm và điểm danh?")) { 
        let classes = layCSDL('Classes').filter(c => c.id !== idLop);
        ghiCSDL('Classes', classes); 
        hienThiDanhSachLopDieuPhoi(); 
        let user = layCSDL('currentUser');
        hienThiBaoCaoGiangVien(user);
    } 
}

function moChiTietLopDieuPhoi(idLop, tenHienThi) {
    document.getElementById('admin-class-detail').dataset.classId = idLop; 
    document.getElementById('admDetailClassName').textContent = `Chi tiết điều phối: ${tenHienThi}`;
    
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
    document.getElementById('admin-class-detail').style.display = 'block';
    
    document.querySelector('[data-target="adm-sub-students"]').click();
    hienThiDanhSachSinhVienDieuPhoi();
}

function hienThiDanhSachSinhVienDieuPhoi() {
    let idLop = document.getElementById('admin-class-detail').dataset.classId;
    let lop = layCSDL('Classes').find(c => c.id === idLop);
    let users = layCSDL('Users');
    
    let htmlContent = lop.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (stu) {
            return `
                <tr>
                    <td>${stu.id}</td>
                    <td><strong class="text-primary">${stu.name}</strong></td>
                    <td><button class="btn-danger" onclick="xoaSinhVienKhoiLopDieuPhoi('${stu.id}')">Gỡ</button></td>
                </tr>
            `;
        }
        return '';
    }).join('');
    
    let tbody = document.getElementById('admStudentList');
    if (tbody) tbody.innerHTML = htmlContent || '<tr><td colspan="3">Lớp học trống sinh viên.</td></tr>';
}

function themSinhVienVaoLopDieuPhoi() {
    let idLop = document.getElementById('admin-class-detail').dataset.classId;
    let idSVDien = document.getElementById('addStuId').value.trim();
    let users = layCSDL('Users');
    
    let checkSV = users.some(u => u.id === idSVDien && u.role === 'sinh-vien');
    if (!checkSV) { 
        alert("Mã sinh viên này không tồn tại trên hệ thống!"); 
        return; 
    }
    
    capNhatLopCSDL(idLop, function(c) { 
        if (c.enrolledStudents.includes(idSVDien)) {
            alert("Sinh viên này đã học trong lớp!");
        } else {
            c.enrolledStudents.push(idSVDien); 
            c.grades[idSVDien] = { cc: null, gk: null, ck: null };
            alert("Thêm sinh viên thành công!");
        }
    });
    
    document.getElementById('addStuId').value = ''; 
    hienThiDanhSachSinhVienDieuPhoi();
}

function xoaSinhVienKhoiLopDieuPhoi(idSinhVien) {
    if (confirm(`Xác nhận xóa sinh viên ${idSinhVien} khỏi lớp học?`)) {
        let idLop = document.getElementById('admin-class-detail').dataset.classId;
        capNhatLopCSDL(idLop, function(c) {
            c.enrolledStudents = c.enrolledStudents.filter(id => id !== idSinhVien);
            delete c.grades[idSinhVien];
        });
        hienThiDanhSachSinhVienDieuPhoi();
    }
}

function hienThiDanhSachBuoiHocDieuPhoi() {
    let idLop = document.getElementById('admin-class-detail').dataset.classId;
    let lop = layCSDL('Classes').find(c => c.id === idLop);
    
    let htmlContent = lop.sessions.map(s => {
        return `
            <tr>
                <td>${s.date}</td>
                <td>${layThongTinTietHoc(s.startPeriod, s.endPeriod)}</td>
                <td>
                    <button class="action-btn" onclick="suaBuoiHocDieuPhoi('${s.id}')">Sửa</button> 
                    <button class="btn-danger" onclick="xoaBuoiHocDieuPhoi('${s.id}')">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
    
    let tbody = document.getElementById('admSessionList');
    if (tbody) tbody.innerHTML = htmlContent || '<tr><td colspan="3">Chưa có buổi học nào được tạo.</td></tr>';
}

function suaBuoiHocDieuPhoi(idBuoi) {
    let idLop = document.getElementById('admin-class-detail').dataset.classId;
    let lop = layCSDL('Classes').find(c => c.id === idLop);
    let buoi = lop.sessions.find(s => s.id === idBuoi);
    
    let form = document.forms['editSessionForm'];
    form.elements['sessionId'].value = buoi.id;
    form.elements['sesDate'].value = buoi.date;
    form.elements['sesStart'].value = buoi.startPeriod;
    form.elements['sesEnd'].value = buoi.endPeriod;
    
    moHopThoai('admEditSessionModal');
}

function xoaBuoiHocDieuPhoi(idBuoi) {
    if (confirm("Chắc chắn muốn xóa buổi học này?")) {
        let idLop = document.getElementById('admin-class-detail').dataset.classId;
        capNhatLopCSDL(idLop, function(c) {
            c.sessions = c.sessions.filter(s => s.id !== idBuoi);
        });
        hienThiDanhSachBuoiHocDieuPhoi(); 
    }
}

function hienThiNutBatTatCongDangKy() {
    let vungNut = document.getElementById('adminRegToggleContainer');
    if (!vungNut) return;
    
    let dangMo = JSON.parse(localStorage.getItem('RegistrationOpen'));
    if (dangMo) {
        vungNut.innerHTML = `<button class="btn-danger" style="width: auto;" onclick="thayDoiTrangThaiCongDangKy(false)">Cổng tín chỉ: ĐANG MỞ - Bấm để KHÓA</button>`;
    } else {
        vungNut.innerHTML = `<button class="btn-primary" style="width: auto;" onclick="thayDoiTrangThaiCongDangKy(true)">Cổng tín chỉ: ĐANG KHÓA - Bấm để MỞ</button>`;
    }
}

function thayDoiTrangThaiCongDangKy(trangThai) {
    localStorage.setItem('RegistrationOpen', JSON.stringify(trangThai));
    hienThiNutBatTatCongDangKy();
}

function khoiTaoLangNgheSuKienDieuPhoi() {
    // Biểu mẫu tạo lớp học
    let formTaoLop = document.getElementById('adminCreateClassForm');
    if (formTaoLop) {
        formTaoLop.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let formData = new FormData(e.target);
            let subId = formData.get('subId');
            let teacherId = formData.get('teacherId');
            let room = formData.get('room');
            let dayOfWeek = formData.get('dayOfWeek');
            let startDate = formData.get('startDate');
            let endDate = formData.get('endDate');
            let startPeriod = parseInt(formData.get('startPeriod'));
            let endPeriod = parseInt(formData.get('endPeriod'));

            if (startPeriod > endPeriod) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }
            
            let classes = layCSDL('Classes');
            let subjects = layCSDL('Subjects');
            let subjectAbbr = subjects.find(s => s.id === subId)?.abbr || 'CLASS';
            
            let newClassId = subjectAbbr + '_' + Date.now();
            let dsNgay = taoDanhSachNgayHoc(startDate, endDate, dayOfWeek);
            
            let sessions = dsNgay.map(dateStr => {
                return { 
                    id: 'SES_' + Date.now() + Math.random(), 
                    date: dateStr, 
                    startPeriod: startPeriod, 
                    endPeriod: endPeriod, 
                    attendance: {} 
                };
            });
            
            classes.push({
                id: newClassId, 
                subjectId: subId, 
                teacherId: teacherId, 
                room: room, 
                dayOfWeek: dayOfWeek, 
                startDate: startDate, 
                endDate: endDate, 
                startPeriod: startPeriod, 
                endPeriod: endPeriod, 
                enrolledStudents: [], 
                sessions: sessions, 
                grades: {}
            });
            
            ghiCSDL('Classes', classes); 
            alert("Khởi tạo lớp học mới chuyên ngành CNTT thành công!"); 
            this.reset(); 
            hienThiDanhSachLopDieuPhoi();
            
            let user = layCSDL('currentUser');
            hienThiBaoCaoGiangVien(user);
        });
    }

    // Biểu mẫu sửa lớp học
    let formSuaLop = document.getElementById('editClassForm');
    if (formSuaLop) {
        formSuaLop.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let formData = new FormData(e.target);
            let classId = formData.get('classId');
            let startPeriod = parseInt(formData.get('startPeriod'));
            let endPeriod = parseInt(formData.get('endPeriod'));

            if (startPeriod > endPeriod) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }

            let classes = layCSDL('Classes');
            let targetClass = classes.find(c => c.id === classId);
            
            let biThayDoiLich = targetClass.dayOfWeek !== formData.get('dayOfWeek') || 
                                targetClass.startDate !== formData.get('startDate') || 
                                targetClass.endDate !== formData.get('endDate') || 
                                targetClass.startPeriod !== startPeriod || 
                                targetClass.endPeriod !== endPeriod;

            capNhatLopCSDL(classId, function(c) {
                c.subjectId = formData.get('subId'); 
                c.teacherId = formData.get('teacherId'); 
                c.room = formData.get('room'); 
                
                if (biThayDoiLich) {
                    if (confirm("Thay đổi thời gian sẽ tạo lại lịch và xóa toàn bộ điểm danh cũ. Bạn đồng ý?")) {
                        c.dayOfWeek = formData.get('dayOfWeek'); 
                        c.startDate = formData.get('startDate'); 
                        c.endDate = formData.get('endDate'); 
                        c.startPeriod = startPeriod; 
                        c.endPeriod = endPeriod;
                        
                        let dsNgay = taoDanhSachNgayHoc(c.startDate, c.endDate, c.dayOfWeek);
                        c.sessions = dsNgay.map(dateStr => {
                            return { 
                                id: 'SES_' + Date.now() + Math.random(), 
                                date: dateStr, 
                                startPeriod: startPeriod, 
                                endPeriod: endPeriod, 
                                attendance: {} 
                            };
                        });
                    }
                }
            });
            
            alert("Đã cập nhật thông tin lớp học!"); 
            dongHopThoai('admEditClassModal'); 
            this.reset(); 
            hienThiDanhSachLopDieuPhoi();
            
            let user = layCSDL('currentUser');
            hienThiBaoCaoGiangVien(user);
        });
    }

    // Biểu mẫu tạo buổi học bổ sung
    let formTaoBuoi = document.getElementById('adminCreateSessionForm');
    if (formTaoBuoi) {
        formTaoBuoi.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let idLop = document.getElementById('admin-class-detail').dataset.classId;
            let formData = new FormData(e.target);
            let start = parseInt(formData.get('sesStart'));
            let end = parseInt(formData.get('sesEnd'));
            
            if (start > end) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }
            
            capNhatLopCSDL(idLop, function(c) { 
                c.sessions.push({ 
                    id: 'SES_' + Date.now(), 
                    date: formData.get('sesDate'), 
                    startPeriod: start, 
                    endPeriod: end, 
                    attendance: {} 
                });
            });
            
            this.reset(); 
            hienThiDanhSachBuoiHocDieuPhoi();
        });
    }

    // Biểu mẫu sửa buổi học bổ sung
    let formSuaBuoi = document.getElementById('editSessionForm');
    if (formSuaBuoi) {
        formSuaBuoi.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let idLop = document.getElementById('admin-class-detail').dataset.classId;
            let formData = new FormData(e.target);
            let idBuoi = formData.get('sessionId');
            let start = parseInt(formData.get('sesStart'));
            let end = parseInt(formData.get('sesEnd'));
            
            if (start > end) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }
            
            capNhatLopCSDL(idLop, function(c) { 
                let buoi = c.sessions.find(s => s.id === idBuoi); 
                if (buoi) {
                    buoi.date = formData.get('sesDate');
                    buoi.startPeriod = start;
                    buoi.endPeriod = end;
                } 
            });
            
            alert("Đã cập nhật thông tin buổi học!"); 
            dongHopThoai('admEditSessionModal'); 
            this.reset(); 
            hienThiDanhSachBuoiHocDieuPhoi();
        });
    }
}

// --------------------------------------------------------------------------
// 7. KHỞI CHẠY KHẨN CẤP KHI LOAD TRANG (BOOTSTRAP PROCESS)
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    let user = layCSDL('currentUser');
    let duongDanTrang = window.location.pathname;

    // Phân trang Auth (Trang index)
    if (duongDanTrang.includes('index.html') || duongDanTrang.endsWith('/') || duongDanTrang === '') {
        if (user) {
            if (user.role === 'sinh-vien' || user.role === 'giang-vien') {
                chuyenHuongTrangQuanLy(user.role);
            } else {
                localStorage.removeItem('currentUser');
            }
        }
    }
    
    // Phân trang Sinh Viên
    if (duongDanTrang.includes('student-dashboard.html')) {
        if (!user || user.role !== 'sinh-vien') {
            window.location.href = 'index.html';
            return;
        }
        
        // Điền tên lên giao diện
        document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
        document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
        
        khoiTaoGiaoDienChung();
        khoiTaoHoSoCaNhan(user);
        capNhatHuyHieuThongBao(user);

        hienThiBaoCaoHocTapSinhVien(user); 
        hienThiTabDangKyTinChi(user);
        hienThiThongBaoSinhVien(user);
    }

    // Phân trang Giảng Viên
    if (duongDanTrang.includes('teacher-dashboard.html')) {
        if (!user || user.role !== 'giang-vien') {
            window.location.href = 'index.html';
            return;
        }

        // Điền tên lên giao diện
        document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
        document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
        
        khoiTaoGiaoDienChung();
        khoiTaoHoSoCaNhan(user);
        capNhatHuyHieuThongBao(user);

        hienThiBaoCaoGiangVien(user);
        hienThiThongBaoGiangVien(user);
    }
});
