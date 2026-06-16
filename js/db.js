// ==========================================
// 1. CƠ SỞ DỮ LIỆU & TRUY XUẤT
// ==========================================
function getDB(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function setDB(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function updateClassDB(classId, updateFunction) {
    let classes = getDB('Classes');
    let targetClass = classes.find(c => c.id === classId);
    
    if (targetClass) { 
        updateFunction(targetClass, classes); 
        setDB('Classes', classes); 
    }
}

// ==========================================
// 2. TIỆN ÍCH DÙNG CHUNG (HELPER)
// ==========================================
const PERIOD_TIMES = { 
    1: "07:00-07:50", 2: "08:00-08:50", 3: "09:00-09:50", 4: "10:00-10:50", 
    5: "11:00-11:50", 6: "12:00-12:50", 7: "13:00-13:50", 8: "14:00-14:50", 
    9: "15:00-15:50", 10: "16:00-16:50", 11: "17:00-17:50", 12: "18:00-18:50" 
};

function getPeriodText(start, end) {
    let startTime = PERIOD_TIMES[start].split("-")[0];
    let endTime = PERIOD_TIMES[end].split("-")[1];
    return `Tiết ${start}-${end} (${startTime} - ${endTime})`;
}

// Logic đánh số tự động: Môn học_L + Index
function getDisplayClassName(classId) {
    let classes = getDB('Classes');
    let subjects = getDB('Subjects');
    
    let targetClass = classes.find(c => c.id === classId);
    
    if (!targetClass) {
        return classId;
    }
    
    let subject = subjects.find(s => s.id === targetClass.subjectId);
    let abbr = subject ? subject.abbr : 'CLASS';
    
    let subjectClasses = classes.filter(c => c.subjectId === targetClass.subjectId);
    let index = subjectClasses.findIndex(c => c.id === classId);
    
    return abbr + '_L' + (index + 1);
}

function calcAvgScore(cc, gk, ck) {
    if (cc === null || cc === "" || gk === null || gk === "" || ck === null || ck === "") {
        return null;
    }
    return parseFloat((parseFloat(cc) * 0.2 + parseFloat(gk) * 0.3 + parseFloat(ck) * 0.5).toFixed(1));
}

// Xếp loại học tập
function getRankHtml(score) {
    if (score === null) {
        return '<span class="text-muted">--</span>';
    }
    if (score >= 9.0) {
        return '<span style="color: #9C27B0; font-weight: bold;">Xuất sắc</span>';
    }
    if (score >= 8.0) {
        return '<span class="text-primary font-bold">Giỏi</span>';
    }
    if (score >= 6.5) {
        return '<span class="text-success font-bold">Khá</span>';
    }
    if (score >= 5.0) {
        return '<span class="text-warning font-bold">Trung bình</span>';
    }
    return '<span class="text-danger font-bold">Yếu</span>';
}

// Điểm danh
function getAttendanceHtml(status) {
    if (status === 'present') {
        return '<span class="text-success font-bold">Có mặt</span>';
    }
    if (status === 'late') {
        return '<span class="text-warning font-bold">Đi muộn</span>';
    }
    if (status === 'absent') {
        return '<span class="text-danger font-bold">Vắng mặt</span>';
    }
    return '<span class="text-muted">Chưa điểm danh</span>';
}

function handleLogout() {
    localStorage.removeItem('currentUser'); 
    window.location.href = 'index.html'; 
}

// ==========================================
// 3. QUẢN LÝ GIAO DIỆN CHUNG (MODAL, TAB)
// ==========================================
function openModal(modalId) { 
    document.getElementById(modalId).style.display = 'block'; 
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

function initCommonUI() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() { 
            this.closest('.modal').style.display = 'none'; 
        });
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); 
            document.querySelectorAll('.menu-item').forEach(m => {
                m.classList.remove('active');
            });
            this.classList.add('active');
            
            document.querySelectorAll('.tab-section').forEach(tab => {
                tab.style.display = 'none';
            });
            
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });

    document.querySelectorAll('.sub-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let parentMenu = this.closest('.sub-menu');
            
            parentMenu.querySelectorAll('.sub-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');

            let container = parentMenu.parentElement;
            container.querySelectorAll('.sub-tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            document.getElementById(this.getAttribute('data-target')).style.display = 'block';
        });
    });
}

