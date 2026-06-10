function getDB(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

const PERIOD_TIMES = { 1: "07:00-07:50", 2: "08:00-08:50", 3: "09:00-09:50", 4: "10:00-10:50", 5: "11:00-11:50", 6: "12:00-12:50", 7: "13:00-13:50", 8: "14:00-14:50", 9: "15:00-15:50", 10: "16:00-16:50", 11: "17:00-17:50", 12: "18:00-18:50" };
function getPeriodText(start, end) { 
    let t1 = PERIOD_TIMES[start].split("-")[0]; 
    let t2 = PERIOD_TIMES[end].split("-")[1];
    return `Tiết ${start}-${end} (${t1} - ${t2})`; 
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getDB('currentUser');
    if (!user || user.role !== 'teacher') { window.location.href = 'index.html'; return; }
    
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            document.getElementById(this.getAttribute('data-target')).classList.add('active-tab');
            this.classList.add('active');
        });
    });

    initTeacherLogic(user);
});

window.handleLogout = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };

let currentClassId = null; 
let currentSessionId = null;

function initTeacherLogic(user) {
    document.getElementById('tcProfId').textContent = user.id;
    document.getElementById('tcProfDob').textContent = user.dob || 'Chưa cập nhật';
    document.getElementById('tcProfPhone').textContent = user.phone || 'Chưa cập nhật';

    document.getElementById('btnShowEditProfileTc')?.addEventListener('click', () => {
        document.getElementById('editPhoneTc').value = user.phone || ''; 
        document.getElementById('editDobTc').value = user.dob || '';
        document.getElementById('editProfileFormContainerTc').style.display = 'block';
    });
    
    document.getElementById('btnCancelEditProfileTc')?.addEventListener('click', () => { 
        document.getElementById('editProfileFormContainerTc').style.display = 'none'; 
    });

    document.getElementById('editProfileFormTc')?.addEventListener('submit', function(e) {
        e.preventDefault();
        let users = getDB('Users'); 
        let newPass = document.getElementById('editPassTc').value.trim();
        
        if (newPass) {
            user.password = newPass;
        }
        user.phone = document.getElementById('editPhoneTc').value.trim();
        user.dob = document.getElementById('editDobTc').value;
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        let index = users.findIndex(u => u.id === user.id);
        if (index > -1) {
            users[index] = user;
        }
        
        setDB('Users', users); 
        alert("Cập nhật thông tin thành công!"); 
        window.location.reload();
    });

    renderTeacherDashboard(user);
}

// Hàm render đồng bộ Giao diện với Sinh viên
function renderTeacherDashboard(user) {
    const classes = getDB('Classes'); 
    const subjects = getDB('Subjects');
    
    let myClasses = classes.filter(cls => cls.teacherId === user.id);
    let todayStr = new Date().toISOString().split('T')[0];

    let totalStudents = 0;
    let weeklyDays = { 'Thứ 2':[], 'Thứ 3':[], 'Thứ 4':[], 'Thứ 5':[], 'Thứ 6':[], 'Thứ 7':[], 'Chủ nhật':[] };
    let cardsHtml = '';

    for (let c of myClasses) {
        let subject = subjects.find(s => s.id === c.subjectId);
        let subName = subject ? subject.name : 'Unknown';
        
        totalStudents += c.enrolledStudents.length;

        // Xếp lịch tuần
        weeklyDays[c.dayOfWeek].push({ 
            subName: subName, 
            room: c.room, 
            timeStr: getPeriodText(c.startPeriod, c.endPeriod) 
        });

        // Tính tiến trình
        let totalSessions = c.sessions.length;
        let pastSessions = c.sessions.filter(s => s.date <= todayStr).length;
        let percent = totalSessions > 0 ? Math.round((pastSessions / totalSessions) * 100) : 0;

        cardsHtml += `
            <div class="chart-box border-left-dark">
                <h3 class="text-primary">${subName} - ${c.id}</h3>
                <p class="mt-10">Phòng học: ${c.room}</p>
                <div class="progress-bg"><div class="progress-fill" style="width:${percent}%;"></div></div>
                <span class="text-sm font-bold">Tiến độ giảng dạy: ${percent}% (${pastSessions}/${totalSessions} buổi)</span>
                <p class="font-bold mt-10">${c.enrolledStudents.length} Sinh viên đang học</p>
                <button class="btn-primary mt-auto" onclick="teacherOpenClass('${c.id}', '${subName}')">Vào chấm điểm & điểm danh</button>
            </div>`;
    }

    let weeklyHtml = '';
    for (let dayKey in weeklyDays) {
        if (weeklyDays[dayKey].length > 0) {
            weeklyHtml += `<div class="schedule-day-card"><h3 class="schedule-day-header">${dayKey}</h3>`;
            for (let item of weeklyDays[dayKey]) {
                weeklyHtml += `<div class="schedule-item"><strong class="text-primary">${item.subName}</strong><br><span class="text-sm text-muted">${item.timeStr} | P.${item.room}</span></div>`;
            }
            weeklyHtml += `</div>`;
        }
    }

    if (document.getElementById('tc-total-classes')) document.getElementById('tc-total-classes').textContent = myClasses.length;
    if (document.getElementById('tc-total-students')) document.getElementById('tc-total-students').textContent = totalStudents;

    let cardsContainer = document.getElementById('teacherClassList');
    if (cardsContainer) cardsContainer.innerHTML = cardsHtml || '<p>Chưa có lớp học nào được phân công.</p>';

    let scheduleContainer = document.getElementById('tcWeeklyScheduleContainer');
    if (scheduleContainer) scheduleContainer.innerHTML = weeklyHtml || '<p>Bạn trống lịch tuần này.</p>';
}

