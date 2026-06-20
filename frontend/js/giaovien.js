// ==========================================================================
// HỆ THỐNG QUẢN LÝ HỌC TẬP EDU REPORT (TEACHERS APPS ENGINE - GIAO DIỆN GIẢNG VIÊN)
// TẤT CẢ CÁC HÀM ĐƯỢC CHÚ THÍCH CHI TIẾT TỪNG DÒNG TIẾNG VIỆT CÓ DẤU
// ==========================================================================

// --------------------------------------------------------------------------
// 1. QUẢN LÝ LỚP DẠY & LỊCH GIẢNG DẠY (TEACHING CLASSES & SCHEDULE)
// --------------------------------------------------------------------------

// Hàm hiển thị báo cáo chung giảng viên, danh sách lớp phụ trách và lịch giảng dạy
function hienThiBaoCaoGiangVien(giangVien) {
    let lopHocs = layCSDL('Classes');
    let monHocs = layCSDL('Subjects');
    
    // Lọc ra danh sách lớp học mà giảng viên này được phân công dạy
    let lopCuaToi = lopHocs.filter(cls => cls.teacherId === giangVien.id);
    let homNay = new Date().toLocaleDateString('en-CA');
    
    let tongSoSinhVienLop = 0;
    let theLopHtml = '';
    
    // Khởi tạo thời khóa biểu dạy trống các thứ trong tuần
    let lichDayTuan = { 
        'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] 
    };

    // Đổ danh sách lớp dạy vào bộ chọn target gửi thông báo của giảng viên
    let selectNotifTarget = document.getElementById('tcNotifTarget');
    if (selectNotifTarget) {
        selectNotifTarget.innerHTML = lopCuaToi.map(c => `<option value="${c.id}">Lớp ${layTenLopHienThi(c.id)}</option>`).join('');
    }

    // Duyệt qua từng lớp học để tích lũy dữ liệu lịch dạy
    lopCuaToi.forEach(c => {
        let mon = monHocs.find(s => s.id === c.subjectId);
        let tenMon = mon ? mon.name : 'Môn học';
        // Cộng dồn số sinh viên ghi danh trong các lớp
        tongSoSinhVienLop += c.enrolledStudents.length;
        
        // Đẩy lịch dạy của lớp này vào thứ học phần tương ứng
        lichDayTuan[c.dayOfWeek].push({ 
            subName: tenMon, 
            room: c.room, 
            timeStr: layThongTinTietHoc(c.startPeriod, c.endPeriod) 
        });
    });

    // Gom nhóm và hiển thị tiến trình của từng lớp theo môn học
    monHocs.forEach(mon => {
        let lopCuaMon = lopCuaToi.filter(c => c.subjectId === mon.id);
        if (lopCuaMon.length === 0) return;
        
        theLopHtml += `<h3 class="border-bottom mt-20 mb-10 text-primary font-bold">${mon.name}</h3>`;

        lopCuaMon.forEach(c => {
            let tongBuoi = c.sessions.length;
            let buoiDaQua = c.sessions.filter(s => s.date <= homNay).length;
            let phanTram = tongBuoi > 0 ? Math.round((buoiDaQua / tongBuoi) * 100) : 0;
            let tenHienThi = layTenLopHienThi(c.id);

            // Tạo mã HTML card lớp phụ trách kèm tiến trình lớp học
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

    // Vẽ giao diện thời khóa biểu lịch giảng dạy trong tuần
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

    // Hiển thị tổng số lớp lên thẻ thống kê nhanh
    let elTotalLop = document.getElementById('tc-total-classes');
    if (elTotalLop) elTotalLop.textContent = lopCuaToi.length;
    
    // Hiển thị tổng số sinh viên lên thẻ thống kê nhanh
    let elTotalSV = document.getElementById('tc-total-students');
    if (elTotalSV) elTotalSV.textContent = tongSoSinhVienLop;
    
    // Đổ danh sách lớp dạy vào container giao diện
    let elClassList = document.getElementById('teacherClassList');
    if (elClassList) elClassList.innerHTML = theLopHtml || '<p style="padding: 20px;">Giảng viên chưa được phân công lớp dạy nào.</p>';
    
    // Đổ thời khóa biểu dạy vào container giao diện
    let elLich = document.getElementById('tcWeeklyScheduleContainer');
    if (elLich) elLich.innerHTML = htmlLichDay || '<p>Trống lịch giảng dạy tuần này.</p>';
}

// --------------------------------------------------------------------------
// 2. NHẬP ĐIỂM SỐ & ĐIỂM DANH CHUYÊN CẦN (GRADES & ATTENDANCE)
// --------------------------------------------------------------------------

// Hàm mở xem chi tiết lớp học giảng dạy được chọn để nhập điểm/điểm danh
function moLopPhuTrachGiangVien(idLop, tenHienThi) {
    let vungChiTiet = document.getElementById('class-detail-tab');
    vungChiTiet.dataset.classId = idLop; 
    document.getElementById('teacherDetailClassName').textContent = `${tenHienThi} (Mã HT: ${idLop})`;
    
    // Ẩn các tab chính khác và mở tab chi tiết lớp học
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
    vungChiTiet.style.display = 'block';
    
    // Tự động kích hoạt sub-tab nhập điểm của lớp học phần
    document.querySelector('[data-target="tc-sub-grades"]').click();
    hienThiDiemHocSinhGiangVien();
}

// Hàm hiển thị danh sách sinh viên lớp học để giảng viên nhập điểm
function hienThiDiemHocSinhGiangVien() {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let lop = layCSDL('Classes').find(cls => cls.id === idLop);
    let users = layCSDL('Users');
    
    // Bản đồ HTML cho từng hàng sinh viên kèm các ô input điểm
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

// Hàm lưu điểm số của một sinh viên cụ thể trong lớp
function luuDiemHocSinhGiangVien(idSinhVien) {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    
    // Lấy giá trị điểm nhập từ giao diện
    let ccInp = document.getElementById('cc_' + idSinhVien).value;
    let gkInp = document.getElementById('gk_' + idSinhVien).value;
    let ckInp = document.getElementById('ck_' + idSinhVien).value;
    
    let valCC = ccInp === "" ? null : parseFloat(ccInp);
    let valGK = gkInp === "" ? null : parseFloat(gkInp);
    let valCK = ckInp === "" ? null : parseFloat(ckInp);
    
    // Ràng buộc khoảng điểm từ 0 đến 10
    if ((valCC !== null && (valCC < 0 || valCC > 10)) || 
        (valGK !== null && (valGK < 0 || valGK > 10)) || 
        (valCK !== null && (valCK < 0 || valCK > 10))) { 
        alert("Điểm số phải nằm trong khoảng từ 0 đến 10!"); 
        return; 
    }
    
    // Thực hiện ghi nhận cập nhật điểm số vào CSDL Local
    capNhatLopCSDL(idLop, function(c) {
        if (!c.grades[idSinhVien]) c.grades[idSinhVien] = {};
        c.grades[idSinhVien] = { cc: valCC, gk: valGK, ck: valCK };
    });
    
    // Thông báo lưu thành công và cập nhật lại điểm hiển thị
    alert("Đã lưu điểm cho sinh viên!"); 
    hienThiDiemHocSinhGiangVien();
}

// Hàm hiển thị danh sách buổi học của lớp học phần
function hienThiBuoiHocGiangVien() {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let lop = layCSDL('Classes').find(cls => cls.id === idLop);
    
    // Bản đồ HTML danh sách các buổi học kèm nút thao tác điểm danh
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

// Hàm mở modal popup điểm danh cho một buổi học cụ thể
function moHopThoaiDiemDanhGiangVien(idBuoiHoc) {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let lop = layCSDL('Classes').find(cls => cls.id === idLop);
    let buoi = lop.sessions.find(x => x.id === idBuoiHoc);
    let users = layCSDL('Users');
    
    // Gán mã buổi học vào thuộc tính dataset của modal
    document.getElementById('tcAttModal').dataset.sessionId = idBuoiHoc;
    document.getElementById('tcAttSessionInfo').textContent = `Điểm danh chuyên cần (Ngày ${buoi.date})`;
    
    // Duyệt danh sách sinh viên lớp để hiển thị các nút chọn điểm danh (Có mặt, Muộn, Vắng)
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
    if (tbody) tbody.innerHTML = htmlDong || '<tr><td colspan="2">Lớp này trống sinh viên.</td></tr>';
    // Hiển thị modal điểm danh
    moHopThoai('tcAttModal');
}

// Hàm lưu trạng thái điểm danh buổi học
function luuDiemDanhGiangVien() {
    let idLop = document.getElementById('class-detail-tab').dataset.classId;
    let idBuoiHoc = document.getElementById('tcAttModal').dataset.sessionId;

    // Quét toàn bộ trạng thái radio button được chọn để lưu trữ
    capNhatLopCSDL(idLop, function(c) {
        let buoi = c.sessions.find(x => x.id === idBuoiHoc);
        c.enrolledStudents.forEach(studentId => { 
            let radioInp = document.querySelector(`input[name="att_${studentId}"]:checked`); 
            if (radioInp) {
                buoi.attendance[studentId] = radioInp.value; 
            }
        });
    });
    
    // Đóng modal điểm danh và làm mới danh sách hiển thị
    alert("Đã lưu danh sách điểm danh thành công!"); 
    dongHopThoai('tcAttModal');
    hienThiBuoiHocGiangVien();
}

// --------------------------------------------------------------------------
// 3. QUẢN LÝ THÔNG BÁO GIẢNG VIÊN (TEACHER NOTIFICATION SYSTEM)
// --------------------------------------------------------------------------

// Hàm hiển thị hộp thư đến nhận được và lịch sử thông báo đã gửi của giảng viên
function hienThiThongBaoGiangVien(giangVien) {
    if (!giangVien) giangVien = layCSDL('currentUser');
    hienThiHopThuDenGiangVien(giangVien);
    hienThiLichSuGuiGiangVien(giangVien);
}

// Hàm hiển thị các thông báo mà tất cả giảng viên nhận được từ hệ thống
function hienThiHopThuDenGiangVien(giangVien) {
    if (!giangVien) giangVien = layCSDL('currentUser');
    let thongBao = layCSDL('Notifications');
    let tbGiangVien = thongBao.filter(n => n.target === 'tat-ca-giang-vien');
    
    // Sắp xếp các thông báo theo ID số (timestamp) giảm dần bằng hàm dùng chung
    tbGiangVien = sapXepThongBaoMoiNhat(tbGiangVien);
    
    hienThiTheThongBaoChung('teacherInboxList', tbGiangVien, giangVien);
}

// Hàm hiển thị danh sách các thông báo do giảng viên hiện tại tự soạn thảo và gửi đi
function hienThiLichSuGuiGiangVien(giangVien) {
    if (!giangVien) giangVien = layCSDL('currentUser');
    // Lọc các thông báo có tên người gửi khớp với giảng viên hiện tại
    let thongBao = layCSDL('Notifications').filter(n => n.senderName === giangVien.name);
    
    // Sắp xếp các thông báo theo ID số (timestamp) giảm dần bằng hàm dùng chung
    thongBao = sapXepThongBaoMoiNhat(thongBao);
    
    // Ánh xạ thành HTML các hàng bảng lịch sử gửi thông báo
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

// Đăng ký sự kiện nộp form để giảng viên gửi một thông báo mới tới lớp phụ trách
let formGuiTB = document.getElementById('teacherNotifForm');
if (formGuiTB) {
    formGuiTB.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let user = layCSDL('currentUser');
        let targetLop = formGuiTB.elements['target'].value;
        let noiDung = formGuiTB.elements['text'].value;
        
        // Tạo đối tượng thông báo mới
        let newNotif = {
            id: 'NOTIF_' + Date.now(),
            senderName: user.name,
            target: targetLop,
            text: noiDung,
            date: new Date().toLocaleDateString('en-CA')
        };
        
        try {
            // Gửi thông báo trực tuyến lên MongoDB Atlas qua API
            let response = await fetch(`${API_BASE}/api/thong-bao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newNotif)
            });
            let data = await response.json();
            
            if (response.ok && data.success) {
                let notifs = layCSDL('Notifications');
                notifs.unshift(newNotif);
                ghiCSDL('Notifications', notifs);
                
                alert("Gửi thông báo lớp thành công!");
                formGuiTB.reset();
                hienThiLichSuGuiGiangVien(user);
            } else {
                alert(data.message || "Gửi thông báo thất bại!");
            }
        } catch (error) {
            // Lưu dự phòng ngoại tuyến
            let notifs = layCSDL('Notifications');
            notifs.unshift(newNotif);
            ghiCSDL('Notifications', notifs);
            
            alert("Gửi thông báo lớp thành công!");
            formGuiTB.reset();
            hienThiLichSuGuiGiangVien(user);
        }
    });
}

// Hàm đánh dấu toàn bộ thông báo trong hộp thư đến giảng viên là đã đọc
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

        // Đồng bộ trạng thái lên database MongoDB Atlas để lưu giữ vĩnh viễn
        fetch(`${API_BASE}/api/nguoi-dung/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readNotifs: user.readNotifs })
        }).catch(err => console.warn("Lỗi đồng bộ trạng thái đọc lên server:", err));

        capNhatHuyHieuThongBao(user);
        hienThiHopThuDenGiangVien(user);
    }
}

// Hàm mở xem chi tiết thông báo đã gửi để giảng viên thực hiện sửa đổi hoặc xóa bỏ
function moQuanLyThongBaoGiangVien(idThongBao) {
    let thongBao = layCSDL('Notifications');
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;

    document.getElementById('readNotifTitle').textContent = tb.senderName;
    document.getElementById('readNotifDate').textContent = tb.date;
    document.getElementById('readNotifContent').innerHTML = dinhDangThongBao(tb.text);

    // Điền mã nút bấm cập nhật hoặc xóa thông báo
    let vungHanhDong = document.getElementById('readNotifActions');
    if (vungHanhDong) {
        vungHanhDong.innerHTML = `
            <button class="action-btn" onclick="suaThongBaoGiangVien('${tb.id}')">Chỉnh sửa</button>
            <button class="btn-danger" onclick="xoaThongBaoGiangVien('${tb.id}')">Xóa thông báo</button>
        `;
    }
    moHopThoai('readNotifModal');
}

// Hàm xóa thông báo giảng viên đã gửi
function xoaThongBaoGiangVien(idThongBao) {
    hienThiConfirmTuyBien("Bạn có chắc chắn muốn xóa thông báo này?", async () => {
        try {
            let response = await fetch(`${API_BASE}/api/thong-bao/${idThongBao}`, { method: 'DELETE' });
            let data = await response.json();
            
            if (response.ok && data.success) {
                let thongBao = layCSDL('Notifications').filter(n => n.id !== idThongBao);
                ghiCSDL('Notifications', thongBao);
                alert("Xóa thông báo thành công!");
                dongHopThoai('readNotifModal');
                hienThiLichSuGuiGiangVien();
            } else {
                alert(data.message || "Xóa thất bại!");
            }
        } catch (error) {
            let thongBao = layCSDL('Notifications').filter(n => n.id !== idThongBao);
            ghiCSDL('Notifications', thongBao);
            alert("Xóa thông báo thành công!");
            dongHopThoai('readNotifModal');
            hienThiLichSuGuiGiangVien();
        }
    });
}

// Hàm mở chế độ chỉnh sửa trực tiếp nội dung thông báo ngay trên modal
function suaThongBaoGiangVien(idThongBao) {
    let thongBao = layCSDL('Notifications');
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;

    let contentDiv = document.getElementById('readNotifContent');
    // Thay đổi nội dung hiển thị sang ô nhập textarea để chỉnh sửa
    contentDiv.innerHTML = `
        <textarea id="editNotifTextarea" rows="6" class="input-group" style="width:100%; border:1px solid var(--border-color); border-radius:6px; padding:10px;">${tb.text}</textarea>
    `;

    // Thay đổi các nút bấm hành động sang nút cập nhật thông báo
    let actions = document.getElementById('readNotifActions');
    if (actions) {
        actions.innerHTML = `
            <button class="btn-primary" style="width: auto;" onclick="luuThongBaoGiangVien('${tb.id}')">Cập nhật</button>
        `;
    }
}

// Hàm lưu lại nội dung thông báo giảng viên vừa sửa đổi đồng bộ lên server API MongoDB Atlas
async function luuThongBaoGiangVien(idThongBao) {
    let vanBanMoi = document.getElementById('editNotifTextarea').value.trim();
    if (!vanBanMoi) {
        alert("Nội dung thông báo không được bỏ trống!");
        return;
    }

    try {
        // Gửi yêu cầu PUT cập nhật thông báo lên API server
        let response = await fetch(`${API_BASE}/api/thong-bao/${idThongBao}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: vanBanMoi })
        });
        let data = await response.json();

        if (response.ok && data.success) {
            let thongBao = layCSDL('Notifications');
            let tb = thongBao.find(x => x.id === idThongBao);
            if (tb) {
                tb.text = vanBanMoi;
                ghiCSDL('Notifications', thongBao);
            }
            alert("Cập nhật thông báo thành công!");
        } else {
            alert(data.message || "Cập nhật thông báo thất bại!");
        }
    } catch (error) {
        // Lưu ngoại tuyến nếu kết nối server lỗi
        let thongBao = layCSDL('Notifications');
        let tb = thongBao.find(x => x.id === idThongBao);
        if (tb) {
            tb.text = vanBanMoi;
            ghiCSDL('Notifications', thongBao);
        }
        alert("Cập nhật thông báo thành công! (Lưu ngoại tuyến)");
    }

    // Quay lại hiển thị nội dung thông báo chi tiết
    document.getElementById('readNotifContent').innerHTML = dinhDangThongBao(vanBanMoi);
    let actions = document.getElementById('readNotifActions');
    if (actions) {
        actions.innerHTML = `
            <button class="action-btn" onclick="suaThongBaoGiangVien('${idThongBao}')">Chỉnh sửa</button>
            <button class="btn-danger" onclick="xoaThongBaoGiangVien('${idThongBao}')">Xóa thông báo</button>
        `;
    }
    hienThiLichSuGuiGiangVien();
}

// --------------------------------------------------------------------------
// 4. QUẢN LÝ TÀI LIỆU & BÀI TẬP LỚP HỌC (TEACHER MATERIALS & ASSIGNMENTS)
// --------------------------------------------------------------------------

// Hàm hiển thị danh sách tài liệu và bài tập của giảng viên trong lớp học phần
function hienThiTaiLieuGiangVien() {
    let classDetailTab = document.getElementById('class-detail-tab');
    let classId = classDetailTab ? classDetailTab.dataset.classId : null;
    if (!classId) return;

    // Lấy danh sách tài liệu học tập từ Local CSDL
    let materials = layCSDL('Materials');
    // Lọc ra các tài liệu thuộc về mã lớp học phần hiện tại
    let materialsOfClass = materials.filter(m => m.classId === classId);

    // Bản đồ nhãn hiển thị loại tài liệu
    let typeMap = {
        'lecture': '<span class="text-primary font-bold">Bài giảng</span>',
        'assignment': '<span class="text-warning font-bold">Bài tập</span>',
        'other': '<span class="text-muted">Khác</span>'
    };

    // Tạo mã HTML hàng bảng danh sách tài liệu
    let html = materialsOfClass.map(m => {
        let viewSubsBtn = '';
        if (m.type === 'assignment') {
            // Hiển thị thêm nút Xem bài nộp nếu là bài tập giao về nhà
            viewSubsBtn = `<button class="action-btn" style="padding: 4px 8px; font-size:12px; width:auto; margin-right: 5px;" onclick="xemDanhSachNopBai('${m.id}')">Xem bài nộp</button>`;
        }
        
        let fileLinkHtml = '';
        if (m.fileName) {
            fileLinkHtml = `<div class="mt-5"><span class="text-sm font-bold text-success">Đính kèm: </span><a href="#" onclick="event.preventDefault(); taiFileDinhKem('${m.link.replace(/'/g, "\\'")}', '${m.fileName.replace(/'/g, "\\'")}')" class="text-primary font-bold" style="text-decoration: underline;">${m.fileName}</a></div>`;
        }
        
        let columnLink = m.fileName 
            ? `<a href="#" onclick="event.preventDefault(); taiFileDinhKem('${m.link.replace(/'/g, "\\'")}', '${m.fileName.replace(/'/g, "\\'")}')" class="text-primary font-bold" style="text-decoration: underline;">Tải file</a>` 
            : `<a href="${m.link}" target="_blank" class="text-primary font-bold" style="text-decoration: underline;">Xem liên kết</a>`;

        return `
            <tr>
                <td>${m.date}</td>
                <td>${typeMap[m.type] || m.type}</td>
                <td>
                    <strong>${m.title}</strong>
                    ${m.description ? `<p class="text-sm text-muted mt-5" style="white-space: pre-line;">${m.description}</p>` : ''}
                    ${fileLinkHtml}
                </td>
                <td>${columnLink}</td>
                <td>
                    ${viewSubsBtn}
                    <button class="btn-danger" style="padding: 4px 8px; font-size:12px; width:auto;" onclick="xoaTaiLieuGiangVien('${m.id}')">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');

    let tbody = document.getElementById('tcMaterialList');
    if (tbody) {
        tbody.innerHTML = html || '<tr><td colspan="5" class="text-center">Chưa có tài liệu hoặc bài tập nào được đăng lên lớp này.</td></tr>';
    }
}

// Hàm xóa tài liệu/bài tập của giảng viên đã tải lên lớp qua API và cập nhật Local CSDL
function xoaTaiLieuGiangVien(idTaiLieu) {
    hienThiConfirmTuyBien("Bạn có chắc chắn muốn xóa tài liệu này khỏi lớp học?", async () => {
        try {
            // Gửi yêu cầu xóa tài liệu lên API backend
            let response = await fetch(`${API_BASE}/api/tai-lieu/${idTaiLieu}`, {
                method: 'DELETE'
            });
            let data = await response.json();
            
            if (response.ok && data.success) {
                let materials = layCSDL('Materials').filter(m => m.id !== idTaiLieu);
                ghiCSDL('Materials', materials);
                alert("Xóa tài liệu thành công!");
                hienThiTaiLieuGiangVien();
            } else {
                alert(data.message || "Xóa tài liệu thất bại!");
            }
        } catch (error) {
            // Tự động xử lý ngoại tuyến nếu mất kết nối
            let materials = layCSDL('Materials').filter(m => m.id !== idTaiLieu);
            ghiCSDL('Materials', materials);
            alert("Xóa tài liệu thành công!");
            hienThiTaiLieuGiangVien();
        }
    });
}

// Đăng ký sự kiện nộp form tải tài liệu/bài tập của giảng viên
let formTaiLieu = document.getElementById('tcCreateMaterialForm');
if (formTaiLieu) {
    // Đăng ký sự kiện thay đổi file để cập nhật nhãn trạng thái file đính kèm
    let fileInp = document.getElementById('tcMaterialFile');
    let statusText = document.getElementById('fileStatusText');
    if (fileInp && statusText) {
        fileInp.addEventListener('change', () => {
            if (fileInp.files.length > 0) {
                statusText.textContent = `Đã chọn file: ${fileInp.files[0].name}`;
            } else {
                statusText.textContent = 'Chưa có file nào được chọn';
            }
        });
    }

    formTaiLieu.addEventListener('submit', async function(e) {
        e.preventDefault();
        let classDetailTab = document.getElementById('class-detail-tab');
        let classId = classDetailTab ? classDetailTab.dataset.classId : null;
        if (!classId) return;

        // Lấy thông tin giảng viên đang đăng nhập từ LocalStorage (dùng để tạo thông báo giảng viên gửi)
        let user = layCSDL('currentUser');

        let title = formTaiLieu.elements['title'].value.trim();
        let type = formTaiLieu.elements['type'].value;
        let linkVal = formTaiLieu.elements['link'].value.trim();
        let description = formTaiLieu.elements['description'].value.trim();

        // Kiểm tra tiêu đề bắt buộc phải có
        if (!title) {
            alert('Vui lòng nhập tiêu đề tài liệu / bài tập!');
            return;
        }
        
        let fileObj = fileInp ? fileInp.files[0] : null;
        
        // Kiểm tra xem giảng viên đã nhập link hoặc đính kèm file chưa
        if (!linkVal && !fileObj) {
            alert('Vui lòng nhập đường dẫn URL hoặc chọn tệp đính kèm!');
            return;
        }

        // Định nghĩa hàm phụ thực hiện gọi API gửi tài liệu
        const guiTaiLieu = async (finalLink, finalFileName) => {
            let newMaterial = {
                id: 'MAT_' + Date.now(),
                classId: classId,
                title: title,
                type: type,
                link: finalLink,
                fileName: finalFileName,
                description: description,
                date: new Date().toLocaleDateString('en-CA')
            };

            try {
                // Gửi dữ liệu tài liệu mới lên backend
                let response = await fetch(`${API_BASE}/api/tai-lieu`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMaterial)
                });
                let data = await response.json();
                
                if (response.ok && data.success) {
                    let materials = layCSDL('Materials');
                    materials.unshift(newMaterial);
                    ghiCSDL('Materials', materials);
                    
                    // Tự động tạo thông báo giao tài liệu/bài tập/bài giảng cho lớp
                    await tuDongTaoThongBaoBaiTap(newMaterial, classId, user);
                    
                    alert("Tải tài liệu lên lớp học thành công!");
                    formTaiLieu.reset();
                    if (statusText) statusText.textContent = 'Chưa có file nào được chọn';
                    hienThiTaiLieuGiangVien();
                } else {
                    alert(data.message || "Tải tài liệu thất bại!");
                }
            } catch (error) {
                // Lưu trữ cục bộ dự phòng nếu kết nối lỗi
                let materials = layCSDL('Materials');
                materials.unshift(newMaterial);
                ghiCSDL('Materials', materials);
                
                // Tự động tạo thông báo giao tài liệu/bài tập/bài giảng (chế độ ngoại tuyến)
                await tuDongTaoThongBaoBaiTap(newMaterial, classId, user);
                
                alert("Tải tài liệu lên lớp học thành công! (Lưu ngoại tuyến)");
                formTaiLieu.reset();
                if (statusText) statusText.textContent = 'Chưa có file nào được chọn';
                hienThiTaiLieuGiangVien();
            }
        };

        if (fileObj) {
            // Đọc file đính kèm dạng Base64 Data URL trước khi gửi
            let reader = new FileReader();
            reader.onload = function(evt) {
                guiTaiLieu(evt.target.result, fileObj.name);
            };
            reader.readAsDataURL(fileObj);
        } else {
            // Không có file đính kèm, gửi link URL
            guiTaiLieu(linkVal, '');
        }
    });
}
// Hàm hiển thị xem trước bài làm của một sinh viên được chọn trong danh sách nộp bài
function previewSinhVienBaiLam(base64Data, fileName, studentName, studentId) {
    let previewArea = document.getElementById('teacherSubmissionPreviewArea');
    let titleEl = document.getElementById('teacherPreviewStudentTitle');
    let bodyEl = document.getElementById('teacherSubmissionPreviewBody');
    let downloadBtn = document.getElementById('teacherDownloadSubmissionBtn');
    
    if (!previewArea || !bodyEl) return;
    
    // Hiển thị vùng xem thử
    previewArea.style.display = 'block';
    if (titleEl) {
        titleEl.textContent = `👁️ Bài làm của: ${studentName} (${studentId}) - Tệp: ${fileName}`;
    }
    
    // Gán hành động tải file gốc
    if (downloadBtn) {
        downloadBtn.onclick = function() {
            taiFileDinhKem(base64Data, fileName);
        };
    }
    
    // Gọi hàm xem file inline để kết xuất bản xem thử trực quan
    hienThiXemFileInline(base64Data, fileName, bodyEl);
}

// Hàm hiển thị danh sách bài làm sinh viên đã nộp cho bài tập tương ứng
function xemDanhSachNopBai(idTaiLieu) {
    // Lấy toàn bộ danh sách bài nộp và tài liệu từ CSDL cục bộ
    let submissions = layCSDL('Submissions');
    let materials = layCSDL('Materials');
    let assignment = materials.find(m => m.id === idTaiLieu);
    
    // Cập nhật tiêu đề modal theo tên bài tập đang được xem
    let titleEl = document.getElementById('viewSubmissionsTitle');
    if (assignment && titleEl) {
        titleEl.textContent = `📋 Bài nộp: ${assignment.title}`;
    }

    // Ẩn vùng xem thử ban đầu trước khi hiển thị bảng mới
    let previewArea = document.getElementById('teacherSubmissionPreviewArea');
    if (previewArea) previewArea.style.display = 'none';

    // Lọc các bài nộp của bài tập tương ứng
    let subsOfAssignment = submissions.filter(s => s.materialId === idTaiLieu);

    // Tạo mã HTML hàng bảng danh sách bài nộp
    let html = subsOfAssignment.map((s, idx) => {
        let submissionLink = '';
        if (s.fileName) {
            let safeLink = s.link.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let safeName = s.fileName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let safeStudentName = s.studentName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let safeStudentId = s.studentId.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            submissionLink = `
                <button class="action-btn preview-sub-btn" style="padding: 4px 10px; font-size:12px; width:auto;" 
                    onclick="event.stopPropagation(); previewSinhVienBaiLam('${safeLink}', '${safeName}', '${safeStudentName}', '${safeStudentId}')">
                    👁️ Xem bài làm
                </button>
            `;
        } else {
            submissionLink = `<a href="${s.link}" target="_blank" class="text-primary font-bold" style="text-decoration: underline; font-size: 12px;" onclick="event.stopPropagation();">👁️ Xem liên kết</a>`;
        }

        let rowOnclick = '';
        if (s.fileName) {
            let safeLink = s.link.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let safeName = s.fileName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let safeStudentName = s.studentName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            let safeStudentId = s.studentId.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            rowOnclick = `onclick="previewSinhVienBaiLam('${safeLink}', '${safeName}', '${safeStudentName}', '${safeStudentId}')" style="cursor: pointer;"`;
        }

        return `
            <tr ${rowOnclick}>
                <td>${s.date}</td>
                <td><strong>${s.studentId}</strong></td>
                <td>${s.studentName}</td>
                <td>${submissionLink}</td>
            </tr>
        `;
    }).join('');

    // Đổ HTML vào tbody của bảng trong modal xem bài nộp
    let tbody = document.getElementById('tcSubmissionList');
    if (tbody) {
        tbody.innerHTML = html || '<tr><td colspan="4" class="text-center" style="padding:20px;color:#888;">💭 Chưa có sinh viên nào nộp bài tập này.</td></tr>';
    }

    // Tự động mở xem trước bài nộp của sinh viên đầu tiên (nếu có tệp đính kèm) sau khi modal hiện
    if (subsOfAssignment.length > 0 && subsOfAssignment[0].fileName) {
        let first = subsOfAssignment[0];
        setTimeout(() => {
            previewSinhVienBaiLam(first.link, first.fileName, first.studentName, first.studentId);
        }, 100);
    }

    moHopThoai('viewSubmissionsModal');
}

// --------------------------------------------------------------------------
// 6. TỰ ĐỘNG TẠO THÔNG BÁO GIAO BÀI TẬP CHO LỚP HỌC (AUTO ASSIGNMENT NOTIFICATION)
// --------------------------------------------------------------------------

// Hàm tự động tạo thông báo khi giảng viên đăng tải một tài liệu/bài giảng/bài tập mới lên lớp học
async function tuDongTaoThongBaoBaiTap(taiLieu, classId, giangVien) {
    let tieuDeIcon = '📎';
    let loaiNhan = 'TÀI LIỆU MỚI';
    let huongDan = 'xem chi tiết tài liệu';
    
    if (taiLieu.type === 'assignment') {
        tieuDeIcon = '📋';
        loaiNhan = 'BÀI TẬP MỚI';
        huongDan = 'xem đề bài và nộp bài làm';
    } else if (taiLieu.type === 'lecture') {
        tieuDeIcon = '📄';
        loaiNhan = 'BÀI GIẢNG MỚI';
        huongDan = 'xem và học bài giảng';
    }

    // Tạo nội dung thông báo mô tả chi tiết tài liệu vừa được giao
    let noiDung = `${tieuDeIcon} [${loaiNhan}] ${taiLieu.title}`;
    if (taiLieu.description && taiLieu.description.trim()) {
        noiDung += `\n\n📝 Mô tả: ${taiLieu.description}`;
    }
    if (taiLieu.fileName) {
        noiDung += `\n\n📎 File đính kèm: ${taiLieu.fileName}`;
    }
    noiDung += `\n\n⏰ Ngày đăng: ${taiLieu.date}\n👆 Nhấp vào thông báo này để ${huongDan}.`;

    // Tạo đối tượng thông báo kèm liên kết tài liệu bài tập
    let newNotif = {
        id: 'NOTIF_TL_' + Date.now(),         // Mã thông báo duy nhất với tiền tố TL (Tài Liệu)
        senderName: giangVien.name,             // Tên giảng viên gửi thông báo
        target: classId,                        // Gửi tới toàn bộ sinh viên trong lớp học này
        text: noiDung,                          // Nội dung mô tả tài liệu được giao
        date: taiLieu.date,                      // Ngày giao bài tập
        materialId: taiLieu.id,                  // Mã bài tập liên kết để sinh viên click xem chi tiết
        materialType: taiLieu.type              // Loại tài liệu
    };

    try {
        // Gửi thông báo bài tập lên API backend để lưu vào MongoDB Atlas
        let response = await fetch(`${API_BASE}/api/thong-bao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newNotif)
        });
        let data = await response.json();

        if (response.ok && data.success) {
            // Nếu gửi thành công online, đồng bộ thêm vào LocalStorage offline cache
            let notifs = layCSDL('Notifications');
            notifs.unshift(newNotif);
            ghiCSDL('Notifications', notifs);
        } else {
            // Nếu API thất bại, vẫn lưu offline để đảm bảo sinh viên thấy thông báo
            let notifs = layCSDL('Notifications');
            notifs.unshift(newNotif);
            ghiCSDL('Notifications', notifs);
        }
    } catch (error) {
        // Ngoại tuyến: vẫn lưu thông báo vào LocalStorage để sinh viên trên máy này thấy
        let notifs = layCSDL('Notifications');
        notifs.unshift(newNotif);
        ghiCSDL('Notifications', notifs);
    }
}
