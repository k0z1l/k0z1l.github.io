---
title: '[CSSCTF] Steganography: Colour Shift'
date: '2026-10-02'
description: Writeup thử thách Steganography "Colour Shift" trong giải CSSCTF - phân
  tích ảnh BMP và trích xuất flag.
categories: [CSSCTF, Steganography]
tags: [cssctf, steganography, image-analysis, bmp]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# 🌈 CTF Write-up: Colour Shift

**Competition:** CSSCTF  
**Category:** Steganography  
**Challenge Name:** Colour Shift  
**Flag:** `CSSCTF{SHINE_ON}`  
**Difficulty:** Easy-Medium  
**File:** `colorshiftctf.bmp` (1,083,738 bytes)

---

## 📋 Mô tả Challenge

> In 1666 Issac Newton split light into their composite wavelengths. Can you?
>
> Flag format: CSSCTF{...}

Hint cực kỳ quan trọng: Newton năm 1666 dùng **lăng kính** để phân tách ánh sáng trắng thành **các bước sóng màu sắc khác nhau** (đỏ, cam, vàng, lục, lam, chàm, tím — tức là phổ RGB). Đây là gợi ý trực tiếp để **tách/phân tích các kênh màu** (R, G, B) của ảnh.

---

## 🔍 Bước 1: Phân tích file ban đầu

### 1.1 Kiểm tra BMP header

```python
with open('colorshiftctf.bmp', 'rb') as f:
    header = f.read(54)

# Kết quả:
# Signature:    BM  (hợp lệ)
# File size:    1,083,738 bytes
# Pixel offset: 138 (DIB header mở rộng = 124 bytes)
# Width:        599 pixels
# Height:       602 pixels
# Bit depth:    24-bit (RGB, không có alpha)
# Compression:  0 (không nén - BI_RGB)
```

File là BMP 24-bit chuẩn, kích thước 599×602 pixels. Không có compression — mỗi pixel lưu trực tiếp giá trị R, G, B.

### 1.2 Nhận diện ảnh gốc

Mở ảnh ra (hoặc quan sát kênh màu) thấy ngay đây là bìa album **"The Dark Side of the Moon" (1973) của Pink Floyd** — hình ảnh ánh sáng trắng đi qua lăng kính và tách thành quang phổ cầu vồng.

> [!NOTE]
> Đây không phải ngẫu nhiên! Album này kết nối trực tiếp với hint về Newton và ánh sáng. Pink Floyd cũng có bài nổi tiếng **"Shine On You Crazy Diamond"** — chính là flag!

---

## 🔬 Bước 2: Phân tích kênh màu

### 2.1 Thống kê từng kênh

```python
from PIL import Image
import numpy as np

img = Image.open('colorshiftctf.bmp')
arr = np.array(img)

print(f"R: min={arr[:,:,0].min()}, max={arr[:,:,0].max()}, unique={len(np.unique(arr[:,:,0]))}")
print(f"G: min={arr[:,:,1].min()}, max={arr[:,:,1].max()}, unique={len(np.unique(arr[:,:,1]))}")
print(f"B: min={arr[:,:,2].min()}, max={arr[:,:,2].max()}, unique={len(np.unique(arr[:,:,2]))}")
```

```
R: min=0, max=255, unique=256  ← toàn range
G: min=0, max=240, unique=236  ← thiếu một số giá trị
B: min=0, max=215, unique=215  ← range hẹp hơn, ít unique values hơn!
```

> [!IMPORTANT]
> Kênh **B (Blue)** có max chỉ là 215 và chỉ 215 giá trị unique — khác biệt rõ so với R và G. Đây là dấu hiệu kênh B đã bị **can thiệp/modify**.

### 2.2 Phân tích bit planes

```python
for i, ch in enumerate(['R','G','B']):
    for bit in range(8):
        plane = (arr[:,:,i] >> bit) & 1
        ratio = plane.mean()
        print(f"  {ch} bit{bit}: mean={ratio:.4f}")
```

```
R bit0: mean=0.5228  ← ~50/50 random noise (bình thường cho ảnh tự nhiên)
R bit4: mean=0.1159  ← thấp hơn, phù hợp với ảnh tối
...
B bit5: mean=0.6891  ← ⚠️ Cao bất thường!
B bit6: mean=0.0337  ← thấp đột ngột
```

