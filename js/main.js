// ==========================================
// 1. KHỞI CHẠY & GIAO DIỆN CHUNG
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { 
        if(!window.location.pathname.includes('index.html') && !window.location.pathname.includes('register.html')) window.location.href = 'index.html'; 
        return; 
    }

    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);

    // Chuyển Tab Menu Sidebar
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            const targetId = this.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if(targetEl) targetEl.classList.add('active-tab');
            this.classList.add('active');
        });
    });

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if(btnLogout) btnLogout.addEventListener('click', () => { localStorage.clear(); window.location.href = 'index.html'; });

    // Phân luồng
    if (user.role === 'student') initStudent(user);
    else if (user.role === 'teacher') initTeacher(user);
});


// ==========================================
// 2. LUỒNG SINH VIÊN
// ==========================================
function initStudent(user) {
    // Logic Sửa Profile Sinh viên
    const profDob = document.getElementById('profDob'), profPhone = document.getElementById('profPhone');
    if(profDob) profDob.textContent = user.dob || '15/05/2003';
    if(profPhone) profPhone.textContent = user.phone || '0123456789';

    const btnEdit = document.getElementById('btnEditProfile'), formCont = document.getElementById('editProfileFormContainer');
    if(btnEdit && formCont) {
        btnEdit.addEventListener('click', () => {
            document.getElementById('editName').value = user.name || '';
            document.getElementById('editPhone').value = user.phone || '';
            document.getElementById('editDob').value = user.dob || '';
            formCont.style.display = 'block'; btnEdit.style.display = 'none';
        });
        document.getElementById('btnCancelEdit').addEventListener('click', () => {
            formCont.style.display = 'none'; btnEdit.style.display = 'inline-block';
        });
        document.getElementById('editProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            let users = JSON.parse(localStorage.getItem('Users')) || [];
            user.name = document.getElementById('editName').value;
            user.phone = document.getElementById('editPhone').value;
            user.dob = document.getElementById('editDob').value;
            localStorage.setItem('currentUser', JSON.stringify(user));

            for (let i = 0; i < users.length; i++) {
                if (users[i].id === user.id) {
                    users[i].name = user.name; users[i].phone = user.phone; users[i].dob = user.dob; break;
                }
            }
            localStorage.setItem('Users', JSON.stringify(users));
            alert("Cập nhật hồ sơ thành công!"); window.location.reload();
        });
    }

    // Logic Đọc Lớp, Điểm & Điểm danh
    const classes = JSON.parse(localStorage.getItem('Classes')) || [];
    const subjects = JSON.parse(localStorage.getItem('Subjects')) || [];
    
    let transcriptHtml = '';
    let attHistoryHtml = '';
    let totalScore = 0, count = 0, p=0, l=0, a=0;

    classes.filter(c => c.enrolledStudents.includes(user.id)).forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || 'Môn học';
        
        // Bảng điểm 20-30-50
        let g = c.grades[user.id] || { cc: 0, gk: 0, ck: 0 };
        let avg = (g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1);
        
        count++; totalScore += parseFloat(avg);

        transcriptHtml += `<tr>
            <td><strong>${subName}</strong></td>
            <td>${g.cc}</td><td>${g.gk}</td><td>${g.ck}</td>
            <td style="color:green; font-weight:bold;">${avg}</td>
        </tr>`;

        // Lịch sử Điểm danh
        c.sessions.forEach(ses => {
            let st = ses.attendance[user.id];
            let statusText = st === 'present' ? '<span style="color:green">Có mặt</span>' : 
                             st === 'late' ? '<span style="color:orange">Đi muộn</span>' : 
                             st === 'absent' ? '<span style="color:red">Vắng mặt</span>' : '<span style="color:gray">Chưa điểm danh</span>';
            
            if(st==='present') p++; else if(st==='late') l++; else if(st==='absent') a++;

            attHistoryHtml += `<tr>
                <td><strong>${subName}</strong></td>
                <td>${ses.date} (${ses.startTime} - ${ses.endTime})</td>
                <td>${statusText}</td>
            </tr>`;
        });
    });

    // In ra màn hình Sinh viên
    if(document.getElementById('transcriptBody')) document.getElementById('transcriptBody').innerHTML = transcriptHtml;
    if(document.getElementById('attendanceHistoryBody')) document.getElementById('attendanceHistoryBody').innerHTML = attHistoryHtml || '<tr><td colspan="3">Chưa có lịch sử điểm danh.</td></tr>';
    
    if(document.getElementById('stat-gpa') && count>0) document.getElementById('stat-gpa').textContent = (totalScore/count).toFixed(1);
    if(document.getElementById('stat-total-subjects')) document.getElementById('stat-total-subjects').textContent = count;

    // Vẽ biểu đồ
    if(document.getElementById('attendanceChart')) {
        new Chart(document.getElementById('attendanceChart'), { 
            type: 'pie', 
            data: { labels: ['Có mặt', 'Đi muộn', 'Vắng'], datasets: [{ data: [p, l, a], backgroundColor: ['#4CAF50', '#FFC107', '#F44336'] }] }
        });
    }
}


