let currentClassId = null;
let currentSessionId = null;

// ==========================================
// 1. KHỞI TẠO & HỒ SƠ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let user = getDB('currentUser');
    
    if (!user || user.role !== 'teacher') { 
        window.location.href = 'index.html'; 
        return; 
    }
    
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
    
    initSidebarNavigation();

    document.getElementById('tcProfId').textContent = user.id; 
    
    // Format hiển thị ngày sinh DD/MM/YYYY
    let displayDob = user.dob ? user.dob.split('-').reverse().join('/') : 'Chưa cập nhật';
    document.getElementById('tcProfDob').textContent = displayDob;
    document.getElementById('tcProfPhone').textContent = user.phone || 'Chưa cập nhật';
    
    // Mở Form Sửa Hồ Sơ
    let btnShowEdit = document.getElementById('btnShowEditProfileTc');
    if (btnShowEdit) {
        btnShowEdit.addEventListener('click', () => { 
            let form = document.forms['editProfileFormTc'];
            form.elements['phone'].value = user.phone || ''; 
            form.elements['dob'].value = user.dob || ''; 
            document.getElementById('editProfileFormContainerTc').style.display = 'block'; 
        });
    }
    
    // Đóng Form Sửa
    let btnCancelEdit = document.getElementById('btnCancelEditProfileTc');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => { 
            document.getElementById('editProfileFormContainerTc').style.display = 'none'; 
        });
    }

    // Xử lý Lưu Hồ sơ
    let editForm = document.getElementById('editProfileFormTc');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            
            let formData = new FormData(e.target);
            let newPassword = formData.get('password').trim();
            let newPhone = formData.get('phone').trim();
            let newDob = formData.get('dob');
            
            if (newPassword !== '') {
                user.password = newPassword;
            }
            user.phone = newPhone;
            user.dob = newDob;
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            let users = getDB('Users');
            let userIndex = users.findIndex(u => u.id === user.id); 
            if (userIndex > -1) {
                users[userIndex] = user; 
            }
            
            setDB('Users', users);
            alert("Cập nhật thông tin cá nhân thành công!"); 
            window.location.reload();
        });
    }

    renderTeacherDashboard(user);
});

// ==========================================
// 2. TỔNG QUAN LỚP HỌC CHÍNH
// ==========================================
function renderTeacherDashboard(user) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    
    let myClasses = classes.filter(cls => cls.teacherId === user.id);
    let todayStr = new Date().toLocaleDateString('en-CA');
    
    let totalStudentsCount = 0;
    let htmlCards = '';
    
    let weeklySchedule = { 
        'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] 
    };

    myClasses.forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || 'Unknown'; 
        totalStudentsCount += c.enrolledStudents.length;
        
        let timeString = getPeriodText(c.startPeriod, c.endPeriod);
        weeklySchedule[c.dayOfWeek].push({ 
            subName: subName, 
            room: c.room, 
            timeStr: timeString 
        });
        
        let totalSessions = c.sessions.length;
        let passedSessions = c.sessions.filter(s => s.date <= todayStr).length;
        let completionPercent = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

        htmlCards += `
            <div class="border-box border-left-dark cursor-pointer" onclick="teacherOpenClass('${c.id}', '${subName}')">
                <h3 class="text-primary">${subName} - ${c.id}</h3>
                <p class="mt-10 text-sm text-muted">Phòng học: <span class="font-bold">${c.room}</span></p>
                <div class="progress-bg">
                    <div class="progress-fill" style="width:${completionPercent}%;"></div>
                </div>
                <span class="text-sm font-bold text-muted">Tiến độ: ${completionPercent}% (${passedSessions}/${totalSessions} buổi)</span>
                <p class="font-bold text-success mt-auto pt-10">${c.enrolledStudents.length} SV tham gia</p>
            </div>
        `;
    });

    let htmlWeekly = Object.keys(weeklySchedule).filter(day => weeklySchedule[day].length > 0).map(day => {
        let itemsHtml = weeklySchedule[day].map(item => `
            <div class="bg-light p-10 mt-10">
                <strong class="text-primary">${item.subName}</strong><br>
                <span class="text-sm text-muted">${item.timeStr} | P.${item.room}</span>
            </div>
        `).join('');
        
        return `
            <div class="border-box">
                <h3 class="border-bottom">${day}</h3>
                ${itemsHtml}
            </div>
        `;
    }).join('');

    let elTotalClasses = document.getElementById('tc-total-classes');
    if (elTotalClasses) elTotalClasses.textContent = myClasses.length;
    
    let elTotalStudents = document.getElementById('tc-total-students');
    if (elTotalStudents) elTotalStudents.textContent = totalStudentsCount;
    
    let elClassList = document.getElementById('teacherClassList');
    if (elClassList) elClassList.innerHTML = htmlCards || '<p>Chưa có lớp phân công giảng dạy.</p>';
    
    let elSchedule = document.getElementById('tcWeeklyScheduleContainer');
    if (elSchedule) elSchedule.innerHTML = htmlWeekly || '<p>Trống lịch.</p>';
}

function switchTeacherMainTab(tabName) {
    switchSubTab('tc-main-' + tabName + '-btn', 'tc-main-' + tabName, '.tc-main-btn', '.tc-main-tab');
}

function switchTeacherSubTab(tabName) { 
    switchSubTab('tc-tab-' + tabName + '-btn', 'tc-sub-' + tabName, '.tc-sub-btn', '.tc-sub-tab'); 
    if (tabName === 'grades') {
        teacherRenderGrades(); 
    } else {
        teacherRenderSessions(); 
    }
}

