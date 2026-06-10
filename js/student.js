// Các hàm tiện ích dùng chung
function getDB(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

const PERIOD_TIMES = { 1: "07:00-07:50", 2: "08:00-08:50", 3: "09:00-09:50", 4: "10:00-10:50", 5: "11:00-11:50", 6: "12:00-12:50", 7: "13:00-13:50", 8: "14:00-14:50", 9: "15:00-15:50", 10: "16:00-16:50", 11: "17:00-17:50", 12: "18:00-18:50" };
function getPeriodText(start, end) { 
    let t1 = PERIOD_TIMES[start].split("-")[0]; 
    let t2 = PERIOD_TIMES[end].split("-")[1];
    return `Tiết ${start}-${end} (${t1} - ${t2})`; 
}

// Logic kiểm tra trùng tiết toán học cơ bản
function checkOverlap(classA, classB) {
    if (classA.dayOfWeek === classB.dayOfWeek) {
        if (classA.startPeriod <= classB.endPeriod && classB.startPeriod <= classA.endPeriod) {
            return true;
        }
    }
    return false;
}

let attChartInstance = null; 
let gradeChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = getDB('currentUser');
    if (!user || user.role !== 'student') { 
        window.location.href = 'index.html'; 
        return; 
    }

    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active-tab'));
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            document.getElementById(this.getAttribute('data-target')).classList.add('active-tab');
            this.classList.add('active');
        });
    });

    initStudentLogic(user);
});

window.handleLogout = () => { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; };

function initStudentLogic(user) {
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
        
        if (newPass) {
            user.password = newPass;
        }
        user.phone = document.getElementById('editPhone').value.trim();
        user.dob = document.getElementById('editDob').value;

        localStorage.setItem('currentUser', JSON.stringify(user));
        
        let targetIndex = users.findIndex(u => u.id === user.id);
        if (targetIndex > -1) {
            users[targetIndex] = user;
        }
        
        setDB('Users', users); 
        alert("Cập nhật thành công!"); 
        window.location.reload();
    });

    renderStudentStudyDashboard(user);
    renderRegistrationTab(user);
}

window.switchStuStudyTab = function(tabName) {
    document.getElementById('stu-tab-schedule-btn').classList.remove('active');
    document.getElementById('stu-tab-progress-btn').classList.remove('active');
    
    let activeBtnId = 'stu-tab-' + tabName + '-btn';
    document.getElementById(activeBtnId).classList.add('active');
    
    if (tabName === 'schedule') {
        document.getElementById('stu-sub-schedule').style.display = 'block'; 
        document.getElementById('stu-sub-progress').style.display = 'none';
    } else {
        document.getElementById('stu-sub-schedule').style.display = 'none'; 
        document.getElementById('stu-sub-progress').style.display = 'block';
    }
};

