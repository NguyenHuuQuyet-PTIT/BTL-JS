document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value; 
    const pass = document.getElementById('password').value; 
    const role = document.querySelector('input[name="role"]:checked').value;
    const users = getDB('Users'); const user = users.find(u => u.email === email && u.password === pass && u.role === role);
    if (user) { 
        localStorage.setItem('currentUser', JSON.stringify(user)); 
        if (role === 'admin') window.location.href = 'admin-dashboard.html';
        else if (role === 'teacher') window.location.href = 'teacher-dashboard.html';
        else window.location.href = 'student-dashboard.html';
    } else { alert("Sai thông tin đăng nhập hoặc phân quyền!"); }
});