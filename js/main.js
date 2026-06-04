// 1. Kiểm tra đăng nhập và Render thông tin User
function checkAuthAndRenderInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) { window.location.href = 'index.html'; return; }

    const nameEls = document.querySelectorAll('.user-name');
    const emailEls = document.querySelectorAll('.user-email');
    const welcome = document.querySelector('.welcome-text');

    for(let i=0; i<nameEls.length; i++) nameEls[i].textContent = user.name;
    for(let i=0; i<emailEls.length; i++) emailEls[i].textContent = user.email;
    if(welcome) welcome.textContent = `Chào mừng ${user.name} đến với Edu Report`;
}

// 2. Chức năng chuyển Tab
function setupTabs() {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = document.querySelectorAll('.tab-section');

    for (let i = 0; i < menuItems.length; i++) {
        menuItems[i].addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            
            for(let j=0; j<tabs.length; j++) tabs[j].classList.remove('active-tab');
            for(let j=0; j<menuItems.length; j++) menuItems[j].classList.remove('active');
            
            document.getElementById(targetId).classList.add('active-tab');
            this.classList.add('active');
        });
    }
}

// 3. Render Dữ liệu Học tập & Bảng điểm
function renderAcademicData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if(!user || user.role !== 'student') return;

    const records = JSON.parse(localStorage.getItem('AcademicRecords')) || [];
    const subjects = JSON.parse(localStorage.getItem('Subjects')) || [];
    const classes = JSON.parse(localStorage.getItem('Classes')) || [];
    
    // Xử lý thống kê chung
    let totalScore = 0, count = 0;
    let transcriptHTML = '';

    for (let i = 0; i < records.length; i++) {
        if (records[i].studentId === user.id) {
            count++;
            totalScore += records[i].average;
            
            // Tìm tên môn học
            let subName = '';
            for(let j=0; j<subjects.length; j++) {
                if(subjects[j].id === records[i].subjectId) subName = subjects[j].name;
            }

            transcriptHTML += `
                <tr>
                    <td><strong>${subName}</strong></td>
                    <td>${records[i].midterm}</td>
                    <td>${records[i].final}</td>
                    <td><span style="color: green; font-weight: bold;">${records[i].average}</span></td>
                </tr>
            `;
        }
    }

    const avgEl = document.getElementById('stat-gpa');
    const totalSubEl = document.getElementById('stat-total-subjects');
    const transcriptBody = document.getElementById('transcriptBody');

    if(avgEl && count > 0) avgEl.textContent = (totalScore / count).toFixed(1);
    if(totalSubEl) totalSubEl.textContent = count;
    if(transcriptBody) transcriptBody.innerHTML = transcriptHTML;

    // Render Lịch học
    let scheduleHTML = '';
    for(let i=0; i<classes.length; i++) {
        let subName = subjects.find(s => s.id === classes[i].subjectId)?.name || 'Môn học';
        scheduleHTML += `<li><strong>${subName}</strong><span>Phòng: ${classes[i].room} | ${classes[i].schedule}</span></li>`;
    }
    const scheduleList = document.getElementById('scheduleList');
    if(scheduleList) scheduleList.innerHTML = scheduleHTML;
}

// 4. Vẽ Biểu đồ (Sử dụng Thư viện Chart.js)
function drawCharts() {
    const ctxBar = document.getElementById('attendanceChart');
    const ctxPie = document.getElementById('gradePieChart');

    if(ctxBar) {
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Tháng 1', 'Tháng 3', 'Tháng 5'],
                datasets: [{
                    label: 'Số buổi có mặt',
                    data: [18, 17, 19],
                    backgroundColor: '#000'
                }]
            }
        });
    }

    if(ctxPie) {
        new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Giỏi', 'Khá', 'Xuất sắc'],
                datasets: [{
                    data: [25, 50, 25],
                    backgroundColor: ['#4285F4', '#FBBC05', '#34A853']
                }]
            }
        });
    }
}

// 5. Đăng xuất
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRenderInfo();
    setupTabs();
    renderAcademicData();
    drawCharts();
    
    const btnLogout = document.getElementById('btnLogout');
    if(btnLogout) btnLogout.addEventListener('click', handleLogout);
});
// Hàm 12: Xử lý dữ liệu và giao diện riêng cho Giáo viên
function renderTeacherData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'teacher') return;

    const classes = JSON.parse(localStorage.getItem('Classes')) || [];
    const subjects = JSON.parse(localStorage.getItem('Subjects')) || [];

    let totalClasses = 0;
    let totalStudents = 0;
    let classHTML = '';
    let scheduleHTML = '';

    // Vòng lặp duyệt qua tất cả các lớp học
    for (let i = 0; i < classes.length; i++) {
        // Cấu trúc điều kiện: Lọc các lớp do giáo viên này dạy
        if (classes[i].teacherId === user.id) {
            totalClasses++;
            totalStudents += classes[i].totalStudents || 35; // Giả sử mỗi lớp có 35 SV nếu chưa có data

            // Lấy tên môn học từ bảng Subjects
            let subjectName = '';
            for (let j = 0; j < subjects.length; j++) {
                if (subjects[j].id === classes[i].subjectId) {
                    subjectName = subjects[j].name;
                    break;
                }
            }

            // HTML cho danh sách lớp (Tab Lớp học & Trang chủ)
            classHTML += `
                <div class="chart-box" style="cursor: pointer;">
                    <h3 style="margin-bottom: 10px; border:none; padding:0;">${subjectName}</h3>
                    <p style="color: #666; font-size: 14px;">Mã lớp: ${classes[i].id}</p>
                    <p style="margin-top: 15px; font-weight: bold;">${classes[i].totalStudents || 35} sinh viên</p>
                </div>
            `;

            // HTML cho Lịch học
            scheduleHTML += `
                <li>
                    <strong>${subjectName}</strong>
                    <span>Phòng: ${classes[i].room} | ${classes[i].schedule}</span>
                </li>
            `;
        }
    }

    // Tương tác DOM: Đổ dữ liệu vào các thẻ HTML
    const totalClassesEl = document.getElementById('teacher-total-classes');
    const totalStudentsEl = document.getElementById('teacher-total-students');
    const recentClassList = document.getElementById('recentClassList');
    const fullClassList = document.getElementById('fullClassList');
    const teacherScheduleList = document.getElementById('teacherScheduleList');

    if (totalClassesEl) totalClassesEl.textContent = totalClasses;
    if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
    
    // Đổ danh sách lớp (Dùng chung HTML cho nhanh)
    if (recentClassList) recentClassList.innerHTML = scheduleHTML; // Tab Home dùng dạng List
    if (fullClassList) fullClassList.innerHTML = classHTML; // Tab Lớp học dùng dạng Thẻ (Card)
    if (teacherScheduleList) teacherScheduleList.innerHTML = scheduleHTML; // Tab Lịch học
}

// Cập nhật lại hàm khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRenderInfo();
    setupTabs();
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        if (user.role === 'student') {
            renderAcademicData();
            if(typeof drawCharts === 'function') drawCharts();
        } else if (user.role === 'teacher') {
            renderTeacherData(); // Gọi hàm render cho giáo viên
        }
    }
    
    const btnLogout = document.getElementById('btnLogout');
    if(btnLogout) btnLogout.addEventListener('click', handleLogout);
});