function renderStudentStudyDashboard(user) {
    const classes = getDB('Classes'); 
    const subjects = getDB('Subjects'); 
    const users = getDB('Users');
    
    let myClasses = classes.filter(c => c.enrolledStudents.includes(user.id));
    let todayStr = new Date().toISOString().split('T')[0];

    let weeklyDays = { 'Thứ 2':[], 'Thứ 3':[], 'Thứ 4':[], 'Thứ 5':[], 'Thứ 6':[], 'Thứ 7':[], 'Chủ nhật':[] };
    let cardsHtml = '';
    
    let sumScore = 0, scoredSubjectCount = 0, excellentCount = 0;
    let presentCount = 0, lateCount = 0, absentCount = 0;
    let pieData = { xuatSac: 0, gioi: 0, kha: 0, trungBinh: 0, yeu: 0 };

    for (let c of myClasses) {
        let subject = subjects.find(s => s.id === c.subjectId);
        let teacher = users.find(u => u.id === c.teacherId);
        let subName = subject ? subject.name : 'Unknown';
        let tcName = teacher ? teacher.name : 'Unknown';

        weeklyDays[c.dayOfWeek].push({ 
            subName: subName, 
            room: c.room, 
            timeStr: getPeriodText(c.startPeriod, c.endPeriod) 
        });

        let totalSessions = c.sessions.length;
        let pastSessions = c.sessions.filter(s => s.date <= todayStr).length;
        let percent = totalSessions > 0 ? Math.round((pastSessions / totalSessions) * 100) : 0;

        let gradesObj = c.grades[user.id] || { cc: 0, gk: 0, ck: 0 };
        let avgScore = parseFloat((gradesObj.cc * 0.2 + gradesObj.gk * 0.3 + gradesObj.ck * 0.5).toFixed(1));

        if (avgScore > 0) {
            scoredSubjectCount++; 
            sumScore += avgScore;
            if (avgScore >= 8.0) excellentCount++;
            
            if (avgScore >= 9.0) pieData.xuatSac++;
            else if (avgScore >= 8.0) pieData.gioi++;
            else if (avgScore >= 6.5) pieData.kha++;
            else if (avgScore >= 5.0) pieData.trungBinh++;
            else pieData.yeu++;
        }

        for (let s of c.sessions) {
            let status = s.attendance[user.id];
            if (status === 'present') presentCount++;
            else if (status === 'late') lateCount++;
            else if (status === 'absent') absentCount++;
        }

        cardsHtml += `
            <div class="chart-box border-left-dark cursor-pointer" onclick="openStuModal('${c.id}')">
                <h3 class="text-primary">${subName} - ${c.id}</h3>
                <p class="mt-10 text-muted">Giảng viên: ${tcName}</p>
                <div class="progress-bg"><div class="progress-fill" style="width:${percent}%;"></div></div>
                <span class="text-sm font-bold">Tiến độ khóa học: ${percent}% (${pastSessions}/${totalSessions} buổi)</span>
                <p class="font-bold text-success mt-10">Điểm tích lũy: ${avgScore}</p>
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

    let weeklyContainer = document.getElementById('weeklyScheduleContainer');
    if (weeklyContainer) {
        weeklyContainer.innerHTML = weeklyHtml || '<p>Tuần này bạn trống lịch.</p>';
    }

    let cardsContainer = document.getElementById('enrolledClassesCards');
    if (cardsContainer) {
        cardsContainer.innerHTML = cardsHtml || '<p>Chưa đăng ký lớp học.</p>';
    }

    if (document.getElementById('stat-total-subjects')) {
        document.getElementById('stat-total-subjects').textContent = myClasses.length;
    }
    
    if (document.getElementById('stat-gpa')) {
        let finalGpa = scoredSubjectCount > 0 ? (sumScore / scoredSubjectCount).toFixed(1) : '0.0';
        document.getElementById('stat-gpa').textContent = finalGpa;
    }
    
    if (document.getElementById('stat-excellent')) {
        document.getElementById('stat-excellent').textContent = excellentCount;
    }
    
    let totalAttendanceRecords = presentCount + lateCount + absentCount;
    if (document.getElementById('stat-attendance-rate')) {
        let attendanceRate = totalAttendanceRecords > 0 ? ((presentCount / totalAttendanceRecords) * 100).toFixed(1) + '%' : '0%';
        document.getElementById('stat-attendance-rate').textContent = attendanceRate;
    }

    drawStudentCharts(presentCount, lateCount, absentCount, pieData);
}

function drawStudentCharts(p, l, a, pieData) {
    let barCanvas = document.getElementById('attendanceChart');
    if (!barCanvas) return;
    
    if (attChartInstance) attChartInstance.destroy();
    if (gradeChartInstance) gradeChartInstance.destroy();

    attChartInstance = new Chart(barCanvas, {
        type: 'bar',
        data: { 
            labels: ['Có mặt', 'Đi muộn', 'Vắng'], 
            datasets: [{ 
                label: 'Số buổi', 
                data: [p, l, a], 
                backgroundColor: ['#4CAF50', '#FFC107', '#d32f2f'] 
            }] 
        },
        options: { 
            scales: { 
                y: { ticks: { stepSize: 1, precision: 0 } } 
            } 
        }
    });

    let totalPieItems = pieData.xuatSac + pieData.gioi + pieData.kha + pieData.trungBinh + pieData.yeu;
    let pieCanvas = document.getElementById('gradePieChart');
    
    if (pieCanvas && totalPieItems > 0) {
        gradeChartInstance = new Chart(pieCanvas, {
            type: 'pie',
            data: { 
                labels: ['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình', 'Yếu'], 
                datasets: [{ 
                    data: [pieData.xuatSac, pieData.gioi, pieData.kha, pieData.trungBinh, pieData.yeu], 
                    backgroundColor: ['#9C27B0', '#2196F3', '#4CAF50', '#FF9800', '#d32f2f'] 
                }] 
            }
        });
    }
}

// Xử lý Popup Điểm danh
window.openStuModal = function(classId) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    
    let targetClass = classes.find(x => x.id === classId);
    if (!targetClass) return;

    let subjectObj = subjects.find(s => s.id === targetClass.subjectId);
    let teacherObj = users.find(u => u.id === targetClass.teacherId);
    
    let subName = subjectObj ? subjectObj.name : 'Unknown';
    let tcName = teacherObj ? teacherObj.name : 'Unknown';

    document.getElementById('modalClassName').textContent = subName + " (" + targetClass.id + ")";
    document.getElementById('modalTeacherName').textContent = "Giảng viên phụ trách: " + tcName;
    
    let todayStr = new Date().toISOString().split('T')[0];
    const user = getDB('currentUser');

    let html = '';
    
    for (let s of targetClass.sessions) {
        let statusText = "Chưa diễn ra";
        
        if (s.date <= todayStr) {
            let state = s.attendance[user.id];
            
            if (state === 'present') {
                statusText = '<span class="text-success font-bold">Có mặt</span>';
            } else if (state === 'late') {
                statusText = '<span class="text-warning font-bold">Đi muộn</span>';
            } else if (state === 'absent') {
                statusText = '<span class="text-danger font-bold">Vắng mặt</span>';
            } else {
                statusText = '<span class="text-muted">Chưa điểm danh</span>';
            }
        }
        
        html += `
            <tr>
                <td>Ngày: ${s.date} (${getPeriodText(s.startPeriod, s.endPeriod)})</td>
                <td>${statusText}</td>
            </tr>`;
    }
    
    document.getElementById('modalSessionList').innerHTML = html || '<tr><td colspan="2">Lớp chưa có lịch học cụ thể.</td></tr>';
    document.getElementById('stuClassModal').style.display = 'block';
};

// ĐĂNG KÝ MÔN TRỰC TIẾP
function renderRegistrationTab(user) {
    const classes = getDB('Classes');
    const subjects = getDB('Subjects');
    const users = getDB('Users');
    
    let container = document.getElementById('registrationContainer');
    if (!container) return;

    let html = '';
    let myEnrolledClasses = classes.filter(cls => cls.enrolledStudents.includes(user.id));
    
    for (let sub of subjects) {
        let subClasses = classes.filter(cls => cls.subjectId === sub.id);
        if (subClasses.length === 0) {
            continue;
        }

        let myRegisteredClassInSub = subClasses.find(cls => cls.enrolledStudents.includes(user.id));
        
        html += `
            <div style="border-bottom: 2px solid #000; margin-top:20px;" class="mb-10">
                <h3 class="text-primary">${sub.name}</h3>
            </div>
            <div>`;

        for (let c of subClasses) {
            let teacherObj = users.find(u => u.id === c.teacherId);
            let tcName = teacherObj ? teacherObj.name : 'Unknown';
            
            let isEnrolled = false;
            if (myRegisteredClassInSub && c.id === myRegisteredClassInSub.id) {
                isEnrolled = true;
            }
            
            let isLockedBySubject = false;
            if (myRegisteredClassInSub && !isEnrolled) {
                isLockedBySubject = true;
            }
            
            let hasTimeConflict = false;
            if (!isEnrolled) {
                for (let myClass of myEnrolledClasses) {
                    if (checkOverlap(c, myClass)) {
                        hasTimeConflict = true;
                    }
                }
            }

            let cardClass = "reg-card";
            let actionField = "";

            if (isEnrolled) {
                cardClass = "reg-card";
                actionField = `<button class="btn-danger" style="width:auto;" onclick="unenrollClass('${c.id}')">Hủy đăng ký</button>`;
                
            } else if (isLockedBySubject) {
                cardClass = "reg-card disabled";
                actionField = `<span class="reg-conflict-text">Khóa (Vì đã đăng ký lớp khác cùng môn)</span>`;
                
            } else if (hasTimeConflict) {
                cardClass = "reg-card disabled";
                actionField = `<span class="reg-conflict-text">Bị trùng lịch thời gian với lớp đã đăng ký</span>`;
                
            } else {
                cardClass = "reg-card";
                actionField = `<button class="btn-primary" style="width:auto;" onclick="enrollClass('${c.id}')">Đăng ký lớp</button>`;
            }

            html += `
                <div class="${cardClass}">
                    <div>
                        <strong>Mã lớp: ${c.id}</strong><br>
                        <span class="text-sm text-muted">Giảng viên: ${tcName} | Phòng học: ${c.room}</span><br>
                        <span class="text-sm font-bold">Lịch học cố định: ${c.dayOfWeek} (${getPeriodText(c.startPeriod, c.endPeriod)})</span>
                    </div>
                    <div>${actionField}</div>
                </div>`;
        }
        
        html += `</div>`;
    }
    
    container.innerHTML = html;
}

window.enrollClass = function(classId) {
    let classes = getDB('Classes');
    const user = getDB('currentUser');
    
    let targetClass = classes.find(c => c.id === classId);
    
    if (targetClass) {
        targetClass.enrolledStudents.push(user.id);
        setDB('Classes', classes);
        alert("Ghi nhận đăng ký tín chỉ thành công!");
        
        renderRegistrationTab(user);
        renderStudentStudyDashboard(user);
    }
};

window.unenrollClass = function(classId) {
    if (confirm("Bạn có chắc chắn muốn hủy đăng ký lớp này?")) {
        let classes = getDB('Classes');
        const user = getDB('currentUser');
        
        let targetClass = classes.find(c => c.id === classId);
        
        if (targetClass) {
            let filteredStudents = targetClass.enrolledStudents.filter(id => id !== user.id);
            targetClass.enrolledStudents = filteredStudents;
            
            setDB('Classes', classes);
            alert("Đã hủy lớp học thành công!");
            
            renderRegistrationTab(user);
            renderStudentStudyDashboard(user);
        }
    }
};