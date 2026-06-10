// Các hàm tiện ích
function getDB(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

const PERIOD_TIMES = { 1: "07:00-07:50", 2: "08:00-08:50", 3: "09:00-09:50", 4: "10:00-10:50", 5: "11:00-11:50", 6: "12:00-12:50", 7: "13:00-13:50", 8: "14:00-14:50", 9: "15:00-15:50", 10: "16:00-16:50", 11: "17:00-17:50", 12: "18:00-18:50" };
function getPeriodText(start, end) { return `Tiết ${start}-${end}`; }

function generateDates(startDate, endDate, dayOfWeekText) {
    const dayMap = {'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6};
    let targetDay = dayMap[dayOfWeekText];
    let resultDates = [];
    let current = new Date(startDate);
    let end = new Date(endDate);

    while (current <= end) {
        if (current.getDay() === targetDay) {
            resultDates.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
    }
    return resultDates;
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    const user = getDB('currentUser');
    if (!user || user.role !== 'admin') { 
        window.location.href = 'index.html'; 
        return; 
    }

    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            
            let targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active-tab'); 
            this.classList.add('active');
        });
    });

    initAdminLogic();
});

window.handleLogout = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };

let currentClassId = null;

// Nghiệp vụ Admin
function initAdminLogic() {
    setupAdminFormOptions();
    renderAdminClassList();
    
    // Tạo Lớp
    const createForm = document.getElementById('adminCreateClassForm');
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let classes = getDB('Classes');
            let subjects = getDB('Subjects');
            
            let subId = document.getElementById('admSub').value;
            let subject = subjects.find(s => s.id === subId);
            let abbr = subject ? subject.abbr : 'CLASS';
            
            let currentSubjectClasses = classes.filter(c => c.subjectId === subId).length;
            let newClassId = abbr + '_L' + (currentSubjectClasses + 1);

            let day = document.getElementById('admDay').value;
            let startDate = document.getElementById('admStartDate').value;
            let endDate = document.getElementById('admEndDate').value;
            let startPeriod = parseInt(document.getElementById('admStartPeriod').value);
            let endPeriod = parseInt(document.getElementById('admEndPeriod').value);

            if (startPeriod > endPeriod) {
                alert("Tiết bắt đầu không được lớn hơn tiết kết thúc!");
                return;
            }

            let dates = generateDates(startDate, endDate, day);
            let sessions = [];
            for (let d of dates) {
                sessions.push({ 
                    id: 'SES_' + Date.now() + Math.random(), 
                    date: d, 
                    startPeriod: startPeriod, 
                    endPeriod: endPeriod, 
                    attendance: {} 
                });
            }

            classes.push({
                id: newClassId, 
                subjectId: subId, 
                teacherId: document.getElementById('admTeacher').value,
                room: document.getElementById('admRoom').value, 
                dayOfWeek: day, 
                startDate: startDate, 
                endDate: endDate,
                startPeriod: startPeriod, 
                endPeriod: endPeriod, 
                enrolledStudents: [], 
                sessions: sessions, 
                grades: {}
            });

            setDB('Classes', classes);
            alert("Tạo lớp và sinh lịch tự động thành công!");
            this.reset();
            renderAdminClassList();
        });
    }

    // Sửa Lớp
    const editForm = document.getElementById('editClassForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let classes = getDB('Classes');
            let classId = document.getElementById('editClassId').value;
            let targetClass = classes.find(c => c.id === classId);

            if (targetClass) {
                let sPeriod = parseInt(document.getElementById('editClassStartPeriod').value);
                let ePeriod = parseInt(document.getElementById('editClassEndPeriod').value);

                if (sPeriod > ePeriod) {
                    alert("Tiết học không hợp lệ!");
                    return;
                }

                targetClass.subjectId = document.getElementById('editClassSub').value;
                targetClass.teacherId = document.getElementById('editClassTeacher').value;
                targetClass.room = document.getElementById('editClassRoom').value;
                targetClass.dayOfWeek = document.getElementById('editClassDay').value;
                targetClass.startDate = document.getElementById('editClassStartDate').value;
                targetClass.endDate = document.getElementById('editClassEndDate').value;
                targetClass.startPeriod = sPeriod;
                targetClass.endPeriod = ePeriod;

                if (confirm("Hệ thống sẽ làm mới lại toàn bộ danh sách buổi học theo khoảng thời gian mới. Chấp nhận?")) {
                    let dates = generateDates(targetClass.startDate, targetClass.endDate, targetClass.dayOfWeek);
                    let newSessions = [];
                    for (let d of dates) {
                        newSessions.push({ 
                            id: 'SES_' + Date.now() + Math.random(), 
                            date: d, 
                            startPeriod: sPeriod, 
                            endPeriod: ePeriod, 
                            attendance: {} 
                        });
                    }
                    targetClass.sessions = newSessions;
                    setDB('Classes', classes);
                    
                    alert("Cập nhật thành công!");
                    document.getElementById('admEditClassModal').style.display = 'none';
                    renderAdminClassList();
                }
            }
        });
    }

    // Sửa Buổi học Đơn lẻ
    const editSessionForm = document.getElementById('editSessionForm');
    if (editSessionForm) {
        editSessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let classes = getDB('Classes');
            let targetClass = classes.find(c => c.id === currentClassId);
            
            let sessionId = document.getElementById('editSessionId').value;
            let targetSession = targetClass.sessions.find(s => s.id === sessionId);

            if (targetSession) {
                let sPeriod = parseInt(document.getElementById('editSesStart').value);
                let ePeriod = parseInt(document.getElementById('editSesEnd').value);

                if (sPeriod > ePeriod) {
                    alert("Tiết học không hợp lệ!");
                    return;
                }

                targetSession.date = document.getElementById('editSesDate').value;
                targetSession.startPeriod = sPeriod;
                targetSession.endPeriod = ePeriod;

                setDB('Classes', classes);
                alert("Đã cập nhật buổi học!");
                document.getElementById('admEditSessionModal').style.display = 'none';
                adminRenderSessions();
            }
        });
    }
}

