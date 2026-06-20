// ==========================================================================
// HỆ THỐNG QUẢN LÝ HỌC TẬP EDU REPORT (STUDENTS APPS ENGINE - GIAO DIỆN SINH VIÊN)
// ==========================================================================

// Biến lưu trữ đối tượng biểu đồ chuyên cần (Chart.js) của sinh viên
let bieuDoChuyenCan = null;
// Biến lưu trữ đối tượng biểu đồ phân loại học lực (Chart.js) của sinh viên
let bieuDoHocLuc = null;

// Hàm kiểm tra xem hai lớp học phần có bị trùng lịch học hay không
function kiemTraTrungLich(lopA, lopB) {
    // So khớp thứ học của 2 lớp xem có trùng nhau hay không
    let cungThu = (lopA.dayOfWeek === lopB.dayOfWeek);
    // So khớp khoảng tiết học của 2 lớp xem có giao nhau hay không
    let trungTiet = (lopA.startPeriod <= lopB.endPeriod && lopB.startPeriod <= lopA.endPeriod);
    // Trả về true nếu trùng cả thứ và khoảng tiết học
    return cungThu && trungTiet;
}

// Hàm render một hàng dữ liệu bảng điểm học phần
function taoHtmlDongDiem(tenMon, tenGiangVien, diemSo) {
    // Tính điểm trung bình tổng kết (20% - 30% - 50%)
    let diemKTHS = tinhDiemTrungBinh(diemSo.cc, diemSo.gk, diemSo.ck);
    // Tạo chuỗi hiển thị điểm chuyên cần
    let hienThiCC = (diemSo.cc !== null && diemSo.cc !== "") ? diemSo.cc : "--";
    // Tạo chuỗi hiển thị điểm giữa kỳ
    let hienThiGK = (diemSo.gk !== null && diemSo.gk !== "") ? diemSo.gk : "--";
    // Tạo chuỗi hiển thị điểm cuối kỳ
    let hienThiCK = (diemSo.ck !== null && diemSo.ck !== "") ? diemSo.ck : "--";
    // Tạo chuỗi hiển thị điểm trung bình
    let hienThiTB = diemKTHS !== null ? diemKTHS.toFixed(1) : "--";
    // Nhận mã HTML xếp loại học lực tương ứng
    let xepLoaiHtml = layHtmlXepLoai(diemKTHS);

    // Trả về chuỗi HTML hàng dòng điểm
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

// Hàm hiển thị báo cáo học tập, tiến độ, thời khóa biểu và biểu đồ của sinh viên
function hienThiBaoCaoHocTapSinhVien(sinhVien) {
    // Lấy danh sách toàn bộ lớp học từ cơ sở dữ liệu Local
    let lopHocs = layCSDL('Classes');
    // Lấy danh sách môn học từ cơ sở dữ liệu Local
    let monHocs = layCSDL('Subjects');
    // Lấy danh sách toàn bộ người dùng từ cơ sở dữ liệu Local
    let nguoiDungs = layCSDL('Users');
    
    // Lọc ra các lớp học phần mà sinh viên này đang theo học
    let lopCuaToi = lopHocs.filter(c => c.enrolledStudents.includes(sinhVien.id));
    // Định dạng chuỗi ngày hôm nay (YYYY-MM-DD)
    let homNay = new Date().toLocaleDateString('en-CA');
    
    // Khởi tạo thời khóa biểu trống các thứ trong tuần
    let lichHocTuan = { 
        'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] 
    };
    
    // Các biến tích lũy để render HTML
    let theLopHtml = '';
    let bangDiemHtml = '';
    let tongDiemTB = 0; 
    let soMonCoDiem = 0; 
    let soLopDatLoaiGioi = 0;
    
    // Các biến tích lũy số liệu thống kê chuyên cần và xếp loại
    let thongKeChuyenCan = { present: 0, late: 0, absent: 0 };
    let thongKeBieuDoTron = { xuatSac: 0, gioi: 0, kha: 0, tb: 0, yeu: 0 };

    // Vòng lặp duyệt qua từng lớp học của sinh viên
    lopCuaToi.forEach(c => {
        // Tìm thông tin môn học tương ứng
        let mon = monHocs.find(s => s.id === c.subjectId);
        let tenMon = mon ? mon.name : 'Môn học';
        // Tìm họ tên giảng viên phụ trách lớp
        let tenGV = nguoiDungs.find(u => u.id === c.teacherId)?.name || 'Chưa phân công';
        
        // Tạo chuỗi mô tả tiết học
        let chuoiGio = layThongTinTietHoc(c.startPeriod, c.endPeriod);
        // Đẩy thông tin buổi học vào thứ tương ứng trên thời khóa biểu
        lichHocTuan[c.dayOfWeek].push({ 
            subName: tenMon, 
            room: c.room, 
            timeStr: chuoiGio 
        });
        
        // Tính toán tiến trình học tập lớp học phần
        let tongSoBuoi = c.sessions.length;
        let soBuoiDaHoc = c.sessions.filter(s => s.date <= homNay).length;
        let phanTramTienDo = tongSoBuoi > 0 ? Math.round((soBuoiDaHoc / tongSoBuoi) * 100) : 0;
        
        // Lấy điểm số của sinh viên hiện tại trong lớp
        let diem = c.grades[sinhVien.id] || { cc: null, gk: null, ck: null };
        let diemTBMon = tinhDiemTrungBinh(diem.cc, diem.gk, diem.ck);
        
        // Nếu đã có điểm trung bình tổng kết
        if (diemTBMon !== null) {
            soMonCoDiem++; 
            tongDiemTB += diemTBMon; 
            // Đếm số lớp đạt loại giỏi/xuất sắc (từ 8.0 trở lên)
            if (diemTBMon >= 8.0) soLopDatLoaiGioi++;
            
            // Đếm xếp loại học lực cho biểu đồ tròn
            if (diemTBMon >= 9.0) thongKeBieuDoTron.xuatSac++; 
            else if (diemTBMon >= 8.0) thongKeBieuDoTron.gioi++; 
            else if (diemTBMon >= 6.5) thongKeBieuDoTron.kha++; 
            else if (diemTBMon >= 5.0) thongKeBieuDoTron.tb++; 
            else thongKeBieuDoTron.yeu++;
        }
        
        // Tạo HTML dòng điểm cho môn học
        bangDiemHtml += taoHtmlDongDiem(tenMon, tenGV, diem);
        
        // Cộng dồn dữ liệu điểm danh chuyên cần của sinh viên trong lớp này
        c.sessions.forEach(s => { 
            let status = s.attendance[sinhVien.id]; 
            if (status) thongKeChuyenCan[status]++; 
        });

        // Tạo thẻ hiển thị lớp học phần và tiến độ lớp học
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

    // Đổ dữ liệu bảng điểm tổng hợp lên giao diện
    let elBangDiem = document.getElementById('stuGradesTableBody');
    if (elBangDiem) elBangDiem.innerHTML = bangDiemHtml || '<tr><td colspan="7">Sinh viên chưa có điểm môn học nào.</td></tr>';

    // Xây dựng giao diện danh sách thời khóa biểu tuần học
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

    // Đổ dữ liệu lịch học lên màn hình dashboard
    let elSchedule = document.getElementById('weeklyScheduleContainer');
    if (elSchedule) elSchedule.innerHTML = htmlLich || '<p>Tuần này bạn không có lịch học.</p>';
    
    // Đổ dữ liệu danh sách lớp học đăng ký lên màn hình tiến trình
    let elEnrolled = document.getElementById('enrolledClassesCards');
    if (elEnrolled) elEnrolled.innerHTML = theLopHtml || '<p class="border-box">Bạn chưa đăng ký tham gia lớp học nào.</p>';
    
    // Hiển thị tổng số lượng môn học đăng ký trên thẻ thống kê nhanh
    let elTotalSub = document.getElementById('stat-total-subjects');
    if (elTotalSub) elTotalSub.textContent = lopCuaToi.length;
    
    // Hiển thị điểm trung bình tích lũy gpa hệ 10 trên thẻ thống kê nhanh
    let elGpa = document.getElementById('stat-gpa');
    if (elGpa) elGpa.textContent = soMonCoDiem > 0 ? (tongDiemTB / soMonCoDiem).toFixed(1) : '--';
    
    // Hiển thị số lượng môn xuất sắc/giỏi
    let elExcel = document.getElementById('stat-excellent');
    if (elExcel) elExcel.textContent = soLopDatLoaiGioi;
    
    // Tính toán và hiển thị tỷ lệ đi học đầy đủ chuyên cần
    let tongDiemDanh = thongKeChuyenCan.present + thongKeChuyenCan.late + thongKeChuyenCan.absent;
    let elRate = document.getElementById('stat-attendance-rate');
    if (elRate) {
        elRate.textContent = tongDiemDanh > 0 ? ((thongKeChuyenCan.present / tongDiemDanh) * 100).toFixed(1) + '%' : '0%';
    }
    
    // Vẽ hai biểu đồ học tập trực quan Chart.js
    veBieuDoSinhVien(thongKeChuyenCan, thongKeBieuDoTron);
}

// Hàm khởi tạo và vẽ biểu đồ thanh (Chuyên cần) và biểu đồ tròn (Học lực)
function veBieuDoSinhVien(att, grades) {
    let canvasAtt = document.getElementById('attendanceChart');
    if (!canvasAtt) return;
    
    // Hủy bỏ đối tượng biểu đồ cũ nếu đã được tạo trước đó để tránh đè lỗi rendering
    if (bieuDoChuyenCan) bieuDoChuyenCan.destroy(); 
    if (bieuDoHocLuc) bieuDoHocLuc.destroy();

    // Vẽ biểu đồ chuyên cần cột dọc dạng Bar Chart
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
    
    // Vẽ biểu đồ tròn học lực (Pie Chart) nếu có ít nhất một môn học có điểm số
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

// Hàm mở xem chi tiết buổi học và chuyên cần điểm danh của sinh viên trong một lớp cụ thể
function moHopThoaiLopSinhVien(idLop) {
    let lopHocs = layCSDL('Classes');
    let monHocs = layCSDL('Subjects');
    let nguoiDungs = layCSDL('Users');
    let user = layCSDL('currentUser');
    
    // Tìm kiếm lớp học tương ứng
    let lop = lopHocs.find(c => c.id === idLop); 
    if (!lop) return;
    
    let tenMon = monHocs.find(s => s.id === lop.subjectId)?.name || '';
    let tenGV = nguoiDungs.find(u => u.id === lop.teacherId)?.name || '';
    let tenHienThi = layTenLopHienThi(lop.id);
    
    // Cập nhật thông tin tiêu đề lớp trên giao diện popup modal
    document.getElementById('modalClassName').textContent = `${tenMon} (${tenHienThi})`;
    document.getElementById('modalTeacherName').textContent = `Giảng viên phụ trách: ${tenGV}`;
    
    let homNay = new Date().toLocaleDateString('en-CA');
    
    // Đổ danh sách các buổi học và kết quả điểm danh của sinh viên
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
    
    // Đổ nội dung danh sách vào bảng
    document.getElementById('modalSessionList').innerHTML = htmlDong || '<tr><td colspan="2">Lớp này chưa được tạo buổi học.</td></tr>';
    
    // Đổ danh mục tài liệu & bài tập của lớp học học phần
    let materials = layCSDL('Materials');
    let materialsOfClass = materials.filter(m => m.classId === idLop);

    // Bản đồ nhãn loại tài liệu hiển thị cho sinh viên
    let typeMap = {
        'lecture': '<span class="text-primary font-bold">Bài giảng</span>',
        'assignment': '<span class="text-warning font-bold">Bài tập</span>',
        'other': '<span class="text-muted">Khác</span>'
    };

    // Tạo mã HTML hàng bảng danh sách tài liệu
    let htmlMaterials = materialsOfClass.map(m => {
        let linkHtml = '';
        if (m.type === 'assignment') {
            // Lấy danh sách bài nộp từ CSDL offline
            let submissions = layCSDL('Submissions');
            // Tìm bài nộp của sinh viên này
            let mySub = submissions.find(s => s.materialId === m.id && s.studentId === user.id);
            
            if (mySub) {
                // Nếu đã nộp, hiển thị đường dẫn xem và nút nộp lại
                let customLinkHtml = '';
                if (mySub.fileName) {
                    customLinkHtml = `<a href="#" onclick="event.preventDefault(); taiFileDinhKem('${mySub.link.replace(/'/g, "\\'")}', '${mySub.fileName.replace(/'/g, "\\'")}')" class="text-success font-bold" style="text-decoration: underline;">Đã nộp: ${mySub.fileName}</a>`;
                } else {
                    customLinkHtml = `<a href="${mySub.link}" target="_blank" class="text-success font-bold" style="text-decoration: underline;">Đã nộp bài (URL)</a>`;
                }
                linkHtml = `
                    <div class="flex-row align-center" style="gap: 5px; flex-wrap: wrap;">
                        ${customLinkHtml}
                        <button class="action-btn" style="padding: 2px 6px; font-size:11px; width: auto;" onclick="moModalNopBai('${m.id}', '${m.title.replace(/'/g, "\\'")}')">Nộp lại</button>
                    </div>
                `;
            } else {
                // Nếu chưa nộp, hiển thị nút nộp bài màu nổi bật
                linkHtml = `<button class="btn-primary" style="padding: 4px 10px; font-size:12px; width:auto;" onclick="moModalNopBai('${m.id}', '${m.title.replace(/'/g, "\\'")}')">Nộp bài</button>`;
            }
        } else {
            // Đối với bài giảng hoặc tài liệu khác, chỉ hiển thị liên kết xem tài liệu thông thường
            if (m.fileName) {
                linkHtml = `<a href="#" onclick="event.preventDefault(); taiFileDinhKem('${m.link.replace(/'/g, "\\'")}', '${m.fileName.replace(/'/g, "\\'")}')" class="text-primary font-bold" style="text-decoration: underline;">Tải file</a>`;
            } else {
                linkHtml = `<a href="${m.link}" target="_blank" class="text-primary font-bold" style="text-decoration: underline;">Xem tài liệu</a>`;
            }
        }

        // Dựng phần mô tả bài tập & file đính kèm nếu có
        let detailHtml = `<strong>${m.title}</strong>`;
        if (m.description) {
            detailHtml += `<p class="text-sm text-muted mt-5" style="white-space: pre-line;">${m.description}</p>`;
        }
        if (m.fileName) {
            detailHtml += `<div class="mt-5 text-sm"><span class="font-bold text-success">Đính kèm: </span><a href="#" onclick="event.preventDefault(); taiFileDinhKem('${m.link.replace(/'/g, "\\'")}', '${m.fileName.replace(/'/g, "\\'")}')" class="text-primary font-bold" style="text-decoration: underline;">${m.fileName}</a></div>`;
        }

        return `
            <tr>
                <td>${m.date}</td>
                <td>${typeMap[m.type] || m.type}</td>
                <td>${detailHtml}</td>
                <td>${linkHtml}</td>
            </tr>
        `;
    }).join('');

    let elMatList = document.getElementById('modalMaterialList');
    if (elMatList) {
        elMatList.innerHTML = htmlMaterials || '<tr><td colspan="4" class="text-center">Chưa có tài liệu học tập nào được chia sẻ trong lớp này.</td></tr>';
    }

    // Mở modal popup lên màn hình
    moHopThoai('stuClassModal');
}

// Hàm hiển thị danh mục các môn mở cổng đăng ký tín chỉ trực tuyến
function hienThiTabDangKyTinChi(sinhVien) {
    let lopHocs = layCSDL('Classes');
    let monHocs = layCSDL('Subjects');
    let nguoiDungs = layCSDL('Users');
    
    let vungChua = document.getElementById('registrationContainer'); 
    if (!vungChua) return;
    
    // Kiểm tra trạng thái cổng đăng ký mở hay đóng trong CSDL
    let congDangKyMo = JSON.parse(localStorage.getItem('RegistrationOpen'));
    // Lọc danh sách lớp sinh viên đã đăng ký học
    let lopDaDangKy = lopHocs.filter(cls => cls.enrolledStudents.includes(sinhVien.id));
    let htmlResult = '';
    
    // Hiển thị cảnh báo nếu cổng đăng ký đang bị khóa
    if (!congDangKyMo) {
        htmlResult += `
            <div class="border-box bg-light mb-20" style="border-left: 5px solid var(--danger);">
                <strong class="text-danger">Hệ thống hiện tại đang khóa cổng đăng ký học phần trực tuyến.</strong>
            </div>
        `;
    }
    
    // Vòng lặp duyệt qua từng môn học CNTT
    monHocs.forEach(mon => {
        // Tìm các lớp học đang mở của môn học này
        let dsLopCuaMon = lopHocs.filter(c => c.subjectId === mon.id); 
        if (dsLopCuaMon.length === 0) return;
        
        // Tìm xem môn học này sinh viên đã đăng ký lớp nào chưa
        let lopMonNayDaDangKy = dsLopCuaMon.find(c => c.enrolledStudents.includes(sinhVien.id));
        htmlResult += `<h3 class="border-bottom mt-20 mb-10 text-primary font-bold">${mon.name}</h3>`;

        // Duyệt danh sách các lớp của môn học
        dsLopCuaMon.forEach(c => {
            let tenGV = nguoiDungs.find(u => u.id === c.teacherId)?.name || '';
            let tenHienThi = layTenLopHienThi(c.id);
            let thongTinTiet = layThongTinTietHoc(c.startPeriod, c.endPeriod);
            
            // Các điều kiện ràng buộc đăng ký
            let daDangKy = c.enrolledStudents.includes(sinhVien.id);
            let daDangKyLopKhacCungMon = (lopMonNayDaDangKy && lopMonNayDaDangKy.id !== c.id);
            let biTrungLich = lopDaDangKy.some(lopDaDK => kiemTraTrungLich(c, lopDaDK));
            
            // Xây dựng mã HTML cho các nút bấm hành động tương tác (Không vô hiệu hóa click của card)
            let htmlNutAction = '';
            if (congDangKyMo) {
                if (daDangKy) {
                    htmlNutAction = `<button class="btn-danger" style="width: auto;" onclick="huyDangKyLopHoc('${c.id}')">Hủy đăng ký</button>`;
                } else if (daDangKyLopKhacCungMon) {
                    htmlNutAction = `<button class="btn-primary" style="width: auto; opacity: 0.55; cursor: not-allowed;" disabled>Đã học môn này</button>`;
                } else if (biTrungLich) {
                    htmlNutAction = `<button class="btn-primary" style="width: auto; opacity: 0.55; cursor: not-allowed;" disabled>Trùng lịch học</button>`;
                } else {
                    htmlNutAction = `<button class="btn-primary" style="width: auto;" onclick="dangKyLopHoc('${c.id}')">Đăng ký</button>`;
                }
            } else {
                htmlNutAction = daDangKy ? `<strong class="text-success">Đã đăng ký</strong>` : `<button class="btn-primary" style="width: auto; opacity: 0.55; cursor: not-allowed;" disabled>Cổng đã đóng</button>`;
            }

            // Gán sự kiện bấm xem chi tiết lịch học lớp học phần (luôn cho phép click xem lịch)
            let suKienClick = `onclick="moHopThoaiLopSinhVien('${c.id}')"`;

            htmlResult += `
                <div class="border-box border-left-dark flex-row align-center justify-between mb-10">
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
    
    // Đổ danh sách học phần ra container đăng ký tín chỉ
    vungChua.innerHTML = htmlResult || '<p>Chưa có học phần nào mở lớp đăng ký.</p>';
}

// Hàm xử lý khi sinh viên bấm đăng ký một lớp học phần
function dangKyLopHoc(idLop) { 
    let user = layCSDL('currentUser');
    // Thực hiện thêm sinh viên vào danh sách lớp và gieo bảng điểm trống
    capNhatLopCSDL(idLop, function(c) { 
        if (!c.enrolledStudents.includes(user.id)) {
            c.enrolledStudents.push(user.id); 
            c.grades[user.id] = { cc: null, gk: null, ck: null };
        }
    }); 
    
    // Cập nhật lại toàn bộ giao diện sau khi đăng ký thành công
    alert("Đăng ký lớp học thành công!"); 
    hienThiTabDangKyTinChi(user); 
    hienThiBaoCaoHocTapSinhVien(user); 
    hienThiThongBaoSinhVien(user);
}

// Hàm xử lý khi sinh viên hủy đăng ký lớp học phần
function huyDangKyLopHoc(idLop) { 
    hienThiConfirmTuyBien("Xác nhận hủy đăng ký học phần này? Dữ liệu điểm của bạn ở lớp này sẽ bị xóa!", () => {
        let user = layCSDL('currentUser');
        capNhatLopCSDL(idLop, function(c) { 
            c.enrolledStudents = c.enrolledStudents.filter(id => id !== user.id); 
            delete c.grades[user.id];
        }); 
        
        alert("Hủy đăng ký học phần thành công!"); 
        hienThiTabDangKyTinChi(user); 
        hienThiBaoCaoHocTapSinhVien(user); 
        hienThiThongBaoSinhVien(user);
    });
}

// Hàm hiển thị danh sách các thông báo của sinh viên
function hienThiThongBaoSinhVien(sinhVien) {
    let lopHocs = layCSDL('Classes');
    // Lấy danh sách lớp sinh viên đã đăng ký học
    let lopCuaToi = lopHocs.filter(c => c.enrolledStudents.includes(sinhVien.id));
    
    // Cập nhật lại danh mục lớp học vào bộ lọc thông báo để tránh bị lệch giữa các tài khoản đăng nhập
    let locSelect = document.getElementById('stuNotifFilter');
    if (locSelect) {
        let giaTriCu = locSelect.value;
        let htmlOptions = `<option value="all">Tất cả thông báo</option>`;
        htmlOptions += `<option value="tat-ca-sinh-vien">Thông báo chung từ nhà trường</option>`;
        
        lopCuaToi.forEach(c => {
            htmlOptions += `<option value="${c.id}">Lớp ${layTenLopHienThi(c.id)}</option>`;
        });
        locSelect.innerHTML = htmlOptions;
        
        // Khôi phục lại lựa chọn trước đó của sinh viên nếu vẫn còn trong danh sách lớp học mới
        if ([...locSelect.options].some(opt => opt.value === giaTriCu)) {
            locSelect.value = giaTriCu;
        }
    }
    
    // Đọc bộ lọc hiện tại và lấy danh sách thông báo
    let giaTriLoc = locSelect ? locSelect.value : 'all';
    let thongBao = layCSDL('Notifications');
    let dsMaLopCuaToi = lopCuaToi.map(c => c.id);
    
    // Tiến hành lọc thông báo dựa trên lớp học và loại thông báo chung
    let tbLoc = thongBao.filter(n => {
        if (giaTriLoc === 'all') {
            return n.target === 'tat-ca-sinh-vien' || dsMaLopCuaToi.includes(n.target);
        } else {
            return n.target === giaTriLoc;
        }
    });

    // Sắp xếp các thông báo theo ID số (timestamp) giảm dần bằng hàm dùng chung
    tbLoc = sapXepThongBaoMoiNhat(tbLoc);
    
    // Gọi hàm render danh sách thẻ thông báo chung
    hienThiTheThongBaoChung('studentNotifList', tbLoc, sinhVien);
}

// Hàm xử lý lọc thông báo sinh viên khi lựa chọn thay đổi
function locThongBaoSinhVien() {
    let user = layCSDL('currentUser');
    hienThiThongBaoSinhVien(user);
}

// --------------------------------------------------------------------------
// 4. QUẢN LÝ NỘP BÀI TẬP TRỰC TUYẾN (STUDENT ASSIGNMENTS SUBMISSION)
// --------------------------------------------------------------------------

// Hàm mở Modal nộp bài và điền thông tin bài tập tương ứng
function moModalNopBai(idTaiLieu, tieuDeBaiTap) {
    document.getElementById('submitMaterialId').value = idTaiLieu;
    document.getElementById('submitAssignmentTitle').textContent = `Nộp bài làm: ${tieuDeBaiTap}`;
    
    // Đổ đường dẫn bài nộp cũ vào form nếu đã nộp trước đó
    let user = layCSDL('currentUser');
    let submissions = layCSDL('Submissions');
    let mySub = submissions.find(s => s.materialId === idTaiLieu && s.studentId === user.id);
    let formNop = document.getElementById('stuSubmitAssignmentForm');
    
    // Reset file input và nhãn hiển thị file
    let fileInp = document.getElementById('stuSubmitFile');
    if (fileInp) fileInp.value = '';
    let statusText = document.getElementById('stuFileStatusText');
    
    if (formNop) {
        if (mySub) {
            if (mySub.fileName) {
                formNop.elements['link'].value = '';
                if (statusText) statusText.textContent = `Tệp đã nộp: ${mySub.fileName}`;
            } else {
                formNop.elements['link'].value = mySub.link;
                if (statusText) statusText.textContent = 'Chưa có file nào được chọn';
            }
        } else {
            formNop.elements['link'].value = '';
            if (statusText) statusText.textContent = 'Chưa có file nào được chọn';
        }
    }

    moHopThoai('submitAssignmentModal');
}

// Lắng nghe sự kiện nộp biểu mẫu nộp bài làm của sinh viên
let formNopBai = document.getElementById('stuSubmitAssignmentForm');
if (formNopBai) {
    // Thêm lắng nghe sự kiện đổi file hiển thị tên file
    let fileInp = document.getElementById('stuSubmitFile');
    let statusText = document.getElementById('stuFileStatusText');
    if (fileInp && statusText) {
        fileInp.addEventListener('change', () => {
            if (fileInp.files.length > 0) {
                statusText.textContent = `Đã chọn file: ${fileInp.files[0].name}`;
            } else {
                statusText.textContent = 'Chưa có file nào được chọn';
            }
        });
    }

    formNopBai.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let user = layCSDL('currentUser');
        let idTaiLieu = document.getElementById('submitMaterialId').value;
        let duongDan = formNopBai.elements['link'].value.trim();
        
        let fileInp = document.getElementById('stuSubmitFile');
        let fileObj = fileInp ? fileInp.files[0] : null;
        
        // Kiểm tra xem sinh viên có nhập link hoặc tải file lên không
        if (!duongDan && !fileObj) {
            alert("Vui lòng nhập đường dẫn URL hoặc chọn file đính kèm bài làm!");
            return;
        }

        // Định nghĩa hàm phụ xử lý gửi dữ liệu lên server
        const guiBaiNop = async (linkValue, nameValue) => {
            let newSubmission = {
                id: 'SUBM_' + Date.now(),
                materialId: idTaiLieu,
                studentId: user.id,
                studentName: user.name,
                link: linkValue,
                fileName: nameValue || '',
                date: new Date().toLocaleDateString('en-CA')
            };

            try {
                // Gửi dữ liệu bài nộp lên API backend
                let response = await fetch(`${API_BASE}/api/nop-bai`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSubmission)
                });
                let data = await response.json();
                
                if (response.ok && data.success) {
                    // Cập nhật lại vào Local CSDL offline
                    let listSubs = layCSDL('Submissions');
                    let vt = listSubs.findIndex(s => s.materialId === idTaiLieu && s.studentId === user.id);
                    if (vt > -1) {
                        listSubs[vt] = { ...listSubs[vt], link: linkValue, fileName: newSubmission.fileName, date: newSubmission.date };
                    } else {
                        listSubs.unshift(newSubmission);
                    }
                    ghiCSDL('Submissions', listSubs);
                    
                    alert("Nộp bài tập trực tuyến thành công!");
                    dongHopThoai('submitAssignmentModal');
                    formNopBai.reset();
                    if (statusText) statusText.textContent = 'Chưa có file nào được chọn';
                    
                    // Làm mới lại bảng chi tiết lớp học
                    let classes = layCSDL('Classes');
                    let modalTitle = document.getElementById('modalClassName').textContent;
                    let activeClass = classes.find(c => modalTitle.includes(layTenLopHienThi(c.id)));
                    if (activeClass) {
                        moHopThoaiLopSinhVien(activeClass.id);
                    }
                } else {
                    alert(data.message || "Nộp bài tập thất bại!");
                }
            } catch (error) {
                // Lưu trữ cục bộ dự phòng nếu lỗi kết nối
                let listSubs = layCSDL('Submissions');
                let vt = listSubs.findIndex(s => s.materialId === idTaiLieu && s.studentId === user.id);
                if (vt > -1) {
                    listSubs[vt] = { ...listSubs[vt], link: linkValue, fileName: newSubmission.fileName, date: newSubmission.date };
                } else {
                    listSubs.unshift(newSubmission);
                }
                ghiCSDL('Submissions', listSubs);
                
                alert("Nộp bài tập trực tuyến thành công! (Lưu ngoại tuyến)");
                dongHopThoai('submitAssignmentModal');
                formNopBai.reset();
                if (statusText) statusText.textContent = 'Chưa có file nào được chọn';
                
                let modalTitle = document.getElementById('modalClassName').textContent;
                let activeClass = layCSDL('Classes').find(c => modalTitle.includes(layTenLopHienThi(c.id)));
                if (activeClass) {
                    moHopThoaiLopSinhVien(activeClass.id);
                }
            }
        };

        if (fileObj) {
            // Nếu có file đính kèm, thực hiện đọc file dạng Base64 Data URL trước
            let reader = new FileReader();
            reader.onload = function(evt) {
                guiBaiNop(evt.target.result, fileObj.name);
            };
            reader.readAsDataURL(fileObj);
        } else {
            // Nếu không có file, gửi link URL thông thường
            guiBaiNop(duongDan, '');
        }
    });
}
