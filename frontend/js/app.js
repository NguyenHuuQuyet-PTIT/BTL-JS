// Cấu hình URL cơ sở của backend (Tự động nhận diện chạy localhost hoặc online qua window.location.origin)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : (window.location.origin.startsWith('http') && !window.location.origin.includes('vercel.app'))
        ? window.location.origin
        : 'https://btl-js.onrender.com'; // Fallback kết nối đến server Render khi mở file HTML tĩnh trực tiếp hoặc Vercel

// Đường dẫn cơ sở kết nối đến cụm API xác thực của Backend Express
const DUONG_DAN_API = `${API_BASE}/api/auth`;

// Hàm băm mật khẩu đơn giản ở Client để tránh lưu trữ mật khẩu dưới dạng chữ rõ trong LocalStorage
function bamMatKhauClient(chuoi) {
    if (!chuoi) return '';
    let hash = 0;
    for (let i = 0; i < chuoi.length; i++) {
        const char = chuoi.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Chuyển đổi thành số nguyên 32-bit
    }
    return 'client_hash_' + Math.abs(hash).toString(16); // Trả về chuỗi băm dạng lục phân
}

// Hàm mã hóa đơn giản bằng cơ chế XOR và Base64 để bảo mật dữ liệu LocalStorage
const MA_HOA_KEY = 42; // Khóa mã hóa đối xứng cục bộ

function maHoaDuLieu(chuoi) {
    if (!chuoi) return '';
    let result = '';
    for (let i = 0; i < chuoi.length; i++) {
        result += String.fromCharCode(chuoi.charCodeAt(i) ^ MA_HOA_KEY);
    }
    return btoa(unescape(encodeURIComponent(result))); // Chuyển sang Base64 an toàn Unicode
}

function giaiMaDuLieu(base64Str) {
    if (!base64Str) return '';
    try {
        let decoded = decodeURIComponent(escape(atob(base64Str)));
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ MA_HOA_KEY);
        }
        return result;
    } catch (e) {
        return '';
    }
}

// Hàm lấy dữ liệu từ LocalStorage theo khóa tương ứng và giải mã bảo mật tự động
function layCSDL(khoa) {
    try {
        let rawVal = localStorage.getItem(khoa);
        if (!rawVal) {
            if (['currentUser', 'sessionToken', 'RegistrationOpen', 'DataVersion'].includes(khoa)) {
                return null;
            }
            return [];
        }
        
        let decrypted = giaiMaDuLieu(rawVal);
        if (decrypted) {
            try {
                return JSON.parse(decrypted);
            } catch (e) {
                // Nếu lỗi giải mã, thử parse trực tiếp rawVal phòng khi là dữ liệu cũ chưa mã hóa
                return JSON.parse(rawVal);
            }
        } else {
            return JSON.parse(rawVal);
        }
    } catch (e) {
        if (['currentUser', 'sessionToken', 'RegistrationOpen', 'DataVersion'].includes(khoa)) {
            return null;
        }
        return [];
    }
}

// Ghi đè phương thức fetch toàn cục của trình duyệt để tự động đính kèm Token xác thực bảo mật Bearer
const nguyenBanFetch = window.fetch; // Lưu lại hàm fetch nguyên bản của trình duyệt
window.fetch = function (resource, options = {}) {
    // Chỉ can thiệp nếu đường dẫn gọi đến API của hệ thống
    if (typeof resource === 'string' && resource.startsWith(API_BASE)) {
        // Lấy token bảo mật từ LocalStorage đã giải mã
        const token = layCSDL('sessionToken');
        if (token) {
            // Khởi tạo đối tượng headers nếu chưa tồn tại
            if (!options.headers) {
                options.headers = {};
            }
            // Đính kèm Token vào headers 'Authorization'
            options.headers['Authorization'] = 'Bearer ' + token;
        }
    }
    // Gọi lại hàm fetch nguyên bản của trình duyệt với cấu hình mới đã được đính kèm headers
    return nguyenBanFetch(resource, options);
};

// Ghi đè hàm alert mặc định của trình duyệt để hiển thị giao diện Canva Glassmorphism
// --------------------------------------------------------------------------
function hienThiAlertTuyBien(noiDung, tieuDe = "Thông báo", kieu = "info", callback = null) {
    // Tìm hoặc tạo phần tử overlay chứa hộp thoại nếu chưa có
    let overlay = document.getElementById('customAlertOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'customAlertOverlay';
        overlay.className = 'custom-alert-overlay';
        overlay.innerHTML = `
            <div class="custom-alert-box">
                <div id="customAlertIcon" class="custom-alert-icon"></div>
                <h3 id="customAlertTitle" class="custom-alert-title"></h3>
                <p id="customAlertText" class="custom-alert-text"></p>
                <button id="customAlertBtn" class="custom-alert-btn">Đồng ý</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Sự kiện khi bấm nút đóng/đồng ý
        document.getElementById('customAlertBtn').addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (typeof overlay.datasetCallback === 'function') {
                    overlay.datasetCallback();
                }
            }, 300);
        });
    }

    // Thiết lập biểu tượng (icon) và màu sắc tương ứng
    let iconEl = document.getElementById('customAlertIcon');
    iconEl.className = 'custom-alert-icon ' + kieu;
    if (kieu === 'success') {
        iconEl.innerHTML = '✓';
    } else if (kieu === 'error') {
        iconEl.innerHTML = '✕';
    } else {
        iconEl.innerHTML = 'i';
    }

    // Cập nhật nội dung tiêu đề và văn bản thông báo
    document.getElementById('customAlertTitle').textContent = tieuDe;
    document.getElementById('customAlertText').innerHTML = noiDung.replace(/\n/g, '<br>');
    
    // Lưu hàm callback hành động tiếp theo
    overlay.datasetCallback = callback;

    // Kích hoạt hiển thị với chuyển động CSS
    overlay.classList.add('show');
}

// Ghi đè hàm alert mặc định của trình duyệt toàn hệ thống
window.alert = function(message, callback) {
    let kieu = 'info';
    let tieuDe = 'Thông báo';
    
    let msgLower = message.toLowerCase();
    if (msgLower.includes('thành công') || msgLower.includes('chúc mừng')) {
        kieu = 'success';
        tieuDe = 'Thành công';
    } else if (msgLower.includes('lỗi') || msgLower.includes('thất bại') || msgLower.includes('sai') || msgLower.includes('không hợp lệ') || msgLower.includes('không tồn tại')) {
        kieu = 'error';
        tieuDe = 'Lỗi hệ thống';
    }
    
    hienThiAlertTuyBien(message, tieuDe, kieu, callback);
};

// Hộp thoại xác nhận tùy chỉnh (thay thế confirm() mặc định)
function hienThiConfirmTuyBien(noiDung, hamDongY) {
    let overlay = document.getElementById('customConfirmOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'customConfirmOverlay';
        overlay.className = 'custom-alert-overlay';
        overlay.innerHTML = `
            <div class="custom-alert-box">
                <div class="custom-alert-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; font-size: 28px; font-weight: bold;">?</div>
                <h3 class="custom-alert-title">Xác nhận thao tác</h3>
                <p id="customConfirmText" class="custom-alert-text"></p>
                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 18px;">
                    <button id="customConfirmBtnYes" class="custom-alert-btn" style="flex: 1; max-width: 160px;">Đồng ý</button>
                    <button id="customConfirmBtnNo" class="custom-alert-btn" style="flex: 1; max-width: 160px; background: linear-gradient(135deg, #94a3b8, #64748b);">Hủy bỏ</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    document.getElementById('customConfirmText').innerHTML = noiDung.replace(/\n/g, '<br>');
    overlay.classList.add('show');

    document.getElementById('customConfirmBtnYes').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => { if (hamDongY) hamDongY(); }, 300);
    };
    document.getElementById('customConfirmBtnNo').onclick = () => {
        overlay.classList.remove('show');
    };
}

// Đóng modal/alert khi click ra ngoài (backdrop overlay)
window.addEventListener('click', function(e) {
    // Click vào vùng nền mờ của modal thông thường
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none'; // Ẩn modal
        
        // Reset src iframe để tránh chạy ngầm
        let iframe = e.target.querySelector('iframe');
        if (iframe) iframe.src = '';
        
        // Dừng video/audio nếu có
        let video = e.target.querySelector('video');
        if (video) video.pause();
        let audio = e.target.querySelector('audio');
        if (audio) audio.pause();
    }
    
    // Click ra ngoài custom alert/confirm
    if (e.target.classList.contains('custom-alert-overlay')) {
        e.target.classList.remove('show'); // Ẩn overlay
        
        // Chạy callback nếu có
        if (e.target.id === 'customAlertOverlay' && typeof e.target.datasetCallback === 'function') {
            let callback = e.target.datasetCallback;
            e.target.datasetCallback = null; // Xóa callback tránh chạy lại
            setTimeout(() => { callback(); }, 300);
        }
    }
});

// --------------------------------------------------------------------------
// 1. CƠ SỞ DỮ LIỆU LOCALSTORAGE & TRUY XUẤT (DATABASE & HELPERS)
// --------------------------------------------------------------------------

// Hàm lấy dữ liệu từ LocalStorage (Đã được định nghĩa bảo mật ở đầu trang)

// Hàm chuyển đổi các ký tự đặc biệt sang thực thể HTML để phòng chống lỗ hổng bảo mật XSS
function escapeHTML(chuoi) {
    if (!chuoi) return '';
    return chuoi.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Hàm sắp xếp danh sách thông báo theo thứ tự mới nhất (dựa trên mã số ID hoặc thời gian ngày gửi)
function sapXepThongBaoMoiNhat(danhSach) {
    if (!Array.isArray(danhSach)) return [];
    return danhSach.sort((a, b) => {
        let getVal = x => {
            let match = x.id ? x.id.match(/\d+/) : null;
            return match ? parseInt(match[0]) : 0;
        };
        let valA = getVal(a);
        let valB = getVal(b);
        if (valA !== valB) return valB - valA;
        return new Date(b.date) - new Date(a.date);
    });
}

// Hàm ghi mảng dữ liệu vào LocalStorage dưới dạng chuỗi JSON mã hóa bảo mật, có xử lý khi bộ nhớ đầy
function ghiCSDL(khoa, duLieu) {
    try {
        let jsonStr = JSON.stringify(duLieu);
        let encrypted = maHoaDuLieu(jsonStr);
        localStorage.setItem(khoa, encrypted);
    } catch (e) {
        // Khi xảy ra lỗi vượt quá dung lượng LocalStorage (tối đa 5MB)
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn("LocalStorage bị đầy. Đang tự động dọn dẹp các tệp tin base64 cũ...");
            
            // Dọn dẹp cả bản sao dữ liệu mới chuẩn bị lưu (để thu nhỏ kích thước của chính nó)
            if (Array.isArray(duLieu)) {
                duLieu.forEach(item => {
                    if (item.link && item.link.startsWith('data:')) {
                        item.link = ''; 
                        if (item.fileName && !item.fileName.includes('đầy bộ nhớ')) {
                            item.fileName = item.fileName + ' (Tệp đã bị xóa khỏi cache do đầy bộ nhớ)';
                        }
                    }
                });
            }

            // Xóa dữ liệu base64 trong danh mục tài liệu để giải phóng bộ nhớ
            let materials = layCSDL('Materials');
            if (materials && materials.length > 0) {
                materials.forEach(m => {
                    if (m.link && m.link.startsWith('data:')) {
                        m.link = ''; // Bỏ lưu tệp base64
                        m.fileName = m.fileName + ' (Tệp đã bị xóa khỏi cache do đầy bộ nhớ)';
                    }
                });
                localStorage.setItem('Materials', maHoaDuLieu(JSON.stringify(materials)));
            }

            // Xóa dữ liệu base64 trong các bài nộp của học sinh để lấy lại dung lượng trống
            let submissions = layCSDL('Submissions');
            if (submissions && submissions.length > 0) {
                submissions.forEach(s => {
                    if (s.link && s.link.startsWith('data:')) {
                        s.link = ''; // Bỏ lưu tệp base64
                        s.fileName = s.fileName + ' (Tệp đã bị xóa khỏi cache do đầy bộ nhớ)';
                    }
                });
                localStorage.setItem('Submissions', maHoaDuLieu(JSON.stringify(submissions)));
            }

            // Thử thực hiện lưu lại dữ liệu mới sau khi đã dọn dẹp
            try {
                let jsonStr = JSON.stringify(duLieu);
                let encrypted = maHoaDuLieu(jsonStr);
                localStorage.setItem(khoa, encrypted);
            } catch (retryError) {
                console.error("Không thể dọn dẹp đủ dung lượng cho LocalStorage:", retryError);
            }
        } else {
            throw e;
        }
    }
}

