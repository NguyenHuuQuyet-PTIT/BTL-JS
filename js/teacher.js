document.addEventListener('DOMContentLoaded', () => {
    const user = getDB('currentUser');
    if (!user || user.role !== 'teacher') { window.location.href = 'index.html'; return; }
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);

    // Lắng nghe click thanh Menu bên trái
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });
    initTeacherLogic(user);
});

window.handleLogout = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };

let currentClassId = null; let currentSessionId = null;

function initTeacherLogic(user) {
    document.getElementById('tcProfId').textContent = user.id; document.getElementById('tcProfDob').textContent = user.dob || 'Chưa cập nhật'; document.getElementById('tcProfPhone').textContent = user.phone || 'Chưa cập nhật';
    document.getElementById('btnShowEditProfileTc')?.addEventListener('click', () => { document.getElementById('editPhoneTc').value = user.phone || ''; document.getElementById('editDobTc').value = user.dob || ''; document.getElementById('editProfileFormContainerTc').style.display = 'block'; });
    document.getElementById('btnCancelEditProfileTc')?.addEventListener('click', () => document.getElementById('editProfileFormContainerTc').style.display = 'none');

    document.getElementById('editProfileFormTc')?.addEventListener('submit', function(e) {
        e.preventDefault(); let newP = document.getElementById('editPassTc').value.trim(); if(newP) user.password = newP;
        user.phone = document.getElementById('editPhoneTc').value.trim(); user.dob = document.getElementById('editDobTc').value;
        localStorage.setItem('currentUser', JSON.stringify(user));
        let users = getDB('Users'); let i = users.findIndex(u => u.id === user.id); if(i>-1) users[i]=user; setDB('Users', users);
        alert("Cập nhật thông tin thành công!"); window.location.reload();
    });

    renderTeacherDashboard(user);
}

function renderTeacherDashboard(user) {
    const classes = getDB('Classes'), subjects = getDB('Subjects');
    let myClasses = classes.filter(cls => cls.teacherId === user.id); let todayStr = new Date().toISOString().split('T')[0];
    let totalStudents = 0, weeklyDays = { 'Thứ 2':[], 'Thứ 3':[], 'Thứ 4':[], 'Thứ 5':[], 'Thứ 6':[], 'Thứ 7':[], 'Chủ nhật':[] }, cardsHtml = '';

    myClasses.forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || 'Unknown'; totalStudents += c.enrolledStudents.length;
        weeklyDays[c.dayOfWeek].push({ subName: subName, room: c.room, timeStr: getPeriodText(c.startPeriod, c.endPeriod) });
        let total = c.sessions.length, past = c.sessions.filter(s => s.date <= todayStr).length, percent = total > 0 ? Math.round((past / total) * 100) : 0;

        cardsHtml += `
            <div class="border-box border-left-dark">
                <h3 class="text-primary">${subName} - ${c.id}</h3><p class="mt-10 text-sm">Phòng học: <span class="font-bold">${c.room}</span></p>
                <div class="progress-bg"><div class="progress-fill" style="width:${percent}%;"></div></div><span class="text-sm font-bold text-muted">Tiến độ: ${percent}% (${past}/${total} buổi)</span>
                <p class="font-bold mt-10">${c.enrolledStudents.length} SV tham gia</p><button class="btn-primary mt-auto" onclick="teacherOpenClass('${c.id}', '${subName}')">Vào chấm điểm</button>
            </div>`;
    });

    let weeklyHtml = Object.keys(weeklyDays).filter(k => weeklyDays[k].length>0).map(k => `<div class="border-box"><h3 class="schedule-day-header">${k}</h3>${weeklyDays[k].map(i => `<div class="schedule-item"><strong class="text-primary">${i.subName}</strong><br><span class="text-sm text-muted">${i.timeStr} | P.${i.room}</span></div>`).join('')}</div>`).join('');

    if (document.getElementById('tc-total-classes')) document.getElementById('tc-total-classes').textContent = myClasses.length;
    if (document.getElementById('tc-total-students')) document.getElementById('tc-total-students').textContent = totalStudents;
    if (document.getElementById('teacherClassList')) document.getElementById('teacherClassList').innerHTML = cardsHtml || '<p>Chưa phân công.</p>';
    if (document.getElementById('tcWeeklyScheduleContainer')) document.getElementById('tcWeeklyScheduleContainer').innerHTML = weeklyHtml || '<p>Trống lịch.</p>';
}

