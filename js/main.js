// ==========================================
// 0. CÁC HÀM TRỢ GIÚP DỮ LIỆU LÕI (CỰC KỲ GỌN)
// ==========================================
function getDB(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    let parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function checkOverlap(classA, classB) {
    if (classA.dayOfWeek !== classB.dayOfWeek) return false;
    let startA = timeToMinutes(classA.startTime);
    let endA = timeToMinutes(classA.endTime);
    let startB = timeToMinutes(classB.startTime);
    let endB = timeToMinutes(classB.endTime);
    return startA < endB && endA > startB;
}

function generateDates(startDate, endDate, dayOfWeekText) {
    const dayMap = {'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6};
    let targetDay = dayMap[dayOfWeekText];
    let resultDates = [];
    let current = new Date(startDate);
    let end = new Date(endDate);

    while (current <= end) {
        if (current.getDay() === targetDay) {
            let dateString = current.toISOString().split('T')[0];
            resultDates.push(dateString);
        }
        current.setDate(current.getDate() + 1);
    }
    return resultDates;
}

// Biến quản lý đồ họa
let attChart = null; let gradeChart = null;

// ==========================================
// 1. LOGIC VAI TRÒ ADMIN
// ==========================================
function initAdmin() {
    renderAdminClassList();
    setupAdminFormOptions();
    
    document.getElementById('adminCreateClassForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        let classes = getDB('Classes');
        let subjects = getDB('Subjects');
        
        let subId = document.getElementById('admSub').value;
        let abbr = subjects.find(s => s.id === subId)?.abbr || 'CLASS';
        let newClassId = abbr + '_L' + (classes.filter(c => c.subjectId === subId).length + 1);

        let day = document.getElementById('admDay').value;
        let startDate = document.getElementById('admStartDate').value;
        let endDate = document.getElementById('admEndDate').value;
        let startTime = document.getElementById('admStart').value;
        let endTime = document.getElementById('admEnd').value;

        let dates = generateDates(startDate, endDate, day);
        let sessions = [];
        for (let d of dates) {
            sessions.push({ id: 'SES_' + Date.now() + Math.random(), date: d, startTime: startTime, endTime: endTime, attendance: {} });
        }

        classes.push({
            id: newClassId, subjectId: subId, teacherId: document.getElementById('admTeacher').value,
            room: document.getElementById('admRoom').value, dayOfWeek: day, startDate: startDate, endDate: endDate,
            startTime: startTime, endTime: endTime, enrolledStudents: [], sessions: sessions, grades: {}
        });

        setDB('Classes', classes);
        alert("Tạo lớp và sinh thời khóa biểu hoàn tất!");
        this.reset();
        renderAdminClassList();
    });

    document.getElementById('editClassForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        let classes = getDB('Classes');
        let id = document.getElementById('editClassId').value;
        let target = classes.find(c => c.id === id);

        if (target) {
            target.subjectId = document.getElementById('editClassSub').value;
            target.teacherId = document.getElementById('editClassTeacher').value;
            target.room = document.getElementById('editClassRoom').value;
            target.dayOfWeek = document.getElementById('editClassDay').value;
            target.startDate = document.getElementById('editClassStartDate').value;
            target.endDate = document.getElementById('editClassEndDate').value;
            target.startTime = document.getElementById('editClassStart').value;
            target.endTime = document.getElementById('editClassEnd').value;

            if (confirm("Hệ thống sẽ làm mới toàn bộ chuỗi buổi học bên trong theo cấu hình thời gian mới?")) {
                let dates = generateDates(target.startDate, target.endDate, target.dayOfWeek);
                target.sessions = dates.map(d => ({ id: 'SES_' + Date.now() + Math.random(), date: d, startTime: target.startTime, endTime: target.endTime, attendance: {} }));
                setDB('Classes', classes);
                alert("Đã cập nhật!");
                document.getElementById('admEditClassModal').style.display = 'none';
                renderAdminClassList();
            }
        }
    });
}

