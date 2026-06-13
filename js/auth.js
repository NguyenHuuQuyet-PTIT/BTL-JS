// ==========================================
// XỬ LÝ ĐĂNG NHẬP
// ==========================================
let loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 1. Khởi tạo FormData
        let formData = new FormData(e.target);
        
        // 2. Lấy dữ liệu
        let emailValue = formData.get('email');
        let passwordValue = formData.get('password');
        let roleValue = document.querySelector('input[name="role"]:checked').value;
        
        // 3. Xử lý logic tìm kiếm user
        let users = getDB('Users');
        let user = users.find(u => u.email === emailValue && u.password === passwordValue && u.role === roleValue);
        
        if (user) { 
            localStorage.setItem('currentUser', JSON.stringify(user)); 
            
            if (roleValue === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (roleValue === 'teacher') {
                window.location.href = 'teacher-dashboard.html';
            } else {
                window.location.href = 'student-dashboard.html';
            }
        } else {
            alert("Sai thông tin đăng nhập hoặc phân quyền!"); 
        }
    });
}