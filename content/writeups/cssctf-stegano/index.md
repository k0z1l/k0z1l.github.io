---
title: "[CSSCTF] Steganography"
date: '2026-10-02'
description: 'Write-up for the "Colour Shift" Steganography challenge in CSSCTF - analyzing BMP image channel data and extracting the hidden flag.'
categories: [CSSCTF, Steganography]
tags: [cssctf, steganography, image-analysis, bmp]
series: ['CSSCTF 2026']
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] Steganography Challenges Writeup

**Author:** k0z1l  
**Category:** Steganography  
**Flag Format:** `CSSCTF{...}`  

---

## Table of Contents
1. [Colour Shift](#1-colour-shift)
   - [1.0. TL;DR & Exploitation Summary](#10-tldr--exploitation-summary)
   - [1.1. Challenge Description & Clue Analysis](#11-challenge-description--clue-analysis)
   - [1.2. Initial File Analysis & Metadata Inspection](#12-initial-file-analysis--metadata-inspection)
   - [1.3. Color Channel & Bit Plane Statistical Analysis](#13-color-channel--bit-plane-statistical-analysis)
   - [1.4. Channel Difference Technique & Flag Discovery](#14-channel-difference-technique--flag-discovery)
   - [1.5. Analysis Diagram](#15-analysis-diagram)
   - [1.6. Complete Exploit Script](#16-complete-exploit-script)
   - [1.7. Steganography Mechanism Analysis](#17-steganography-mechanism-analysis)
   - [1.8. Key Takeaways & Methodology](#18-key-takeaways--methodology)

---

## 1. Colour Shift

> **Flag:** `CSSCTF{SHINE_ON}`  
> **Difficulty:** Easy-Medium  
> **Category:** Steganography / Image Processing  
> **File:** `colorshiftctf.bmp` (1,083,738 bytes)  
> **Technique:** RGB Channel Differential Steganography (`|R - B|`)  

---

### 1.0. TL;DR & Exploitation Summary

```text
1. Clue Decoding     -> Newton 1666 prism light splitting experiment points to decomposing the RGB color spectrum.
2. Artwork Context   -> The image is Pink Floyd's "The Dark Side of the Moon" (famous for Newton prism cover art).
3. Channel Anomaly   -> Inspecting color distributions reveals the Blue (B) channel has an abnormal max of 215 and anomalous bit plane 5 distribution.
4. Differential DSP  -> Computing absolute difference |R - B| eliminates background black pixels and sharply outlines modified blue pixels.
5. Contrast Boost    -> Increasing contrast 50x exposes the clear text flag in the lower-left dark backdrop: CSSCTF{SHINE_ON}.
```

---

### 1.1. Challenge Description & Clue Analysis

> In 1666 Issac Newton split light into their composite wavelengths. Can you?
>
> Flag format: CSSCTF{...}

The challenge clue references Isaac Newton's 1666 experiment using a **prism** to split white light into its **composite wavelengths** (red, orange, yellow, green, blue, indigo, violet — the RGB visible spectrum). This points directly toward **splitting and analyzing the image's individual color channels** (R, G, B).

---

### 1.2. Initial File Analysis & Metadata Inspection

#### 1.2.1. BMP Header Inspection

```python
with open('colorshiftctf.bmp', 'rb') as f:
    header = f.read(54)

# Result:
# Signature:    BM  (valid)
# File size:    1,083,738 bytes
# Pixel offset: 138 (extended DIB header = 124 bytes)
# Width:        599 pixels
# Height:       602 pixels
# Bit depth:    24-bit (RGB, no alpha channel)
# Compression:  0 (uncompressed - BI_RGB)
```

The file is a standard uncompressed 24-bit BMP image with dimensions of 599×602 pixels. Without compression, each pixel directly stores its raw R, G, and B channel bytes.

#### 1.2.2. Identifying the Source Image

Inspecting the image reveals that it is the album cover of **Pink Floyd's "The Dark Side of the Moon" (1973)** — depicting white light refracting through a triangular prism and dispersing into a rainbow spectrum.

> [!NOTE]
> This thematic selection aligns directly with Newton's light dispersion experiment. Pink Floyd also recorded the track **"Shine On You Crazy Diamond"**, hinting at the eventual flag string.

---

### 1.3. Color Channel & Bit Plane Statistical Analysis

#### 1.3.1. Per-Channel Statistics

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
R: min=0, max=255, unique=256  <- full range
G: min=0, max=240, unique=236  <- missing some values
B: min=0, max=215, unique=215  <- narrower range, fewer unique values
```

> [!IMPORTANT]
> The **Blue (B)** channel has a maximum value of only 215 and contains only 215 unique values — diverging notably from R and G. This discrepancy suggests the Blue channel was selectively modified.

#### 1.3.2. Bit Plane Analysis

```python
for i, ch in enumerate(['R','G','B']):
    for bit in range(8):
        plane = (arr[:,:,i] >> bit) & 1
        ratio = plane.mean()
        print(f"  {ch} bit{bit}: mean={ratio:.4f}")
```

```
R bit0: mean=0.5228  <- ~50/50 distribution (typical for natural imagery)
R bit4: mean=0.1159  <- lower ratio, consistent with dark regions
...
B bit5: mean=0.6891  <- Abnormally high!
B bit6: mean=0.0337  <- abrupt drop
```

Bit plane 5 of the Blue channel exhibits an abnormally high mean ratio, indicating the presence of hidden embedded data.

---

### 1.4. Channel Difference Technique & Flag Discovery

#### 1.4.1. Concept

The **Channel Difference** technique (color plane subtraction) calculates the absolute difference between two color channels. If one channel was altered to embed data while another serves as an unmodified baseline, subtraction exposes the discrepancies:

```
diff(R, B) = |R_pixel - B_pixel|
```

In natural, unmodified images, R and B channels correlate closely across dark backgrounds. When subtle modifications are applied to B, computing the absolute difference elevates the contrast around altered pixel regions.

#### 1.4.2. Implementation

```python
diff_rb = np.abs(arr[:,:,0].astype(int) - arr[:,:,2].astype(int)).astype(np.uint8)
diff_image = Image.fromarray(diff_rb)

# Apply high contrast enhancement to bring out subtle variations
from PIL import ImageEnhance
enhanced = ImageEnhance.Contrast(diff_image).enhance(50.0)
enhanced.save('diff_RB_enhanced.png')
```

#### 1.4.3. Result & Flag Extraction

The contrast-enhanced differential image clearly exposes the hidden text:

```
CSSCTF{SHINE_ON}
```

The flag is positioned across the **lower-left region** of the image (approximately two-thirds down), against the dark backdrop.

---

> **Captured Flag:** `CSSCTF{SHINE_ON}`


**Context:** "Shine On" references the Pink Floyd track **"Shine On You Crazy Diamond"** from the 1975 album *Wish You Were Here*, maintaining the thematic link with *The Dark Side of the Moon*.

---

### 1.5. Analysis Diagram

```
colorshiftctf.bmp (BMP 24-bit, 599x602)
        |
        +--> R Channel (Red)   ─────────────┐
        |                                    ├─ |R - B| = diff_RB
        +--> G Channel (Green)              │   (contrast enhanced x50)
        |                                    │              │
        +--> B Channel (Blue) ──────────────┘              v
             [MODIFIED - hidden text payload]         Flag Revealed
                                                    CSSCTF{SHINE_ON}
```

---

### 1.6. Complete Exploit Script

```python
#!/usr/bin/env python3
"""
CTF Write-up: Colour Shift (Steganography)
Technique: RGB Channel Difference Analysis
Flag: CSSCTF{SHINE_ON}
"""

from PIL import Image, ImageEnhance
import numpy as np

# === Step 1: Read image ===
img = Image.open('colorshiftctf.bmp')
arr = np.array(img)

print(f"[*] Image: {img.size[0]}x{img.size[1]}, mode={img.mode}")

# === Step 2: Analyze individual channels ===
for i, ch in enumerate(['R', 'G', 'B']):
    channel = arr[:, :, i]
    print(f"[*] Channel {ch}: min={channel.min()}, max={channel.max()}, "
          f"unique_values={len(np.unique(channel))}")

# === Step 3: Extract individual channels to separate images ===
r_img = Image.fromarray(arr[:, :, 0], 'L')  # Red
g_img = Image.fromarray(arr[:, :, 1], 'L')  # Green
b_img = Image.fromarray(arr[:, :, 2], 'L')  # Blue

r_img.save('channel_R.png')
g_img.save('channel_G.png')
b_img.save('channel_B.png')
print("[+] Saved individual channel images")

# === Step 4: Compute channel difference (Newton's wavelength split) ===
# |R - B| to expose modifications in the Blue channel
diff_rb = np.abs(arr[:, :, 0].astype(int) - arr[:, :, 2].astype(int)).astype(np.uint8)
diff_image = Image.fromarray(diff_rb)

print(f"[*] diff_RB stats: min={diff_rb.min()}, max={diff_rb.max()}, "
      f"mean={diff_rb.mean():.2f}")

# === Step 5: Increase contrast to reveal hidden text ===
enhanced = ImageEnhance.Contrast(diff_image).enhance(50.0)
enhanced.save('flag_revealed.png')
print("[+] Saved flag_revealed.png - inspect to read the flag")

# === Bonus: Crop into text region ===
h, w = arr.shape[:2]
# Text is located around 60-75% vertical offset
text_region = diff_rb[int(h*0.60):int(h*0.80), :]
text_img = Image.fromarray(text_region)
text_enhanced = ImageEnhance.Contrast(text_img).enhance(30)
text_big = text_enhanced.resize((w * 3, int(h * 0.20) * 3), Image.LANCZOS)
text_big.save('flag_text_zoom.png')
print("[+] Saved flag_text_zoom.png - magnified view of the flag region")

print("\n" + "="*50)
print("FLAG: CSSCTF{SHINE_ON}")
print("="*50)
```

**Output:**

```
[*] Image: 599x602, mode=RGB
[*] Channel R: min=0, max=255, unique_values=256
[*] Channel G: min=0, max=240, unique_values=236
[*] Channel B: min=0, max=215, unique_values=215   <- Suspicious!
[+] Saved individual channel images
[*] diff_RB stats: min=0, max=243, mean=29.54
[+] Saved flag_revealed.png - inspect to read the flag
[+] Saved flag_text_zoom.png - magnified view of the flag region

==================================================
FLAG: CSSCTF{SHINE_ON}
==================================================
```

---

### 1.7. Steganography Mechanism Analysis

#### 1.7.1. Embedding Methodology

Text was embedded by adjusting the Blue channel values on pixels tracing the characters:

```
B_modified[x, y] = B_original[x, y] + delta

With a small delta (approx. 20-50), changes remain imperceptible to the naked eye.
However, diff = |R - B_modified| != |R - B_original|, making it easily detectable via channel subtraction.
```

This technique functions as **Color Channel Steganography**, distinct from standard Least Significant Bit (LSB) manipulation:
- **LSB Steganography:** Alters the least significant bit (+/-1), which is visually imperceptible.
- **Color Channel Steganography:** Modifies whole pixel values (+/-20-50), generating perceptible outlines when computing inter-channel differences.

#### 1.7.2. Rationale for R vs B Selection

- *The Dark Side of the Moon* cover predominantly features dark, neutral black tones where R ≈ B across most pixels.
- Tampering with B introduces a pronounced contrast offset relative to R.
- Applying alterations to G could also be uncovered through `|R - G|` or `|G - B|`, but green values generally carry higher perceptual sensitivity in human vision, making blue the preferred carrier.

---

### 1.8. Key Takeaways & Methodology

| Step | Technique | Tools |
|------|-----------|-------|
| Inspect metadata | BMP header parsing | Python `struct`, `PIL` |
| Context identification | Image recognition | Visual inspection |
| Statistical analysis | Channel statistics, bit planes | NumPy |
| Channel separation | RGB channel split | PIL `Image.fromarray` |
| Channel difference | `\|R - B\|` | NumPy `np.abs` |
| Contrast enhancement | Highlight hidden text | PIL `ImageEnhance.Contrast` |

> [!TIP]
> When approaching color image steganography challenges:
> 1. Separate individual R, G, and B channels.
> 2. Test XOR combinations across channel pairs.
> 3. Compute absolute channel differences: `|R - G|`, `|R - B|`, `|G - B|`.
> 4. Inspect individual bit planes (0 through 7).
> 5. Review file metadata and EXIF tags.

> [!NOTE]
> Challenge descriptions often provide valuable hints. *"Newton split light into composite wavelengths"* indicated channel decomposition, while the Pink Floyd artwork pointed toward *"Shine On"* as the hidden flag.