function setupAdminFormOptions() {
    const users = getDB('Users');
    const subjects = getDB('Subjects');
    const admSub = document.getElementById('admSub');
    const admTeacher = document.getElementById('admTeacher');
    const editSub = document.getElementById('editClassSub');
    const editTeacher = document.getElementById('editClassTeacher');
    const adminUsersList = document.getElementById('adminUsersList');

    if (admSub && admTeacher) {
        for (let s of subjects) {
            let option = `<option value="${s.id}">${s.name}</option>`;
            admSub.innerHTML += option; editSub.innerHTML += option;
        }
        for (let t of users.filter(u => u.role === 'teacher')) {
            let option = `<option value="${t.id}">${t.name}</option>`;
            admTeacher.innerHTML += option; editTeacher.innerHTML += option;
        }
    }

    if (adminUsersList) {
        let html = '';
        for (let u of users) {
            html += `<tr><td>${u.id}</td><td>${u.role.toUpperCase()}</td><td>${u.name}</td><td>${u.email}</td></tr>`;
        }
        adminUsersList.innerHTML = html;
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
        let subName = subjects.find(s => s.id === c.subjectId)?.name;
        let tcName = users.find(u => u.id === c.teacherId)?.name;

        html += `
            <div class="chart-box">
                <h3 style="color:#007bff; cursor:pointer;" onclick="adminOpenClass('${c.id}')">${subName} - ${c.id}</h3>
                <p class="mt-10">GV: ${tcName} | Phòng: ${c.room}</p>
                <p style="color:#666; font-size:13px;">Lịch: ${c.dayOfWeek} (${c.startTime} - ${c.endTime})</p>
                <p style="font-weight:bold; margin-top:5px;">${c.enrolledStudents.length} SV | ${c.sessions.length} Buổi</p>
                <div style="margin-top:auto; padding-top:15px; display:flex; gap:10px;">
                    <button class="action-btn flex-1" onclick="adminEditClass('${c.id}')">Sửa lớp</button>
                    <button class="action-btn btn-danger flex-1" onclick="adminDeleteClass('${c.id}')">Xóa lớp</button>
                </div>
            </div>`;
    }
    container.innerHTML = html || '<p>Chuyển giao diện trống.</p>';
}

window.adminEditClass = function(id) {
    let c = getDB('Classes').find(x => x.id === id);
    if (!c) return;
    document.getElementById('editClassId').value = id;
    document.getElementById('editClassSub').value = c.subjectId;
    document.getElementById('editClassTeacher').value = c.teacherId;
    document.getElementById('editClassRoom').value = c.room;
    document.getElementById('editClassDay').value = c.dayOfWeek;
    document.getElementById('editClassStartDate').value = c.startDate || '';
    document.getElementById('editClassEndDate').value = c.endDate || '';
    document.getElementById('editClassStart').value = c.startTime;
    document.getElementById('editClassEnd').value = c.endTime;
    document.getElementById('admEditClassModal').style.display = 'block';
};

window.adminDeleteClass = function(id) {
    if (confirm("Xóa lớp học này sẽ xóa vĩnh viễn dữ liệu điểm và điểm danh liên quan?")) {
        let classes = getDB('Classes').filter(c => c.id !== id);
        setDB('Classes', classes);
        renderAdminClassList();
    }
};

window.adminOpenClass = function(id) {
    currentClassId = id;
    document.getElementById('admDetailClassName').textContent = "Lớp: " + id;
    document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
    document.getElementById('admin-class-detail').classList.add('active-tab');
    switchAdmSubTab('students');
};

window.switchAdmSubTab = function(tab) {
    document.getElementById('adm-tab-students-btn').classList.remove('active');
    document.getElementById('adm-tab-sessions-btn').classList.remove('active');
    document.getElementById('adm-tab-' + tab + '-btn').classList.add('active');
    document.getElementById('adm-sub-students').style.display = tab === 'students' ? 'block' : 'none';
    document.getElementById('adm-sub-sessions').style.display = tab === 'sessions' ? 'block' : 'none';
    if (tab === 'students') adminRenderStudents();
    if (tab === 'sessions') adminRenderSessions();
};

function adminRenderStudents() {
    let c = getDB('Classes').find(x => x.id === currentClassId);
    let users = getDB('Users');
    let tbody = document.getElementById('admStudentList');
    let html = '';
    for (let id of c.enrolledStudents) {
        let u = users.find(x => x.id === id);
        if (u) {
            html += `<tr><td>${u.id}</td><td>${u.name}</td><td><button class="action-btn btn-danger" onclick="adminRemoveStudent('${u.id}')">Xóa</button></td></tr>`;
        }
    }
    tbody.innerHTML = html || '<tr><td colspan="3">Lớp học trống.</td></tr>';
}