Bit plane 5 của kênh B có tỷ lệ cao bất thường → dữ liệu ẩn có thể nằm ở đây.

---

## 🎯 Bước 3: Kỹ thuật tìm flag — Channel Difference

### 3.1 Lý thuyết

Kỹ thuật **Channel Difference** (hay Color Plane Subtraction): lấy hiệu tuyệt đối giữa hai kênh màu. Nếu một kênh được modify để nhúng thông tin ẩn, sự khác biệt giữa nó và kênh gốc sẽ lộ ra dữ liệu ẩn.

Newton "split light" → ta cũng split ảnh thành từng wavelength (kênh) rồi so sánh!

```
diff(R, B) = |R_pixel - B_pixel|
```

Đối với ảnh tự nhiên (không có stego), R và B thường tương quan tốt ở vùng tối. Nếu B bị modify nhỏ (nhúng text), diff sẽ cao ở vùng có text.

### 3.2 Thực hiện

```python
diff_rb = np.abs(arr[:,:,0].astype(int) - arr[:,:,2].astype(int)).astype(np.uint8)
diff_image = Image.fromarray(diff_rb)

# Tăng contrast mạnh để làm nổi bật sự khác biệt
from PIL import ImageEnhance
enhanced = ImageEnhance.Contrast(diff_image).enhance(50.0)
enhanced.save('diff_RB_enhanced.png')
```

### 3.3 Kết quả

Ảnh diff_RB sau khi tăng contrast hiển thị rõ ràng dòng chữ:

```
CSSCTF{SHINE_ON}
```

Chữ xuất hiện ở vùng **phía dưới-trái** của ảnh (khoảng 2/3 chiều cao), trên nền tối của ảnh Dark Side of the Moon.

---

## 🏆 Flag

```
CSSCTF{SHINE_ON}
```

**Ý nghĩa flag:** "Shine On" là tham chiếu đến bài hát **"Shine On You Crazy Diamond"** của Pink Floyd (từ album *Wish You Were Here*, 1975) — một tribute cho Syd Barrett. Kết hợp hoàn hảo với hình ảnh bìa album Dark Side of the Moon.

---

## 📊 Sơ đồ phân tích

```
colorshiftctf.bmp (BMP 24-bit, 599x602)
        |
        +--> Kênh R (Red)   ─────────────┐
        |                                 ├─ |R - B| = diff_RB
        +--> Kênh G (Green)              │   (tăng contrast ×50)
        |                                 │              │
        +--> Kênh B (Blue) ──────────────┘              ▼
             [MODIFIED - chứa text ẩn]         FLAG lộ diện!
                                            CSSCTF{SHINE_ON}
```

---

## 🛠️ Script khai thác hoàn chỉnh

```python
#!/usr/bin/env python3
"""
CTF Write-up: Colour Shift (Steganography)
Technique: RGB Channel Difference Analysis
Flag: CSSCTF{SHINE_ON}
"""

from PIL import Image, ImageEnhance
import numpy as np

# === Bước 1: Đọc file ===
img = Image.open('colorshiftctf.bmp')
arr = np.array(img)

print(f"[*] Image: {img.size[0]}x{img.size[1]}, mode={img.mode}")

# === Bước 2: Phân tích từng kênh ===
for i, ch in enumerate(['R', 'G', 'B']):
    channel = arr[:, :, i]
    print(f"[*] Channel {ch}: min={channel.min()}, max={channel.max()}, "
          f"unique_values={len(np.unique(channel))}")

# === Bước 3: Tách từng kênh ra ảnh riêng ===
r_img = Image.fromarray(arr[:, :, 0], 'L')  # Red
g_img = Image.fromarray(arr[:, :, 1], 'L')  # Green
b_img = Image.fromarray(arr[:, :, 2], 'L')  # Blue

r_img.save('channel_R.png')
g_img.save('channel_G.png')
b_img.save('channel_B.png')
print("[+] Saved individual channel images")

# === Bước 4: Tính channel difference (Newton's wavelength split) ===
# |R - B| để phát hiện modification trong kênh B
diff_rb = np.abs(arr[:, :, 0].astype(int) - arr[:, :, 2].astype(int)).astype(np.uint8)
diff_image = Image.fromarray(diff_rb)

print(f"[*] diff_RB stats: min={diff_rb.min()}, max={diff_rb.max()}, "
      f"mean={diff_rb.mean():.2f}")

# === Bước 5: Tăng contrast để lộ hidden text ===
enhanced = ImageEnhance.Contrast(diff_image).enhance(50.0)
enhanced.save('flag_revealed.png')
print("[+] Saved flag_revealed.png — open this to see the flag!")

# === Bonus: Zoom vào vùng text ===
h, w = arr.shape[:2]
# Text ở khoảng 60-75% chiều cao
text_region = diff_rb[int(h*0.60):int(h*0.80), :]
text_img = Image.fromarray(text_region)
text_enhanced = ImageEnhance.Contrast(text_img).enhance(30)
text_big = text_enhanced.resize((w * 3, int(h * 0.20) * 3), Image.LANCZOS)
text_big.save('flag_text_zoom.png')
print("[+] Saved flag_text_zoom.png — zoomed in on the flag text")

print("\n" + "="*50)
print("FLAG: CSSCTF{SHINE_ON}")
print("="*50)
```

