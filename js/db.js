// ==========================================
// 1. CƠ SỞ DỮ LIỆU & TRUY XUẤT
// ==========================================
function getDB(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setDB(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function updateClassDB(classId, updateFunction) {
    let classes = getDB('Classes');
    let targetClass = classes.find(c => c.id === classId);
    
    if (targetClass) { 
        updateFunction(targetClass, classes); 
        setDB('Classes', classes); 
    }
}

// ==========================================
// 2. TIỆN ÍCH DÙNG CHUNG (HELPER)
// ==========================================
const PERIOD_TIMES = { 
    1: "07:00-07:50", 2: "08:00-08:50", 3: "09:00-09:50", 4: "10:00-10:50", 
    5: "11:00-11:50", 6: "12:00-12:50", 7: "13:00-13:50", 8: "14:00-14:50", 
    9: "15:00-15:50", 10: "16:00-16:50", 11: "17:00-17:50", 12: "18:00-18:50" 
};

function getPeriodText(start, end) {
    let startTime = PERIOD_TIMES[start].split("-")[0];
    let endTime = PERIOD_TIMES[end].split("-")[1];
    return `Tiết ${start}-${end} (${startTime} - ${endTime})`;
}

// Tách logic tính điểm để code HTML gọn gàng hơn
function calcAvgScore(cc, gk, ck) {
    if (cc === null || cc === "" || gk === null || gk === "" || ck === null || ck === "") return null;
    return parseFloat((parseFloat(cc) * 0.2 + parseFloat(gk) * 0.3 + parseFloat(ck) * 0.5).toFixed(1));
}

function getRankHtml(score) {
    if (score === null) return '<span class="text-muted">--</span>';
    if (score >= 9.0) return '<span style="color: #9C27B0; font-weight: bold;">Xuất sắc</span>';
    if (score >= 8.0) return '<span class="text-primary font-bold">Giỏi</span>';
    if (score >= 6.5) return '<span class="text-success font-bold">Khá</span>';
    if (score >= 5.0) return '<span class="text-warning font-bold">Trung bình</span>';
    return '<span class="text-danger font-bold">Yếu</span>';
}

function getAttendanceHtml(status) {
    if (status === 'present') return '<span class="text-success font-bold">Có mặt</span>';
    if (status === 'late') return '<span class="text-warning font-bold">Đi muộn</span>';
    if (status === 'absent') return '<span class="text-danger font-bold">Vắng mặt</span>';
    return '<span class="text-muted">Chưa điểm danh</span>';
}

function handleLogout() {
    localStorage.removeItem('currentUser'); 
    window.location.href = 'index.html'; 
}

// ==========================================
// 3. QUẢN LÝ GIAO DIỆN CHUNG (MODAL, TAB, HỒ SƠ)
// ==========================================
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function initCommonUI() {
    // 1. Đóng Modal tự động
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // 2. Chuyển Tab Sidebar
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-section').forEach(tab => tab.style.display = 'none');
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });

    // 3. Chuyển Tab Phụ (Sub-menu) - Dùng chung cho cả 3 trang
    document.querySelectorAll('.sub-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let parentMenu = this.closest('.sub-menu');
            parentMenu.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            let container = parentMenu.parentElement;
            container.querySelectorAll('.sub-tab-content').forEach(tab => tab.style.display = 'none');
            
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });
}