// SỬA LỖI Dropdown bị rỗng
function setupAdminFormOptions() {
    const users = getDB('Users');
    const subjects = getDB('Subjects');
    
    // Lấy đúng ID của các Form
    const createSub = document.getElementById('admSub');
    const createTeacher = document.getElementById('admTeacher');
    
    const editSub = document.getElementById('editClassSub');
    const editTeacher = document.getElementById('editClassTeacher');

    // Bơm danh sách Môn học
    if (createSub) createSub.innerHTML = '';
    if (editSub) editSub.innerHTML = '';
    
    for (let s of subjects) {
        let opt = `<option value="${s.id}">${s.name}</option>`;
        if (createSub) createSub.innerHTML += opt;
        if (editSub) editSub.innerHTML += opt;
    }

    // Bơm danh sách Giáo viên
    if (createTeacher) createTeacher.innerHTML = '';
    if (editTeacher) editTeacher.innerHTML = '';
    
    let teachers = users.filter(u => u.role === 'teacher');
    for (let t of teachers) {
        let opt = `<option value="${t.id}">${t.name}</option>`;
        if (createTeacher) createTeacher.innerHTML += opt;
        if (editTeacher) editTeacher.innerHTML += opt;
    }

    // Bảng danh sách User
    const usersList = document.getElementById('adminUsersList');
    if (usersList) {
        usersList.innerHTML = '';
        for (let u of users) {
            usersList.innerHTML += `<tr><td>${u.id}</td><td>${u.role.toUpperCase()}</td><td>${u.name}</td><td>${u.email}</td></tr>`;
        }
    }
}

function renderAdminClassList() {
    const classes = getDB('Classes');
    const subjects = getDB('Subjects');
    const users = getDB('Users');
    
    let container = document.getElementById('adminClassList');
    if (!container) return;

    let html = '';
    for (let c of classes) {
        let subject = subjects.find(s => s.id === c.subjectId);
        let teacher = users.find(u => u.id === c.teacherId);
        
        let subName = subject ? subject.name : 'Unknown';
        let tcName = teacher ? teacher.name : 'Unknown';

        html += `
            <div class="chart-box">
                <h3 class="text-primary cursor-pointer" onclick="adminOpenClass('${c.id}')">${subName} - ${c.id}</h3>
                <p class="mt-10">GV: ${tcName} | Phòng: ${c.room}</p>
                <p class="text-muted text-sm">Lịch: ${c.dayOfWeek} (${getPeriodText(c.startPeriod, c.endPeriod)})</p>
                <p class="font-bold mt-10">${c.enrolledStudents.length} SV | ${c.sessions.length} Buổi</p>
                
                <div class="flex-row mt-auto">
                    <button class="action-btn flex-1" onclick="adminEditClass('${c.id}')">Sửa thông tin</button>
                    <button class="btn-danger flex-1" onclick="adminDeleteClass('${c.id}')">Xóa lớp</button>
                </div>
            </div>`;
    }
    container.innerHTML = html || '<p>Hệ thống chưa có lớp học nào.</p>';
}

window.adminEditClass = function(id) {
    let targetClass = getDB('Classes').find(x => x.id === id);
    if (!targetClass) return;
    
    document.getElementById('editClassId').value = id;
    document.getElementById('editClassSub').value = targetClass.subjectId;
    document.getElementById('editClassTeacher').value = targetClass.teacherId;
    document.getElementById('editClassRoom').value = targetClass.room;
    document.getElementById('editClassDay').value = targetClass.dayOfWeek;
    document.getElementById('editClassStartDate').value = targetClass.startDate || '';
    document.getElementById('editClassEndDate').value = targetClass.endDate || '';
    document.getElementById('editClassStartPeriod').value = targetClass.startPeriod;
    document.getElementById('editClassEndPeriod').value = targetClass.endPeriod;
    
    document.getElementById('admEditClassModal').style.display = 'block';
};

window.adminDeleteClass = function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn lớp học này?")) {
        let classes = getDB('Classes');
        let filteredClasses = classes.filter(c => c.id !== id);
        setDB('Classes', filteredClasses);
        renderAdminClassList();
    }
};

