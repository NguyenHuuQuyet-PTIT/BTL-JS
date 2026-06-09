// --- TIỆN ÍCH ---
function timeToMin(t) { if(!t) return 0; let [h, m] = t.split(':'); return parseInt(h)*60 + parseInt(m); }
function isOverlap(c1, c2) {
    let s1 = timeToMin(c1.startTime), e1 = timeToMin(c1.endTime), s2 = timeToMin(c2.startTime), e2 = timeToMin(c2.endTime);
    return (c1.dayOfWeek === c2.dayOfWeek) && (s1 < e2 && e1 > s2);
}
function getDatesForDayOfWeek(start, end, dayText) {
    const dMap = {'Chủ nhật':0, 'Thứ 2':1, 'Thứ 3':2, 'Thứ 4':3, 'Thứ 5':4, 'Thứ 6':5, 'Thứ 7':6};
    let target = dMap[dayText], dates = [], curr = new Date(start), endD = new Date(end);
    while(curr <= endD) { if(curr.getDay() === target) dates.push(curr.toISOString().split('T')[0]); curr.setDate(curr.getDate()+1); }
    return dates;
}

let stuAttChartInstance = null; let stuGradeChartInstance = null;

// --- KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { if(!window.location.pathname.includes('index.html')) window.location.href = 'index.html'; return; }
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            document.getElementById(this.getAttribute('data-target')).classList.add('active-tab'); this.classList.add('active');
        });
    });
    if (user.role === 'admin') initAdmin(); else if (user.role === 'teacher') initTeacher(user); else if (user.role === 'student') initStudent(user);
});
window.handleLogout = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };

let currentClassId = null; let currentSessionId = null; let draftSelectedClasses = {};

