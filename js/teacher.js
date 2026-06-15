// KHÔNG CÒN BIẾN TOÀN CỤC currentClassId và currentSessionId NỮA!

// ==========================================
// 1. KHỞI TẠO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let user = getDB('currentUser');
    
    if (!user || user.role !== 'teacher') { 
        window.location.href = 'index.html'; 
        return; 
    }
    
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
    
    initCommonUI();
    initProfileUI(user);

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
    let weeklySchedule = { 'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] };

    myClasses.forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || 'Unknown'; 
        totalStudentsCount += c.enrolledStudents.length;
        weeklySchedule[c.dayOfWeek].push({ subName: subName, room: c.room, timeStr: getPeriodText(c.startPeriod, c.endPeriod) });
    });

    subjects.forEach(sub => {
        let classesOfSubject = myClasses.filter(c => c.subjectId === sub.id);
        if (classesOfSubject.length === 0) return;
        
        htmlCards += `<h3 class="border-bottom mt-20 mb-10">${sub.name}</h3>`;

        classesOfSubject.forEach(c => {
            let totalSessions = c.sessions.length;
            let passedSessions = c.sessions.filter(s => s.date <= todayStr).length;
            let completionPercent = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

            htmlCards += `
                <div class="border-box border-left-dark flex-row align-center justify-between mb-10 cursor-pointer" onclick="teacherOpenClass('${c.id}', '${sub.name}')">
                    <div class="flex-1">
                        <h4 class="mb-10 text-primary">Mã lớp: ${c.id}</h4>
                        <p class="text-sm text-muted mb-10">Phòng học: <span class="font-bold">${c.room}</span> | <span class="text-success font-bold">${c.enrolledStudents.length} SV tham gia</span></p>
                        <div class="progress-bg mt-10">
                            <div class="progress-fill" style="width:${completionPercent}%;"></div>
                        </div>
                        <span class="text-sm font-bold text-muted">Tiến độ: ${completionPercent}% (${passedSessions}/${totalSessions} buổi)</span>
                    </div>
                </div>
            `;
        });
    });

    let htmlWeekly = Object.keys(weeklySchedule).filter(day => weeklySchedule[day].length > 0).map(day => {
        let itemsHtml = weeklySchedule[day].map(item => `
            <div class="bg-light p-10 mt-10">
                <strong class="text-primary">${item.subName}</strong><br>
                <span class="text-sm text-muted">${item.timeStr} | P.${item.room}</span>
            </div>
        `).join('');
        return `<div class="border-box"><h3 class="border-bottom">${day}</h3>${itemsHtml}</div>`;
    }).join('');

    document.getElementById('tc-total-classes').textContent = myClasses.length;
    document.getElementById('tc-total-students').textContent = totalStudentsCount;
    document.getElementById('teacherClassList').innerHTML = htmlCards || '<p style="padding: 20px;">Chưa có lớp phân công.</p>';
    document.getElementById('tcWeeklyScheduleContainer').innerHTML = htmlWeekly || '<p>Trống lịch.</p>';
}

function teacherOpenClass(classId, className) {
    // LƯU classId VÀO DATASET CỦA THẺ CHA THAY VÌ DÙNG BIẾN TOÀN CỤC
    document.getElementById('class-detail-tab').dataset.classId = classId; 
    document.getElementById('teacherDetailClassName').textContent = `${className} (${classId})`;
    
    document.querySelectorAll('.tab-section').forEach(t => t.style.display = 'none');
    document.getElementById('class-detail-tab').style.display = 'block';
    
    // Tự động kích hoạt tab "Nhập điểm số"
    document.querySelector('[data-target="tc-sub-grades"]').click();
    teacherRenderGrades();
}