window.adminOpenClass = function(id) {
    currentClassId = id;
    document.getElementById('admDetailClassName').textContent = "Quản lý chi tiết: " + id;
    
    document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
    document.getElementById('admin-class-detail').classList.add('active-tab');
    
    switchAdmSubTab('students');
};

window.switchAdmSubTab = function(tabName) {
    document.getElementById('adm-tab-students-btn').classList.remove('active');
    document.getElementById('adm-tab-sessions-btn').classList.remove('active');
    
    let activeBtnId = 'adm-tab-' + tabName + '-btn';
    document.getElementById(activeBtnId).classList.add('active');
    
    if (tabName === 'students') {
        document.getElementById('adm-sub-students').style.display = 'block';
        document.getElementById('adm-sub-sessions').style.display = 'none';
        adminRenderStudents();
    } else {
        document.getElementById('adm-sub-students').style.display = 'none';
        document.getElementById('adm-sub-sessions').style.display = 'block';
        adminRenderSessions();
    }
};

function adminRenderStudents() {
    let targetClass = getDB('Classes').find(x => x.id === currentClassId);
    let users = getDB('Users');
    let tbody = document.getElementById('admStudentList');
    
    let html = '';
    for (let studentId of targetClass.enrolledStudents) {
        let studentObj = users.find(x => x.id === studentId);
        if (studentObj) {
            html += `
                <tr>
                    <td>${studentObj.id}</td>
                    <td>${studentObj.name}</td>
                    <td>
                        <button class="btn-danger" onclick="adminRemoveStudent('${studentObj.id}')">Xóa</button>
                    </td>
                </tr>`;
        }
    }
    tbody.innerHTML = html || '<tr><td colspan="3">Lớp học trống.</td></tr>';
}

window.adminAddStudentToClass = function() {
    let studentId = document.getElementById('addStuId').value.trim();
    const users = getDB('Users');
    
    if (!users.some(u => u.id === studentId && u.role === 'student')) {
        alert("Mã sinh viên không hợp lệ!");
        return;
    }
    
    let classes = getDB('Classes');
    let targetClass = classes.find(x => x.id === currentClassId);
    
    if (targetClass.enrolledStudents.includes(studentId)) {
        alert("Sinh viên này đã tồn tại trong lớp!");
        return;
    }
    
    targetClass.enrolledStudents.push(studentId);
    setDB('Classes', classes);
    
    document.getElementById('addStuId').value = '';
    adminRenderStudents();
};

window.adminRemoveStudent = function(studentId) {
    let classes = getDB('Classes');
    let targetClass = classes.find(x => x.id === currentClassId);
    
    targetClass.enrolledStudents = targetClass.enrolledStudents.filter(sid => sid !== studentId);
    setDB('Classes', classes);
    
    adminRenderStudents();
};

function adminRenderSessions() {
    let targetClass = getDB('Classes').find(x => x.id === currentClassId);
    let tbody = document.getElementById('admSessionList');
    
    let html = '';
    for (let s of targetClass.sessions) {
        // SỬA LỖI: Bổ sung lại nút Sửa trong bảng
        html += `
            <tr>
                <td>${s.date}</td>
                <td>${getPeriodText(s.startPeriod, s.endPeriod)}</td>
                <td>
                    <button class="action-btn" onclick="adminOpenEditSession('${s.id}')">Sửa</button>
                    <button class="btn-danger" onclick="adminRemoveSession('${s.id}')">Xóa</button>
                </td>
            </tr>`;
    }
    tbody.innerHTML = html || '<tr><td colspan="3">Chưa có lịch các buổi học.</td></tr>';
}

window.adminCreateSingleSession = function() {
    let classes = getDB('Classes');
    let targetClass = classes.find(x => x.id === currentClassId);
    
    let sPeriod = parseInt(document.getElementById('aSesStart').value);
    let ePeriod = parseInt(document.getElementById('aSesEnd').value);
    
    if (sPeriod > ePeriod) {
        alert("Tiết học không hợp lệ!");
        return;
    }

    targetClass.sessions.push({ 
        id: 'SES_' + Date.now(), 
        date: document.getElementById('aSesDate').value, 
        startPeriod: sPeriod, 
        endPeriod: ePeriod, 
        attendance: {} 
    });
    
    setDB('Classes', classes);
    adminRenderSessions();
};

window.adminOpenEditSession = function(sessionId) {
    let classes = getDB('Classes');
    let targetClass = classes.find(x => x.id === currentClassId);
    let targetSession = targetClass.sessions.find(x => x.id === sessionId);
    
    document.getElementById('editSessionId').value = sessionId;
    document.getElementById('editSesDate').value = targetSession.date;
    document.getElementById('editSesStart').value = targetSession.startPeriod;
    document.getElementById('editSesEnd').value = targetSession.endPeriod;
    
    document.getElementById('admEditSessionModal').style.display = 'block';
};

window.adminRemoveSession = function(sessionId) {
    let classes = getDB('Classes');
    let targetClass = classes.find(x => x.id === currentClassId);
    
    targetClass.sessions = targetClass.sessions.filter(s => s.id !== sessionId);
    setDB('Classes', classes);
    
    adminRenderSessions();
};