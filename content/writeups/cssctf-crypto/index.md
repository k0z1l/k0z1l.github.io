---
title: '[CSSCTF] Cryptography Challenges Writeup'
date: '2026-10-02'
description: Tổng hợp writeup chi tiết các thử thách Cryptography trong giải đấu CSSCTF.
categories: [CSSCTF, Cryptography]
tags: [cssctf, crypto, rsa, lattice, elliptic-curve]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] Cryptography Challenges Writeup

**Thể loại:** k0z1l
**Thể loại:** Cryptography  
**Định dạng Flag:** `CSSCTF{...}`

---

## Mục lục
1. [Chrono I](#1-chrono-i)
   - [1.1. Mô tả thử thách & Dữ kiện](#11-mô-tả-thử-thách--dữ-kiện)
   - [1.2. Phân tích mật mã (Cryptanalysis)](#12-phân-tích-mật-mã-cryptanalysis)
   - [1.3. Mã nguồn khai thác có chú thích (Python)](#13-mã-nguồn-khai-thác-có-chú-thích-python)
   - [1.4. Flag](#14-flag)
2. [Chrono II](#2-chrono-ii)
   - [2.1. Mô tả thử thách & Bối cảnh](#21-mô-tả-thử-thách--bối-cảnh)
   - [2.2. Khảo sát dữ liệu & Thu thập mẫu](#22-khảo-sát-dữ-liệu--thu-thập-mẫu)
   - [2.3. Phân tích cơ chế bánh răng (The Clockwork Mechanism)](#23-phân-tích-cơ-chế-bánh-răng-the-clockwork-mechanism)
   - [2.4. Tái tạo dòng khóa (Keystream Reconstruction)](#24-tái-tạo-dòng-khóa-keystream-reconstruction)
   - [2.5. Mã nguồn khai thác có chú thích (Python)](#25-mã-nguồn-khai-thác-có-chú-thích-python)
   - [2.6. Flag](#26-flag)
3. [Chimera Vault](#3-chimera-vault)
   - [3.1. Mô tả thử thách & Bối cảnh](#31-mô-tả-thử-thách--bối-cảnh)
   - [3.2. Kiến trúc & Mô hình bảo mật của Chimera Vault](#32-kiến-trúc--mô-hình-bảo-mật-của-chimera-vault)
   - [3.3. Phân tích mật mã & Điểm yếu từng giai đoạn](#33-phân-tích-mật-mã--điểm-yếu-từng-giai-đoạn)
     - [3.3.1. Phase 1: Acoustic Carrier Synchronization (Giải điều chế âm thanh số)](#331-phase-1-acoustic-carrier-synchronization-giải-điều-chế-âm-thanh-số)
     - [3.3.2. Phase 2: Non-Commutative Matrix Drift Telemetry (Tính bất biến của Vết ma trận)](#332-phase-2-non-commutative-matrix-drift-telemetry-tính-bất-biến-của-vết-ma-trận)
     - [3.3.3. Phase 3: Resonant Knapsack Intercept (Thám mã Merkle-Hellman)](#333-phase-3-resonant-knapsack-intercept-thám-mã-merkle-hellman)
   - [3.4. Chiến lược khai thác đầu-cuối (End-to-End Exploit Pipeline)](#34-chiến-lược-khai-thác-đầu-cuối-end-to-end-exploit-pipeline)
   - [3.5. Mã nguồn khai thác hoàn chỉnh (Python)](#35-mã-nguồn-khai-thác-hoàn-chỉnh-python)
   - [3.6. Flag](#36-flag)
4. [Severed Symmetry](#4-severed-symmetry)
   - [4.1. Mô tả thử thách & Bối cảnh](#41-mô-tả-thử-thách--bối-cảnh)
   - [4.2. Kiến trúc & Cấu trúc đại số của hệ mật mã](#42-kiến-trúc--cấu-trúc-đại-số-của-hệ-mật-mã)
   - [4.3. Phân tích mật mã & Chuỗi khai thác 5 giai đoạn (Cryptanalysis)](#43-phân-tích-mật-mã--chuỗi-khai-thác-5-giai-đoạn-cryptanalysis)
     - [4.3.1. Giai đoạn 1: Triệt tiêu bậc cao bằng Hạt nhân trái (Left Nullspace Degree Elimination)](#431-giai-đoạn-1-triệt-tiêu-bậc-cao-bằng-hạt-nhân-trái-left-nullspace-degree-elimination)
     - [4.3.2. Giai đoạn 2: Cô lập không gian biến đáy qua Gradient phần bậc 4 (Subspace Isolation)](#432-giai-đoạn-2-cô-lập-không-gian-biến-đáy-qua-gradient-phần-bậc-4-subspace-isolation)
     - [4.3.3. Giai đoạn 3: Tuyến tính hóa biến u và sự sụp đổ bậc của hệ phương trình](#433-giai-đoạn-3-tuyến-tính-hóa-biến-u-và-sự-sụp-đổ-bậc-của-hệ-phương-trình)
     - [4.3.4. Giai đoạn 4: Bẻ gãy tính đối xứng UOV - Khôi phục không gian Oil (Kipnis-Shamir Kernel Attack)](#434-giai-đoạn-4-bẻ-gãy-tính-đối-xứng-uov---khôi-phục-không-gian-oil-kipnis-shamir-kernel-attack)
     - [4.3.5. Giai đoạn 5: Vét cạn Vinegar & Khử Gauss siêu tốc (High-Performance C Solver)](#435-giai-đoạn-5-vét-cạn-vinegar--khử-gauss-siêu-tốc-high-performance-c-solver)
   - [4.4. Chiến lược khai thác đầu-cuối (End-to-End Exploit Pipeline)](#44-chiến-lược-khai-thác-đầu-cuối-end-to-end-exploit-pipeline)
   - [4.5. Mã nguồn khai thác hoàn chỉnh (C & Python)](#45-mã-nguồn-khai-thác-hoàn-chỉnh-c--python)
   - [4.6. Flag](#46-flag)
5. [Tổng kết & Bài học kinh nghiệm](#5-tổng-kết--bài-học-kinh-nghiệm)

---

## 1. Chrono I

### 1.1. Mô tả thử thách & Dữ kiện
> *We have intercepted a message and a Ciphertext, please help us crack the Ciphertext!*  
> **Message:** `2026/09/21 14:35:07 - "As always, The time is always the key to unlock it"`  
> **Ciphertext:** `ESUITO{gwfvb_xejqnf_nimgt_b_whhrlv}`  
> **Flag Format:** `CSSCTF{...}`

---

### 1.2. Phân tích mật mã (Cryptanalysis)

#### 1. Ý nghĩa gợi ý:
- Tên thử thách: **Chrono** (gốc Hy Lạp *Khronos* nghĩa là thời gian).
- Thông điệp đi kèm: *"The time is always the key to unlock it"* $\rightarrow$ Toàn bộ các chữ số của mốc thời gian `2026/09/21 14:35:07` chính là chìa khóa giải mã (Key).

#### 2. Tấn công bản rõ đã biết (Known-Plaintext Attack):
Định dạng cờ của cuộc thi luôn bắt đầu bằng tiền tố `CSSCTF{...}`. So khớp với 6 chữ cái đầu của Ciphertext `ESUITO{...}`:
- Bản mã ($C$): `E S U I T O`
- Bản rõ ($P$): `C S S C T F`

Tính độ dịch chuyển $\text{Shift}_i = (C_i - P_i) \pmod{26}$ trên bảng chữ cái Latin ($A=0, B=1, \dots, Z=25$):

| Vị trí $i$ | Bản mã ($C_i$) | Giá trị số $C_i$ | Bản rõ ($P_i$) | Giá trị số $P_i$ | Bước dịch ($C_i - P_i$) | Chữ số tương ứng trong mốc thời gian |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 0 | **E** | 4 | **C** | 2 | $4 - 2 =$ **2** | **2** (năm 2026) |
| 1 | **S** | 18 | **S** | 18 | $18 - 18 =$ **0** | **0** (năm 2026) |
| 2 | **U** | 20 | **S** | 18 | $20 - 18 =$ **2** | **2** (năm 2026) |
| 3 | **I** | 8 | **C** | 2 | $8 - 2 =$ **6** | **6** (năm 2026) |
| 4 | **T** | 19 | **T** | 19 | $19 - 19 =$ **0** | **0** (tháng 09) |
| 5 | **O** | 14 | **F** | 5 | $14 - 5 =$ **9** | **9** (tháng 09) |

Chuỗi bước dịch thu được: `2, 0, 2, 6, 0, 9` hoàn toàn trùng khớp với các chữ số đầu tiên của mốc thời gian `20260921143507`.

#### 3. Thuật toán mã hóa:
- Đây là thuật toán mã hóa dịch chuyển đa bảng tuần hoàn (**Vigenère Cipher / Polyalphabetic Shift**) với khóa là chuỗi 14 chữ số thời gian:
  $$K = [2, 0, 2, 6, 0, 9, 2, 1, 1, 4, 3, 5, 0, 7]$$
- Chỉ các ký tự chữ cái ($a-z, A-Z$) mới bị dời bước, các ký tự đặc biệt (`{`, `}`, `_`) được giữ nguyên không đổi và **không làm tăng chỉ số khóa**.
- Công thức giải mã tại ký tự thứ $j$:
  $$P_j = (C_j - \text{base} - K_{k \pmod{14}}) \pmod{26} + \text{base}$$

---

### 1.3. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""Chrono I Solution Script

Mục đích: Giải mã bản mã Vigenère với khóa là chuỗi chữ số mốc thời gian.
"""

# Bản mã chặn được từ đề bài
ciphertext = "ESUITO{gwfvb_xejqnf_nimgt_b_whhrlv}"

# Khóa giải mã trích xuất từ mốc thời gian "2026/09/21 14:35:07"
digits = "20260921143507"

plaintext = []
key_idx = 0  # Con trỏ duyệt qua chuỗi số của khóa

for char in ciphertext:
  # Chỉ thực hiện dịch chuyển nếu ký tự là chữ cái
  if char.isalpha():
    # Lấy bước dịch tương ứng từ chuỗi khóa (lặp tuần hoàn 14 chữ số)
    shift = int(digits[key_idx % len(digits)])

    # Xác định giá trị ASCII gốc (A=65 cho chữ hoa, a=97 cho chữ thường)
    base = ord("A") if char.isupper() else ord("a")

    # Dịch ngược lại bước shift trong không gian modulo 26
    decrypted_char = chr((ord(char) - base - shift) % 26 + base)
    plaintext.append(decrypted_char)

    # Tăng con trỏ khóa khi gặp ký tự chữ cái
    key_idx += 1
  else:
    # Giữ nguyên các ký tự phân cách như '{', '}', '_'
    plaintext.append(char)

# Ghép danh sách ký tự thành chuỗi cờ hoàn chỉnh
flag = "".join(plaintext)
print(f"[+] Flag: {flag}")
```

### 1.4. Flag
$$\mathbf{CSSCTF\{every\_second\_hides\_a\_secret\}}$$

---

## 2. Chrono II

### 2.1. Mô tả thử thách & Bối cảnh
> *We have again intercepted their talk and the cipher text, but this time it seems like its always changing. Help us!*  
> *"The Time is ticking, it will never stop, no one will ever decrypt it"*  
> **Dịch vụ trực tuyến:** `http://34.116.80.78:8001`  
> **Flag Format:** `CSSCTF{...}`

---

### 2.2. Khảo sát dữ liệu & Thu thập mẫu

Khi truy cập vào máy chủ dịch vụ, trang web mô phỏng giao diện xưởng chế tạo đồng hồ (*Clockmaker's Workshop*):
- Câu gợi ý then chốt: *"Gears are beautiful. A few turning together can tell the time."* (Những bánh răng thật đẹp. Một vài bánh răng cùng quay có thể đếm được thời gian).
- Tốc độ phát mã: **1 Hz** (cứ mỗi giây máy chủ lại phát ra một bản mã khác nhau).
- Endpoint `/api/feed` và nút tải `/capture.json` cung cấp lịch sử 60 giây liên tiếp gồm mốc thời gian UTC và ciphertext.

Lấy mẫu ciphertext tại một số giây liên tiếp:
```text
2026-09-30T07:07:55Z -> SWBFVN{bu0_mq9hr_c8r1sj1ee_5cixb_i2h8tq}
2026-09-30T07:07:56Z -> LCSKBG{et0_fu0ks_c8n7zg4dz_1wquh_z3h4ai}
2026-09-30T07:07:57Z -> MXBHAQ{ym1_it8pw_t0q9pr2wa_9iegf_v6l0qt}
```

#### Phân tích cấu trúc bản mã (Position-wise Invariance):
Kiểm tra đặc tính từng vị trí (tổng độ dài cố định 40 ký tự) qua 60 mẫu:
1. **Dấu phân cách cố định:** Dấu ngoặc `{` (vị trí 6), `}` (vị trí 39) và dấu gạch dưới `_` (vị trí 10, 16, 26, 32) **không bao giờ thay đổi**.
2. **Ký tự chữ in hoa:** 6 ký tự đầu (vị trí 0..5) **luôn luôn là chữ hoa** $\rightarrow$ tương ứng tiền tố `CSSCTF`.
3. **Phân vùng loại ký tự bất biến:** 
   - Vị trí chữ số ($0-9$): 9, 13, 18, 20, 23, 27, 34, 36 luôn luôn chỉ chứa chữ số qua mọi giây.
   - Vị trí chữ thường ($a-z$): Các vị trí còn lại luôn luôn chỉ chứa chữ thường.
4. **Kết luận về bảng mã dịch chuyển:** Hệ thống thực hiện mã hóa dịch chuyển độc lập theo từng tập ký tự:
   - Chữ cái (hoa/thường): Dịch modulo $26$.
   - Chữ số ($0-9$): Dịch modulo $10$.

---

### 2.3. Phân tích cơ chế bánh răng (The Clockwork Mechanism)

#### Bước 1: Tính toán bước dịch từ tiền tố `CSSCTF`
Do biết trước 6 ký tự đầu của bản rõ luôn là `CSSCTF`, ta có thể tính chính xác giá trị dịch chuyển $S(t, p)$ tại mỗi giây $t$ cho các cột $p \in [0, 5]$:
$$S(t, p) = (C[t][p] - \text{"CSSCTF"}[p]) \pmod{26}$$

#### Bước 2: Tìm mối tương quan độ lệch pha giữa các cột ($\Delta t = 34$)
So sánh chuỗi dịch chuyển theo thời gian của cột $p$ và cột kế tiếp $p+1$, ta phát hiện một quy luật đồng bộ hoàn hảo:
$$S(t + 34, p + 1) = S(t, p)$$

*Giải thích trực quan:* Khi xét sang ký tự tiếp theo trong chuỗi bản mã, bước dịch chuyển tương đương với trạng thái của ký tự trước đó bị dịch trễ đi đúng **34 bước thời gian (34 giây)**!

#### Bước 3: Tìm chu kỳ tuần hoàn toàn cục $T = 77$ giây
Lấy 2 tập dữ liệu capture cách nhau vài phút (tập ban đầu và tập live feed sau đó) và tìm các thời điểm có vector dịch chuyển trùng khít nhau:
- Trạng thái lặp lại hoàn toàn tại các khoảng cách thời gian:
  $$\Delta t_1 = 308 \text{ giây}, \quad \Delta t_2 = 385 \text{ giây}$$
- Tìm ước chung lớn nhất của các chu kỳ lặp:
  $$T = \gcd(308, 385) = \mathbf{77 \text{ giây}}$$
- **Giải mã câu đố bánh răng:** Con số $77 = 7 \times 11$. Đây chính là sự kết hợp của **2 bánh răng có kích thước 7 răng và 11 răng** quay đồng trục, tạo ra chu kỳ toàn cục là bội chung nhỏ nhất:
  $$\text{lcm}(7, 11) = 77 \text{ trạng thái!}$$

---

### 2.4. Tái tạo dòng khóa (Keystream Reconstruction)

Vì toàn bộ hệ thống chỉ có đúng 77 trạng thái tuần hoàn ($t \pmod{77} \in [0..76]$), việc ghép 60 giây capture ban đầu và 60 giây live feed sau đó giúp ta thu thập được trọn vẹn **77/77 pha** mà không thiếu giây nào!

Với mỗi giây $t$ và ký tự thứ $p$ (chỉ tính ký tự chữ và số, bỏ qua `{`, `}`, `_`):
1. Tính chỉ số pha của dòng khóa:
   $$\text{key\_index} = (t - 34 \times p) \pmod{77}$$
2. Lấy giá trị dịch tương ứng từ mảng khóa: $\text{shift} = K[\text{key\_index}]$
3. Giải mã tương ứng:
   - Nếu là chữ hoa: $(C - \text{'A'} - \text{shift}) \pmod{26} + \text{'A'}$
   - Nếu là chữ thường: $(C - \text{'a'} - \text{shift}) \pmod{26} + \text{'a'}$
   - Nếu là chữ số: $(C - \text{'0'} - \text{shift}) \pmod{10} + \text{'0'}$

Thử nghiệm giải mã trên toàn bộ 77 trạng thái, tất cả 77 trạng thái đều cho ra **cùng một bản rõ duy nhất** (0 lỗi sai lệch).

---

### 2.5. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""Chrono II Solution Script

Mục đích: Tự động thu thập dữ liệu từ máy chủ API, khôi phục dòng khóa
chu kỳ 77 giây dựa trên Known-Plaintext Attack và giải mã cờ hoàn chỉnh.
"""

from datetime import datetime
import json
import urllib.request


def parse_iso(ts):
  """Chuyển đổi chuỗi ISO timestamp UTC thành Unix timestamp số nguyên."""
  return int(datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp())


# 1. Thu thập dữ liệu từ endpoint API của máy chủ
url = "http://34.116.80.78:8001/api/feed"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

print("[*] Đang kết nối tới máy chủ và lấy dữ liệu capture...")
with urllib.request.urlopen(req) as resp:
  records = json.loads(resp.read().decode("utf-8"))

# Lưu trữ bản mã theo pha thời gian: phase = timestamp % 77
states = {}
for r in records:
  phase = parse_iso(r["timestamp"]) % 77
  states[phase] = r["ciphertext"]

print(
    f"[+] Đã ghi nhận {len(states)}/77 pha trạng thái từ lượt capture hiện tại."
)

# 2. Khôi phục toàn bộ mảng dòng khóa K (độ dài 77) từ tiền tố "CSSCTF"
K = {}
for phase, ct in states.items():
  # Duyệt qua 6 ký tự đầu của tiền tố đã biết
  for p in range(6):
    # Áp dụng công thức lệch pha: key_index = (phase - 34 * p) % 77
    k_idx = (phase - 34 * p) % 77
    shift = (ord(ct[p]) - ord("CSSCTF"[p])) % 26
    K[k_idx] = shift

print(f"[+] Đã tái tạo thành công {len(K)}/77 phần tử của dòng khóa K.")


# 3. Hàm giải mã bản tin tổng quát
def decrypt(ct, phase):
  res = []
  p_idx = 0  # Chỉ số đếm cho các ký tự chữ và số (bỏ qua ký tự phân cách)

  for c in ct:
    if c.isupper():
      # Giải mã chữ in hoa (modulo 26)
      shift = K[(phase - 34 * p_idx) % 77]
      res.append(chr((ord(c) - ord("A") - shift) % 26 + ord("A")))
      p_idx += 1
    elif c.islower():
      # Giải mã chữ thường (modulo 26)
      shift = K[(phase - 34 * p_idx) % 77]
      res.append(chr((ord(c) - ord("a") - shift) % 26 + ord("a")))
      p_idx += 1
    elif c.isdigit():
      # Giải mã chữ số (modulo 10)
      shift = K[(phase - 34 * p_idx) % 77]
      res.append(chr((ord(c) - ord("0") - shift) % 10 + ord("0")))
      p_idx += 1
    else:
      # Giữ nguyên dấu '{', '}', '_'
      res.append(c)

  return "".join(res)


# Chọn mẫu ngẫu nhiên đã ghi nhận để giải mã cờ
sample_phase = list(states.keys())[0]
flag = decrypt(states[sample_phase], sample_phase)

print(f"[+] Bản mã tại phase {sample_phase}: {states[sample_phase]}")
print(f"[+] Giải mã thành công Flag: {flag}")
```

### 2.6. Flag
$$\mathbf{CSSCTF\{th3\_cl0ck\_r3m3mb3rs\_3very\_s3c0nd\}}$$

---

## 3. Chimera Vault

### 3.1. Mô tả thử thách & Bối cảnh
> *The ancient custodians of the Chimera Vault didn't rely on standard asymmetric primitives to secure their root register.*  
> *Demodulate the carrier, trace the invariant through the matrix state transitions, and invert the resonance to breach the vault.*  
> **Dịch vụ trực tuyến:** `nc 34.116.80.78 7334`  
> **Flag Format:** `CSSCTF{...}`  
> **Tệp đính kèm:** `server.py`, `Dockerfile`

---

### 3.2. Kiến trúc & Mô hình bảo mật của Chimera Vault

Thử thách mô phỏng một hệ thống kho khóa cộng hưởng 3 tầng (*3-tier resonant vault*). Để lấy được cờ, người tấn công phải tự động giải mã và vượt qua liên tiếp 3 giai đoạn trong thời hạn nghiêm ngặt 45 giây (`signal.alarm(45)`):

```
       [ Client / Attacker ]
                 │
                 ▼ (TCP Handshake)
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: ACOUSTIC CARRIER SYNCHRONIZATION                   │
│ - Tín hiệu PCM 16-bit 8000Hz (Base64)                       │
│ - 2 sóng sin: f1 = 440 + 5*k1, f2 = 1200 + 5*k2 + Noise    │
│ - Yêu cầu: Giải điều chế trích xuất session_token (16-bit)  │
└────────────────────────┬────────────────────────────────────┘
                         │ [+] Phase Locked!
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: NON-COMMUTATIVE MATRIX DRIFT TELEMETRY             │
│ - Ma trận tiến hóa: M_{k+1} = M_k + D (mod N)               │
│ - D = diag(d1, d2, d3) với d1 + d2 + d3 = W (mod N)         │
│ - Yêu cầu: Khôi phục khóa bí mật W từ bất biến vết ma trận  │
└────────────────────────┬────────────────────────────────────┘
                         │ [+] W = Tr(M1 - M0) mod N
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: RESONANT KNAPSACK INTERCEPT                        │
│ - Hệ mật Merkle-Hellman: S = (W * r) mod M_mod              │
│ - Dãy siêu tăng r = [r0, ..., r47], Target Sum C           │
│ - Yêu cầu: Đảo ngược W^-1 mod M_mod và giải Knapsack 48-bit │
└────────────────────────┬────────────────────────────────────┘
                         │ [+] Master Key Overwritten!
                         ▼
             [ Flag: CSSCTF{...} ]
```

---

### 3.3. Phân tích mật mã & Điểm yếu từng giai đoạn

#### 3.3.1. Phase 1: Acoustic Carrier Synchronization (Giải điều chế âm thanh số)

##### Cơ chế mã hóa tín hiệu:
- Server sinh một token phiên 16-bit ngẫu nhiên: $T \in [0x1000, 0xEFFF]$.
- Hai byte của token được phân rã thành:
  $$k_1 = T \ \& \ 0\text{xFF} \in [0, 255]$$
  $$k_2 = (T \gg 8) \ \& \ 0\text{xFF} \in [16, 239]$$
- Hai thành phần tần số tương ứng:
  $$f_1 = 440 + 5 \cdot k_1 \quad (\text{dải } [440, 1715]\text{ Hz})$$
  $$f_2 = 1200 + 5 \cdot k_2 \quad (\text{dải } [1280, 2395]\text{ Hz})$$
- Tín hiệu liên tục được tạo bởi tổng 2 sóng sin có biên độ $0.4$ và nhiễu Gaussian $\epsilon \sim \mathcal{N}(0, 0.05^2)$:
  $$s(t) = 0.4 \sin(2\pi f_1 t) + 0.4 \sin(2\pi f_2 t) + \epsilon(t)$$
- Tín hiệu được lấy mẫu ở tần số $F_s = 8000\text{ Hz}$ trong thời gian $0.8\text{ giây}$ (tổng cộng $N_s = 6400\text{ mẫu}$), định lượng thành 16-bit signed PCM little-endian và mã hóa Base64 gửi về client.

##### Phân tích xử lý tín hiệu số (DSP Analysis):
- **Độ phân giải tần số tự nhiên:**
  $$\Delta f = \frac{F_s}{N_s} = \frac{8000}{6400} = 1.25\text{ Hz}$$
  Vì bước nhảy tần số giữa các giá trị $k$ là $5\text{ Hz}$ ($\Delta f_{\text{step}} = 5\text{ Hz} = 4 \times \Delta f$), độ phân giải này hoàn toàn đủ để phân tách các tần số lân cận mà không bị chồng lấn.
- **Tập tần số hữu hạn (Discrete Candidate Frequencies):**
  Tất cả các tần số hợp lệ đều là bội số của $5\text{ Hz}$ nằm trong đoạn $[440, 2395]\text{ Hz}$. Tổng số tần số ứng viên chỉ là:
  $$\frac{2395 - 440}{5} + 1 = 392\text{ tần số!}$$
- **Phương pháp giải điều chế tối ưu (Direct Orthogonal Projection / DTFT):**
  Thay vì dùng FFT toàn dải dễ bị ảnh hưởng bởi hiện tượng rò rỉ phổ (spectral leakage) từ các búp sóng phụ (sidelobes), ta tính trực tiếp tích vô hướng giữa vector tín hiệu $x[n]$ với cơ sở trực giao $\{\cos(2\pi f t), \sin(2\pi f t)\}$ cho đúng 392 tần số ứng viên:
  $$C(f) = \sum_{n=0}^{N_s-1} x[n] \cos\left(2\pi f \frac{n}{F_s}\right), \quad S(f) = \sum_{n=0}^{N_s-1} x[n] \sin\left(2\pi f \frac{n}{F_s}\right)$$
  $$E(f) = C(f)^2 + S(f)^2$$
- **Trích xuất tần số:**
  1. Sắp xếp các tần số theo năng lượng $E(f)$ giảm dần.
  2. Chọn 2 tần số có năng lượng cao nhất thỏa mãn khoảng cách tối thiểu giữa 2 đỉnh là $\ge 10\text{ Hz}$ (để loại trừ búp sóng phụ lân cận).
  3. Nếu $f_1 = f_2$ (xảy ra khi $k_1 - k_2 = 152$), phổ chỉ có 1 đỉnh cực đại với năng lượng gấp đôi.
  4. Từ tần số phát hiện, tính ngược lại:
     $$k_1 = \frac{f_1 - 440}{5}, \quad k_2 = \frac{f_2 - 1200}{5} \implies T = (k_2 \ll 8) \mid k_1$$

---

#### 3.3.2. Phase 2: Non-Commutative Matrix Drift Telemetry (Tính bất biến của Vết ma trận)

##### Cơ chế dịch chuyển ma trận:
- Máy chủ khởi tạo hệ thống với số modulus RSA $N = p \cdot q$ (128-bit) và chọn ngẫu nhiên một số nguyên bí mật $W \in [2, N-2]$.
- Ma trận đường chéo dịch chuyển $D = \operatorname{diag}(d_1, d_2, d_3)$ được tạo ngẫu nhiên nhưng thỏa mãn ràng buộc:
  $$d_1, d_2 \in_R [1, N-1], \quad d_3 \equiv (W - d_1 - d_2) \pmod N$$
- Trạng thái ma trận tiến hóa qua quy tắc cộng tích lũy modulo $N$:
  $$M_{k+1} \equiv (M_k + D) \pmod N$$
- Server công khai chuỗi trạng thái: $M_0, M_1, M_2, M_3$.

##### Điểm yếu toán học (Trace Invariant):
- Nhận xét vết của ma trận đường chéo $D$:
  $$\operatorname{Tr}(D) = d_1 + d_2 + d_3 \equiv d_1 + d_2 + (W - d_1 - d_2) \equiv W \pmod N$$
- Do phép cộng ma trận có tính chất tuyến tính với vết ($\operatorname{Tr}(A + B) = \operatorname{Tr}(A) + \operatorname{Tr}(B)$), ta có:
  $$\operatorname{Tr}(M_{k+1}) \equiv \operatorname{Tr}(M_k) + \operatorname{Tr}(D) \equiv \operatorname{Tr}(M_k) + W \pmod N$$
- Cụ thể, khi biết $M_0$ và $M_1$:
  $$D \equiv (M_1 - M_0) \pmod N$$
  Các phần tử trên đường chéo chính của $D$ được tính trực tiếp:
  $$d_1 \equiv (M_1[0][0] - M_0[0][0]) \pmod N$$
  $$d_2 \equiv (M_1[1][1] - M_0[1][1]) \pmod N$$
  $$d_3 \equiv (M_1[2][2] - M_0[2][2]) \pmod N$$
- Suy ra giá trị $W$:
  $$W = (d_1 + d_2 + d_3) \pmod N$$
- **Lưu ý then chốt:** Vì $W$ ban đầu được tạo trong khoảng $[2, N-2]$, tức là $W < N$. Do đó, phép tính modulo $N$ khôi phục **chính xác $100\%$ giá trị nguyên** của khóa bí mật $W$ mà không bị đa trị (no ambiguity)!

---

#### 3.3.3. Phase 3: Resonant Knapsack Intercept (Thám mã Merkle-Hellman)

##### Kiến trúc Merkle-Hellman Cryptosystem:
- Server sinh một **dãy siêu tăng (superincreasing sequence)** $r = [r_0, r_1, \dots, r_{47}]$ gồm 48 phần tử:
  $$r_0 \in [10, 50], \quad r_k = \sum_{i=0}^{k-1} r_i + \text{randint}(5, 50) \implies r_k > \sum_{i=0}^{k-1} r_i \quad (\forall k \ge 1)$$
- Modulus ba-lô:
  $$M_{\text{mod}} = \sum_{i=0}^{47} r_i + \text{randint}(1000, 50000), \quad \text{với } \gcd(W, M_{\text{mod}}) = 1$$
- Trọng số công khai $S = [s_0, s_1, \dots, s_{47}]$:
  $$s_i \equiv (W \cdot r_i) \pmod{M_{\text{mod}}}$$
- Vector bit bí mật $b = [b_0, b_1, \dots, b_{47}] \in \{0, 1\}^{48}$ được mã hóa thành tổng cộng hưởng:
  $$C = \sum_{i=0}^{47} b_i \cdot s_i$$

##### Tấn công khôi phục cờ:
- Bài toán tổng tập con (Subset Sum / Knapsack Problem) trong trường hợp tổng quát là bài toán NP-đầy đủ. Tuy nhiên, hệ mật Merkle-Hellman sử dụng một bẫy cửa (trapdoor) là phép nhân với $W \pmod{M_{\text{mod}}}$.
- Một khi khóa bí mật $W$ đã bị bộc lộ từ Phase 2 và $M_{\text{mod}}$ được server công khai, bẫy cửa này hoàn toàn bị vô hiệu hóa:
  1. Tính phần tử nghịch đảo modular:
     $$W^{-1} \equiv W^{-1} \pmod{M_{\text{mod}}}$$
  2. Khôi phục lại toàn bộ dãy siêu tăng bí mật $r$:
     $$r_i \equiv (s_i \cdot W^{-1}) \pmod{M_{\text{mod}}}$$
  3. Khôi phục tổng mục tiêu trong không gian siêu tăng:
     $$C' \equiv (C \cdot W^{-1}) \pmod{M_{\text{mod}}} = \sum_{i=0}^{47} b_i \cdot r_i$$
- **Giải bài toán Subset Sum trên dãy siêu tăng trong thời gian $O(n)$:**
  Do mỗi phần tử $r_k$ lớn hơn tổng tất cả các phần tử đứng trước nó ($\sum_{i=0}^{k-1} r_i < r_k$), ta có thể xác định từng bit $b_i$ một cách tất định bằng thuật toán tham lam (Greedy algorithm) duyệt từ $i = 47$ về $0$:
  $$\begin{cases} 
  \text{Nếu } C' \ge r_i: & b_i = 1, \quad C' \leftarrow C' - r_i \\ 
  \text{Nếu } C' < r_i: & b_i = 0 
  \end{cases}$$
- Sau khi duyệt hết dãy, kiểm tra điều kiện kết thúc $C' = 0$. Ghép 48 bit thành chuỗi nhị phân (vd: `11001101...`) và gửi về server để nhận cờ.

---

### 3.4. Chiến lược khai thác đầu-cuối (End-to-End Exploit Pipeline)

Toàn bộ quy trình tấn công tự động qua socket diễn ra như sau:
1. **Kết nối mạng & Bóc tách tham số:** Mở kết nối TCP tới `34.116.80.78:7334`, nhận biểu thức chào mừng, trích xuất $N$, $M_{\text{mod}}$ và chuỗi Base64 telemetry audio.
2. **Xử lý tín hiệu Phase 1:** Giải mã Base64 $\rightarrow$ giải điều chế DTFT với 392 tần số ứng viên $\rightarrow$ tìm $f_1, f_2 \rightarrow$ tính token phiên $\rightarrow$ gửi chuỗi hex (vd: `0xe829\n`).
3. **Phân tích ma trận Phase 2:** Nhận ma trận $M_0$ và các ma trận tiến hóa $M_1, M_2, M_3 \rightarrow$ tính hiệu đường chéo $d_i = (M_1[i][i] - M_0[i][i]) \pmod N \rightarrow$ tính $W = \sum d_i \pmod N$.
4. **Bẻ khóa Merkle-Hellman Phase 3:** Nhận danh sách trọng số $S$ và tổng mục tiêu $C \rightarrow$ tính $W^{-1} \pmod{M_{\text{mod}}} \rightarrow$ giải ngược dãy siêu tăng $r \rightarrow$ tham lam tìm nghiệm bitvector 48-bit $\rightarrow$ gửi nghiệm chuỗi bit.
5. **Đọc Flag:** Nhận phản hồi xác thực thành công từ server và trích xuất cờ `CSSCTF{...}`.

---

### 3.5. Mã nguồn khai thác hoàn chỉnh (Python)

```python
#!/usr/bin/env python3
"""Chimera Vault Exploit Script

Mục đích: Tự động hóa toàn diện 3 giai đoạn:
1. Giải điều chế âm thanh PCM 16-bit tìm session token.
2. Tính vết bất biến ma trận Modulo N để khôi phục khóa bí mật W.
3. Phá vỡ hệ mật Merkle-Hellman Knapsack trên dãy siêu tăng.
"""

import ast
import base64
import re
import socket
import numpy as np


def solve():
  # Cấu hình tham số lấy mẫu âm thanh cho Phase 1
  sample_rate = 8000
  duration = 0.8
  num_samples = int(sample_rate * duration)
  t = np.arange(num_samples) / sample_rate

  # Dải tần số ứng viên: các bội số của 5Hz từ 440Hz đến 2395Hz (392 tần số)
  cand_freqs = np.arange(440, 2400, 5)

  # Ma trận chiếu trực giao để phân tích phổ năng lượng
  cos_mat = np.cos(2 * np.pi * cand_freqs[:, None] * t[None, :])
  sin_mat = np.sin(2 * np.pi * cand_freqs[:, None] * t[None, :])

  host = "34.116.80.78"
  port = 7334

  while True:
    print(f"[*] Đang kết nối tới máy chủ {host}:{port}...")
    s = socket.socket()
    s.settimeout(15)
    s.connect((host, port))

    def recv_until(target_bytes):
      data = b""
      while target_bytes not in data:
        chunk = s.recv(4096)
        if not chunk:
          raise EOFError("Mất kết nối từ máy chủ")
        data += chunk
      return data.decode("utf-8", errors="ignore")

    try:
      # Nhận thông điệp khởi tạo và đọc N, M_mod
      greeting = recv_until(b"Enter decoded session token")
      N = int(re.search(r"System Modulus N = (\d+)", greeting).group(1))
      M_mod = int(
          re.search(r"Knapsack Modulus M_mod = (\d+)", greeting).group(1)
      )
      print(f"[+] System Modulus N = {N}")
      print(f"[+] Knapsack Modulus M_mod = {M_mod}")

      # --- BƯỚC 1: GIẢI ĐIỀU CHẾ TÍN HIỆU ÂM THANH (PHASE 1) ---
      b64_audio = re.search(
          r"stream \(Base64\):\s*([A-Za-z0-9+/=]+)", greeting
      ).group(1).strip()
      raw_pcm = base64.b64decode(b64_audio)
      samples = (
          np.frombuffer(raw_pcm, dtype=np.int16).astype(np.float64) / 32767.0
      )

      # Tính năng lượng phổ tại từng tần số ứng viên
      c_proj = cos_mat @ samples
      s_proj = sin_mat @ samples
      energy = c_proj**2 + s_proj**2

      # Tìm 2 đỉnh năng lượng cao nhất cách nhau >= 10 Hz
      sorted_idx = np.argsort(energy)[::-1]
      peaks = []
      for idx in sorted_idx:
        f = cand_freqs[idx]
        if not any(abs(f - pf) <= 10 for pf in peaks):
          peaks.append(f)
        if len(peaks) == 2:
          break

      p1, p2 = sorted(peaks)
      candidate_tokens = []
      for fa, fb in [(p1, p2), (p2, p1)]:
        k1 = (fa - 440) // 5
        k2 = (fb - 1200) // 5
        if 0 <= k1 <= 255 and 0x10 <= k2 <= 0xEF:
          candidate_tokens.append((k2 << 8) | k1)

      chosen_token = candidate_tokens[0]
      token_hex = hex(chosen_token)
      print(f"[+] Dự đoán Session Token: {token_hex}")

      # Gửi session token lên server
      s.sendall((token_hex + "\n").encode())

      phase1_res = recv_until(b"M_0 =")
      if "Phase locked!" not in phase1_res:
        print("[-] Sai token phiên, đang thử kết nối lại...")
        s.close()
        continue

      print("[+] Phase 1 Vượt qua thành công! Đã đồng bộ sóng mang.")

      # --- BƯỚC 2: KHÔI PHỤC KHÓA BÍ MẬT W TỪ VẾT MA TRẬN (PHASE 2) ---
      phase2_and_3 = recv_until(b"Enter 48-bit solution vector")
      full_text = phase1_res + phase2_and_3

      M_0 = ast.literal_eval(
          re.search(r"M_0 = (\[\[.*?\]\])", full_text).group(1)
      )
      M_1 = ast.literal_eval(
          re.search(r"M_1 = (\[\[.*?\]\])", full_text).group(1)
      )
      weights_S = ast.literal_eval(
          re.search(r"Knapsack Public Weights S = (\[.*?\])", full_text).group(1)
      )
      target_sum = int(
          re.search(r"Target Resonance Sum\s*=\s*(\d+)", full_text).group(1)
      )

      # Tính đường chéo của D = (M_1 - M_0) mod N
      d1 = (M_1[0][0] - M_0[0][0]) % N
      d2 = (M_1[1][1] - M_0[1][1]) % N
      d3 = (M_1[2][2] - M_0[2][2]) % N

      # W = Tr(D) mod N
      W = (d1 + d2 + d3) % N
      print(f"[+] Khôi phục thành công khóa bí mật W = {W}")

      # --- BƯỚC 3: THÁM MÃ MERKLE-HELLMAN KNAPSACK (PHASE 3) ---
      W_inv = pow(W, -1, M_mod)

      # Khôi phục dãy siêu tăng r và tổng mục tiêu quy đổi C'
      r = [(si * W_inv) % M_mod for si in weights_S]
      target_prime = (target_sum * W_inv) % M_mod

      # Thuật toán tham lam giải bài toán Subset Sum trên dãy siêu tăng
      knapsack_len = len(weights_S)
      sol_bits = [0] * knapsack_len
      curr = target_prime

      for i in range(knapsack_len - 1, -1, -1):
        if curr >= r[i]:
          sol_bits[i] = 1
          curr -= r[i]

      assert (
          curr == 0
      ), "[-] Lỗi: Phần dư sau giải knapsack khác 0 (nghiệm không hợp lệ)"

      sol_str = "".join(str(b) for b in sol_bits)
      print(f"[+] Tìm thấy vector nghiệm 48-bit: {sol_str}")

      # Gửi nghiệm lên server
      s.sendall((sol_str + "\n").encode())

      # Đọc toàn bộ phản hồi chứa cờ
      final_output = b""
      while True:
        try:
          chunk = s.recv(4096)
          if not chunk:
            break
          final_output += chunk
        except socket.timeout:
          break

      result = final_output.decode("utf-8", errors="ignore")
      print(result)

      if "CSSCTF{" in result:
        print("[+] ĐÃ LẤY ĐƯỢC FLAG THÀNH CÔNG!")
        s.close()
        return

    except Exception as e:
      print(f"[-] Gặp sự cố: {e}, đang khởi động lại...")
      try:
        s.close()
      except:
        pass


if __name__ == "__main__":
  solve()
```

---

### 3.6. Flag

$$\mathbf{CSSCTF\{tr4c3\_1nv4r14nc3\_4nd\_4c0ust1c\_sp3ctr4\_7f9b8c\}}$$

---

## 4. Severed Symmetry

### 4.1. Mô tả thử thách & Bối cảnh
> *As the Kuiper Belt Relay reboots, your terminal intercepts an encrypted archive belonging to the Ætheric Order. Its contents survived The Severance, but the private key did not; only the encryption program, public equations, and ciphertext remain. The Order is already moving to reclaim it; recover the access key hidden inside before their secrets disappear into the Nexus again.*  
> **Dữ kiện cung cấp:**  
> - `source.py`: Mã nguồn thuật toán sinh khóa (`keygen`), mã hóa vector (`encrypt_vector`) và giải mã (`decrypt_vector`).  
> - `out.txt` (~31 MB): Chứa `public_key` (34 đa thức bậc 4 với hơn 58.000 đơn thức) và `ciphertext` (gồm 3 khối mã hóa $m = 34$).  
> **Flag Format:** `CSSCTF{...}`

---

### 4.2. Kiến trúc & Cấu trúc đại số của hệ mật mã

Thử thách này thuộc nhóm **Hệ mật mã đa thức nhiều biến (Multivariate Public Key Cryptography - MPKC)**. Hệ mật mã được xây dựng dựa trên sự lai ghép giữa cấu trúc **Biến đổi thuần hóa (Tame Transformation)** và hệ ký số/mã hóa **Dầu và Giấm không cân bằng (Unbalanced Oil and Vinegar - UOV)**.

#### 1. Bộ tham số hệ thống:
```python
PARAMETERS = dict(p=17, n=32, m=34, t=16, s=4)
```
- Trường hữu hạn: $\mathbb{F}_p$ với $p = 17$.
- Không gian bản rõ: $x \in \mathbb{F}_{17}^{n}$ ($n = 32$).
- Không gian bản mã: $C \in \mathbb{F}_{17}^{m}$ ($m = 34$).
- Tham số phân tách tầng tam giác: $t = 16$.
- Tham số biến Vinegar bổ sung: $s = 4$.
- Số biến Oil trong tầng UOV: $o = n - t - s = 32 - 16 - 4 = 12$.

#### 2. Cấu trúc ánh xạ bẫy (Trapdoor Map Decomposition):
Khóa bí mật bao gồm hai phép biến đổi affine khả nghịch $A_1 \in \mathbb{F}_{17}^{m \times m}, A_2 \in \mathbb{F}_{17}^{n \times n}$ cùng các đa thức nội tại:
1. **Lớp Affine đầu vào:**
   $$z = A_2 x + b_2 \in \mathbb{F}_{17}^{32}$$
   Chia $z$ thành hai nửa: $z_{0 \dots 15}$ (16 biến đầu) và $z_{16 \dots 31}$ (16 biến cuối).
2. **Lớp Tame Transformation (Tầng tam giác):**
   $$w_i = z_i - q_i(z_{16}, \dots, z_{31}) \quad (i = 0, \dots, 15)$$
   Trong đó mỗi $q_i$ là một đa thức bậc hai ngẫu nhiên chỉ phụ thuộc vào 16 biến $z_{16 \dots 31}$.
   Vì $z_i$ là dạng affine bậc 1 và $q_i$ có bậc 2 theo $x$, nên $w_i(x)$ là **đa thức bậc 2** theo $x$.
3. **Lớp Unbalanced Oil and Vinegar (UOV Layer):**
   Xây dựng $m - t = 18$ đa thức bậc hai $U_k$ nhận vector 32 phần tử:
   $$u = (w_0, \dots, w_{15}, z_{16}, \dots, z_{19}, z_{20}, \dots, z_{31})$$
   - $t + s = 16 + 4 = 20$ biến đầu là **biến Vinegar** ($w_0 \dots w_{15}$ và $z_{16} \dots z_{19}$).
   - $o = 12$ biến cuối là **biến Oil** ($z_{20} \dots z_{31}$).
   - Theo định nghĩa UOV, trong mỗi đa thức $U_k$ **triệt tiêu hoàn toàn các số hạng tích giữa hai biến Oil**:
     $$\forall i, j \ge 20: \quad \text{Coeff}(u_i u_j) = 0$$
4. **Ánh xạ trung tâm (Central Map):**
   $$\text{central}(x) = \big[ w_0(x), \dots, w_{15}(x), \; U_0(u), \dots, U_{17}(u) \big] \in \mathbb{F}_{17}^{34}$$
5. **Khóa công khai (Public Key):**
   $$P(x) = A_1 \cdot \text{central}(x) + b_1 \in \mathbb{F}_{17}^{34}$$
   Khi thay $u_i = w_i(x)$ (bậc 2) vào các số hạng bậc hai $u_i u_j$ ($i, j < 16$) của $U_k$, bậc tổng thể của đa thức công khai bị đẩy lên **bậc 4**:
   $$\deg(w_i \cdot w_j) = 2 + 2 = 4$$
   Điều này giải thích vì sao file `out.txt` có kích thước lên đến hơn 31 MB, chứa 34 đa thức bậc 4 với $\binom{32+4}{4} = 58.905$ đơn thức khả dĩ.

---

### 4.3. Phân tích mật mã & Chuỗi khai thác 5 giai đoạn (Cryptanalysis)

Thử thách mang tên **"Severed Symmetry"** (Sự đối xứng bị cắt đứt), ám chỉ hai điểm yếu chí tử được lồng ghép:
1. *Severed (Bị cắt rời):* Tầng $w$ được đưa trực tiếp ra output của $\text{central}$ mà không bị nâng lên bậc 4.
2. *Symmetry (Tính đối xứng UOV):* Cấu trúc dạng song tuyến tính triệt tiêu trên không gian con Oil ($o > v$), mở đường cho đòn tấn công hạt nhân kiểu Kipnis–Shamir.

```
+---------------------------------------------------------------------------------------+
|                                    PUBLIC POLYNOMIALS                                 |
|                                 P_k(x) in F_17[x_0..x_31]                             |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Giai đoạn 1: Left Nullspace Attack]
+---------------------------------------------------------------------------------------+
|  Mat_deg34 (34 x 58344) has Rank = 18  -->  Left Nullspace V_null (dim = 16)          |
|  Q(x) = V_null * P(x) TRIỆT TIÊU HOÀN TOÀN BẬC 3 & 4 (Thu được 16 đa thức bậc <= 2)   |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Giai đoạn 2: Subspace Isolation]
+---------------------------------------------------------------------------------------+
|  Gradients grad(P_k^(4)) lie in span(z_16..z_31)  -->  Rank = 16                      |
|  Thu được ma trận cơ sở L (16 x 32) và ma trận đổi biến khả nghịch T (32 x 32)        |
|  Tọa độ mới: x = T^(-1) * [u, y]^T  (với y biểu diễn z_16..z_31, u biểu diễn z_0..z_15)|
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Giai đoạn 3: Linearization of u]
+---------------------------------------------------------------------------------------+
|  Q(u, y) = K * u + G(y) với K (16 x 16) khả nghịch  -->  u*(y) = K^(-1)*(target_Q - G)|
|  Thay u = u*(y) vào 18 phương trình còn lại:                                          |
|  Toàn bộ các phương trình SỤP ĐỔ TỪ BẬC 4 XUỐNG BẬC 2 THEO 16 BIẾN y!                 |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Giai đoạn 4: Breaking UOV Symmetry]
+---------------------------------------------------------------------------------------+
|  18 dạng toàn phương M_k (16 x 16) có rank = 2*v = 8                                  |
|  Hạt nhân ker(M_k) (dim = 8) nằm hoàn toàn trong không gian Oil O (dim = 12)          |
|  O = sum_k ker(M_k)  -->  Khôi phục 100% Không gian Oil O với O^T * M_k * O = 0       |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Giai đoạn 5: Fast C Solver]
+---------------------------------------------------------------------------------------+
|  y = S_V * v + S_O * o  (v in F_17^4, o in F_17^12)                                   |
|  Hệ 18 phương trình trở thành TUYẾN TÍNH theo 12 biến o:  A(v)*o + b(v) = 0           |
|  Vét cạn 17^4 = 83.521 trường hợp của v trong solver.c (< 5ms)                         |
|  Tìm nghiệm duy nhất (v, o)  -->  y  -->  u  -->  x  -->  DECODE FLAG!                |
+---------------------------------------------------------------------------------------+
```

---

#### 4.3.1. Giai đoạn 1: Triệt tiêu bậc cao bằng Hạt nhân trái (Left Nullspace Degree Elimination)
Quan sát cấu trúc của $\text{central} \in \mathbb{F}_{17}^{34}$:
$$\text{central} = \big[ w_0, \dots, w_{15}, \; U_0, \dots, U_{17} \big]$$
- $16$ thành phần đầu là $w_i(x) = z_i - q_i(z_{16 \dots 31})$, **chỉ có bậc tối đa là 2 theo $x$** (không chứa bất kỳ đơn thức bậc 3 hay bậc 4 nào).
- Chỉ có $18$ thành phần sau ($U_0, \dots, U_{17}$) mới chứa các đơn thức bậc 3 và 4.

Vì $P(x) = A_1 \cdot \text{central}(x) + b_1$, mỗi đa thức công khai $P_k(x)$ là một tổ hợp tuyến tính của 34 thành phần trong $\text{central}$. Tuy nhiên, phần bậc 3 và bậc 4 của tất cả 34 đa thức này **chỉ được sinh bởi đúng 18 đa thức** ($U_0 \dots U_{17}$).

Xét ma trận hệ số của các đơn thức bậc 3 và bậc 4 có kích thước $34 \times 58.344$:
$$\operatorname{Rank}(M_{\text{deg 3,4}}) \le 18$$
Thực hiện phép khử Gauss trên ma trận chuyển vị, ta tìm được không gian hạt nhân trái (Left Nullspace) có số chiều đúng bằng:
$$\dim(V_{\text{null}}) = 34 - 18 = 16$$
Tồn tại một ma trận $V_{\text{null}} \in \mathbb{F}_{17}^{16 \times 34}$ có hạng 16 sao cho:
$$V_{\text{null}} \cdot M_{\text{deg 3,4}} = 0 \pmod{17}$$
Khi nhân $V_{\text{null}}$ với vector khóa công khai $P(x)$, toàn bộ các đơn thức bậc 3 và bậc 4 bị triệt tiêu hoàn toàn:
$$Q(x) = V_{\text{null}} \cdot P(x) \quad \text{có } \deg(Q_k) \le 2 \quad (\forall k \in [0..15])$$
Hơn nữa, đối với bản mã $C = P(x^*)$, ta có ngay 16 phương trình bậc 2 thỏa mãn tại nghiệm $x^*$:
$$Q(x^*) = V_{\text{null}} \cdot C \pmod{17}$$

---

#### 4.3.2. Giai đoạn 2: Cô lập không gian biến đáy qua Gradient phần bậc 4 (Subspace Isolation)
Xem xét nguồn gốc của các đơn thức bậc 4:
Trong $U_k(w, z_{16 \dots 31})$, các số hạng bậc 4 chỉ sinh ra từ tích $w_i w_j$. Vì:
$$w_i(x) = z_i(x) - q_i(z_{16 \dots 31}) = -q_i(z_{16 \dots 31}) + \text{dạng affine}$$
Số hạng bậc 4 thuần túy của $w_i w_j$ là:
$$(-q_i(z_{16 \dots 31})) \cdot (-q_j(z_{16 \dots 31})) = q_i(z_{16 \dots 31}) q_j(z_{16 \dots 31})$$
**Đặc tính quyết định:** Toàn bộ phần bậc 4 của tất cả các đa thức công khai $P_k(x)$ chỉ phụ thuộc duy nhất vào 16 dạng tuyến tính $z_{16}, \dots, z_{31}$ (chính là 16 hàng cuối của ma trận bí mật $A_2$).

Nếu lấy đạo hàm riêng (Gradient) của phần bậc 4 theo vector $x$:
$$\nabla P_k^{(4)}(x) \in \operatorname{span}\big( A_{2, [16:32], :} \big)$$
Bằng cách lấy ngẫu nhiên 50 điểm $x \in \mathbb{F}_{17}^{32}$, tính $\nabla P_0^{(4)}(x)$ và đưa vào ma trận rồi khử Gauss, ta thu được đúng một không gian vector 16 chiều. Gọi $L \in \mathbb{F}_{17}^{16 \times 32}$ là ma trận cơ sở của không gian này. Khi đó:
$$z_{16 \dots 31} = B \cdot (L x) + d$$
Chọn ma trận bổ sung $R \in \mathbb{F}_{17}^{16 \times 32}$ để ghép thành ma trận chuyển cơ sở khả nghịch:
$$T = \begin{pmatrix} R \\ L \end{pmatrix} \in \mathbb{F}_{17}^{32 \times 32}$$
Thực hiện đổi biến:
$$x = T^{-1} \begin{pmatrix} u \\ y \end{pmatrix}, \quad u \in \mathbb{F}_{17}^{16}, \; y \in \mathbb{F}_{17}^{16}$$
Trong hệ tọa độ mới: $y = L x$ đại diện cho không gian của $z_{16 \dots 31}$, còn $u$ đại diện cho phần bù $z_{0 \dots 15}$.

---

#### 4.3.3. Giai đoạn 3: Tuyến tính hóa biến $u$ và sự sụp đổ bậc của hệ phương trình
Biểu diễn $w_i$ theo tọa độ $(u, y)$:
$$w_i(x) = z_i - q_i(z_{16 \dots 31}) = (J \cdot u)_i + (H \cdot y)_i + b_{2, i} - q_i(B y + d)$$
Nhận xét:
- Biến $u$ **chỉ xuất hiện tuyến tính** trong $J \cdot u$.
- Biến $u$ **hoàn toàn không tham gia** vào $q_i$ (vì $q_i$ chỉ phụ thuộc $y$).
- Do đó, trong 16 phương trình $Q(x) = V_{\text{null}} P(x)$, biến $u$ chỉ xuất hiện ở bậc 1:
  $$Q(u, y) = K \cdot u + G(y)$$
  với $K \in \mathbb{F}_{17}^{16 \times 16}$ là ma trận số nguyên hằng số và $G(y)$ là vector đa thức bậc 2 thuần túy theo $y$.

Kiểm tra tính khả nghịch: $\det(K) \ne 0 \pmod{17}$, ma trận $K$ hoàn toàn khả nghịch!
Với bản mã $C$, đặt $\text{target\_Q} = V_{\text{null}} \cdot C$. Tại bản rõ $x^* = T^{-1} (u^*, y^*)$:
$$K \cdot u^* + G(y^*) = \text{target\_Q} \implies u^*(y) = K^{-1} \big( \text{target\_Q} - G(y) \big)$$
Điều này có nghĩa: **Biến $u$ bị triệt tiêu hoàn toàn và được biểu diễn đơn ánh theo biến $y$!**

**Hệ quả sụp đổ bậc (Degree Collapse):**
Khi gán $u = u^*(y)$, theo định nghĩa của $V_{\text{null}}$:
$$w(u^*(y), y) \equiv w(x^*) = \text{const} \quad (\forall y)$$
Vì $w$ đã trở thành vector hằng số, khi thế vào 18 phương trình công khai độc lập còn lại $P_{\text{indep}}$:
$$U_k(w^*, z_{16 \dots 31}) = U_k(w^*, B y + d)$$
Đa thức $U_k$ vốn là bậc hai theo $(w, z)$, nay $w$ đã là hằng số nên $U_k$ **sụp đổ từ bậc 4 xuống thành đa thức bậc 2 thuần túy theo $y$**:
$$E_k(y) = y^T M_k y + L_k y + c_k = 0 \quad (k = 0, \dots, 17)$$
Kiểm tra thực nghiệm bằng sai phân cấp 3: $\Delta_d^3 E_k(y) \equiv 0 \pmod{17}$ chứng minh 100% các phương trình đã chuyển thành bậc hai!

---

#### 4.3.4. Giai đoạn 4: Bẻ gãy tính đối xứng UOV - Khôi phục không gian Oil (Kipnis-Shamir Kernel Attack)
Bây giờ ta có 18 phương trình bậc hai theo 16 biến $y$.
Mỗi phương trình có ma trận đối xứng $M_k \in \mathbb{F}_{17}^{16 \times 16}$.

Nhớ lại cấu trúc UOV của tầng $U$:
- Vector $z_{16 \dots 31}$ gồm $s = 4$ biến Vinegar và $o = 12$ biến Oil.
- Không có số hạng $\text{Oil} \times \text{Oil}$.
- Do đó, tồn tại một không gian con Oil $O \subset \mathbb{F}_{17}^{16}$ có số chiều $\dim(O) = 12$ sao cho trên $O$, dạng toàn phương bị triệt tiêu hoàn toàn:
  $$\forall x, z \in O, \; \forall k \in [0..17]: \quad x^T M_k z = 0 \iff O^T M_k O = 0_{12 \times 12}$$

Trong hệ cơ sở chuẩn hóa đưa $O$ về 12 tọa độ cuối:
$$M_k = \begin{pmatrix} A_k & B_k \\ B_k^T & 0_{12 \times 12} \end{pmatrix}$$
Trong đó $A_k$ có kích thước $4 \times 4$, $B_k$ có kích thước $4 \times 12$.
- Hạng của $M_k$ bị chặn bởi:
  $$\operatorname{Rank}(M_k) \le \operatorname{Rank}(A_k) + 2 \cdot \operatorname{Rank}(B_k) \le 4 + 4 = 8$$
  Thực nghiệm kiểm tra: Đúng $18/18$ ma trận đều có hạng **chính xác bằng 8**!
- Số chiều hạt nhân: $\dim(\ker(M_k)) = 16 - 8 = 8$.
- Xét một vector $v = \begin{pmatrix} x \\ z \end{pmatrix} \in \ker(M_k)$:
  $$M_k v = \begin{pmatrix} A_k x + B_k z \\ B_k^T x \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix} \implies B_k^T x = 0$$
  Vì $B_k^T$ có kích thước $12 \times 4$ và có hạng cột đầy đủ bằng 4, phương trình $B_k^T x = 0$ buộc $x = 0$!
  Do đó $v = \begin{pmatrix} 0 \\ z \end{pmatrix} \in O$.

$$\mathbf{\ker(M_k) \subseteq O \quad (\forall k \in [0..17])}$$
Toàn bộ hạt nhân của cả 18 ma trận đều nằm trọn vẹn bên trong không gian Oil!
Lấy tổng trực tiếp của các không gian hạt nhân này:
$$O = \sum_{k=0}^{17} \ker(M_k) \subset \mathbb{F}_{17}^{16}$$
Chỉ cần lấy tổng hạt nhân của vài ma trận đầu tiên, ta lập tức thu được một không gian vector có số chiều đúng bằng **12**.
Kiểm tra điều kiện trực giao đẳng hướng:
$$O_{\text{basis}} \cdot M_k \cdot O_{\text{basis}}^T \equiv 0 \pmod{17} \quad (\forall k)$$
Hoàn toàn thỏa mãn! Không gian Oil $O$ đã bị phơi bày 100%!

---

#### 4.3.5. Giai đoạn 5: Vét cạn Vinegar & Khử Gauss siêu tốc (High-Performance C Solver)
Chọn không gian bù $V$ có số chiều $16 - 12 = 4$ sao cho $\mathbb{F}_{17}^{16} = V \oplus O$.
Đặt ma trận chuyển cơ sở $S = [S_V \mid S_O]$, với $S_V \in \mathbb{F}_{17}^{16 \times 4}$ và $S_O \in \mathbb{F}_{17}^{16 \times 12}$.
Mọi vector $y$ được phân tích duy nhất thành:
$$y = S_V \cdot v + S_O \cdot o \quad (v \in \mathbb{F}_{17}^4, \; o \in \mathbb{F}_{17}^{12})$$

Thay biểu thức này vào 18 phương trình bậc hai $E_k(y) = y^T M_k y + L_k y + c_k = 0$:
$$y^T M_k y = v^T (S_V^T M_k S_V) v + 2 v^T (S_V^T M_k S_O) o + \underbrace{o^T (S_O^T M_k S_O) o}_{= 0}$$
Số hạng bậc hai của $o$ triệt tiêu hoàn toàn! Hệ phương trình trở thành **tuyến tính đối với 12 biến Oil $o$**:
$$A(v) \cdot o + b(v) = 0 \pmod{17}$$
Trong đó:
$$\begin{aligned}
A(v)_{k, :} &= 2 (S_V v)^T M_k S_O + L_k S_O \in \mathbb{F}_{17}^{1 \times 12} \\
b(v)_k &= v^T (S_V^T M_k S_V) v + L_k S_V v + c_k \in \mathbb{F}_{17}
\end{aligned}$$

- Số lượng khả năng của vector Vinegar $v \in \mathbb{F}_{17}^4$ chỉ là:
  $$17^4 = \mathbf{83.521 \text{ trường hợp}}$$
- Với mỗi $v$, ta có hệ gồm 18 phương trình tuyến tính cho 12 ẩn $o$. Hệ này dư thừa $18 - 12 = 6$ phương trình ràng buộc, nên xác suất một vector $v$ ngẫu nhiên thỏa mãn hệ là:
  $$17^{-6} \approx \frac{1}{24.137.569}$$
  Do đó, chỉ có **duy nhất một vector $v$ đúng** tạo ra hệ phương trình có nghiệm!

Viết chương trình tìm kiếm bằng ngôn ngữ C (`solver.c`):
- Duyệt qua $83.521$ giá trị của $v$.
- Thiết lập ma trận mở rộng $[A(v) \mid -b(v)]$ kích thước $18 \times 13$.
- Khử Gauss trên 12 cột đầu. Nếu 6 hàng cuối xuất hiện mâu thuẫn ($0 \ne \text{RHS}$), lập tức `break` chuyển sang $v$ tiếp theo (Early Exit).
- **Hiệu năng:** Khử Gauss trên C chỉ mất chưa đầy **4 mili-giây** để quét sạch $83.521$ trường hợp và tìm ra nghiệm duy nhất $(v, o)$!

---

### 4.4. Chiến lược khai thác đầu-cuối (End-to-End Exploit Pipeline)

1. **Khởi tạo & Tiền tính toán một lần (Offline Precomputation - `step1_save.py`):**
   - Đọc `out.txt`, trích xuất 60 đơn thức bậc 3 & 4 để tính hạt nhân trái $V_{\text{null}}$ ($16 \times 34$).
   - Lấy gradient bậc 4 để tìm ma trận đổi biến $T$ và $T^{-1}$ ($32 \times 32$).
   - Rút gọn 16 đa thức bậc hai $Q(x)$ lưu vào `Q_polys.json`.
   - Tính ma trận tuyến tính $K$ và $K^{-1}$ ($16 \times 16$).
   - Nội suy 18 ma trận dạng toàn phương $M_k$ ($16 \times 16$).
   - Tính hạt nhân của các $M_k$, hợp nhất để lấy cơ sở không gian Oil $S_O$ ($16 \times 12$) và không gian bù $S_V$ ($16 \times 4$).
   - Lưu toàn bộ vào file nhị phân `precomputed.npz` (chỉ chạy một lần mất ~100s).

2. **Giải mã từng khối bản mã (Online Solving - `solve_all.py`):**
   Với mỗi khối bản mã $C \in \mathbb{F}_{17}^{34}$:
   - Tính $\text{target\_Q} = V_{\text{null}} \cdot C$.
   - Nội suy nhanh vector tuyến tính $L_k$ và hằng số $c_k$ (chỉ cần 17 lần đánh giá đa thức rút gọn, mất ~5s).
   - Xuất các tensor tham số vào `params.bin`.
   - Gọi `solver.exe` để tìm nghiệm $(v, o)$ trong vài mili-giây.
   - Tái tạo: $y = S_V v + S_O o \implies u = K^{-1}(\text{target\_Q} - Q(0, y)) \implies x = T^{-1} \begin{pmatrix} u \\ y \end{pmatrix}$.
   - Kiểm tra tính đúng đắn: $P(x) \equiv C \pmod{17}$ khớp 100%.

3. **Giải mã Frame Base-17:**
   - Nối 3 vector nghiệm $x_0, x_1, x_2$ thành chuỗi 96 chữ số cơ số 17.
   - Chuyển đổi 2 chữ số cơ số 17 thành 1 byte ($17^2 = 289 > 256$).
   - Đọc 4 byte độ dài đầu và trích xuất chuỗi ký tự UTF-8 của Flag.

---

### 4.5. Mã nguồn khai thác hoàn chỉnh (C & Python)

#### 1. Bộ giải nghiệm C siêu tốc (`solver.c`)

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Bảng nghịch đảo modulo 17: inv17[a] * a = 1 (mod 17)
static const int inv17[17] = {0, 1, 9, 6, 13, 7, 3, 5, 15, 2, 12, 14, 10, 4, 11, 8, 16};

int H[18][4][12];
int D[18][12];
int F[18][4][4];
int G[18][4];
int C_const[18];

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <params.bin>\n", argv[0]);
        return 1;
    }
    FILE *f = fopen(argv[1], "rb");
    if (!f) {
        perror("fopen");
        return 1;
    }
    fread(H, sizeof(int), 18 * 4 * 12, f);
    fread(D, sizeof(int), 18 * 12, f);
    fread(F, sizeof(int), 18 * 4 * 4, f);
    fread(G, sizeof(int), 18 * 4, f);
    fread(C_const, sizeof(int), 18, f);
    fclose(f);

    int v[4];
    int aug[18][13];

    // Vét cạn 17^4 = 83521 tổ hợp của vector Vinegar v
    for (v[0] = 0; v[0] < 17; v[0]++) {
    for (v[1] = 0; v[1] < 17; v[1]++) {
    for (v[2] = 0; v[2] < 17; v[2]++) {
    for (v[3] = 0; v[3] < 17; v[3]++) {
        // Xây dựng ma trận hệ số mở rộng [A(v) | -b(v)]
        for (int k = 0; k < 18; k++) {
            // A(v)_{k, j} = 2 * sum_i(v_i * H_{k, i, j}) + D_{k, j}
            for (int j = 0; j < 12; j++) {
                int sum = D[k][j];
                for (int i = 0; i < 4; i++) {
                    sum += 2 * v[i] * H[k][i][j];
                }
                aug[k][j] = sum % 17;
                if (aug[k][j] < 0) aug[k][j] += 17;
            }
            // b(v)_k = C_const_k + sum_i(G_{k, i} * v_i) + sum_{i, j}(F_{k, i, j} * v_i * v_j)
            int b = C_const[k];
            for (int i = 0; i < 4; i++) {
                b += G[k][i] * v[i];
                for (int j = 0; j < 4; j++) {
                    b += F[k][i][j] * v[i] * v[j];
                }
            }
            b = b % 17;
            if (b < 0) b += 17;
            aug[k][12] = (17 - b) % 17;
        }

        // Khử Gauss trên trường F_17
        int cur_row = 0;
        int consistent = 1;
        for (int col = 0; col < 12; col++) {
            int piv = -1;
            for (int r = cur_row; r < 18; r++) {
                if (aug[r][col] != 0) {
                    piv = r;
                    break;
                }
            }
            if (piv == -1) continue;

            if (piv != cur_row) {
                for (int c = col; c <= 12; c++) {
                    int tmp = aug[cur_row][c];
                    aug[cur_row][c] = aug[piv][c];
                    aug[piv][c] = tmp;
                }
            }
            int inv = inv17[aug[cur_row][col]];
            for (int c = col; c <= 12; c++) {
                aug[cur_row][c] = (aug[cur_row][c] * inv) % 17;
            }
            for (int r = 0; r < 18; r++) {
                if (r != cur_row && aug[r][col] != 0) {
                    int factor = aug[r][col];
                    for (int c = col; c <= 12; c++) {
                        aug[r][c] = (aug[r][c] - factor * aug[cur_row][c]) % 17;
                        if (aug[r][c] < 0) aug[r][c] += 17;
                    }
                }
            }
            cur_row++;
        }

        // Kiểm tra tính tương thích của 6 phương trình dư thừa
        for (int r = cur_row; r < 18; r++) {
            if (aug[r][12] != 0) {
                consistent = 0;
                break;
            }
        }

        if (consistent && cur_row == 12) {
            printf("SOLUTION_FOUND\n");
            printf("V: %d %d %d %d\n", v[0], v[1], v[2], v[3]);
            printf("O: ");
            for (int r = 0; r < 12; r++) {
                printf("%d ", aug[r][12]);
            }
            printf("\n");
            return 0;
        }
    }}}}
    printf("NO_SOLUTION\n");
    return 1;
}
```

#### 2. Kịch bản giải mã đầu-cuối (`solve_all.py`)

```python
#!/usr/bin/env python3
"""Severed Symmetry - End-to-End Cryptanalysis & Decryption Pipeline
CSSCTF 2026 - Cryptography Challenge
"""

import json
import subprocess
import time
import numpy as np

p = 17
n = 32

print("[*] Đang tải khóa công khai và bản mã từ out.txt...")
t0 = time.time()
with open("out.txt") as f:
  data = json.load(f)

polys = data["public_key"]["polynomials"]
blocks = data["ciphertext"]["blocks"]

print("[*] Đang tải các cấu trúc đại số đã tiền tính toán...")
pre = np.load("precomputed.npz")
T_inv = pre["T_inv"]
null_basis = pre["null_basis"]
K_inv = pre["K_inv"]
independent_indices = pre["independent_indices"]
M_mats = pre["M_mats"]  # (18, 16, 16)
S_V = pre["S_V"]  # (16, 4)
S_O = pre["S_O"]  # (16, 12)

with open("Q_polys.json") as f:
  Q_polys_raw = json.load(f)

Q_polys = []
for k in range(16):
  q_dict = {}
  for mon_str, c in Q_polys_raw[k].items():
    mon = tuple(json.loads(mon_str))
    q_dict[mon] = c
  Q_polys.append(q_dict)


def eval_Q_fast(x):
  res = np.zeros(16, dtype=int)
  for k in range(16):
    val = 0
    for mon, c in Q_polys[k].items():
      term = c
      for v in mon:
        term = (term * x[v]) % p
      val = (val + term) % p
    res[k] = val
  return res


def eval_poly_indep(idx, x):
  val = 0
  for c, mon in polys[idx]:
    term = c
    for v in mon:
      term = (term * x[v]) % p
    val = (val + term) % p
  return val


def eval_poly_all(poly, x):
  val = 0
  for c, mon in poly:
    term = c
    for v in mon:
      term = (term * x[v]) % p
    val = (val + term) % p
  return val


# Tiền tính toán các tensor H và F (độc lập với bản mã C)
H_tensors = np.zeros((18, 4, 12), dtype=np.int32)
F_tensors = np.zeros((18, 4, 4), dtype=np.int32)
for k in range(18):
  H_tensors[k] = (S_V.T @ M_mats[k] @ S_O) % p
  F_tensors[k] = (S_V.T @ M_mats[k] @ S_V) % p


def solve_block(block_idx, C):
  print(f"\n[*] Đang giải mã Khối bản mã {block_idx}...")
  t_blk = time.time()
  target_Q = (null_basis @ C) % p
  C_indep = C[independent_indices]

  def get_u_star(y):
    x_0_y = (T_inv @ np.concatenate([np.zeros(16, dtype=int), y])) % p
    Q_0_y = eval_Q_fast(x_0_y)
    return (K_inv @ ((target_Q - Q_0_y) % p)) % p

  def eval_reduced(y):
    u = get_u_star(y)
    x = (T_inv @ np.concatenate([u, y])) % p
    return np.array([eval_poly_indep(idx, x) for idx in independent_indices])

  # Nội suy nhanh tại 0 và 16 vector đơn vị e_i (chỉ 17 điểm đánh giá)
  P0 = eval_reduced(np.zeros(16, dtype=int))
  P_ei = np.zeros((16, 18), dtype=int)
  for i in range(16):
    e = np.zeros(16, dtype=int)
    e[i] = 1
    P_ei[i] = eval_reduced(e)

  L_coeff = np.zeros((18, 16), dtype=int)
  for k in range(18):
    for i in range(16):
      L_coeff[k, i] = (P_ei[i, k] - P0[k] - M_mats[k, i, i]) % p

  C_const = (P0 - C_indep) % p

  D_mat = np.zeros((18, 12), dtype=np.int32)
  G_mat = np.zeros((18, 4), dtype=np.int32)
  for k in range(18):
    D_mat[k] = (L_coeff[k] @ S_O) % p
    G_mat[k] = (L_coeff[k] @ S_V) % p

  C_const_32 = C_const.astype(np.int32)

  # Ghi tham số sang nhị phân để C solver xử lý
  with open("params.bin", "wb") as f:
    f.write(H_tensors.tobytes())
    f.write(D_mat.tobytes())
    f.write(F_tensors.tobytes())
    f.write(G_mat.tobytes())
    f.write(C_const_32.tobytes())

  res = subprocess.run(["./solver.exe", "params.bin"], capture_output=True, text=True)
  if "SOLUTION_FOUND" not in res.stdout:
    raise RuntimeError("[-] C Solver không tìm thấy nghiệm!")

  lines = res.stdout.strip().split("\n")
  v_line = [l for l in lines if l.startswith("V:")][0]
  o_line = [l for l in lines if l.startswith("O:")][0]
  v_sol = np.array([int(x) for x in v_line[2:].split()], dtype=int)
  o_sol = np.array([int(x) for x in o_line[2:].split()], dtype=int)
  print(f"[+] Tìm thấy nghiệm Vinegar: {v_sol}")
  print(f"[+] Tìm thấy nghiệm Oil:     {o_sol}")

  # Khôi phục tọa độ ban đầu x
  y_sol = (S_V @ v_sol + S_O @ o_sol) % p
  u_sol = get_u_star(y_sol)
  x_sol = (T_inv @ np.concatenate([u_sol, y_sol])) % p

  # Xác thực lại với hệ phương trình gốc
  encrypted = np.array([eval_poly_all(poly, x_sol) for poly in polys])
  assert np.all((encrypted - C) % p == 0), "[-] Xác thực thất bại!"
  print(f"[+] Khối {block_idx} đã được giải mã và xác thực thành công trong {time.time() - t_blk:.2f}s!")
  return x_sol


def byte_width(p):
  width = 1
  while p**width < 256:
    width += 1
  return width


def decode_frame(digits, p, n):
  width = byte_width(p)
  if len(digits) < 4 * width:
    raise ValueError("Missing length header")

  def decode_byte(start):
    value = 0
    for digit in digits[start : start + width]:
      value = value * p + digit
    if value > 255:
      raise ValueError("Preimage is not a byte block")
    return value

  length = int.from_bytes(
      bytes(decode_byte(i * width) for i in range(4)), "big"
  )
  end = (4 + length) * width
  if (
      end > len(digits)
      or len(digits) != ((end + n - 1) // n) * n
      or any(digits[end:])
  ):
    raise ValueError("Invalid length or padding")
  return bytes(decode_byte(i) for i in range(4 * width, end, width))


# Giải tuần tự cả 3 khối bản mã
all_x = []
for idx, blk in enumerate(blocks):
  x_sol = solve_block(idx, np.array(blk))
  all_x.extend(list(x_sol))

print("\n[*] Toàn bộ các khối đã được giải mã thành công!")
plaintext = decode_frame(all_x, p, n)
print("\n" + "=" * 48)
print(f"FLAG: {plaintext.decode('utf-8', errors='replace')}")
print("=" * 48 + "\n")
```

---

### 4.6. Flag

$$\mathbf{CSSCTF\{P35T0\_5CH3M3\_4TT4CK2026\}}$$

*(Ý nghĩa Flag: **PESTO Scheme Attack** - PESTO là tên gọi chơi chữ của món sốt gồm dầu giấm và húng tây, biểu thị cho sự kết hợp giữa kiến trúc Tame biến đổi tam giác và lớp Unbalanced Oil & Vinegar).*

---

## 5. Tổng kết & Bài học kinh nghiệm

| Tiêu chí | Chrono I | Chrono II | Chimera Vault | Severed Symmetry |
| :--- | :--- | :--- | :--- | :--- |
| **Thể loại mật mã** | Polyalphabetic Substitution (Vigenère) | Multi-gear Stream Cipher (Mã dòng bánh răng) | Multi-layer Cryptosystem (DSP + Linear Algebra + Knapsack) | Multivariate Public Key Cryptography (MPKC - Tame + UOV) |
| **Dữ liệu đầu vào** | Ciphertext tĩnh + Timestamp | Dòng bản mã biến thiên thời gian thực (1 Hz) | Dòng âm thanh PCM Base64 + Ma trận trạng thái + Knapsack Sum | 34 đa thức công khai bậc 4 (out.txt 31MB) + Ciphertext 3 khối |
| **Khóa giải mã** | Chuỗi số mốc thời gian (14 chữ số) | Dòng khóa tuần hoàn chu kỳ 77 giây ($\text{lcm}(7, 11)$) | Khóa $W$ ẩn trong vết ma trận $\operatorname{Tr}(D) \pmod N$ | Ánh xạ affine $A_1, A_2$ và các đa thức bẫy $q, U$ |
| **Điểm yếu cốt lõi** | Tiền tố cố định `CSSCTF` lộ bước dịch | Độ trễ pha không gian - thời gian $\Delta t = 34$ | - Tần số là bội số của 5Hz<br>- Bất biến vết ma trận $\operatorname{Tr}(M_{k+1}-M_k)$<br>- Dãy ba-lô siêu tăng suy biến khi biết $W$ | - Số chiều đa thức bậc cao không đầy đủ ($\operatorname{Rank}=18 < 34$)<br>- Số hạng bậc 4 chỉ phụ thuộc 16 biến đáy<br>- Không gian Oil $O$ triệt tiêu dạng toàn phương ($o=12 > v=4$) |
| **Kỹ thuật tấn công** | Known-Plaintext Attack | KPA + Phân tích chu kỳ tuần hoàn $\gcd$ | DTFT Orthogonal Projection + Matrix Trace Invariant + Merkle-Hellman Trapdoor Inversion | Left Nullspace Degree Elimination + Gradient Subspace Isolation + Kipnis-Shamir Kernel Attack + Exhaustive C Solver |

### Bài học rút ra:
1. **Phân tích miền tần số (DSP in Cryptography):** Khi một hệ thống mã hóa che giấu khóa trong dạng sóng âm thanh, việc xác định rõ các ràng buộc cấu trúc (tần số lấy mẫu, bước nhảy lượng tử hóa, tập tần số rời rạc) cho phép ta áp dụng biến đổi chiếu trực giao trực tiếp (Direct Projection) với độ chính xác tuyệt đối mà không sợ nhiễu trắng hay rò rỉ phổ.
2. **Ảo ảnh về sự phức tạp (Security through Pseudo-Complexity):** Việc đề bài sử dụng các khái niệm hoa mỹ như *"Non-commutative Matrix Drift"* chỉ là bình phong che đậy một phép toán cộng tuyến tính đơn giản. Trong đại số tuyến tính, vết ma trận ($\operatorname{Tr}$) có tính chất tuyến tính tuyệt vời: $\operatorname{Tr}(A + B) = \operatorname{Tr}(A) + \operatorname{Tr}(B)$. Bất biến vết ma trận luôn là "gót chân Achilles" của các cấu trúc dịch chuyển đường chéo.
3. **Sự sụp đổ của Merkle-Hellman Knapsack Cryptosystem:** Bài toán Subset Sum là bài toán NP-đầy đủ trong trường hợp tổng quát, nhưng phiên bản siêu tăng (superincreasing) lại có độ phức tạp thời gian tuyến tính $O(n)$. Toàn bộ tính bảo mật của Merkle-Hellman phụ thuộc vào việc giữ bí mật số nhân $W$ và modulus $M_{\text{mod}}$. Một khi $W$ bị rò rỉ, bài toán ngay lập tức suy biến về dạng tầm thường.
4. **Sự mong manh của hệ mật mã nhiều biến (MPKC Vulnerabilities):**
   - **Tấn công triệt tiêu bậc (Degree Elimination):** Khi người thiết kế cố gắng giấu các thành phần bậc thấp (như $w$ bậc 2) bên trong các phương trình bậc cao (bậc 4) thông qua phép trộn affine $A_1$, nếu số phương trình bậc cao ($18$) nhỏ hơn tổng số phương trình công khai ($34$), ma trận hệ số bậc cao luôn tồn tại hạt nhân trái (Left Nullspace). Phép chiếu này lập tức bóc tách hoàn toàn lớp vỏ bọc bậc cao, đưa hệ phương trình về bậc thấp hơn.
   - **Tấn công tính đối xứng UOV (Kipnis–Shamir Attack):** Trong các hệ Oil & Vinegar, điều kiện an toàn tối thiểu là số biến Vinegar phải lớn hơn hoặc bằng số biến Oil ($v \ge o$). Khi $o > v$ (ở đây $o = 12, v = 4$), các ma trận đối xứng của dạng toàn phương bị suy biến hạng trầm trọng ($\operatorname{Rank} \le 2v = 8$). Hạt nhân của các ma trận này tự động nằm hoàn toàn trong không gian Oil, biến bài toán tìm không gian bẫy thành bài toán tìm không gian con chung tầm thường trong đại số tuyến tính.
   - **Tối ưu hóa đa tầng (C Acceleration for CTF):** Kết hợp phân tích đại số trừu tượng bằng Python để thu hẹp không gian tìm kiếm xuống $17^4 = 83.521$ trạng thái, rồi dùng ngôn ngữ C cấp thấp để vét cạn và khử Gauss chỉ trong vài mili-giây là một chiến thuật mẫu mực để giải quyết các bài mật mã nhiều biến thời gian thực.