window.adminAddStudentToClass = function() {
    let id = document.getElementById('addStuId').value.trim();
    let users = getDB('Users');
    if (!users.some(u => u.id === id && u.role === 'student')) return alert("Không tồn tại sinh viên!");
    
    let classes = getDB('Classes');
    let c = classes.find(x => x.id === currentClassId);
    if (c.enrolledStudents.includes(id)) return alert("Sinh viên đã ở trong lớp!");
    
    c.enrolledStudents.push(id);
    setDB('Classes', classes);
    document.getElementById('addStuId').value = '';
    adminRenderStudents();
};

window.adminRemoveStudent = function(id) {
    let classes = getDB('Classes');
    let c = classes.find(x => x.id === currentClassId);
    c.enrolledStudents = c.enrolledStudents.filter(sid => sid !== id);
    setDB('Classes', classes);
    adminRenderStudents();
};

function adminRenderSessions() {
    let c = getDB('Classes').find(x => x.id === currentClassId);
    let tbody = document.getElementById('admSessionList');
    let html = '';
    for (let s of c.sessions) {
        html += `<tr><td>${s.date}</td><td>${s.startTime} - ${s.endTime}</td><td><button class="action-btn" onclick="adminOpenEditSession('${s.id}')">Sửa</button> <button class="action-btn btn-danger" onclick="adminRemoveSession('${s.id}')">Xóa</button></td></tr>`;
    }
    tbody.innerHTML = html || '<tr><td colspan="3">Chưa có lịch.</td></tr>';
}

window.adminCreateSingleSession = function() {
    let classes = getDB('Classes');
    let c = classes.find(x => x.id === currentClassId);
    c.sessions.push({
        id: 'SES_' + Date.now(),
        date: document.getElementById('aSesDate').value,
        startTime: document.getElementById('aSesStart').value,
        endTime: document.getElementById('aSesEnd').value,
        attendance: {}
    });
    setDB('Classes', classes);
    adminRenderSessions();
};

window.adminOpenEditSession = function(sid) {
    let c = getDB('Classes').find(x => x.id === currentClassId);
    let s = c.sessions.find(x => x.id === sid);
    document.getElementById('editSessionId').value = sid;
    document.getElementById('editSesDate').value = s.date;
    document.getElementById('editSesStart').value = s.startTime;
    document.getElementById('editSesEnd').value = s.endTime;
    document.getElementById('admEditSessionModal').style.display = 'block';
};

window.adminRemoveSession = function(sid) {
    let classes = getDB('Classes');
    let c = classes.find(x => x.id === currentClassId);
    c.sessions = c.sessions.filter(s => s.id !== sid);
    setDB('Classes', classes);
    adminRenderSessions();
};

// ==========================================
// 2. LOGIC VAI TRÒ GIÁO VIÊN
// ==========================================
function initTeacher(user) {
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
        if (newPass) user.password = newPass;
        user.phone = document.getElementById('editPhoneTc').value.trim();
        user.dob = document.getElementById('editDobTc').value;

        localStorage.setItem('currentUser', JSON.stringify(user));
        let index = users.findIndex(u => u.id === user.id);
        if(index > -1) users[index] = user;
        setDB('Users', users);
        alert("Đã bảo mật thông tin!");
        window.location.reload();
    });

    const classes = getDB('Classes');
    const subjects = getDB('Subjects');
    let container = document.getElementById('teacherClassList');
    let html = '';

    for (let c of classes.filter(cls => cls.teacherId === user.id)) {
        let subName = subjects.find(s => s.id === c.subjectId)?.name;
        html += `<div class="chart-box"><h3>${subName} - ${c.id}</h3><p class="mt-10">Phòng: ${c.room}</p><p style="font-weight:bold; margin-top:10px;">${c.enrolledStudents.length} Sinh viên</p><button class="btn-primary mt-10" onclick="teacherOpenClass('${c.id}', '${subName}')">Vào Lớp</button></div>`;
    }
    if(container) container.innerHTML = html || '<p>Chưa gán lớp.</p>';
}

window.teacherOpenClass = function(id, name) {
    currentClassId = id;
    document.getElementById('teacherDetailClassName').textContent = name + " (" + id + ")";
    document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
    document.getElementById('class-detail-tab').classList.add('active-tab');
    switchTeacherSubTab('grades');
};