function initProfileUI(user) {
    let profContainer = document.getElementById('profile-tab');
    
    if (!profContainer) {
        return; 
    }

    document.getElementById('profId').textContent = user.id; 
    document.getElementById('profDob').textContent = user.dob ? user.dob.split('-').reverse().join('/') : 'Chưa cập nhật';
    document.getElementById('profPhone').textContent = user.phone || 'Chưa cập nhật';
    
    let formContainer = document.getElementById('editProfileFormContainer');
    let editForm = document.getElementById('editProfileForm');

    document.getElementById('btnShowEditProfile').addEventListener('click', () => { 
        editForm.elements['phone'].value = user.phone || ''; 
        editForm.elements['dob'].value = user.dob || ''; 
        formContainer.style.display = 'block'; 
    });
    
    document.getElementById('btnCancelEditProfile').addEventListener('click', () => { 
        formContainer.style.display = 'none'; 
    });

    editForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        let formData = new FormData(e.target);
        let newPassword = formData.get('password').trim();
        
        if (newPassword !== '') {
            user.password = newPassword;
        }
        
        user.phone = formData.get('phone').trim();
        user.dob = formData.get('dob');
        
        localStorage.setItem('currentUser', JSON.stringify(user)); 
        
        let users = getDB('Users');
        let userIndex = users.findIndex(u => u.id === user.id); 
        
        if (userIndex > -1) {
            users[userIndex] = user; 
            setDB('Users', users);
        }
        
        alert("Cập nhật thông tin thành công!"); 
        document.getElementById('profDob').textContent = user.dob.split('-').reverse().join('/');
        document.getElementById('profPhone').textContent = user.phone;
        formContainer.style.display = 'none';
        editForm.reset();
    });
}

// ==========================================
// 4. TIỆN ÍCH THÔNG BÁO
// ==========================================
function formatNotificationText(text) {
    let formatted = text.replace(/\n/g, '<br>');
    let urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return formatted.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank" class="text-primary font-bold">' + url + '</a>';
    });
}

function updateNotifBadge(user) {
    if (!user || user.role === 'admin') {
        return;
    }
    
    let notifs = getDB('Notifications');
    let unreadCount = 0;
    
    let readArr = user.readNotifs || [];
    
    if (user.role === 'student') {
        let myClassesIds = getDB('Classes').filter(c => c.enrolledStudents.includes(user.id)).map(c => c.id);
        let myNotifs = notifs.filter(n => n.target === 'all_students' || myClassesIds.includes(n.target));
        
        unreadCount = myNotifs.filter(n => !readArr.includes(n.id)).length;
        
        let badgeEl = document.getElementById('stuNotifBadge');
        if (badgeEl) {
            badgeEl.innerHTML = unreadCount > 0 ? '<span class="text-danger">&#9679;</span>' : '';
        }
    } else if (user.role === 'teacher') {
        let myNotifs = notifs.filter(n => n.target === 'all_teachers');
        
        unreadCount = myNotifs.filter(n => !readArr.includes(n.id)).length;
        
        let badgeEl = document.getElementById('tcNotifBadge');
        if (badgeEl) {
            badgeEl.innerHTML = unreadCount > 0 ? '<span class="text-danger">&#9679;</span>' : '';
        }
    }
}

