// --- 1. CHUNG ---
function checkAuthAndRenderInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = 'index.html'; return; }
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
    const welcome = document.querySelector('.welcome-text');
    if(welcome) welcome.textContent = `Chào mừng ${user.name} đến với Edu Report`;
}

function setupTabs() {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = document.querySelectorAll('.tab-section');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            tabs.forEach(t => { t.classList.remove('active-tab'); t.style.display = 'none'; });
            menuItems.forEach(m => m.classList.remove('active'));
            const target = document.getElementById(this.getAttribute('data-target'));
            if(target) { target.classList.add('active-tab'); target.style.display = 'block'; }
            this.classList.add('active');
        });
    });
}

function handleLogout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; }

// --- 2. HỒ SƠ SINH VIÊN ---
function renderProfileTab() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    if(document.getElementById('profName')) document.getElementById('profName').textContent = user.name;
    if(document.getElementById('profEmail')) document.getElementById('profEmail').textContent = user.email;
    if(document.getElementById('profId')) document.getElementById('profId').textContent = user.id;
    if(document.getElementById('profDob')) document.getElementById('profDob').textContent = user.dob || '15/05/2003';
    if(document.getElementById('profPhone')) document.getElementById('profPhone').textContent = user.phone || '0123456789';
}

function handleEditProfile() {
    const btnEdit = document.getElementById('btnEditProfile'), formCont = document.getElementById('editProfileFormContainer');
    const btnCancel = document.getElementById('btnCancelEdit'), form = document.getElementById('editProfileForm');
    if (!btnEdit) return;

    btnEdit.addEventListener('click', () => {
        const u = JSON.parse(localStorage.getItem('currentUser'));
        document.getElementById('editName').value = u.name || '';
        document.getElementById('editPhone').value = u.phone || '';
        document.getElementById('editDob').value = u.dob || '';
        formCont.style.display = 'block'; btnEdit.style.display = 'none';
    });
    btnCancel.addEventListener('click', () => { formCont.style.display = 'none'; btnEdit.style.display = 'inline-block'; });
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let users = JSON.parse(localStorage.getItem('Users')) || [], cur = JSON.parse(localStorage.getItem('currentUser'));
        cur.name = document.getElementById('editName').value;
        cur.phone = document.getElementById('editPhone').value;
        cur.dob = document.getElementById('editDob').value;
        localStorage.setItem('currentUser', JSON.stringify(cur));
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === cur.id) { users[i].name = cur.name; users[i].phone = cur.phone; users[i].dob = cur.dob; break; }
        }
        localStorage.setItem('Users', JSON.stringify(users));
        alert("Cập nhật thành công!");
        formCont.style.display = 'none'; btnEdit.style.display = 'inline-block';
        checkAuthAndRenderInfo(); renderProfileTab();
    });
}

// --- 3. SINH VIÊN ---
function renderAcademicData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(!user || user.role !== 'student') return;
    const records = JSON.parse(localStorage.getItem('AcademicRecords')) || [], subjects = JSON.parse(localStorage.getItem('Subjects')) || [], classes = JSON.parse(localStorage.getItem('Classes')) || [];
    let score = 0, count = 0, tHTML = '', sHTML = '';

    records.forEach(r => {
        if (r.studentId === user.id) {
            count++; score += r.average;
            let subName = subjects.find(s => s.id === r.subjectId)?.name || '';
            tHTML += `<tr><td><strong>${subName}</strong></td><td>${r.midterm}</td><td>${r.final}</td><td><span style="color: green; font-weight: bold;">${r.average}</span></td></tr>`;
        }
    });

    if(document.getElementById('stat-gpa') && count>0) document.getElementById('stat-gpa').textContent = (score/count).toFixed(1);
    if(document.getElementById('stat-total-subjects')) document.getElementById('stat-total-subjects').textContent = count;
    if(document.getElementById('transcriptBody')) document.getElementById('transcriptBody').innerHTML = tHTML;

    classes.forEach(c => {
        sHTML += `<li><strong>${subjects.find(s => s.id === c.subjectId)?.name}</strong><span>Phòng: ${c.room} | ${c.schedule}</span></li>`;
    });
    if(document.getElementById('scheduleList')) document.getElementById('scheduleList').innerHTML = sHTML;
}

