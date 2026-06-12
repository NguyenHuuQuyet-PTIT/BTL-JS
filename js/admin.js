let currentClassId = null;

// ==========================================
// 1. KHỞI TẠO & MENU
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const user = getDB('currentUser');
    if (!user || user.role !== 'admin') { window.location.href = 'index.html'; return; }
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    
    initSidebarNavigation();
    setupAdminFormOptions();
    renderAdminClassList();
});

const generateDates = (startD, endD, dayText) => {
    const dayMap = {'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6};
    let targetDay = dayMap[dayText], res = [], curr = new Date(startD), end = new Date(endD);
    while (curr <= end) { if (curr.getDay() === targetDay) res.push(curr.toISOString().split('T')[0]); curr.setDate(curr.getDate() + 1); }
    return res;
};

// ==========================================
// 2. QUẢN LÝ LỚP HỌC CHÍNH
// ==========================================
document.getElementById('adminCreateClassForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    let data = Object.fromEntries(new FormData(e.target));
    let startP = parseInt(data.startPeriod), endP = parseInt(data.endPeriod);

    if (startP > endP) return alert("Tiết không hợp lệ!");
    
    let classes = getDB('Classes'), subjects = getDB('Subjects');
    let dates = generateDates(data.startDate, data.endDate, data.dayOfWeek);
    
    classes.push({
        id: (subjects.find(s => s.id === data.subId)?.abbr || 'CLASS') + '_L' + (classes.filter(c => c.subjectId === data.subId).length + 1),
        subjectId: data.subId, teacherId: data.teacherId, room: data.room, dayOfWeek: data.dayOfWeek,
        startDate: data.startDate, endDate: data.endDate, startPeriod: startP, endPeriod: endP, enrolledStudents: [], 
        sessions: dates.map(d => ({ id: 'SES_' + Date.now() + Math.random(), date: d, startPeriod: startP, endPeriod: endP, attendance: {} })), grades: {}
    });
    setDB('Classes', classes); alert("Tạo lớp thành công!"); this.reset(); renderAdminClassList();
});

document.getElementById('editClassForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    let data = Object.fromEntries(new FormData(e.target));
    let sP = parseInt(data.startPeriod), eP = parseInt(data.endPeriod);
    if (sP > eP) return alert("Tiết không hợp lệ!");

    updateClassDB(data.classId, c => {
        Object.assign(c, { subjectId: data.subId, teacherId: data.teacherId, room: data.room, dayOfWeek: data.dayOfWeek, startDate: data.startDate, endDate: data.endDate, startPeriod: sP, endPeriod: eP });
        if (confirm("Làm mới lịch học theo ngày/tiết mới?")) {
            let dates = generateDates(c.startDate, c.endDate, c.dayOfWeek);
            c.sessions = dates.map(d => ({ id: 'SES_'+Date.now()+Math.random(), date: d, startPeriod: sP, endPeriod: eP, attendance: {} }));
        }
    });
    alert("Đã sửa thông tin!"); this.closest('.modal').style.display = 'none'; this.reset(); renderAdminClassList();
});

function setupAdminFormOptions() {
    const users = getDB('Users'), subjects = getDB('Subjects');
    const cSub = document.getElementById('admSub'), cTc = document.getElementById('admTeacher');
    const eSub = document.getElementById('editClassSub'), eTc = document.getElementById('editClassTeacher');
    
    if (cSub && cTc) {
        cSub.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        cTc.innerHTML = users.filter(u => u.role === 'teacher').map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        if(eSub) { eSub.innerHTML = cSub.innerHTML; eTc.innerHTML = cTc.innerHTML; }
    }
    
    const usersList = document.getElementById('adminUsersList');
    if (usersList) usersList.innerHTML = users.map(u => `<tr><td>${u.id}</td><td>${u.role.toUpperCase()}</td><td>${u.name}</td><td>${u.email}</td></tr>`).join('');
}

function renderAdminClassList() {
    const classes = getDB('Classes'), subjects = getDB('Subjects'), users = getDB('Users');
    let container = document.getElementById('adminClassList'); if (!container) return;
    
    container.innerHTML = classes.map(c => {
        let { id, subjectId, teacherId, room, dayOfWeek, startPeriod, endPeriod, enrolledStudents, sessions } = c;
        let subName = subjects.find(s => s.id === subjectId)?.name || 'Unknown', tcName = users.find(u => u.id === teacherId)?.name || 'Unknown';

        return `
            <div class="border-box border-left-dark cursor-pointer flex-col" onclick="adminOpenClass('${id}')">
                <h3 class="text-primary">${subName} - ${id}</h3>
                <p class="mt-10 text-sm text-muted">GV: <span class="font-bold">${tcName}</span> | P.${room}</p>
                <p class="text-sm mt-10">Lịch: ${dayOfWeek} (${getPeriodText(startPeriod, endPeriod)})</p>
                
                <div class="mt-auto pt-10">
                    <p class="font-bold mb-10 text-success">${enrolledStudents.length} SV | ${sessions.length} Buổi</p>
                    <div class="flex-row">
                        <button class="action-btn flex-1" onclick="event.stopPropagation(); adminEditClass('${id}')">Sửa</button>
                        <button class="btn-danger flex-1" onclick="event.stopPropagation(); adminDeleteClass('${id}')">Xóa</button>
                    </div>
                </div>
            </div>`;
    }).join('') || '<p>Chưa có lớp học nào.</p>';
}