window.switchTeacherSubTab = function(tab) {
    document.getElementById('tc-tab-grades-btn').classList.remove('active');
    document.getElementById('tc-tab-sessions-btn').classList.remove('active');
    document.getElementById('tc-tab-' + tab + '-btn').classList.add('active');
    document.getElementById('tc-sub-grades').style.display = tab === 'grades' ? 'block' : 'none';
    document.getElementById('tc-sub-sessions').style.display = tab === 'sessions' ? 'block' : 'none';
    if (tab === 'grades') teacherRenderGrades();
    if (tab === 'sessions') teacherRenderSessions();
};

function teacherRenderGrades() {
    let c = getDB('Classes').find(cls => cls.id === currentClassId);
    let users = getDB('Users');
    let tbody = document.getElementById('tcStudentGrades');
    let html = '';

    for (let sid of c.enrolledStudents) {
        let stu = users.find(u => u.id === sid);
        let g = c.grades[sid] || { cc: 0, gk: 0, ck: 0 };
        let avg = (g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1);

        html += `<tr><td><strong>${stu.name}</strong><br><span style="font-size:12px;color:#666;">${stu.id}</span></td><td><input type="number" id="cc_${stu.id}" value="${g.cc}" style="width:60px; padding:5px;"></td><td><input type="number" id="gk_${stu.id}" value="${g.gk}" style="width:60px; padding:5px;"></td><td><input type="number" id="ck_${stu.id}" value="${g.ck}" style="width:60px; padding:5px;"></td><td style="color:green;font-weight:bold;">${avg}</td><td><button class="action-btn" onclick="teacherSaveGrade('${stu.id}')">Lưu</button></td></tr>`;
    }
    tbody.innerHTML = html;
}

window.teacherSaveGrade = function(sid) {
    let classes = getDB('Classes');
    let c = classes.find(cls => cls.id === currentClassId);
    c.grades[sid] = {
        cc: parseFloat(document.getElementById('cc_' + sid).value) || 0,
        gk: parseFloat(document.getElementById('gk_' + sid).value) || 0,
        ck: parseFloat(document.getElementById('ck_' + sid).value) || 0
    };
    setDB('Classes', classes);
    alert("Ghi nhận điểm!");
    teacherRenderGrades();
};

function teacherRenderSessions() {
    let c = getDB('Classes').find(cls => cls.id === currentClassId);
    let container = document.getElementById('tcSessionList');
    let html = '';
    for (let s of c.sessions) {
        html += `<div class="chart-box"><h4>Ngày học: ${s.date}</h4><p>${s.startTime} - ${s.endTime}</p><button class="btn-primary mt-10" onclick="teacherOpenAtt('${s.id}')">Điểm danh</button></div>`;
    }
    container.innerHTML = html || '<p>Trống.</p>';
}

window.teacherOpenAtt = function(sid) {
    currentSessionId = sid;
    let c = getDB('Classes').find(cls => cls.id === currentClassId);
    let s = c.sessions.find(x => x.id === sid);
    let users = getDB('Users');

    document.getElementById('tcAttSessionInfo').textContent = "Bảng ngày: " + s.date;
    document.getElementById('tcAttendanceView').style.display = 'block';

    let html = '';
    for (let id of c.enrolledStudents) {
        let stu = users.find(u => u.id === id);
        let status = s.attendance[id] || '';
        html += `<tr>
            <td><strong>${stu.name}</strong><br><span style="font-size:12px;color:#666">${stu.id}</span></td>
            <td>
                <div class="radio-group">
                    <label style="color:green"><input type="radio" name="att_${stu.id}" value="present" ${status==='present'?'checked':''}> Có mặt</label>
                    <label style="color:orange"><input type="radio" name="att_${stu.id}" value="late" ${status==='late'?'checked':''}> Muộn</label>
                    <label style="color:red"><input type="radio" name="att_${stu.id}" value="absent" ${status==='absent'?'checked':''}> Vắng</label>
                </div>
            </td>
        </tr>`;
    }
    document.getElementById('tcAttendanceList').innerHTML = html;
};