function teacherOpenClass(classId, className) {
    currentClassId = classId; 
    document.getElementById('teacherDetailClassName').textContent = `${className} (${classId})`;
    
    document.querySelectorAll('.tab-section').forEach(t => {
        t.style.display = 'none';
    });
    
    document.getElementById('class-detail-tab').style.display = 'block';
    switchTeacherSubTab('grades');
}

// ==========================================
// 3. QUẢN LÝ ĐIỂM SỐ & ĐIỂM DANH
// ==========================================
function teacherRenderGrades() {
    let currentClassObj = getDB('Classes').find(cls => cls.id === currentClassId);
    let users = getDB('Users');
    
    let htmlContent = currentClassObj.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (!stu) return '';
        
        let grades = currentClassObj.grades[studentId] || { cc: 0, gk: 0, ck: 0 };
        let avgScore = (grades.cc * 0.2 + grades.gk * 0.3 + grades.ck * 0.5).toFixed(1);
        
        return `
            <tr>
                <td><strong class="text-primary">${stu.name}</strong><br><span class="text-muted text-sm">${stu.id}</span></td>
                <td><input type="number" id="cc_${stu.id}" value="${grades.cc}" style="width:60px; padding:5px;"></td>
                <td><input type="number" id="gk_${stu.id}" value="${grades.gk}" style="width:60px; padding:5px;"></td>
                <td><input type="number" id="ck_${stu.id}" value="${grades.ck}" style="width:60px; padding:5px;"></td>
                <td class="text-success font-bold">${avgScore}</td>
                <td><button class="action-btn" onclick="teacherSaveGrade('${stu.id}')">Lưu</button></td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('tcStudentGrades').innerHTML = htmlContent || '<tr><td colspan="6">Lớp học chưa có sinh viên.</td></tr>';
}

function teacherSaveGrade(studentId) {
    updateClassDB(currentClassId, function(c) {
        if (!c.grades[studentId]) {
            c.grades[studentId] = {};
        }
        
        let valCC = parseFloat(document.getElementById('cc_' + studentId).value) || 0;
        let valGK = parseFloat(document.getElementById('gk_' + studentId).value) || 0;
        let valCK = parseFloat(document.getElementById('ck_' + studentId).value) || 0;
        
        c.grades[studentId] = { 
            cc: valCC, 
            gk: valGK, 
            ck: valCK 
        };
    });
    
    alert("Đã lưu điểm thành công!"); 
    teacherRenderGrades();
}

function teacherRenderSessions() {
    let currentClassObj = getDB('Classes').find(cls => cls.id === currentClassId);
    
    let htmlContent = currentClassObj.sessions.map(s => {
        let isAttended = Object.keys(s.attendance).length > 0;
        let actionBtn = isAttended 
            ? `<button class="action-btn" onclick="teacherOpenAtt('${s.id}')">Sửa</button>` 
            : `<button class="btn-primary" style="padding:6px 12px; width:auto;" onclick="teacherOpenAtt('${s.id}')">Điểm danh</button>`;
            
        return `
            <tr>
                <td>${s.date}</td>
                <td>${getPeriodText(s.startPeriod, s.endPeriod)}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('tcSessionList').innerHTML = htmlContent || '<tr><td colspan="3">Chưa có lịch học được thiết lập.</td></tr>';
}

function teacherOpenAtt(sessionId) {
    currentSessionId = sessionId; 
    let currentClassObj = getDB('Classes').find(cls => cls.id === currentClassId);
    let targetSession = currentClassObj.sessions.find(x => x.id === sessionId);
    let users = getDB('Users');
    
    document.getElementById('tcAttSessionInfo').textContent = `Bảng Điểm Danh (Ngày ${targetSession.date})`;
    
    let htmlContent = currentClassObj.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (!stu) return ''; 
        
        let status = targetSession.attendance[studentId] || '';
        let isPresent = status === 'present' ? 'checked' : '';
        let isLate = status === 'late' ? 'checked' : '';
        let isAbsent = status === 'absent' ? 'checked' : '';
        
        return `
            <tr>
                <td>
                    <strong class="text-primary">${stu.name}</strong><br>
                    <span class="text-muted text-sm">${stu.id}</span>
                </td>
                <td>
                    <div class="radio-group">
                        <label class="text-success font-bold">
                            <input type="radio" name="att_${stu.id}" value="present" ${isPresent}> Có mặt
                        </label>
                        <label class="text-warning font-bold">
                            <input type="radio" name="att_${stu.id}" value="late" ${isLate}> Muộn
                        </label>
                        <label class="text-danger font-bold">
                            <input type="radio" name="att_${stu.id}" value="absent" ${isAbsent}> Vắng
                        </label>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('tcAttendanceList').innerHTML = htmlContent || '<tr><td colspan="2">Lớp học trống</td></tr>';
    document.getElementById('tcAttModal').style.display = 'block';
}

function teacherSaveAttendance() {
    updateClassDB(currentClassId, function(c) {
        let targetSession = c.sessions.find(x => x.id === currentSessionId);
        
        c.enrolledStudents.forEach(studentId => { 
            let radioInput = document.querySelector(`input[name="att_${studentId}"]:checked`); 
            if (radioInput) {
                targetSession.attendance[studentId] = radioInput.value; 
            }
        });
    });
    
    alert("Đã chốt danh sách điểm danh!"); 
    document.getElementById('tcAttModal').style.display = 'none'; 
    teacherRenderSessions();
}