// Hàm tìm và cập nhật thông tin lớp học cụ thể trong cơ sở dữ liệu offline & online
function capNhatLopCSDL(maLop, hamCapNhat) {
    // Lấy danh sách lớp học từ LocalStorage
    let danhSachLop = layCSDL('Classes');
    // Tìm lớp học cần cập nhật
    let lopCanTim = danhSachLop.find(l => l.id === maLop);
    if (lopCanTim) { 
        hamCapNhat(lopCanTim, danhSachLop); 
        // Đánh dấu là chưa đồng bộ lên server để đề phòng mất kết nối
        lopCanTim.isUnsynced = true;
        ghiCSDL('Classes', danhSachLop); 
        
        // Đồng bộ dữ liệu lớp học trực tiếp lên MongoDB Atlas
        fetch(`${API_BASE}/api/lop-hoc/${maLop}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lopCanTim)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Đã đồng bộ thành công, xóa cờ isUnsynced khỏi CSDL Local
                let freshLop = layCSDL('Classes');
                let targetLop = freshLop.find(l => l.id === maLop);
                if (targetLop && targetLop.isUnsynced) {
                    delete targetLop.isUnsynced;
                    ghiCSDL('Classes', freshLop);
                }
            }
        })
        .catch(err => {
            console.warn("Lỗi đồng bộ lớp học lên server (đã lưu ngoại tuyến):", err);
        });
    }
}

// Bản đồ ánh xạ giờ học tương ứng với các tiết học cụ thể trong ngày
const GIO_TIET_HOC = { 
    1: "07:00-07:50", 2: "08:00-08:50", 3: "09:00-09:50", 4: "10:00-10:50", 
    5: "11:00-11:50", 6: "12:00-12:50", 7: "13:00-13:50", 8: "14:00-14:50", 
    9: "15:00-15:50", 10: "16:00-16:50", 11: "17:00-17:50", 12: "18:00-18:50" 
};

// Hàm tạo chuỗi hiển thị khoảng thời gian học dựa vào tiết bắt đầu và kết thúc
function layThongTinTietHoc(tietBatDau, tietKetThuc) {
    // Tách giờ bắt đầu từ bản đồ ánh xạ tiết học
    let gioBatDau = GIO_TIET_HOC[tietBatDau].split("-")[0];
    // Tách giờ kết thúc từ bản đồ ánh xạ tiết học
    let gioKetThuc = GIO_TIET_HOC[tietKetThuc].split("-")[1];
    // Trả về chuỗi định dạng đầy đủ thông tin tiết và khoảng giờ cụ thể
    return `Tiết ${tietBatDau}-${tietKetThuc} (${gioBatDau} - ${gioKetThuc})`;
}

// Hàm tạo tên hiển thị của lớp học dựa trên môn học và thứ tự lớp
function layTenLopHienThi(maLop) {
    // Lấy danh sách lớp từ cơ sở dữ liệu
    let danhSachLop = layCSDL('Classes');
    // Lấy danh sách môn học từ cơ sở dữ liệu
    let danhSachMon = layCSDL('Subjects');
    // Tìm lớp học ứng với mã lớp truyền vào
    let lop = danhSachLop.find(l => l.id === maLop);
    // Nếu không tìm thấy lớp thì trả về luôn mã lớp thô ban đầu
    if (!lop) return maLop;
    
    // Tìm môn học tương ứng của lớp để lấy tên viết tắt
    let mon = danhSachMon.find(s => s.id === lop.subjectId);
    // Đặt tên viết tắt là tên môn học hoặc 'CLASS' mặc định
    let vietTat = mon ? mon.abbr : 'CLASS';
    // Lọc ra tất cả các lớp có cùng môn học để đánh số thứ tự lớp học
    let danhSachLopCungMon = danhSachLop.filter(l => l.subjectId === lop.subjectId);
    // Tìm vị trí tương đối của lớp hiện tại trong danh sách lớp cùng môn
    let viTri = danhSachLopCungMon.findIndex(l => l.id === maLop);
    
    // Trả về chuỗi kết hợp viết tắt và số thứ tự lớp (Ví dụ: WEB_L1)
    return vietTat + '_L' + (viTri + 1);
}

// Hàm tính toán điểm số tổng kết môn học theo hệ số 20% - 30% - 50%
function tinhDiemTrungBinh(diemChuyenCan, diemGiuaKy, diemCuoiKy) {
    // Trả về rỗng nếu một trong ba đầu điểm chưa được nhập
    if (diemChuyenCan === null || diemChuyenCan === "" || 
        diemGiuaKy === null || diemGiuaKy === "" || 
        diemCuoiKy === null || diemCuoiKy === "") {
        return null;
    }
    // Thực hiện tính điểm trung bình và làm tròn đến một chữ số thập phân
    return parseFloat((parseFloat(diemChuyenCan) * 0.2 + parseFloat(diemGiuaKy) * 0.3 + parseFloat(diemCuoiKy) * 0.5).toFixed(1));
}

// Hàm tạo mã màu và nhãn xếp loại học lực dựa trên thang điểm 10
function layHtmlXepLoai(diemSo) {
    // Trả về ký hiệu mặc định nếu chưa có điểm tổng kết
    if (diemSo === null) return '<span class="text-muted">--</span>';
    // Đạt từ 9.0 trở lên xếp loại Xuất sắc (Màu tím)
    if (diemSo >= 9.0) return '<span style="color: #9C27B0; font-weight: bold;">Xuất sắc</span>';
    // Đạt từ 8.0 trở lên xếp loại Giỏi (Màu xanh dương)
    if (diemSo >= 8.0) return '<span class="text-primary font-bold">Giỏi</span>';
    // Đạt từ 6.5 trở lên xếp loại Khá (Màu xanh lá)
    if (diemSo >= 6.5) return '<span class="text-success font-bold">Khá</span>';
    // Đạt từ 5.0 trở lên xếp loại Trung bình (Màu cam)
    if (diemSo >= 5.0) return '<span class="text-warning font-bold">Trung bình</span>';
    // Dưới 5.0 xếp loại Yếu (Màu đỏ)
    return '<span class="text-danger font-bold">Yếu</span>';
}

// Hàm tạo nhãn hiển thị trạng thái điểm danh với màu sắc tương ứng
function layHtmlDiemDanh(trangThai) {
    // Có mặt: nhãn màu xanh lá
    if (trangThai === 'present') return '<span class="text-success font-bold">Có mặt</span>';
    // Đi muộn: nhãn màu vàng cam
    if (trangThai === 'late') return '<span class="text-warning font-bold">Đi muộn</span>';
    // Vắng mặt: nhãn màu đỏ
    if (trangThai === 'absent') return '<span class="text-danger font-bold">Vắng mặt</span>';
    // Trạng thái mặc định nếu buổi học chưa được điểm danh
    return '<span class="text-muted">Chưa điểm danh</span>';
}

// Hàm hỗ trợ tải file đính kèm lưu dưới dạng chuỗi Base64 Data URL (dùng cho nộp bài thầy xem)
function taiFileDinhKem(base64Data, fileName) {
    try {
        // Tạo một phần tử thẻ a liên kết ảo để kích hoạt chức năng download của trình duyệt
        const linkTai = document.createElement("a");
        linkTai.href = base64Data;
        linkTai.download = fileName;
        document.body.appendChild(linkTai);
        linkTai.click();
        document.body.removeChild(linkTai);
} catch (e) {
        alert("Lỗi khi tải file đính kèm: " + e.message);
    }
}

// Hàm tự động hiển thị file inline trực tiếp trên trang mà không cần click xem trực tiếp hay tự động tải về
function hienThiXemFileInline(base64Data, fileName, containerElement) {
    if (!containerElement) return;
    containerElement.innerHTML = `<div class="text-center" style="padding: 15px; color: var(--text-muted);"><span style="display: inline-block; animation: spin 1s linear infinite; margin-right: 8px;">⏳</span>Đang tải dữ liệu xem trước...</div>`;

    try {
        // Tách lấy đuôi mở rộng của tệp tin để phân loại định dạng
        let ext = fileName.split('.').pop().toLowerCase();
        
        // Xác định kiểu mime-type tương ứng với tệp tin
        let mimeType = 'application/octet-stream';
        if (base64Data.startsWith('data:')) {
            mimeType = base64Data.split(';')[0].split(':')[1];
        } else {
            const mimeMap = {
                'pdf':  'application/pdf',
                'png':  'image/png',
                'jpg':  'image/jpeg',
                'jpeg': 'image/jpeg',
                'gif':  'image/gif',
                'webp': 'image/webp',
                'bmp':  'image/bmp',
                'txt':  'text/plain',
                'html': 'text/html',
                'mp4':  'video/mp4',
                'mp3':  'audio/mpeg'
            };
            mimeType = mimeMap[ext] || 'application/octet-stream';
        }

        // Thực hiện giải mã chuỗi Base64 Data URL thành Blob nhị phân cục bộ
        let base64Part = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        let byteChars = atob(base64Part);
        let byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        let byteArray = new Uint8Array(byteNumbers);
        let blob = new Blob([byteArray], { type: mimeType });
        let blobUrl = URL.createObjectURL(blob);

        // Xử lý hiển thị trực tiếp theo từng định dạng tài liệu
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext) || mimeType.startsWith('image/')) {
            // Hiển thị tệp ảnh trực quan kèm theo bóng mờ nhẹ của hệ thống
            containerElement.innerHTML = `<img src="${blobUrl}" style="max-width: 100%; max-height: 480px; border-radius: 8px; box-shadow: var(--shadow-sm); display: block; margin: 10px auto;">`;
        } else if (ext === 'pdf' || mimeType === 'application/pdf') {
            // Nhúng trực tiếp tài liệu PDF thông qua thẻ iframe an toàn
            containerElement.innerHTML = `<iframe src="${blobUrl}" style="width: 100%; height: 500px; border: 1px solid var(--border-color); border-radius: 8px;"></iframe>`;
        } else if (['mp4', 'webm', 'ogg'].includes(ext) || mimeType.startsWith('video/')) {
            // Nhúng trình phát video HTML5 cho phép giáo viên/học viên xem bài giảng đa phương tiện
            containerElement.innerHTML = `<video src="${blobUrl}" controls style="max-width: 100%; max-height: 400px; border-radius: 8px; display: block; margin: 10px auto;"></video>`;
        } else if (['mp3', 'wav', 'ogg'].includes(ext) || mimeType.startsWith('audio/')) {
            // Nhúng trình phát nhạc audio HTML5
            containerElement.innerHTML = `<audio src="${blobUrl}" controls style="width: 100%; max-width: 400px; display: block; margin: 10px auto;"></audio>`;
        } else if (ext === 'txt' || mimeType === 'text/plain') {
            // Sử dụng textContent khi render file văn bản thuần để chống lỗi bảo mật XSS
            let reader = new FileReader();
            reader.onload = function(e) {
                containerElement.innerHTML = '';
                let pre = document.createElement('pre');
                pre.style.cssText = "width: 100%; max-height: 400px; overflow-y: auto; background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; word-break: break-all; text-align: left; margin-top: 10px; line-height: 1.5;";
                pre.textContent = e.target.result;
                containerElement.appendChild(pre);
            };
            reader.readAsText(blob);
        } else if (['doc', 'docx'].includes(ext)) {
            // Hỗ trợ hiển thị tệp Word (.docx) thông qua thư viện mammoth.js tải động từ CDN
            if (window.mammoth) {
                let arrayBufferReader = new FileReader();
                arrayBufferReader.onload = function(e) {
                    let arrayBuffer = e.target.result;
                    window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                        .then(function(result) {
                            containerElement.innerHTML = `
                                <div style="width: 100%; max-height: 500px; overflow-y: auto; background: white; border: 1px solid var(--border-color); padding: 20px; border-radius: 8px; text-align: left; margin-top: 10px; box-shadow: var(--shadow-sm); line-height: 1.6;">
                                    ${result.value || '<p class="text-muted">Tài liệu không có nội dung chữ.</p>'}
                                </div>
                            `;
                        })
                        .catch(function(err) {
                            containerElement.innerHTML = `<p class="text-danger" style="margin-top: 10px;">⚠️ Lỗi hiển thị file Word: ${err.message}</p>`;
                        });
                };
                arrayBufferReader.readAsArrayBuffer(blob);
            } else {
                // Nếu thư viện chưa tải xong, tiến hành chèn thẻ script tải mammoth từ CDN
                containerElement.innerHTML = `<div class="text-center" style="padding: 10px; color: var(--text-muted);">⏳ Đang tải thư viện đọc file Word...</div>`;
                let script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
                script.onload = function() {
                    hienThiXemFileInline(base64Data, fileName, containerElement);
                };
                script.onerror = function() {
                    containerElement.innerHTML = `<p class="text-danger" style="margin-top: 10px;">⚠️ Không thể tải thư viện Word từ CDN. Vui lòng tải file về máy để xem.</p>`;
                };
                document.head.appendChild(script);
            }
        } else {
            // Đối với các định dạng nén như zip, rar, excel hoặc định dạng lạ, hiển thị cảnh báo yêu cầu tải về
            let safeLink = base64Data.replace(/'/g, "\\'");
            let safeName = fileName.replace(/'/g, "\\'");
            containerElement.innerHTML = `
                <div style="text-align: center; padding: 15px; background: #fafafa; border-radius: 8px; border: 1px dashed var(--border-color); margin-top: 10px;">
                    <span style="font-size: 40px;">📎</span>
                    <p class="font-bold text-primary mt-10" style="font-size: 14px; word-break: break-all;">${fileName}</p>
                    <p class="text-sm text-muted mb-10">Định dạng này (.${ext}) không hỗ trợ xem trực tiếp trên trình duyệt.</p>
                    <button onclick="taiFileDinhKem('${safeLink}', '${safeName}')" class="btn-primary" style="width: auto; padding: 8px 20px; font-size: 13px;">
                        ⬇️ Tải xuống file
                    </button>
                </div>
            `;
        }
    } catch (e) {
        containerElement.innerHTML = `<p class="text-danger" style="margin-top: 10px;">⚠️ Lỗi khi kết xuất xem file: ${e.message}</p>`;
    }
}

// Hàm tạo động modal xem file trực tiếp trên trang nếu chưa tồn tại
function taoModalXemFileTrucTiep() {
    let modal = document.getElementById('globalFilePreviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'globalFilePreviewModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 850px; border-top: 4px solid var(--primary); max-height: 90vh; overflow-y: auto;">
                <span class="close-modal" onclick="dongHopThoai('globalFilePreviewModal')">&times;</span>
                <h2 id="previewFileTitle" class="text-primary mb-20" style="font-size: 20px; word-break: break-all;">Xem file trực tiếp</h2>
                <div id="previewFileBody" style="display: flex; justify-content: center; align-items: center; min-height: 200px; flex-direction: column; gap: 15px;">
                    <!-- Nội dung xem thử tệp sẽ được chèn động qua JS -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').onclick = function() {
            dongHopThoai('globalFilePreviewModal');
        };
    }
}

// Hàm mở file đính kèm xem trực tiếp ngay trên trang (bằng Modal trong ứng dụng, dùng làm phương án dự phòng)
function xemFileTrucTiep(base64Data, fileName) {
    try {
        // Khởi tạo modal xem thử tệp nếu chưa có trong HTML
        taoModalXemFileTrucTiep();
        
        // Thiết lập tiêu đề cho hộp thoại xem thử tệp
        document.getElementById('previewFileTitle').textContent = `👁️ Xem tệp: ${fileName}`;
        let body = document.getElementById('previewFileBody');
        
        // Gọi hàm hiển thị inline chung để chèn nội dung xem thử vào body của modal
        hienThiXemFileInline(base64Data, fileName, body);
        
        // Mở modal hiển thị xem file
        moHopThoai('globalFilePreviewModal');
    } catch (e) {
        alert("Lỗi khi xem file trực tiếp: " + e.message);
    }
}

// Hàm thực hiện đăng xuất tài khoản khỏi hệ thống
function xuLyDangXuat() {
    // Chỉ xóa sạch phiên đăng nhập hiện tại để tránh rò rỉ thông tin cá nhân
    localStorage.removeItem('currentUser'); 
    localStorage.removeItem('sessionToken'); 
    // Chuyển hướng trình duyệt về lại trang đăng nhập index.html
    window.location.href = 'index.html'; 
}

// Hàm hiển thị hộp thoại modal theo ID phần tử
function moHopThoai(idModal) { 
    // Tìm phần tử HTML của hộp thoại modal
    let el = document.getElementById(idModal);
    // Chuyển thuộc tính hiển thị sang flex để kích hoạt flexbox centering
    if (el) el.style.display = 'flex'; 
}

// Hàm tạo và hiển thị hộp thoại modal Ủng hộ dự án với mã QR tài trợ động (Xác thực hiển thị trên tất cả các trang)
function hienThiModalUngHo() {
    // Tìm kiếm phần tử modal Ủng hộ dự án bằng ID trong cây DOM
    let modal = document.getElementById('donationModal');
    // Nếu phần tử modal chưa tồn tại trong trang, tiến hành khởi tạo động cấu trúc HTML của nó
    if (!modal) {
        // Tạo một thẻ div mới đại diện cho khung chứa modal
        modal = document.createElement('div');
        // Thiết lập ID định danh cho modal
        modal.id = 'donationModal';
        // Gán class CSS chung cho modal để đồng bộ phong cách hiển thị
        modal.className = 'modal';
        // Mặc định ẩn modal khỏi giao diện khi chưa click
        modal.style.display = 'none';
        // Điền mã HTML cấu trúc giao diện mờ kính (glassmorphism) cho hộp thoại
        modal.innerHTML = `
            <div class="modal-content glass-card" style="max-width: 420px; text-align: center; padding: 30px 24px; border-radius: var(--border-radius-lg); position: relative; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: var(--shadow-lg);">
                <!-- Nút đóng modal góc phải -->
                <span class="close-modal" onclick="dongHopThoai('donationModal')" style="position: absolute; right: 20px; top: 15px; font-size: 24px; cursor: pointer; color: var(--text-muted); transition: var(--transition);">&times;</span>
                <!-- Tiêu đề nổi bật thu hút sự chú ý -->
                <h3 class="font-bold text-xl text-primary mb-10" style="margin-top: 10px;">💖 ỦNG HỘ DỰ ÁN 💖</h3>
                <!-- Lời nhắn chân thành gửi đến người dùng -->
                <p class="text-sm text-muted mb-20" style="font-size: 13px; line-height: 1.5;">Nếu bạn yêu thích sản phẩm của tôi, hãy quét mã QR này để gửi một chút đóng góp nhỏ giúp tôi có động lực duy trì và phát triển thêm nhiều chức năng thú vị hơn nữa nhé!</p>
                <!-- Khung chứa ảnh mã QR có đổ bóng mờ ảo bắt mắt -->
                <div style="background: #ffffff; padding: 16px; border-radius: var(--border-radius); display: inline-block; box-shadow: var(--shadow); margin-bottom: 20px; border: 1px solid rgba(139, 61, 255, 0.08);">
                    <!-- Ảnh mã QR thanh toán ngân hàng MB Bank tự động kết nối qua dịch vụ VietQR -->
                    <img src="https://img.vietqr.io/image/mbbank-0989287807-qr_only.png?accountName=NGUYEN%20HUU%20QUYET&addInfo=Ung%20ho%20du%20an%20Edu%20Report" alt="Mã QR Ủng Hộ" style="width: 220px; height: 220px; display: block; border-radius: 8px;">
                </div>
                <!-- Dòng chữ chú thích phụ -->
                <div class="font-bold text-primary" style="font-size: 15px; margin-bottom: 4px;">MÃ QR THANH TOÁN TÀI TRỢ</div>
                <div class="text-sm text-muted" style="font-size: 12px;">Nguyễn Hữu Quyết - Lớp Công nghệ Thông tin</div>
            </div>
        `;
        // Thêm phần tử modal vừa tạo vào cuối thẻ body của tài liệu HTML hiện tại
        document.body.appendChild(modal);

        // Đăng ký sự kiện đóng hộp thoại khi người dùng nhấn chuột ra ngoài vùng thẻ card trắng (nhấn vào vùng tối mờ nền)
        modal.addEventListener('click', function(e) {
            // Kiểm tra xem vị trí nhấp chuột có đúng là phần nền mờ hay không
            if (e.target === modal) {
                // Gọi hàm đóng hộp thoại để ẩn modal đi
                dongHopThoai('donationModal');
            }
        });
    }
    // Chuyển thuộc tính hiển thị sang flex để căn giữa modal lồng trên trang web
    modal.style.display = 'flex';
}

// Hàm ẩn hộp thoại modal theo ID phần tử
function dongHopThoai(idModal) { 
    // Tìm phần tử HTML của hộp thoại modal
    let el = document.getElementById(idModal);
    // Chuyển thuộc tính hiển thị sang none để ẩn đi
    if (el) {
        el.style.display = 'none'; 
        // Dừng các media đang phát (video, audio) và dừng tải iframe
        el.querySelectorAll('video, audio').forEach(media => media.pause());
        el.querySelectorAll('iframe').forEach(iframe => iframe.src = '');
        
        // Dọn dẹp tệp xem thử khi đóng modal xem thông báo
        if (idModal === 'readNotifModal') {
            let fileSection = document.getElementById('readNotifFileSection');
            if (fileSection) fileSection.innerHTML = '';
        }
    }
}

// --------------------------------------------------------------------------
// 2. KHỞI TẠO GIAO DIỆN CHUNG & PROFILE CÁ NHÂN (UI INITIALIZATION)
// --------------------------------------------------------------------------

// Hàm đăng ký các sự kiện cơ bản cho giao diện chung của Dashboard
function khoiTaoGiaoDienChung() {
    // Đăng ký sự kiện click cho nút đóng modal (dấu nhân hoặc nút hủy)
    document.querySelectorAll('.close-modal').forEach(nut => {
        nut.addEventListener('click', function() { 
            // Ẩn hộp thoại modal chứa nút đó và thực hiện dọn dẹp
            let modal = this.closest('.modal');
            if (modal) {
                dongHopThoai(modal.id);
            }
        });
    });

    // Tự động đóng modal khi nhấp chuột ra ngoài vùng nội dung trắng (vùng nền mờ)
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            dongHopThoai(e.target.id);
        }
    });

    // Xử lý chuyển đổi qua lại giữa các tab chính trên thanh menu sidebar
    document.querySelectorAll('.menu-item').forEach(nutMenu => {
        nutMenu.addEventListener('click', function(e) {
            e.preventDefault(); 
            // Gỡ bỏ class hoạt động (active) ở tất cả các tab menu khác
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            // Thêm class hoạt động cho tab menu vừa bấm
            this.classList.add('active');
            
            // Ẩn toàn bộ các phân vùng nội dung tab trên màn hình
            document.querySelectorAll('.tab-section').forEach(tab => tab.style.display = 'none');
            // Tìm và hiển thị phân vùng nội dung ứng với tab menu vừa chọn
            let targetId = this.getAttribute('data-target');
            let mucTieu = document.getElementById(targetId);
            if (mucTieu) mucTieu.style.display = 'block';

            // Vẽ lại danh sách thông báo tức thời khi click tab để tránh chờ đồng bộ
            let user = layCSDL('currentUser');
            if (user) {
                if (targetId === 'student-notifs' && typeof hienThiThongBaoSinhVien === 'function') {
                    hienThiThongBaoSinhVien(user);
                } else if (targetId === 'teacher-notifs') {
                    if (typeof hienThiHopThuDenGiangVien === 'function') hienThiHopThuDenGiangVien(user);
                    if (typeof hienThiLichSuGuiGiangVien === 'function') hienThiLichSuGuiGiangVien(user);
                }
            }
        });
    });

    // Xử lý chuyển đổi qua lại các sub-tab (phân mục con nằm trong tab chính)
    document.querySelectorAll('.sub-btn').forEach(nutSub => {
        nutSub.addEventListener('click', function() {
            // Tìm menu cha chứa nhóm nút sub-tab hiện tại
            let menuCha = this.closest('.sub-menu');
            // Gỡ bỏ class hoạt động của toàn bộ các nút con cùng cấp
            menuCha.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
            // Đặt trạng thái hoạt động cho nút vừa chọn
            this.classList.add('active');

            // Tìm phân vùng cha chứa toàn bộ nội dung của các sub-tab (hỗ trợ phân cấp phức tạp ở Admin)
            let vungChua = menuCha.closest('.tab-section') || menuCha.parentElement;
            // Ẩn toàn bộ nội dung của các sub-tab con
            vungChua.querySelectorAll('.sub-tab-content').forEach(tab => tab.style.display = 'none');
            
            // Tìm và hiển thị nội dung của sub-tab được kích hoạt
            let mucTieu = document.getElementById(this.getAttribute('data-target'));
            if (mucTieu) mucTieu.style.display = 'block';
        });
    });
}

// Hàm điền và xử lý form thông tin hồ sơ cá nhân người dùng
function khoiTaoHoSoCaNhan(nguoiDung) {
    // Tìm phân vùng hiển thị thông tin hồ sơ cá nhân
    let vungChua = document.getElementById('profile-tab');
    // Bỏ qua nếu trang hiện tại không có tab thông tin cá nhân
    if (!vungChua) return;

    // Tìm các phần tử hiển thị mã số, ngày sinh và số điện thoại
    let idEl = document.getElementById('profId');
    let dobEl = document.getElementById('profDob');
    let phoneEl = document.getElementById('profPhone');

    // Cập nhật thông tin mã định danh của tài khoản
    if (idEl) idEl.textContent = nguoiDung.id; 
    // Cập nhật ngày sinh (định dạng DD/MM/YYYY)
    if (dobEl) dobEl.textContent = nguoiDung.dob ? nguoiDung.dob.split('-').reverse().join('/') : 'Chưa cập nhật';
    // Cập nhật số điện thoại
    if (phoneEl) phoneEl.textContent = nguoiDung.phone || 'Chưa cập nhật';
    
    // Lấy container và form nhập sửa đổi thông tin
    let hopThoaiSua = document.getElementById('editProfileFormContainer');
    let formSua = document.getElementById('editProfileForm');

    // Đăng ký sự kiện mở form cập nhật thông tin cá nhân
    let btnShow = document.getElementById('btnShowEditProfile');
    if (btnShow) {
        btnShow.addEventListener('click', () => { 
            // Đổ dữ liệu hiện tại vào các ô input trong form
            formSua.elements['phone'].value = nguoiDung.phone || ''; 
            formSua.elements['dob'].value = nguoiDung.dob || ''; 
            hopThoaiSua.style.display = 'block'; 
        });
    }
    
    // Sự kiện hủy bỏ cập nhật thông tin cá nhân
    let btnCancel = document.getElementById('btnCancelEditProfile');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => { 
            hopThoaiSua.style.display = 'none'; 
        });
    }

    // Sự kiện lưu thông tin chỉnh sửa hồ sơ cá nhân
    if (formSua) {
        formSua.addEventListener('submit', function(e) {
            e.preventDefault(); 
            // Lấy giá trị mật khẩu mới
            let matKhauMoi = formSua.elements['password'].value.trim();
            
            // Cập nhật số điện thoại và ngày sinh (Tuyệt đối không lưu mật khẩu ở dạng rõ vào LocalStorage)
            nguoiDung.phone = formSua.elements['phone'].value.trim();
            nguoiDung.dob = formSua.elements['dob'].value;
            if (matKhauMoi !== '') {
                nguoiDung.passwordHash = bamMatKhauClient(matKhauMoi); // Cập nhật mật khẩu băm mới ngoại tuyến
            }
            
            // Ghi nhận thông tin người dùng đăng nhập mới vào phiên hiện tại
            ghiCSDL('currentUser', nguoiDung); 
            
            // Đồng bộ cập nhật thông tin vào danh sách Users trong LocalStorage (Đảm bảo không chứa mật khẩu)
            let danhSachNguoiDung = layCSDL('Users');
            let viTri = danhSachNguoiDung.findIndex(u => u.id === nguoiDung.id); 
            if (viTri > -1) {
                const updatedUser = { ...nguoiDung };
                delete updatedUser.password; // Xóa mật khẩu khỏi cache cục bộ
                danhSachNguoiDung[viTri] = updatedUser; 
                ghiCSDL('Users', danhSachNguoiDung);
            }

            // Đồng bộ thông tin hồ sơ đã cập nhật lên MongoDB Atlas
            let duLieuGui = {
                phone: nguoiDung.phone,
                dob: nguoiDung.dob
            };
            if (matKhauMoi !== '') {
                duLieuGui.password = matKhauMoi;
            }
            fetch(`${API_BASE}/api/nguoi-dung/${nguoiDung.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(duLieuGui)
            }).catch(err => console.warn("Lỗi đồng bộ hồ sơ cá nhân lên máy chủ:", err));
            
            // Thông báo cập nhật thành công và hiển thị lại dữ liệu mới lên giao diện
            alert("Cập nhật thông tin cá nhân thành công!"); 
            if (dobEl) dobEl.textContent = nguoiDung.dob.split('-').reverse().join('/');
            if (phoneEl) phoneEl.textContent = nguoiDung.phone;
            hopThoaiSua.style.display = 'none';
            formSua.reset();
        });
    }
}

