---
title: "[PortSwigger] HTTP Host Header Attacks Series"
date: 2026-09-14
description: "Tổng hợp phân tích và kỹ thuật khai thác chi tiết chuỗi 6 bài lab về lỗ hổng HTTP Host Header trên PortSwigger Web Security Academy."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
showAuthor: false
showTableOfContents: true
---

Chào mừng bạn đến với chuyên đề **HTTP Host Header Attacks** thuộc chuỗi bài giải lab **PortSwigger Web Security Academy**. 

Lỗ hổng liên quan đến header `Host` phát sinh khi ứng dụng web tin tưởng một cách mù quáng vào giá trị do người dùng kiểm soát mà không thực hiện xác thực (validation) hoặc làm sạch (sanitization) phù hợp, dẫn đến nhiều kịch bản tấn công nghiêm trọng như: **Password Reset Poisoning, Web Cache Poisoning, Routing-based SSRF, và Authentication Bypass**.

---

## Danh sách 6 bài Lab trong Series

| Lab | Tên bài Lab | Mức độ | Kỹ thuật khai thác chính |
| :---: | :--- | :---: | :--- |
| **01** | [Basic password reset poisoning](lab-01-basic-password-reset-poisoning/) | Practitioner | Đầu độc header `Host` trong yêu cầu quên mật khẩu |
| **02** | [Web cache poisoning via ambiguous requests](lab-02-web-cache-poisoning-via-ambiguous-requests/) | Practitioner | Tranh chấp header Host kép (Duplicate Host) đầu độc bộ nhớ đệm |
| **03** | [Host header authentication bypass](lab-03-host-header-authentication-bypass/) | Apprentice | Giả mạo Host truy cập trái phép trang quản trị nội bộ |
| **04** | [Routing-based SSRF](lab-04-routing-based-ssrf/) | Practitioner | Tận dụng reverse proxy định tuyến sai để quét và truy cập mạng nội bộ |
| **05** | [SSRF via flawed request parsing](lab-05-ssrf-via-flawed-request-parsing/) | Expert | Bất đồng bộ phân tích URL giữa reverse proxy và backend server |
| **06** | [Password reset poisoning via dangling markup](lab-06-password-reset-poisoning-via-dangling-markup/) | Expert | Trích xuất token reset qua dangling markup injection khi không có tương tác người dùng |

---

## Cấu trúc phân tích chuẩn cho mỗi bài viết
Mỗi bài giải trong series được chuẩn hóa theo quy trình 4 bước:
1. **Mô tả bài toán & Trinh sát (Reconnaissance)**: Xác định cách ứng dụng xử lý header `Host`.
2. **Cơ chế phát sinh lỗ hổng**: Phân tích luồng dữ liệu (Data Flow) và cấu hình máy chủ dẫn đến điểm yếu.
3. **Khai thác lỗ hổng (PoC Step-by-Step)**: Hướng dẫn thao tác chi tiết qua Burp Suite và mã khai thác thực tế.
4. **Biện pháp khắc phục (Mitigation)**: Cấu hình an toàn cho Web Server / Reverse Proxy (Nginx, Apache) và tầng ứng dụng.
