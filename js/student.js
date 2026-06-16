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
    
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = user.name;
    });
    
    document.querySelectorAll('.user-email').forEach(el => {
        el.textContent = user.email;
    });
    
    initCommonUI();
    initProfileUI(user);
    updateNotifBadge(user);

    renderStudentStudyDashboard(user); 
    renderRegistrationTab(user);
    renderStudentNotifs(user);
});

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
    
    let wDays = { 
        'Thứ 2': [], 'Thứ 3': [], 'Thứ 4': [], 'Thứ 5': [], 'Thứ 6': [], 'Thứ 7': [], 'Chủ nhật': [] 
    };
    
    let htmlCards = '';
    let htmlGradesRows = '';
    
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
        
        let grades = c.grades[user.id] || { cc: null, gk: null, ck: null };
        let avgScore = calcAvgScore(grades.cc, grades.gk, grades.ck);
        
        if (avgScore !== null) {
            countScore++; 
            sumScore += avgScore; 
            
            if (avgScore >= 8.0) {
                excellentCount++;
            }
            
            if (avgScore >= 9.0) {
                statsPie.xuatSac++; 
            } else if (avgScore >= 8.0) {
                statsPie.gioi++; 
            } else if (avgScore >= 6.5) {
                statsPie.kha++; 
            } else if (avgScore >= 5.0) {
                statsPie.tb++; 
            } else {
                statsPie.yeu++;
            }
        }
        
        htmlGradesRows += generateGradeRowHtml(subName, teacherName, grades);
        
        c.sessions.forEach(s => { 
            let studentStatus = s.attendance[user.id]; 
            if (studentStatus) {
                statsAtt[studentStatus]++; 
            }
        });

        let displayClassName = getDisplayClassName(c.id);

        htmlCards += `
            <div class="border-box border-left-dark flex-row align-center justify-between mb-10 cursor-pointer" onclick="openStuModal('${c.id}')">
                <div class="flex-1">
                    <h4 class="mb-10 text-primary">${subName} - ${displayClassName}</h4>
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

    let elGradesBody = document.getElementById('stuGradesTableBody');
    if (elGradesBody) {
        elGradesBody.innerHTML = htmlGradesRows || '<tr><td colspan="7">Chưa có dữ liệu điểm.</td></tr>';
    }

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
    if (elScheduleContainer) {
        elScheduleContainer.innerHTML = htmlWeekly || '<p>Tuần này trống lịch.</p>';
    }
    
    let elCardsContainer = document.getElementById('enrolledClassesCards');
    if (elCardsContainer) {
        elCardsContainer.innerHTML = htmlCards || '<p class="border-box">Chưa tham gia lớp nào.</p>';
    }
    
    let elTotalSub = document.getElementById('stat-total-subjects');
    if (elTotalSub) {
        elTotalSub.textContent = myClasses.length;
    }
    
    let elGpa = document.getElementById('stat-gpa');
    if (elGpa) {
        elGpa.textContent = countScore > 0 ? (sumScore / countScore).toFixed(1) : '--';
    }
    
    let elExcellent = document.getElementById('stat-excellent');
    if (elExcellent) {
        elExcellent.textContent = excellentCount;
    }
    
    let totalAttendance = statsAtt.present + statsAtt.late + statsAtt.absent;
    let elAttRate = document.getElementById('stat-attendance-rate');
    
    if (elAttRate) {
        elAttRate.textContent = totalAttendance > 0 ? ((statsAtt.present / totalAttendance) * 100).toFixed(1) + '%' : '0%';
    }
    
    drawStudentCharts(statsAtt, statsPie);
}

function drawStudentCharts(statsAtt, statsPie) {
    let attCanvas = document.getElementById('attendanceChart');
    if (!attCanvas) {
        return;
    }
    
    if (attChartInstance) {
        attChartInstance.destroy(); 
    }
    
    if (gradeChartInstance) {
        gradeChartInstance.destroy();
    }

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
    let user = getDB('currentUser');
    
    let targetClass = classes.find(c => c.id === classId); 
    
    if (!targetClass) {
        return;
    }
    
    let subName = subjects.find(s => s.id === targetClass.subjectId)?.name || '';
    let teacherName = users.find(u => u.id === targetClass.teacherId)?.name || '';
    let displayClassName = getDisplayClassName(targetClass.id);
    
    document.getElementById('modalClassName').textContent = `${subName} (${displayClassName})`;
    document.getElementById('modalTeacherName').textContent = `Giảng viên phụ trách: ${teacherName}`;
    
    let todayStr = new Date().toLocaleDateString('en-CA');
    
    let htmlContent = targetClass.sessions.map(s => {
        let statusText = (s.date <= todayStr) ? getAttendanceHtml(s.attendance[user.id]) : "Chưa diễn ra";
        let timeStr = getPeriodText(s.startPeriod, s.endPeriod);
        
        return `
            <tr>
                <td>Ngày: ${s.date} <span class="text-muted text-sm ml-10">${timeStr}</span></td>
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
    
    if (!container) {
        return;
    }
    
    // Đọc trạng thái trực tiếp bằng JSON.parse để không bị lỗi Truthy mảng rỗng
    let isOpen = JSON.parse(localStorage.getItem('RegistrationOpen'));
    let myEnrolledClasses = classes.filter(cls => cls.enrolledStudents.includes(user.id));
    let htmlResult = '';
    
    if (!isOpen) {
        htmlResult += `
            <div class="border-box bg-light mb-20">
                <strong class="text-danger">Hệ thống đang KHÓA cổng đăng ký lớp học.</strong>
            </div>
        `;
    }
    
    subjects.forEach(sub => {
        let classesOfSubject = classes.filter(c => c.subjectId === sub.id); 
        
        if (classesOfSubject.length === 0) {
            return;
        }

        // Bổ sung dòng khai báo để fix lỗi ReferenceError
        let enrolledClassInThisSubject = classesOfSubject.find(c => c.enrolledStudents.includes(user.id));
        
        htmlResult += `<h3 class="border-bottom mt-20 mb-10">${sub.name}</h3>`;

        classesOfSubject.forEach(c => {
            let teacherName = users.find(u => u.id === c.teacherId)?.name || '';
            let displayClassName = getDisplayClassName(c.id);
            let timeString = getPeriodText(c.startPeriod, c.endPeriod);
            
            let isEnrolled = c.enrolledStudents.includes(user.id);
            let isOtherClassEnrolled = (enrolledClassInThisSubject && enrolledClassInThisSubject.id !== c.id);
            let isConflicting = myEnrolledClasses.some(myClass => checkOverlap(c, myClass));
            
            let isCardDisabled = !isOpen || (!isEnrolled && (isOtherClassEnrolled || isConflicting));
            let disabledClassAttr = isCardDisabled ? 'disabled' : '';
            
            let actionHtml = '';
            if (isOpen) {
                if (isEnrolled) {
                    actionHtml = `<button class="btn-danger" style="width: auto;" onclick="unenrollClass('${c.id}')">Hủy đăng ký</button>`;
                } else if (!isOtherClassEnrolled && !isConflicting) {
                    actionHtml = `<button class="btn-primary" style="width: auto;" onclick="enrollClass('${c.id}')">Đăng ký lớp</button>`;
                }
            } else {
                // In nhãn hiển thị khi hệ thống khóa
                if (isEnrolled) {
                    actionHtml = `<strong class="text-success">Đã đăng ký</strong>`;
                } else {
                    actionHtml = `<span class="text-muted">Đã khóa</span>`;
                }
            }

            // Gắn sự kiện click mở Popup chỉ cho khu vực chữ (phân tách tương tác)
            let clickEvent = isCardDisabled ? '' : `onclick="openStuModal('${c.id}')"`;

            htmlResult += `
                <div class="border-box border-left-dark flex-row align-center justify-between mb-10 ${disabledClassAttr}">
                    <div class="flex-1 cursor-pointer" ${clickEvent}>
                        <h4 class="mb-10 text-primary">Tên lớp: ${displayClassName}</h4>
                        <p class="text-sm text-muted">GV: ${teacherName} | P.${c.room}</p>
                        <p class="text-sm">Lịch: ${c.dayOfWeek} (${timeString})</p>
                    </div>
                    <div>
                        ${actionHtml}
                    </div>
                </div>
            `;
        }); 
    }); 
    
    container.innerHTML = htmlResult || '<p>Chưa có môn học nào được mở đăng ký.</p>';
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
    renderStudentNotifs(user);
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
        renderStudentNotifs(user);
    } 
}

