function initDB() {
    let users = JSON.parse(localStorage.getItem('Users')) || [];
    if (!users.some(u => u.role === 'admin') && users.length > 0) { localStorage.clear(); }

    if (!localStorage.getItem('Users')) {
        let newUsers = [
            { id: 'ADMIN', role: 'admin', name: 'Giáo vụ Admin', email: 'admin@gmail.com', password: '123' },
            { id: 'GV001', role: 'teacher', name: 'ThS. Trần Thị B', email: 'gv1@gmail.com', password: '123', dob: '1985-05-10', phone: '0988111222' },
            { id: 'GV002', role: 'teacher', name: 'TS. Trần Văn C', email: 'gv2@gmail.com', password: '123', dob: '1975-08-22', phone: '0988333444' },
            { id: 'SV202501', role: 'student', name: 'Nguyễn Văn An', email: 'sv1@gmail.com', password: '123', dob: '2005-01-15', phone: '0901000001' },
            { id: 'SV202502', role: 'student', name: 'Trần Thị Bé', email: 'sv2@gmail.com', password: '123', dob: '2005-02-20', phone: '0901000002' },
            { id: 'SV202503', role: 'student', name: 'Lê Hoàng Hải', email: 'sv3@gmail.com', password: '123', dob: '2005-03-10', phone: '0901000003' }
        ];
        localStorage.setItem('Users', JSON.stringify(newUsers));
    }

    if (!localStorage.getItem('Subjects')) {
        localStorage.setItem('Subjects', JSON.stringify([
            { id: 'SUB01', name: 'Lập trình Web', abbr: 'WEB' }, 
            { id: 'SUB02', name: 'Cấu trúc dữ liệu', abbr: 'CTDL' },
            { id: 'SUB03', name: 'Cơ sở dữ liệu', abbr: 'CSDL' }
        ]));
    }

    if (!localStorage.getItem('Classes')) {
        let classes = [
            { 
                id: 'WEB_L1', subjectId: 'SUB01', teacherId: 'GV001', room: 'A101', 
                dayOfWeek: 'Thứ 2', startDate: '2026-06-01', endDate: '2026-07-31', startTime: '07:00', endTime: '09:00', 
                enrolledStudents: ['SV202501'], 
                sessions: [
                    { id: 'S1', date: '2026-06-01', startTime: '07:00', endTime: '09:00', attendance: {'SV202501': 'present'} },
                    { id: 'S2', date: '2026-06-08', startTime: '07:00', endTime: '09:00', attendance: {} }
                ], grades: {'SV202501': {cc: 10, gk: 8, ck: 9}} 
            },
            { id: 'WEB_L2', subjectId: 'SUB01', teacherId: 'GV002', room: 'A102', dayOfWeek: 'Thứ 3', startDate: '2026-06-01', endDate: '2026-07-31', startTime: '09:00', endTime: '11:00', enrolledStudents: [], sessions: [], grades: {} },
            { id: 'CTDL_L1', subjectId: 'SUB02', teacherId: 'GV001', room: 'B201', dayOfWeek: 'Thứ 2', startDate: '2026-06-01', endDate: '2026-07-31', startTime: '08:00', endTime: '10:00', enrolledStudents: [], sessions: [], grades: {} }
        ];
        localStorage.setItem('Classes', JSON.stringify(classes));
    }
}
initDB();