// ==========================================================================
// HỆ THỐNG QUẢN LÝ HỌC TẬP EDU REPORT (ADMIN APPS ENGINE - GIAO DIỆN QUẢN TRỊ)
// TẤT CẢ CÁC HÀM ĐƯỢC CHÚ THÍCH CHI TIẾT TỪNG DÒNG TIẾNG VIỆT CÓ DẤU
// ==========================================================================

const API_NGUOI_DUNG = 'http://localhost:5000/api/nguoi-dung'; // Đường dẫn cơ sở kết nối API người dùng của Backend
const API_DANG_KY = 'http://localhost:5000/api/auth/dang-ky'; // Đường dẫn API tạo tài khoản mới của Backend

// --------------------------------------------------------------------------
// 1. QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG (CRUD USER MANAGEMENT - ONLINE + OFFLINE)
// --------------------------------------------------------------------------

// Hàm lấy và hiển thị danh sách tài khoản (Sinh viên & Giảng viên) từ MongoDB hoặc LocalStorage
async function hienThiDanhSachTaiKhoan() {
    let dsNguoiDung = [];
    
    try {
        // Thực hiện gọi API lấy toàn bộ danh sách người dùng trong cơ sở dữ liệu MongoDB Atlas
        let response = await fetch(API_NGUOI_DUNG);
        let data = await response.json();
        
        if (response.ok && data.success) {
            dsNguoiDung = data.users;
            // Đồng bộ ghi đè danh sách người dùng lấy được vào CSDL offline LocalStorage
            ghiCSDL('Users', dsNguoiDung);
        } else {
            // Sử dụng CSDL LocalStorage dự phòng nếu API phản hồi lỗi
            dsNguoiDung = layCSDL('Users');
        }
    } catch (error) {
        console.warn("Không kết nối được API server. Đang nạp danh sách tài khoản ngoại tuyến...");
        // Sử dụng CSDL LocalStorage dự phòng nếu mất kết nối mạng
        dsNguoiDung = layCSDL('Users');
    }
    
    // Tách riêng danh sách sinh viên và giảng viên
    let dsSinhVien = dsNguoiDung.filter(u => u.role === 'sinh-vien');
    let dsGiangVien = dsNguoiDung.filter(u => u.role === 'giang-vien');
    
    // Tạo mã HTML hàng bảng dữ liệu tài khoản Sinh viên
    let htmlSinhVien = dsSinhVien.map(sv => {
        let dobStr = sv.dob ? sv.dob.split('-').reverse().join('/') : '--';
        return `
            <tr>
                <td><strong>${sv.id}</strong></td>
                <td><span class="text-primary font-bold">${sv.name}</span></td>
                <td>${sv.email}</td>
                <td>${dobStr}</td>
                <td>${sv.phone || '--'}</td>
                <td>
                    <button class="action-btn" onclick="suaTaiKhoan('${sv.id}')">Sửa</button>
                    <button class="btn-danger" onclick="xoaTaiKhoan('${sv.id}')">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Tạo mã HTML hàng bảng dữ liệu tài khoản Giảng viên
    let htmlGiangVien = dsGiangVien.map(gv => {
        let dobStr = gv.dob ? gv.dob.split('-').reverse().join('/') : '--';
        return `
            <tr>
                <td><strong>${gv.id}</strong></td>
                <td><span class="text-primary font-bold">${gv.name}</span></td>
                <td>${gv.email}</td>
                <td>${dobStr}</td>
                <td>${gv.phone || '--'}</td>
                <td>
                    <button class="action-btn" onclick="suaTaiKhoan('${gv.id}')">Sửa</button>
                    <button class="btn-danger" onclick="xoaTaiKhoan('${gv.id}')">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Đổ dữ liệu HTML vào các bảng tương ứng trên giao diện admin
    let tbodySV = document.getElementById('admStudentAccounts');
    let tbodyGV = document.getElementById('admTeacherAccounts');
    
    if (tbodySV) tbodySV.innerHTML = htmlSinhVien || '<tr><td colspan="6">Không có sinh viên nào.</td></tr>';
    if (tbodyGV) tbodyGV.innerHTML = htmlGiangVien || '<tr><td colspan="6">Không có giảng viên nào.</td></tr>';
    
    // Cập nhật số lượng tài khoản thực tế lên các thẻ thống kê nhanh
    let elTotalSV = document.getElementById('stat-total-students-adm');
    let elTotalGV = document.getElementById('stat-total-teachers-adm');
    if (elTotalSV) elTotalSV.textContent = dsSinhVien.length;
    if (elTotalGV) elTotalGV.textContent = dsGiangVien.length;
}

// Lắng nghe sự kiện nộp form để lưu tài khoản được tạo mới
let formTaoTK = document.getElementById('adminCreateAccountForm');
if (formTaoTK) {
    formTaoTK.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Thu thập toàn bộ dữ liệu nhập vào từ form tạo tài khoản
        let idVal = formTaoTK.elements['id'].value.trim();
        let nameVal = formTaoTK.elements['name'].value.trim();
        let emailVal = formTaoTK.elements['email'].value.trim();
        let passwordVal = formTaoTK.elements['password'].value.trim();
        let roleVal = formTaoTK.elements['role'].value;
        let dobVal = formTaoTK.elements['dob'].value;
        let phoneVal = formTaoTK.elements['phone'].value.trim();
        
        // Ràng buộc mật khẩu tối thiểu 6 ký tự
        if (passwordVal.length < 6) {
            alert("Mật khẩu phải chứa tối thiểu 6 ký tự!");
            return;
        }
        
        let taiKhoanGui = {
            id: idVal,
            name: nameVal,
            email: emailVal,
            password: passwordVal,
            role: roleVal,
            dob: dobVal,
            phone: phoneVal
        };
        
        try {
            // Thực hiện gọi API đăng ký tài khoản mới lên Express server
            let response = await fetch(API_DANG_KY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taiKhoanGui)
            });
            let data = await response.json();
            
            // Xử lý khi API ghi nhận tạo tài khoản thành công
            if (response.ok && data.success) {
                // Lưu tài khoản mới vào danh sách offline LocalStorage
                let users = layCSDL('Users');
                users.push({ ...taiKhoanGui, readNotifs: [] });
                ghiCSDL('Users', users);
                
                alert("Tạo tài khoản mới thành công trên MongoDB Atlas!");
                dongHopThoai('admCreateAccountModal');
                formTaoTK.reset();
                hienThiDanhSachTaiKhoan();
            } else {
                alert(data.message || "Tạo tài khoản thất bại!");
            }
        } catch (error) {
            console.warn("Không kết nối được server. Đang lưu tài khoản ở chế độ ngoại tuyến Local...");
            
            // Xử lý tạo tài khoản ở chế độ offline LocalStorage dự phòng
            let users = layCSDL('Users');
            if (users.some(u => u.email.toLowerCase() === emailVal.toLowerCase())) {
                alert("Email này đã tồn tại trên LocalStorage offline!");
                return;
            }
            if (users.some(u => u.id === idVal)) {
                alert("Mã định danh đã tồn tại trên LocalStorage offline!");
                return;
            }
            
            users.push({ ...taiKhoanGui, readNotifs: [] });
            ghiCSDL('Users', users);
            
            alert("Tạo tài khoản thành công! (Lưu ngoại tuyến)");
            dongHopThoai('admCreateAccountModal');
            formTaoTK.reset();
            hienThiDanhSachTaiKhoan();
        }
    });
}