window.switchTeacherMainTab = function(tabName) {
    document.getElementById('tc-main-progress-btn').classList.remove('active');
    document.getElementById('tc-main-schedule-btn').classList.remove('active');
    
    document.getElementById('tc-main-' + tabName + '-btn').classList.add('active');
    
    if (tabName === 'progress') {
        document.getElementById('tc-main-progress').style.display = 'block';
        document.getElementById('tc-main-schedule').style.display = 'none';
    } else {
        document.getElementById('tc-main-progress').style.display = 'none';
        document.getElementById('tc-main-schedule').style.display = 'block';
    }
};

window.teacherOpenClass = function(id, name) {
    currentClassId = id; 
    document.getElementById('teacherDetailClassName').textContent = name + " (" + id + ")";
    
    document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
    document.getElementById('class-detail-tab').classList.add('active-tab');
    
    switchTeacherSubTab('grades');
};

window.switchTeacherSubTab = function(tabName) {
    document.getElementById('tc-tab-grades-btn').classList.remove('active'); 
    document.getElementById('tc-tab-sessions-btn').classList.remove('active');
    
    let activeBtnId = 'tc-tab-' + tabName + '-btn';
    document.getElementById(activeBtnId).classList.add('active');
    
    if (tabName === 'grades') {
        document.getElementById('tc-sub-grades').style.display = 'block'; 
        document.getElementById('tc-sub-sessions').style.display = 'none';
        teacherRenderGrades();
    } else {
        document.getElementById('tc-sub-grades').style.display = 'none'; 
        document.getElementById('tc-sub-sessions').style.display = 'block';
        teacherRenderSessions();
    }
};

function teacherRenderGrades() {
    let classes = getDB('Classes');
    let targetClass = classes.find(cls => cls.id === currentClassId); 
    const users = getDB('Users');
    
    let tbody = document.getElementById('tcStudentGrades'); 
    let html = '';

    for (let sid of targetClass.enrolledStudents) {
        let stu = users.find(u => u.id === sid); 
        if (!stu) continue;
        
        let g = targetClass.grades[sid] || { cc: 0, gk: 0, ck: 0 };
        let avg = (g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1);
        
        html += `
            <tr>
                <td><strong class="text-primary">${stu.name}</strong><br><span class="text-muted text-sm">${stu.id}</span></td>
                <td><input type="number" id="cc_${stu.id}" value="${g.cc}" min="0" max="10" step="0.1" style="width:60px; padding:5px;"></td>
                <td><input type="number" id="gk_${stu.id}" value="${g.gk}" min="0" max="10" step="0.1" style="width:60px; padding:5px;"></td>
                <td><input type="number" id="ck_${stu.id}" value="${g.ck}" min="0" max="10" step="0.1" style="width:60px; padding:5px;"></td>
                <td class="text-success font-bold">${avg}</td>
                <td><button class="action-btn" onclick="teacherSaveGrade('${stu.id}')">Lưu Điểm</button></td>
            </tr>`;
    }
    
    if (tbody) tbody.innerHTML = html || '<tr><td colspan="6">Lớp chưa có sinh viên đăng ký.</td></tr>';
}