function renderSharedNotifCards(containerId, notifsArray, user) {
    let container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
    let readArr = user.readNotifs || [];
    
    let html = notifsArray.map(n => {
        let isRead = readArr.includes(n.id);
        
        let bgClass = isRead ? 'bg-light' : '';
        let titleClass = isRead ? 'text-muted' : 'text-primary';
        let textClass = isRead ? 'text-muted' : '';
        let dotHtml = isRead ? '' : '<span class="text-danger ml-10">&#9679;</span>';
        
        let previewText = n.text.length > 100 ? n.text.substring(0, 100) + '...' : n.text;
        
        return `
            <div class="border-box border-left-dark mb-10 cursor-pointer ${bgClass}" onclick="openReadNotifModal('${n.id}')">
                <div class="flex-row justify-between mb-10">
                    <strong class="${titleClass}">${n.senderName} ${dotHtml}</strong>
                    <span class="text-muted text-sm">${n.date}</span>
                </div>
                <p class="${textClass}">${previewText}</p>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html || '<p class="border-box">Chưa có thông báo nào.</p>';
}

function openReadNotifModal(notifId) {
    let notifs = getDB('Notifications');
    let n = notifs.find(x => x.id === notifId);
    
    if (!n) {
        return;
    }
    
    let user = getDB('currentUser');
    
    if (user && user.role !== 'admin') {
        if (!user.readNotifs) {
            user.readNotifs = [];
        }
        
        if (!user.readNotifs.includes(notifId)) {
            user.readNotifs.push(notifId);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            let users = getDB('Users');
            let uIndex = users.findIndex(u => u.id === user.id);
            
            if (uIndex > -1) {
                users[uIndex].readNotifs = user.readNotifs;
                setDB('Users', users);
            }
            
            updateNotifBadge(user);
            
            if (user.role === 'student' && typeof renderStudentNotifs === 'function') {
                renderStudentNotifs(user);
            } else if (user.role === 'teacher' && typeof renderTeacherInbox === 'function') {
                renderTeacherInbox(user);
            }
        }
    }
    
    document.getElementById('readNotifTitle').textContent = n.senderName;
    document.getElementById('readNotifDate').textContent = n.date;
    document.getElementById('readNotifContent').innerHTML = formatNotificationText(n.text);
    
    let actions = document.getElementById('readNotifActions');
    if (actions) {
        actions.innerHTML = '';
    }
    
    openModal('readNotifModal');
}

// ==========================================
// 5. KHỞI TẠO DỮ LIỆU BAN ĐẦU
// ==========================================
function initDB() {
    let users = getDB('Users');
    
    if (!users.some(u => u.role === 'admin') && users.length > 0) {
        localStorage.clear();
    }

    if (!localStorage.getItem('Users')) {
        setDB('Users', [
            { id: 'ADMIN', role: 'admin', name: 'Giáo vụ Hệ thống', email: 'admin@gmail.com', password: '123' },
            { id: 'GV001', role: 'teacher', name: 'ThS. Trần Thị B', email: 'gv1@gmail.com', password: '123', dob: '1985-05-10', phone: '0988111222', readNotifs: [] },
            { id: 'GV002', role: 'teacher', name: 'TS. Trần Văn C', email: 'gv2@gmail.com', password: '123', dob: '1975-08-22', phone: '0988333444', readNotifs: [] },
            { id: 'SV202501', role: 'student', name: 'Nguyễn Văn An', email: 'sv1@gmail.com', password: '123', dob: '2005-01-15', phone: '0901000001', readNotifs: [] },
            { id: 'SV202502', role: 'student', name: 'Trần Thị Bé', email: 'sv2@gmail.com', password: '123', dob: '2005-02-20', phone: '0901000002', readNotifs: [] }
        ]);
    }
    
    if (!localStorage.getItem('Subjects')) {
        setDB('Subjects', [ 
            { id: 'SUB01', name: 'Lập trình Web', abbr: 'WEB' }, 
            { id: 'SUB02', name: 'Cấu trúc dữ liệu', abbr: 'CTDL' }, 
            { id: 'SUB03', name: 'Cơ sở dữ liệu', abbr: 'CSDL' } 
        ]);
    }
    
    if (!localStorage.getItem('Classes')) {
        let defaultId = 'WEB_' + Date.now();
        setDB('Classes', [
            { 
                id: defaultId, 
                subjectId: 'SUB01', 
                teacherId: 'GV001', 
                room: 'A101', 
                dayOfWeek: 'Thứ 2', 
                startDate: '2026-06-01', 
                endDate: '2026-07-31', 
                startPeriod: 1, 
                endPeriod: 3, 
                enrolledStudents: ['SV202501', 'SV202502'], 
                sessions: [ 
                    { id: 'S1', date: '2026-06-01', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present', 'SV202502': 'late'} } 
                ], 
                grades: { 
                    'SV202501': { cc: 10, gk: 8, ck: 9 }, 
                    'SV202502': { cc: null, gk: null, ck: null } 
                } 
            }
        ]);
    }

    if (!localStorage.getItem('Notifications')) {
        setDB('Notifications', [
            { 
                id: 'NOTIF_' + Date.now(), 
                senderName: 'Giáo vụ Hệ thống', 
                target: 'all_students', 
                text: 'Chào mừng tân sinh viên khóa mới!\nHãy theo dõi trang tài liệu: https://google.com', 
                date: new Date().toLocaleDateString('en-CA') 
            }
        ]);
    }

    // Đặt mặc định trạng thái khóa cổng đăng ký là false
    if (localStorage.getItem('RegistrationOpen') === null) {
        localStorage.setItem('RegistrationOpen', JSON.stringify(false));
    }
}

initDB();