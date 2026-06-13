let attChartInstance = null;
let gradeChartInstance = null;

function checkOverlap(classA, classB) {
    let isSameDay = (classA.dayOfWeek === classB.dayOfWeek);
    let isTimeOverlap = (classA.startPeriod <= classB.endPeriod && classB.startPeriod <= classA.endPeriod);
    return isSameDay && isTimeOverlap;
}

// ==========================================
// 1. KHỞI TẠO & HỒ SƠ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    let user = getDB('currentUser');
    
    if (!user || user.role !== 'student') { 
        window.location.href = 'index.html'; 
        return; 
    }
    
    document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
    
    initSidebarNavigation();

    document.getElementById('profId').textContent = user.id; 
    
    // Format hiển thị ngày sinh DD/MM/YYYY
    let displayDob = user.dob ? user.dob.split('-').reverse().join('/') : 'Chưa cập nhật';
    document.getElementById('profDob').textContent = displayDob;
    document.getElementById('profPhone').textContent = user.phone || 'Chưa cập nhật';
    
    let btnShowEdit = document.getElementById('btnShowEditProfile');
    if (btnShowEdit) {
        btnShowEdit.addEventListener('click', () => { 
            let form = document.forms['editProfileForm'];
            form.elements['phone'].value = user.phone || ''; 
            form.elements['dob'].value = user.dob || ''; 
            document.getElementById('editProfileFormContainer').style.display = 'block'; 
        });
    }
    
    let btnCancelEdit = document.getElementById('btnCancelEditProfile');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => { 
            document.getElementById('editProfileFormContainer').style.display = 'none'; 
        });
    }

    let editForm = document.getElementById('editProfileForm');
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

    renderStudentStudyDashboard(user); 
    renderRegistrationTab(user);
});

// ==========================================
// 2. THỐNG KÊ HỌC TẬP
// ==========================================
function switchStuStudyTab(tabName) {
    switchSubTab('stu-tab-' + tabName + '-btn', 'stu-sub-' + tabName, '.stu-sub-btn', '.stu-sub-tab');
}

