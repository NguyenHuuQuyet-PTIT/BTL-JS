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
// 2. TIỆN ÍCH DÙNG CHUNG
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

function switchSubTab(btnId, tabId, btnClassGroup, tabClassGroup) {
    document.querySelectorAll(btnClassGroup).forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll(tabClassGroup).forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.getElementById(btnId).classList.add('active');
    document.getElementById(tabId).style.display = 'block';
}

function initSidebarNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            document.querySelectorAll('.menu-item').forEach(menu => {
                menu.classList.remove('active');
            });
            this.classList.add('active');
            
            document.querySelectorAll('.tab-section').forEach(tab => {
                tab.style.display = 'none';
            });
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });
}

function handleLogout() {
    localStorage.removeItem('currentUser'); 
    window.location.href = 'index.html'; 
}

// ==========================================
// 3. KHỞI TẠO DỮ LIỆU BAN ĐẦU
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
                enrolledStudents: ['SV202501'], 
                sessions: [ 
                    { id: 'S1', date: '2026-06-01', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} } 
                ], 
                grades: { 'SV202501': { cc: 10, gk: 8, ck: 9 } } 
            }
        ]);
    }
}

initDB();