// ==========================================
// 3. LUỒNG GIÁO VIÊN
// ==========================================
let currentClassId = null;
let currentSessionId = null;

function initTeacher(user) {
    const subjects = JSON.parse(localStorage.getItem('Subjects')) || [];
    const sel = document.getElementById('newSub');
    if(sel) { subjects.forEach(s => sel.innerHTML += `<option value="${s.id}">${s.name}</option>`); }

    renderTeacherClassList();

    // Form Tạo Lớp (CRUD)
    const btnShow = document.getElementById('btnShowCreateClass');
    const formCont = document.getElementById('createClassFormContainer');
    if(btnShow && formCont) {
        btnShow.addEventListener('click', () => { formCont.style.display = 'block'; btnShow.style.display = 'none'; });
        document.getElementById('createClassForm').addEventListener('submit', (e) => {
            e.preventDefault();
            let cls = JSON.parse(localStorage.getItem('Classes')) || [];
            
            // Random gán 10 sinh viên cho lớp mới tạo
            let allStudents = (JSON.parse(localStorage.getItem('Users')) || []).filter(u => u.role === 'student').map(u => u.id);
            let randomStudents = allStudents.sort(() => 0.5 - Math.random()).slice(0, 10);

            cls.push({ 
                id: 'C' + Date.now().toString().slice(-4), subjectId: document.getElementById('newSub').value, 
                teacherId: user.id, room: document.getElementById('newRoom').value,
                dayOfWeek: document.getElementById('newDay').value, startTime: document.getElementById('newStart').value, endTime: document.getElementById('newEnd').value,
                enrolledStudents: randomStudents, sessions: [], grades: {}
            });
            localStorage.setItem('Classes', JSON.stringify(cls));
            alert("Tạo lớp thành công!"); e.target.reset();
            formCont.style.display = 'none'; btnShow.style.display = 'inline-block';
            renderTeacherClassList();
        });
    }
}

// 3.1 Đổ danh sách lớp học
function renderTeacherClassList() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const classes = JSON.parse(localStorage.getItem('Classes')) || [];
    const subjects = JSON.parse(localStorage.getItem('Subjects')) || [];

    let cHTML = '';
    let myClasses = classes.filter(c => c.teacherId === user.id);
    let totalStu = 0;
    
    myClasses.forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || '';
        totalStu += c.enrolledStudents.length;
        cHTML += `
            <div class="chart-box" style="position:relative;">
                <h3 style="color: #007bff; cursor: pointer; text-decoration: underline;" onclick="openClassDetail('${c.id}')">${subName}</h3>
                <p style="color: #666; margin-top:10px;">Mã lớp: ${c.id} | Phòng: ${c.room}</p>
                <p style="color: #666; margin-top:5px;">Lịch: ${c.dayOfWeek} (${c.startTime} - ${c.endTime})</p>
                <p style="margin-top: 15px; font-weight: bold;">Sĩ số: ${c.enrolledStudents.length} Sinh viên | Đã dạy: ${c.sessions.length} Buổi</p>
                <div style="position:absolute; top:20px; right:20px;">
                    <button class="action-btn" style="color: red; border-color: red;" onclick="deleteClass('${c.id}')">Xóa lớp</button>
                </div>
            </div>`;
    });

    if(document.getElementById('fullClassList')) document.getElementById('fullClassList').innerHTML = cHTML;
    if(document.getElementById('teacher-total-classes')) document.getElementById('teacher-total-classes').textContent = myClasses.length;
    if(document.getElementById('teacher-total-students')) document.getElementById('teacher-total-students').textContent = totalStu;
}