// --------------------------------------------------------------------------
// 3. XỬ LÝ HỘP THƯ THÔNG BÁO CHUNG (COMMON NOTIFICATION SYSTEM)
// --------------------------------------------------------------------------

// Hàm định dạng hiển thị thông báo, tự động tìm và chuyển đổi link web thành thẻ HTML a clickable
function dinhDangThongBao(noiDung) {
    // Sử dụng hàm escapeHTML dùng chung để tránh lỗ hổng bảo mật XSS
    let vanBanAnToan = escapeHTML(noiDung);

    // Thay thế ký tự xuống dòng bằng thẻ breakline HTML
    let vanBan = vanBanAnToan.replace(/\n/g, '<br>');
    // Regex tìm đường dẫn liên kết http/https trong nội dung
    let regexLink = /(https?:\/\/[^\s]+)/g;
    // Thay thế link text bằng thẻ a liên kết mở tab mới
    return vanBan.replace(regexLink, function(url) {
        return '<a href="' + url + '" target="_blank" class="text-primary font-bold">' + url + '</a>';
    });
}

// Hàm kiểm tra và cập nhật chấm đỏ báo hiệu có thông báo chưa đọc trên sidebar
function capNhatHuyHieuThongBao(nguoiDung) {
    if (!nguoiDung) return;
    // Lấy toàn bộ thông báo hệ thống
    let thongBao = layCSDL('Notifications');
    // Lấy danh sách mã thông báo đã đọc của tài khoản
    let thongBaoDaDoc = nguoiDung.readNotifs || [];
    let soChuaDoc = 0;
    
    // Xử lý đếm cho Sinh viên
    if (nguoiDung.role === 'sinh-vien') {
        // Lọc các lớp sinh viên này đăng ký học
        let lopCuaToi = layCSDL('Classes').filter(c => c.enrolledStudents.includes(nguoiDung.id)).map(c => c.id);
        // Lọc thông báo chung toàn trường hoặc thông báo riêng của lớp học phần đăng ký
        let tbCuaToi = thongBao.filter(n => n.target === 'tat-ca-sinh-vien' || lopCuaToi.includes(n.target));
        // Đếm các thông báo chưa nằm trong mảng thông báo đã đọc
        soChuaDoc = tbCuaToi.filter(n => !thongBaoDaDoc.includes(n.id)).length;
        
        // Cập nhật chấm đỏ lên biểu tượng trên menu của sinh viên
        let huyHieu = document.getElementById('stuNotifBadge');
        if (huyHieu) huyHieu.innerHTML = soChuaDoc > 0 ? '<span style="background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size:10px;">●</span>' : '';
    } 
    // Xử lý đếm cho Giảng viên
    else if (nguoiDung.role === 'giang-vien') {
        // Lọc thông báo gửi chung cho tất cả giảng viên hoặc gửi riêng cho giảng viên này (ví dụ: thông báo nộp bài tập)
        let tbGiangVien = thongBao.filter(n => n.target === 'tat-ca-giang-vien' || n.target === nguoiDung.id);
        // Đếm số lượng thông báo chưa đọc
        soChuaDoc = tbGiangVien.filter(n => !thongBaoDaDoc.includes(n.id)).length;
        
        // Cập nhật chấm đỏ lên biểu tượng trên menu của giảng viên
        let huyHieu = document.getElementById('tcNotifBadge');
        if (huyHieu) huyHieu.innerHTML = soChuaDoc > 0 ? '<span style="background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size:10px;">●</span>' : '';
    }
}

