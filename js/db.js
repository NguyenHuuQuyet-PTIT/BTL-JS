function initializeDatabase() {
    if (!localStorage.getItem('Users')) {
        localStorage.setItem('Users', JSON.stringify([
            { id: 'SV001', role: 'student', name: 'Lê Tuấn Phong', email: 'A@gmail.com', password: '123' }
        ]));
    }
    if (!localStorage.getItem('Subjects')) {
        localStorage.setItem('Subjects', JSON.stringify([
            { id: 'SUB01', name: 'Lập trình Web' },
            { id: 'SUB02', name: 'Cấu trúc dữ liệu và giải thuật' },
            { id: 'SUB03', name: 'Cơ sở dữ liệu' },
            { id: 'SUB04', name: 'Mạng máy tính' }
        ]));
    }
    if (!localStorage.getItem('Classes')) {
        localStorage.setItem('Classes', JSON.stringify([
            { id: 'CLASS01', subjectId: 'SUB01', teacherId: 'GV001', room: 'A101', schedule: 'Thứ 2 (07:00-09:00)' },
            { id: 'CLASS02', subjectId: 'SUB03', teacherId: 'GV001', room: 'B205', schedule: 'Thứ 4 (13:00-15:00)' }
        ]));
    }
    if (!localStorage.getItem('AcademicRecords')) {
        localStorage.setItem('AcademicRecords', JSON.stringify([
            { studentId: 'SV001', subjectId: 'SUB01', midterm: 8.5, final: 9.0, average: 8.8 },
            { studentId: 'SV001', subjectId: 'SUB02', midterm: 7.5, final: 8.0, average: 7.8 }
        ]));
    }
}
initializeDatabase();