**Output:**

```
[*] Image: 599x602, mode=RGB
[*] Channel R: min=0, max=255, unique_values=256
[*] Channel G: min=0, max=240, unique_values=236
[*] Channel B: min=0, max=215, unique_values=215   ← Suspicious!
[+] Saved individual channel images
[*] diff_RB stats: min=0, max=243, mean=29.54
[+] Saved flag_revealed.png — open this to see the flag!
[+] Saved flag_text_zoom.png — zoomed in on the flag text

==================================================
FLAG: CSSCTF{SHINE_ON}
==================================================
```

---

## 🧠 Phân tích kỹ thuật ẩn giấu

### Cách thức nhúng (ước đoán)

Text được nhúng vào ảnh bằng cách **modify kênh Blue** tại các pixel tương ứng với vị trí các ký tự của flag:

```
B_modified[x, y] = B_original[x, y] + delta

Với delta nhỏ (≈ 20-50) → không thể thấy bằng mắt thường
Nhưng diff = |R - B_modified| ≠ |R - B_original| → phát hiện được
```

Kỹ thuật này gọi là **Color Channel Steganography** — khác với LSB (Least Significant Bit) thông thường ở chỗ:
- LSB: thay đổi bit cuối (±1), rất nhỏ
- Color Channel: thay đổi cả block pixel (±20-50), tạo ra pattern nhìn thấy khi diff channels

### Tại sao R và B?

- Ảnh Dark Side of the Moon có tông màu **lạnh, tối** → R ≈ B ở hầu hết pixels
- Khi nhúng text vào B → delta tạo ra sự khác biệt rõ ràng so với R
- Nếu nhúng vào G, diff_RG hoặc diff_GB cũng sẽ lộ, nhưng ít rõ hơn do G thường sáng hơn

---

## 📚 Bài học rút ra

| Bước | Kỹ thuật | Công cụ |
|------|----------|---------|
| Đọc metadata | BMP header parsing | Python `struct`, `PIL` |
| Nhận diện context | Image recognition | Quan sát bằng mắt |
| Phân tích thống kê | Channel statistics, bit planes | NumPy |
| Tách kênh màu | RGB channel split | PIL `Image.fromarray` |
| Channel difference | `\|R - B\|` | NumPy `np.abs` |
| Tăng contrast | Reveal hidden text | PIL `ImageEnhance.Contrast` |

> [!TIP]
> Khi gặp bài stego với ảnh màu, **luôn thử**:
> 1. Tách kênh R, G, B riêng lẻ
> 2. XOR từng cặp kênh
> 3. Lấy hiệu `|R-G|`, `|R-B|`, `|G-B|`
> 4. Phân tích từng bit plane (0-7)
> 5. Đọc metadata/EXIF

> [!NOTE]
> Hint trong đề bài luôn là chìa khóa! *"Newton split light into composite wavelengths"* → tách kênh màu. *"Dark Side of the Moon"* album art → ánh sáng + lăng kính + màu sắc. *"Shine On"* (Pink Floyd) → flag text.
