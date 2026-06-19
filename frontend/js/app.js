// ==========================================================================
// HỆ THỐNG QUẢN LÝ HỌC TẬP EDU REPORT (CORE APPS ENGINE - HẠT NHÂN HỆ THỐNG)
// TẤT CẢ CÁC HÀM ĐƯỢC CHÚ THÍCH CHI TIẾT TỪNG DÒNG TIẾNG VIỆT CÓ DẤU
// ==========================================================================

// Cấu hình URL cơ sở của backend (Tự động nhận diện chạy localhost hoặc chạy online khi deploy)
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://btl-js.onrender.com'; // Thay URL backend thực tế của bạn sau khi deploy lên Render/Railway

// Đường dẫn cơ sở kết nối đến cụm API xác thực của Backend Express
const DUONG_DAN_API = `${API_BASE}/api/auth`;

// --------------------------------------------------------------------------
// HỆ THỐNG THÔNG BÁO TỰ CHẾ ĐẸP MẮT (CUSTOM PREMIUM ALERT SYSTEM)
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

// --------------------------------------------------------------------------
// HỆ THỐNG SỰ KIỆN CLICK TOÀN CỤC ĐỂ ĐÓNG HỘP THOẠI KHI CLICK RA NGOÀI
// Tự động đóng bất kỳ modal hoặc hộp thoại tùy biến nào khi người dùng click vào vùng nền trống bên ngoài
// --------------------------------------------------------------------------
window.addEventListener('click', function(e) {
    // 1. Kiểm tra nếu click trúng vào lớp nền của một modal thông thường (phần tử có class là "modal")
    if (e.target.classList.contains('modal')) {
        // Thực hiện ẩn hộp thoại bằng cách chuyển thuộc tính display sang 'none'
        e.target.style.display = 'none';
        
        // Tìm kiếm xem trong modal này có chứa thẻ iframe tải tài liệu hay không
        let iframe = e.target.querySelector('iframe');
        // Nếu tìm thấy iframe, tiến hành xóa đường dẫn nguồn src để ngăn tải ngầm hoặc phát âm thanh tiếp diễn
        if (iframe) iframe.src = '';
        
        // Tìm kiếm xem trong modal này có chứa thẻ phát video nào đang chạy hay không
        let video = e.target.querySelector('video');
        // Nếu tìm thấy video, tiến hành tạm dừng phát để tránh âm thanh chạy ngầm khi modal đã đóng
        if (video) video.pause();
        
        // Tìm kiếm xem trong modal này có chứa thẻ phát nhạc/âm thanh nào đang chạy hay không
        let audio = e.target.querySelector('audio');
        // Nếu tìm thấy audio, tiến hành tạm dừng phát để tránh âm thanh chạy ngầm khi modal đã đóng
        if (audio) audio.pause();
    }
    
    // 2. Kiểm tra nếu click trúng vào lớp nền của custom alert/confirm (phần tử có class là "custom-alert-overlay")
    if (e.target.classList.contains('custom-alert-overlay')) {
        // Thực hiện ẩn hộp thoại alert/confirm bằng cách gỡ bỏ class hiển thị 'show'
        e.target.classList.remove('show');
        
        // Kiểm tra nếu đây là hộp thoại thông báo Alert và có gắn kèm hàm gọi lại callback
        if (e.target.id === 'customAlertOverlay' && typeof e.target.datasetCallback === 'function') {
            // Lưu trữ tạm thời hàm callback đã được đăng ký trước đó
            let callback = e.target.datasetCallback;
            // Tiến hành xóa thuộc tính callback trên phần tử DOM để tránh việc gọi lặp lại không mong muốn
            e.target.datasetCallback = null;
            // Thực thi hàm callback sau khoảng thời gian trễ 300ms tương thích với hoạt ảnh ẩn CSS
            setTimeout(() => { callback(); }, 300);
        }
    }
});

// --------------------------------------------------------------------------
// 1. CƠ SỞ DỮ LIỆU LOCALSTORAGE & TRUY XUẤT (DATABASE & HELPERS)
// --------------------------------------------------------------------------

// Hàm lấy dữ liệu từ LocalStorage theo khóa tương ứng
function layCSDL(khoa) {
    // Trả về mảng đối tượng phân tích từ chuỗi JSON hoặc mảng rỗng nếu chưa tồn tại
    return JSON.parse(localStorage.getItem(khoa)) || [];
}