// Hàm mở xem thông tin và chuẩn bị form sửa đổi thông tin người dùng
function suaTaiKhoan(idNguoiDung) {
    let users = layCSDL('Users');
    // Tìm đối tượng người dùng cần sửa đổi
    let target = users.find(u => u.id === idNguoiDung);
    if (!target) return;
    
    let formSua = document.getElementById('adminEditAccountForm');
    // Đổ dữ liệu hiện tại của tài khoản vào form sửa
    formSua.elements['id'].value = target.id;
    formSua.elements['name'].value = target.name;
    formSua.elements['email'].value = target.email;
    formSua.elements['password'].value = ''; // Để trống mật khẩu mặc định
    formSua.elements['role'].value = target.role;
    formSua.elements['dob'].value = target.dob || '';
    formSua.elements['phone'].value = target.phone || '';
    
    // Hiển thị modal sửa tài khoản
    moHopThoai('admEditAccountModal');
}

// Lắng nghe sự kiện nộp form sửa tài khoản để cập nhật dữ liệu
let formSuaTK = document.getElementById('adminEditAccountForm');
if (formSuaTK) {
    formSuaTK.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let idVal = formSuaTK.elements['id'].value;
        let nameVal = formSuaTK.elements['name'].value.trim();
        let emailVal = formSuaTK.elements['email'].value.trim();
        let passwordVal = formSuaTK.elements['password'].value.trim();
        let roleVal = formSuaTK.elements['role'].value;
        let dobVal = formSuaTK.elements['dob'].value;
        let phoneVal = formSuaTK.elements['phone'].value.trim();
        
        let taiKhoanCapNhat = {
            name: nameVal,
            email: emailVal,
            role: roleVal,
            dob: dobVal,
            phone: phoneVal
        };
        // Cập nhật thêm mật khẩu mới nếu được nhập
        if (passwordVal !== '') {
            taiKhoanCapNhat.password = passwordVal;
        }
        
        try {
            // Gọi API cập nhật người dùng PUT /api/nguoi-dung/:id
            let response = await fetch(`${API_NGUOI_DUNG}/${idVal}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taiKhoanCapNhat)
            });
            let data = await response.json();
            
            if (response.ok && data.success) {
                // Cập nhật thông tin vào danh sách offline LocalStorage
                let users = layCSDL('Users');
                let vt = users.findIndex(u => u.id === idVal);
                if (vt > -1) {
                    users[vt] = { ...users[vt], ...taiKhoanCapNhat };
                    ghiCSDL('Users', users);
                }
                
                alert("Cập nhật thông tin tài khoản thành công!");
                dongHopThoai('admEditAccountModal');
                hienThiDanhSachTaiKhoan();
            } else {
                alert(data.message || "Cập nhật tài khoản thất bại!");
            }
        } catch (error) {
            console.warn("Không kết nối được server. Đang lưu thay đổi offline...");
            
            // Xử lý lưu ngoại tuyến LocalStorage dự phòng
            let users = layCSDL('Users');
            let vt = users.findIndex(u => u.id === idVal);
            if (vt > -1) {
                users[vt] = { ...users[vt], ...taiKhoanCapNhat };
                ghiCSDL('Users', users);
                alert("Cập nhật thông tin thành công! (Lưu ngoại tuyến)");
                dongHopThoai('admEditAccountModal');
                hienThiDanhSachTaiKhoan();
            }
        }
    });
}

// Hàm xóa tài khoản (sử dụng hộp thoại xác nhận tùy chỉnh)
function xoaTaiKhoan(idNguoiDung) {
    hienThiConfirmTuyBien(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>${idNguoiDung}</strong>?`, async () => {
        try {
            let response = await fetch(`${API_NGUOI_DUNG}/${idNguoiDung}`, { method: 'DELETE' });
            let data = await response.json();
            
            if (response.ok && data.success) {
                let users = layCSDL('Users').filter(u => u.id !== idNguoiDung);
                ghiCSDL('Users', users);
                alert("Xóa tài khoản thành công!");
                hienThiDanhSachTaiKhoan();
            } else {
                alert(data.message || "Xóa tài khoản thất bại!");
            }
        } catch (error) {
            // Xóa ngoại tuyến nếu mất kết nối server
            let users = layCSDL('Users').filter(u => u.id !== idNguoiDung);
            ghiCSDL('Users', users);
            alert("Xóa tài khoản thành công!");
            hienThiDanhSachTaiKhoan();
        }
    });
}

// ==========================================================================
// 3. ĐIỀU PHỐI LỚP HỌC (COORDINATOR ENGINE - DÀNH RIÊNG CHO ADMIN)
// TẤT CẢ CÁC HÀM ĐỀU CÓ CHÚ THÍCH TIẾNG VIỆT CHI TIẾT TỪNG DÒNG CÓ DẤU
// ==========================================================================

// Hàm khởi chạy nạp cấu hình điều phối khi Admin mở trang
function khoiTaoTabDieuPhoiLop() {
    thietLapLuaChonDieuPhoi(); // Đổ dữ liệu môn học, giảng viên vào form
    hienThiDanhSachLopDieuPhoi(); // Hiển thị danh sách các lớp hiện có
    hienThiNutBatTatCongDangKy(); // Hiển thị nút bật tắt cổng đăng ký tín chỉ
}

// Hàm tiện ích tạo danh sách các ngày học cụ thể trong khoảng thời gian lớp học phần
function taoDanhSachNgayHoc(startDateStr, endDateStr, dayText) {
    // Bản đồ ánh xạ thứ trong tuần sang số ngày của Date.getDay()
    let dayMap = { 'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6 };
    let targetDay = dayMap[dayText]; // Lấy thứ số tương ứng
    let results = []; // Mảng chứa kết quả các ngày học
    
    let partsStart = startDateStr.split('-'); // Tách ngày bắt đầu
    let partsEnd = endDateStr.split('-'); // Tách ngày kết thúc
    
    // Khởi tạo đối tượng Date cho ngày bắt đầu và ngày kết thúc
    let currentDate = new Date(partsStart[0], partsStart[1] - 1, partsStart[2]);
    let endDate = new Date(partsEnd[0], partsEnd[1] - 1, partsEnd[2]);
    
    // Vòng lặp chạy từ ngày bắt đầu đến ngày kết thúc
    while (currentDate <= endDate) { 
        // Nếu ngày hiện tại trùng với thứ học mong muốn
        if (currentDate.getDay() === targetDay) {
            let y = currentDate.getFullYear(); // Lấy năm
            let m = String(currentDate.getMonth() + 1).padStart(2, '0'); // Lấy tháng (cộng 1 vì bắt đầu từ 0)
            let d = String(currentDate.getDate()).padStart(2, '0'); // Lấy ngày và thêm số 0 nếu cần
            results.push(`${y}-${m}-${d}`); // Thêm chuỗi định dạng YYYY-MM-DD vào danh sách
        }
        currentDate.setDate(currentDate.getDate() + 1); // Tăng thêm 1 ngày
    }
    return results; // Trả về danh sách ngày học
}

// Hàm đổ dữ liệu danh mục môn học và giảng viên vào form tạo/sửa lớp điều phối
function thietLapLuaChonDieuPhoi() {
    let users = layCSDL('Users'); // Lấy danh sách người dùng từ LocalStorage
    let subjects = layCSDL('Subjects'); // Lấy danh sách môn học từ LocalStorage
    
    let formTao = document.forms['adminCreateClassForm']; // Lấy form tạo lớp học mới
    let formSua = document.forms['editClassForm']; // Lấy form sửa lớp học
    
    // Chuyển đổi môn học sang danh sách thẻ option HTML
    let optionsMon = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    // Lọc danh sách giảng viên và chuyển sang danh sách thẻ option HTML
    let optionsGV = users.filter(u => u.role === 'giang-vien').map(t => {
        return `<option value="${t.id}">${t.name}</option>`;
    }).join('');
    
    // Nếu form tạo lớp tồn tại thì đổ dữ liệu vào các thẻ select tương ứng
    if (formTao && formTao.elements['subId']) {
        formTao.elements['subId'].innerHTML = optionsMon;
        formTao.elements['teacherId'].innerHTML = optionsGV;
    }
    
    // Nếu form sửa lớp tồn tại thì đổ dữ liệu vào các thẻ select tương ứng
    if (formSua && formSua.elements['subId']) {
        formSua.elements['subId'].innerHTML = optionsMon;
        formSua.elements['teacherId'].innerHTML = optionsGV;
    }
}

// Hàm hiển thị danh sách toàn bộ các lớp học phần điều phối theo môn học
function hienThiDanhSachLopDieuPhoi() {
    let classes = layCSDL('Classes'); // Lấy danh sách lớp học từ LocalStorage
    let subjects = layCSDL('Subjects'); // Lấy danh sách môn học từ LocalStorage
    let users = layCSDL('Users'); // Lấy danh sách người dùng từ LocalStorage
    let container = document.getElementById('adminClassList'); // Vùng chứa danh sách lớp học phần
    
    if (!container) return; // Nếu không tìm thấy vùng chứa thì dừng hàm
    
    let htmlResult = ''; // Chuỗi chứa mã HTML kết quả
    // Lặp qua từng môn học để nhóm danh sách lớp học cho trực quan
    subjects.forEach(sub => {
        let classesOfSubject = classes.filter(c => c.subjectId === sub.id); // Lọc các lớp của môn học hiện tại
        if (classesOfSubject.length === 0) return; // Nếu môn này chưa có lớp nào thì bỏ qua
        
        // Thêm tiêu đề môn học
        htmlResult += `<h3 class="border-bottom mt-20 mb-10 text-primary font-bold">${sub.name}</h3>`;

        // Lặp qua từng lớp học của môn này để tạo HTML hiển thị
        classesOfSubject.forEach(c => {
            let tcName = users.find(u => u.id === c.teacherId)?.name || 'Chưa phân công'; // Lấy tên giảng viên phụ trách
            let displayClassName = layTenLopHienThi(c.id); // Lấy tên hiển thị rút gọn (ví dụ: WEB_L1)
            let timeStr = layThongTinTietHoc(c.startPeriod, c.endPeriod); // Lấy khoảng giờ học của tiết
            
            // Tạo mã HTML đại diện cho một lớp học phần kèm nút Sửa, Xóa
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
    
    // Đổ toàn bộ mã HTML vừa dựng vào vùng chứa, nếu trống thì hiển thị thông báo mặc định
    container.innerHTML = htmlResult || '<p style="padding: 20px;">Hệ thống chưa được thiết lập lớp học nào.</p>';
}

// Hàm đổ thông tin lớp chọn lên form sửa lớp và hiển thị modal
function suaThongTinLopDieuPhoi(idLop) {
    let targetClass = layCSDL('Classes').find(c => c.id === idLop); // Tìm lớp học tương ứng trong CSDL
    if (!targetClass) return; // Nếu không tìm thấy lớp học phần thì dừng
    
    let form = document.forms['editClassForm']; // Lấy form sửa lớp học phần
    form.elements['classId'].value = targetClass.id; // Gán mã ID lớp ẩn
    form.elements['subId'].value = targetClass.subjectId; // Gán môn học tương ứng
    form.elements['teacherId'].value = targetClass.teacherId; // Gán giảng viên tương ứng
    form.elements['room'].value = targetClass.room; // Gán phòng học
    form.elements['dayOfWeek'].value = targetClass.dayOfWeek; // Gán thứ học
    form.elements['startDate'].value = targetClass.startDate || ''; // Gán ngày bắt đầu
    form.elements['endDate'].value = targetClass.endDate || ''; // Gán ngày kết thúc
    form.elements['startPeriod'].value = targetClass.startPeriod; // Gán tiết bắt đầu
    form.elements['endPeriod'].value = targetClass.endPeriod; // Gán tiết kết thúc
    
    moHopThoai('admEditClassModal'); // Mở hộp thoại modal chỉnh sửa lớp học phần
}

// Hàm xóa lớp học phần điều phối
function xoaLopDieuPhoi(idLop) {
    hienThiConfirmTuyBien("Chắc chắn muốn xóa lớp học này cùng toàn bộ điểm và điểm danh?", () => {
        let classes = layCSDL('Classes').filter(c => c.id !== idLop);
        ghiCSDL('Classes', classes);
        hienThiDanhSachLopDieuPhoi();
    });
}

// Hàm mở xem chi tiết một lớp học phần để điều phối danh sách sinh viên hoặc buổi học
function moChiTietLopDieuPhoi(idLop, tenHienThi) {
    let elDetail = document.getElementById('admin-class-detail'); // Lấy phân vùng chi tiết lớp học
    if (!elDetail) return; // Nếu không tồn tại phân vùng thì dừng
    elDetail.dataset.classId = idLop; // Gán tạm mã lớp vào thuộc tính dataset để các hàm con đọc lại
    
    document.getElementById('admDetailClassName').textContent = `Chi tiết điều phối: ${tenHienThi}`; // Đổi tên tiêu đề hiển thị
    
    // Ẩn tất cả các tab nội dung chính trên màn hình Admin
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
    elDetail.style.display = 'block'; // Hiển thị tab chi tiết điều phối lớp học phần
    
    // Mặc định kích hoạt bấm chọn sub-tab hiển thị danh sách sinh viên ghi danh
    document.querySelector('[data-target="adm-sub-students"]').click();
    hienThiDanhSachSinhVienDieuPhoi(); // Gọi tải dữ liệu danh sách sinh viên lên giao diện
}

// Hàm hiển thị danh sách sinh viên ghi danh trong lớp để điều phối
function hienThiDanhSachSinhVienDieuPhoi() {
    let idLop = document.getElementById('admin-class-detail').dataset.classId; // Lấy mã ID lớp từ thuộc tính lưu trữ tạm
    let lop = layCSDL('Classes').find(c => c.id === idLop); // Tìm lớp học phần khớp mã ID
    let users = layCSDL('Users'); // Lấy danh sách người dùng trong hệ thống
    
    // Tạo mã HTML hàng bảng dữ liệu sinh viên trong lớp học phần
    let htmlContent = lop.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); // Tìm tài khoản sinh viên tương ứng
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
    
    let tbody = document.getElementById('admStudentList'); // Tìm phần thân bảng chứa danh sách sinh viên
    if (tbody) tbody.innerHTML = htmlContent || '<tr><td colspan="3">Lớp học trống sinh viên.</td></tr>'; // Nạp mã HTML hoặc thông báo trống
}

// Hàm thêm sinh viên thủ công vào lớp học phần bằng mã sinh viên định danh (MSSV)
function themSinhVienVaoLopDieuPhoi() {
    let idLop = document.getElementById('admin-class-detail').dataset.classId; // Lấy mã lớp học phần hiện tại
    let idSVDien = document.getElementById('addStuId').value.trim(); // Lấy giá trị mã định danh sinh viên nhập vào
    let users = layCSDL('Users'); // Lấy danh sách tài khoản người dùng
    
    // Kiểm tra xem MSSV này có tồn tại và đúng vai trò sinh viên hay không
    let checkSV = users.some(u => u.id === idSVDien && u.role === 'sinh-vien');
    if (!checkSV) { 
        alert("Mã sinh viên này không tồn tại trên hệ thống!"); // Báo lỗi nếu mã sinh viên không tồn tại
        return; 
    }
    
    // Thực hiện cập nhật thêm mã sinh viên vào lớp học phần và cập nhật bảng điểm
    capNhatLopCSDL(idLop, function(c) { 
        if (c.enrolledStudents.includes(idSVDien)) {
            alert("Sinh viên này đã học trong lớp!"); // Báo lỗi nếu đã ghi danh từ trước
        } else {
            c.enrolledStudents.push(idSVDien); // Thêm mã sinh viên mới vào mảng
            c.grades[idSVDien] = { cc: null, gk: null, ck: null }; // Khởi tạo các đầu điểm trống cho sinh viên này
            alert("Thêm sinh viên thành công!");
        }
    });
    
    // Làm sạch ô nhập liệu và cập nhật lại bảng danh sách sinh viên trên giao diện
    document.getElementById('addStuId').value = ''; 
    hienThiDanhSachSinhVienDieuPhoi();
}

// Hàm gỡ bỏ sinh viên khỏi lớp học phần
function xoaSinhVienKhoiLopDieuPhoi(idSinhVien) {
    hienThiConfirmTuyBien(`Xác nhận xóa sinh viên <strong>${idSinhVien}</strong> khỏi lớp học?`, () => {
        let idLop = document.getElementById('admin-class-detail').dataset.classId;
        capNhatLopCSDL(idLop, function(c) {
            c.enrolledStudents = c.enrolledStudents.filter(id => id !== idSinhVien);
            delete c.grades[idSinhVien];
        });
        hienThiDanhSachSinhVienDieuPhoi();
    });
}

// Hàm hiển thị danh sách các buổi học của lớp điều phối
function hienThiDanhSachBuoiHocDieuPhoi() {
    let idLop = document.getElementById('admin-class-detail').dataset.classId; // Lấy mã lớp hiện tại
    let lop = layCSDL('Classes').find(c => c.id === idLop); // Tìm lớp học phần trong CSDL
    
    // Tạo mã HTML hàng bảng danh sách buổi học
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
    
    let tbody = document.getElementById('admSessionList'); // Tìm phần thân bảng chứa danh sách buổi học
    if (tbody) tbody.innerHTML = htmlContent || '<tr><td colspan="3">Chưa có buổi học nào được tạo.</td></tr>'; // Nạp mã HTML hoặc báo trống
}

// Hàm đổ thông tin buổi học lên form và hiển thị modal để sửa đổi
function suaBuoiHocDieuPhoi(idBuoi) {
    let idLop = document.getElementById('admin-class-detail').dataset.classId; // Lấy mã lớp hiện tại
    let lop = layCSDL('Classes').find(c => c.id === idLop); // Tìm lớp học phần khớp mã ID
    let buoi = lop.sessions.find(s => s.id === idBuoi); // Tìm đối tượng buổi học cần sửa đổi
    
    let form = document.forms['editSessionForm']; // Lấy form sửa buổi học bổ sung
    form.elements['sessionId'].value = buoi.id; // Gán mã buổi học ẩn
    form.elements['sesDate'].value = buoi.date; // Gán ngày học hiện tại
    form.elements['sesStart'].value = buoi.startPeriod; // Gán tiết học bắt đầu
    form.elements['sesEnd'].value = buoi.endPeriod; // Gán tiết học kết thúc
    
    moHopThoai('admEditSessionModal'); // Bật hiển thị modal sửa thông tin buổi học
}

// Hàm xóa buổi học trong danh sách lớp điều phối
function xoaBuoiHocDieuPhoi(idBuoi) {
    hienThiConfirmTuyBien("Chắc chắn muốn xóa buổi học này?", () => {
        let idLop = document.getElementById('admin-class-detail').dataset.classId;
        capNhatLopCSDL(idLop, function(c) {
            c.sessions = c.sessions.filter(s => s.id !== idBuoi);
        });
        hienThiDanhSachBuoiHocDieuPhoi();
    });
}

// Hàm hiển thị nút Bật/Tắt cổng đăng ký trực tuyến tín chỉ
function hienThiNutBatTatCongDangKy() {
    let vungNut = document.getElementById('adminRegToggleContainer'); // Tìm vùng chứa nút
    if (!vungNut) return; // Nếu không tìm thấy thì dừng
    
    let dangMo = JSON.parse(localStorage.getItem('RegistrationOpen')); // Đọc trạng thái cổng từ LocalStorage
    // Nếu đang mở, tạo nút click để khóa
    if (dangMo) {
        vungNut.innerHTML = `<button class="btn-danger" style="width: auto;" onclick="thayDoiTrangThaiCongDangKy(false)">Cổng tín chỉ: ĐANG MỞ - Bấm để KHÓA</button>`;
    } else {
        // Nếu đang khóa, tạo nút click để mở
        vungNut.innerHTML = `<button class="btn-primary" style="width: auto;" onclick="thayDoiTrangThaiCongDangKy(true)">Cổng tín chỉ: ĐANG KHÓA - Bấm để MỞ</button>`;
    }
}

// Hàm thay đổi trạng thái cổng đăng ký tín chỉ trực tuyến toàn trường
function thayDoiTrangThaiCongDangKy(trangThai) {
    localStorage.setItem('RegistrationOpen', JSON.stringify(trangThai)); // Ghi trạng thái mới vào CSDL Local
    hienThiNutBatTatCongDangKy(); // Cập nhật lại giao diện nút tương ứng
}

// Hàm thiết lập toàn bộ sự kiện lắng nghe của các Form trong tab Điều phối lớp học
function khoiTaoLangNgheSuKienDieuPhoi() {
    // Lắng nghe sự kiện nộp biểu mẫu tạo lớp học mới
    let formTaoLop = document.getElementById('adminCreateClassForm');
    if (formTaoLop) {
        formTaoLop.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let formData = new FormData(e.target); // Đọc toàn bộ dữ liệu nhập vào từ form
            let subId = formData.get('subId'); // Lấy mã môn học
            let teacherId = formData.get('teacherId'); // Lấy mã giảng viên
            let room = formData.get('room'); // Lấy phòng học
            let dayOfWeek = formData.get('dayOfWeek'); // Lấy thứ học
            let startDate = formData.get('startDate'); // Lấy ngày bắt đầu khóa học
            let endDate = formData.get('endDate'); // Lấy ngày kết thúc khóa học
            let startPeriod = parseInt(formData.get('startPeriod')); // Lấy tiết học bắt đầu
            let endPeriod = parseInt(formData.get('endPeriod')); // Lấy tiết học kết thúc

            // Tiết bắt đầu bắt buộc phải nhỏ hơn hoặc bằng tiết kết thúc
            if (startPeriod > endPeriod) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }
            
            let classes = layCSDL('Classes'); // Lấy danh sách lớp học phần hiện có
            let subjects = layCSDL('Subjects'); // Lấy danh sách môn học
            let subjectAbbr = subjects.find(s => s.id === subId)?.abbr || 'CLASS'; // Lấy viết tắt môn học
            
            // Tạo mã ID lớp học phần mới rút gọn
            let newClassId = subjectAbbr + '_' + Date.now();
            // Lấy danh sách tất cả các ngày học trong kỳ khớp với thứ học phần
            let dsNgay = taoDanhSachNgayHoc(startDate, endDate, dayOfWeek);
            
            // Tạo mảng các buổi học dựa trên danh sách các ngày học được tính toán
            let sessions = dsNgay.map(dateStr => {
                return { 
                    id: 'SES_' + Date.now() + Math.random(), 
                    date: dateStr, 
                    startPeriod: startPeriod, 
                    endPeriod: endPeriod, 
                    attendance: {} 
                };
            });
            
            // Đẩy đối tượng lớp học phần mới hoàn chỉnh vào CSDL lớp học phần
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
            
            ghiCSDL('Classes', classes); // Ghi đè CSDL lớp học phần mới vào LocalStorage
            alert("Khởi tạo lớp học mới chuyên ngành CNTT thành công!"); 
            this.reset(); // Làm trống các ô nhập liệu trong form tạo lớp học
            hienThiDanhSachLopDieuPhoi(); // Tải lại danh sách lớp học phần
        });
    }

    // Lắng nghe sự kiện nộp biểu mẫu chỉnh sửa thông tin lớp học phần
    let formSuaLop = document.getElementById('editClassForm');
    if (formSuaLop) {
        formSuaLop.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let formData = new FormData(e.target); // Lấy dữ liệu sửa đổi từ form
            let classId = formData.get('classId'); // Lấy ID lớp sửa
            let startPeriod = parseInt(formData.get('startPeriod')); // Lấy tiết bắt đầu
            let endPeriod = parseInt(formData.get('endPeriod')); // Lấy tiết kết thúc

            if (startPeriod > endPeriod) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }

            let classes = layCSDL('Classes'); // Lấy danh sách lớp học phần
            let targetClass = classes.find(c => c.id === classId); // Tìm lớp học phần khớp ID
            
            // Kiểm tra xem lịch dạy lớp học phần có bị thay đổi thời gian học hay không
            let biThayDoiLich = targetClass.dayOfWeek !== formData.get('dayOfWeek') || 
                                targetClass.startDate !== formData.get('startDate') || 
                                targetClass.endDate !== formData.get('endDate') || 
                                targetClass.startPeriod !== startPeriod || 
                                targetClass.endPeriod !== endPeriod;

            // Tiến hành cập nhật các thông tin cơ bản của lớp học phần
            capNhatLopCSDL(classId, function(c) {
                c.subjectId = formData.get('subId'); 
                c.teacherId = formData.get('teacherId'); 
                c.room = formData.get('room'); 
                
                // Nếu lịch học thay đổi, tạo lại toàn bộ buổi học
                if (biThayDoiLich) {
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
            });
            
            alert("Đã cập nhật thông tin lớp học!"); 
            dongHopThoai('admEditClassModal'); // Ẩn hộp thoại modal chỉnh sửa lớp học
            this.reset(); // Làm trống form sửa lớp
            hienThiDanhSachLopDieuPhoi(); // Tải lại danh sách lớp học phần điều phối
        });
    }

    // Lắng nghe sự kiện nộp biểu mẫu tạo buổi học phần bổ sung (Makeup class)
    let formTaoBuoi = document.getElementById('adminCreateSessionForm');
    if (formTaoBuoi) {
        formTaoBuoi.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let idLop = document.getElementById('admin-class-detail').dataset.classId; // Lấy mã lớp học phần hiện tại
            let formData = new FormData(e.target); // Lấy thông tin buổi học bổ sung
            let start = parseInt(formData.get('sesStart')); // Lấy tiết học bắt đầu
            let end = parseInt(formData.get('sesEnd')); // Lấy tiết học kết thúc
            
            if (start > end) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }
            
            // Cập nhật bổ sung một buổi học mới vào mảng buổi học của lớp học phần
            capNhatLopCSDL(idLop, function(c) { 
                c.sessions.push({ 
                    id: 'SES_' + Date.now(), 
                    date: formData.get('sesDate'), 
                    startPeriod: start, 
                    endPeriod: end, 
                    attendance: {} 
                });
            });
            
            this.reset(); // Làm sạch ô nhập liệu trong form tạo buổi học bổ sung
            hienThiDanhSachBuoiHocDieuPhoi(); // Tải lại danh sách buổi học
        });
    }

    // Lắng nghe sự kiện nộp biểu mẫu chỉnh sửa thông tin buổi học bổ sung
    let formSuaBuoi = document.getElementById('editSessionForm');
    if (formSuaBuoi) {
        formSuaBuoi.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let idLop = document.getElementById('admin-class-detail').dataset.classId; // Lấy mã lớp hiện tại
            let formData = new FormData(e.target); // Lấy thông tin cập nhật
            let idBuoi = formData.get('sessionId'); // Lấy ID buổi học
            let start = parseInt(formData.get('sesStart')); // Tiết bắt đầu
            let end = parseInt(formData.get('sesEnd')); // Tiết kết thúc
            
            if (start > end) { 
                alert("Tiết học không hợp lệ!"); 
                return; 
            }
            
            // Tiến hành cập nhật thông tin buổi học tương ứng trong lớp học phần
            capNhatLopCSDL(idLop, function(c) { 
                let buoi = c.sessions.find(s => s.id === idBuoi); // Tìm buổi học khớp ID
                if (buoi) {
                    buoi.date = formData.get('sesDate'); // Cập nhật lại ngày học
                    buoi.startPeriod = start; // Cập nhật tiết học bắt đầu
                    buoi.endPeriod = end; // Cập nhật tiết học kết thúc
                } 
            });
            
            alert("Đã cập nhật thông tin buổi học!"); 
            dongHopThoai('admEditSessionModal'); // Ẩn modal sửa buổi học
            this.reset(); // Làm sạch form sửa buổi học
            hienThiDanhSachBuoiHocDieuPhoi(); // Tải lại danh sách các buổi học trên giao diện
        });
    }
}

// --------------------------------------------------------------------------
// 4. KHỞI CHẠY CORE ADMIN (BOOTSTRAP INTERFACE)
// --------------------------------------------------------------------------

// Hàm khởi chạy nạp cấu hình khi Admin đăng nhập thành công vào admin.html
function khoiTaoGiaoDienAdmin(adminUser) {
    // Đăng ký sự kiện lắng nghe của các Form trong tab Điều phối lớp học
    khoiTaoLangNgheSuKienDieuPhoi();
    
    // Gọi nạp danh sách điều phối lớp học và cổng đăng ký tín chỉ
    khoiTaoTabDieuPhoiLop();
    
    // Gọi nạp danh sách tài khoản sinh viên/giảng viên lên bảng quản lý
    hienThiDanhSachTaiKhoan();
}