// ==========================================
// 1. ADMIN LOGIC 
// ==========================================
function initAdmin() {
    const users = JSON.parse(localStorage.getItem('Users')) || []; const subjects = JSON.parse(localStorage.getItem('Subjects')) || [];
    let uHtml = ''; users.forEach(u => uHtml += `<tr><td>${u.id}</td><td>${u.role.toUpperCase()}</td><td>${u.name}</td><td>${u.email}</td></tr>`);
    if(document.getElementById('adminUsersList')) document.getElementById('adminUsersList').innerHTML = uHtml;
    
    const subSel = document.getElementById('admSub'), tcSel = document.getElementById('admTeacher');
    const editSubSel = document.getElementById('editClassSub'), editTcSel = document.getElementById('editClassTeacher');
    
    if(subSel && tcSel) {
        subjects.forEach(s => { subSel.innerHTML += `<option value="${s.id}">${s.name}</option>`; editSubSel.innerHTML += `<option value="${s.id}">${s.name}</option>`; });
        users.filter(u => u.role === 'teacher').forEach(t => { tcSel.innerHTML += `<option value="${t.id}">${t.name}</option>`; editTcSel.innerHTML += `<option value="${t.id}">${t.name}</option>`; });
    }
    renderAdminClassList();

    // Khởi tạo lớp & Sinh lịch
    document.getElementById('adminCreateClassForm')?.addEventListener('submit', (e) => {
        e.preventDefault(); 
        let cls = JSON.parse(localStorage.getItem('Classes')) || [];
        let subId = document.getElementById('admSub').value;
        let abbr = subjects.find(s => s.id === subId)?.abbr || 'CLASS';
        let newId = `${abbr}_L${cls.filter(c => c.subjectId === subId).length + 1}`;
        while(cls.some(c => c.id === newId)) { newId = `${abbr}_L${Math.floor(Math.random()*1000)}`; }

        let day = document.getElementById('admDay').value;
        let sDate = document.getElementById('admStartDate').value; let eDate = document.getElementById('admEndDate').value;
        let st = document.getElementById('admStart').value; let et = document.getElementById('admEnd').value;
        
        let dates = getDatesForDayOfWeek(sDate, eDate, day);
        let sessions = dates.map(d => ({ id: 'SES_' + Date.now() + Math.random(), date: d, startTime: st, endTime: et, attendance: {} }));

        cls.push({ id: newId, subjectId: subId, teacherId: document.getElementById('admTeacher').value, room: document.getElementById('admRoom').value, dayOfWeek: day, startDate: sDate, endDate: eDate, startTime: st, endTime: et, enrolledStudents: [], sessions: sessions, grades: {} });
        localStorage.setItem('Classes', JSON.stringify(cls)); alert(`Tạo thành công lớp ${newId} với ${dates.length} buổi học!`); e.target.reset(); renderAdminClassList();
    });

    // Sửa Lớp & Regenerate Lịch
    document.getElementById('editClassForm')?.addEventListener('submit', (e) => {
        e.preventDefault(); let cls = JSON.parse(localStorage.getItem('Classes')) || []; let id = document.getElementById('editClassId').value;
        let cIndex = cls.findIndex(c => c.id === id);
        if(cIndex > -1) { 
            cls[cIndex].subjectId = document.getElementById('editClassSub').value;
            cls[cIndex].teacherId = document.getElementById('editClassTeacher').value; 
            cls[cIndex].room = document.getElementById('editClassRoom').value; 
            cls[cIndex].dayOfWeek = document.getElementById('editClassDay').value;
            cls[cIndex].startDate = document.getElementById('editClassStartDate').value;
            cls[cIndex].endDate = document.getElementById('editClassEndDate').value;
            cls[cIndex].startTime = document.getElementById('editClassStart').value;
            cls[cIndex].endTime = document.getElementById('editClassEnd').value;
            
            if(confirm("Lưu thay đổi và LÀM MỚI lại toàn bộ lịch học (Các buổi học cũ sẽ bị ghi đè)?")) {
                let dates = getDatesForDayOfWeek(cls[cIndex].startDate, cls[cIndex].endDate, cls[cIndex].dayOfWeek);
                cls[cIndex].sessions = dates.map(d => ({ id: 'SES_' + Date.now() + Math.random(), date: d, startTime: cls[cIndex].startTime, endTime: cls[cIndex].endTime, attendance: {} }));
                localStorage.setItem('Classes', JSON.stringify(cls)); alert("Đã cập nhật lớp và làm mới lịch!"); 
                document.getElementById('admEditClassModal').style.display='none'; renderAdminClassList(); 
            }
        }
    });

    // Sửa Buổi đơn lẻ
    document.getElementById('editSessionForm')?.addEventListener('submit', (e) => {
        e.preventDefault(); let cls = JSON.parse(localStorage.getItem('Classes')) || []; let cIndex = cls.findIndex(c => c.id === currentClassId);
        let sId = document.getElementById('editSessionId').value; let sIndex = cls[cIndex].sessions.findIndex(s => s.id === sId);
        if(sIndex > -1) { cls[cIndex].sessions[sIndex].date = document.getElementById('editSesDate').value; cls[cIndex].sessions[sIndex].startTime = document.getElementById('editSesStart').value; cls[cIndex].sessions[sIndex].endTime = document.getElementById('editSesEnd').value; localStorage.setItem('Classes', JSON.stringify(cls)); alert("Cập nhật buổi học!"); document.getElementById('admEditSessionModal').style.display='none'; adminRenderSessions(); }
    });
}