// Dùng chung cho cả Sinh viên và Giáo viên
function initProfileUI(user) {
    let profContainer = document.getElementById('profile-tab');
    if (!profContainer) return; // Nếu trang Admin thì bỏ qua

    document.getElementById('profId').textContent = user.id; 
    document.getElementById('profDob').textContent = user.dob ? user.dob.split('-').reverse().join('/') : 'Chưa cập nhật';
    document.getElementById('profPhone').textContent = user.phone || 'Chưa cập nhật';
    
    let formContainer = document.getElementById('editProfileFormContainer');
    let editForm = document.getElementById('editProfileForm');

    document.getElementById('btnShowEditProfile').addEventListener('click', () => { 
        editForm.elements['phone'].value = user.phone || ''; 
        editForm.elements['dob'].value = user.dob || ''; 
        formContainer.style.display = 'block'; 
    });
    
    document.getElementById('btnCancelEditProfile').addEventListener('click', () => { 
        formContainer.style.display = 'none'; 
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        let formData = new FormData(e.target);
        let newPassword = formData.get('password').trim();
        
        if (newPassword !== '') user.password = newPassword;
        user.phone = formData.get('phone').trim();
        user.dob = formData.get('dob');
        
        localStorage.setItem('currentUser', JSON.stringify(user)); 
        
        let users = getDB('Users');
        let userIndex = users.findIndex(u => u.id === user.id); 
        if (userIndex > -1) {
            users[userIndex] = user; 
            setDB('Users', users);
        }
        
        alert("Cập nhật thông tin cá nhân thành công!"); 
        
        // Cập nhật giao diện không cần load lại trang
        document.getElementById('profDob').textContent = user.dob.split('-').reverse().join('/');
        document.getElementById('profPhone').textContent = user.phone;
        formContainer.style.display = 'none';
        editForm.reset();
    });
}

// ==========================================
// 4. KHỞI TẠO DỮ LIỆU BAN ĐẦU
// ==========================================
function initDB() {
    let users = getDB('Users');
    
    if (!users.some(u => u.role === 'admin') && users.length > 0) {
        localStorage.removeItem('Users');
        localStorage.removeItem('Subjects');
        localStorage.removeItem('Classes');
    }

    if (!localStorage.getItem('Users')) {
        setDB('Users', [
            { id: 'ADMIN', role: 'admin', name: 'Giáo vụ Hệ thống', email: 'admin@gmail.com', password: '123' },
            { id: 'GV001', role: 'teacher', name: 'ThS. Trần Thị B', email: 'gv1@gmail.com', password: '123', dob: '1985-05-10', phone: '0988111222' },
            { id: 'GV002', role: 'teacher', name: 'TS. Trần Văn C', email: 'gv2@gmail.com', password: '123', dob: '1975-08-22', phone: '0988333444' },
            { id: 'SV202501', role: 'student', name: 'Nguyễn Văn An', email: 'sv1@gmail.com', password: '123', dob: '2005-01-15', phone: '0901000001' },
            { id: 'SV202502', role: 'student', name: 'Trần Thị Bé', email: 'sv2@gmail.com', password: '123', dob: '2005-02-20', phone: '0901000002' }
        ]);
    }
    
    if (!localStorage.getItem('Subjects')) {
        setDB('Subjects', [ 
            { id: 'SUB01', name: 'Lập trình Web', abbr: 'WEB' }, 
            { id: 'SUB02', name: 'Cấu trúc dữ liệu', abbr: 'CTDL' }, 
            { id: 'SUB03', name: 'Cơ sở dữ liệu', abbr: 'CSDL' } 
        ]);
    }
    
    if (!localStorage.getItem('Classes')) {
        setDB('Classes', [
            { 
                id: 'WEB_8273', 
                subjectId: 'SUB01', 
                teacherId: 'GV001', 
                room: 'A101', 
                dayOfWeek: 'Thứ 2', 
                startDate: '2026-06-01', 
                endDate: '2026-07-31', 
                startPeriod: 1, 
                endPeriod: 3, 
                enrolledStudents: ['SV202501', 'SV202502'], 
                sessions: [ 
                    { id: 'S1', date: '2026-06-01', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present', 'SV202502': 'late'} } 
                ], 
                grades: { 
                    'SV202501': { cc: 10, gk: 8, ck: 9 },
                    'SV202502': { cc: null, gk: null, ck: null } 
                } 
            }
        ]);
    }
}

initDB();