// --- 4. GIÁO VIÊN ---
function renderTeacherData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'teacher') return;
    const classes = JSON.parse(localStorage.getItem('Classes')) || [], subjects = JSON.parse(localStorage.getItem('Subjects')) || [];
    let totCls = 0, totStu = 0, cHTML = '', sHTML = '';

    classes.forEach(c => {
        if (c.teacherId === user.id) {
            totCls++; totStu += c.totalStudents || 4;
            let subName = subjects.find(s => s.id === c.subjectId)?.name || '';

            cHTML += `
                <div class="chart-box" style="position: relative;">
                    <h3 style="margin-bottom: 10px; cursor: pointer; color: #007bff;" onclick="openClassDetail('${c.id}')">${subName}</h3>
                    <p style="color: #666; font-size: 14px;">Mã lớp: ${c.id} | Phòng: ${c.room}</p>
                    <p style="margin-top: 15px; font-weight: bold;">${c.totalStudents || 4} sinh viên</p>
                    <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 10px;">
                        <button onclick="openEditClassForm('${c.id}')" style="background: none; border: none; color: #4CAF50; cursor: pointer; font-weight: bold;">Sửa</button>
                        <button onclick="deleteClass('${c.id}')" style="background: none; border: none; color: #d32f2f; cursor: pointer; font-weight: bold;">X</button>
                    </div>
                </div>
            `;
            sHTML += `<li><strong>${subName}</strong><span>Phòng: ${c.room} | ${c.schedule}</span></li>`;
        }
    });

    if(document.getElementById('teacher-total-classes')) document.getElementById('teacher-total-classes').textContent = totCls;
    if(document.getElementById('teacher-total-students')) document.getElementById('teacher-total-students').textContent = totStu;
    if(document.getElementById('recentClassList')) document.getElementById('recentClassList').innerHTML = sHTML;
    if(document.getElementById('fullClassList')) document.getElementById('fullClassList').innerHTML = cHTML;
    if(document.getElementById('teacherScheduleList')) document.getElementById('teacherScheduleList').innerHTML = sHTML;
}

function setupTeacherCRUD() {
    const btnShow = document.getElementById('btnShowCreateClass'), formCont = document.getElementById('createClassFormContainer'), form = document.getElementById('createClassForm'), sel = document.getElementById('newClassSubject');
    if (!btnShow) return;

    const subs = JSON.parse(localStorage.getItem('Subjects')) || [];
    if(sel) { sel.innerHTML = '<option value="">-- Chọn môn --</option>'; subs.forEach(s => sel.innerHTML += `<option value="${s.id}">${s.name}</option>`); }

    btnShow.addEventListener('click', () => { formCont.style.display = 'block'; btnShow.style.display = 'none'; });
    document.getElementById('btnCancelCreateClass').addEventListener('click', () => { formCont.style.display = 'none'; btnShow.style.display = 'inline-block'; form.reset(); });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const classes = JSON.parse(localStorage.getItem('Classes')) || [];
        classes.push({
            id: 'CLASS' + Date.now(), subjectId: sel.value, teacherId: JSON.parse(localStorage.getItem('currentUser')).id,
            room: document.getElementById('newClassRoom').value, schedule: document.getElementById('newClassSchedule').value, totalStudents: 4, materials: []
        });
        localStorage.setItem('Classes', JSON.stringify(classes));
        alert("Tạo lớp thành công!"); form.reset(); formCont.style.display = 'none'; btnShow.style.display = 'inline-block'; renderTeacherData();
    });
}

window.deleteClass = function(id) {
    if(!confirm("Xóa lớp học?")) return;
    let cls = JSON.parse(localStorage.getItem('Classes')) || [];
    localStorage.setItem('Classes', JSON.stringify(cls.filter(c => c.id !== id)));
    renderTeacherData();
};

window.openEditClassForm = function(id) {
    const target = (JSON.parse(localStorage.getItem('Classes')) || []).find(c => c.id === id);
    if(target) {
        document.getElementById('editClassId').value = target.id;
        document.getElementById('editClassRoom').value = target.room;
        document.getElementById('editClassSchedule').value = target.schedule;
        document.getElementById('editClassFormContainer').style.display = 'block';
        document.getElementById('createClassFormContainer').style.display = 'none';
    }
};

function setupEditClassEvent() {
    const form = document.getElementById('editClassForm');
    if(!form) return;
    document.getElementById('btnCancelEditClass').addEventListener('click', () => document.getElementById('editClassFormContainer').style.display = 'none');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let cls = JSON.parse(localStorage.getItem('Classes')) || [];
        let id = document.getElementById('editClassId').value;
        for(let i=0; i<cls.length; i++){
            if(cls[i].id === id) { cls[i].room = document.getElementById('editClassRoom').value; cls[i].schedule = document.getElementById('editClassSchedule').value; break; }
        }
        localStorage.setItem('Classes', JSON.stringify(cls));
        alert("Cập nhật lớp thành công!"); document.getElementById('editClassFormContainer').style.display = 'none'; renderTeacherData();
    });
}