// Hàm render danh sách thẻ thông báo dạng HTML vào container
function hienThiTheThongBaoChung(idVungChua, danhSachTB, nguoiDung) {
    // Tìm phần tử chứa danh sách thông báo
    let vungChua = document.getElementById(idVungChua);
    if (!vungChua) return;
    
    // Lấy danh sách đã đọc
    let daDoc = nguoiDung.readNotifs || [];
    // Bản đồ HTML cho từng thông báo
    let html = danhSachTB.map(n => {
        let checkDaDoc = daDoc.includes(n.id);
        // Nếu đã đọc thì làm mờ nền
        let lopNen = checkDaDoc ? 'bg-light' : '';
        // Đổi màu tiêu đề dựa trên trạng thái đọc
        let lopChu = checkDaDoc ? 'text-muted' : 'text-primary';
        // Hiển thị dấu tròn đỏ nếu là thông báo mới tinh
        let dotDo = checkDaDoc ? '' : '<span class="text-danger ml-10">●</span>';
        // Cắt ngắn nội dung để hiển thị xem trước (bỏ các emoji đặc biệt cho gọn)
        let safeText = n.text || '';
        let xemTruoc = safeText.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
        xemTruoc = xemTruoc.length > 90 ? xemTruoc.substring(0, 90) + '...' : xemTruoc;

        // Tạo nhãn badge tương ứng với loại tài liệu liên kết nếu có
        let nhanhBaiTap = '';
        if (n.materialId) {
            if (n.materialType === 'assignment') {
                nhanhBaiTap = '<span style="background: #f59e0b; color: #fff; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 7px; margin-left: 8px; letter-spacing: 0.5px;">📋 BÀI TẬP</span>';
            } else if (n.materialType === 'lecture') {
                nhanhBaiTap = '<span style="background: #3b82f6; color: #fff; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 7px; margin-left: 8px; letter-spacing: 0.5px;">📄 BÀI GIẢNG</span>';
            } else {
                nhanhBaiTap = '<span style="background: #10b981; color: #fff; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 2px 7px; margin-left: 8px; letter-spacing: 0.5px;">📎 TÀI LIỆU</span>';
            }
        }
        
        // Tránh XSS khi render thông báo
        let safeSenderName = escapeHTML(n.senderName);
        let safeXemTruoc = escapeHTML(xemTruoc);
        
        return `
            <div class="border-box border-left-dark mb-10 cursor-pointer ${lopNen}" onclick="moHopThoaiDocThongBao('${n.id}')">
                <div class="flex-row justify-between mb-10" style="flex-wrap: wrap; gap: 4px;">
                    <span class="${lopChu} font-bold flex-row align-center" style="flex-wrap: wrap; gap: 4px;">${safeSenderName} ${nhanhBaiTap} ${dotDo}</span>
                    <span class="text-muted text-sm">${n.date}</span>
                </div>
                <p class="${checkDaDoc ? 'text-muted' : ''}" style="white-space: pre-line; line-height: 1.5;">${safeXemTruoc}</p>
            </div>
        `;
    }).join('');
    
    // Đổ mã HTML vào phân vùng hiển thị hoặc thông báo trống
    vungChua.innerHTML = html || '<p class="border-box">Chưa có thông báo nào.</p>';
}