// Hàm ghi mảng dữ liệu vào LocalStorage dưới dạng chuỗi JSON
function ghiCSDL(khoa, duLieu) {
    // Chuyển đổi dữ liệu đối tượng sang chuỗi JSON để lưu trữ cục bộ
    localStorage.setItem(khoa, JSON.stringify(duLieu));
}

// Hàm tìm và cập nhật thông tin lớp học cụ thể trong cơ sở dữ liệu offline
function capNhatLopCSDL(maLop, hamCapNhat) {
    // Lấy toàn bộ danh sách lớp học hiện tại từ LocalStorage
    let danhSachLop = layCSDL('Classes');
    // Tìm đối tượng lớp học khớp với mã lớp yêu cầu
    let lopCanTim = danhSachLop.find(l => l.id === maLop);
    // Nếu lớp tồn tại, thực thi hàm callback để cập nhật và lưu lại
    if (lopCanTim) { 
        hamCapNhat(lopCanTim, danhSachLop); 
        ghiCSDL('Classes', danhSachLop); 
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
            // Đọc tệp tin dạng văn bản thuần và hiển thị gọn trong khung cuộn pre
            let reader = new FileReader();
            reader.onload = function(e) {
                containerElement.innerHTML = `<pre style="width: 100%; max-height: 400px; overflow-y: auto; background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; word-break: break-all; text-align: left; margin-top: 10px; line-height: 1.5;">${e.target.result}</pre>`;
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
    // Xóa đối tượng người dùng hiện tại trong LocalStorage
    localStorage.removeItem('currentUser'); 
    // Chuyển hướng trình duyệt về lại trang đăng nhập index.html
    window.location.href = 'index.html'; 
}

// Hàm hiển thị hộp thoại modal theo ID phần tử
function moHopThoai(idModal) { 
    // Tìm phần tử HTML của hộp thoại modal
    let el = document.getElementById(idModal);
    // Chuyển thuộc tính hiển thị sang block để hiện lên màn hình
    if (el) el.style.display = 'block'; 
}

// Hàm ẩn hộp thoại modal theo ID phần tử
function dongHopThoai(idModal) { 
    // Tìm phần tử HTML của hộp thoại modal
    let el = document.getElementById(idModal);
    // Chuyển thuộc tính hiển thị sang none để ẩn đi
    if (el) el.style.display = 'none'; 
}

// --------------------------------------------------------------------------
// 2. KHỞI TẠO GIAO DIỆN CHUNG & PROFILE CÁ NHÂN (UI INITIALIZATION)
// --------------------------------------------------------------------------

// Hàm đăng ký các sự kiện cơ bản cho giao diện chung của Dashboard
function khoiTaoGiaoDienChung() {
    // Đăng ký sự kiện click cho nút đóng modal (dấu nhân hoặc nút hủy)
    document.querySelectorAll('.close-modal').forEach(nut => {
        nut.addEventListener('click', function() { 
            // Ẩn hộp thoại modal chứa nút đó
            this.closest('.modal').style.display = 'none'; 
        });
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
            let mucTieu = document.getElementById(this.getAttribute('data-target'));
            if (mucTieu) mucTieu.style.display = 'block';
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
            
            // Cập nhật mật khẩu nếu người dùng nhập mật khẩu mới
            if (matKhauMoi !== '') {
                nguoiDung.password = matKhauMoi;
            }
            // Cập nhật số điện thoại và ngày sinh
            nguoiDung.phone = formSua.elements['phone'].value.trim();
            nguoiDung.dob = formSua.elements['dob'].value;
            
            // Ghi nhận thông tin người dùng đăng nhập mới vào phiên hiện tại
            localStorage.setItem('currentUser', JSON.stringify(nguoiDung)); 
            
            // Đồng bộ cập nhật thông tin vào danh sách Users trong LocalStorage
            let danhSachNguoiDung = layCSDL('Users');
            let viTri = danhSachNguoiDung.findIndex(u => u.id === nguoiDung.id); 
            if (viTri > -1) {
                danhSachNguoiDung[viTri] = nguoiDung; 
                ghiCSDL('Users', danhSachNguoiDung);
            }
            
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
    // Thay thế ký tự xuống dòng bằng thẻ breakline HTML
    let vanBan = noiDung.replace(/\n/g, '<br>');
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
        // Lọc thông báo gửi chung cho tất cả giảng viên
        let tbGiangVien = thongBao.filter(n => n.target === 'tat-ca-giang-vien');
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
        let xemTruoc = n.text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
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
        
        return `
            <div class="border-box border-left-dark mb-10 cursor-pointer ${lopNen}" onclick="moHopThoaiDocThongBao('${n.id}')">
                <div class="flex-row justify-between mb-10" style="flex-wrap: wrap; gap: 4px;">
                    <span class="${lopChu} font-bold flex-row align-center" style="flex-wrap: wrap; gap: 4px;">${n.senderName} ${nhanhBaiTap} ${dotDo}</span>
                    <span class="text-muted text-sm">${n.date}</span>
                </div>
                <p class="${checkDaDoc ? 'text-muted' : ''}" style="white-space: pre-line; line-height: 1.5;">${xemTruoc}</p>
            </div>
        `;
    }).join('');
    
    // Đổ mã HTML vào phân vùng hiển thị hoặc thông báo trống
    vungChua.innerHTML = html || '<p class="border-box">Chưa có thông báo nào.</p>';
}

// Hàm mở và xem nội dung chi tiết của một thông báo, đồng thời đánh dấu đã đọc
function moHopThoaiDocThongBao(idThongBao) {
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
            localStorage.setItem('currentUser', JSON.stringify(nguoiDung));
            
            // Đồng bộ trạng thái đã đọc vào danh sách tài khoản cục bộ
            let dsNguoiDung = layCSDL('Users');
            let vt = dsNguoiDung.findIndex(u => u.id === nguoiDung.id);
            if (vt > -1) {
                dsNguoiDung[vt].readNotifs = nguoiDung.readNotifs;
                ghiCSDL('Users', dsNguoiDung);
            }
            
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
    // Kiểm tra nếu thông báo này là thông báo đăng tài liệu/bài tập (có materialId)
    // Nếu đúng: mở modal xem chi tiết thay vì modal thông báo thông thường
    // -----------------------------------------------------------------------
    if (tb.materialId) {
        // Tìm thông tin tài liệu trong CSDL Materials
        let materials = layCSDL('Materials');
        let baiTap = materials.find(m => m.id === tb.materialId);

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
    
    // Thiết lập hành động đặc thù (nếu có ví dụ sửa/xóa đối với giảng viên gửi thông báo)
    let vungHanhDong = document.getElementById('readNotifActions');
    if (vungHanhDong) vungHanhDong.innerHTML = '';
    
    // Bật hiển thị modal thông báo chi tiết
    moHopThoai('readNotifModal');
}

// Hàm mở modal xem chi tiết bài tập (hiển thị đầy đủ nội dung + file đính kèm để xem trực tiếp)
function moModalChiTietBaiTap(baiTap, nguoiDung) {
    // Lấy các phần tử modal xem bài tập
    let modal = document.getElementById('assignmentDetailModal');
    if (!modal) {
        // Nếu modal chưa tồn tại trên trang, tạo mới và chèn vào body
        taoModalChiTietBaiTap();
        modal = document.getElementById('assignmentDetailModal');
    }

    // Điền tiêu đề bài tập vào modal
    let elTitle = document.getElementById('adm-title');
    if (elTitle) elTitle.textContent = baiTap.title;

    // Điền ngày giao bài tập
    let elDate = document.getElementById('adm-date');
    if (elDate) elDate.textContent = `📅 Ngày giao: ${baiTap.date}`;

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
            elFile.innerHTML = `
                <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-top: 16px;">
                    <div class="flex-row align-center justify-between" style="border-bottom: 1px dashed #86efac; padding-bottom: 10px; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                        <div class="flex-row align-center" style="gap: 10px;">
                            <span style="font-size: 28px;">${iconFile}</span>
                            <div>
                                <p class="font-bold text-primary" style="font-size: 14px; margin: 0;">📎 File đính kèm từ giảng viên:</p>
                                <p class="font-bold" style="word-break: break-all; margin: 0; font-size: 13px;">${baiTap.fileName}</p>
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
                    <a href="${baiTap.link}" target="_blank" class="text-primary font-bold" style="text-decoration: underline; word-break: break-all;">${baiTap.link}</a>
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

            if (daNop) {
                // Đã nộp: hiển thị trạng thái và nút nộp lại
                elNopBai.innerHTML = `
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <span style="background: #10b981; color: white; border-radius: 8px; padding: 6px 14px; font-weight: 700; font-size: 13px;">✅ Đã nộp bài</span>
                        <button onclick="dongHopThoai('assignmentDetailModal'); moModalNopBai('${baiTap.id}', '${baiTap.title.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
                            style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-weight: 700; cursor: pointer; font-size: 13px;">
                            🔄 Nộp lại
                        </button>
                    </div>
                `;
            } else {
                // Chưa nộp: hiển thị nút nộp bài nổi bật
                elNopBai.innerHTML = `
                    <button onclick="dongHopThoai('assignmentDetailModal'); moModalNopBai('${baiTap.id}', '${baiTap.title.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" 
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

    // Mở modal chi tiết bài tập
    modal.style.display = 'block';
}

// Hàm tạo động modal xem chi tiết bài tập nếu chưa tồn tại trong HTML
function taoModalChiTietBaiTap() {
    let modal = document.createElement('div');
    modal.id = 'assignmentDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 32px;">
            <span class="close-modal" onclick="dongHopThoai('assignmentDetailModal')">&times;</span>
            
            <!-- Header bài tập -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
                <span style="font-size: 32px;">📋</span>
                <div>
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; font-size: 10px; font-weight: 800; border-radius: 6px; padding: 2px 10px; letter-spacing: 1px; display: inline-block; margin-bottom: 6px;">BÀI TẬP</div>
                    <h2 id="adm-title" class="text-primary" style="margin: 0; font-size: 20px; line-height: 1.4;"></h2>
                </div>
            </div>
            <p id="adm-date" class="text-muted text-sm mb-20" style="margin-left: 44px;"></p>

            <!-- Mô tả / Đề bài -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 18px; border-left: 4px solid #6366f1; margin-bottom: 8px;">
                <p class="font-bold text-primary mb-10" style="font-size: 14px;">📝 Nội dung bài tập:</p>
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

// --------------------------------------------------------------------------
// 4. KHỞI TẠO CƠ SỞ DỮ LIỆU NGOẠI TUYẾN MẪU (LOCAL STORAGE OFFLINE SEEDING)
// --------------------------------------------------------------------------
function khoiTaoDuLieuMau() {
    let dataVersion = localStorage.getItem('DataVersion');
    // Nếu phiên bản dữ liệu cũ hơn 7, xóa sạch cache để cập nhật dữ liệu Việt hóa mới và tài khoản admin đơn giản
    if (dataVersion !== '7') {
        localStorage.removeItem('Users');
        localStorage.removeItem('Subjects');
        localStorage.removeItem('Classes');
        localStorage.removeItem('Notifications');
        localStorage.setItem('DataVersion', '7');
    }

    // Gieo mầm dữ liệu tài khoản mẫu cục bộ (hỗ trợ chế độ offline)
    if (!localStorage.getItem('Users')) {
        ghiCSDL('Users', [
            { id: 'AD001', role: 'admin', name: 'Quản trị viên HT', email: 'admin', password: 'admin', dob: '1990-01-01', phone: '0999888777', readNotifs: [] },
            { id: 'GV001', role: 'giang-vien', name: 'ThS. Nguyễn Văn A', email: 'giaovien', password: 'giaovien', dob: '1985-05-10', phone: '0988111222', readNotifs: [] },
            { id: 'SV202501', role: 'sinh-vien', name: 'Nguyễn Hữu Quyết', email: 'sinhvien', password: 'sinhvien', dob: '2005-01-15', phone: '0901000001', readNotifs: [] }
        ]);
    }
    
    // Khởi tạo danh mục môn học ngành CNTT
    if (!localStorage.getItem('Subjects')) {
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
    if (!localStorage.getItem('Classes')) {
        let thoiGian = Date.now();
        let maLopWeb = 'WEB_' + thoiGian;
        let maLopCtdl = 'CTDL_' + (thoiGian + 100);
        let maLopCsdl = 'CSDL_' + (thoiGian + 200);
        let maLopOop = 'OOP_' + (thoiGian + 300);
        let maLopAi = 'AI_' + (thoiGian + 400);
        let maLopUiUx = 'UIUX_' + (thoiGian + 500);
        
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
    if (!localStorage.getItem('Notifications')) {
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
    if (localStorage.getItem('RegistrationOpen') === null) {
        localStorage.setItem('RegistrationOpen', JSON.stringify(true));
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
                // Lưu thông tin người dùng hiện tại vào LocalStorage
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // Đồng bộ cập nhật thông tin tài khoản này vào CSDL offline
                let users = layCSDL('Users');
                let vt = users.findIndex(u => u.id === data.user.id);
                if (vt === -1) {
                    users.push({ ...data.user, password: passwordValue });
                } else {
                    users[vt] = { ...users[vt], ...data.user, password: passwordValue };
                }
                ghiCSDL('Users', users);
                
                // Chuyển hướng trực tiếp không qua hộp thoại thông báo alert
                chuyenHuongTrangQuanLy(roleValue);
            } else {
                console.warn("Đăng nhập trực tuyến thất bại. Tiến hành kiểm tra tài khoản ngoại tuyến...");
                let users = layCSDL('Users');
                let user = users.find(u => (u.email === emailValue || u.id === emailValue) && u.password === passwordValue && u.role === roleValue);
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    chuyenHuongTrangQuanLy(roleValue);
                    return;
                }
                alert(data.message || "Sai thông tin đăng nhập!");
            }
        } catch (error) {
            console.warn("Lỗi kết nối. Đăng nhập ngoại tuyến...");
            let users = layCSDL('Users');
            let user = users.find(u => (u.email === emailValue || u.id === emailValue) && u.password === passwordValue && u.role === roleValue);
            
            if (user) { 
                localStorage.setItem('currentUser', JSON.stringify(user)); 
                chuyenHuongTrangQuanLy(roleValue);
            } else {
                alert("Thông tin tài khoản hoặc mật khẩu không chính xác!"); 
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
document.addEventListener('DOMContentLoaded', () => {
    let user = layCSDL('currentUser');
    let duongDanTrang = window.location.pathname;

    // Tự động đồng bộ danh sách tài khoản từ MongoDB về LocalStorage để cả 3 phân quyền luôn khớp dữ liệu với nhau
    if (user) {
        // 1. Đồng bộ tài khoản người dùng
        fetch(`${API_BASE}/api/nguoi-dung`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    ghiCSDL('Users', data.users);
                    if (duongDanTrang.includes('admin.html') && typeof hienThiDanhSachTaiKhoan === 'function') {
                        hienThiDanhSachTaiKhoan();
                    } else if (duongDanTrang.includes('teacher-dashboard.html') && typeof hienThiBaoCaoGiangVien === 'function') {
                        hienThiBaoCaoGiangVien(user);
                    } else if (duongDanTrang.includes('student-dashboard.html') && typeof hienThiBaoCaoHocTapSinhVien === 'function') {
                        hienThiBaoCaoHocTapSinhVien(user);
                    }
                }
            })
            .catch(err => console.warn("Chạy ngoại tuyến. Không thể đồng bộ tài khoản từ MongoDB Atlas."));

        // 2. Đồng bộ danh sách thông báo hệ thống
        fetch(`${API_BASE}/api/thong-bao`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    ghiCSDL('Notifications', data.notifications);
                    // Cập nhật lại giao diện hòm thư của từng vai trò
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
            .catch(err => console.warn("Chạy ngoại tuyến. Không thể đồng bộ thông báo từ MongoDB Atlas."));

        // 3. Đồng bộ danh sách tài liệu giảng dạy và bài tập lớp học
        fetch(`${API_BASE}/api/tai-lieu`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Lưu tài liệu vào LocalStorage để đồng bộ hiển thị
                    ghiCSDL('Materials', data.materials);
                    // Nếu đang ở trang giảng viên và tab chi tiết lớp học đang hoạt động, làm mới lại danh sách tài liệu
                    if (duongDanTrang.includes('teacher-dashboard.html')) {
                        let classDetailTab = document.getElementById('class-detail-tab');
                        if (classDetailTab && classDetailTab.style.display === 'block' && typeof hienThiTaiLieuGiangVien === 'function') {
                            hienThiTaiLieuGiangVien();
                        }
                    }
                }
            })
            .catch(err => console.warn("Chạy ngoại tuyến. Không thể đồng bộ tài liệu từ MongoDB Atlas."));

        // 4. Đồng bộ danh sách bài tập sinh viên nộp trực tuyến
        fetch(`${API_BASE}/api/nop-bai`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Lưu danh sách bài tập đã nộp vào Local CSDL
                    ghiCSDL('Submissions', data.submissions);
                }
            })
            .catch(err => console.warn("Chạy ngoại tuyến. Không thể đồng bộ danh sách bài nộp từ MongoDB Atlas."));
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
