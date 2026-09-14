---
title: "[PortSwigger] Lab 6: Host Validation Bypass via Connection State Attack"
date: 2026-09-14
description: "Khai thác giả định sai lầm của Reverse Proxy trong việc chỉ kiểm tra header Host ở request đầu tiên của persistent connection để bypass kiểm tra và truy cập trang quản trị nội bộ."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
series_order: 6
showAuthor: false
showTableOfContents: true
---

## Thông tin bài Lab
* **Tên bài Lab**: Host validation bypass via connection state attack
* **Chuyên đề**: HTTP Host Header attacks
* **Mức độ**: Practitioner
* **Mục tiêu**: Bypass cơ chế kiểm tra Host header thông qua việc tái sử dụng kết nối HTTP persistent connection, truy cập trang quản trị `/admin` và xóa người dùng `carlos`.

---

## 1. Kiến thức nền tảng

Cơ chế **HTTP Persistent Connection (HTTP Keep-Alive)** trong HTTP/1.1 cho phép client và server tái sử dụng cùng một kết nối TCP để gửi và nhận nhiều HTTP request/response liên tiếp nhằm giảm chi phí thiết lập kết nối (TCP 3-way handshake và TLS negotiation).

Lỗ hổng phát sinh khi các hệ thống đứng trước (như Reverse Proxy hoặc WAF) có giả định sai lầm rằng: **"Tất cả các request trên cùng một kết nối TCP đều thuộc về cùng một phiên hoặc cùng một đích đến (Host)"**. Do đó, proxy chỉ thực hiện kiểm tra bảo mật (ví dụ kiểm tra header `Host`) trên request đầu tiên của kết nối, sau đó chuyển tiếp toàn bộ các request tiếp theo mà bỏ qua việc xác thực.

---

## 2. Mô hình tấn công

```
Attacker                     Reverse Proxy                         Backend Server
   │                               │                                     │
   ├── [Request 1: Host hợp lệ] ──►│ (Kiểm tra Host: Hợp lệ) ───────────►│
   │                               │                                     │
   ├── [Request 2: Host nội bộ] ──►│ (Bỏ qua kiểm tra vì cùng connection)►│ -> Truy cập /admin thành công
```

1. **Request 1**: Attacker gửi một yêu cầu hợp lệ với header `Host: vulnerable-website.com`. Reverse proxy kiểm tra thấy hợp lệ nên mở hoặc tái sử dụng kết nối đến backend.
2. **Request 2**: Trong cùng kết nối TCP này, attacker gửi tiếp request thứ 2 với `Host: 192.168.0.1` (hoặc `localhost`) truy cập `/admin`. Proxy bỏ qua bước kiểm tra Host header của request này, chuyển tiếp thẳng đến backend.

---

## 3. Khai thác lỗ hổng

1. Gửi request bình thường đến trang chủ ứng dụng vào **Burp Repeater**.
2. Thêm request truy cập `/admin` với header `Host: 192.168.0.1` (hoặc domain nội bộ).
3. Sử dụng tính năng **Send group in sequence (single connection)** trong Burp Suite Repeater để gửi cả hai request qua cùng một kết nối TCP duy nhất:
   - Request 1: Yêu cầu thông thường với Host hợp lệ.
   - Request 2: Yêu cầu đến `/admin` với Host nội bộ.
4. Phân tích response từ backend: Request thứ 2 trả về mã trạng thái `200 OK` cho phép truy cập giao diện quản trị Admin Panel.
5. Tiến hành gửi request xóa người dùng `carlos` để hoàn thành bài lab.

---

## 4. Biện pháp khắc phục

1. **Xác thực độc lập cho từng request**: Reverse proxy và WAF tuyệt đối không được giả định các request sau trên cùng kết nối là an toàn; phải kiểm tra và xác thực header `Host` độc lập trên từng HTTP request riêng biệt.
2. **Không tái sử dụng kết nối backend không tin cậy**: Cấu hình reverse proxy cô lập kết nối giữa các phiên người dùng khác nhau, hoặc reset trạng thái định tuyến trước khi chuyển tiếp request mới.