// Hàm mở và xem nội dung chi tiết của một thông báo, đồng thời đánh dấu đã đọc
async function moHopThoaiDocThongBao(idThongBao) {
    let thongBao = layCSDL('Notifications');
    // Tìm thông báo theo mã ID
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;
    
    let nguoiDung = layCSDL('currentUser');
    if (nguoiDung) {
        if (!nguoiDung.readNotifs) nguoiDung.readNotifs = [];
        // Nếu thông báo chưa được đọc, thêm vào mảng đã đọc và cập nhật CSDL
        if (!nguoiDung.readNotifs.includes(idThongBao)) {
            nguoiDung.readNotifs.push(idThongBao);
            ghiCSDL('currentUser', nguoiDung);
            
            // Đồng bộ trạng thái đã đọc vào danh sách tài khoản cục bộ
            let dsNguoiDung = layCSDL('Users');
            let vt = dsNguoiDung.findIndex(u => u.id === nguoiDung.id);
            if (vt > -1) {
                dsNguoiDung[vt].readNotifs = nguoiDung.readNotifs;
                ghiCSDL('Users', dsNguoiDung);
            }

            // Đồng bộ trạng thái đã đọc lên database MongoDB Atlas để lưu trữ vĩnh viễn
            fetch(`${API_BASE}/api/nguoi-dung/${nguoiDung.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ readNotifs: nguoiDung.readNotifs })
            }).catch(err => console.warn("Lỗi đồng bộ trạng thái đọc thông báo lên server:", err));
            
            // Cập nhật ngay huy hiệu và tải lại giao diện hộp thư
            capNhatHuyHieuThongBao(nguoiDung);
            
            // Tải lại hòm thư tùy thuộc vào vai trò đang đăng nhập
            if (nguoiDung.role === 'sinh-vien') {
                if (typeof hienThiThongBaoSinhVien === 'function') hienThiThongBaoSinhVien(nguoiDung);
            } else if (nguoiDung.role === 'giang-vien') {
                if (typeof hienThiHopThuDenGiangVien === 'function') hienThiHopThuDenGiangVien(nguoiDung);
            }
        }
    }

    // -----------------------------------------------------------------------
    // Kiểm tra nếu thông báo này là thông báo nộp bài của sinh viên (có submissionId)
    // Nếu đúng: mở modal xem chi tiết bài nộp thay vì modal thông báo thông thường
    // -----------------------------------------------------------------------
    if (tb.submissionId) {
        // Tìm thông tin bài nộp trong CSDL Submissions
        let submissions = layCSDL('Submissions') || [];
        let submission = submissions.find(s => s.id === tb.submissionId);

        if (!submission) {
            // Nếu chưa có trong cache cục bộ, thực hiện fetch khẩn cấp từ máy chủ
            try {
                let response = await fetch(`${API_BASE}/api/nop-bai`);
                let data = await response.json();
                if (data.success) {
                    ghiCSDL('Submissions', data.submissions);
                    submissions = data.submissions;
                    submission = submissions.find(s => s.id === tb.submissionId);
                }
            } catch (err) {
                console.warn("Lỗi tự động fetch bài nộp mới khi bấm thông báo:", err);
            }
        }

        if (submission) {
            // Mở modal xem chi tiết bài nộp của sinh viên
            moModalChiTietBaiNop(submission, nguoiDung);
            return; // Dừng ở đây, không mở modal thông báo thông thường
        }
    }

    // -----------------------------------------------------------------------
    // Kiểm tra nếu thông báo này là thông báo đăng tài liệu/bài tập (có materialId)
    // Nếu đúng: mở modal xem chi tiết thay vì modal thông báo thông thường
    // -----------------------------------------------------------------------
    if (tb.materialId) {
        // Tìm thông tin tài liệu trong CSDL Materials
        let materials = layCSDL('Materials') || [];
        let baiTap = materials.find(m => m.id === tb.materialId);

        if (!baiTap) {
            // Nếu chưa có trong cache cục bộ, thực hiện fetch khẩn cấp từ máy chủ
            try {
                let response = await fetch(`${API_BASE}/api/tai-lieu`);
                let data = await response.json();
                if (data.success) {
                    ghiCSDL('Materials', data.materials);
                    materials = data.materials;
                    baiTap = materials.find(m => m.id === tb.materialId);
                }
            } catch (err) {
                console.warn("Lỗi tự động fetch tài liệu mới khi bấm thông báo:", err);
            }
        }

        if (baiTap) {
            // Mở modal xem chi tiết tài liệu/bài tập
            moModalChiTietBaiTap(baiTap, nguoiDung);
            return; // Dừng ở đây, không mở modal thông báo thông thường
        }
    }
    
    // Gán dữ liệu thông báo vào các phần tử của modal đọc chi tiết (thông báo thường)
    document.getElementById('readNotifTitle').textContent = tb.senderName;
    document.getElementById('readNotifDate').textContent = tb.date;
    document.getElementById('readNotifContent').innerHTML = dinhDangThongBao(tb.text);
    
    // Gọi hiển thị file đính kèm inline (nếu có)
    hienThiDinhKemThongBao(tb);

    // Thiết lập hành động đặc thù (nếu có ví dụ sửa/xóa đối với giảng viên gửi thông báo)
    let vungHanhDong = document.getElementById('readNotifActions');
    if (vungHanhDong) vungHanhDong.innerHTML = '';
    
    // Bật hiển thị modal thông báo chi tiết
    moHopThoai('readNotifModal');
}

// Hàm mở modal xem chi tiết bài tập (hiển thị đầy đủ nội dung + file đính kèm để xem trực tiếp)
async function moModalChiTietBaiTap(baiTap, nguoiDung) {
    // Lấy các phần tử modal xem bài tập
    let modal = document.getElementById('assignmentDetailModal');
    if (!modal) {
        // Nếu modal chưa tồn tại trên trang, tạo mới và chèn vào body
        taoModalChiTietBaiTap();
        modal = document.getElementById('assignmentDetailModal');
    }

    // Đọc thông tin tài liệu đầy đủ từ máy chủ nếu cache cục bộ bị dọn dẹp (để lấy link base64 nặng)
    if (!baiTap.link || baiTap.link.includes('cache do đầy bộ nhớ')) {
        try {
            let res = await fetch(`${API_BASE}/api/tai-lieu/${baiTap.id}`);
            let data = await res.json();
            if (res.ok && data.success) {
                baiTap = data.material;
            }
        } catch (err) {
            console.warn("Lỗi tải chi tiết tài liệu trực tiếp từ server:", err);
        }
    }

    // Thiết lập icon, badge, nhãn mô tả động dựa trên loại tài liệu gv giao
    let elIcon = document.getElementById('adm-icon');
    let elBadge = document.getElementById('adm-badge');
    let elDescLabel = document.getElementById('adm-desc-label');

    if (baiTap.type === 'assignment') {
        if (elIcon) elIcon.textContent = '📋';
        if (elBadge) {
            elBadge.textContent = 'BÀI TẬP';
            elBadge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        }
        if (elDescLabel) elDescLabel.textContent = '📝 Nội dung bài tập:';
    } else if (baiTap.type === 'lecture') {
        if (elIcon) elIcon.textContent = '📄';
        if (elBadge) {
            elBadge.textContent = 'BÀI GIẢNG';
            elBadge.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
        }
        if (elDescLabel) elDescLabel.textContent = '📝 Mô tả bài giảng:';
    } else {
        if (elIcon) elIcon.textContent = '📎';
        if (elBadge) {
            elBadge.textContent = 'TÀI LIỆU';
            elBadge.style.background = 'linear-gradient(135deg, #10b981, #047857)';
        }
        if (elDescLabel) elDescLabel.textContent = '📝 Mô tả tài liệu:';
    }

    // Điền tiêu đề bài tập vào modal
    let elTitle = document.getElementById('adm-title');
    if (elTitle) elTitle.textContent = baiTap.title;

    // Điền ngày giao hoặc ngày đăng tài liệu
    let elDate = document.getElementById('adm-date');
    if (elDate) {
        if (baiTap.type === 'assignment') {
            elDate.textContent = `📅 Ngày giao: ${baiTap.date}`;
        } else {
            elDate.textContent = `📅 Ngày đăng: ${baiTap.date}`;
        }
    }

    // Điền nội dung mô tả bài tập (hiển thị với xuống dòng)
    let elDesc = document.getElementById('adm-description');
    if (elDesc) {
        if (baiTap.description && baiTap.description.trim()) {
            // Render mô tả kèm định dạng xuống dòng và liên kết URL
            elDesc.innerHTML = dinhDangThongBao(baiTap.description);
            elDesc.style.display = 'block';
        } else {
            elDesc.innerHTML = '<em class="text-muted">Không có mô tả bài tập.</em>';
            elDesc.style.display = 'block';
        }
    }

    // Xây dựng phần hiển thị file đính kèm GV tải lên
    let elFile = document.getElementById('adm-file-section');
    if (elFile) {
        if (baiTap.fileName && baiTap.link) {
            // Xác định icon phù hợp theo đuôi file
            let ext = baiTap.fileName.split('.').pop().toLowerCase();
            let iconFile = '📄';
            if (['png','jpg','jpeg','gif','webp','bmp'].includes(ext)) iconFile = '🖼️';
            else if (ext === 'pdf') iconFile = '📕';
            else if (['doc','docx'].includes(ext)) iconFile = '📝';
            else if (['xls','xlsx'].includes(ext)) iconFile = '📊';
            else if (['ppt','pptx'].includes(ext)) iconFile = '📊';
            else if (['zip','rar'].includes(ext)) iconFile = '🗜️';
            else if (['mp4','avi','mov'].includes(ext)) iconFile = '🎬';
            else if (['mp3','wav'].includes(ext)) iconFile = '🎵';
            let safeLink = baiTap.link.replace(/'/g, "\\'");
            let safeName = baiTap.fileName.replace(/'/g, "\\'");
            let safeNameEscaped = escapeHTML(baiTap.fileName);
            elFile.innerHTML = `
                <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-top: 16px;">
                    <div class="flex-row align-center justify-between" style="border-bottom: 1px dashed #86efac; padding-bottom: 10px; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                        <div class="flex-row align-center" style="gap: 10px;">
                            <span style="font-size: 28px;">${iconFile}</span>
                            <div>
                                <p class="font-bold text-primary" style="font-size: 14px; margin: 0;">📎 File đính kèm từ giảng viên:</p>
                                <p class="font-bold" style="word-break: break-all; margin: 0; font-size: 13px;">${safeNameEscaped}</p>
                            </div>
                        </div>
                        <button onclick="taiFileDinhKem('${safeLink}', '${safeName}')" 
                            style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; border-radius: 8px; padding: 6px 14px; font-weight: 700; cursor: pointer; font-size: 12px; width: auto;">
                            ⬇️ Tải xuống bản gốc
                        </button>
                    </div>
                    <!-- Phân vùng tự động hiển thị nội dung tệp tin inline -->
                    <div id="inline-assignment-file-preview" style="min-height: 100px; background: white; border-radius: 8px; padding: 10px; border: 1px solid #d1fae5;"></div>
                </div>
            `;
            elFile.style.display = 'block';

            // Chạy bất tuần tự hiển thị file xem thử inline ngay sau khi chèn HTML vào DOM
            setTimeout(() => {
                let previewContainer = document.getElementById('inline-assignment-file-preview');
                if (previewContainer) {
                    hienThiXemFileInline(baiTap.link, baiTap.fileName, previewContainer);
                }
            }, 50);
        } else if (baiTap.link && !baiTap.fileName) {
            // Nếu chỉ có link URL không phải file
            elFile.innerHTML = `
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-top: 16px;">
                    <p class="font-bold text-primary mb-10">🔗 Tài nguyên bài tập:</p>
                    <a href="${escapeHTML(baiTap.link)}" target="_blank" class="text-primary font-bold" style="text-decoration: underline; word-break: break-all;">${escapeHTML(baiTap.link)}</a>
                </div>
            `;
            elFile.style.display = 'block';
        } else {
            elFile.style.display = 'none';
        }
    }

    // Hiển thị nút nộp bài nếu người dùng là sinh viên và loại tài liệu là bài tập (assignment)
    let elNopBai = document.getElementById('adm-submit-btn');
    if (elNopBai) {
        if (nguoiDung && nguoiDung.role === 'sinh-vien' && baiTap.type === 'assignment') {
            // Kiểm tra xem sinh viên đã nộp bài chưa
            let submissions = layCSDL('Submissions');
            let daNop = submissions.find(s => s.materialId === baiTap.id && s.studentId === nguoiDung.id);
            let safeTitleAttr = escapeHTML(baiTap.title).replace(/'/g, "\\'");

            if (daNop) {
                // Đã nộp: hiển thị trạng thái và nút nộp lại
                elNopBai.innerHTML = `
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <span style="background: #10b981; color: white; border-radius: 8px; padding: 6px 14px; font-weight: 700; font-size: 13px;">✅ Đã nộp bài</span>
                        <button onclick="dongHopThoai('assignmentDetailModal'); moModalNopBai('${baiTap.id}', '${safeTitleAttr}')" 
                            style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-weight: 700; cursor: pointer; font-size: 13px;">
                            🔄 Nộp lại
                        </button>
                    </div>
                `;
            } else {
                // Chưa nộp: hiển thị nút nộp bài nổi bật
                elNopBai.innerHTML = `
                    <button onclick="dongHopThoai('assignmentDetailModal'); moModalNopBai('${baiTap.id}', '${safeTitleAttr}')" 
                        style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; padding: 12px 28px; font-weight: 700; cursor: pointer; font-size: 15px; width: 100%; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">
                        📤 Nộp bài ngay
                    </button>
                `;
            }
            elNopBai.style.display = 'block';
        } else {
            // Giảng viên/admin không hiện nút nộp bài
            elNopBai.style.display = 'none';
        }
    }

    // Mở modal chi tiết bài tập ở chế độ flexbox để căn giữa hoàn hảo
    modal.style.display = 'flex';
}

// Hàm tạo động modal xem chi tiết bài tập nếu chưa tồn tại trong HTML
function taoModalChiTietBaiTap() {
    let modal = document.createElement('div');
    modal.id = 'assignmentDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 32px;">
            <span class="close-modal" onclick="dongHopThoai('assignmentDetailModal')">&times;</span>
            
            <!-- Header bài tập/tài liệu động -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
                <span id="adm-icon" style="font-size: 32px;">📋</span>
                <div>
                    <div id="adm-badge" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; font-size: 10px; font-weight: 800; border-radius: 6px; padding: 2px 10px; letter-spacing: 1px; display: inline-block; margin-bottom: 6px;">BÀI TẬP</div>
                    <h2 id="adm-title" class="text-primary" style="margin: 0; font-size: 20px; line-height: 1.4;"></h2>
                </div>
            </div>
            <p id="adm-date" class="text-muted text-sm mb-20" style="margin-left: 44px;"></p>

            <!-- Mô tả / Đề bài -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 18px; border-left: 4px solid #6366f1; margin-bottom: 8px;">
                <p id="adm-desc-label" class="font-bold text-primary mb-10" style="font-size: 14px;">📝 Nội dung bài tập:</p>
                <div id="adm-description" style="line-height: 1.7; white-space: pre-line;"></div>
            </div>

            <!-- File đính kèm -->
            <div id="adm-file-section"></div>

            <!-- Nút nộp bài (chỉ hiển thị với sinh viên) -->
            <div id="adm-submit-btn" class="mt-20"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Đăng ký sự kiện click ngoài để đóng modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) dongHopThoai('assignmentDetailModal');
    });
}

// Hàm mở modal xem chi tiết bài nộp của sinh viên (hiển thị đầy đủ thông tin + xem tệp inline trực quan)
async function moModalChiTietBaiNop(submission, nguoiDung) {
    let modal = document.getElementById('submissionDetailModal');
    if (!modal) {
        // Tạo modal động nếu chưa tồn tại
        taoModalChiTietBaiNop();
        modal = document.getElementById('submissionDetailModal');
    }

    // Đọc thông tin chi tiết bài nộp đầy đủ từ server nếu bị dọn dẹp khỏi cache cục bộ (để lấy link base64)
    if (!submission.link || submission.link.includes('cache do đầy bộ nhớ')) {
        try {
            let res = await fetch(`${API_BASE}/api/nop-bai/${submission.id}`);
            let data = await res.json();
            if (res.ok && data.success) {
                submission = data.submission;
            }
        } catch (err) {
            console.warn("Lỗi tải chi tiết bài nộp trực tiếp từ server:", err);
        }
    }

    // Điền thông tin sinh viên và bài nộp vào modal
    let elTitle = document.getElementById('sdm-student-title');
    if (elTitle) elTitle.textContent = `👁️ Bài nộp từ: ${submission.studentName} (${submission.studentId})`;

    // Lấy thông tin bài tập liên quan
    let materials = layCSDL('Materials') || [];
    let baiTap = materials.find(m => m.id === submission.materialId);
    let tenBaiTap = baiTap ? baiTap.title : 'Bài tập';
    let tenLop = '';
    if (baiTap) {
        let classes = layCSDL('Classes') || [];
        let lop = classes.find(c => c.id === baiTap.classId);
        if (lop) {
            tenLop = layTenLopHienThi(lop.id);
        }
    }

    let elInfo = document.getElementById('sdm-info');
    if (elInfo) {
        elInfo.innerHTML = `
            <strong>📚 Lớp học:</strong> Lớp ${tenLop || 'Không rõ'}<br>
            <strong>📝 Bài tập:</strong> ${tenBaiTap}<br>
            <strong>📅 Ngày nộp:</strong> ${submission.date}
        `;
    }

    // Hiển thị phần tệp đính kèm và xem thử inline
    let elFileSection = document.getElementById('sdm-file-section');
    if (elFileSection) {
        if (submission.fileName && submission.link) {
            let ext = submission.fileName.split('.').pop().toLowerCase();
            let iconFile = '📄';
            if (['png','jpg','jpeg','gif','webp','bmp'].includes(ext)) iconFile = '🖼️';
            else if (ext === 'pdf') iconFile = '📕';
            else if (['doc','docx'].includes(ext)) iconFile = '📝';
            else if (['xls','xlsx','ppt','pptx'].includes(ext)) iconFile = '📊';
            else if (['zip','rar'].includes(ext)) iconFile = '🗜️';
            
            let safeLink = submission.link.replace(/'/g, "\\'");
            let safeName = submission.fileName.replace(/'/g, "\\'");
            let safeNameEscaped = escapeHTML(submission.fileName);

            elFileSection.innerHTML = `
                <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-top: 16px;">
                    <div class="flex-row align-center justify-between" style="border-bottom: 1px dashed #86efac; padding-bottom: 10px; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                        <div class="flex-row align-center" style="gap: 10px;">
                            <span style="font-size: 28px;">${iconFile}</span>
                            <div>
                                <p class="font-bold text-primary" style="font-size: 14px; margin: 0;">📎 File bài làm của sinh viên:</p>
                                <p class="font-bold" style="word-break: break-all; margin: 0; font-size: 13px;">${safeNameEscaped}</p>
                            </div>
                        </div>
                        <button onclick="taiFileDinhKem('${safeLink}', '${safeName}')" 
                            style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; border-radius: 8px; padding: 6px 14px; font-weight: 700; cursor: pointer; font-size: 12px; width: auto;">
                            ⬇️ Tải xuống bài làm
                        </button>
                    </div>
                    <!-- Phân vùng tự động hiển thị nội dung tệp tin inline -->
                    <div id="inline-submission-file-preview" style="min-height: 100px; background: white; border-radius: 8px; padding: 10px; border: 1px solid #d1fae5;"></div>
                </div>
            `;
            elFileSection.style.display = 'block';

            setTimeout(() => {
                let previewContainer = document.getElementById('inline-submission-file-preview');
                if (previewContainer) {
                    hienThiXemFileInline(submission.link, submission.fileName, previewContainer);
                }
            }, 50);
        } else if (submission.link) {
            // Nếu chỉ có link liên kết
            elFileSection.innerHTML = `
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-top: 16px;">
                    <p class="font-bold text-primary mb-10">🔗 Đường dẫn bài làm (Link):</p>
                    <a href="${escapeHTML(submission.link)}" target="_blank" class="text-primary font-bold" style="text-decoration: underline; word-break: break-all;">${escapeHTML(submission.link)}</a>
                </div>
            `;
            elFileSection.style.display = 'block';
        } else {
            elFileSection.style.display = 'none';
        }
    }

    // Hiển thị modal ở chế độ flexbox để căn giữa hoàn hảo
    modal.style.display = 'flex';
}

// Hàm tạo động modal xem chi tiết bài nộp nếu chưa tồn tại trong DOM
function taoModalChiTietBaiNop() {
    let modal = document.createElement('div');
    modal.id = 'submissionDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 32px;">
            <span class="close-modal" onclick="dongHopThoai('submissionDetailModal')">&times;</span>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <span style="font-size: 32px;">📥</span>
                <div>
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; font-size: 10px; font-weight: 800; border-radius: 6px; padding: 2px 10px; letter-spacing: 1px; display: inline-block; margin-bottom: 6px;">BÀI NỘP HỌC VIÊN</div>
                    <h2 id="sdm-student-title" class="text-primary" style="margin: 0; font-size: 20px; line-height: 1.4;"></h2>
                </div>
            </div>

            <!-- Thông tin chi tiết bài nộp -->
            <div id="sdm-info" style="background: #f8fafc; border-radius: 12px; padding: 18px; border-left: 4px solid #10b981; line-height: 1.8; margin-bottom: 8px; text-align: left; font-size: 14px;">
            </div>

            <!-- File đính kèm & xem inline -->
            <div id="sdm-file-section"></div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) dongHopThoai('submissionDetailModal');
    });
}

// --------------------------------------------------------------------------
// 4. KHỞI TẠO CƠ SỞ DỮ LIỆU NGOẠI TUYẾN MẪU (LOCAL STORAGE OFFLINE SEEDING)
// --------------------------------------------------------------------------
function khoiTaoDuLieuMau() {
    let dataVersion = layCSDL('DataVersion');
    // Nếu phiên bản dữ liệu cũ hơn 9, xóa sạch cache để dọn dẹp các trường mật khẩu nhạy cảm và cập nhật dữ liệu mới
    if (dataVersion !== '9') {
        localStorage.removeItem('Users');
        localStorage.removeItem('Subjects');
        localStorage.removeItem('Classes');
        localStorage.removeItem('Notifications');
        ghiCSDL('DataVersion', '9');
    }

    // Gieo mầm dữ liệu tài khoản mẫu cục bộ (Tuyệt đối không lưu mật khẩu ở dạng rõ tại LocalStorage, mà lưu dạng băm client)
    if (!layCSDL('Users') || layCSDL('Users').length === 0) {
        ghiCSDL('Users', [
            { id: 'AD001', role: 'admin', name: 'Quản trị viên HT', email: 'admin', dob: '1990-01-01', phone: '0999888777', readNotifs: [], passwordHash: bamMatKhauClient('admin') },
            { id: 'GV001', role: 'giang-vien', name: 'ThS. Nguyễn Văn A', email: 'giaovien', dob: '1985-05-10', phone: '0988111222', readNotifs: [], passwordHash: bamMatKhauClient('giaovien') },
            { id: 'SV202501', role: 'sinh-vien', name: 'Nguyễn Hữu Quyết', email: 'sinhvien', dob: '2005-01-15', phone: '0901000001', readNotifs: [], passwordHash: bamMatKhauClient('sinhvien') }
        ]);
    }
    
    // Khởi tạo danh mục môn học ngành CNTT
    if (!layCSDL('Subjects') || layCSDL('Subjects').length === 0) {
        ghiCSDL('Subjects', [ 
            { id: 'SUB01', name: 'Lập trình Web nâng cao', abbr: 'WEB' }, 
            { id: 'SUB02', name: 'Cấu trúc dữ liệu & Giải thuật', abbr: 'CTDL_GT' }, 
            { id: 'SUB03', name: 'Cơ sở dữ liệu lớn (NoSQL)', abbr: 'CSDL' },
            { id: 'SUB04', name: 'Lập trình hướng đối tượng (OOP)', abbr: 'OOP' },
            { id: 'SUB05', name: 'Trí tuệ nhân tạo (AI & Machine Learning)', abbr: 'AI' },
            { id: 'SUB06', name: 'Mạng máy tính & An ninh mạng', abbr: 'MMT' },
            { id: 'SUB07', name: 'Thiết kế giao diện UI/UX', abbr: 'UIUX' },
            { id: 'SUB08', name: 'Điện toán đám mây (AWS/Azure)', abbr: 'CLOUD' }
        ]);
    }
    
    // Gieo mầm danh sách lớp học và lịch học, điểm số cho sinh viên
    if (!layCSDL('Classes') || layCSDL('Classes').length === 0) {
        let maLopWeb = 'WEB_CLASS_2026';
        let maLopCtdl = 'CTDL_CLASS_2026';
        let maLopCsdl = 'CSDL_CLASS_2026';
        let maLopOop = 'OOP_CLASS_2026';
        let maLopAi = 'AI_CLASS_2026';
        let maLopUiUx = 'UIUX_CLASS_2026';
        
        ghiCSDL('Classes', [
            { 
                id: maLopWeb, 
                subjectId: 'SUB01', 
                teacherId: 'GV001', 
                room: 'Phòng A101 - Lab 1', 
                dayOfWeek: 'Thứ 2', 
                startDate: '2026-06-01', 
                endDate: '2026-07-31', 
                startPeriod: 1, 
                endPeriod: 3, 
                enrolledStudents: ['SV202501'], 
                sessions: [ 
                    { id: 'S1', date: '2026-06-01', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} },
                    { id: 'S2', date: '2026-06-08', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'late'} }
                ], 
                grades: { 
                    'SV202501': { cc: 10, gk: 8.5, ck: 9 } 
                } 
            },
            {
                id: maLopCtdl, 
                subjectId: 'SUB02', 
                teacherId: 'GV001', 
                room: 'Phòng A102 - Lý thuyết', 
                dayOfWeek: 'Thứ 4', 
                startDate: '2026-06-03', 
                endDate: '2026-07-29', 
                startPeriod: 4, 
                endPeriod: 6, 
                enrolledStudents: ['SV202501'], 
                sessions: [ 
                    { id: 'S3', date: '2026-06-03', startPeriod: 4, endPeriod: 6, attendance: {'SV202501': 'absent'} },
                    { id: 'S4', date: '2026-06-10', startPeriod: 4, endPeriod: 6, attendance: {'SV202501': 'present'} }
                ], 
                grades: { 
                    'SV202501': { cc: 10, gk: 9, ck: 8.5 } 
                }
            },
            {
                id: maLopCsdl, 
                subjectId: 'SUB03', 
                teacherId: 'GV001', 
                room: 'Phòng B201 - Lab 2', 
                dayOfWeek: 'Thứ 3', 
                startDate: '2026-06-02', 
                endDate: '2026-07-28', 
                startPeriod: 7, 
                endPeriod: 9, 
                enrolledStudents: ['SV202501'], 
                sessions: [ 
                    { id: 'S5', date: '2026-06-02', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'present'} },
                    { id: 'S5b', date: '2026-06-09', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'late'} }
                ], 
                grades: { 
                    'SV202501': { cc: 9, gk: 7, ck: 6.5 } 
                }
            },
            {
                id: maLopOop, 
                subjectId: 'SUB04', 
                teacherId: 'GV001', 
                room: 'Phòng A304 - Lý thuyết', 
                dayOfWeek: 'Thứ 5', 
                startDate: '2026-06-04', 
                endDate: '2026-07-30', 
                startPeriod: 1, 
                endPeriod: 3, 
                enrolledStudents: ['SV202501'], 
                sessions: [ 
                    { id: 'S6', date: '2026-06-04', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} },
                    { id: 'S6b', date: '2026-06-11', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} }
                ], 
                grades: { 
                    'SV202501': { cc: 8, gk: 5.5, ck: 6 } 
                }
            },
            {
                id: maLopAi, 
                subjectId: 'SUB05', 
                teacherId: 'GV001', 
                room: 'Phòng A101 - Lab 1', 
                dayOfWeek: 'Thứ 6', 
                startDate: '2026-06-05', 
                endDate: '2026-07-31', 
                startPeriod: 7, 
                endPeriod: 9, 
                enrolledStudents: ['SV202501'], 
                sessions: [ 
                    { id: 'S7', date: '2026-06-05', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'present'} },
                    { id: 'S7b', date: '2026-06-12', startPeriod: 7, endPeriod: 9, attendance: {'SV202501': 'present'} }
                ], 
                grades: { 
                    'SV202501': { cc: 10, gk: 9.5, ck: 9 } 
                }
            },
            {
                id: maLopUiUx, 
                subjectId: 'SUB07', 
                teacherId: 'GV001', 
                room: 'Phòng C102 - Creative Room', 
                dayOfWeek: 'Thứ 4', 
                startDate: '2026-06-03', 
                endDate: '2026-07-29', 
                startPeriod: 1, 
                endPeriod: 3, 
                enrolledStudents: ['SV202501'], 
                sessions: [ 
                    { id: 'S8', date: '2026-06-03', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'absent'} },
                    { id: 'S8b', date: '2026-06-10', startPeriod: 1, endPeriod: 3, attendance: {'SV202501': 'present'} }
                ], 
                grades: { 
                    'SV202501': { cc: 6, gk: 4.5, ck: 4 } 
                }
            }
        ]);
    }

    // Gieo mầm dữ liệu thông báo mẫu
    if (!layCSDL('Notifications') || layCSDL('Notifications').length === 0) {
        ghiCSDL('Notifications', [
            { 
                id: 'NOTIF_1', 
                senderName: 'Hệ thống Đào tạo', 
                target: 'tat-ca-sinh-vien', 
                text: 'Chào mừng các sinh viên ngành Công nghệ thông tin bước vào kỳ chuyên ngành mới!\nHãy đăng ký tín chỉ đầy đủ trước ngày 30/06.', 
                date: new Date().toLocaleDateString('en-CA') 
            },
            { 
                id: 'NOTIF_2', 
                senderName: 'ThS. Nguyễn Văn A', 
                target: 'tat-ca-sinh-vien', 
                text: 'Lưu ý lớp Lập trình Web nâng cao chuẩn bị cài đặt Node.js phiên bản v18+ trước buổi Lab 1 tuần sau.', 
                date: new Date().toLocaleDateString('en-CA') 
            }
        ]);
    }

    // Mở đăng ký tín chỉ mặc định nếu chưa được định nghĩa
    if (layCSDL('RegistrationOpen') === null) {
        ghiCSDL('RegistrationOpen', true);
    }
}
// Chạy hàm gieo mầm dữ liệu offline
khoiTaoDuLieuMau();

// --------------------------------------------------------------------------
// 5. XỬ LÝ ĐĂNG NHẬP (AUTHENTICATION LOGIC)
// --------------------------------------------------------------------------

// Bắt sự kiện nộp biểu mẫu đăng nhập
let loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Sự kiện lắng nghe khi chuyển đổi vai trò (radio buttons) để tự động xóa sạch các trường nhập liệu
    document.querySelectorAll('input[name="loginRole"]').forEach(radio => {
        radio.addEventListener('change', () => {
            loginForm.elements['email'].value = '';
            loginForm.elements['password'].value = '';
        });
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Thu thập thông tin từ form đăng nhập
        let emailValue = loginForm.elements['email'].value.trim();
        let passwordValue = loginForm.elements['password'].value;
        let roleValue = document.querySelector('input[name="loginRole"]:checked').value;
        
        try {
            // Thực hiện gọi API đăng nhập tới server backend
            let response = await fetch(`${DUONG_DAN_API}/dang-nhap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailValue, password: passwordValue, role: roleValue })
            });
            let data = await response.json();
            
            // Nếu đăng nhập thành công trực tuyến qua MongoDB Atlas
            if (response.ok && data.success) {
                // Lưu token xác thực vào LocalStorage dưới dạng mã hóa
                ghiCSDL('sessionToken', data.token);

                // Tạo một bản sao dữ liệu sạch, lưu kèm mật khẩu băm để đăng nhập ngoại tuyến lần sau
                const nguoiDungKemHash = { ...data.user, passwordHash: bamMatKhauClient(passwordValue) };
                
                // Lưu thông tin người dùng hiện tại vào LocalStorage dưới dạng mã hóa
                ghiCSDL('currentUser', nguoiDungKemHash);
                
                // Đồng bộ cập nhật thông tin tài khoản này vào CSDL offline (Không bao giờ lưu trường mật khẩu vào LocalStorage)
                let users = layCSDL('Users');
                let vt = users.findIndex(u => u.id === data.user.id);
                if (vt === -1) {
                    users.push(nguoiDungKemHash); // Lưu tài khoản mới
                } else {
                    users[vt] = { ...users[vt], ...nguoiDungKemHash }; // Cập nhật đè dữ liệu mới và mật khẩu băm
                }
                ghiCSDL('Users', users); // Ghi lại vào LocalStorage
                
                // Chuyển hướng trực tiếp không qua hộp thoại thông báo alert
                chuyenHuongTrangQuanLy(roleValue); // Chuyển hướng theo vai trò đăng nhập
            } else {
                // Đăng nhập trực tuyến thất bại (sai tài khoản hoặc mật khẩu)
                alert(data.message || "Sai thông tin đăng nhập!"); // Phản hồi thông báo lỗi từ server
            }
        } catch (error) {
            // Không thể kết nối đến máy chủ backend (lỗi mạng hoặc mất kết nối internet) - Chuyển sang đăng nhập ngoại tuyến
            console.warn("Lỗi kết nối máy chủ! Đang thử xác thực ngoại tuyến qua LocalStorage...", error);
            
            let users = layCSDL('Users');
            let localUser = users.find(u => (u.email === emailValue || u.id === emailValue) && u.role === roleValue);
            
            if (localUser) {
                let hopLe = false;
                if (localUser.passwordHash) {
                    // Kiểm tra bằng mật khẩu băm client
                    hopLe = (localUser.passwordHash === bamMatKhauClient(passwordValue));
                } else if (localUser.password) {
                    // Dự phòng cho dữ liệu cũ (nếu có)
                    hopLe = (localUser.password === passwordValue);
                }
                
                if (hopLe) {
                    // Đăng nhập ngoại tuyến thành công
                    ghiCSDL('currentUser', localUser);
                    chuyenHuongTrangQuanLy(roleValue);
                } else {
                    alert("Sai mật khẩu ngoại tuyến!");
                }
            } else {
                alert("Lỗi kết nối máy chủ và không tìm thấy tài khoản ngoại tuyến tương ứng trên trình duyệt!");
            }
        }
    });
}