window.switchTeacherMainTab = function(tab) { switchSubTab('tc-main-'+tab+'-btn', 'tc-main-'+tab, '.tc-main-btn', '.tc-main-tab'); };
window.switchTeacherSubTab = function(tab) { switchSubTab('tc-tab-'+tab+'-btn', 'tc-sub-'+tab, '.tc-sub-btn', '.tc-sub-tab'); if(tab==='grades') teacherRenderGrades(); else teacherRenderSessions(); };

window.teacherOpenClass = function(id, name) {
    currentClassId = id; document.getElementById('teacherDetailClassName').textContent = name + " (" + id + ")";
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
    document.getElementById('class-detail-tab').style.display = 'block';
    switchTeacherSubTab('grades');
};

function teacherRenderGrades() {
    let tClass = getDB('Classes').find(cls => cls.id === currentClassId); const users = getDB('Users');
    document.getElementById('tcStudentGrades').innerHTML = tClass.enrolledStudents.map(sid => {
        let stu = users.find(u => u.id === sid); if (!stu) return '';
        let g = tClass.grades[sid] || { cc: 0, gk: 0, ck: 0 }; let avg = (g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1);
        return `<tr><td><strong class="text-primary">${stu.name}</strong><br><span class="text-muted text-sm">${stu.id}</span></td><td><input type="number" id="cc_${stu.id}" value="${g.cc}" style="width:60px; padding:5px;"></td><td><input type="number" id="gk_${stu.id}" value="${g.gk}" style="width:60px; padding:5px;"></td><td><input type="number" id="ck_${stu.id}" value="${g.ck}" style="width:60px; padding:5px;"></td><td class="text-success font-bold">${avg}</td><td><button class="action-btn" onclick="teacherSaveGrade('${stu.id}')">Lưu</button></td></tr>`;
    }).join('') || '<tr><td colspan="6">Lớp trống.</td></tr>';
}

window.teacherSaveGrade = function(sid) {
    updateClassDB(currentClassId, c => {
        if(!c.grades[sid]) c.grades[sid] = {};
        c.grades[sid] = { cc: parseFloat(document.getElementById('cc_'+sid).value)||0, gk: parseFloat(document.getElementById('gk_'+sid).value)||0, ck: parseFloat(document.getElementById('ck_'+sid).value)||0 };
    });
    alert("Đã lưu điểm!"); teacherRenderGrades();
};

function teacherRenderSessions() {
    let tClass = getDB('Classes').find(cls => cls.id === currentClassId);
    document.getElementById('tcSessionList').innerHTML = tClass.sessions.map(s => `<div class="border-box border-left-dark"><h4>Ngày: ${s.date}</h4><p class="text-muted text-sm mt-10">${getPeriodText(s.startPeriod, s.endPeriod)}</p><button class="btn-primary mt-auto" onclick="teacherOpenAtt('${s.id}')">Điểm danh</button></div>`).join('') || '<p>Chưa xếp lịch.</p>';
}

window.teacherOpenAtt = function(sId) {
    currentSessionId = sId; let tClass = getDB('Classes').find(cls => cls.id === currentClassId); let ses = tClass.sessions.find(x => x.id === sId); const users = getDB('Users');
    document.getElementById('tcAttSessionInfo').textContent = "Bảng Điểm Danh (Ngày " + ses.date + ")";
    
    document.getElementById('tcAttendanceList').innerHTML = tClass.enrolledStudents.map(id => {
        let stu = users.find(u => u.id === id); if (!stu) return ''; let st = ses.attendance[id] || '';
        return `<tr><td><strong class="text-primary">${stu.name}</strong><br><span class="text-muted text-sm">${stu.id}</span></td><td><div class="radio-group"><label class="text-success font-bold"><input type="radio" name="att_${stu.id}" value="present" ${st==='present'?'checked':''}> Có mặt</label><label class="text-warning font-bold"><input type="radio" name="att_${stu.id}" value="late" ${st==='late'?'checked':''}> Muộn</label><label class="text-danger font-bold"><input type="radio" name="att_${stu.id}" value="absent" ${st==='absent'?'checked':''}> Vắng</label></div></td></tr>`;
    }).join('') || '<tr><td colspan="2">Lớp trống</td></tr>';
    document.getElementById('tcAttModal').style.display = 'block';
};

window.teacherSaveAttendance = function() {
    updateClassDB(currentClassId, c => {
        let ses = c.sessions.find(x => x.id === currentSessionId);
        c.enrolledStudents.forEach(id => { let r = document.querySelector(`input[name="att_${id}"]:checked`); if(r) ses.attendance[id] = r.value; });
    });
    alert("Đã chốt điểm danh!"); document.getElementById('tcAttModal').style.display = 'none';
};