// --- CHI TIẾT LỚP HỌC (Sub-tabs & Tài liệu) ---
let currentDetailClassId = null;

window.openClassDetail = function(classId) {
    const classes = JSON.parse(localStorage.getItem('Classes')) || [];
    const subjects = JSON.parse(localStorage.getItem('Subjects')) || [];
    const cls = classes.find(c => c.id === classId);
    if(!cls) return;
    
    currentDetailClassId = classId;
    const subName = subjects.find(s => s.id === cls.subjectId)?.name || 'Lớp học';

    document.getElementById('detailClassName').textContent = subName;
    document.getElementById('detailClassInfo').textContent = `Mã lớp: ${cls.id} | Năm 2 | 4 sinh viên`;

    // Render Sinh viên
    const users = JSON.parse(localStorage.getItem('Users')) || [];
    const students = users.filter(u => u.role === 'student').slice(0, 4); // Lấy 4 SV mô phỏng
    let stHTML = '';
    students.forEach(s => stHTML += `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.email}</td></tr>`);
    document.getElementById('detailStudentList').innerHTML = stHTML;

    renderMaterials(cls.materials || []);

    document.querySelectorAll('.tab-section').forEach(t => { t.classList.remove('active-tab'); t.style.display = 'none'; });
    document.getElementById('class-detail-tab').style.display = 'block';
    document.getElementById('class-detail-tab').classList.add('active-tab');
};

window.switchSubTab = function(tabName) {
    document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.sub-tab-content').forEach(c => c.style.display = 'none');
    event.target.classList.add('active');
    document.getElementById('sub-tab-' + tabName).style.display = 'block';
};

function renderMaterials(materials) {
    let mHTML = '';
    materials.forEach(m => {
        mHTML += `
            <li>
                <strong>${m.title}</strong>
                <span>${m.filename} | ${m.date}</span>
                <button onclick="deleteMaterial('${m.id}')" style="position: absolute; right: 0; top: 15px; color: red; background: none; border: none; cursor: pointer;">Xóa</button>
            </li>`;
    });
    if(mHTML === '') mHTML = '<li>Chưa có tài liệu nào.</li>';
    document.getElementById('detailMaterialList').innerHTML = mHTML;
}

window.addMaterial = function(type) {
    if(!currentDetailClassId) return;
    const title = prompt(`Nhập tên ${type}:`);
    if(!title) return;
    
    let classes = JSON.parse(localStorage.getItem('Classes')) || [];
    for(let i=0; i<classes.length; i++) {
        if(classes[i].id === currentDetailClassId) {
            if(!classes[i].materials) classes[i].materials = [];
            classes[i].materials.push({
                id: 'M' + Date.now(),
                title: `${type}: ${title}`,
                filename: `tai-lieu-${Date.now()}.pdf`,
                date: new Date().toISOString().split('T')[0],
                type: type
            });
            localStorage.setItem('Classes', JSON.stringify(classes));
            renderMaterials(classes[i].materials);
            break;
        }
    }
};

window.deleteMaterial = function(matId) {
    if(!confirm("Xóa tài liệu này?") || !currentDetailClassId) return;
    let classes = JSON.parse(localStorage.getItem('Classes')) || [];
    for(let i=0; i<classes.length; i++) {
        if(classes[i].id === currentDetailClassId) {
            classes[i].materials = classes[i].materials.filter(m => m.id !== matId);
            localStorage.setItem('Classes', JSON.stringify(classes));
            renderMaterials(classes[i].materials);
            break;
        }
    }
};

// --- 5. KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRenderInfo();
    setupTabs();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        if (user.role === 'student') {
            renderAcademicData();
            if(document.getElementById('attendanceChart')) {
                new Chart(document.getElementById('attendanceChart'), { type: 'bar', data: { labels: ['T1', 'T3', 'T5'], datasets: [{ label: 'Buổi', data: [18, 17, 19], backgroundColor: '#000' }] } });
                new Chart(document.getElementById('gradePieChart'), { type: 'pie', data: { labels: ['Giỏi', 'Khá', 'Xuất sắc'], datasets: [{ data: [25, 50, 25], backgroundColor: ['#4285F4', '#FBBC05', '#34A853'] }] } });
            }
            renderProfileTab(); handleEditProfile();
        } else if (user.role === 'teacher') {
            renderTeacherData(); setupTeacherCRUD(); setupEditClassEvent();
        }
    }
    const btnLogout = document.getElementById('btnLogout');
    if(btnLogout) btnLogout.addEventListener('click', handleLogout);
});