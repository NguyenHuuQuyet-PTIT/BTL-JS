let attChartInstance = null, gradeChartInstance = null;
const checkOverlap = (a, b) => (a.dayOfWeek === b.dayOfWeek) && (a.startPeriod <= b.endPeriod && b.startPeriod <= a.endPeriod);

// ==========================================
// 1. KHỞI TẠO & HỒ SƠ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const user = getDB('currentUser');
    if (!user || user.role !== 'student') { window.location.href = 'index.html'; return; }
    
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
    initSidebarNavigation();

    document.getElementById('profId').textContent = user.id; 
    document.getElementById('profDob').textContent = user.dob || 'Chưa cập nhật'; 
    document.getElementById('profPhone').textContent = user.phone || 'Chưa cập nhật';
    
    document.getElementById('btnShowEditProfile')?.addEventListener('click', () => { 
        document.getElementById('editPhone').value = user.phone || ''; document.getElementById('editDob').value = user.dob || ''; 
        document.getElementById('editProfileFormContainer').style.display = 'block'; 
    });
    document.getElementById('btnCancelEditProfile')?.addEventListener('click', () => { document.getElementById('editProfileFormContainer').style.display = 'none'; });

    document.getElementById('editProfileForm')?.addEventListener('submit', function(e) {
        e.preventDefault(); let data = Object.fromEntries(new FormData(e.target));
        if(data.password.trim()) user.password = data.password.trim();
        Object.assign(user, { phone: data.phone.trim(), dob: data.dob });
        
        localStorage.setItem('currentUser', JSON.stringify(user)); 
        let users = getDB('Users'), i = users.findIndex(u => u.id === user.id); if(i > -1) users[i] = user; setDB('Users', users);
        alert("Cập nhật thành công!"); window.location.reload();
    });

    renderStudentStudyDashboard(user); renderRegistrationTab(user);
});

// ==========================================
// 2. THỐNG KÊ HỌC TẬP
// ==========================================
window.switchStuStudyTab = tab => switchSubTab('stu-tab-'+tab+'-btn', 'stu-sub-'+tab, '.stu-sub-btn', '.stu-sub-tab');

function renderStudentStudyDashboard(user) {
    const classes = getDB('Classes'), subjects = getDB('Subjects'), users = getDB('Users');
    let myClasses = classes.filter(c => c.enrolledStudents.includes(user.id)), todayStr = new Date().toISOString().split('T')[0];
    let wDays = { 'Thứ 2':[], 'Thứ 3':[], 'Thứ 4':[], 'Thứ 5':[], 'Thứ 6':[], 'Thứ 7':[], 'Chủ nhật':[] }, cardsHtml = '';
    let sumScore = 0, count = 0, exc = 0, stats = { present: 0, late: 0, absent: 0 }, pie = { xuatSac: 0, gioi: 0, kha: 0, tb: 0, yeu: 0 };

    myClasses.forEach(c => {
        let { id, subjectId, teacherId, room, dayOfWeek, startPeriod, endPeriod, sessions, grades } = c;
        let sub = subjects.find(s => s.id === subjectId)?.name || 'Unknown', tc = users.find(u => u.id === teacherId)?.name || 'Unknown';
        wDays[dayOfWeek].push({ subName: sub, room, timeStr: getPeriodText(startPeriod, endPeriod) });
        
        let total = sessions.length, past = sessions.filter(s => s.date <= todayStr).length, perc = total > 0 ? Math.round((past/total)*100) : 0;
        let g = grades[user.id] || { cc: 0, gk: 0, ck: 0 }, avg = parseFloat((g.cc * 0.2 + g.gk * 0.3 + g.ck * 0.5).toFixed(1));

        if (avg > 0) {
            count++; sumScore += avg; if (avg >= 8.0) exc++;
            if (avg >= 9.0) pie.xuatSac++; else if (avg >= 8.0) pie.gioi++; else if (avg >= 6.5) pie.kha++; else if (avg >= 5.0) pie.tb++; else pie.yeu++;
        }
        sessions.forEach(s => { let st = s.attendance[user.id]; if (st) stats[st]++; });

        cardsHtml += `
            <div class="border-box border-left-dark cursor-pointer flex-col" onclick="openStuModal('${id}')">
                <h3 class="text-primary">${sub} - ${id}</h3>
                <p class="mt-10 text-muted text-sm">GV: <span class="font-bold">${tc}</span></p>
                <div class="progress-bg"><div class="progress-fill" style="width:${perc}%;"></div></div>
                <span class="text-sm font-bold text-muted">Tiến độ: ${perc}% (${past}/${total} buổi)</span>
                <p class="font-bold text-success mt-auto pt-10">Điểm tích lũy: ${avg}</p>
            </div>`;
    });

    let wHtml = Object.keys(wDays).filter(k => wDays[k].length > 0).map(k => `
        <div class="border-box flex-col"><h3 class="border-bottom">${k}</h3>
        ${wDays[k].map(i => `<div class="bg-light p-10 mt-10"><strong class="text-primary">${i.subName}</strong><br><span class="text-sm text-muted">${i.timeStr} | P.${i.room}</span></div>`).join('')}</div>
    `).join('');

    if(document.getElementById('weeklyScheduleContainer')) document.getElementById('weeklyScheduleContainer').innerHTML = wHtml || '<p>Tuần này trống lịch.</p>';
    if(document.getElementById('enrolledClassesCards')) document.getElementById('enrolledClassesCards').innerHTML = cardsHtml || '<p>Chưa tham gia lớp nào.</p>';
    if(document.getElementById('stat-total-subjects')) document.getElementById('stat-total-subjects').textContent = myClasses.length;
    if(document.getElementById('stat-gpa')) document.getElementById('stat-gpa').textContent = count > 0 ? (sumScore / count).toFixed(1) : '0.0';
    if(document.getElementById('stat-excellent')) document.getElementById('stat-excellent').textContent = exc;
    
    let tAtt = stats.present + stats.late + stats.absent;
    if(document.getElementById('stat-attendance-rate')) document.getElementById('stat-attendance-rate').textContent = tAtt > 0 ? ((stats.present / tAtt) * 100).toFixed(1) + '%' : '0%';
    drawStudentCharts(stats, pie);
}