// Hàm chuyển hướng trang tương ứng với từng vai trò
function chuyenHuongTrangQuanLy(vaiTro) {
    if (vaiTro === 'admin') {
        window.location.href = 'admin.html';
    } else if (vaiTro === 'giang-vien') {
        window.location.href = 'teacher-dashboard.html';
    } else if (vaiTro === 'sinh-vien') {
        window.location.href = 'student-dashboard.html';
    } else {
        localStorage.removeItem('currentUser');
    }
}

// --------------------------------------------------------------------------
// 6. ĐỊNH TUYẾN KHI TẢI TRANG (BOOTSTRAP PROCESS & ROUTING)
// --------------------------------------------------------------------------
// Hàm tự động đồng bộ dữ liệu hai chiều giữa MongoDB Atlas và LocalStorage
// Hàm tự động đẩy (upload) các bản ghi offline chưa đồng bộ (gồm Notifications, Materials, Submissions chưa có _id) lên server
async function dongBoNgoaiTuyenTruocKhiKeo() {
    // 1. Đồng bộ Notifications
    let localNotifs = layCSDL('Notifications');
    let unsyncedNotifs = localNotifs.filter(n => !n._id && n.id);
    for (let notif of unsyncedNotifs) {
        try {
            let res = await fetch(`${API_BASE}/api/thong-bao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notif)
            });
            let data = await res.json();
            if (res.ok && data.success) {
                // Cập nhật _id tạm để không đồng bộ lại
                notif._id = data.notification._id || 'synced';
            }
        } catch (err) {
            console.warn("Lỗi đồng bộ thông báo ngoại tuyến:", err);
        }
    }
    ghiCSDL('Notifications', localNotifs);

    // 2. Đồng bộ Materials
    let localMaterials = layCSDL('Materials');
    let unsyncedMaterials = localMaterials.filter(m => !m._id && m.id);
    for (let mat of unsyncedMaterials) {
        try {
            let res = await fetch(`${API_BASE}/api/tai-lieu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mat)
            });
            let data = await res.json();
            if (res.ok && data.success) {
                mat._id = data.material._id || 'synced';
            }
        } catch (err) {
            console.warn("Lỗi đồng bộ tài liệu ngoại tuyến:", err);
        }
    }
    ghiCSDL('Materials', localMaterials);

    // 3. Đồng bộ Submissions
    let localSubmissions = layCSDL('Submissions');
    let unsyncedSubmissions = localSubmissions.filter(s => !s._id && s.id);
    for (let sub of unsyncedSubmissions) {
        try {
            let res = await fetch(`${API_BASE}/api/nop-bai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub)
            });
            let data = await res.json();
            if (res.ok && data.success) {
                sub._id = data.submission._id || 'synced';
            }
        } catch (err) {
            console.warn("Lỗi đồng bộ bài nộp ngoại tuyến:", err);
        }
    }
    ghiCSDL('Submissions', localSubmissions);

    // 4. Đồng bộ Classes
    let localClasses = layCSDL('Classes');
    let unsyncedClasses = localClasses.filter(c => c.isUnsynced === true);
    for (let cls of unsyncedClasses) {
        try {
            let res = await fetch(`${API_BASE}/api/lop-hoc/${cls.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cls)
            });
            let data = await res.json();
            if (res.ok && data.success) {
                delete cls.isUnsynced;
            }
        } catch (err) {
            console.warn("Lỗi đồng bộ lớp học ngoại tuyến:", err);
        }
    }
    ghiCSDL('Classes', localClasses);
}

