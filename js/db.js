function getDB(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function initDB() {
    let users = getDB('Users');
    
    // Reset nếu chưa có Admin
    if (!users.some(u => u.role === 'admin') && users.length > 0) { 
        localStorage.clear(); 
    }

    if (!localStorage.getItem('Users')) {
        let defaultUsers = [
            { id: 'ADMIN', role: 'admin', name: 'Giáo vụ Hệ thống', email: 'admin@gmail.com', password: '123' },
            { id: 'GV001', role: 'teacher', name: 'ThS. Trần Thị B', email: 'gv1@gmail.com', password: '123', dob: '1985-05-10', phone: '0988111222' },
            { id: 'GV002', role: 'teacher', name: 'TS. Trần Văn C', email: 'gv2@gmail.com', password: '123', dob: '1975-08-22', phone: '0988333444' },
            { id: 'SV202501', role: 'student', name: 'Nguyễn Văn An', email: 'sv1@gmail.com', password: '123', dob: '2005-01-15', phone: '0901000001' },
            { id: 'SV202502', role: 'student', name: 'Trần Thị Bé', email: 'sv2@gmail.com', password: '123', dob: '2005-02-20', phone: '0901000002' }
        ];
        setDB('Users', defaultUsers);
    }

    if (!localStorage.getItem('Subjects')) {
        let defaultSubjects = [
            { id: 'SUB01', name: 'Lập trình Web', abbr: 'WEB' }, 
            { id: 'SUB02', name: 'Cấu trúc dữ liệu', abbr: 'CTDL' },
            { id: 'SUB03', name: 'Cơ sở dữ liệu', abbr: 'CSDL' }
        ];
        setDB('Subjects', defaultSubjects);
    }

    if (!localStorage.getItem('Classes')) {
        let defaultClasses = [
            { 
                id: 'WEB_L1', 
                subjectId: 'SUB01', 
                teacherId: 'GV001', 
                room: 'A101', 
                dayOfWeek: 'Thứ 2', 
                startDate: '2026-06-01', 
                endDate: '2026-07-31', 
                startPeriod: 1, 
                endPeriod: 3,   
                enrolledStudents: ['SV202501'], 
                sessions: [
                    { id: 'S1', date: '2026-06-01', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} },
                    { id: 'S2', date: '2026-06-08', startPeriod: 1, endPeriod: 3, attendance: {} }
                ], 
                grades: { 'SV202501': { cc: 10, gk: 8, ck: 9 } } 
            },
            { 
                id: 'CTDL_L1', 
                subjectId: 'SUB02', 
                teacherId: 'GV002', 
                room: 'B201', 
                dayOfWeek: 'Thứ 2', 
                startDate: '2026-06-01', 
                endDate: '2026-07-31', 
                startPeriod: 2, 
                endPeriod: 4,   
                enrolledStudents: [], 
                sessions: [], 
                grades: {} 
            }
        ];
        setDB('Classes', defaultClasses);
    }
}
initDB();