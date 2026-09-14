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

Lỗ hổng liên quan đến header `Host` phát sinh khi ứng dụng web tin tưởng một cách mù quáng vào giá trị do người dùng kiểm soát mà không thực hiện xác thực hoặc làm sạch phù hợp, dẫn đến nhiều kịch bản tấn công nghiêm trọng như: **Password Reset Poisoning, Web Cache Poisoning, Routing-based SSRF, và Authentication Bypass**.

---

## Danh sách 6 bài Lab trong Series

| Lab | Tên bài Lab | Mức độ | Kỹ thuật khai thác chính |
| :---: | :--- | :---: | :--- |
| **01** | [Basic password reset poisoning](lab-01-basic-password-reset-poisoning/) | Practitioner | Đầu độc header `Host` trong yêu cầu quên mật khẩu |
| **02** | [Host header authentication bypass](lab-02-host-header-authentication-bypass/) | Apprentice | Giả mạo Host truy cập trái phép trang quản trị nội bộ |
| **03** | [Web cache poisoning via ambiguous requests](lab-03-web-cache-poisoning-via-ambiguous-requests/) | Practitioner | Kỹ thuật Duplicate Host Header đầu độc Web Cache |
| **04** | [Routing-based SSRF](lab-04-routing-based-ssrf/) | Practitioner | Tận dụng reverse proxy định tuyến sai để quét và truy cập mạng nội bộ |
| **05** | [SSRF via flawed request parsing](lab-05-ssrf-via-flawed-request-parsing/) | Expert | Bất đồng bộ phân tích URL giữa reverse proxy và backend server |
| **06** | [Password reset poisoning via dangling markup](lab-06-password-reset-poisoning-via-dangling-markup/) | Expert | Trích xuất token reset qua dangling markup injection khi không có tương tác người dùng |

---

## Cấu trúc phân tích chuẩn cho mỗi bài viết
Mỗi bài giải trong series được chuẩn hóa theo cấu trúc 4 phần:
1. **Kiến thức nền tảng**: Cơ chế hoạt động của giao thức, thành phần hệ thống liên quan và bối cảnh bài toán.
2. **Mô hình tấn công**: Sơ đồ luồng dữ liệu và nguyên nhân phát sinh lỗ hổng bảo mật.
3. **Khai thác lỗ hổng**: Chi tiết các bước thực nghiệm, phân tích request/response qua Burp Suite và xây dựng PoC.
4. **Biện pháp khắc phục**: Hướng dẫn vá lỗi, cấu hình an toàn cho tầng Web Server / Reverse Proxy và tầng ứng dụng.