// Hàm tự động đồng bộ dữ liệu hai chiều giữa MongoDB Atlas và LocalStorage
async function dongBoDuLieuTuDong() {
    let user = layCSDL('currentUser');
    if (!user) return;
    
    // Đẩy các thay đổi offline lên trước
    await dongBoNgoaiTuyenTruocKhiKeo();
    
    let duongDanTrang = window.location.pathname;

    // 1. Đồng bộ danh sách người dùng và cập nhật thông tin currentUser mới nhất để tránh stale data
    if (user.role === 'admin') {
        fetch(`${API_BASE}/api/nguoi-dung`)
            .then(res => {
                if (!res.ok) throw new Error("HTTP error " + res.status);
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    ghiCSDL('Users', data.users);
                    let freshUser = data.users.find(u => u.id === user.id);
                    if (freshUser) {
                        // Trộn danh sách thông báo đã đọc cục bộ và server để tránh bị ghi đè mất trạng thái
                        let mergedReadNotifs = Array.from(new Set([...(user.readNotifs || []), ...(freshUser.readNotifs || [])]));
                        freshUser.readNotifs = mergedReadNotifs;

                        // Cập nhật lại currentUser cục bộ từ bản ghi mới nhất của server
                        ghiCSDL('currentUser', freshUser);
                        user = freshUser;
                    }
                    if (duongDanTrang.includes('admin.html') && typeof hienThiDanhSachTaiKhoan === 'function') {
                        hienThiDanhSachTaiKhoan();
                    }
                }
            })
            .catch(err => console.warn("Lỗi đồng bộ danh sách tài khoản (Admin):", err));
    } else {
        // Học sinh và Giảng viên
        Promise.all([
            fetch(`${API_BASE}/api/nguoi-dung/cong-khai`).then(res => {
                if (!res.ok) throw new Error("HTTP error " + res.status);
                return res.json();
            }),
            fetch(`${API_BASE}/api/nguoi-dung/${user.id}`).then(res => {
                if (!res.ok) throw new Error("HTTP error " + res.status);
                return res.json();
            })
        ])
        .then(([publicData, privateData]) => {
            if (publicData.success) {
                ghiCSDL('Users', publicData.users);
            }
            if (privateData.success && privateData.user) {
                let freshUser = privateData.user;
                // Trộn danh sách thông báo đã đọc cục bộ và server để tránh bị ghi đè mất trạng thái
                let mergedReadNotifs = Array.from(new Set([...(user.readNotifs || []), ...(freshUser.readNotifs || [])]));
                freshUser.readNotifs = mergedReadNotifs;

                // Cập nhật lại currentUser cục bộ từ bản ghi mới nhất của server
                ghiCSDL('currentUser', freshUser);
                user = freshUser;
            }
            if (duongDanTrang.includes('teacher-dashboard.html') && typeof hienThiBaoCaoGiangVien === 'function') {
                hienThiBaoCaoGiangVien(user);
            } else if (duongDanTrang.includes('student-dashboard.html') && typeof hienThiBaoCaoHocTapSinhVien === 'function') {
                hienThiBaoCaoHocTapSinhVien(user);
            }
        })
        .catch(err => console.warn("Lỗi đồng bộ danh sách tài khoản (User):", err));
    }

    // 2. Đồng bộ danh sách thông báo và cập nhật lại hòm thư của từng giao diện
    fetch(`${API_BASE}/api/thong-bao`)
        .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                ghiCSDL('Notifications', data.notifications);
                capNhatHuyHieuThongBao(user);
                if (duongDanTrang.includes('admin.html') && typeof hienThiDanhSachThongBaoAdmin === 'function') {
                    hienThiDanhSachThongBaoAdmin();
                } else if (duongDanTrang.includes('teacher-dashboard.html')) {
                    if (typeof hienThiHopThuDenGiangVien === 'function') hienThiHopThuDenGiangVien(user);
                    if (typeof hienThiLichSuGuiGiangVien === 'function') hienThiLichSuGuiGiangVien(user);
                } else if (duongDanTrang.includes('student-dashboard.html')) {
                    if (typeof hienThiThongBaoSinhVien === 'function') hienThiThongBaoSinhVien(user);
                }
            }
        })
        .catch(err => console.warn("Lỗi đồng bộ danh sách thông báo:", err));

    // 3. Đồng bộ danh sách tài liệu giảng dạy và bài tập lớp học
    fetch(`${API_BASE}/api/tai-lieu`)
        .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                ghiCSDL('Materials', data.materials);
                if (duongDanTrang.includes('teacher-dashboard.html')) {
                    let classDetailTab = document.getElementById('class-detail-tab');
                    if (classDetailTab && classDetailTab.style.display === 'block' && typeof hienThiTaiLieuGiangVien === 'function') {
                        hienThiTaiLieuGiangVien();
                    }
                }
            }
        })
        .catch(err => console.warn("Lỗi đồng bộ tài liệu giảng dạy:", err));

    // 4. Đồng bộ danh sách bài nộp bài tập trực tuyến
    fetch(`${API_BASE}/api/nop-bai`)
        .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                ghiCSDL('Submissions', data.submissions);
            }
        })
        .catch(err => console.warn("Lỗi đồng bộ danh sách bài nộp:", err));

    // 5. Đồng bộ danh sách lớp học phần từ server MongoDB Atlas
    fetch(`${API_BASE}/api/lop-hoc`)
        .then(res => {
            if (!res.ok) throw new Error("HTTP error " + res.status);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                ghiCSDL('Classes', data.classes);
                if (duongDanTrang.includes('admin.html') && typeof hienThiDanhSachLopHocAdmin === 'function') {
                    hienThiDanhSachLopHocAdmin();
                } else if (duongDanTrang.includes('teacher-dashboard.html')) {
                    if (typeof hienThiBaoCaoGiangVien === 'function') hienThiBaoCaoGiangVien(user);
                    if (typeof hienThiDanhSachHocSinhDiemDanh === 'function') hienThiDanhSachHocSinhDiemDanh();
                    if (typeof hienThiBangDiemLopHoc === 'function') hienThiBangDiemLopHoc();
                } else if (duongDanTrang.includes('student-dashboard.html')) {
                    if (typeof hienThiBaoCaoHocTapSinhVien === 'function') hienThiBaoCaoHocTapSinhVien(user);
                    if (typeof hienThiTabDangKyTinChi === 'function') hienThiTabDangKyTinChi(user);
                }
            }
        })
        .catch(err => console.warn("Lỗi đồng bộ danh sách lớp học:", err));
}