window.teacherSaveAttendance = function() {
    let classes = getDB('Classes');
    let c = classes.find(cls => cls.id === currentClassId);
    let s = c.sessions.find(x => x.id === currentSessionId);

    for (let id of c.enrolledStudents) {
        let checkedRadio = document.querySelector(`input[name="att_${id}"]:checked`);
        if (checkedRadio) {
            s.attendance[id] = checkedRadio.value;
        }
    }
    setDB('Classes', classes);
    alert("Đã chốt danh sách vắng vắng/có mặt!");
    document.getElementById('tcAttendanceView').style.display = 'none';
};

// ==========================================
// 3. LOGIC VAI TRÒ SINH VIÊN (SỬA LỖI ĐỐI TƯỢNG CLICK)
// ==========================================
function initStudent(user) {
    document.getElementById('profId').textContent = user.id;
    document.getElementById('profDob').textContent = user.dob || 'Chưa cập nhật';
    document.getElementById('profPhone').textContent = user.phone || 'Chưa cập nhật';

    document.getElementById('btnShowEditProfile')?.addEventListener('click', () => {
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editDob').value = user.dob || '';
        document.getElementById('editProfileFormContainer').style.display = 'block';
    });
    document.getElementById('btnCancelEditProfile')?.addEventListener('click', () => {
        document.getElementById('editProfileFormContainer').style.display = 'none';
    });

    document.getElementById('editProfileForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        let users = getDB('Users');
        let newPass = document.getElementById('editPass').value.trim();
        if (newPass) user.password = newPass;
        user.phone = document.getElementById('editPhone').value.trim();
        user.dob = document.getElementById('editDob').value;

        localStorage.setItem('currentUser', JSON.stringify(user));
        let index = users.findIndex(u => u.id === user.id);
        if(index > -1) users[index] = user;
        setDB('Users', users);
        alert("Đã cập nhật thông tin thành công!");
        window.location.reload();
    });

    renderStudentStudyDashboard(user);
    renderRegistrationTab(user);
}

window.switchStuStudyTab = function(tab) {
    document.getElementById('stu-tab-schedule-btn').classList.remove('active');
    document.getElementById('stu-tab-progress-btn').classList.remove('active');
    document.getElementById('stu-tab-' + tab + '-btn').classList.add('active');
    document.getElementById('stu-sub-schedule').style.display = tab === 'schedule' ? 'block' : 'none';
    document.getElementById('stu-sub-progress').style.display = tab === 'progress' ? 'block' : 'none';
};