function renderStudentStudyDashboard(user) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    
    let myClasses = classes.filter(c => c.enrolledStudents.includes(user.id));
    let todayStr = new Date().toLocaleDateString('en-CA');
    
    let wDays = { 
        'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] 
    };
    
    let htmlCards = '';
    let sumScore = 0;
    let countScore = 0;
    let excellentCount = 0;
    
    let statsAtt = { present: 0, late: 0, absent: 0 };
    let statsPie = { xuatSac: 0, gioi: 0, kha: 0, tb: 0, yeu: 0 };

    myClasses.forEach(c => {
        let subName = subjects.find(s => s.id === c.subjectId)?.name || 'Unknown';
        let teacherName = users.find(u => u.id === c.teacherId)?.name || 'Unknown';
        
        let timeString = getPeriodText(c.startPeriod, c.endPeriod);
        wDays[c.dayOfWeek].push({ 
            subName: subName, 
            room: c.room, 
            timeStr: timeString 
        });
        
        let totalSessions = c.sessions.length;
        let pastSessions = c.sessions.filter(s => s.date <= todayStr).length;
        let completePercent = totalSessions > 0 ? Math.round((pastSessions / totalSessions) * 100) : 0;
        
        let grades = c.grades[user.id] || { cc: 0, gk: 0, ck: 0 };
        let avgScore = parseFloat((grades.cc * 0.2 + grades.gk * 0.3 + grades.ck * 0.5).toFixed(1));

        if (avgScore > 0) {
            countScore++; 
            sumScore += avgScore; 
            
            if (avgScore >= 8.0) excellentCount++;
            
            if (avgScore >= 9.0) statsPie.xuatSac++; 
            else if (avgScore >= 8.0) statsPie.gioi++; 
            else if (avgScore >= 6.5) statsPie.kha++; 
            else if (avgScore >= 5.0) statsPie.tb++; 
            else statsPie.yeu++;
        }
        
        c.sessions.forEach(s => { 
            let studentStatus = s.attendance[user.id]; 
            if (studentStatus) {
                statsAtt[studentStatus]++; 
            }
        });

        htmlCards += `
            <div class="border-box border-left-dark cursor-pointer" onclick="openStuModal('${c.id}')">
                <h3 class="text-primary">${subName} - ${c.id}</h3>
                <p class="mt-10 text-muted text-sm">GV: <span class="font-bold">${teacherName}</span></p>
                <div class="progress-bg">
                    <div class="progress-fill" style="width:${completePercent}%;"></div>
                </div>
                <span class="text-sm font-bold text-muted">Tiến độ: ${completePercent}% (${pastSessions}/${totalSessions} buổi)</span>
                <p class="font-bold text-success mt-auto pt-10">Điểm tích lũy: ${avgScore}</p>
            </div>
        `;
    });

    let htmlWeekly = Object.keys(wDays).filter(day => wDays[day].length > 0).map(day => {
        let itemsHtml = wDays[day].map(item => `
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

    let elScheduleContainer = document.getElementById('weeklyScheduleContainer');
    if (elScheduleContainer) elScheduleContainer.innerHTML = htmlWeekly || '<p>Tuần này trống lịch.</p>';
    
    let elCardsContainer = document.getElementById('enrolledClassesCards');
    if (elCardsContainer) elCardsContainer.innerHTML = htmlCards || '<p>Chưa tham gia lớp nào.</p>';
    
    let elTotalSub = document.getElementById('stat-total-subjects');
    if (elTotalSub) elTotalSub.textContent = myClasses.length;
    
    let elGpa = document.getElementById('stat-gpa');
    if (elGpa) elGpa.textContent = countScore > 0 ? (sumScore / countScore).toFixed(1) : '0.0';
    
    let elExcellent = document.getElementById('stat-excellent');
    if (elExcellent) elExcellent.textContent = excellentCount;
    
    let totalAttendance = statsAtt.present + statsAtt.late + statsAtt.absent;
    let elAttRate = document.getElementById('stat-attendance-rate');
    if (elAttRate) {
        elAttRate.textContent = totalAttendance > 0 ? ((statsAtt.present / totalAttendance) * 100).toFixed(1) + '%' : '0%';
    }
    
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
        options: { 
            plugins: {
                legend: { display: false }
            },
            scales: { 
                y: { 
                    ticks: { stepSize: 1, precision: 0 } 
                } 
            } 
        } 
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
    
    let targetClass = classes.find(c => c.id === classId); 
    if (!targetClass) return;
    
    let subName = subjects.find(s => s.id === targetClass.subjectId)?.name || '';
    let teacherName = users.find(u => u.id === targetClass.teacherId)?.name || '';
    
    document.getElementById('modalClassName').textContent = `${subName} (${targetClass.id})`;
    document.getElementById('modalTeacherName').textContent = `Giảng viên phụ trách: ${teacherName}`;
    
    let todayStr = new Date().toLocaleDateString('en-CA');
    let user = getDB('currentUser');
    
    let htmlContent = targetClass.sessions.map(s => {
        let statusText = "Chưa diễn ra";
        
        if (s.date <= todayStr) {
            let studentStatus = s.attendance[user.id]; 
            
            if (studentStatus === 'present') {
                statusText = '<span class="text-success font-bold">Có mặt</span>';
            } else if (studentStatus === 'late') {
                statusText = '<span class="text-warning font-bold">Đi muộn</span>';
            } else if (studentStatus === 'absent') {
                statusText = '<span class="text-danger font-bold">Vắng mặt</span>';
            } else {
                statusText = '<span class="text-muted">Chưa điểm danh</span>';
            }
        }
        
        return `
            <tr>
                <td>
                    Ngày: ${s.date} 
                    <span class="text-muted text-sm ml-10">${getPeriodText(s.startPeriod, s.endPeriod)}</span>
                </td>
                <td>${statusText}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('modalSessionList').innerHTML = htmlContent || '<tr><td colspan="2">Chưa có lịch học.</td></tr>';
    document.getElementById('stuClassModal').style.display = 'block';
}

// ==========================================
// 3. ĐĂNG KÝ TÍN CHỈ
// ==========================================
function renderRegistrationTab(user) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    let users = getDB('Users');
    
    let container = document.getElementById('registrationContainer'); 
    if (!container) return;
    
    let myEnrolledClasses = classes.filter(cls => cls.enrolledStudents.includes(user.id));
    let htmlResult = '';
    
    subjects.forEach(sub => {
        let classesOfSubject = classes.filter(c => c.subjectId === sub.id); 
        
        if (classesOfSubject.length === 0) return;
        
        let enrolledClassInThisSubject = classesOfSubject.find(c => c.enrolledStudents.includes(user.id));
        
        htmlResult += `
            <h3 class="border-bottom mt-20 mb-10">${sub.name}</h3>
            <div>
        `;

        classesOfSubject.forEach(c => {
            let teacherName = users.find(u => u.id === c.teacherId)?.name || '';
            let timeString = getPeriodText(c.startPeriod, c.endPeriod);
            
            let isEnrolled = c.enrolledStudents.includes(user.id);
            let isOtherClassEnrolled = (enrolledClassInThisSubject && enrolledClassInThisSubject.id !== c.id);
            let isConflicting = myEnrolledClasses.some(myClass => checkOverlap(c, myClass));
            
            let isDisabled = !isEnrolled && (isOtherClassEnrolled || isConflicting);
            let disabledClassAttr = isDisabled ? 'disabled' : '';

            let buttonHtml = '';
            if (isEnrolled) {
                buttonHtml = `<button class="btn-danger" style="width: auto;" onclick="unenrollClass('${c.id}')">Hủy đăng ký</button>`;
            } else if (!isDisabled) {
                buttonHtml = `<button class="btn-primary" style="width: auto;" onclick="enrollClass('${c.id}')">Đăng ký lớp</button>`;
            }

            htmlResult += `
                <div class="border-box flex-row align-center justify-between mb-10 ${disabledClassAttr}">
                    <div>
                        <h4 class="mb-10 text-primary">Mã lớp: ${c.id}</h4>
                        <p class="text-sm text-muted">GV: ${teacherName} | P.${c.room}</p>
                        <p class="text-sm">Lịch: ${c.dayOfWeek} (${timeString})</p>
                    </div>
                    <div>
                        ${buttonHtml}
                    </div>
                </div>
            `;
        }); 
        
        htmlResult += `</div>`;
    }); 
    
    container.innerHTML = htmlResult;
}

function enrollClass(classId) { 
    let user = getDB('currentUser');
    updateClassDB(classId, function(c) { 
        if (!c.enrolledStudents.includes(user.id)) {
            c.enrolledStudents.push(user.id); 
        }
    }); 
    
    alert("Đăng ký thành công!"); 
    renderRegistrationTab(user); 
    renderStudentStudyDashboard(user); 
}

function unenrollClass(classId) { 
    if (confirm("Bạn có chắc chắn muốn hủy đăng ký lớp này?")) { 
        let user = getDB('currentUser');
        updateClassDB(classId, function(c) { 
            c.enrolledStudents = c.enrolledStudents.filter(id => id !== user.id); 
        }); 
        
        alert("Đã hủy đăng ký thành công!"); 
        renderRegistrationTab(user); 
        renderStudentStudyDashboard(user); 
    } 
}