window.adminEditClass = id => {
    let t = getDB('Classes').find(x => x.id === id); if (!t) return;
    ['editClassId', 'editClassSub', 'editClassTeacher', 'editClassRoom', 'editClassDay', 'editClassStartDate', 'editClassEndDate', 'editClassStartPeriod', 'editClassEndPeriod']
        .forEach(k => document.getElementById(k).value = t[k.replace('editClass', '').charAt(0).toLowerCase() + k.replace('editClass', '').slice(1)] || id);
    document.getElementById('admEditClassModal').style.display = 'block';
};

window.adminDeleteClass = id => { if (confirm("Xóa lớp học này?")) { setDB('Classes', getDB('Classes').filter(c => c.id !== id)); renderAdminClassList(); } };

window.adminOpenClass = id => {
    currentClassId = id; document.getElementById('admDetailClassName').textContent = "Quản lý chi tiết: " + id;
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none'); document.getElementById('admin-class-detail').style.display = 'block';
    switchAdmSubTab('students');
};

// ==========================================
// 3. CHI TIẾT (SINH VIÊN & BUỔI HỌC)
// ==========================================
window.switchAdmSubTab = tab => {
    switchSubTab('adm-tab-'+tab+'-btn', 'adm-sub-'+tab, '.adm-sub-btn', '.adm-sub-tab');
    tab === 'students' ? adminRenderStudents() : adminRenderSessions();
};

function adminRenderStudents() {
    let tClass = getDB('Classes').find(x => x.id === currentClassId), users = getDB('Users');
    document.getElementById('admStudentList').innerHTML = tClass.enrolledStudents.map(id => {
        let u = users.find(x => x.id === id); 
        return u ? `<tr><td>${u.id}</td><td>${u.name}</td><td><button class="btn-danger" onclick="adminRemoveStudent('${u.id}')">Xóa</button></td></tr>` : '';
    }).join('') || '<tr><td colspan="3">Lớp học trống.</td></tr>';
}

window.adminAddStudentToClass = () => {
    let sId = document.getElementById('addStuId').value.trim();
    if (!getDB('Users').some(u => u.id === sId && u.role === 'student')) return alert("Mã SV không tồn tại!");
    updateClassDB(currentClassId, c => { c.enrolledStudents.includes(sId) ? alert("Đã có trong lớp!") : c.enrolledStudents.push(sId); });
    document.getElementById('addStuId').value = ''; adminRenderStudents();
};

window.adminRemoveStudent = sId => { updateClassDB(currentClassId, c => c.enrolledStudents = c.enrolledStudents.filter(id => id !== sId)); adminRenderStudents(); };

function adminRenderSessions() {
    let c = getDB('Classes').find(x => x.id === currentClassId);
    document.getElementById('admSessionList').innerHTML = c.sessions.map(s => `
        <tr><td>${s.date}</td><td>${getPeriodText(s.startPeriod, s.endPeriod)}</td>
        <td><button class="action-btn" onclick="adminOpenEditSession('${s.id}')">Sửa</button> <button class="btn-danger" onclick="adminRemoveSession('${s.id}')">Xóa</button></td></tr>
    `).join('') || '<tr><td colspan="3">Chưa xếp buổi.</td></tr>';
}

document.getElementById('adminCreateSessionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    let data = Object.fromEntries(new FormData(e.target)), sP = parseInt(data.sesStart), eP = parseInt(data.sesEnd);
    if(sP > eP) return alert("Tiết không hợp lệ!");
    updateClassDB(currentClassId, c => c.sessions.push({ id: 'SES_'+Date.now(), date: data.sesDate, startPeriod: sP, endPeriod: eP, attendance: {} }));
    this.reset(); adminRenderSessions();
});

window.adminOpenEditSession = sId => {
    let s = getDB('Classes').find(x => x.id === currentClassId).sessions.find(x => x.id === sId);
    document.getElementById('editSessionId').value = sId; document.getElementById('editSesDate').value = s.date;
    document.getElementById('editSesStart').value = s.startPeriod; document.getElementById('editSesEnd').value = s.endPeriod;
    document.getElementById('admEditSessionModal').style.display = 'block';
};

document.getElementById('editSessionForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    let data = Object.fromEntries(new FormData(e.target)), sP = parseInt(data.sesStart), eP = parseInt(data.sesEnd);
    if (sP > eP) return alert("Tiết không hợp lệ!");
    updateClassDB(currentClassId, c => { let s = c.sessions.find(x => x.id === data.sessionId); if(s) Object.assign(s, { date: data.sesDate, startPeriod: sP, endPeriod: eP }); });
    alert("Cập nhật thành công!"); this.closest('.modal').style.display = 'none'; this.reset(); adminRenderSessions();
});

window.adminRemoveSession = sId => { updateClassDB(currentClassId, c => c.sessions = c.sessions.filter(s => s.id !== sId)); adminRenderSessions(); };