function generateDates(startD, endD, dayText) {
    const dayMap = {'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6};
    let targetDay = dayMap[dayText], res = [], curr = new Date(startD), end = new Date(endD);
    while (curr <= end) { if (curr.getDay() === targetDay) res.push(curr.toISOString().split('T')[0]); curr.setDate(curr.getDate() + 1); }
    return res;
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getDB('currentUser');
    if (!user || user.role !== 'admin') { window.location.href = 'index.html'; return; }
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);

    // Click menu logic chuẩn
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });
    initAdminLogic();
});

window.handleLogout = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };

let currentClassId = null;

function initAdminLogic() {
    setupAdminFormOptions();
    renderAdminClassList();
    
    document.getElementById('adminCreateClassForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        let classes = getDB('Classes'); let subjects = getDB('Subjects');
        let subId = document.getElementById('admSub').value;
        let startP = parseInt(document.getElementById('admStartPeriod').value);
        let endP = parseInt(document.getElementById('admEndPeriod').value);

        if (startP > endP) return alert("Tiết bắt đầu không được lớn hơn tiết kết thúc!");
        let dates = generateDates(document.getElementById('admStartDate').value, document.getElementById('admEndDate').value, document.getElementById('admDay').value);
        
        classes.push({
            id: (subjects.find(s => s.id === subId)?.abbr || 'CLASS') + '_L' + (classes.filter(c => c.subjectId === subId).length + 1),
            subjectId: subId, teacherId: document.getElementById('admTeacher').value,
            room: document.getElementById('admRoom').value, dayOfWeek: document.getElementById('admDay').value,
            startDate: document.getElementById('admStartDate').value, endDate: document.getElementById('admEndDate').value,
            startPeriod: startP, endPeriod: endP, enrolledStudents: [], 
            sessions: dates.map(d => ({ id: 'SES_' + Date.now() + Math.random(), date: d, startPeriod: startP, endPeriod: endP, attendance: {} })), grades: {}
        });
        setDB('Classes', classes); alert("Tạo lớp thành công!"); this.reset(); renderAdminClassList();
    });

    document.getElementById('editClassForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        let sP = parseInt(document.getElementById('editClassStartPeriod').value), eP = parseInt(document.getElementById('editClassEndPeriod').value);
        if (sP > eP) return alert("Tiết học không hợp lệ!");

        updateClassDB(document.getElementById('editClassId').value, c => {
            c.subjectId = document.getElementById('editClassSub').value; c.teacherId = document.getElementById('editClassTeacher').value;
            c.room = document.getElementById('editClassRoom').value; c.dayOfWeek = document.getElementById('editClassDay').value;
            c.startDate = document.getElementById('editClassStartDate').value; c.endDate = document.getElementById('editClassEndDate').value;
            c.startPeriod = sP; c.endPeriod = eP;
            if (confirm("Làm mới lịch học theo tiết mới?")) {
                let dates = generateDates(c.startDate, c.endDate, c.dayOfWeek);
                c.sessions = dates.map(d => ({ id: 'SES_'+Date.now()+Math.random(), date: d, startPeriod: sP, endPeriod: eP, attendance: {} }));
            }
        });
        alert("Đã sửa thông tin!"); document.getElementById('admEditClassModal').style.display = 'none'; this.reset(); renderAdminClassList();
    });

    document.getElementById('editSessionForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        let sP = parseInt(document.getElementById('editSesStart').value), eP = parseInt(document.getElementById('editSesEnd').value);
        if (sP > eP) return alert("Tiết học không hợp lệ!");
        updateClassDB(currentClassId, c => {
            let s = c.sessions.find(x => x.id === document.getElementById('editSessionId').value);
            if(s) { s.date = document.getElementById('editSesDate').value; s.startPeriod = sP; s.endPeriod = eP; }
        });
        alert("Đã cập nhật buổi học!"); document.getElementById('admEditSessionModal').style.display = 'none'; this.reset(); adminRenderSessions();
    });
}

function setupAdminFormOptions() {
    const users = getDB('Users'); const subjects = getDB('Subjects');
    const cSub = document.getElementById('admSub'), cTc = document.getElementById('admTeacher');
    const eSub = document.getElementById('editClassSub'), eTc = document.getElementById('editClassTeacher');
    
    if (cSub && cTc) {
        cSub.innerHTML = ''; cTc.innerHTML = '';
        subjects.forEach(s => { let opt = `<option value="${s.id}">${s.name}</option>`; cSub.innerHTML += opt; if(eSub) eSub.innerHTML += opt; });
        users.filter(u => u.role === 'teacher').forEach(t => { let opt = `<option value="${t.id}">${t.name}</option>`; cTc.innerHTML += opt; if(eTc) eTc.innerHTML += opt; });
    }
    const usersList = document.getElementById('adminUsersList');
    if (usersList) usersList.innerHTML = users.map(u => `<tr><td>${u.id}</td><td>${u.role.toUpperCase()}</td><td>${u.name}</td><td>${u.email}</td></tr>`).join('');
}

