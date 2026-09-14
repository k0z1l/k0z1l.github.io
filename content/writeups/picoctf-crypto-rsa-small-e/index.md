---
title: "[picoCTF] Crypto - Mini RSA (Small Public Exponent Attack)"
date: 2026-04-10
categories: ["picoCTF Challenges"]
description: "Khai thác thuật toán mã hóa RSA khi số mũ công khai e rất nhỏ (e = 3) mà không cần phân tích thừa số nguyên tố n."
showAuthor: false
showTableOfContents: true
---

## Thông tin thử thách
* **Giải đấu**: picoCTF
* **Thể loại**: Cryptography
* **Điểm số**: 200 pts
* **Độ khó**: Easy - Medium

---

## 1. Cơ sở lý thuyết

Trong hệ mật mã khóa công khai RSA, bản mã $c$ được tính toán từ bản rõ $m$ thông qua công thức:

$$c \equiv m^e \pmod n$$

Thông thường, số mũ công khai $e$ được chọn là $65537$ ($2^{16} + 1$) để đảm bảo an toàn. 

Tuy nhiên, bài toán này cung cấp $e = 3$ và modulus $n$ rất lớn (2048-bit). Vì độ dài của thông điệp $m$ ngắn hơn nhiều so với $n$, ta có khả năng:

$$m^3 < n \implies c = m^3$$

Khi đó, phép đồng dư $\pmod n$ hoàn toàn không xảy ra hiệu ứng quấn vòng (wrap-around). Bản rõ $m$ chỉ đơn giản là căn bậc 3 trực tiếp của bản mã $c$:

$$m = \sqrt[3]{c}$$

---

## 2. Dữ liệu đề bài

```python
# Cho trước:
n = 1042792... # (2048-bit integer)
e = 3
c = 4128591... # ciphertext
```

---

## 3. Lập trình Script giải mã (Python & gmpy2)

Sử dụng thư viện `gmpy2` để tính căn nguyên số lớn chính xác tuyệt đối:

```python
import gmpy2
from Crypto.Util.number import long_to_bytes

# Dữ liệu từ đề bài
e = 3
c = 132487192847192847192847192847192847192847192847192847192847192847192847...

# Tính căn bậc 3 nguyên
m, exact = gmpy2.iroot(c, e)

if exact:
    print("[+] Tìm thấy căn nguyên chính xác!")
    flag = long_to_bytes(int(m)).decode('utf-8')
    print(f"[+] Flag: {flag}")
else:
    print("[-] Không thể khai căn trực tiếp, cần thử với k * n + c")
```

**Kết quả chạy script:**
```bash
$ python3 solve.py
[+] Tìm thấy căn nguyên chính xác!
[+] Flag: picoCTF{sm4ll_3_c4n_b3_d4ng3r0us_88f2b1}
```

---

## 4. Bài học rút ra
* Không bao giờ sử dụng $e$ nhỏ như $e = 3$ mà không áp dụng lược đồ đệm an toàn như **OAEP (Optimal Asymmetric Encryption Padding)**.
* Nếu $m^e < n$, bảo mật của RSA bị phá vỡ hoàn toàn mà không cần phân tích $n = p \times q$.