function renderStudentStudyDashboard(user) {
    const classes = getDB('Classes');
    const subjects = getDB('Subjects');
    const users = getDB('Users');
    
    let myClasses = classes.filter(c => c.enrolledStudents.includes(user.id));
    let todayStr = new Date().toISOString().split('T')[0];

    let weeklyDays = { 'Thứ 2':[], 'Thứ 3':[], 'Thứ 4':[], 'Thứ 5':[], 'Thứ 6':[], 'Thứ 7':[], 'Chủ nhật':[] };
    let cardsHtml = '';
    
    let sumScore = 0, scoredMônCount = 0, excellentCount = 0;
    let presentCount = 0, lateCount = 0, absentCount = 0;
    let pieData = { xuatSac: 0, gioi: 0, kha: 0, trungBinh: 0, yeu: 0 };

    for (let c of myClasses) {
        let subName = subjects.find(s => s.id === c.subjectId)?.name;
        let tcName = users.find(u => u.id === c.teacherId)?.name;

        weeklyDays[c.dayOfWeek].push({ subName, room: c.room, start: c.startTime, end: c.endTime });

        let total = c.sessions.length;
        let past = c.sessions.filter(s => s.date <= todayStr).length;
        let percent = total === 0 ? 0 : Math.round((past / total) * 100);

        let g = c.grades[user.id] || { cc: 0, gk: 0, ck: 0 };
        let avg = parseFloat((g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1));

        if (avg > 0) {
            scoredMônCount++; sumScore += avg;
            if (avg >= 8.0) excellentCount++;
            
            if (avg >= 9.0) pieData.xuatSac++;
            else if (avg >= 8.0) pieData.gioi++;
            else if (avg >= 6.5) pieData.kha++;
            else if (avg >= 5.0) pieData.trungBinh++;
            else pieData.yeu++;
        }

        for (let s of c.sessions) {
            let status = s.attendance[user.id];
            if (status === 'present') presentCount++;
            else if (status === 'late') lateCount++;
            else if (status === 'absent') absentCount++;
        }

        // BIẾN ĐỔI: Chỉ truyền mã `c.id` để tránh lỗi cú pháp dấu nháy kép của đối tượng dạng chuỗi!
        cardsHtml += `
            <div class="chart-box" style="cursor:pointer; border-left:5px solid #000;" onclick="openStuModal('${c.id}')">
                <h3>${subName} - ${c.id}</h3>
                <p class="mt-10">GV: ${tcName}</p>
                <div class="progress-bg"><div class="progress-fill" style="width:${percent}%;"></div></div>
                <span style="font-size:12px; font-weight:bold;">Tiến độ: ${percent}% (${past}/${total} buổi)</span>
                <p style="margin-top:10px; font-weight:bold; color:green;">Điểm tích lũy: ${avg}</p>
            </div>`;
    }

    let weeklyHtml = '';
    for (let d in weeklyDays) {
        if (weeklyDays[d].length > 0) {
            weeklyHtml += `<div style="min-width:200px; background:#fff; padding:15px; border-radius:8px; border:1px solid #ddd;"><h3 style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:10px;">${d}</h3>`;
            for (let item of weeklyDays[d]) {
                weeklyHtml += `<div style="margin-bottom:10px; background:#f9f9f9; padding:10px; border-radius:4px;"><strong>${item.subName}</strong><br><span style="font-size:12px; color:#666;">${item.start} - ${item.end} | P.${item.room}</span></div>`;
            }
            weeklyHtml += `</div>`;
        }
    }

    document.getElementById('weeklyScheduleContainer').innerHTML = weeklyHtml || '<p>Tuần này trống lịch.</p>';
    document.getElementById('enrolledClassesCards').innerHTML = cardsHtml || '<p>Chưa đăng ký lớp học.</p>';

    document.getElementById('stat-total-subjects').textContent = myClasses.length;
    document.getElementById('stat-gpa').textContent = scoredMônCount > 0 ? (sumScore / scoredMônCount).toFixed(1) : '0.0';
    document.getElementById('stat-excellent').textContent = excellentCount;
    
    let totalAttendance = presentCount + lateCount + absentCount;
    document.getElementById('stat-attendance-rate').textContent = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) + '%' : '0%';

    drawStudentCharts(presentCount, lateCount, absentCount, pieData);
}

function drawStudentCharts(p, l, a, pieData) {
    if (!document.getElementById('attendanceChart')) return;
    if (attChart) attChart.destroy();
    if (gradeChart) gradeChart.destroy();

    attChart = new Chart(document.getElementById('attendanceChart'), {
        type: 'bar',
        data: { labels: ['Có mặt', 'Đi muộn', 'Vắng'], datasets: [{ label: 'Số buổi', data: [p, l, a], backgroundColor: ['#4CAF50', '#FFC107', '#F44336'] }] },
        options: { scales: { y: { ticks: { stepSize: 1, precision: 0 } } } }
    });

    let totalPie = pieData.xuatSac + pieData.gioi + pieData.kha + pieData.trungBinh + pieData.yeu;
    if (totalPie > 0) {
        gradeChart = new Chart(document.getElementById('gradePieChart'), {
            type: 'pie',
            data: { labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'], datasets: [{ data: [pieData.xuatSac, pieData.gioi, pieData.kha, pieData.trungBinh, pieData.yeu], backgroundColor: ['#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#F44336'] }] }
        });
    }
}

// SỬA LỖI: Tìm ngược đối tượng từ ID truyền vào thay vì ép cấu trúc HTML phức tạp
window.openStuModal = function(classId) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    
    let c = classes.find(x => x.id === classId);
    if (!c) return;

    let subName = subjects.find(s => s.id === c.subjectId)?.name || '';
    let tcName = users.find(u => u.id === c.teacherId)?.name || '';

    document.getElementById('modalClassName').textContent = subName + " (" + c.id + ")";
    document.getElementById('modalTeacherName').textContent = "Giảng viên: " + tcName;
    
    let todayStr = new Date().toISOString().split('T')[0];
    const user = JSON.parse(localStorage.getItem('currentUser'));

    let html = '';
    for (let s of c.sessions) {
        let statusText = "Chưa diễn ra";
        if (s.date <= todayStr) {
            let state = s.attendance[user.id];
            if (state === 'present') statusText = '<span style="color:green;font-weight:bold;">Có mặt</span>';
            else if (state === 'late') statusText = '<span style="color:orange;font-weight:bold;">Đi muộn</span>';
            else if (state === 'absent') statusText = '<span style="color:red;font-weight:bold;">Vắng mặt</span>';
            else statusText = '<span style="color:gray;">Chưa điểm danh</span>';
        }
        html += `<tr><td>Ngày: ${s.date} (${s.startTime} - ${s.endTime})</td><td>${statusText}</td></tr>`;
    }
    document.getElementById('modalSessionList').innerHTML = html || '<tr><td colspan="2">Chưa xếp lịch chi tiết.</td></tr>';
    document.getElementById('stuClassModal').style.display = 'block';
};

