let currentClassId = null;

// ==========================================
// 1. KHỞI TẠO & HIỂN THỊ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let user = getDB('currentUser');
    
    if (!user || user.role !== 'admin') { 
        window.location.href = 'index.html'; 
        return; 
    }
    
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = user.name;
    });
    
    initSidebarNavigation();
    setupAdminFormOptions();
    renderAdminClassList();
});

function generateDates(startDateStr, endDateStr, dayText) {
    let dayMap = { 'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6 };
    let targetDay = dayMap[dayText];
    let results = [];
    
    let currentDate = new Date(startDateStr);
    let endDate = new Date(endDateStr);
    
    while (currentDate <= endDate) { 
        if (currentDate.getDay() === targetDay) {
            results.push(currentDate.toLocaleDateString('en-CA')); 
        }
        currentDate.setDate(currentDate.getDate() + 1); 
    }
    return results;
}

function setupAdminFormOptions() {
    let users = getDB('Users');
    let subjects = getDB('Subjects');
    
    let createForm = document.forms['adminCreateClassForm'];
    let editForm = document.forms['editClassForm'];
    
    if (createForm && createForm.elements['subId']) {
        let subOptions = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        let teacherOptions = users.filter(u => u.role === 'teacher').map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        
        createForm.elements['subId'].innerHTML = subOptions;
        createForm.elements['teacherId'].innerHTML = teacherOptions;
        
        if (editForm && editForm.elements['subId']) {
            editForm.elements['subId'].innerHTML = subOptions;
            editForm.elements['teacherId'].innerHTML = teacherOptions;
        }
    }
    
    let usersListTable = document.getElementById('adminUsersList');
    if (usersListTable) {
        usersListTable.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.role.toUpperCase()}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
            </tr>
        `).join('');
    }
}

// ==========================================
// 2. LOGIC LỚP HỌC (TẠO / SỬA / XÓA)
// ==========================================
let createClassForm = document.getElementById('adminCreateClassForm');
if (createClassForm) {
    createClassForm.addEventListener('submit', function(e) {
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
            alert("Tiết bắt đầu không được lớn hơn tiết kết thúc!");
            return;
        }
        
        let classes = getDB('Classes');
        let subjects = getDB('Subjects');
        let subjectAbbr = subjects.find(s => s.id === subId)?.abbr || 'CLASS';
        
        // Sinh số ngẫu nhiên 4 chữ số chống trùng ID
        let randomNumber = Math.floor(1000 + Math.random() * 9000);
        let newClassId = subjectAbbr + '_' + randomNumber;
        
        let generatedDates = generateDates(startDate, endDate, dayOfWeek);
        let newSessions = generatedDates.map(dateStr => {
            return { 
                id: 'SES_' + Date.now() + Math.random(), 
                date: dateStr, 
                startPeriod: startPeriod, 
                endPeriod: endPeriod, 
                attendance: {} 
            };
        });
        
        let newClassObj = {
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
            sessions: newSessions, 
            grades: {}
        };
        
        classes.push(newClassObj);
        setDB('Classes', classes); 
        
        alert("Tạo lớp học thành công!"); 
        this.reset(); 
        renderAdminClassList();
    });
}

function renderAdminClassList() {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    let container = document.getElementById('adminClassList'); 
    
    if (!container) return;
    
    let htmlContent = classes.map(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || 'Unknown';
        let tcName = users.find(u => u.id === c.teacherId)?.name || 'Unknown';

        return `
            <div class="border-box border-left-dark cursor-pointer" onclick="adminOpenClass('${c.id}')">
                <h3 class="text-primary">${subName} - ${c.id}</h3>
                <p class="mt-10 text-sm text-muted">GV: <span class="font-bold">${tcName}</span> | P.${c.room}</p>
                <p class="text-sm mt-10">Lịch: ${c.dayOfWeek} (${getPeriodText(c.startPeriod, c.endPeriod)})</p>
                
                <div class="mt-auto pt-10">
                    <p class="font-bold mb-10 text-success">${c.enrolledStudents.length} SV | ${c.sessions.length} Buổi</p>
                    <div class="flex-row">
                        <button class="action-btn flex-1" onclick="event.stopPropagation(); adminEditClass('${c.id}')">Sửa</button>
                        <button class="btn-danger flex-1" onclick="event.stopPropagation(); adminDeleteClass('${c.id}')">Xóa</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = htmlContent || '<p>Chưa có lớp học nào.</p>';
}

function adminEditClass(id) {
    let targetClass = getDB('Classes').find(c => c.id === id); 
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
    
    document.getElementById('admEditClassModal').style.display = 'block';
}

let editClassForm = document.getElementById('editClassForm');
if (editClassForm) {
    editClassForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let formData = new FormData(e.target);
        let classId = formData.get('classId');
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

        updateClassDB(classId, function(c) {
            c.subjectId = subId; 
            c.teacherId = teacherId; 
            c.room = room; 
            c.dayOfWeek = dayOfWeek; 
            c.startDate = startDate; 
            c.endDate = endDate; 
            c.startPeriod = startPeriod; 
            c.endPeriod = endPeriod;
            
            if (confirm("Làm mới lịch học theo ngày và tiết học mới?")) {
                let generatedDates = generateDates(c.startDate, c.endDate, c.dayOfWeek);
                c.sessions = generatedDates.map(dateStr => {
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
        this.closest('.modal').style.display = 'none'; 
        this.reset(); 
        renderAdminClassList();
    });
}

function adminDeleteClass(id) { 
    if (confirm("Bạn có chắc chắn muốn xóa lớp học này?")) { 
        let classes = getDB('Classes').filter(c => c.id !== id);
        setDB('Classes', classes); 
        renderAdminClassList(); 
    } 
}

function adminOpenClass(id) {
    currentClassId = id; 
    document.getElementById('admDetailClassName').textContent = "Quản lý chi tiết: " + id;
    
    document.querySelectorAll('.tab-section').forEach(t => {
        t.style.display = 'none';
    });
    
    document.getElementById('admin-class-detail').style.display = 'block';
    switchAdmSubTab('students');
}

// ==========================================
// 3. CHI TIẾT LỚP (SINH VIÊN & BUỔI HỌC)
// ==========================================
function switchAdmSubTab(tabName) {
    switchSubTab('adm-tab-' + tabName + '-btn', 'adm-sub-' + tabName, '.adm-sub-btn', '.adm-sub-tab');
    if (tabName === 'students') {
        adminRenderStudents();
    } else {
        adminRenderSessions();
    }
}

function adminRenderStudents() {
    let currentClassObj = getDB('Classes').find(c => c.id === currentClassId);
    let users = getDB('Users');
    
    let htmlContent = currentClassObj.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (stu) {
            return `
                <tr>
                    <td>${stu.id}</td>
                    <td>${stu.name}</td>
                    <td><button class="btn-danger" onclick="adminRemoveStudent('${stu.id}')">Xóa</button></td>
                </tr>
            `;
        }
        return '';
    }).join('');
    
    document.getElementById('admStudentList').innerHTML = htmlContent || '<tr><td colspan="3">Lớp học trống.</td></tr>';
}

function adminAddStudentToClass() {
    let studentIdInput = document.getElementById('addStuId').value.trim();
    let users = getDB('Users');
    
    let isStudentValid = users.some(u => u.id === studentIdInput && u.role === 'student');
    if (!isStudentValid) {
        alert("Mã Sinh viên không tồn tại trong hệ thống!");
        return;
    }
    
    updateClassDB(currentClassId, function(c) { 
        if (c.enrolledStudents.includes(studentIdInput)) {
            alert("Sinh viên này đã có trong lớp!");
        } else {
            c.enrolledStudents.push(studentIdInput); 
        }
    });
    
    document.getElementById('addStuId').value = ''; 
    adminRenderStudents();
}

function adminRemoveStudent(studentId) { 
    updateClassDB(currentClassId, function(c) {
        c.enrolledStudents = c.enrolledStudents.filter(id => id !== studentId);
    });
    adminRenderStudents(); 
}

function adminRenderSessions() {
    let currentClassObj = getDB('Classes').find(c => c.id === currentClassId);
    
    let htmlContent = currentClassObj.sessions.map(s => {
        return `
            <tr>
                <td>${s.date}</td>
                <td>${getPeriodText(s.startPeriod, s.endPeriod)}</td>
                <td>
                    <button class="action-btn" onclick="adminOpenEditSession('${s.id}')">Sửa</button> 
                    <button class="btn-danger" onclick="adminRemoveSession('${s.id}')">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('admSessionList').innerHTML = htmlContent || '<tr><td colspan="3">Chưa có buổi học nào được lên lịch.</td></tr>';
}

let createSessionForm = document.getElementById('adminCreateSessionForm');
if (createSessionForm) {
    createSessionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let formData = new FormData(e.target);
        let sesDate = formData.get('sesDate');
        let startPeriod = parseInt(formData.get('sesStart'));
        let endPeriod = parseInt(formData.get('sesEnd'));
        
        if (startPeriod > endPeriod) {
            alert("Tiết học không hợp lệ!");
            return;
        }
        
        updateClassDB(currentClassId, function(c) { 
            c.sessions.push({ 
                id: 'SES_' + Date.now(), 
                date: sesDate, 
                startPeriod: startPeriod, 
                endPeriod: endPeriod, 
                attendance: {} 
            });
        });
        
        this.reset(); 
        adminRenderSessions();
    });
}

function adminOpenEditSession(sessionId) {
    let currentClassObj = getDB('Classes').find(c => c.id === currentClassId);
    let targetSession = currentClassObj.sessions.find(s => s.id === sessionId);
    
    let form = document.forms['editSessionForm'];
    form.elements['sessionId'].value = targetSession.id;
    form.elements['sesDate'].value = targetSession.date;
    form.elements['sesStart'].value = targetSession.startPeriod;
    form.elements['sesEnd'].value = targetSession.endPeriod;
    
    document.getElementById('admEditSessionModal').style.display = 'block';
}

let editSessionForm = document.getElementById('editSessionForm');
if (editSessionForm) {
    editSessionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let formData = new FormData(e.target);
        let sessionId = formData.get('sessionId');
        let sesDate = formData.get('sesDate');
        let startPeriod = parseInt(formData.get('sesStart'));
        let endPeriod = parseInt(formData.get('sesEnd'));
        
        if (startPeriod > endPeriod) {
            alert("Tiết học không hợp lệ!");
            return;
        }
        
        updateClassDB(currentClassId, function(c) { 
            let targetSession = c.sessions.find(s => s.id === sessionId); 
            if (targetSession) {
                targetSession.date = sesDate;
                targetSession.startPeriod = startPeriod;
                targetSession.endPeriod = endPeriod;
            } 
        });
        
        alert("Cập nhật buổi học thành công!"); 
        this.closest('.modal').style.display = 'none'; 
        this.reset(); 
        adminRenderSessions();
    });
}

function adminRemoveSession(sessionId) { 
    updateClassDB(currentClassId, function(c) {
        c.sessions = c.sessions.filter(s => s.id !== sessionId);
    });
    adminRenderSessions(); 
}