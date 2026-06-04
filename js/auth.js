function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    const users = JSON.parse(localStorage.getItem('Users')) || [];
    let found = false;

    for (let i = 0; i < users.length; i++) {
        if (users[i].email === email && users[i].password === password && users[i].role === role) {
            localStorage.setItem('currentUser', JSON.stringify(users[i]));
            window.location.href = role === 'student' ? 'student-dashboard.html' : 'teacher-dashboard.html';
            found = true;
            break;
        }
    }
    if (!found) alert("Sai thông tin đăng nhập hoặc phân quyền!");
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const role = document.querySelector('input[name="reg-role"]:checked').value;

    if (pass !== confirm) { alert("Mật khẩu không khớp!"); return; }

    const users = JSON.parse(localStorage.getItem('Users')) || [];
    users.push({ id: Date.now().toString(), role, name, email, password: pass });
    localStorage.setItem('Users', JSON.stringify(users));
    
    alert("Đăng ký thành công!");
    window.location.href = 'index.html';
}

if(document.getElementById('loginForm')) document.getElementById('loginForm').addEventListener('submit', handleLogin);
if(document.getElementById('registerForm')) document.getElementById('registerForm').addEventListener('submit', handleRegister);