window.deleteClass = (id) => {
    if(!confirm("Bạn có chắc muốn xóa lớp học này? Toàn bộ điểm và buổi học sẽ bị xóa!")) return;
    let cls = JSON.parse(localStorage.getItem('Classes')) || [];
    localStorage.setItem('Classes', JSON.stringify(cls.filter(c => c.id !== id)));
    renderTeacherClassList();
};

// 3.2 Mở chi tiết lớp học
window.openClassDetail = (classId) => {
    currentClassId = classId;
    const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === classId);
    const subName = (JSON.parse(localStorage.getItem('Subjects')) || []).find(s => s.id === cls.subjectId)?.name;

    document.getElementById('detailClassName').textContent = subName;
    document.getElementById('detailClassInfo').textContent = `Mã lớp: ${cls.id} | Phòng: ${cls.room} | Sĩ số: ${cls.enrolledStudents.length} Sinh viên`;

    document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
    document.getElementById('class-detail-tab').classList.add('active-tab');
    
    switchClassSubTab('grades'); 
};

// 3.3 Chuyển Sub-tab (Điểm / Buổi học)
window.switchClassSubTab = (tab) => {
    document.getElementById('tab-grades-btn').classList.remove('active');
    document.getElementById('tab-sessions-btn').classList.remove('active');
    document.getElementById('tab-' + tab + '-btn').classList.add('active');

    document.getElementById('sub-grades').style.display = tab === 'grades' ? 'block' : 'none';
    document.getElementById('sub-sessions').style.display = tab === 'sessions' ? 'block' : 'none';
    
    if(tab === 'grades') renderClassGrades();
    if(tab === 'sessions') renderClassSessions();
};

// ==========================================
// 4. QUẢN LÝ ĐIỂM SỐ
// ==========================================
function renderClassGrades() {
    const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === currentClassId);
    const users = JSON.parse(localStorage.getItem('Users')) || [];
    let html = '';

    cls.enrolledStudents.forEach(stuId => {
        let stu = users.find(u => u.id === stuId);
        let g = cls.grades[stuId] || { cc: 0, gk: 0, ck: 0 };
        let avg = (g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1);

        html += `<tr>
            <td><strong>${stu.name}</strong><br><span style="font-size:12px; color:#666;">${stu.id}</span></td>
            <td><input type="number" id="cc_${stu.id}" value="${g.cc}" min="0" max="10" step="0.1" style="width:70px; padding:8px;"></td>
            <td><input type="number" id="gk_${stu.id}" value="${g.gk}" min="0" max="10" step="0.1" style="width:70px; padding:8px;"></td>
            <td><input type="number" id="ck_${stu.id}" value="${g.ck}" min="0" max="10" step="0.1" style="width:70px; padding:8px;"></td>
            <td style="color:green; font-weight:bold; font-size:16px;">${avg}</td>
            <td><button class="action-btn" style="background:#000; color:#fff;" onclick="saveGrade('${stu.id}')">Lưu</button></td>
        </tr>`;
    });
    document.getElementById('detailStudentGrades').innerHTML = html;
}