function renderRegistrationTab(user) {
    const classes = getDB('Classes');
    const subjects = getDB('Subjects');
    const users = getDB('Users');
    let container = document.getElementById('registrationContainer');
    if (!container) return;

    let html = '';
    for (let sub of subjects) {
        let subClasses = classes.filter(cls => cls.subjectId === sub.id);
        if (subClasses.length === 0) continue;

        let myRegisteredClass = subClasses.find(cls => cls.enrolledStudents.includes(user.id));
        html += `<h3 style="margin-top:20px; border-bottom:1px solid #ccc; padding-bottom:5px;">Môn: ${sub.name}</h3><div class="mt-10">`;

        for (let c of subClasses) {
            let tcName = users.find(u => u.id === c.teacherId)?.name;
            let isEnrolled = (c.id === myRegisteredClass?.id);
            let isLockedBySubject = (myRegisteredClass && !isEnrolled);
            
            let hasTimeConflict = false;
            for (let dSub in draftSelectedClasses) {
                if (dSub !== sub.id) {
                    let draftClass = classes.find(x => x.id === draftSelectedClasses[dSub]);
                    if (draftClass && checkOverlap(c, draftClass)) {
                        hasTimeConflict = true;
                    }
                }
            }

            let cardClass = "reg-card";
            let actionField = "";

            if (isEnrolled) {
                cardClass += " disabled";
                actionField = `<span style="color:green; font-weight:bold;">Đã đăng ký thành công</span>`;
            } else if (isLockedBySubject) {
                cardClass += " disabled";
                actionField = `<span class="reg-conflict-text">Khóa (Môn đã chọn lớp khác)</span>`;
            } else if (hasTimeConflict) {
                cardClass += " disabled";
                actionField = `<span class="reg-conflict-text">Trùng lịch thời gian</span>`;
            } else {
                let isChecked = draftSelectedClasses[sub.id] === c.id ? 'checked' : '';
                actionField = `<input type="radio" name="reg_${sub.id}" value="${c.id}" ${isChecked} onchange="handleDraftSelection('${sub.id}', '${c.id}')">`;
            }

            html += `
                <div class="${cardClass}">
                    <div>
                        <strong>Mã lớp: ${c.id}</strong><br><span style="font-size:13px; color:#666;">Giảng viên: ${tcName} | Phòng: ${c.room}</span><br>
                        <span style="font-size:13px; font-weight:bold;">Lịch học: ${c.dayOfWeek} (${c.startTime} - ${c.endTime})</span>
                    </div>
                    <div>${actionField}</div>
                </div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}

window.handleDraftSelection = function(subId, classId) {
    draftSelectedClasses[subId] = classId;
    renderRegistrationTab(JSON.parse(localStorage.getItem('currentUser')));
};

window.commitRegistration = function() {
    let classes = getDB('Classes');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    let executed = false;

    for (let subId in draftSelectedClasses) {
        let targetClassId = draftSelectedClasses[subId];
        let c = classes.find(cls => cls.id === targetClassId);
        if (c && !c.enrolledStudents.includes(user.id)) {
            c.enrolledStudents.push(user.id);
            executed = true;
        }
    }

    if (executed) {
        setDB('Classes', classes);
        draftSelectedClasses = {};
        alert("Đăng ký tín chỉ hoàn tất!");
        renderRegistrationTab(user);
        renderStudentStudyDashboard(user);
    } else {
        alert("Bạn chưa chọn lớp mới nào.");
    }
};