document.addEventListener('DOMContentLoaded', () => {
    let user = layCSDL('currentUser');
    let duongDanTrang = window.location.pathname;

    // Chạy đồng bộ dữ liệu ngay lập tức và cài đặt vòng lặp tự động mỗi 15 giây
    if (user) {
        dongBoDuLieuTuDong();
        setInterval(dongBoDuLieuTuDong, 15000);
    }

    // Định tuyến tại trang chủ đăng nhập index.html
    if (duongDanTrang.includes('index.html') || duongDanTrang.endsWith('/') || duongDanTrang === '') {
        if (user) {
            if (user.role === 'sinh-vien' || user.role === 'giang-vien' || user.role === 'admin') {
                chuyenHuongTrangQuanLy(user.role);
            } else {
                localStorage.removeItem('currentUser');
            }
        }
    }
    
    // Khởi tạo giao diện trang Sinh Viên
    if (duongDanTrang.includes('student-dashboard.html')) {
        if (!user || user.role !== 'sinh-vien') {
            window.location.href = 'index.html';
            return;
        }
        
        // Điền tên và email hiển thị trên sidebar
        document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
        document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
        
        // Khởi động các tính năng chung
        khoiTaoGiaoDienChung();
        khoiTaoHoSoCaNhan(user);
        capNhatHuyHieuThongBao(user);

        // Gọi các hàm hiển thị đặc thù định nghĩa trong sinhvien.js
        if (typeof hienThiBaoCaoHocTapSinhVien === 'function') hienThiBaoCaoHocTapSinhVien(user); 
        if (typeof hienThiTabDangKyTinChi === 'function') hienThiTabDangKyTinChi(user);
        if (typeof hienThiThongBaoSinhVien === 'function') hienThiThongBaoSinhVien(user);
    }

    // Khởi tạo giao diện trang Giảng Viên
    if (duongDanTrang.includes('teacher-dashboard.html')) {
        if (!user || user.role !== 'giang-vien') {
            window.location.href = 'index.html';
            return;
        }

        // Điền tên và email hiển thị trên sidebar
        document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
        document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
        
        // Khởi động các tính năng chung
        khoiTaoGiaoDienChung();
        khoiTaoHoSoCaNhan(user);
        capNhatHuyHieuThongBao(user);

        // Gọi các hàm hiển thị đặc thù định nghĩa trong giaovien.js
        if (typeof hienThiBaoCaoGiangVien === 'function') hienThiBaoCaoGiangVien(user);
        if (typeof hienThiThongBaoGiangVien === 'function') hienThiThongBaoGiangVien(user);
    }

    // Khởi tạo giao diện trang Quản trị viên
    if (duongDanTrang.includes('admin.html')) {
        if (!user || user.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        // Điền tên và email hiển thị trên sidebar
        document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
        document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
        
        // Khởi động các tính năng chung
        khoiTaoGiaoDienChung();
        khoiTaoHoSoCaNhan(user);
        capNhatHuyHieuThongBao(user);

        // Gọi hàm hiển thị đặc thù định nghĩa trong admin.js
        if (typeof khoiTaoGiaoDienAdmin === 'function') khoiTaoGiaoDienAdmin(user);
    }
});

// ==========================================================================
// CÁC HÀM QUẢN LÝ THÔNG BÁO DÙNG CHUNG (CONSOLIDATED NOTIFICATION FUNCTIONS - DRY)
// ==========================================================================

// Hàm mở xem và quản lý thông báo chi tiết (dùng chung GV + Admin)
// Tự động render file đính kèm inline khi mở modal
async function moQuanLyThongBao(idThongBao, vaiTro) {
    let thongBao = layCSDL('Notifications') || [];
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;

    let currentUser = layCSDL('currentUser');
    if (!vaiTro && currentUser) vaiTro = currentUser.role;

    document.getElementById('readNotifTitle').textContent = tb.senderName;
    document.getElementById('readNotifDate').textContent = tb.date;
    document.getElementById('readNotifContent').innerHTML = dinhDangThongBao(tb.text);

    // Nếu thông báo có materialId nhưng file/link chưa có trong cache cục bộ, tải từ server
    if (tb.materialId && (!tb.link || tb.link === '')) {
        try {
            let mats = layCSDL('Materials') || [];
            let mat = mats.find(m => m.id === tb.materialId);
            if (!mat || !mat.link) {
                // Fetch tài liệu từ server nếu cache trống
                let res = await fetch(`${API_BASE}/api/tai-lieu/${tb.materialId}`);
                let data = await res.json();
                if (res.ok && data.success) {
                    mat = data.material;
                    let allMats = layCSDL('Materials') || [];
                    let vi = allMats.findIndex(m => m.id === tb.materialId);
                    if (vi > -1) allMats[vi] = mat; else allMats.unshift(mat);
                    ghiCSDL('Materials', allMats);
                }
            }
        } catch (err) {
            console.warn('Lỗi tải file đính kèm tài liệu khi mở lịch sử thông báo:', err);
        }
    }

    // Gọi hàm hiển thị file đính kèm inline (tự động mở file ngay khi modal hiện)
    hienThiDinhKemThongBao(tb);

    let vungHanhDong = document.getElementById('readNotifActions');
    if (vungHanhDong) {
        vungHanhDong.innerHTML = `
            <button class="action-btn" onclick="suaThongBao('${tb.id}')">Chỉnh sửa</button>
            <button class="btn-danger" onclick="xoaThongBao('${tb.id}', '${vaiTro}')">Xóa thông báo</button>
        `;
    }
    moHopThoai('readNotifModal');
}

// Hàm mở chế độ chỉnh sửa thông báo (cho phép sửa text VÀ file đính kèm)
// Hiển thị rõ ràng file hiện tại với preview nhỏ + cho phép chọn file mới hoặc nhập link
function suaThongBao(idThongBao) {
    let thongBao = layCSDL('Notifications') || [];
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;

    // Xóa vùng xem thử file inline trong khi đang chỉnh sửa
    let fileSection = document.getElementById('readNotifFileSection');
    if (fileSection) fileSection.innerHTML = '';

    let contentDiv = document.getElementById('readNotifContent');
    
    // Lấy link và fileName hiện tại (có thể từ Materials nếu có materialId)
    let originalLink = tb.link || '';
    let originalFileName = tb.fileName || '';
    if (tb.materialId) {
        let materials = layCSDL('Materials') || [];
        let mat = materials.find(m => m.id === tb.materialId);
        if (mat) {
            originalLink = mat.link || '';
            originalFileName = mat.fileName || '';
        }
    }

    // Tạo preview nhỏ của file hiện tại để GV biết đang sửa file gì
    let currentFilePreviewHtml = '';
    if (originalFileName && originalLink) {
        let ext = originalFileName.split('.').pop().toLowerCase();
        let iconF = '📄';
        if (['png','jpg','jpeg','gif','webp','bmp'].includes(ext)) iconF = '🖼️';
        else if (ext === 'pdf') iconF = '📕';
        else if (['doc','docx'].includes(ext)) iconF = '📝';
        currentFilePreviewHtml = `
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;margin-top:10px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:22px;">${iconF}</span>
                <div style="flex:1;min-width:0;">
                    <p style="margin:0;font-size:12px;color:#6366f1;font-weight:700;">File đang đính kèm:</p>
                    <p style="margin:0;font-size:13px;font-weight:600;word-break:break-all;">${escapeHTML(originalFileName)}</p>
                </div>
                <span style="font-size:11px;color:#94a3b8;white-space:nowrap;">Bạn có thể thay thế bên dưới</span>
            </div>
        `;
    } else if (originalLink) {
        currentFilePreviewHtml = `
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;margin-top:10px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">🔗</span>
                <div style="flex:1;min-width:0;">
                    <p style="margin:0;font-size:12px;color:#059669;font-weight:700;">Link đang đính kèm:</p>
                    <p style="margin:0;font-size:13px;font-weight:600;word-break:break-all;">${escapeHTML(originalLink)}</p>
                </div>
            </div>
        `;
    }

    contentDiv.innerHTML = `
        <div class="input-group">
            <label class="font-bold text-primary">Nội dung thông báo</label>
            <textarea id="editNotifTextarea" rows="6" class="input-group" style="width:100%; border:1px solid var(--border-color); border-radius:6px; padding:10px; font-family:inherit; font-size: 14px;">${tb.text}</textarea>
        </div>
        <div style="margin-top:16px;">
            <p class="font-bold text-primary mb-10" style="font-size:14px;">📎 File / Liên kết đính kèm</p>
            ${currentFilePreviewHtml}
            <div class="grid-container" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <div class="input-group mb-0">
                    <label class="text-sm font-bold">Thay bằng link URL mới</label>
                    <input type="url" id="editNotifLink" value="${escapeHTML(originalLink)}" placeholder="https://drive.google.com/..." 
                        style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:6px; font-size: 13px;">
                </div>
                <div class="input-group mb-0">
                    <label class="text-sm font-bold">Hoặc chọn file mới từ thiết bị</label>
                    <input type="file" id="editNotifFile" 
                        style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; background: #fff; font-size: 12px;">
                    <p class="text-sm text-muted mt-5" id="editNotifFileStatus" style="font-size: 12px; word-break: break-all;">
                        ${originalFileName ? '📎 File hiện tại: ' + escapeHTML(originalFileName) : 'Chưa có file nào được chọn'}
                    </p>
                </div>
            </div>
        </div>
    `;

    // Đăng ký sự kiện thay đổi file để cập nhật status text
    let editFileInp = document.getElementById('editNotifFile');
    let editStatusText = document.getElementById('editNotifFileStatus');
    if (editFileInp && editStatusText) {
        editFileInp.addEventListener('change', () => {
            if (editFileInp.files.length > 0) {
                editStatusText.textContent = `✅ Đã chọn: ${editFileInp.files[0].name}`;
                editStatusText.style.color = '#059669';
            } else {
                editStatusText.textContent = originalFileName ? `📎 File hiện tại: ${originalFileName}` : 'Chưa có file nào được chọn';
                editStatusText.style.color = '';
            }
        });
    }

    let actions = document.getElementById('readNotifActions');
    if (actions) {
        actions.innerHTML = `
            <button class="btn-primary" style="width: auto;" onclick="luuThongBao('${tb.id}')">💾 Lưu thay đổi</button>
            <button class="action-btn" style="width: auto;" onclick="moQuanLyThongBao('${tb.id}')">↩ Hủy bỏ</button>
        `;
    }
}

// Hàm hiển thị tệp đính kèm inline cho thông báo chi tiết (dùng chung)
function hienThiDinhKemThongBao(tb) {
    let fileSection = document.getElementById('readNotifFileSection');
    if (!fileSection) {
        fileSection = document.createElement('div');
        fileSection.id = 'readNotifFileSection';
        let contentEl = document.getElementById('readNotifContent');
        if (contentEl) contentEl.after(fileSection);
    }
    fileSection.innerHTML = '';
    fileSection.style.display = 'none';

    let linkData = tb.link || '';
    let fileDataName = tb.fileName || '';
    
    // Nếu thông báo liên kết với tài liệu
    if (tb.materialId) {
        let materials = layCSDL('Materials') || [];
        let mat = materials.find(m => m.id === tb.materialId);
        if (mat) {
            linkData = mat.link || '';
            fileDataName = mat.fileName || '';
        }
    }

    if (linkData && fileDataName) {
        let ext = fileDataName.split('.').pop().toLowerCase();
        let iconFile = '📄';
        if (['png','jpg','jpeg','gif','webp','bmp'].includes(ext)) iconFile = '🖼️';
        else if (ext === 'pdf') iconFile = '📕';
        else if (['doc','docx'].includes(ext)) iconFile = '📝';
        else if (['xls','xlsx','ppt','pptx'].includes(ext)) iconFile = '📊';
        else if (['zip','rar'].includes(ext)) iconFile = '🗜️';

        let safeLink = linkData.replace(/'/g, "\\'");
        let safeName = fileDataName.replace(/'/g, "\\'");
        let safeNameEscaped = escapeHTML(fileDataName);

        fileSection.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(139, 61, 255, 0.03) 0%, rgba(0, 196, 204, 0.04) 100%); border: 1px solid rgba(139, 61, 255, 0.12); border-radius: 16px; padding: 18px; margin-top: 20px; text-align: left; box-shadow: var(--shadow-sm);">
                <div class="flex-row align-center justify-between" style="border-bottom: 1px dashed rgba(139, 61, 255, 0.15); padding-bottom: 12px; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                    <div class="flex-row align-center" style="gap: 12px;">
                        <span style="font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${iconFile}</span>
                        <div>
                            <p class="font-bold text-primary" style="font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">📎 File đính kèm thông báo:</p>
                            <p class="font-bold" style="word-break: break-all; margin: 2px 0 0 0; font-size: 14px; color: var(--text-main);">${safeNameEscaped}</p>
                        </div>
                    </div>
                    <button onclick="taiFileDinhKem('${safeLink}', '${safeName}')" 
                        class="btn-download-premium"
                        style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%); color: white; border: none; border-radius: 10px; padding: 8px 16px; font-weight: 700; cursor: pointer; font-size: 12px; width: auto; box-shadow: 0 4px 12px rgba(139, 61, 255, 0.2);">
                        ⬇️ Tải xuống bản gốc
                    </button>
                </div>
                <div id="inline-read-notif-preview" style="min-height: 120px; background: white; border-radius: 12px; padding: 12px; border: 1px solid rgba(139, 61, 255, 0.08); box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);"></div>
            </div>
        `;
        fileSection.style.display = 'block';
        
        setTimeout(() => {
            let previewContainer = document.getElementById('inline-read-notif-preview');
            if (previewContainer) {
                hienThiXemFileInline(linkData, fileDataName, previewContainer);
            }
        }, 50);
    } else if (linkData) {
        fileSection.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(0, 196, 204, 0.03) 0%, rgba(139, 61, 255, 0.03) 100%); border: 1px solid rgba(0, 196, 204, 0.15); border-radius: 16px; padding: 18px; margin-top: 20px; text-align: left; box-shadow: var(--shadow-sm);">
                <div class="flex-row align-center" style="gap: 12px;">
                    <span style="font-size: 28px;">🔗</span>
                    <div style="flex: 1; min-width: 0;">
                        <p class="font-bold text-primary" style="font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Liên kết đính kèm:</p>
                        <a href="${escapeHTML(linkData)}" target="_blank" class="text-primary font-bold" style="text-decoration: underline; word-break: break-all; font-size: 14px; display: inline-block; margin-top: 4px;">${escapeHTML(linkData)}</a>
                    </div>
                </div>
            </div>
        `;
        fileSection.style.display = 'block';
    }
}

// Hàm lưu lại nội dung thông báo và tệp đính kèm sau khi chỉnh sửa
async function luuThongBao(idThongBao) {
    let textarea = document.getElementById('editNotifTextarea');
    if (!textarea) return;
    let vanBanMoi = textarea.value.trim();
    if (!vanBanMoi) {
        alert("Nội dung thông báo không được bỏ trống!");
        return;
    }

    let linkInp = document.getElementById('editNotifLink');
    let fileInp = document.getElementById('editNotifFile');
    let fileObj = fileInp ? fileInp.files[0] : null;
    let linkVal = linkInp ? linkInp.value.trim() : '';

    let thongBao = layCSDL('Notifications') || [];
    let tb = thongBao.find(x => x.id === idThongBao);
    if (!tb) return;

    let originalLink = tb.link || '';
    let originalFileName = tb.fileName || '';
    if (tb.materialId) {
        let materials = layCSDL('Materials') || [];
        let mat = materials.find(m => m.id === tb.materialId);
        if (mat) {
            originalLink = mat.link || '';
            originalFileName = mat.fileName || '';
        }
    }

    let finalLink = fileObj ? '' : (linkVal || originalLink);
    let finalFileName = fileObj ? fileObj.name : (linkVal ? (linkVal === originalLink ? originalFileName : '') : '');

    const thucHienLuu = async (linkData, fileDataName) => {
        let currentUser = layCSDL('currentUser');
        let role = currentUser ? currentUser.role : '';

        // 1. Cập nhật thông báo lên backend MongoDB
        try {
            let payload = {
                text: vanBanMoi,
                fileName: fileDataName,
                link: linkData
            };
            let response = await fetch(`${API_BASE}/api/thong-bao/${idThongBao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let data = await response.json();

            if (response.ok && data.success) {
                tb.text = vanBanMoi;
                tb.fileName = fileDataName;
                tb.link = linkData;
                ghiCSDL('Notifications', thongBao);
            } else {
                alert(data.message || "Cập nhật thông báo thất bại!");
                return;
            }
        } catch (error) {
            console.warn("Lỗi cập nhật thông báo trực tuyến, chuyển lưu offline:", error);
            tb.text = vanBanMoi;
            tb.fileName = fileDataName;
            tb.link = linkData;
            ghiCSDL('Notifications', thongBao);
        }

        // 2. Nếu thông báo có liên kết materialId, cập nhật cả tài liệu Material đó!
        if (tb.materialId) {
            try {
                let matPayload = {
                    title: vanBanMoi.split('\n')[0].replace(/^[📋📄📎] \[[^\]]+\] /, ''), // Dòng đầu làm tiêu đề
                    description: vanBanMoi,
                    fileName: fileDataName,
                    link: linkData
                };
                
                let res = await fetch(`${API_BASE}/api/tai-lieu/${tb.materialId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(matPayload)
                });
                let matData = await res.json();
                if (res.ok && matData.success) {
                    let materials = layCSDL('Materials') || [];
                    let vt = materials.findIndex(m => m.id === tb.materialId);
                    if (vt > -1) {
                        materials[vt] = { ...materials[vt], ...matPayload };
                        ghiCSDL('Materials', materials);
                    }
                }
            } catch (matErr) {
                console.warn("Lỗi cập nhật tài liệu liên kết:", matErr);
            }
        }

        alert("Cập nhật thông báo thành công!");
        moQuanLyThongBao(idThongBao, role);
    };

    if (fileObj) {
        let reader = new FileReader();
        reader.onload = function(evt) {
            thucHienLuu(evt.target.result, fileObj.name);
        };
        reader.readAsDataURL(fileObj);
    } else {
        thucHienLuu(finalLink, finalFileName);
    }
}

// Hàm xóa thông báo khỏi hệ thống
function xoaThongBao(idThongBao, vaiTro) {
    hienThiConfirmTuyBien("Bạn có chắc chắn muốn xóa thông báo này?", async () => {
        try {
            let response = await fetch(`${API_BASE}/api/thong-bao/${idThongBao}`, { method: 'DELETE' });
            let data = await response.json();
            
            if (response.ok && data.success) {
                let thongBao = layCSDL('Notifications').filter(n => n.id !== idThongBao);
                ghiCSDL('Notifications', thongBao);
                alert("Xóa thông báo thành công!");
                dongHopThoai('readNotifModal');
                if (vaiTro === 'admin' && typeof hienThiDanhSachThongBaoAdmin === 'function') {
                    hienThiDanhSachThongBaoAdmin();
                } else if (vaiTro === 'giang-vien' && typeof hienThiLichSuGuiGiangVien === 'function') {
                    hienThiLichSuGuiGiangVien();
                }
            } else {
                alert(data.message || "Xóa thất bại!");
            }
        } catch (error) {
            let thongBao = layCSDL('Notifications').filter(n => n.id !== idThongBao);
            ghiCSDL('Notifications', thongBao);
            alert("Xóa thông báo thành công!");
            dongHopThoai('readNotifModal');
            if (vaiTro === 'admin' && typeof hienThiDanhSachThongBaoAdmin === 'function') {
                hienThiDanhSachThongBaoAdmin();
            } else if (vaiTro === 'giang-vien' && typeof hienThiLichSuGuiGiangVien === 'function') {
                hienThiLichSuGuiGiangVien();
            }
        }
    });
}

// Hàm đánh dấu tất cả thông báo là đã đọc
function danhDauDaDocTatCaThongBao(vaiTro) {
    let user = layCSDL('currentUser');
    if (!user) return;
    let thongBao = layCSDL('Notifications');
    let filteredNotifs = [];
    
    if (vaiTro === 'sinh-vien') {
        let locSelect = document.getElementById('stuNotifFilter');
        let giaTriLoc = locSelect ? locSelect.value : 'all';
        let dsMaLopCuaToi = layCSDL('Classes').filter(c => c.enrolledStudents.includes(user.id)).map(c => c.id);
        
        filteredNotifs = thongBao.filter(n => {
            if (giaTriLoc === 'all') {
                return n.target === 'tat-ca-sinh-vien' || dsMaLopCuaToi.includes(n.target);
            } else {
                return n.target === giaTriLoc;
            }
        });
    } else if (vaiTro === 'giang-vien') {
        filteredNotifs = thongBao.filter(n => n.target === 'tat-ca-giang-vien' || n.target === user.id);
    }
    
    let coThayDoi = false;
    if (!user.readNotifs) user.readNotifs = [];
    
    filteredNotifs.forEach(n => {
        if (!user.readNotifs.includes(n.id)) {
            user.readNotifs.push(n.id);
            coThayDoi = true;
        }
    });
    
    if (coThayDoi) {
        ghiCSDL('currentUser', user);
        let dsNguoiDung = layCSDL('Users');
        let vt = dsNguoiDung.findIndex(u => u.id === user.id);
        if (vt > -1) {
            dsNguoiDung[vt].readNotifs = user.readNotifs;
            ghiCSDL('Users', dsNguoiDung);
        }

        // Đồng bộ trạng thái đọc lên database MongoDB Atlas
        fetch(`${API_BASE}/api/nguoi-dung/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ readNotifs: user.readNotifs })
        }).catch(err => console.warn("Lỗi đồng bộ trạng thái đọc lên server:", err));

        capNhatHuyHieuThongBao(user);
        if (vaiTro === 'sinh-vien' && typeof hienThiThongBaoSinhVien === 'function') {
            hienThiThongBaoSinhVien(user);
        } else if (vaiTro === 'giang-vien' && typeof hienThiHopThuDenGiangVien === 'function') {
            hienThiHopThuDenGiangVien(user);
        }
    }
}