// ==========================================
// 4. HỆ THỐNG THÔNG BÁO THÔNG MINH
// ==========================================
function renderStudentNotifs(user) {
    let classes = getDB('Classes');
    let myClasses = classes.filter(c => c.enrolledStudents.includes(user.id));
    
    let filterSelect = document.getElementById('stuNotifFilter');
    
    if (filterSelect && filterSelect.options.length <= 2) {
        let htmlOptions = `<option value="all">Tất cả thông báo</option>`;
        htmlOptions += `<option value="all_students">Thông báo Hệ thống (Admin)</option>`;
        
        myClasses.forEach(c => {
            htmlOptions += `<option value="${c.id}">Lớp ${getDisplayClassName(c.id)}</option>`;
        });
        
        filterSelect.innerHTML = htmlOptions;
    }
    
    let filterVal = filterSelect ? filterSelect.value : 'all';
    let notifs = getDB('Notifications');
    let myClassesIds = myClasses.map(c => c.id);
    
    let filteredNotifs = notifs.filter(n => {
        if (filterVal === 'all') {
            return n.target === 'all_students' || myClassesIds.includes(n.target);
        } else {
            return n.target === filterVal;
        }
    }).reverse();
    
    renderSharedNotifCards('studentNotifList', filteredNotifs, user);
}

function handleStudentNotifFilterChange() {
    let user = getDB('currentUser');
    renderStudentNotifs(user);
}

function markAllNotifsRead() {
    let user = getDB('currentUser');
    let filterSelect = document.getElementById('stuNotifFilter');
    let filterVal = filterSelect ? filterSelect.value : 'all';
    
    let notifs = getDB('Notifications');
    let myClassesIds = getDB('Classes').filter(c => c.enrolledStudents.includes(user.id)).map(c => c.id);
    
    let filteredNotifs = notifs.filter(n => {
        if (filterVal === 'all') {
            return n.target === 'all_students' || myClassesIds.includes(n.target);
        } else {
            return n.target === filterVal;
        }
    });
    
    let changed = false;
    
    if (!user.readNotifs) {
        user.readNotifs = [];
    }
    
    filteredNotifs.forEach(n => {
        if (!user.readNotifs.includes(n.id)) {
            user.readNotifs.push(n.id);
            changed = true;
        }
    });
    
    if (changed) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        let users = getDB('Users');
        let uIndex = users.findIndex(u => u.id === user.id);
        
        if (uIndex > -1) {
            users[uIndex].readNotifs = user.readNotifs;
            setDB('Users', users);
        }
        
        updateNotifBadge(user);
        renderStudentNotifs(user);
    }
}