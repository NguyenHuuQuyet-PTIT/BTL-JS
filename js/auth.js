document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value, pass = document.getElementById('password').value, role = document.querySelector('input[name="role"]:checked').value;
    const users = JSON.parse(localStorage.getItem('Users')) || [];
    const user = users.find(u => u.email === email && u.password === pass && u.role === role);
    if (user) { 
        localStorage.setItem('currentUser', JSON.stringify(user)); 
        window.location.href = role === 'admin' ? 'admin-dashboard.html' : role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
    } else { alert("Sai thông tin đăng nhập hoặc phân quyền!"); }
});