function renderAdminClassList() {
    const cls = JSON.parse(localStorage.getItem('Classes')) || []; const subs = JSON.parse(localStorage.getItem('Subjects')) || []; const users = JSON.parse(localStorage.getItem('Users')) || []; let html = '';
    cls.forEach(c => { let subName = subs.find(s => s.id === c.subjectId)?.name; let tcName = users.find(u => u.id === c.teacherId)?.name;
        html += `<div class="chart-box">
            <h3 style="color:#007bff; cursor:pointer;" onclick="adminOpenClass('${c.id}')">${subName} - ${c.id}</h3>
            <p style="color:#666; margin-top:5px;">GV: ${tcName} | P.${c.room}</p>
            <p style="color:#666;">Lịch: ${c.dayOfWeek} (${c.startTime} - ${c.endTime})</p>
            <p style="margin-top:10px; font-weight:bold;">${c.enrolledStudents.length} SV | ${c.sessions.length} Buổi</p>
            <div style="margin-top:auto; padding-top: 15px; display:flex; gap:10px; justify-content: flex-end;">
                <button class="action-btn" style="flex:1;" onclick="adminEditClass('${c.id}')">Sửa thông tin</button> 
                <button class="action-btn" style="flex:1; color:white; background:#d32f2f; border:none;" onclick="adminDeleteClass('${c.id}')">Xóa lớp</button>
            </div>
        </div>`;
    });
    if(document.getElementById('adminClassList')) document.getElementById('adminClassList').innerHTML = html;
}
window.adminDeleteClass = (id) => { if(!confirm("Xóa lớp học này?")) return; let cls = JSON.parse(localStorage.getItem('Classes')) || []; localStorage.setItem('Classes', JSON.stringify(cls.filter(c => c.id !== id))); renderAdminClassList(); };
window.adminEditClass = (id) => {
    let c = (JSON.parse(localStorage.getItem('Classes')) || []).find(x => x.id === id);
    document.getElementById('editClassId').value = id; document.getElementById('editClassSub').value = c.subjectId; document.getElementById('editClassTeacher').value = c.teacherId; document.getElementById('editClassRoom').value = c.room; document.getElementById('editClassDay').value = c.dayOfWeek; document.getElementById('editClassStartDate').value = c.startDate || ''; document.getElementById('editClassEndDate').value = c.endDate || ''; document.getElementById('editClassStart').value = c.startTime; document.getElementById('editClassEnd').value = c.endTime; document.getElementById('admEditClassModal').style.display='block';
};
window.adminOpenClass = (id) => {
    currentClassId = id; document.getElementById('admDetailClassName').textContent = `Chi tiết lớp: ${id}`; document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab')); document.getElementById('admin-class-detail').classList.add('active-tab'); switchAdmSubTab('students');
};
window.switchAdmSubTab = (tab) => {
    document.getElementById('adm-tab-students-btn').classList.remove('active'); document.getElementById('adm-tab-sessions-btn').classList.remove('active'); document.getElementById('adm-tab-' + tab + '-btn').classList.add('active'); document.getElementById('adm-sub-students').style.display = tab === 'students' ? 'block' : 'none'; document.getElementById('adm-sub-sessions').style.display = tab === 'sessions' ? 'block' : 'none';
    if(tab === 'students') adminRenderStudents(); if(tab === 'sessions') adminRenderSessions();
};
function adminRenderStudents() {
    const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(x => x.id === currentClassId); const users = JSON.parse(localStorage.getItem('Users')) || []; let html = '';
    cls.enrolledStudents.forEach(stuId => { let u = users.find(x => x.id === stuId); if(u) html += `<tr><td>${u.id}</td><td>${u.name}</td><td><button class="action-btn" style="color:white; background:#d32f2f; border:none;" onclick="adminRemoveStudent('${u.id}')">Xóa</button></td></tr>`; });
    document.getElementById('admStudentList').innerHTML = html;
}
window.adminAddStudentToClass = () => {
    let stuId = document.getElementById('addStuId').value.trim(); if(!stuId) return; const users = JSON.parse(localStorage.getItem('Users')) || [];
    if(!users.find(u => u.id === stuId && u.role === 'student')) return alert("SV không tồn tại!");
    let cls = JSON.parse(localStorage.getItem('Classes')) || []; let cIndex = cls.findIndex(c => c.id === currentClassId);
    if(cls[cIndex].enrolledStudents.includes(stuId)) return alert("Đã có trong lớp!");
    cls[cIndex].enrolledStudents.push(stuId); localStorage.setItem('Classes', JSON.stringify(cls)); document.getElementById('addStuId').value = ''; adminRenderStudents();
};
window.adminRemoveStudent = (stuId) => { let cls = JSON.parse(localStorage.getItem('Classes')) || []; let cIndex = cls.findIndex(c => c.id === currentClassId); cls[cIndex].enrolledStudents = cls[cIndex].enrolledStudents.filter(id => id !== stuId); localStorage.setItem('Classes', JSON.stringify(cls)); adminRenderStudents(); };

