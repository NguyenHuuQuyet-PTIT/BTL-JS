let attChartInstance = null;
let gradeChartInstance = null;

function checkOverlap(classA, classB) {
    let isSameDay = (classA.dayOfWeek === classB.dayOfWeek);
    let isTimeOverlap = (classA.startPeriod <= classB.endPeriod && classB.startPeriod <= classA.endPeriod);
    return isSameDay && isTimeOverlap;
}

// ==========================================
// 1. KHỞI TẠO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let user = getDB('currentUser');
    
    if (!user || user.role !== 'student') { 
        window.location.href = 'index.html'; 
        return; 
    }
    
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
    
    initCommonUI();
    initProfileUI(user);

    renderStudentStudyDashboard(user); 
    renderRegistrationTab(user);
});

// Hàm helper để render từng dòng bảng điểm (tránh code HTML quá dài)
function generateGradeRowHtml(subName, teacherName, grades) {
    let avgScore = calcAvgScore(grades.cc, grades.gk, grades.ck);
    let ccDisp = (grades.cc !== null && grades.cc !== "") ? grades.cc : "--";
    let gkDisp = (grades.gk !== null && grades.gk !== "") ? grades.gk : "--";
    let ckDisp = (grades.ck !== null && grades.ck !== "") ? grades.ck : "--";
    
    let avgDisp = avgScore !== null ? avgScore.toFixed(1) : "--";
    let rankHtml = getRankHtml(avgScore);

    return `
        <tr>
            <td><strong>${subName}</strong></td>
            <td>${teacherName}</td>
            <td>${ccDisp}</td>
            <td>${gkDisp}</td>
            <td>${ckDisp}</td>
            <td><strong>${avgDisp}</strong></td>
            <td>${rankHtml}</td>
        </tr>
    `;
}