function drawStudentCharts(stats, pie) {
    if(!document.getElementById('attendanceChart')) return;
    if (attChartInstance) attChartInstance.destroy(); if (gradeChartInstance) gradeChartInstance.destroy();

    attChartInstance = new Chart(document.getElementById('attendanceChart'), { type: 'bar', data: { labels: ['Có mặt', 'Đi muộn', 'Vắng'], datasets: [{ label: 'Số buổi', data: [stats.present, stats.late, stats.absent], backgroundColor: ['#4CAF50', '#FFC107', '#d32f2f'] }] }, options: { scales: { y: { ticks: { stepSize: 1, precision: 0 } } } } });
    if (pie.xuatSac + pie.gioi + pie.kha + pie.tb + pie.yeu > 0) gradeChartInstance = new Chart(document.getElementById('gradePieChart'), { type: 'pie', data: { labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'], datasets: [{ data: [pie.xuatSac, pie.gioi, pie.kha, pie.tb, pie.yeu], backgroundColor: ['#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#d32f2f'] }] } });
}

window.openStuModal = classId => {
    let tClass = getDB('Classes').find(x => x.id === classId); if (!tClass) return;
    document.getElementById('modalClassName').textContent = `${getDB('Subjects').find(s => s.id === tClass.subjectId)?.name || ''} (${tClass.id})`;
    document.getElementById('modalTeacherName').textContent = `Giảng viên phụ trách: ${getDB('Users').find(u => u.id === tClass.teacherId)?.name || ''}`;
    
    let today = new Date().toISOString().split('T')[0], user = getDB('currentUser');
    document.getElementById('modalSessionList').innerHTML = tClass.sessions.map(s => {
        let stTxt = "Chưa diễn ra";
        if (s.date <= today) {
            let st = s.attendance[user.id]; 
            stTxt = st === 'present' ? '<span class="text-success font-bold">Có mặt</span>' : st === 'late' ? '<span class="text-warning font-bold">Đi muộn</span>' : st === 'absent' ? '<span class="text-danger font-bold">Vắng mặt</span>' : '<span class="text-muted">Chưa điểm danh</span>';
        }
        return `<tr><td>Ngày: ${s.date} <span class="text-muted text-sm ml-10">${getPeriodText(s.startPeriod, s.endPeriod)}</span></td><td>${stTxt}</td></tr>`;
    }).join('') || '<tr><td colspan="2">Chưa có lịch.</td></tr>';
    document.getElementById('stuClassModal').style.display = 'block';
};

// ==========================================
// 3. ĐĂNG KÝ TÍN CHỈ
// ==========================================
function renderRegistrationTab(user) {
    const classes = getDB('Classes'), subjects = getDB('Subjects'), users = getDB('Users'); 
    let container = document.getElementById('registrationContainer'); if (!container) return;
    
    let myClasses = classes.filter(cls => cls.enrolledStudents.includes(user.id)), html = '';
    
    subjects.forEach(sub => {
        let subCls = classes.filter(c => c.subjectId === sub.id); if (subCls.length === 0) return;
        let myClsInSub = subCls.find(c => c.enrolledStudents.includes(user.id));
        
        html += `<h3 class="border-bottom mt-20 mb-10">${sub.name}</h3><div class="flex-col">`;

        subCls.forEach(c => {
            let { id, teacherId, room, dayOfWeek, startPeriod, endPeriod } = c;
            
            let isEnrolled = c.enrolledStudents.includes(user.id);
            let isDisabled = !isEnrolled && ((myClsInSub && myClsInSub.id !== id) || myClasses.some(myC => checkOverlap(c, myC)));

            let btnHtml = isEnrolled ? `<button class="btn-danger" style="width: auto;" onclick="unenrollClass('${id}')">Hủy đăng ký</button>` 
                        : isDisabled ? `` : `<button class="btn-primary" style="width: auto;" onclick="enrollClass('${id}')">Đăng ký lớp</button>`;

            html += `
                <div class="border-box flex-row align-center justify-between ${isDisabled ? 'disabled' : ''}">
                    <div>
                        <h4 class="mb-10 text-primary">Mã lớp: ${id}</h4>
                        <p class="text-sm text-muted">GV: ${users.find(u=>u.id===teacherId)?.name||''} | P.${room}</p>
                        <p class="text-sm">Lịch: ${dayOfWeek} (${getPeriodText(startPeriod, endPeriod)})</p>
                    </div>
                    <div>${btnHtml}</div>
                </div>`;
        }); 
        html += `</div>`;
    }); 
    container.innerHTML = html;
}

window.enrollClass = cId => { updateClassDB(cId, c => { if(!c.enrolledStudents.includes(getDB('currentUser').id)) c.enrolledStudents.push(getDB('currentUser').id); }); alert("Đăng ký thành công!"); renderRegistrationTab(getDB('currentUser')); renderStudentStudyDashboard(getDB('currentUser')); };
window.unenrollClass = cId => { if (confirm("Hủy đăng ký lớp này?")) { updateClassDB(cId, c => c.enrolledStudents = c.enrolledStudents.filter(id => id !== getDB('currentUser').id)); alert("Đã hủy lớp!"); renderRegistrationTab(getDB('currentUser')); renderStudentStudyDashboard(getDB('currentUser')); } };