function adminRenderSessions() {
    const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(x => x.id === currentClassId); let html = '';
    cls.sessions.forEach(s => html += `<tr><td>${s.date}</td><td>${s.startTime} - ${s.endTime}</td><td><button class="action-btn" onclick="adminOpenEditSession('${s.id}')">Sửa</button> <button class="action-btn" style="color:white; background:#d32f2f; border:none;" onclick="adminRemoveSession('${s.id}')">Xóa</button></td></tr>`);
    document.getElementById('admSessionList').innerHTML = html;
}
window.adminCreateSingleSession = () => {
    let cls = JSON.parse(localStorage.getItem('Classes')) || []; let cIndex = cls.findIndex(c => c.id === currentClassId);
    cls[cIndex].sessions.push({ id: 'SES_' + Date.now(), date: document.getElementById('aSesDate').value, startTime: document.getElementById('aSesStart').value, endTime: document.getElementById('aSesEnd').value, attendance: {} });
    localStorage.setItem('Classes', JSON.stringify(cls)); adminRenderSessions();
};
window.adminOpenEditSession = (sId) => {
    let c = (JSON.parse(localStorage.getItem('Classes')) || []).find(x => x.id === currentClassId); let s = c.sessions.find(x => x.id === sId);
    document.getElementById('editSessionId').value = sId; document.getElementById('editSesDate').value = s.date; document.getElementById('editSesStart').value = s.startTime; document.getElementById('editSesEnd').value = s.endTime; document.getElementById('admEditSessionModal').style.display='block';
};
window.adminRemoveSession = (sesId) => { let cls = JSON.parse(localStorage.getItem('Classes')) || []; let cIndex = cls.findIndex(c => c.id === currentClassId); cls[cIndex].sessions = cls[cIndex].sessions.filter(s => s.id !== sesId); localStorage.setItem('Classes', JSON.stringify(cls)); adminRenderSessions(); };