// ==========================================
// 2. THỐNG KÊ HỌC TẬP
// ==========================================
function renderStudentStudyDashboard(user) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    
    let myClasses = classes.filter(c => c.enrolledStudents.includes(user.id));
    let todayStr = new Date().toLocaleDateString('en-CA');
    
    let wDays = { 'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] };
    
    let htmlCards = '';
    let htmlGradesRows = '';
    
    let sumScore = 0; let countScore = 0; let excellentCount = 0;
    let statsAtt = { present: 0, late: 0, absent: 0 };
    let statsPie = { xuatSac: 0, gioi: 0, kha: 0, tb: 0, yeu: 0 };

    myClasses.forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || 'Unknown';
        let teacherName = users.find(u => u.id === c.teacherId)?.name || 'Unknown';
        
        wDays[c.dayOfWeek].push({ subName: subName, room: c.room, timeStr: getPeriodText(c.startPeriod, c.endPeriod) });
        
        let totalSessions = c.sessions.length;
        let pastSessions = c.sessions.filter(s => s.date <= todayStr).length;
        let completePercent = totalSessions > 0 ? Math.round((pastSessions / totalSessions) * 100) : 0;
        
        let grades = c.grades[user.id] || { cc: null, gk: null, ck: null };
        let avgScore = calcAvgScore(grades.cc, grades.gk, grades.ck);
        
        if (avgScore !== null) {
            countScore++; 
            sumScore += avgScore; 
            if (avgScore >= 8.0) excellentCount++;
            
            if (avgScore >= 9.0) statsPie.xuatSac++; 
            else if (avgScore >= 8.0) statsPie.gioi++; 
            else if (avgScore >= 6.5) statsPie.kha++; 
            else if (avgScore >= 5.0) statsPie.tb++; 
            else statsPie.yeu++;
        }
        
        htmlGradesRows += generateGradeRowHtml(subName, teacherName, grades);
        
        c.sessions.forEach(s => { 
            let studentStatus = s.attendance[user.id]; 
            if (studentStatus) statsAtt[studentStatus]++; 
        });

        htmlCards += `
            <div class="border-box border-left-dark flex-row align-center justify-between mb-10 cursor-pointer" onclick="openStuModal('${c.id}')">
                <div class="flex-1">
                    <h4 class="mb-10 text-primary">${subName} - ${c.id}</h4>
                    <p class="text-sm text-muted mb-10">GV: <span class="font-bold">${teacherName}</span></p>
                    <div class="progress-bg mt-10">
                        <div class="progress-fill" style="width:${completePercent}%;"></div>
                    </div>
                    <span class="text-sm font-bold text-muted">Tiến độ: ${completePercent}% (${pastSessions}/${totalSessions} buổi)</span>
                </div>
                <div style="padding-left: 20px;">
                    <p class="font-bold text-success">Điểm TB: ${avgScore !== null ? avgScore.toFixed(1) : "--"}</p>
                </div>
            </div>
        `;
    });

    document.getElementById('stuGradesTableBody').innerHTML = htmlGradesRows || '<tr><td colspan="7">Chưa có dữ liệu điểm.</td></tr>';

    let htmlWeekly = Object.keys(wDays).filter(day => wDays[day].length > 0).map(day => {
        let itemsHtml = wDays[day].map(item => `
            <div class="bg-light p-10 mt-10">
                <strong class="text-primary">${item.subName}</strong><br>
                <span class="text-sm text-muted">${item.timeStr} | P.${item.room}</span>
            </div>
        `).join('');
        
        return `<div class="border-box"><h3 class="border-bottom">${day}</h3>${itemsHtml}</div>`;
    }).join('');

    document.getElementById('weeklyScheduleContainer').innerHTML = htmlWeekly || '<p>Tuần này trống lịch.</p>';
    document.getElementById('enrolledClassesCards').innerHTML = htmlCards || '<p style="padding: 20px;">Chưa tham gia lớp nào.</p>';
    
    document.getElementById('stat-total-subjects').textContent = myClasses.length;
    document.getElementById('stat-gpa').textContent = countScore > 0 ? (sumScore / countScore).toFixed(1) : '--';
    document.getElementById('stat-excellent').textContent = excellentCount;
    
    let totalAtt = statsAtt.present + statsAtt.late + statsAtt.absent;
    document.getElementById('stat-attendance-rate').textContent = totalAtt > 0 ? ((statsAtt.present / totalAtt) * 100).toFixed(1) + '%' : '0%';
    
    drawStudentCharts(statsAtt, statsPie);
}

function drawStudentCharts(statsAtt, statsPie) {
    let attCanvas = document.getElementById('attendanceChart');
    if (!attCanvas) return;
    
    if (attChartInstance) attChartInstance.destroy(); 
    if (gradeChartInstance) gradeChartInstance.destroy();

    attChartInstance = new Chart(attCanvas, { 
        type: 'bar', 
        data: { 
            labels: ['Có mặt', 'Đi muộn', 'Vắng'], 
            datasets: [{ 
                label: 'Số buổi', 
                data: [statsAtt.present, statsAtt.late, statsAtt.absent], 
                backgroundColor: ['#4CAF50', '#FFC107', '#d32f2f']
            }] 
        }, 
        options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1, precision: 0 } } } } 
    });
    
    let totalGrades = statsPie.xuatSac + statsPie.gioi + statsPie.kha + statsPie.tb + statsPie.yeu;
    if (totalGrades > 0) {
        let pieCanvas = document.getElementById('gradePieChart');
        gradeChartInstance = new Chart(pieCanvas, { 
            type: 'pie', 
            data: { 
                labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'], 
                datasets: [{ 
                    data: [statsPie.xuatSac, statsPie.gioi, statsPie.kha, statsPie.tb, statsPie.yeu], 
                    backgroundColor: ['#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#d32f2f'] 
                }] 
            } 
        });
    }
}