function renderAdminClassList() {
    const classes = getDB('Classes'), subjects = getDB('Subjects'), users = getDB('Users');
    let container = document.getElementById('adminClassList'); if (!container) return;
    
    container.innerHTML = classes.map(c => `
        <div class="border-box border-left-dark">
            <h3 class="text-primary cursor-pointer" onclick="adminOpenClass('${c.id}')">${subjects.find(s=>s.id===c.subjectId)?.name||'Unknown'} - ${c.id}</h3>
            <p class="mt-10">GV: <span class="font-bold">${users.find(u=>u.id===c.teacherId)?.name||'Unknown'}</span> | Phòng: <span class="font-bold">${c.room}</span></p>
            <p class="text-muted text-sm mt-10">Lịch: ${c.dayOfWeek} <br> ${getPeriodText(c.startPeriod, c.endPeriod)}</p>
            <p class="font-bold mt-10">${c.enrolledStudents.length} Sinh viên | ${c.sessions.length} Buổi</p>
            <div class="flex-row mt-auto pt-10">
                <button class="action-btn flex-1" onclick="adminEditClass('${c.id}')">Sửa</button>
                <button class="btn-danger flex-1" onclick="adminDeleteClass('${c.id}')">Xóa</button>
            </div>
        </div>`).join('') || '<p>Chưa có lớp học nào.</p>';
}

window.adminEditClass = function(id) {
    let t = getDB('Classes').find(x => x.id === id); if (!t) return;
    document.getElementById('editClassId').value = id; document.getElementById('editClassSub').value = t.subjectId;
    document.getElementById('editClassTeacher').value = t.teacherId; document.getElementById('editClassRoom').value = t.room;
    document.getElementById('editClassDay').value = t.dayOfWeek; document.getElementById('editClassStartDate').value = t.startDate || '';
    document.getElementById('editClassEndDate').value = t.endDate || ''; document.getElementById('editClassStartPeriod').value = t.startPeriod;
    document.getElementById('editClassEndPeriod').value = t.endPeriod;
    document.getElementById('admEditClassModal').style.display = 'block';
};

window.adminDeleteClass = function(id) {
    if (confirm("Xóa lớp học này?")) { setDB('Classes', getDB('Classes').filter(c => c.id !== id)); renderAdminClassList(); }
};

window.adminOpenClass = function(id) {
    currentClassId = id; document.getElementById('admDetailClassName').textContent = "Quản lý chi tiết: " + id;
    // Đổi hiển thị không tắt menu highlight
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
    document.getElementById('admin-class-detail').style.display = 'block';
    switchAdmSubTab('students');
};

window.switchAdmSubTab = function(tab) {
    switchSubTab('adm-tab-'+tab+'-btn', 'adm-sub-'+tab, '.adm-sub-btn', '.adm-sub-tab');
    if(tab === 'students') adminRenderStudents(); else adminRenderSessions();
};

function adminRenderStudents() {
    let tClass = getDB('Classes').find(x => x.id === currentClassId); let users = getDB('Users');
    document.getElementById('admStudentList').innerHTML = tClass.enrolledStudents.map(id => {
        let u = users.find(x => x.id === id); return u ? `<tr><td>${u.id}</td><td>${u.name}</td><td><button class="btn-danger" onclick="adminRemoveStudent('${u.id}')">Xóa</button></td></tr>` : '';
    }).join('') || '<tr><td colspan="3">Lớp học trống.</td></tr>';
}

window.adminAddStudentToClass = function() {
    let sId = document.getElementById('addStuId').value.trim();
    if (!getDB('Users').some(u => u.id === sId && u.role === 'student')) return alert("Mã SV sai!");
    updateClassDB(currentClassId, c => { if(c.enrolledStudents.includes(sId)) alert("Đã có trong lớp!"); else c.enrolledStudents.push(sId); });
    document.getElementById('addStuId').value = ''; adminRenderStudents();
};

window.adminRemoveStudent = function(sId) {
    updateClassDB(currentClassId, c => c.enrolledStudents = c.enrolledStudents.filter(id => id !== sId)); adminRenderStudents();
};

function adminRenderSessions() {
    let c = getDB('Classes').find(x => x.id === currentClassId);
    document.getElementById('admSessionList').innerHTML = c.sessions.map(s => 
        `<tr><td>${s.date}</td><td>${getPeriodText(s.startPeriod, s.endPeriod)}</td><td><button class="action-btn" onclick="adminOpenEditSession('${s.id}')">Sửa</button> <button class="btn-danger" onclick="adminRemoveSession('${s.id}')">Xóa</button></td></tr>`
    ).join('') || '<tr><td colspan="3">Chưa có buổi học.</td></tr>';
}

window.adminCreateSingleSession = function() {
    let sP = parseInt(document.getElementById('aSesStart').value), eP = parseInt(document.getElementById('aSesEnd').value);
    if(sP > eP) return alert("Tiết lỗi!");
    updateClassDB(currentClassId, c => c.sessions.push({ id: 'SES_'+Date.now(), date: document.getElementById('aSesDate').value, startPeriod: sP, endPeriod: eP, attendance: {} }));
    adminRenderSessions();
};

window.adminOpenEditSession = function(sId) {
    let s = getDB('Classes').find(x => x.id === currentClassId).sessions.find(x => x.id === sId);
    document.getElementById('editSessionId').value = sId; document.getElementById('editSesDate').value = s.date;
    document.getElementById('editSesStart').value = s.startPeriod; document.getElementById('editSesEnd').value = s.endPeriod;
    document.getElementById('admEditSessionModal').style.display = 'block';
};

window.adminRemoveSession = function(sId) {
    updateClassDB(currentClassId, c => c.sessions = c.sessions.filter(s => s.id !== sId)); adminRenderSessions();
};