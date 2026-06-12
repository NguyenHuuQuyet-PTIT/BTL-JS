document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    let data = Object.fromEntries(new FormData(e.target));
    const user = getDB('Users').find(u => u.email === data.email && u.password === data.password && u.role === data.role);
    if (user) { 
        localStorage.setItem('currentUser', JSON.stringify(user)); 
        window.location.href = data.role === 'admin' ? 'admin-dashboard.html' : data.role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
    } else alert("Sai thông tin đăng nhập hoặc phân quyền!"); 
});