function openStuModal(classId) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    let user = getDB('currentUser');
    
    let targetClass = classes.find(c => c.id === classId); 
    if (!targetClass) return;
    
    let subName = subjects.find(s => s.id === targetClass.subjectId)?.name || '';
    let teacherName = users.find(u => u.id === targetClass.teacherId)?.name || '';
    
    document.getElementById('modalClassName').textContent = `${subName} (${targetClass.id})`;
    document.getElementById('modalTeacherName').textContent = `Giảng viên phụ trách: ${teacherName}`;
    
    let todayStr = new Date().toLocaleDateString('en-CA');
    
    let htmlContent = targetClass.sessions.map(s => {
        let statusText = (s.date <= todayStr) ? getAttendanceHtml(s.attendance[user.id]) : "Chưa diễn ra";
        return `
            <tr>
                <td>Ngày: ${s.date} <span class="text-muted text-sm ml-10">${getPeriodText(s.startPeriod, s.endPeriod)}</span></td>
                <td>${statusText}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('modalSessionList').innerHTML = htmlContent || '<tr><td colspan="2">Chưa có lịch học.</td></tr>';
    openModal('stuClassModal');
}

// ==========================================
// 3. ĐĂNG KÝ TÍN CHỈ
// ==========================================
function renderRegistrationTab(user) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    let container = document.getElementById('registrationContainer'); 
    
    let myEnrolledClasses = classes.filter(cls => cls.enrolledStudents.includes(user.id));
    let htmlResult = '';
    
    subjects.forEach(sub => {
        let classesOfSubject = classes.filter(c => c.subjectId === sub.id); 
        if (classesOfSubject.length === 0) return;
        
        let enrolledClassInThisSubject = classesOfSubject.find(c => c.enrolledStudents.includes(user.id));
        htmlResult += `<h3 class="border-bottom mt-20 mb-10">${sub.name}</h3>`;

        classesOfSubject.forEach(c => {
            let teacherName = users.find(u => u.id === c.teacherId)?.name || '';
            
            let isEnrolled = c.enrolledStudents.includes(user.id);
            let isOtherClassEnrolled = (enrolledClassInThisSubject && enrolledClassInThisSubject.id !== c.id);
            let isConflicting = myEnrolledClasses.some(myClass => checkOverlap(c, myClass));
            
            let isDisabled = !isEnrolled && (isOtherClassEnrolled || isConflicting);
            let btnClass = isEnrolled ? "btn-danger" : "btn-primary";
            let btnAction = isEnrolled ? `unenrollClass('${c.id}')` : `enrollClass('${c.id}')`;
            let btnText = isEnrolled ? "Hủy đăng ký" : "Đăng ký lớp";
            
            let buttonHtml = isDisabled ? '' : `<button class="${btnClass}" style="width: auto;" onclick="${btnAction}">${btnText}</button>`;

            htmlResult += `
                <div class="border-box flex-row align-center justify-between mb-10 ${isDisabled ? 'disabled' : ''}">
                    <div>
                        <h4 class="mb-10 text-primary">Mã lớp: ${c.id}</h4>
                        <p class="text-sm text-muted">GV: ${teacherName} | P.${c.room}</p>
                        <p class="text-sm">Lịch: ${c.dayOfWeek} (${getPeriodText(c.startPeriod, c.endPeriod)})</p>
                    </div>
                    <div>${buttonHtml}</div>
                </div>
            `;
        }); 
    }); 
    
    container.innerHTML = htmlResult || '<p style="padding: 20px;">Chưa có môn học nào được mở đăng ký.</p>';
}

function enrollClass(classId) { 
    let user = getDB('currentUser');
    updateClassDB(classId, function(c) { 
        if (!c.enrolledStudents.includes(user.id)) c.enrolledStudents.push(user.id); 
    }); 
    alert("Đăng ký thành công!"); 
    renderRegistrationTab(user); renderStudentStudyDashboard(user); 
}

function unenrollClass(classId) { 
    if (confirm("Bạn có chắc chắn muốn hủy đăng ký lớp này?")) { 
        let user = getDB('currentUser');
        updateClassDB(classId, function(c) { 
            c.enrolledStudents = c.enrolledStudents.filter(id => id !== user.id); 
        }); 
        alert("Đã hủy đăng ký thành công!"); 
        renderRegistrationTab(user); renderStudentStudyDashboard(user); 
    } 
}