function initializeDatabase() {
    if (!localStorage.getItem('Users')) {
        let users = [
            { id: 'GV001', role: 'teacher', name: 'Trần Thị B', email: 'gv1@gmail.com', password: '123' },
            { id: 'GV002', role: 'teacher', name: 'TS. Trần Văn C', email: 'gv2@gmail.com', password: '123' },
            { id: 'GV003', role: 'teacher', name: 'PGS. Lê Thị D', email: 'gv3@gmail.com', password: '123' }
        ];
        // Tạo 35 sinh viên
        for(let i=1; i<=35; i++) {
            let idStr = i < 10 ? '0'+i : i;
            users.push({ id: `SV2025${idStr}`, role: 'student', name: `Sinh viên ${i}`, email: `sv${i}@gmail.com`, password: '123' });
        }
        localStorage.setItem('Users', JSON.stringify(users));
    }

    if (!localStorage.getItem('Subjects')) {
        localStorage.setItem('Subjects', JSON.stringify([
            { id: 'SUB01', name: 'Lập trình Web' }, { id: 'SUB02', name: 'Cấu trúc dữ liệu' }, { id: 'SUB03', name: 'Cơ sở dữ liệu' }
        ]));
    }

    if (!localStorage.getItem('Classes')) {
        let allStudents = [];
        for(let i=1; i<=35; i++) allStudents.push(`SV2025${i<10?'0'+i:i}`);

        let classes = [
            { 
                id: 'CNTT101', subjectId: 'SUB01', teacherId: 'GV001', room: 'A101', 
                dayOfWeek: 'Thứ 2', startTime: '07:00', endTime: '09:00',
                enrolledStudents: allStudents.slice(0, 15), // 15 SV lớp 1
                sessions: [
                    { id: 'SES_1', date: '2025-05-10', startTime: '07:00', endTime: '09:00', attendance: { 'SV202501': 'present', 'SV202502': 'late' } }
                ],
                grades: { 'SV202501': { cc: 10, gk: 8, ck: 9 } }
            },
            { 
                id: 'CNTT102', subjectId: 'SUB02', teacherId: 'GV002', room: 'B205', 
                dayOfWeek: 'Thứ 3', startTime: '09:00', endTime: '11:00',
                enrolledStudents: allStudents.slice(10, 30), // 20 SV lớp 2
                sessions: [], grades: {}
            }
        ];
        localStorage.setItem('Classes', JSON.stringify(classes));
    }
}
initializeDatabase();