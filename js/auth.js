document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    const users = JSON.parse(localStorage.getItem('Users')) || [];
    let user = null;
    for(let i=0; i<users.length; i++) {
        if(users[i].email === email && users[i].password === pass && users[i].role === role) {
            user = users[i]; break;
        }
    }

    if (user) { 
        localStorage.setItem('currentUser', JSON.stringify(user)); 
        window.location.href = role === 'student' ? 'student-dashboard.html' : 'teacher-dashboard.html'; 
    } else {
        alert("Sai thông tin đăng nhập hoặc phân quyền!");
    }
});

document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const role = document.querySelector('input[name="reg-role"]:checked').value;

    if (pass !== confirm) { alert("Mật khẩu không khớp!"); return; }

    const users = JSON.parse(localStorage.getItem('Users')) || [];
    const newId = role === 'student' ? 'SV' + Date.now() : 'GV' + Date.now();
    users.push({ id: newId, role: role, name: name, email: email, password: pass });
    localStorage.setItem('Users', JSON.stringify(users));
    
    alert("Đăng ký thành công! Vui lòng đăng nhập."); 
    window.location.href = 'index.html';
});