// ==========================================
// 2. GIÁO VIÊN LOGIC
// ==========================================
function initTeacher(user) {
    document.getElementById('tcProfId').textContent = user.id; 
    document.getElementById('tcProfDob').textContent = user.dob || 'Chưa cập nhật';
    document.getElementById('tcProfPhone').textContent = user.phone || 'Chưa cập nhật';

    document.getElementById('btnShowEditProfileTc')?.addEventListener('click', () => { document.getElementById('editPhoneTc').value = user.phone || ''; document.getElementById('editDobTc').value = user.dob || ''; document.getElementById('editProfileFormContainerTc').style.display='block'; });
    document.getElementById('btnCancelEditProfileTc')?.addEventListener('click', () => document.getElementById('editProfileFormContainerTc').style.display='none');
    document.getElementById('editProfileFormTc')?.addEventListener('submit', (e) => { e.preventDefault(); let users = JSON.parse(localStorage.getItem('Users')) || []; let newP = document.getElementById('editPassTc').value.trim(); if(newP) user.password = newP; user.phone = document.getElementById('editPhoneTc').value.trim(); user.dob = document.getElementById('editDobTc').value; localStorage.setItem('currentUser', JSON.stringify(user)); let i = users.findIndex(u=>u.id===user.id); if(i>-1) users[i]=user; localStorage.setItem('Users', JSON.stringify(users)); alert("Cập nhật!"); window.location.reload(); });

    const cls = JSON.parse(localStorage.getItem('Classes')) || []; const subs = JSON.parse(localStorage.getItem('Subjects')) || []; let html = '';
    cls.filter(c => c.teacherId === user.id).forEach(c => { let subName = subs.find(s => s.id === c.subjectId)?.name; html += `<div class="chart-box"><h3 style="color:#007bff; cursor:pointer;" onclick="teacherOpenClass('${c.id}', '${subName}')">${subName} - ${c.id}</h3><p style="color:#666; margin-top:5px;">Phòng: ${c.room}</p><p style="margin-top:10px; font-weight:bold;">${c.enrolledStudents.length} SV | ${c.sessions.length} Buổi</p></div>`; });
    if(document.getElementById('teacherClassList')) document.getElementById('teacherClassList').innerHTML = html || '<p>Trống.</p>';
}
window.teacherOpenClass = (id, name) => { currentClassId = id; document.getElementById('teacherDetailClassName').textContent = name; document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab')); document.getElementById('class-detail-tab').classList.add('active-tab'); switchTeacherSubTab('grades'); };
window.switchTeacherSubTab = (tab) => { document.getElementById('tc-tab-grades-btn').classList.remove('active'); document.getElementById('tc-tab-sessions-btn').classList.remove('active'); document.getElementById('tc-tab-' + tab + '-btn').classList.add('active'); document.getElementById('tc-sub-grades').style.display = tab === 'grades' ? 'block' : 'none'; document.getElementById('tc-sub-sessions').style.display = tab === 'sessions' ? 'block' : 'none'; if(tab === 'grades') teacherRenderGrades(); if(tab === 'sessions') teacherRenderSessions(); };
function teacherRenderGrades() { const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === currentClassId); const users = JSON.parse(localStorage.getItem('Users')) || []; let html = ''; cls.enrolledStudents.forEach(stuId => { let stu = users.find(u => u.id === stuId); let g = cls.grades[stuId] || { cc: 0, gk: 0, ck: 0 }; let avg = (g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1); html += `<tr><td><strong>${stu.name}</strong><br><span style="font-size:12px;color:#666;">${stu.id}</span></td><td><input type="number" id="cc_${stu.id}" value="${g.cc}" style="width:60px;"></td><td><input type="number" id="gk_${stu.id}" value="${g.gk}" style="width:60px;"></td><td><input type="number" id="ck_${stu.id}" value="${g.ck}" style="width:60px;"></td><td style="color:green;font-weight:bold;">${avg}</td><td><button class="action-btn" onclick="teacherSaveGrade('${stu.id}')">Lưu</button></td></tr>`; }); document.getElementById('tcStudentGrades').innerHTML = html; }
window.teacherSaveGrade = (stuId) => { let cls = JSON.parse(localStorage.getItem('Classes')) || []; let cIndex = cls.findIndex(c => c.id === currentClassId); let cc = parseFloat(document.getElementById(`cc_${stuId}`).value)||0, gk = parseFloat(document.getElementById(`gk_${stuId}`).value)||0, ck = parseFloat(document.getElementById(`ck_${stuId}`).value)||0; if(!cls[cIndex].grades[stuId]) cls[cIndex].grades[stuId] = {}; cls[cIndex].grades[stuId] = { cc, gk, ck }; localStorage.setItem('Classes', JSON.stringify(cls)); alert("Lưu điểm!"); teacherRenderGrades(); };
function teacherRenderSessions() { const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === currentClassId); let html = ''; cls.sessions.forEach(s => html += `<div class="chart-box"><h4>${s.date}</h4><p>${s.startTime} - ${s.endTime}</p><button class="action-btn" style="margin-top:10px; background:#000; color:#fff;" onclick="teacherOpenAtt('${s.id}')">Điểm danh</button></div>`); document.getElementById('tcSessionList').innerHTML = html; }
window.teacherOpenAtt = (sesId) => { currentSessionId = sesId; const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === currentClassId); const ses = cls.sessions.find(s => s.id === sesId); const users = JSON.parse(localStorage.getItem('Users')) || []; document.getElementById('tcAttSessionInfo').textContent = `Ngày: ${ses.date}`; document.getElementById('tcAttendanceView').style.display = 'block'; let html = ''; cls.enrolledStudents.forEach(stuId => { let stu = users.find(u => u.id === stuId); let st = ses.attendance[stuId] || ''; html += `<tr><td><strong>${stu.name}</strong><br><span style="font-size:12px;color:#666">${stu.id}</span></td><td><div class="radio-group"><label style="color:green"><input type="radio" name="att_${stuId}" value="present" ${st==='present'?'checked':''}> Có mặt</label><label style="color:orange"><input type="radio" name="att_${stuId}" value="late" ${st==='late'?'checked':''}> Muộn</label><label style="color:red"><input type="radio" name="att_${stuId}" value="absent" ${st==='absent'?'checked':''}> Vắng</label></div></td></tr>`; }); document.getElementById('tcAttendanceList').innerHTML = html; };
window.teacherSaveAttendance = () => { let cls = JSON.parse(localStorage.getItem('Classes')) || []; let cIndex = cls.findIndex(c => c.id === currentClassId); let sIndex = cls[cIndex].sessions.findIndex(s => s.id === currentSessionId); cls[cIndex].enrolledStudents.forEach(stuId => { let radio = document.querySelector(`input[name="att_${stuId}"]:checked`); if(radio) { if(!cls[cIndex].sessions[sIndex].attendance) cls[cIndex].sessions[sIndex].attendance = {}; cls[cIndex].sessions[sIndex].attendance[stuId] = radio.value; } }); localStorage.setItem('Classes', JSON.stringify(cls)); alert("Lưu điểm danh!"); document.getElementById('tcAttendanceView').style.display = 'none'; };