window.saveGrade = (stuId) => {
    let cls = JSON.parse(localStorage.getItem('Classes')) || [];
    let cIndex = cls.findIndex(c => c.id === currentClassId);
    
    let cc = parseFloat(document.getElementById(`cc_${stuId}`).value) || 0;
    let gk = parseFloat(document.getElementById(`gk_${stuId}`).value) || 0;
    let ck = parseFloat(document.getElementById(`ck_${stuId}`).value) || 0;

    if(!cls[cIndex].grades[stuId]) cls[cIndex].grades[stuId] = {};
    cls[cIndex].grades[stuId] = { cc, gk, ck };
    
    localStorage.setItem('Classes', JSON.stringify(cls));
    alert("Đã lưu điểm!"); renderClassGrades();
};

// ==========================================
// 5. QUẢN LÝ BUỔI HỌC & ĐIỂM DANH (RADIO)
// ==========================================
function renderClassSessions() {
    const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === currentClassId);
    let html = '';
    cls.sessions.forEach(ses => {
        html += `<div class="chart-box" style="border-left: 4px solid #000;">
            <h4>Ngày: ${ses.date}</h4>
            <p style="color:#666; margin-top:5px;">Thời gian: ${ses.startTime} - ${ses.endTime}</p>
            <button class="btn-primary" style="margin-top:15px; width:auto;" onclick="openAttendance('${ses.id}')">Thực hiện Điểm danh</button>
        </div>`;
    });
    document.getElementById('sessionList').innerHTML = html || '<p>Chưa có buổi học nào được tạo.</p>';
}

document.getElementById('createSessionForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    let date = document.getElementById('newSesDate').value;
    let start = document.getElementById('newSesStart').value;
    let end = document.getElementById('newSesEnd').value;

    let cls = JSON.parse(localStorage.getItem('Classes')) || [];
    let cIndex = cls.findIndex(c => c.id === currentClassId);
    
    cls[cIndex].sessions.push({ id: 'SES_' + Date.now(), date: date, startTime: start, endTime: end, attendance: {} });
    localStorage.setItem('Classes', JSON.stringify(cls));
    e.target.reset(); renderClassSessions();
});

window.openAttendance = (sesId) => {
    currentSessionId = sesId;
    const cls = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === currentClassId);
    const ses = cls.sessions.find(s => s.id === sesId);
    const users = JSON.parse(localStorage.getItem('Users')) || [];

    document.getElementById('attSessionInfo').textContent = `Bảng điểm danh buổi: ${ses.date} (${ses.startTime} - ${ses.endTime})`;
    document.getElementById('attendanceView').style.display = 'block';

    let html = '';
    cls.enrolledStudents.forEach(stuId => {
        let stu = users.find(u => u.id === stuId);
        let st = ses.attendance[stuId] || ''; 
        
        html += `<tr>
            <td><strong>${stu.name}</strong><br><span style="font-size:12px;color:#666">${stu.id}</span></td>
            <td>
                <div class="radio-group">
                    <label style="color:green"><input type="radio" name="att_${stuId}" value="present" ${st==='present'?'checked':''}> Có mặt</label>
                    <label style="color:orange"><input type="radio" name="att_${stuId}" value="late" ${st==='late'?'checked':''}> Đi muộn</label>
                    <label style="color:red"><input type="radio" name="att_${stuId}" value="absent" ${st==='absent'?'checked':''}> Vắng mặt</label>
                </div>
            </td>
        </tr>`;
    });
    document.getElementById('attendanceList').innerHTML = html;
};

window.saveAttendance = () => {
    let cls = JSON.parse(localStorage.getItem('Classes')) || [];
    let cIndex = cls.findIndex(c => c.id === currentClassId);
    let sIndex = cls[cIndex].sessions.findIndex(s => s.id === currentSessionId);

    cls[cIndex].enrolledStudents.forEach(stuId => {
        let radio = document.querySelector(`input[name="att_${stuId}"]:checked`);
        if(radio) {
            if(!cls[cIndex].sessions[sIndex].attendance) cls[cIndex].sessions[sIndex].attendance = {};
            cls[cIndex].sessions[sIndex].attendance[stuId] = radio.value;
        }
    });

    localStorage.setItem('Classes', JSON.stringify(cls));
    alert("Đã lưu bảng điểm danh thành công!");
    document.getElementById('attendanceView').style.display = 'none';
};