---
title: "[PortSwigger] HTTP Request Smuggling Series"
date: 2026-09-22
description: "Tổng hợp các bài giải chi tiết và phân tích chuyên sâu về lỗ hổng HTTP Request Smuggling trên PortSwigger Web Security Academy: kiến thức nền tảng, mô hình tấn công, kỹ thuật khai thác và biện pháp khắc phục."
categories: ["PortSwigger Labs"]
series: ["HTTP Request Smuggling"]
showAuthor: false
showTableOfContents: true
---

Chào mừng bạn đến với chuyên đề **HTTP Request Smuggling** thuộc chuỗi bài giải lab **PortSwigger Web Security Academy**.

HTTP Request Smuggling là một kỹ thuật tấn công can thiệp vào cách chuỗi các máy chủ HTTP (chẳng hạn như Front-end Reverse Proxy / Load Balancer và Back-end Server) xử lý luồng dữ liệu HTTP được gửi đến qua cùng một kết nối TCP dùng chung (HTTP Keep-Alive / Pipelining). 

Lỗ hổng phát sinh khi Front-end và Back-end không thống nhất về ranh giới giữa các request liên tiếp, chủ yếu do sự bất đồng bộ trong việc xử lý hai header xác định độ dài gói tin: `Content-Length` và `Transfer-Encoding`. Kẻ tấn công có thể "buộc" máy chủ xử lý một phần request của mình như là phần mở đầu của request tiếp theo đến từ người dùng khác, dẫn đến các hậu quả nghiêm trọng: bypass kiểm soát truy cập, đánh cắp phiên làm việc của người dùng khác, Web Cache Poisoning, hoặc thực thi mã độc XSS.

---

## Cấu trúc phân tích chuẩn cho mỗi bài viết

Tất cả các bài giải trong series đều tuân thủ cấu trúc 4 phần chuẩn hóa:
1. **Kiến thức nền tảng**: Cơ chế hoạt động của giao thức, cách phân tích cú pháp header và ranh giới thông điệp HTTP.
2. **Mô hình tấn công**: Sơ đồ luồng dữ liệu, phân tích sự bất đồng bộ giữa Front-end và Back-end.
3. **Khai thác lỗ hổng**: Chi tiết các bước thực nghiệm, phân tích request/response bằng Burp Suite (Repeater, Turbo Intruder, HTTP/2).
4. **Biện pháp khắc phục**: Hướng dẫn cấu hình an toàn cho máy chủ chuyển tiếp và máy chủ backend, chuẩn hóa giao thức HTTP/2 từ đầu cuối đến đầu cuối (end-to-end).

---

## Danh sách các bài Lab trong Series

| Lab | Tên bài Lab | Mức độ | Kỹ thuật khai thác chính |
| :---: | :--- | :---: | :--- |
| **01** | [HTTP request smuggling, basic CL.TE vulnerability](lab-01-HTTP%20request%20smuggling-basic%20CL.TE%20vulnerability/) | Apprentice | Khai thác bất đồng bộ CL.TE làm biến dạng phương thức yêu cầu tiếp theo thành `GPOST` |

*Các bài lab tiếp theo sẽ liên tục được cập nhật tại đây.*