// ==========================================
// 3. SINH VIÊN LOGIC (Biểu đồ số nguyên, Form Profile, Đăng ký)
// ==========================================
function initStudent(user) {
    document.getElementById('profId').textContent = user.id; 
    document.getElementById('profDob').textContent = user.dob || 'Chưa cập nhật'; 
    document.getElementById('profPhone').textContent = user.phone || 'Chưa cập nhật';
    
    document.getElementById('btnShowEditProfile')?.addEventListener('click', () => { document.getElementById('editPhone').value = user.phone || ''; document.getElementById('editDob').value = user.dob || ''; document.getElementById('editProfileFormContainer').style.display='block'; });
    document.getElementById('btnCancelEditProfile')?.addEventListener('click', () => document.getElementById('editProfileFormContainer').style.display='none');
    document.getElementById('editProfileForm')?.addEventListener('submit', (e) => { e.preventDefault(); let users = JSON.parse(localStorage.getItem('Users')) || []; let newP = document.getElementById('editPass').value.trim(); if(newP) user.password = newP; user.phone = document.getElementById('editPhone').value.trim(); user.dob = document.getElementById('editDob').value; localStorage.setItem('currentUser', JSON.stringify(user)); let i = users.findIndex(u=>u.id===user.id); if(i>-1) users[i]=user; localStorage.setItem('Users', JSON.stringify(users)); alert("Cập nhật!"); window.location.reload(); });

    renderStuStudyTab(user); renderRegistrationTab(user);
}

window.switchStuStudyTab = (tab) => { document.getElementById('stu-tab-schedule-btn').classList.remove('active'); document.getElementById('stu-tab-progress-btn').classList.remove('active'); document.getElementById('stu-tab-' + tab + '-btn').classList.add('active'); document.getElementById('stu-sub-schedule').style.display = tab === 'schedule' ? 'block' : 'none'; document.getElementById('stu-sub-progress').style.display = tab === 'progress' ? 'block' : 'none'; };