// ==========================================
// 3. QUẢN LÝ ĐIỂM SỐ & ĐIỂM DANH
// ==========================================
function teacherRenderGrades() {
    // Lấy lại classId từ Dataset của HTML
    let classId = document.getElementById('class-detail-tab').dataset.classId;
    let currentClassObj = getDB('Classes').find(cls => cls.id === classId);
    let users = getDB('Users');
    
    let htmlContent = currentClassObj.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (!stu) return '';
        
        let grades = currentClassObj.grades[studentId] || { cc: null, gk: null, ck: null };
        let avgScore = calcAvgScore(grades.cc, grades.gk, grades.ck);
        
        return `
            <tr>
                <td><strong class="text-primary">${stu.name}</strong><br><span class="text-muted text-sm">${stu.id}</span></td>
                <td><input type="number" id="cc_${stu.id}" value="${grades.cc !== null ? grades.cc : ''}" min="0" max="10" step="0.1" style="width:70px; padding:5px;"></td>
                <td><input type="number" id="gk_${stu.id}" value="${grades.gk !== null ? grades.gk : ''}" min="0" max="10" step="0.1" style="width:70px; padding:5px;"></td>
                <td><input type="number" id="ck_${stu.id}" value="${grades.ck !== null ? grades.ck : ''}" min="0" max="10" step="0.1" style="width:70px; padding:5px;"></td>
                <td class="text-success font-bold">${avgScore !== null ? avgScore : "--"}</td>
                <td><button class="action-btn" onclick="teacherSaveGrade('${stu.id}')">Lưu</button></td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('tcStudentGrades').innerHTML = htmlContent || '<tr><td colspan="6">Lớp học chưa có sinh viên.</td></tr>';
}

function teacherSaveGrade(studentId) {
    let classId = document.getElementById('class-detail-tab').dataset.classId;
    
    let ccInp = document.getElementById('cc_' + studentId).value;
    let gkInp = document.getElementById('gk_' + studentId).value;
    let ckInp = document.getElementById('ck_' + studentId).value;
    
    let valCC = ccInp === "" ? null : parseFloat(ccInp);
    let valGK = gkInp === "" ? null : parseFloat(gkInp);
    let valCK = ckInp === "" ? null : parseFloat(ckInp);
    
    if ((valCC !== null && valCC < 0) || (valGK !== null && valGK < 0) || (valCK !== null && valCK < 0)) {
        alert("Điểm số thành phần không được nhỏ hơn 0!"); return;
    }
    if ((valCC !== null && valCC > 10) || (valGK !== null && valGK > 10) || (valCK !== null && valCK > 10)) {
        alert("Điểm số không được lớn hơn 10!"); return;
    }
    
    updateClassDB(classId, function(c) {
        if (!c.grades[studentId]) c.grades[studentId] = {};
        c.grades[studentId] = { cc: valCC, gk: valGK, ck: valCK };
    });
    
    alert("Đã lưu điểm thành công!"); 
    teacherRenderGrades();
}

function teacherRenderSessions() {
    let classId = document.getElementById('class-detail-tab').dataset.classId;
    let currentClassObj = getDB('Classes').find(cls => cls.id === classId);
    
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
    
    document.getElementById('tcSessionList').innerHTML = htmlContent || '<tr><td colspan="3">Chưa có lịch học.</td></tr>';
}

function teacherOpenAtt(sessionId) {
    let classId = document.getElementById('class-detail-tab').dataset.classId;
    let currentClassObj = getDB('Classes').find(cls => cls.id === classId);
    let targetSession = currentClassObj.sessions.find(x => x.id === sessionId);
    let users = getDB('Users');
    
    // Lưu lại Session ID vào Modal
    document.getElementById('tcAttModal').dataset.sessionId = sessionId;
    document.getElementById('tcAttSessionInfo').textContent = `Điểm Danh (Ngày ${targetSession.date})`;
    
    let htmlContent = currentClassObj.enrolledStudents.map(studentId => {
        let stu = users.find(u => u.id === studentId); 
        if (!stu) return ''; 
        
        let status = targetSession.attendance[studentId] || '';
        
        return `
            <tr>
                <td><strong class="text-primary">${stu.name}</strong><br><span class="text-muted text-sm">${stu.id}</span></td>
                <td>
                    <div class="radio-group">
                        <label class="text-success font-bold"><input type="radio" name="att_${stu.id}" value="present" ${status === 'present' ? 'checked' : ''}> Có mặt</label>
                        <label class="text-warning font-bold"><input type="radio" name="att_${stu.id}" value="late" ${status === 'late' ? 'checked' : ''}> Muộn</label>
                        <label class="text-danger font-bold"><input type="radio" name="att_${stu.id}" value="absent" ${status === 'absent' ? 'checked' : ''}> Vắng</label>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('tcAttendanceList').innerHTML = htmlContent || '<tr><td colspan="2">Lớp học trống</td></tr>';
    openModal('tcAttModal');
}

function teacherSaveAttendance() {
    let classId = document.getElementById('class-detail-tab').dataset.classId;
    let sessionId = document.getElementById('tcAttModal').dataset.sessionId;

    updateClassDB(classId, function(c) {
        let targetSession = c.sessions.find(x => x.id === sessionId);
        c.enrolledStudents.forEach(studentId => { 
            let radioInput = document.querySelector(`input[name="att_${studentId}"]:checked`); 
            if (radioInput) targetSession.attendance[studentId] = radioInput.value; 
        });
    });
    
    alert("Đã chốt danh sách điểm danh!"); 
    closeModal('tcAttModal');
    teacherRenderSessions();
}