window.teacherSaveGrade = function(sid) {
    let classes = getDB('Classes'); 
    let targetClass = classes.find(cls => cls.id === currentClassId);
    
    targetClass.grades[sid] = {
        cc: parseFloat(document.getElementById('cc_' + sid).value) || 0,
        gk: parseFloat(document.getElementById('gk_' + sid).value) || 0,
        ck: parseFloat(document.getElementById('ck_' + sid).value) || 0
    };
    
    setDB('Classes', classes); 
    alert("Lưu điểm thành công!"); 
    teacherRenderGrades();
};

function teacherRenderSessions() {
    let targetClass = getDB('Classes').find(cls => cls.id === currentClassId);
    let container = document.getElementById('tcSessionList');
    
    let html = '';
    for (let s of targetClass.sessions) {
        html += `
            <div class="chart-box border-left-dark">
                <h4>Ngày học: ${s.date}</h4>
                <p class="text-muted">${getPeriodText(s.startPeriod, s.endPeriod)}</p>
                <button class="btn-primary mt-10" onclick="teacherOpenAtt('${s.id}')">Thực hiện Điểm danh</button>
            </div>`;
    }
    
    if (container) container.innerHTML = html || '<p>Giáo vụ chưa xếp lịch các buổi học.</p>';
}

// BẬT POPUP ĐIỂM DANH
window.teacherOpenAtt = function(sessionId) {
    currentSessionId = sessionId;
    
    let classes = getDB('Classes');
    let targetClass = classes.find(cls => cls.id === currentClassId);
    let targetSession = targetClass.sessions.find(x => x.id === sessionId); 
    const users = getDB('Users');

    document.getElementById('tcAttSessionInfo').textContent = "Bảng Điểm Danh (Ngày " + targetSession.date + ")";
    
    let html = '';
    for (let id of targetClass.enrolledStudents) {
        let stu = users.find(u => u.id === id); 
        if (!stu) continue;
        
        let status = targetSession.attendance[id] || '';
        let isPresent = status === 'present' ? 'checked' : '';
        let isLate = status === 'late' ? 'checked' : '';
        let isAbsent = status === 'absent' ? 'checked' : '';

        html += `
            <tr>
                <td><strong class="text-primary">${stu.name}</strong><br><span class="text-muted text-sm">${stu.id}</span></td>
                <td>
                    <div class="radio-group">
                        <label class="text-success font-bold"><input type="radio" name="att_${stu.id}" value="present" ${isPresent}> Có mặt</label>
                        <label class="text-warning font-bold"><input type="radio" name="att_${stu.id}" value="late" ${isLate}> Muộn</label>
                        <label class="text-danger font-bold"><input type="radio" name="att_${stu.id}" value="absent" ${isAbsent}> Vắng</label>
                    </div>
                </td>
            </tr>`;
    }
    
    document.getElementById('tcAttendanceList').innerHTML = html || '<tr><td colspan="2">Chưa có sinh viên</td></tr>';
    document.getElementById('tcAttModal').style.display = 'block';
};

window.teacherSaveAttendance = function() {
    let classes = getDB('Classes'); 
    let targetClass = classes.find(cls => cls.id === currentClassId);
    let targetSession = targetClass.sessions.find(x => x.id === currentSessionId);

    for (let id of targetClass.enrolledStudents) {
        let checkedRadio = document.querySelector(`input[name="att_${id}"]:checked`);
        if (checkedRadio) {
            targetSession.attendance[id] = checkedRadio.value;
        }
    }
    
    setDB('Classes', classes); 
    alert("Đã chốt bảng điểm danh!"); 
    document.getElementById('tcAttModal').style.display = 'none';
};