function renderStuStudyTab(user) {
    const classes = JSON.parse(localStorage.getItem('Classes')) || []; const subjects = JSON.parse(localStorage.getItem('Subjects')) || []; const users = JSON.parse(localStorage.getItem('Users')) || [];
    let myClasses = classes.filter(c => c.enrolledStudents.includes(user.id)); let today = new Date().toISOString().split('T')[0];
    let daysMap = { 'Thứ 2':[], 'Thứ 3':[], 'Thứ 4':[], 'Thứ 5':[], 'Thứ 6':[], 'Thứ 7':[], 'Chủ nhật':[] }; let cardsHtml = '';
    
    let totalScore = 0, count = 0, excellentCount = 0;
    let p = 0, l = 0, a = 0;
    let gradeDist = { xuatSac: 0, gioi: 0, kha: 0, trungBinh: 0, yeu: 0 };

    myClasses.forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name; let tcName = users.find(u => u.id === c.teacherId)?.name;
        if(daysMap[c.dayOfWeek]) daysMap[c.dayOfWeek].push({ subName, room: c.room, start: c.startTime, end: c.endTime });
        let pastCount = c.sessions.filter(s => s.date <= today).length; let perc = c.sessions.length===0 ? 0 : Math.round((pastCount/c.sessions.length)*100);
        let g = c.grades[user.id] || {cc:0,gk:0,ck:0}; let avg = parseFloat((g.cc*0.2 + g.gk*0.3 + g.ck*0.5).toFixed(1));
        
        if (avg > 0) {
            count++; totalScore += avg;
            if (avg >= 8.0) excellentCount++;
            if (avg >= 9.0) gradeDist.xuatSac++; else if (avg >= 8.0) gradeDist.gioi++; else if (avg >= 6.5) gradeDist.kha++; else if (avg >= 5.0) gradeDist.trungBinh++; else gradeDist.yeu++;
        }

        c.sessions.forEach(ses => {
            let st = ses.attendance[user.id];
            if (st === 'present') p++; else if (st === 'late') l++; else if (st === 'absent') a++;
        });

        cardsHtml += `<div class="chart-box" style="cursor:pointer; border-left:5px solid #000;" onclick='openStuModal(${JSON.stringify(c)}, "${subName}", "${tcName}")'><h3 style="color:#007bff;">${subName} - ${c.id}</h3><p style="color:#666; font-size:13px; margin-top:5px;">GV: ${tcName}</p><div class="progress-bg"><div class="progress-fill" style="width:${perc}%;"></div></div><span style="font-size:12px; font-weight:bold;">${perc}% (${pastCount}/${c.sessions.length} buổi)</span><p style="margin-top:10px; font-weight:bold; color:green;">Điểm TB: ${avg}</p></div>`;
    });
    
    let schedHtml = ''; for(let d in daysMap) { if(daysMap[d].length > 0) { schedHtml += `<div style="min-width:200px; background:#fff; padding:15px; border-radius:8px; border:1px solid #ddd;"><h3 style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:10px;">${d}</h3>`; daysMap[d].forEach(i => schedHtml += `<div style="margin-bottom:10px; background:#f9f9f9; padding:10px; border-radius:4px;"><strong>${i.subName}</strong><br><span style="font-size:12px; color:#666;">${i.start} - ${i.end} | P.${i.room}</span></div>`); schedHtml += `</div>`; } }
    document.getElementById('weeklyScheduleContainer').innerHTML = schedHtml || '<p>Chưa có lịch tuần này.</p>'; document.getElementById('enrolledClassesCards').innerHTML = cardsHtml || '<p>Trống.</p>';

    if (document.getElementById('stat-total-subjects')) document.getElementById('stat-total-subjects').textContent = myClasses.length;
    if (document.getElementById('stat-gpa') && count > 0) document.getElementById('stat-gpa').textContent = (totalScore / count).toFixed(1);
    if (document.getElementById('stat-excellent')) document.getElementById('stat-excellent').textContent = excellentCount;
    let totalSessions = p + l + a;
    if (document.getElementById('stat-attendance-rate') && totalSessions > 0) document.getElementById('stat-attendance-rate').textContent = ((p / totalSessions) * 100).toFixed(1) + '%';

    // Vẽ biểu đồ Chart.js ép trục Y là số nguyên (stepSize: 1)
    if (document.getElementById('attendanceChart') && totalSessions > 0) {
        if(stuAttChartInstance) stuAttChartInstance.destroy();
        stuAttChartInstance = new Chart(document.getElementById('attendanceChart'), { 
            type: 'bar', 
            data: { labels: ['Có mặt', 'Đi muộn', 'Vắng'], datasets: [{ label: 'Số buổi', data: [p, l, a], backgroundColor: ['#4CAF50', '#FFC107', '#F44336'] }] },
            options: { scales: { y: { ticks: { stepSize: 1, precision: 0 } } } }
        });
    }
    if (document.getElementById('gradePieChart') && count > 0) {
        if(stuGradeChartInstance) stuGradeChartInstance.destroy();
        stuGradeChartInstance = new Chart(document.getElementById('gradePieChart'), { type: 'pie', data: { labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'], datasets: [{ data: [gradeDist.xuatSac, gradeDist.gioi, gradeDist.kha, gradeDist.trungBinh, gradeDist.yeu], backgroundColor: ['#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#F44336'] }] }});
    }
}

window.openStuModal = (clsObj, subName, tcName) => {
    document.getElementById('modalClassName').textContent = subName; document.getElementById('modalTeacherName').textContent = "Giảng viên: " + tcName;
    let html = ''; let today = new Date().toISOString().split('T')[0]; const user = JSON.parse(localStorage.getItem('currentUser'));
    clsObj.sessions.forEach(ses => { let st = ses.attendance[user.id]; let sTxt = "Chưa diễn ra"; if(ses.date <= today) { sTxt = st==='present'?'<span style="color:green;font-weight:bold;">Có mặt</span>':st==='late'?'<span style="color:orange;font-weight:bold;">Muộn</span>':st==='absent'?'<span style="color:red;font-weight:bold;">Vắng</span>':'<span style="color:gray;">Chưa ĐD</span>'; } html += `<tr><td>${ses.date} (${ses.startTime} - ${ses.endTime})</td><td>${sTxt}</td></tr>`; });
    document.getElementById('modalSessionList').innerHTML = html || '<tr><td colspan="2">Chưa có lịch.</td></tr>'; document.getElementById('stuClassModal').style.display = 'block';
};

function renderRegistrationTab(user) {
    const classes = JSON.parse(localStorage.getItem('Classes')) || []; const subjects = JSON.parse(localStorage.getItem('Subjects')) || []; const users = JSON.parse(localStorage.getItem('Users')) || []; let html = '';
    subjects.forEach(sub => {
        let subClasses = classes.filter(c => c.subjectId === sub.id); if(subClasses.length === 0) return;
        let myClassForSub = subClasses.find(c => c.enrolledStudents.includes(user.id));
        html += `<h3 style="margin-top:20px; border-bottom:1px solid #ccc; padding-bottom:5px;">Môn: ${sub.name}</h3><div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">`;
        subClasses.forEach(c => {
            let tcName = users.find(u => u.id === c.teacherId)?.name; let isEnrolled = c.id === myClassForSub?.id; let isLockedBySub = myClassForSub && !isEnrolled; let isDraft = draftSelectedClasses[sub.id] === c.id; let hasConflict = false;
            for(let dSub in draftSelectedClasses) { if(dSub !== sub.id) { let dClass = classes.find(x => x.id === draftSelectedClasses[dSub]); if(dClass && isOverlap(c, dClass)) hasConflict = true; } }
            
            let cClass = "reg-card", aHtml = "";
            if (isEnrolled) { cClass += " disabled"; aHtml = `<span style="color:green; font-weight:bold;">Đã đăng ký</span>`; } 
            else if (isLockedBySub) { cClass += " disabled"; aHtml = `<span class="reg-conflict-text">Khóa (Đã ĐK lớp khác)</span>`; } 
            else if (hasConflict) { cClass += " disabled"; aHtml = `<span class="reg-conflict-text">Trùng lịch</span>`; } 
            else { aHtml = `<input type="radio" name="reg_${sub.id}" value="${c.id}" ${isDraft ? 'checked' : ''} onchange="handleDraftSelection('${sub.id}', '${c.id}')">`; }
            
            html += `<div class="${cClass}"><div><strong>Lớp: ${c.id}</strong><br><span style="font-size:13px; color:#666;">GV: ${tcName} | P.${c.room}</span><br><span style="font-size:13px; font-weight:bold;">Lịch: ${c.dayOfWeek} (${c.startTime} - ${c.endTime})</span></div><div>${aHtml}</div></div>`;
        }); html += `</div>`;
    }); document.getElementById('registrationContainer').innerHTML = html;
}
window.handleDraftSelection = (subId, classId) => { draftSelectedClasses[subId] = classId; renderRegistrationTab(JSON.parse(localStorage.getItem('currentUser'))); };
window.commitRegistration = () => {
    let classes = JSON.parse(localStorage.getItem('Classes')) || []; const user = JSON.parse(localStorage.getItem('currentUser')); let cMade = false;
    for (let subId in draftSelectedClasses) { let cIndex = classes.findIndex(c => c.id === draftSelectedClasses[subId]); if(cIndex > -1 && !classes[cIndex].enrolledStudents.includes(user.id)) { classes[cIndex].enrolledStudents.push(user.id); cMade = true; } }
    if(cMade) { localStorage.setItem('Classes', JSON.stringify(classes)); draftSelectedClasses = {}; alert("Lưu đăng ký thành công!"); renderRegistrationTab(user); renderStuStudyTab(user); } else { alert("Chưa chọn môn mới."); }
};