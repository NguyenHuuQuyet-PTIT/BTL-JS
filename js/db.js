function initializeDatabase() {
    if (!localStorage.getItem('Users')) {
        localStorage.setItem('Users', JSON.stringify([
            { id: 'SV2021001', role: 'student', name: 'Nguyễn Văn A', email: 'A@gmail.com', password: '123' },
            { id: 'SV2021002', role: 'student', name: 'Trần Thị B', email: 'tran.b@example.com', password: '123' },
            { id: 'SV2021003', role: 'student', name: 'Lê Văn C', email: 'le.c@example.com', password: '123' },
            { id: 'SV2021004', role: 'student', name: 'Phạm Thị D', email: 'pham.d@example.com', password: '123' },
            { id: 'GV001', role: 'teacher', name: 'Trần Thị B', email: 'B@gmail.com', password: '123' }
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
            { 
                id: 'CNTT101', subjectId: 'SUB01', teacherId: 'GV001', room: 'A101', schedule: 'Thứ 2 (07:00-09:00)', totalStudents: 4,
                materials: [
                    { id: 'M1', title: 'Bài giảng 1: Giới thiệu HTML & CSS', filename: 'bai-giang-1.pdf', date: '2024-02-01', type: 'Bài giảng' },
                    { id: 'M2', title: 'Bài tập 1: Tạo trang web đơn giản', filename: 'bai-tap-1.pdf', date: '2024-02-05', type: 'Bài tập' }
                ]
            }
        ]));
    }
    if (!localStorage.getItem('AcademicRecords')) {
        localStorage.setItem('AcademicRecords', JSON.stringify([
            { studentId: 'SV2021001', subjectId: 'SUB01', midterm: 8.5, final: 9.0, average: 8.8 }
        ]));
    }
}
initializeDatabase();