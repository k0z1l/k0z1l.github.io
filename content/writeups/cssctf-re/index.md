---
title: '[CSSCTF] Reverse Engineering (RE) Challenges Writeup'
date: '2026-10-02'
description: 'Tổng hợp giải pháp các thử thách Reverse Engineering trong CSSCTF: Lamp
  Drill, Silicon Snare, PRINCE WALK, FLAPPY BOARD.'
categories: [CSSCTF, Reverse Engineering]
tags: [cssctf, reverse-engineering, re, sat-solver, hardware-re]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# WRITEUP CÁC THỬ THÁCH REVERSE ENGINEERING (RE) - CSSCTF

---

## MỤC LỤC
1. [Thử thách 1: Lamp Drill (Warm-up)](#1-thử-thách-1-lamp-drill-warm-up)
2. [Thử thách 2: Silicon Snare (Hardware RE / SAT Solving)](#2-thử-thách-2-silicon-snare-hardware-re--sat-solving)
3. [Thử thách 3: PRINCE WALK (RE / "PINCE Int32 memory-editing practice")](#3-thử-thách-3-prince-walk-re--pince-int32-memory-editing-practice)
4. [Thử thách 4: FLAPPY BOARD (RE / client-server, replay validation)](#4-thử-thách-4-flappy-board-re--client-server-replay-validation)

---

# 1. Thử thách 1: Lamp Drill (Warm-up)

### Thông tin thử thách
* **Tên bài:** Lamp Drill
* **Thể loại:** Reverse Engineering (Warm-up)
* **Tệp tin cung cấp:** `lampDrill.png`, `lampDrill.svg`
* **Mô tả:**
  > Warm-up. No spaces.  
  > Flag Format: `CSSCTF{...}`

---

### Phân tích chi tiết

Khi mở file hình ảnh `lampDrill.png` hoặc đọc cấu trúc vector trong `lampDrill.svg`, giao diện bài toán được chia làm 2 phần rõ rệt:

#### 1. Bảng quy tắc logic (Rule section ở phía trên)
Có 4 quy tắc chuyển đổi giữa các bóng đèn (chấm tròn đen `●` và chấm tròn trắng `○`):
* `● ● -> ●`
* `● ○ -> ○`
* `○ ● -> ○`
* `○ ○ -> ○`

Trong thiết kế mạch logic số:
* `●` (chấm đen / đèn bật) đại diện cho mức logic cao: **$1$** (True).
* `○` (chấm trắng / đèn tắt) đại diện cho mức logic thấp: **$0$** (False).

Bảng chuyển đổi trên chính là **bảng chân trị (truth table) của cổng logic AND**:
$$\text{Output} = A \land B$$
Kết quả chỉ bằng $1$ khi và chỉ khi cả 2 ngõ vào $A$ và $B$ đều là $1$.

---

#### 2. Lưới ô logic (Grid section ở phía dưới)
Phần thân gồm **3 hàng**, mỗi hàng có **8 hộp chữ nhật** được nối với nhau bằng các mũi tên từ trái sang phải ($\rightarrow$).
* $8$ hộp trong $1$ hàng tượng trưng cho **8 bit** (1 byte dữ liệu ASCII), được đọc theo thứ tự từ trọng số cao nhất (MSB - Most Significant Bit) bên trái đến trọng số thấp nhất (LSB - Least Significant Bit) bên phải.
* Mỗi hộp chứa một cặp bóng đèn $[A, B]$. Ta áp dụng phép toán logic AND cho từng cặp bóng đèn trong mỗi hộp để tính ra giá trị của bit tương ứng.

##### **Hàng 1 (Row 1):**
* Box 0: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 1: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 2: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 3: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 4: `[○, ○]` $\rightarrow 0 \land 0 = \mathbf{0}$
* Box 5: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 6: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 7: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$

$\Rightarrow$ Dãy nhị phân: `01100011`$_2 = 0\text{x}63 = 99 = \mathbf{'c'}$

##### **Hàng 2 (Row 2):**
* Box 0: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 1: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 2: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 3: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 4: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 5: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 6: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 7: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$

$\Rightarrow$ Dãy nhị phân: `01110011`$_2 = 0\text{x}73 = 115 = \mathbf{'s'}$

##### **Hàng 3 (Row 3):**
* Box 0: `[○, ○]` $\rightarrow 0 \land 0 = \mathbf{0}$
* Box 1: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 2: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 3: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 4: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 5: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 6: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 7: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$

$\Rightarrow$ Dãy nhị phân: `01110011`$_2 = 0\text{x}73 = 115 = \mathbf{'s'}$

Ghép 3 ký tự thu được: `'c'`, `'s'`, `'s'` $\rightarrow$ `"css"`.

---

### Script giải mã tự động (Python)

Script dưới đây đọc trực tiếp file vector `lampDrill.svg`, trích xuất tọa độ bounding box của các hộp và các chấm tròn, tự động phân nhóm theo hàng và tính giá trị ASCII:

```python
import xml.etree.ElementTree as ET
import re

def solve_lamp_drill(svg_path):
    tree = ET.parse(svg_path)
    root = tree.getroot()

    def get_coords(d):
        nums = [float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+)', d)]
        if len(nums) >= 2:
            xs, ys = nums[0::2], nums[1::2]
            return min(xs), min(ys), max(xs), max(ys), sum(xs)/len(xs), sum(ys)/len(ys)
        return 0, 0, 0, 0, 0, 0

    boxes = []
    circles = []

    # Quét tất cả các path trong SVG để phân loại ô hộp và chấm tròn
    for p in root.iter('{http://www.w3.org/2000/svg}path'):
        style = p.attrib.get('style', '')
        d = p.attrib.get('d', '')
        minx, miny, maxx, maxy, cx, cy = get_coords(d)
        
        # Ô hộp màu kem viền đen
        if 'fill: #fffdf8' in style:
            boxes.append({'minx': minx, 'miny': miny, 'maxx': maxx, 'maxy': maxy, 'cx': cx, 'cy': cy})
        # Chấm tròn bóng đèn (bán kính stroke 1.6)
        elif '1.6' in style:
            # fill đen (#1c1915) là 1, fill trắng/kem là 0
            val = 1 if '#1c1915' in style.split('stroke')[0] else 0
            circles.append({'cx': cx, 'cy': cy, 'val': val})

    # Gom các hộp thành 3 hàng dựa trên tọa độ trục Y
    boxes.sort(key=lambda b: (b['cy'], b['cx']))
    rows = []
    for b in boxes:
        if not rows or abs(b['cy'] - rows[-1][0]['cy']) > 20:
            rows.append([b])
        else:
            rows[-1].append(b)

    result_chars = []
    for r_idx, r in enumerate(rows):
        r.sort(key=lambda b: b['cx']) # Sắp xếp hộp từ trái sang phải
        bits = []
        for b in r:
            # Lấy 2 chấm tròn nằm bên trong hộp
            inside = [c for c in circles if b['minx'] <= c['cx'] <= b['maxx'] and b['miny'] <= c['cy'] <= b['maxy']]
            inside.sort(key=lambda c: c['cx'])
            # Thực hiện phép AND logic giữa 2 bóng đèn
            out_bit = inside[0]['val'] & inside[1]['val']
            bits.append(str(out_bit))
        
        byte_str = ''.join(bits)
        char = chr(int(byte_str, 2))
        result_chars.append(char)
        print(f"Hàng {r_idx}: Dãy bit {byte_str} -> Mã ASCII {ord(char)} = '{char}'")

    flag = f"CSSCTF{{{''.join(result_chars)}}}"
    print(f"\n[+] Flag: {flag}")
    return flag

if __name__ == '__main__':
    solve_lamp_drill('lampDrill.svg')
```

### Kết quả
$$\mathbf{CSSCTF\{css\}}$$

---

# 2. Thử thách 2: Silicon Snare (Hardware RE / SAT Solving)

### Thông tin thử thách
* **Tên bài:** Silicon Snare
* **Thể loại:** Reverse Engineering (Hardware / Circuit SAT)
* **Tệp tin cung cấp:** `schematic.png`, `schematic.svg`
* **Mô tả:**
  > The Kuiper Belt relay fail-safe is a hardwired optical routing matrix.  
  > Thanks to the bravery of a specific R2-series astromech droid, you have been provided the original schematic for its layout and proprietary analogue logic nodes. Trace the signal paths through the gates and find the one 32-bit input pattern that drives the centre node, Override, to logic high (1).  
  > 
  > Software won't help you much here. The only thing to follow is the wire.  
  > Some wires will intentionally overlap to hinder your efforts. Thankfully, you have its SVG; it will let you zoom in infinitely to inspect for detail. Push on!  
  > Submit `CSSCTF{…}`.  
  > 
  > Inside the braces, enter 32 bits (32 characters, 1s and 0s) with no spaces. I00, at 12 o’clock, is the first bit. Read clockwise through I31.  
  > This challenge is inspired by the same work bare-metal hardware engineers conduct when reverse engineering proprietary dies.

---

### Phân tích kiến trúc mạch

Đề bài mô phỏng công việc dịch ngược die phần cứng (silicon decap / hardware reverse engineering). Mạch điện là một mạng định tuyến quang học đồng tâm:
1. **32 đầu vào (Primary Inputs):** Ký hiệu từ `I00` đến `I31`, xếp thành một vòng tròn lớn ở rìa ngoài theo chiều kim đồng hồ, bắt đầu từ `I00` ở góc 12 giờ.
2. **Đích điều khiển trung tâm (`OVERRIDE`):** Một vòng tròn lớn nằm ở tâm mạch ($x \approx 419.08, y \approx 396.31$). Mục tiêu là tìm giá trị 32 bit ngõ vào sao cho node này đạt mức logic cao ($1$).
3. **Các cổng logic (Gates):** Gồm tổng cộng **74 cổng** thuộc 4 loại cổng logic đặc thù:
   * **Flow gate (`f00` đến `f13` - 20 cổng):**  
     $Y = A \land B$ (Cổng AND thông thường).
   * **Merge gate (`m00` đến `m22` - 35 cổng):**  
     $Y = A \oplus B$ (Cổng XOR thông thường).
   * **Negate gate (`n00` đến `n05` - 6 cổng):**  
     $Y = \neg A$ (Cổng NOT / Inverter).
   * **Shift gate (`s00` đến `s0c` - 13 cổng):**  
     Cổng điều khiển hướng tín hiệu đặc thù:
     * Đầu nhọn (pointed end): Input $A$, Output $Y_0 = A \lor B$.
     * Đầu phẳng (flat end, có thanh gạch đậm `|`): Input $B$, Output $Y_1 = A \land \neg B$.

---

### Kỹ thuật vượt qua bẫy dây nối chồng chéo (Wire Untangling)

Tác giả cố tình vẽ các đường dây đan xen, chạy xuyên qua nhau nhằm ngăn cản việc lần vết bằng mắt thường. Tuy nhiên, khi kiểm tra cấu trúc mã nguồn SVG:

1. **Quy tắc phân mạng tín hiệu (Net):**
   * Trong mô tả đề bài: *"A node is where one wire splits. It is drawn as a filled dot: one wire arrives, and two or more leave. The dot is that wire's colour, and every branch after the node carries the same signal."*
   * Khi phân tích các thẻ `<path>` trong file SVG, ta phát hiện toàn bộ các dây dẫn màu được vẽ bằng đúng **100 màu hex stroke** khác nhau. Mỗi màu stroke đại diện cho **duy nhất một mạng tín hiệu (Net)**. Tín hiệu đi ra từ một nguồn không bao giờ đổi màu dọc đường truyền.
2. **Ánh xạ 32 đầu vào:**
   * Trong SVG, 32 chấm tròn nhỏ tương ứng với `I00`..`I31` (từ `patch_111` đến `patch_142`) mang đúng 32 mã màu đầu tiên (`#9e1010`, `#3861c7`, `#7cc714`, ..., `#c7c038`).
3. **Cổng Negate (Inverters):**
   * Có 6 cổng Negate (`n00` đến `n05`) được chèn trực tiếp trên các đường dây để đảo tín hiệu mà không đổi màu dây. Mỗi cổng Negate chia đường dây cùng màu thành hai đoạn: đoạn trước cổng (bán kính tới tâm lớn hơn) và đoạn sau cổng (bán kính tới tâm nhỏ hơn), với quan hệ:
     $$\text{wire\_after} = \neg (\text{wire\_before})$$
4. **Phân tích cổng Shift (`s00` đến `s0c`):**
   * Kiểm tra các chân pin thực tế của 13 cổng Shift cho thấy chân output $Y_0$ (ở pointed end) đều có một gạch chặn terminator (không nối dây), chỉ có chân output $Y_1$ (ở flat end) được nối vào tầng tiếp theo:
     $$Y = A \land \neg B$$
     Trong đó, input $B$ nằm sát thanh bar đậm ở flat end, còn input $A$ nằm ở pointed end.
5. **Đích đến `OVERRIDE`:**
   * Tầng cuối cùng kết nối trực tiếp vào `OVERRIDE` là cổng **`f13`** (Flow gate / AND):
     $$\text{OVERRIDE} = f_{13} = f_{11} \land f_{12} = 1 \iff f_{11} = 1 \text{ và } f_{12} = 1$$

---

### Mô hình hóa và giải quyết bài toán bằng Z3 Solver

Vì mạch là một đồ thị có hướng không chu trình (DAG - Directed Acyclic Graph), toàn bộ mạch logic tương đương với một hệ phương trình đại số Boolean 32 biến. Ta trích xuất tự động toàn bộ netlist từ file SVG và nạp vào **Z3 SAT Solver**.

#### Script giải hoàn chỉnh (`solve_snare_final.py`):

```python
import xml.etree.ElementTree as ET
import re
import math
from collections import defaultdict
from z3 import *

def parse_points(d):
    """Trích xuất tất cả các tọa độ (x, y) từ chuỗi thuộc tính path d trong SVG"""
    nums = [float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+)', d)]
    return list(zip(nums[0::2], nums[1::2]))

def glyph_to_char(href):
    """Chuyển đổi mã ASCII hex từ glyph defs của matplotlib sang ký tự"""
    if not href: return ''
    m = re.search(r'-([0-9a-fA-F]{2,4})$', href.lstrip('#'))
    return chr(int(m.group(1), 16)) if m else '?'

def solve_silicon_snare():
    tree = ET.parse('schematic.svg')
    root = tree.getroot()
    axes = root.find('.//{http://www.w3.org/2000/svg}g[@id="axes_1"]')
    
    # Tâm của toàn bộ mạch điện
    cx0, cy0 = 419.083408, 396.308257

    # 1. Trích xuất tâm của các thân cổng (patch_36 đến patch_109)
    gate_patches = {}
    for i in range(36, 110):
        elem = axes.find(f'.//{{http://www.w3.org/2000/svg}}g[@id="patch_{i}"]/{{http://www.w3.org/2000/svg}}path')
        if elem is not None:
            pts = parse_points(elem.attrib.get('d', ''))
            gate_patches[f"patch_{i}"] = (sum(p[0] for p in pts)/len(pts), sum(p[1] for p in pts)/len(pts))

    # 2. Trích xuất tọa độ nhãn văn bản của 74 cổng logic
    gate_texts = {}
    for g in axes.iter('{http://www.w3.org/2000/svg}g'):
        uses = g.findall('{http://www.w3.org/2000/svg}use')
        if uses:
            txt = ''.join(glyph_to_char(u.attrib.get('{http://www.w3.org/1999/xlink}href') or u.attrib.get('href')) for u in uses).strip()
            tr = g.attrib.get('transform', '')
            m = re.search(r'translate\(([-0-9.]+)\s+([-0-9.]+)\)', tr)
            if m and re.match(r'^[fnms]\d\w*$', txt):
                gate_texts[txt] = (float(m.group(1)), float(m.group(2)))

    # Ánh xạ giữa tên cổng và ID patch
    patch_to_gate = {}
    for gname, gpos in gate_texts.items():
        best_p = min(gate_patches.items(), key=lambda item: math.hypot(gpos[0] - item[1][0], gpos[1] - item[1][1]))
        patch_to_gate[best_p[0]] = gname

    # 3. Trích xuất màu sắc của 32 Primary Inputs (patch_111 đến patch_142)
    inputs = {}
    for i in range(111, 143):
        elem = axes.find(f'.//{{http://www.w3.org/2000/svg}}g[@id="patch_{i}"]/{{http://www.w3.org/2000/svg}}path')
        if elem is not None:
            style = elem.attrib.get('style', '')
            m = re.search(r'fill:\s*(#[0-9a-fA-F]{6})', style)
            col = m.group(1).lower() if m else ''
            idx = i - 111
            inputs[f"I{idx:02d}"] = col

    # 4. Trích xuất các đường dây dẫn có màu (Colored wires)
    colored_lines = []
    for child in axes:
        cid = child.attrib.get('id', '')
        if cid.startswith('line2d_'):
            path = child.find('{http://www.w3.org/2000/svg}path')
            if path is not None:
                style = path.attrib.get('style', '')
                pts = parse_points(path.attrib.get('d', ''))
                m = re.search(r'stroke:\s*(#[0-9a-fA-F]{6})', style)
                col = m.group(1).lower() if m else ''
                if col and col != '#1b1b1b':
                    colored_lines.append((cid, col, pts))

    # 5. Phân tách mạng tín hiệu đi qua 6 cổng Negate (Inverters)
    negate_info = {}
    for nname in ['n00', 'n01', 'n02', 'n03', 'n04', 'n05']:
        pos = gate_texts[nname]
        best_p = min(gate_patches.items(), key=lambda item: math.hypot(pos[0] - item[1][0], pos[1] - item[1][1]))
        negate_info[nname] = best_p[1]

    negate_colors = {
        'n00': '#75529f', 'n01': '#725876', 'n02': '#74558a',
        'n03': '#6a8637', 'n04': '#6d8763', 'n05': '#408b75'
    }

    def get_net_name(col, pt):
        # Kiểm tra xem đường dây có đi qua cổng Negate hay không
        for nname, ncol in negate_colors.items():
            if col == ncol:
                ngcx, ngcy = negate_info[nname]
                d_ng = math.hypot(ngcx - cx0, ngcy - cy0)
                d_pt = math.hypot(pt[0] - cx0, pt[1] - cy0)
                # Nếu nằm ngoài cổng Negate (bán kính lớn hơn) -> trước cổng
                if d_pt > d_ng - 5:
                    return f"{col}_before_{nname}"
                else:
                    return f"{col}_after_{nname}"
        return col

    # 6. Gán các đầu dây màu vào các cổng logic
    gate_pins = defaultdict(list)
    for pid, (gcx, gcy) in gate_patches.items():
        gname = patch_to_gate[pid]
        if gname.startswith('n'):
            continue # Cổng Negate đã được mô hình hóa riêng
        for cid, col, pts in colored_lines:
            for ep in [pts[0], pts[-1]]:
                d = math.hypot(ep[0] - gcx, ep[1] - gcy)
                if d < 12.0:
                    net_name = get_net_name(col, ep)
                    d_c = math.hypot(ep[0] - cx0, ep[1] - cy0)
                    gate_pins[gname].append((net_name, ep, d_c, cid))

    # Khử trùng lặp kết nối trên cùng một cổng
    for gname in gate_pins:
        seen = {}
        for item in gate_pins[gname]:
            net_name = item[0]
            if net_name not in seen:
                seen[net_name] = item
        gate_pins[gname] = list(seen.values())

    # 7. Định vị thanh flat bar trên các cổng Shift để xác định chân A và B
    shift_bars = {}
    for sname in [f"s{i:02x}" for i in range(13)]:
        pos = gate_texts[sname]
        best_p = min(gate_patches.items(), key=lambda item: math.hypot(pos[0] - item[1][0], pos[1] - item[1][1]))
        gcx, gcy = best_p[1]
        for child in axes:
            cid = child.attrib.get('id', '')
            if cid.startswith('line2d_'):
                path = child.find('{http://www.w3.org/2000/svg}path')
                if path is not None:
                    style = path.attrib.get('style', '')
                    if ('stroke-width: 1.' in style or 'stroke-width: 2.' in style) and '#1b1b1b' in style:
                        pts = parse_points(path.attrib.get('d', ''))
                        if pts and math.hypot(pts[0][0] - gcx, pts[0][1] - gcy) < 6:
                            shift_bars[sname] = pts[0]
                            break

    # 8. XÂY DỰNG MÔ HÌNH VÀ GIẢI BẰNG Z3
    solver = Solver()

    # 32 biến Boolean cho ngõ vào I00 đến I31
    I_vars = {iname: Bool(iname) for iname in inputs}

    # Tập hợp tất cả các Net tín hiệu trong mạch
    all_nets = set(inputs.values())
    for gname, plist in gate_pins.items():
        for item in plist:
            all_nets.add(item[0])
    for nname, col in negate_colors.items():
        all_nets.add(f"{col}_before_{nname}")
        all_nets.add(f"{col}_after_{nname}")

    net_vars = {net: Bool(f"N_{net}") for net in all_nets}

    # Ràng buộc gán ngõ vào với các Net ban đầu
    for iname, col in inputs.items():
        solver.add(net_vars[col] == I_vars[iname])

    # Ràng buộc cho 6 cổng Negate (Inverters)
    for nname, col in negate_colors.items():
        v_before = net_vars[f"{col}_before_{nname}"]
        v_after = net_vars[f"{col}_after_{nname}"]
        solver.add(v_after == Not(v_before))

    # Ràng buộc cho các cổng Flow, Merge, Shift
    for gname, plist in sorted(gate_pins.items()):
        gtype = gname[0]
        # Sắp xếp các chân theo khoảng cách đến tâm giảm dần: 2 ngõ vào ở ngoài, ngõ ra ở trong
        plist.sort(key=lambda x: x[2], reverse=True)
        if len(plist) != 3:
            continue
        
        in1, in2 = plist[0], plist[1]
        out = plist[2]
        
        v_in1 = net_vars[in1[0]]
        v_in2 = net_vars[in2[0]]
        v_out = net_vars[out[0]]
        
        if gtype == 'f':
            # Flow gate: AND
            solver.add(v_out == And(v_in1, v_in2))
        elif gtype == 'm':
            # Merge gate: XOR
            solver.add(v_out == Xor(v_in1, v_in2))
        elif gtype == 's':
            # Shift gate: Y1 = A AND NOT B
            bar = shift_bars[gname]
            d1 = math.hypot(in1[1][0] - bar[0], in1[1][1] - bar[1])
            d2 = math.hypot(in2[1][0] - bar[0], in2[1][1] - bar[1])
            # Ngõ vào gần thanh bar hơn là B (flat in), xa hơn là A (pointed in)
            if d1 < d2:
                v_B, v_A = v_in1, v_in2
            else:
                v_B, v_A = v_in2, v_in1
            solver.add(v_out == And(v_A, Not(v_B)))

    # Điều kiện đích: Node OVERRIDE (lái bởi output của f13: #6c5c8b) phải ở mức HIGH (True)
    solver.add(net_vars['#6c5c8b'] == True)

    print("[*] Đang giải hệ phương trình logic bằng Z3...")
    if solver.check() == sat:
        m = solver.model()
        bits = []
        for i in range(32):
            val = m[I_vars[f"I{i:02d}"]]
            bits.append('1' if is_true(val) else '0')
        pattern = ''.join(bits)
        
        # Chuyển đổi sang ASCII
        ascii_chars = []
        for i in range(0, 32, 8):
            byte_val = int(pattern[i:i+8], 2)
            ascii_chars.append(chr(byte_val))
        ascii_str = ''.join(ascii_chars)
        
        print(f"[+] Dãy 32 bit thu được: {pattern}")
        print(f"[+] Giải mã ASCII (4 bytes): '{ascii_str}'")
        flag = f"CSSCTF{{{pattern}}}"
        print(f"[+] Flag: {flag}")
        return flag
    else:
        print("[-] Không tìm thấy nghiệm thỏa mãn.")

if __name__ == '__main__':
    solve_silicon_snare()
```

---

### Kết quả giải mã

Chạy script trên cho ra kết quả nghiệm SAT:
```text
[*] Đang giải hệ phương trình logic bằng Z3...
[+] Dãy 32 bit thu được: 01010000010000010101001101010011
[+] Giải mã ASCII (4 bytes): 'PASS'
[+] Flag: CSSCTF{01010000010000010101001101010011}
```

Kiểm tra 4 khối 8-bit tương ứng với các ký tự ASCII:
* Byte 1 ($I_{00} \to I_{07}$): `01010000`$_2 = 0\text{x}50 = 80 = \mathbf{'P'}$
* Byte 2 ($I_{08} \to I_{15}$): `01000001`$_2 = 0\text{x}41 = 65 = \mathbf{'A'}$
* Byte 3 ($I_{16} \to I_{23}$): `01010011`$_2 = 0\text{x}53 = 83 = \mathbf{'S'}$
* Byte 4 ($I_{24} \to I_{31}$): `01010011`$_2 = 0\text{x}53 = 83 = \mathbf{'S'}$

Ghép lại thành từ khóa: **`PASS`** (mật mã vượt qua hệ thống khóa bảo vệ fail-safe).

### Flag
$$\mathbf{CSSCTF\{01010000010000010101001101010011\}}$$

---

# 3. Thử thách 3: PRINCE WALK (RE / "PINCE Int32 memory-editing practice")

> **Flag: `CSSCTF{P12INC3_0R_P1NC3?}`**
>
> **Ý tưởng bài:** binary là một game TUI (thế giới sinh giả ngẫu nhiên vô hạn), người chơi ở `(1,1)`, beacon ở `(999999, 999999)`.
> Không thể "đi bộ" tới đích — phải **attach debugger (PINCE/gdb) và sửa 2 biến `int32` toạ độ X/Y** trong RAM. Khi toạ độ = `(999999,999999)` và bấm `1`/`2` để "Reply", game gọi hàm sinh flag `gen_flag()` và in flag ra màn hình.
>
> Flag còn lấy được **offline** bằng cách viết lại `gen_flag()` (thuật toán 8320 vòng, bảng 8320 entry trong `.rodata`) — không cần chạy game, không cần bấm phím.

---

## 0. TL;DR

```
1. file prince_walk            -> ELF64 PIE, stripped, TUI game 80x24
2. strings                     -> "sandbox for PINCE Int32 memory-editing practice"
                                  PLAYER X: %d  Y: %d   /  TARGET X: 999999 Y: 999999
3. main @0x1b4e                -> toạ độ người chơi = 2 int32 toàn cục:
                                  X @ base+0x17010   Y @ base+0x17014   (khởi tạo 1,1)
4. Landmark table @0x16ba0     -> gồm bản ghi "THE END OF THE WORLD" tại (999999,999999)
                                  với cờ "hidden content" = 1  -> sẽ gọi gen_flag()
5. gen_flag @0x2c52            -> chỉ chạy khi x==999999 && y==999999
                                  -> sinh 128 byte, out[0] = len, out[1..len] = FLAG,
                                     out[len+1..len+4] = FNV-1a 32 của flag (checksum)
6. Chơi thật (đúng ý tác giả): gdb -p <pid> ; set {int}(base+0x17010)=999999
                                              set {int}(base+0x17014)=999999
                               -> game hiện "THE END OF THE WORLD" -> bấm "1"
                               -> "Developer: \"No you didn't.\" MISSION COMPLETE
                                   CSSCTF{P12INC3_0R_P1NC3?}"
```

---

## 1. Thông tin file & cơ chế bảo vệ

```console
$ file prince_walk
prince_walk: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked,
             interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, stripped

$ ls -l prince_walk
-rw-rw-r-- 1 kali kali 92384 prince_walk      # 0x16900 byte
```

| Thuộc tính | Giá trị | Ý nghĩa |
|---|---|---|
| Kiểu | `DYN` (**PIE**) | Địa chỉ phải cộng `base` (lấy từ `/proc/<pid>/maps`) |
| Symbols | `stripped` | Không có tên hàm → tự đặt tên theo địa chỉ |
| Canary | Có (`fs:0x28` trong mọi hàm lớn) | Không khai thác stack, chỉ là code compiler sinh ra |
| NX / RELRO | Full NX, Partial RELRO | Không quan trọng: **không có lỗi memory corruption** |
| "Lỗ hổng" | …không có | Đây là **RE + memory editing**, không phải pwn |
| Build | GCC, `BuildID` PIE | Ubuntu mới, glibc 2.34+ |

**Layout section (rất quan trọng vì bảng dữ liệu nằm ở đây):**

| Section | Vaddr | File offset | Size | Ghi chú |
|---|---|---|---|---|
| `.text` | `0x1340` | `0x1340` | `0x20e2` | Toàn bộ code (chỉ ~8KB) |
| `.rodata` | `0x4000` | `0x4000` | `0x10e80` | Chuỗi + **bảng tra 8320 entry** |
| `.eh_frame_hdr` | `0x14e80` | `0x14e80` | `0x104` | |
| `.data.rel.ro` | `0x16ba0` | `0x15ba0` | `0x170` | **Bảng landmark + bảng achievement** |
| `.data` | `0x17000` | `0x16000` | `0x18` | **Toạ độ X, Y của người chơi** |
| `.bss` | `0x17020` | — | `0xa0` | `stdout`, `stderr`, termios, cờ tín hiệu |

> Lưu ý: `.rodata` (vaddr `0x4000` = offset `0x4000`) nhưng `.data.rel.ro` (**vaddr `0x16ba0` = offset `0x15ba0`**) — lệch `0x1000`. Khi đọc bằng Python/xxd phải đổi offset, nếu không sẽ `struct.error`/đọc sai.

---

## 2. Recon bằng `strings` — đọc được luôn "ý đồ" của bài

```console
$ strings -n 6 prince_walk
PRINCE WALK
O you   . grass   ~ water   # rock   T tree   , dirt
Trees block walking. Everything else is passable.
* destination
PLAYER  X: %d  Y: %d
TARGET  X: 999999  Y: 999999
WASD inputs: %lu
WASD: Move   |   H: Achievements   |   Q: Quit
Attach opt-in unavailable; OS debugger rules apply.
Usage: %s
A terminal sandbox for PINCE Int32 memory-editing practice.
A tree. Famously difficult to walk through.
Reality appears to have shifted.
THE END OF THE WORLD
Developer:
"How did you get here?"
1. I walked.
2. Don't worry about it.
YOU... ACTUALLY... WALKED HERE?
Achievement: PINCE Tutorial Failed Successfully
AN ANCIENT MONUMENT ... Achievement: Nice.
ERROR: LANDMARK NOT FOUND ... Achievement: 404: Achievement Not Found
A MYSTERIOUS HACKER APPEARS ... "someone who understands how to modify an int32" ... Achievement: 1337
THE ORIGIN ... You started at (1,1) for some reason.
WELCOME TO NEGATIVE LAND ... The grass owes YOU money.
A WOODEN SIGN STANDS HERE ... "Almost there."
THE REAL END OF THE WORLD ... "You understand memory editing." "Please go home."
At this rate, you'll be there eventually.
You know PINCE is installed, right?
The developer is becoming concerned.
Please stop.
```

Hai câu chốt hướng giải:

* `A terminal sandbox for PINCE Int32 memory-editing practice.` → **sửa biến `int32` trong RAM bằng PINCE** (PINCE = trình memory-editor cho Linux, giống Cheat Engine).
* `Attach opt-in unavailable; OS debugger rules apply.` → game **tự xin phép cho attach debugger** (xem §5: `prctl(PR_SET_PTRACER, -1)`).

Trong tail của `strings` còn thấy **một vùng dữ liệu "trông ngẫu nhiên" rất dài** (`mH>36`, `r_?q?`, `,8/b_9>`, …) ở cuối `.rodata` — đó chính là **bảng tra dùng cho hàm sinh flag**, không phải chuỗi mã hoá.

---

## 3. Bản đồ hàm (tự đặt tên theo hành vi)

Lấy `main` từ `_start` (`lea rdi,[rip+0x7ef] # 1b4e` → đối số 1 của `__libc_start_main`):

| Địa chỉ | Tên tạm | Chức năng |
|---|---|---|
| `0x1429` | `now_sec()` | `clock_gettime(CLOCK_MONOTONIC)` → `double` (dùng cho timer thông báo 2.5s) |
| `0x1495` | `puts_line()` | `printf("\x1b[2K%s\n", s)` — xoá dòng + in |
| `0x14c3` | **`render()`** | Vẽ toàn bộ khung: map / dialog landmark / màn achievements / HUD |
| `0x1b4e` | **`main()`** | Vòng lặp game, xử lý phím, gọi `landmark_lookup` |
| `0x2144` | `mix64()` | splitmix64 finalizer (nhân `0xBF58476D1CE4E5B9`, `0x94D049BB133111EB`) |
| `0x21a2` | **`world_get(x,y)`** | Sinh địa hình theo toạ độ (hash) + override landmark/player/target |
| `0x22d0` | `is_walkable(x,y)` | `world_get(x,y) != 'T'` |
| `0x22ff` | `clamp_add(a,b)` | Cộng và kẹp trong `[INT32_MIN, INT32_MAX]` (tránh tràn) |
| `0x234e` | `key_to_delta(key)` | `W=+Y`, `S=-Y`, `A=-X`, `D=+X` (nhận cả chữ hoa/thường) |
| `0x2431` / `0x252b` | `tty_raw()` / `tty_restore()` | `tcsetattr` |
| `0x25b1` | `tty_setup()` | Kiểm tra `isatty(0/1)`, `TERM != dumb`, bắt signal |
| `0x27e7` | `get_winsize()` | `ioctl(TIOCGWINSZ)`; cảnh báo nếu < `58x24` |
| `0x2880` / `0x28ae` | `clear()` / `cursor()` | `\x1b[2K`, `\x1b[?25l` / `\x1b[?25h` |
| `0x28eb` | `read_key(timeout_ms)` | `poll()` + `read(0,…,1)` |
| `0x29ca` | **`landmark_lookup(x,y,dirty,cnt)`** | Trả về bản ghi landmark tại (x,y) — **có logic "anti-cheat"** |
| `0x2a86` | `nag_message(cnt)` | Mốc 10/50/100/500/1000 input → câu "càu nhàu" |
| `0x2b0c` | `unlock_ach(arr,rec)` | `arr[rec->ach] = 1`; nếu `ach == 9` thì mở luôn `arr[0]` |
| `0x2b4c` | `walk_ach(arr,cnt)` | Nếu `cnt > 99` → mở achievement #8 |
| `0x2b6e` | `sum10(arr)` | Tổng 10 byte → `ACHIEVEMENTS %u / 10` |
| `0x2baa` | `ach_name(i)` | Tên achievement (ẩn → `"???"` nếu chưa mở) |
| `0x2bf8` | `rol32(v,n)` | Xoay trái 32-bit, `n & 31` |
| `0x2c18` | `mix32(v)` | `v^=v>>16; v*=0x7feb352d; v^=v>>15; v*=0x846ca68b; v^=v>>16` |
| `0x2c52` | **`gen_flag(x,y,out,cap)`** | **Hàm sinh flag — trái tim bài toán** |

---

## 4. Game chạy thế nào (để biết "sửa cái gì")

### 4.1 Biến toàn cục quyết định tất cả

`.data` (`0x17000`, 24 byte) chỉ có đúng 3 thứ:

```console
$ objdump -s -j .data prince_walk
 17000 00000000 00000000 08700100 00000000   .........p......   # 0x17008 = &0x17008 (cho __cxa_atexit)
 17010 01000000 01000000                     ........           # X = 1 , Y = 1
```

| Địa chỉ | Kiểu | Giá trị đầu | Ý nghĩa |
|---|---|---|---|
| `base+0x17008` | `void*` | `base+0x17008` | con trỏ tự trỏ (destructor registration) |
| **`base+0x17010`** | `int32` | `1` | **PLAYER X** |
| **`base+0x17014`** | `int32` | `1` | **PLAYER Y** |

Trong `main`:

```asm
1c28: mov eax, DWORD PTR [rip+0x153e2]   # 17010   <-- player X
1c2e: mov DWORD PTR [rbp-0x74], eax                <-- last_rendered_X
1c31: mov eax, DWORD PTR [rip+0x153dd]   # 17014   <-- player Y
1c37: mov DWORD PTR [rbp-0x70], eax                <-- last_rendered_Y
```

Và mỗi lần bấm WASD (sau khi kiểm tra cây):

```asm
1fe0: if (dx != 0) { px = clamp_add(px, dx); last_X = px; [0x17010] = px; }
1ff6: if (dy != 0) { py = clamp_add(py, dy); last_Y = py; [0x17014] = py; }
```

→ **Chỉ cần sửa 2 `int32` tại `base+0x17010` và `base+0x17014` là "dịch chuyển tức thời" tới bất cứ đâu.** Game không hề mã hoá/XOR/checksum 2 biến này (không có anti-cheat thật).

### 4.2 Thế giới sinh giả ngẫu nhiên — `world_get(x,y)` @ `0x21a2`

```c
char world_get(int64_t x, int64_t y) {
    if (x == 999999 && y == 999999) return '*';                       // beacon
    if (x >= -2 && x <= 4 && y >= -2 && y <= 4) return '.';           // vùng "an toàn" quanh gốc
    if (trong khoảng int32) {                                         // tránh tràn khi ép kiểu
        rec = landmark_lookup(x32, y32, 0, 0);
        if (rec) return ',';                                          // ô có landmark
    }
    uint64_t h = mix64(x + 0x9E3779B97F4A7C15) ^ mix64(y + 0xD1B54A32D192ED03);
    return "......,,TT~#"[ h % 12 ];                                  // 12 ký tự địa hình
}
```

* Magic `mul 0xAAAAAAAAAAAAAAAB` + `shr 3` ⇒ `h*3`, `shl 2` ⇒ `h*12`, rồi trừ ⇒ **`h % 12`**.
* Bảng `"......,,TT~#"` @ `0x4450`: **6 ô grass, 2 ô dirt, 2 ô tree, 1 water, 1 rock** ⇒ **1/6 số ô là cây (`T`) chặn đường**.
* Ô của người chơi được `render()` vẽ đè bằng `'O'` (khi `dx==0 && dy==0`), đích là `'*'`.

### 4.3 Bảng landmark (`.data.rel.ro` @ `0x16ba0`) — nơi có "căn phòng chứa flag"

Mỗi bản ghi **`0x20` byte**; có **2 bản ghi "đặc biệt"** (được hard-code trả về cho toạ độ beacon) và **7 bản ghi toạ độ thường**:

| # | Toạ độ | Title | `hidden` | `ach` |
|---|---|---|---|---|
| special `0x16ba0` | **(999999, 999999)** | `THE END OF THE WORLD` | **1** ← gọi `gen_flag()` | 0 `The End of the World` |
| special `0x16bc0` | (999999, 999999) | `YOU... ACTUALLY... WALKED HERE?` | 0 | 9 `PINCE Tutorial Failed Successfully` |
| 0 | (69, 420) | `AN ANCIENT MONUMENT` (HONK) | 0 | 1 `Nice.` |
| 1 | (404, 404) | `ERROR: LANDMARK NOT FOUND` | 0 | 2 `404: Achievement Not Found` |
| 2 | (1337, 1337) | `A MYSTERIOUS HACKER APPEARS` ("how to modify an int32") | 0 | 3 `1337` |
| 3 | (0, 0) | `THE ORIGIN` | 0 | 4 `The Origin` |
| 4 | (-1, -1) | `WELCOME TO NEGATIVE LAND` | 0 | 5 `Welcome to Negative Land` |
| 5 | (999999, **999998**) | `A WOODEN SIGN STANDS HERE` ("Almost there.") | 0 | 6 `Almost There` |
| 6 | (9999999, 9999999) | `THE REAL END OF THE WORLD` | 0 | 7 `The Real End of the World` |

Layout đọc trực tiếp từ file (nhớ đổi offset `vaddr-0x1000`):

* Bản ghi thường: `+0x00 x(int32)`, `+0x04 y(int32)`, `+0x08 title(char*)`, `+0x10 desc(char*)`, `+0x18 zero`, `+0x1c ach(int32)`; `landmark_lookup` trả về **`base+0x08`** (trỏ vào title).
* Bản ghi đặc biệt: `+0x00 title(char*)`, `+0x08 desc(char*)`, `+0x10 hidden(int32)`, `+0x14 ach(int32)`; trả về **`base+0x00`**.

Vì vậy `rec->hidden` = byte tại `rec+0x10` và `rec->ach` = `*(int*)(rec+0x14)` đúng cho **cả hai** layout — đó là lý do 2 layout "lệch nhau" vẫn dùng chung code.

Danh sách 10 achievement @ `0x16cc0` (mảng `char*[10]`):

```
0  The End of the World                5  Welcome to Negative Land
1  Nice.                               6  Almost There
2  404: Achievement Not Found          7  The Real End of the World
3  1337                                8  Reject Debugger, Embrace Walking
4  The Origin                          9  PINCE Tutorial Failed Successfully
```

### 4.4 "Anti-cheat" trong `landmark_lookup` @ `0x29ca` — đi bộ thì KHÔNG có flag

```c
rec = NULL;
if (x == 999999 && y == 999999) {
    if (dirty /* vị trí vừa đổi */ != 0)      return &REC_END_OF_WORLD;   // 0x16ba0  (có flag)
    if (wasd_inputs <= 1999995)               return &REC_END_OF_WORLD;   // 0x16ba0  (có flag)
    return &REC_WALKED_HERE;                                             // 0x16bc0  (KHÔNG flag)
}
for (i = 0; i < 7; i++)                       // tra 7 landmark toạ độ thường
    if (rec[i].x == x && rec[i].y == y) return &rec[i];
return NULL;
```

* Ngưỡng `0x1E847B = 1 999 995`. Quãng đường ngắn nhất từ `(1,1)` tới `(999999,999999)` là `999998 + 999998 = 1 999 996` lần bấm WASD ⇒ ngưỡng = **số bước tối thiểu trừ 1**. Nghĩa là: *chỉ cần bạn thực sự đi bộ (dù đi tối ưu tuyệt đối, chưa tính vòng tránh cây) là đã vượt ngưỡng*; còn sửa RAM thì bộ đếm gần như bằng 0.
* Cờ `dirty` = `[rbp-0x81]` trong `main`, **chỉ được set = 1 khi `(X,Y)` thay đổi mà không đi qua đường WASD** (`1d1e`, `1e82`). Sửa RAM trong lúc game đang `poll()` ⇒ frame sau thấy toạ độ đổi ⇒ `dirty = 1` ⇒ **luôn nhận bản ghi `0x16ba0` (có flag)**.
* Đi bộ bằng WASD: handler di chuyển tự cập nhật luôn `last_X/last_Y` (`1ff0`, `2006`) nên `dirty` giữ `0` ⇒ ở beacon rơi vào nhánh `wasd_inputs > 1999995` ⇒ nhận bản ghi "bạn thật sự đã đi bộ tới đây" → **không có flag**, chỉ có achievement `PINCE Tutorial Failed Successfully` (kèm mở luôn `The End of the World`).

**Cách flag hiện lên màn hình** (trong `render()` @ `0x14c3`):

```c
body = rec->desc;                                     // mặc định: lời thoại của Developer
if (rec->hidden != 0 && dialog_expanded) {            // 0x173f / 0x1747
    if (gen_flag(x, y, tmp, 0x80)) body = tmp;        // 0x1750 -> 0x2c52
}
print_multiline(body);                                // in tối đa 10 dòng, cắt theo '\n'
```

`dialog_expanded` (`[rbp-0x7f]`) chỉ được bật khi **bấm phím `1` hoặc `2`** đang đứng trên bản ghi có `hidden != 0` (`0x20ba`), và HUD lúc đó hiện `1 / 2: Reply | WASD: Keep walking | Q: Quit`.

⇒ **Kịch bản chuẩn của tác giả:** attach debugger → sửa `X = Y = 999999` → dialog `THE END OF THE WORLD` hiện ra → bấm `1` → `gen_flag()` chạy → flag.

---

## 5. Hàm sinh flag `gen_flag()` @ `0x2c52` — phân tích chi tiết

### 5.1 Chữ ký & cổng vào

```asm
1750: lea rdx,[rbp-0x130]        ; buffer 128 byte trên stack của render()
1757: mov esi,[rbp-0x178]        ; y
175d: mov eax,[rbp-0x174]        ; x
1763: mov ecx,0x80               ; cap = 128
1768: mov edi,eax
176a: call 2c52
```

```c
int gen_flag(int32_t x, int32_t y, char *out /*rdi*/, size_t cap /*rcx*/)
```

Mở đầu hàm:

```asm
2c8b: cmp [rbp-0x1c0],0 ; je fail      ; out == NULL
2c95: cmp [rbp-0x1c8],0 ; je fail      ; cap == 0
2cb0: mov BYTE [rax],0                 ; out[0] = '\0'
2cb3: cmp [rbp-0x1b4],0xf423f          ; x == 999999 ?
2cbd: jne fail
2cbf: cmp [rbp-0x1b8],0xf423f          ; y == 999999 ?
2cc9: je  continue   ;  nếu không -> return 0
```

→ Hàm **vô dụng ở mọi toạ độ khác**; chỉ (999999,999999) mới sinh ra được gì. (`0xF423F = 999999`.)

### 5.2 Khởi tạo: `state[16]` và `seed`

```asm
2cd5: for (i = 0; i <= 15; i++) {                        ; [rbp-0x1ac] = i
2ce1:   eax = rol32(y, (i+1) & 31)                       ; call 2bf8
2cf9:   edx = x ^ eax
2d01:   eax = (i+1) * 0x9E3779B9
2d10:   eax ^= edx
2d14:   call mix32  (2c18)
2d1f:   state[i] = eax                                   ; [rbp-0x160 + i*4]
}
2d36: eax = rol32(y, 19)
2d4e: eax += x
2d50: eax ^= 0xA4093822
2d57: seed = mix32(eax)                                  ; [rbp-0x1a8]
```

```c
uint32_t st[16];
for (int i = 0; i < 16; i++)
    st[i] = mix32( ((i+1) * 0x9E3779B9) ^ (x ^ rol32(y, (i+1) & 31)) );
uint32_t seed = mix32( ((rol32(y, 19) + x)) ^ 0xA4093822 );
```

### 5.3 Vòng lặp chính: 8320 vòng, mỗi vòng 1 "opcode"

```asm
2e05: [rbp-0x1a4] = 0     ; cnt  (số byte đã ghi)
2e0f: [rbp-0x1a0] = 0     ; c    (bộ đếm vòng)
2e19: jmp 325b
2e1e: ; ---- thân vòng lặp ----
2e1e: eax = c*0xd9 (217)
2e2a: edx = eax + 0xcd6 (3286)              ; t = c*217 + 3286
2e32: rax = 0xfc0fc0fd
2e37: imul rax,rcx                          ; (uint64)t * 0xfc0fc0fd
2e3b: shr rax,0x20 ; shr eax,0xd            ; q = (t * 0xfc0fc0fd) >> 45
2e48: edx -= q * 0x2080 (8320)              ; idx = t % 8320
2e62: ebx = ((int32*)0x4a80)[idx*2]         ; TAB[idx].a
2e74: eax = c * 0x9E3779B9 ^ seed ; call mix32
2e8d: eax ^= ebx ; k1 = eax                 ; [rbp-0x184]
2e95: ebx = ((int32*)0x4a84)[idx*2]         ; TAB[idx].b
2ead: eax = seed + c + 0x6A09E667 ; call mix32
2ec7: eax ^= ebx ; k2 = eax                 ; [rbp-0x180]
2ecf: dst = (k1 >> 8)  & 0x0F
2ee1: i1  = (k1 >> 12) & 0x0F
2ef3: i2  = (k1 >> 16) & 0x0F
2f05: sh  = (k1 >> 20) & 0x1F
2f17: a = st[i1] ; 2f2a: b = st[i2]
2f3d: switch (k1 & 0xFF) ...
3202: seed = rol32( ((st[i1] ^ seed) ^ st[dst]) ^ k1, 9 ) + k2 + c * 0x3C6EF372
3254: c++ ; 325b: while (c <= 0x207F)
```

Bảng tra: **`.rodata+0xA80` = `0x4a80`**, mỗi entry 8 byte `{uint32 a; uint32 b;}`, `8320` entry = **`0x10400` byte** ⇒ `0x4a80 + 0x10400 = 0x14E80` = **đúng hết phần đuôi `.rodata`**. (Đây chính là "vùng trông ngẫu nhiên" mà `strings` in ra.)

Phép chia magic: `(t * 0xFC0FC0FD) >> 45` là xấp xỉ `t / 8320`; với `t ≤ 8320*217+3286 = 1 811 815 < 2^21` nó **chính xác tuyệt đối**, nên có thể viết gọn `idx = t % 8320` (đã kiểm chứng: `assert idx == t % 8320`).

### 5.4 Tám "opcode" (`switch (k1 & 0xFF)`)

| `k1 & 0xFF` | Địa chỉ | Công thức | Ghi chú |
|---|---|---|---|
| `0x8B` | `0x2fcd` | `st[dst] = a + rol32(b, sh) + k2` | |
| `0x48` | `0x3004` | `st[dst] = rol32(b + k2, sh) ^ a` | |
| `0x31` | `0x303b` | `st[dst] = ((b + k2) ^ a) * (k2 \| 1)` | |
| `0x71` | `0x306d` | `st[dst] = a - rol32(b ^ k2, sh)` | |
| `0xB3` | `0x30a2` | `st[dst] = (a & k2) \| (~k2 & b)` | multiplexer `k2 ? a : b` |
| `0x12` | `0x30d2` | `st[dst] = mix32(a + b + k2)` | |
| `0xFF` | `0x3101` | `st[dst] = rol32(a ^ k2, (b ^ sh) & 31)` | |
| **`0x83`** | **`0x3139`** | **XUẤT 1 BYTE** | xem dưới |
| khác | `0x31f8` | `return 0` | mọi opcode lạ ⇒ toàn bộ hàm fail |

Nhánh `0x83` — "kênh rò rỉ" duy nhất của flag:

```asm
3139: eax = k2 >> 0x19            ; oi = (k2 >> 25) & 0x7F   -> vị trí 0..127
3148: if (oi > 0x7F) fail
3151: if (seen[oi] != 0) return 0        ; đã ghi rồi -> FAIL (không cho ghi đè)
316d: ebx = a ; call rol32(b, sh) ; ebx ^= eax
318e: byte = k2 ^ (a ^ rol32(b, sh))      ; [rbp-0x1ad]
319c: obuf[oi] = byte                     ; [rbp-0xa0 + oi]
31b0: seen[oi] = 1                        ; [rbp-0x120 + oi]
31be: cnt++                               ; [rbp-0x1a4]
31c5: edx = st[dst] ; eax = (oi + byte) * 0x45D9F3B ; edx ^= eax ; st[dst] = edx
```

* `seen[128]` là mảng chống ghi trùng: **nếu 2 vòng lặp cùng chọn 1 vị trí ⇒ hàm return 0**. Vì vậy 8320 vòng phải "bắn" trúng **đúng 128 vị trí phân biệt** (kiểm chứng khi chạy lại: `collected = 128, collisions = 0`).
* Bộ đếm `cnt` chính là **độ dài thật của thông điệp**.
* Chỉ 1 trong 8 opcode ghi dữ liệu ⇒ trung bình ~1040 vòng cho 1 byte.

### 5.5 Kiểm tra cuối & "đóng gói" kết quả

```asm
326b: cmp [rbp-0x1a4],0x80 ; jne fail      ; phải gom ĐÚNG 128 byte
3281: n = (uint8_t)obuf[0]                 ; obuf[0] = ĐỘ DÀI THÔNG ĐIỆP
3291: if (n == 0 || n > 0x7B) fail         ; 1..123
32a3: if (n >= cap) fail
32bc: h = 0x811C9DC5                       ; FNV-1a 32
32d2: for (i = 1; i <= n; i++) {
          ch = obuf[i];
          if ((ch <= 0x1F && ch != 0x0A) || ch > 0x7E) fail;   ; chỉ cho ASCII in được + '\n'
          h = (h ^ ch) * 0x01000193;
      }
334a: chk = LE32(obuf[n+1..n+4])
33a3: if (chk != h) fail                   ; checksum nhúng -> tự kiểm tra lời giải!
33b8: memcpy(out, obuf+1, n); out[n] = 0;  ; out = CHUỖI FLAG
33ee: return 1
```

⇒ **Cấu trúc 128 byte**: `[0]=len`, `[1..len]`=nội dung (flag), `[len+1..len+4]` = **FNV-1a 32 little-endian** của nội dung. Đây là "quà tặng" của tác giả: **bạn có thể tự verify lời giải mà không cần chạy binary**.

Với lời giải đúng: `n = 72`, `chk = 0x763CC96C`, hash tính lại = `0x763CC96C` ⇒ khớp.

---

## 6. Cách giải

### 6.1 Cách 1 — "đúng ý tác giả": attach debugger, sửa int32 (khuyên dùng khi đi thi)

Chạy game trong terminal ≥ `58x24`, rồi:

```bash
# 1) lấy base address (PIE)
pid=$(pgrep -n prince_walk)
base=$(grep prince_walk /proc/$pid/maps | head -1 | cut -d- -f1)

# 2) sửa 2 int32 toạ độ
gdb -q -batch -p $pid \
    -ex "set {int}(0x$base + 0x17010) = 999999" \
    -ex "set {int}(0x$base + 0x17014) = 999999" \
    -ex detach
```

> Với **PINCE**: attach → `Scan` giá trị `1` → lọc tiếp bằng cách đi vài bước → chọn địa chỉ `base+0x17010` (float/int32) → `Set value` = `999999`; tương tự `base+0x17014`.
> **Không cần `sudo`**: game tự gọi `prctl(PR_SET_PTRACER, PR_SET_PTRACER_ANY, 0,0,0)` (`0x1c05`: `edi=0x59616D61`, `rsi=(unsigned long)-1`) để **cho phép mọi tiến trình attach** — chính là dòng `Attach opt-in unavailable; OS debugger rules apply.` ở HUD khi `prctl` thất bại.

Kết quả **thật** (chạy game trong pty, attach gdb, ghi 2 biến, bấm `1`):

```
--- SAU KHI SUA X,Y -> 999999,999999 ---
PRINCE WALK
========================================================
THE END OF THE WORLD
Developer:
"How did you get here?"
1. I walked.
2. Don't worry about it.
========================================================
1 / 2: Reply   |   WASD: Keep walking   |   Q: Quit
PLAYER  X: 999999  Y: 999999
TARGET  X: 999999  Y: 999999
WASD inputs: 0
Reality appears to have shifted.            <-- thông báo của game khi toạ độ đổi "bất hợp pháp"

--- SAU KHI BAM "1" ---
========================================================
THE END OF THE WORLD
Developer:
"No you didn't."
MISSION COMPLETE
CSSCTF{P12INC3_0R_P1NC3?}
========================================================
```

Và màn achievements sau đó (`H`) — mở đúng achievement #0:

```
ACHIEVEMENTS  1 / 10
01  [x]  The End of the World
02  [ ]  ???
...
```

### 6.2 Cách 2 — **offline**: viết lại `gen_flag()` (không cần chơi, dùng khi chỉ có file)

Script đã chạy ra flag (đặt tên `solve.py`):

```python
import struct
d = open('prince_walk','rb').read()
TAB = d[0x4a80:0x14e80]        # 8320 entry x 8 byte = {uint32 a, uint32 b}
assert len(TAB) == 8320*8
M = 0xffffffff

def mix32(v):
    v &= M; v ^= v >> 16; v = v * 0x7feb352d & M
    v ^= v >> 15; v = v * 0x846ca68b & M; v ^= v >> 16
    return v & M

def rol(v, r):
    r &= 31; v &= M
    return ((v << r) | (v >> ((32 - r) & 31))) & M

X = Y = 999999
state = [mix32((X ^ rol(Y, (i+1) & 31)) ^ ((i+1)*0x9e3779b9 & M)) for i in range(16)]
seed  = mix32(((rol(Y, 0x13) + X) & M) ^ 0xa4093822)

out, seen = bytearray(128), bytearray(128)
cnt = 0
for c in range(0x2080):                       # 8320 vòng
    t   = c*0xd9 + 0xcd6
    idx = (t - (((t * 0xfc0fc0fd) & 0xffffffffffffffff) >> 45) * 0x2080) & M   # = t % 8320
    a0, b0 = struct.unpack_from('<II', TAB, idx*8)
    k1 = mix32((c*0x9e3779b9 & M) ^ seed) ^ a0
    k2 = mix32((c + seed + 0x6a09e667) & M) ^ b0
    dst, i1, i2, sh = (k1 >> 8) & 0xF, (k1 >> 12) & 0xF, (k1 >> 16) & 0xF, (k1 >> 20) & 0x1F
    a, b, op = state[i1], state[i2], k1 & 0xFF
    if   op == 0x8b: state[dst] = (a + rol(b, sh) + k2) & M
    elif op == 0x48: state[dst] = rol((b + k2) & M, sh) ^ a
    elif op == 0x31: state[dst] = ((((b + k2) & M) ^ a) * (k2 | 1)) & M
    elif op == 0x71: state[dst] = (a - rol(b ^ k2, sh)) & M
    elif op == 0xb3: state[dst] = (a & k2) | (~k2 & M & b)
    elif op == 0x12: state[dst] = mix32((a + b + k2) & M)
    elif op == 0xff: state[dst] = rol(a ^ k2, (b ^ sh) & 0x1F)
    elif op == 0x83:
        oi = (k2 >> 25) & 0x7f
        if not seen[oi]:                       # trùng vị trí -> binary sẽ fail
            byt = (k2 ^ (a ^ rol(b, sh))) & 0xff
            out[oi] = byt; seen[oi] = 1; cnt += 1
            state[dst] = (state[dst] ^ ((oi + byt) * 0x45d9f3b & M)) & M
    else:
        raise SystemExit('opcode la: %02x' % op)
    seed = (rol((state[i1] ^ seed) ^ state[dst] ^ k1, 9) + k2 + c*0x3c6ef372) & M

n = out[0]
h = 0x811c9dc5
for i in range(1, n+1):
    h = ((h ^ out[i]) * 0x1000193) & M
chk = struct.unpack_from('<I', out, n+1)[0]
print('n =', n, '| bytes =', cnt, '| checksum khop:', chk == h)
print('FLAG =', out[1:n+1].decode())
```

```console
$ python3 solve.py
n = 72 | bytes = 128 | checksum khop: True
FLAG = Developer:
"No you didn't."

MISSION COMPLETE

CSSCTF{P12INC3_0R_P1NC3?}
```

→ **Flag: `CSSCTF{P12INC3_0R_P1NC3?}`**

### 6.3 Cách 3 — gọi thẳng `gen_flag()` trong binary (verify nhanh, không cần script)

Dùng `.bss` (writable, ~160 byte) làm buffer, khỏi cần `malloc`:

```console
$ gdb -q -batch ./prince_walk \
    -ex 'starti' \
    -ex 'tbreak *0x555555555340' \
    -ex 'continue' \
    -ex 'p ((int(*)(int,int,char*,unsigned long))(0x555555554000+0x2c52))(999999,999999,(char*)(0x555555554000+0x17030),128)' \
    -ex 'x/s 0x55555556b030'

Temporary breakpoint 1, 0x0000555555555340 in ?? ()
$2 = 1                                            <-- hàm trả về 1 (thành công)
0x55555556b030: "Developer:\n\"No you didn't.\"\n\nMISSION COMPLETE\n\nCSSCTF{P12INC3_0R_P1NC3?}"
```

* `0x555555555340` = entry point (`0x1340`) sau khi loader map PIE; `$base = 0x555555554000` (gdb tắt ASLR mặc định).
* Buffer = `base + 0x17030` — nằm trong `.bss` (`0x17020..0x170c0`, 160 byte). Vì `.bss` chỉ có 160 byte nên 128 byte này **đè lên** `termios` gốc (`0x17080`) và các cờ tín hiệu; điều đó **vô hại** ở đây vì ta chỉ gọi hàm 1 lần trong phiên gdb `-batch` rồi thoát, không `continue` vào `main`.
* Phải `starti` **+ `continue` tới entry** trước khi `call`: nếu gọi ngay lúc còn trong `ld.so` thì runtime chưa sẵn sàng và gdb báo `signaled while in a function called from GDB`.

---

## 7. Verify & "đối chiếu chéo"

| Bước | Cách làm | Kết quả |
|---|---|---|
| 1 | Viết lại thuật toán bằng Python | `n=72`, gom đủ `128` byte, `0` va chạm vị trí |
| 2 | So checksum `FNV-1a 32` nhúng trong binary với hash tính lại | `0x763CC96C == 0x763CC96C` ✅ |
| 3 | Gọi `gen_flag()` trong binary thật bằng gdb | trả `1`, buffer = `"Developer:\n\"No you didn't.\"\n\nMISSION COMPLETE\n\nCSSCTF{P12INC3_0R_P1NC3?}"` ✅ |
| 4 | Chơi thật: pty + `gdb -p` sửa `X,Y` + bấm `1`, chụp màn hình | Dialog `THE END OF THE WORLD` → flag hiện trên HUD ✅ |
| 5 | Bấm `H` xem achievements | `ACHIEVEMENTS 1 / 10`, dòng 1 `[x] The End of the World` ✅ |

Script "chơi thật" (pty + gdb attach) dùng để chụp màn hình ở §6.1:

```python
import os, pty, time, fcntl, termios, struct, subprocess, re, select
BIN='/home/kali/Downloads/CSSCTF/RE/prince_walk'
pid, fd = pty.fork()
if pid == 0:
    os.environ['TERM']='xterm-256color'; os.execv(BIN,[BIN])
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH',30,80,0,0))   # 80x30 (>=58x24)
def drain(t=0.7):
    out=b''; end=time.time()+t
    while time.time()<end:
        r,_,_=select.select([fd],[],[],0.1)
        if r:
            try: out+=os.read(fd,65536)
            except OSError: break
    return out
drain(1.0)
base = int(open('/proc/%d/maps'%pid).read().split('\n')[0].split('-')[0],16)
subprocess.run(['gdb','-q','-batch','-p',str(pid),
    '-ex','set {int}(0x%x)=999999'%(base+0x17010),
    '-ex','set {int}(0x%x)=999999'%(base+0x17014),
    '-ex','detach'], capture_output=True)
drain(0.8)
os.write(fd, b'1')          # Reply -> gọi gen_flag() và in flag
print(re.sub(r'\x1b\[[0-9;?]*[a-zA-Z]','', drain(1.0).decode('utf-8','replace')))
os.write(fd, b'q'); time.sleep(0.3); os.kill(pid, 9)
```

---

## 8. Bài học & pitfalls

1. **`.data.rel.ro` lệch `0x1000` so với vaddr** (`vaddr 0x16ba0` ↔ `offset 0x15ba0`). Rất nhiều bảng dữ liệu của bài nằm ở đây ⇒ phải map lại offset khi đọc bằng Python/`xxd`, nếu không sẽ đọc ra rác hoặc `struct.error`.
2. **Bảng tra 8320 entry nằm ngay đuôi `.rodata`**: `0x4a80 + 8320*8 = 0x14E80` = hết section. Nhìn `strings` thì nó trông như "dữ liệu ngẫu nhiên vô nghĩa" — nhưng đó chính là nguyên liệu của `gen_flag`.
3. **Toán 32-bit trong Python phải mask `& 0xffffffff` ở MỌI phép** (`*`, `+`, `-`, `^` sau shift). Quên mask ⇒ sai toàn bộ `state/seed` ⇒ không ra flag. `rol32` phải `r & 31` và xử lý trường hợp `r == 0`.
4. **Phép chia magic `mul 0xFC0FC0FD; shr 45`** chỉ là `t % 8320` (chứng minh bằng `assert`), và `mul 0xAAAAAAAAAAAAAAAB; shr 3; *3; *4` chỉ là `% 12` trong `world_get`.
5. **`seen[128]` + `cnt == 128`**: binary **fail nếu có 2 vòng ghi trùng 1 vị trí**. Khi reimplement, nếu bạn "ghi đè" thay vì bỏ qua thì sẽ ra chuỗi sai mà không biết vì sao. Bản đúng: bỏ qua vị trí đã ghi (và trong binary là `return 0`).
6. **Checksum `FNV-1a` nhúng ở `out[n+1..n+4]`**: dùng để tự verify — nếu hash của bạn không khớp thì lời giải sai, không cần chạy game. Cũng chính là "cột mốc" để debug khi reimplement.
7. **Đừng đi bộ!** Cần ≥ `1 999 996` lần bấm WASD mới tới beacon, mà ngưỡng "đi bộ thật" là `> 1 999 995` input ⇒ đi bộ xong bạn chỉ nhận record `YOU... ACTUALLY... WALKED HERE?` (**không** có flag) + achievement `PINCE Tutorial Failed Successfully`; 99 input đầu còn bị Developer "càu nhàu" (`At this rate, you'll be there eventually.` → `You know PINCE is installed, right?` → … → `Please stop.`).
8. **Nhận diện "ý đồ" từ 2 dòng string**: `A terminal sandbox for PINCE Int32 memory-editing practice.` + `Attach opt-in unavailable; OS debugger rules apply.` là đủ để đoán 90% lời giải trước khi đọc disassembly.
9. Trong `main`, `landmark_lookup` được gọi ở **3 chỗ** (`0x1d44` đầu frame, `0x1ea8` sau khi đọc phím, `0x2041` sau khi di chuyển) — đều truyền `dirty`/`wasd_inputs` nên behavior khác nhau giữa "sửa RAM" và "đi bộ" như đã phân tích ở §4.4.
10. Tên bài (`prince_walk`) và flag (`P12INC3_0R_P1NC3?` = *"PRINCE or PINCE?"*) là một câu đùa: công cụ cần dùng là **PINCE**, chứ không phải đi bộ ("prince walk").

---

## 9. Phụ lục

**A. Bảng chuỗi landmark / achievement cần cho script đọc trực tiếp:**

```console
$ objdump -s -j .data.rel.ro prince_walk     # vaddr 0x16ba0, offset 0x15ba0
 16ba0 48450000 00000000 60450000 00000000   # 0x4548 "THE END OF THE WORLD", 0x4560 desc(dev)
 16bb0 01000000 00000000                     # hidden = 1, ach = 0
 16bc0 b0450000 00000000 d0450000 00000000   # 0x45b0 "YOU... ACTUALLY... WALKED HERE?"
 16bd0 00000000 09000000                     # hidden = 0, ach = 9
 16be0 45000000 a4010000 27460000 00000000   # (69,420)  "AN ANCIENT MONUMENT"
 16bf0 40460000 00000000 00000000 01000000   # desc, ach = 1 ("Nice.")
 ...
 16c80 3f420f00 3e420f00 26480000 00000000   # (999999,999998) "A WOODEN SIGN STANDS HERE"
 16ca0 7f969800 7f969800 54480000 00000000   # (9999999,9999999) "THE REAL END OF THE WORLD"
```

**B. Hằng số quan trọng của bài:**

| Hằng số | Giá trị | Dùng ở đâu |
|---|---|---|
| Toạ độ beacon | `999999` (`0xF423F`) | `landmark_lookup`, `gen_flag`, `world_get` |
| Ngưỡng "đi bộ thật" | `0x1E847B` = 1 999 995 (= số bước tối thiểu − 1) | `landmark_lookup` |
| Số vòng lặp sinh flag | `0x2080` = 8320 | `gen_flag` |
| Cỡ bảng tra | `8320 * 8` byte @ `0x4a80` | `gen_flag` |
| `cap` buffer | `0x80` = 128 | render → `gen_flag` |
| Golden ratio | `0x9E3779B9` / `0x9E3779B97F4A7C15` / `0x3C6EF372` | state, seed, PRNG |
| `k2` salt | `0x6A09E667` (SHA-256 IV đầu) | `gen_flag` |
| seed salt | `0xA4093822` (SHA-256 IV thứ 4) | `gen_flag` |
| FNV-1a 32 | basis `0x811C9DC5`, prime `0x01000193` | checksum cuối |
| `mix64` | `0xBF58476D1CE4E5B9`, `0x94D049BB133111EB` | `world_get` |
| `mix32` | `0x7FEB352D`, `0x846CA68B` | `gen_flag` |
| `PR_SET_PTRACER` | `0x59616D61`, arg `-1` | `prctl` cho phép attach |

**C. Địa hình (`0x4450`)** — `"......,,TT~#"` (12 ký tự ⇒ `h % 12`):
`'.'`×6 grass · `','`×2 dirt · `'T'`×2 tree (chặn) · `'~'` water · `'#'` rock
+ override: `'O'` = người chơi, `'*'` = đích `(999999,999999)`, `','` = ô có landmark.

---

---

# 4. Thử thách 4: FLAPPY BOARD (RE / client-server, replay validation)

> **Flag: `CSSCTF{birdddd}`**
>
> **Ý tưởng bài:** binary là một game X11 (Flappy Bird) **không chứa flag**. Muốn có flag phải **nộp một
> replay hợp lệ** — danh sách tick bấm cánh — cho flight-control server `http://34.116.80.78:8765`, vượt đủ
> 3 vòng (10 / 20 / 30 điểm) trong 20 phút. Server **mô phỏng lại** replay bằng đúng thuật toán của client,
> nên bắt buộc phải dịch ngược chính xác vật lý (`0x6cfe`), RNG (`0x6b88`) và sinh ống (`0x6bc6`) rồi
> viết lại bằng Python để tự sinh replay.
>
> **Bẫy thật của bài không nằm ở vật lý mà ở giao thức:** `POST /api/attempt` = tạo attempt mới (seed mới),
> `GET /api/attempt` = hỏi trạng thái attempt đang có (giữ nguyên seed). Gọi POST hai lần ⇒ attempt bị
> re-seed, và **mọi replay đúng đều bị trả về `error=Replay collides with an obstacle.`** — một thông báo
> núp bóng vật lý khiến bạn đi tìm lỗi không tồn tại. Xem §9.

---

## 0. TL;DR

```
1. file flappy_board      -> ELF64 PIE, stripped, libX11 + libcurl, server hardcode
                             http://34.116.80.78:8765 (0x55f8 trong .rodata)
2. strings -n5            -> đọc được luôn "hợp đồng" giữa client và server:
                             /api/attempt  /api/practice  /api/practice/check  /api/complete
                             "round=%d&wait_ms=%d&ticks=%d&score=%d&flaps="
                             "sequence=%d&ticks=%d&final=%d&score=%d&flaps="
3. Bản đồ hàm
     0x6c0f init_world(seed)          -> y=0xf000 (240px), 5 ống x=(i*270+1040)<<8,
                                         gapY = 125 + rng()%231
     0x6b88 xorshift32(x)             -> RNG của cả bài
     0x6bc6 gap_y(world)              -> 125 + rng()%231
     0x6cfe world_step(world, flap)   -> TOÀN BỘ vật lý, đơn vị 1/256 px, chạy 60Hz
     0x5bdf main                      -> máy trạng thái + vòng lặp sự kiện X11 + timing
4. Viết lại world_step/init_world/rng bằng Python  -> simulator (sim.py / ctl.py)
5. Verify #1 (oracle SỐ): POST /api/practice  rồi POST /api/practice/check
                           -> server trả "verified_score" do CHÍNH NÓ mô phỏng replay của mình
                           -> khớp tuyệt đối (ticks 329->1đ, 425->2đ, 1100->9đ, 1197->10đ, cheated=0)
6. Verify #2 (client thật): chạy binary dưới Xvfb, đọc world trong /proc/<pid>/mem,
                            ghi cờ flap (base+0x16f01) để client tự chơi
                            -> y lệch 0.0 px tại mọi mốc  =>  model vật lý khớp từng bit
7. Giao thức đúng:
       POST /api/attempt                 (không auth, body rỗng) -> token + round + seed + ...
       GET  /api/attempt   Bearer <token>                        -> status attempt HIỆN TẠI (cùng seed)
       POST /api/complete  Bearer <token>  round/wait_ms/ticks/score/flaps
                                            -> round kế tiếp, hoặc round=4 kèm flag
8. round 1/2/3 -> 3 lần submit -> round=4&flag=CSSCTF%7Bbirdddd%7D
```

---

## 1. Thông tin file & môi trường

```console
$ file flappy_board
flappy_board: ELF 64-bit LSB pie executable, x86-64, dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2,
BuildID[sha1]=fddd1d9b1e21317d47e67f31b16df027a9c42707, for GNU/Linux 3.2.0, stripped

$ strings -n 5 flappy_board | grep -E "api/|http|%d&|round=|flaps"
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer %s
/api/attempt          /api/practice         /api/practice/check      /api/complete
round=%d&wait_ms=%d&ticks=%d&score=%d&flaps=
sequence=%d&ticks=%d&final=%d&score=%d&flaps=
http://34.116.80.78:8765           <-- baked-in event server
https://   http://127.0.0.1:   http://localhost:
Use HTTPS, the configured event server, or localhost with an explicit port.
```

Không có `pe`/`NX` gì đáng lo: **không cần khai thác bộ nhớ**, chỉ cần *hiểu đúng* + *nói đúng giao thức*.

`.rodata` (0x8000–0x8a88) chứa toàn bộ UI text + format chuỗi + bảng nhảy trạng thái tại `0x8504`
(10 entry `int32` offset, tính từ `0x8504`):

| state `b288` | handler | màn hình |
|---|---|---|
| 0 | `0x35b8` | FLIGHT SCHOOL (menu, `[ENTER] PRACTICE`, `[F2] BEGIN THE THREE-ROUND CHALLENGE`) |
| 1 | `0x3a79` | practice đang chơi |
| 2 | `0x3814` | kết quả practice (`VERIFIED SCORE %d` / `SCORE NOT VERIFIED`) |
| 3 | `0x3653` | `DEPARTURE DELAY %02d : %02d` + `ROUND %d / %d POINTS REQUIRED` |
| 4 | `0x3797` | `CLEARED FOR TAKEOFF` / `[ ENTER ] START ROUND` |
| 5 | `0x3a79` | challenge đang chơi |
| 6 | `0x3814` | `UNSCHEDULED LANDING` / `[ ENTER ] TRY AGAIN` (đâm cột ở challenge) |
| 7 | `0x3926` | `ROUND CLEARED` / `[ ENTER ] CONTINUE` |
| 8 | `0x39a3` | `ALL THREE ROUNDS CLEARED` |
| 9 | `0x3a1d` | `SESSION EXPIRED` / `The server deadline has passed.` |

`is_playing()` @ `0x2e93` trả `true` ⟺ `state == 1 || state == 5` — đây là hàm mà vòng lặp chính dùng để
quyết định có step mô phỏng hay không (`0x6a5a`).

---

## 2. Bản đồ hàm (tự đặt tên theo hành vi)

| Địa chỉ | Tên | Việc |
|---|---|---|
| `0x2b75` | `now(clk_id)` | `clock_gettime(clk_id)` → `double` giây (`sec + nsec/1e9`); client dùng `1` = MONOTONIC, `6` = BOOTTIME |
| `0x2bee` `0x2c6b` `0x2d22` `0x2dac` | draw helpers | tô rect / vẽ chữ, XSetForeground, XCopyArea… |
| `0x2ec2` | `render()` | vẽ toàn bộ UI, switch theo `b288` (bảng nhảy `0x8504`) |
| `0x3e4a` | `kv_extract(resp,key,out,maxlen)` | tách `key=value` khỏi body `a=1&b=2`, `+`→space, `curl_easy_unescape` |
| `0x4134` | `kv_int(resp,key)` | `strtol(base 10)` trên `kv_extract`, lỗi → `-1` |
| `0x41ed` | `http(url, body, tokenbuf, resp)` | libcurl: `Content-Type: application/x-www-form-urlencoded`, `Authorization: Bearer %s` (nếu tokenbuf không rỗng), CURLOPT_CONNECTTIMEOUT=5, TIMEOUT=10, NOSIGNAL=1, WRITEFUNCTION/WRITEDATA → `resp`, **và `CURLOPT_POSTFIELDS` chỉ khi `body != NULL`** ⇒ `body==NULL` = **GET**, ngược lại = **POST**. `resp+0x1008` = HTTP code (struct 0x1010 byte) |
| `0x463b` | `http_path(path, body, out)` | gọi `41ed(path, body, &0x17020, out)` — `0x17020` là buffer token |
| `0x477e` | `ensure_token()` | nếu `token[0]!=0` → return; ngược lại **POST `/api/attempt`**, kiểm tra `strlen(token)==64`, `round==1`, `target==10`, sai → `"Game/server versions differ."` |
| `0x4714` | `set_deadline(resp)` | `b030 = now(6) + remaining_seconds` (hoặc `-1.0`); `16e98 = 0` |
| `0x4673` | `reset_world()` | `init_world(b024)`; `16e80=0`; `16e88=0.0`; key đầu = `'a'+rng(b028)%26` |
| `0x5032` | `parse_attempt(resp)` | `round`,`seed`,`target`,`wait_seconds`; validate `1<=round<=4`, `0<seed<2^32`, `target == [10,20,30][round-1]`, `0<=wait<=3600`; nếu `round==4` → lấy `flag` → `b2f4=4`, `b288=8` |
| `0x5259` | `begin_attempt()` | `ensure_token()` rồi **GET `/api/attempt`** → `parse_attempt` |
| `0x52d1` | `submit_round()` | dựng `round=%d&wait_ms=%d&ticks=%d&score=%d&flaps=` + danh sách tick, **POST `/api/complete`**, rồi `parse_attempt(resp)` |
| `0x491a` | `start_practice()` | POST `/api/practice` → `token`,`seed`; tạo tmpfile ghi replay; `reset_world()`; `state=1` |
| `0x4b54` | `verify_practice()` | đọc tmpfile, chia **chunk 6000 tick**, mỗi chunk POST `/api/practice/check` với `sequence`,`ticks`,`final`,`score`,`flaps` (**flap tính tương đối theo đầu chunk**) |
| `0x58a2` | `on_key(keysym)` | ENTER/F1/F2/F3, đổi flap key, và **set `16f01` nếu phím == flap key đang hiện** |
| `0x5a7c` | `write_snapshot()` | ghi `--snapshot file.ppm` (P6) từ XGetImage |
| `0x6b88` | `rng(x*)` | xorshift32 |
| `0x6bc6` | `gap_y(world)` | `125 + rng()%231` |
| `0x6c0f` | `init_world(world, seed)` | memset 0x54, rng=seed (0→1), y, 5 ống |
| `0x6cfe` | `world_step(world, flap)` | **toàn bộ vật lý 1 tick**, trả `true` nếu vừa ghi điểm |
| `0x5bdf` | `main` | vòng lặp: X11 event pump → timing → state machine → sim step → render |

---

## 3. Bản đồ bộ nhớ (toàn cục) — chỗ để debug

| Địa chỉ | Kiểu | Ý nghĩa |
|---|---|---|
| `0xb288` | int | **state** (bảng ở §1) |
| `0xb2a0` | struct | **world** (0x54 byte) — xem dưới |
| `0xb2f4` | int | round hiện tại: `0`=practice, `1..3`=challenge, `4`=đã xong 3 vòng |
| `0xb2f8` | int | `target` (số điểm cần) |
| `0xb2fc` | int | `wait_seconds` (độ trễ cất cánh của vòng) |
| `0xb280` | double | **đồng hồ đếm ngược departure delay** (`= wait_seconds`), `0x670d` giảm dần, hết ⇒ `state=4` |
| `0xb030` | double | deadline phiên (`now(BOOTTIME) + remaining_seconds`) |
| `0xb024` | u32 | **seed** nhận từ server |
| `0xb020` | int | **flap key** đang hiện (`'a'+rng()%26`, đổi sau mỗi điểm) |
| `0xb028` | u32 | RNG riêng cho flap key (init `0x000e0301` từ `.data`, **không** phụ thuộc seed) |
| `0xb038` | int | flap key trước đó (để không lặp lại key) |
| `0xb300` | int[12000] | **mảng tick đã bấm cánh** (`flaps`) |
| `0x16e80` | int | số phần tử `flaps` (vượt `0x2edf` → cờ "Replay is too large") |
| `0x16e88` | double | accumulator fixed-step (trừ `1/60` mỗi step) |
| `0x16e90` | double | mốc "đổi flap key" = `ticks/60 + 0.25` |
| `0x16ea0` | FILE* | tmpfile replay của practice |
| `0x16ea8` | u64 | bộ đếm tick của practice |
| `0x16eb0/16eb4` | u8/int | practice active / score cuối |
| `0x16f01` | u8 | **cờ "đã bấm cánh"**, vòng lặp đọc rồi xoá mỗi step |
| `0x16f20` | u8[256] | bảng "phím đang giữ" theo `keysym & 0xff` |
| `0x17020` | char[64+] | **token** (Bearer) |
| `0x171a0` | char[256] | buffer thông báo lỗi/UI |
| `0x172a0` | Display* | X11 display |

**World (`0xb2a0`), 0x54 byte — mirror 1-1 với code Python:**

| Offset | Kiểu | Ý nghĩa |
|---|---|---|
| `+0x00` | int | `y` củal bird (đơn vị **1/256 px**) |
| `+0x04` | int | `vy` (1/256 px / tick) |
| `+0x08` | int | `score` |
| `+0x0c` | int | `ticks` (bộ đếm tick của vòng) |
| `+0x10` | u32 | trạng thái RNG (xorshift32) |
| `+0x14` | u8 | `crashed` |
| `+0x18+12i` | int,int,u8 | ống thứ i: `x` (8.8 fixed px), `gapY` (px), `scored` |

---

## 4. Vòng đời một vòng đấu (để biết "nộp cái gì")

```
[state 0] FLIGHT SCHOOL
   └─ F2 ─► begin_attempt():  POST /api/attempt  ─► token
                              GET  /api/attempt  ─► round, seed, target, wait_seconds
                              reset_world(seed)  ─► state = 3 nếu wait>0, ngược lại 4
[state 3] DEPARTURE DELAY   : b280 (double) giảm theo thời gian thực; hết ⇒ state 4
[state 4] CLEARED FOR TAKEOFF
   └─ ENTER ─► reset_world(seed)  ─► state 5
[state 5] ĐANG CHƠI  (is_playing ⇒ mỗi 1/60s gọi world_step(flap)):
     • on_key(): nếu phím == b020 (flap key) ⇒ 16f01 = 1
     • main:  đọc+xoá 16f01 → nếu bật: flaps[16e80++] = world.ticks  (GHI TRƯỚC KHI STEP)
              gọi world_step(world, flap)  → ticks++, ghi điểm nếu vòng qua cột
              nếu vừa ghi điểm ⇒ đổi flap key (rng b028), 16e90 = ticks/60 + 0.25
              nếu world.crashed ⇒ state = 6 (đâm) hoặc 2 (practice)
              nếu score >= target ⇒ state = 7
[state 7] ROUND CLEARED
   └─ ENTER ─► submit_round(): POST /api/complete với round/wait_ms/ticks/score/flaps
              └─ response → parse_attempt: round kế tiếp (state 3) hoặc round=4 + flag (state 8)
```

Hai chi tiết cực quan trọng rút ra từ đây:

1. **`flaps[i]` = `world.ticks` tại thời điểm bấm, ghi TRƯỚC khi step** ⇒ tick 0-based, và flap tại tick `t`
   được áp dụng cho bước làm `ticks: t → t+1`.
2. **`ticks` nộp lên = tick lúc vòng được tính là xong** (đúng cái tick mà `score` chạm `target`), còn
   `wait_ms = wait_seconds * 1000` bất kể bạn có thực sự chờ hay không.

---

## 5. Dịch ngược mô phỏng vật lý (`0x6cfe`, `0x6c0f`, `0x6b88`, `0x6bc6`)

### 5.1 RNG `0x6b88` — xorshift32

```c
uint32_t rng(uint32_t *s) {
    uint32_t x = *s;
    x ^= x << 13;  x ^= x >> 17;  x ^= x << 5;      // 32-bit wrap
    return *s = x;
}
```

### 5.2 Sinh gap `0x6bc6` — `125 + rng()%231`

Trình biên dịch biến `% 231` thành chuỗi magic `mul 0x1BB4A405 / shr 32 / sub / shr 1 / add / shr 7`.
Phải port **y nguyên** chuỗi đó (đừng thay bằng `%`):

```python
def rng_mod231(x):
    edx = x & 0xFFFFFFFF
    hi  = ((edx * 0x1bb4a405) & 0xFFFFFFFFFFFFFFFF) >> 32
    ecx = ((edx - hi) & 0xFFFFFFFF) >> 1
    eax = ((hi + ecx) & 0xFFFFFFFF) >> 7
    return (edx - (eax * 0xe7 & 0xFFFFFFFF)) & 0xFFFFFFFF
```

### 5.3 Khởi tạo `0x6c0f`

```c
memset(world, 0, 0x54);
world->rng   = seed ? seed : 1;
world->y     = 0xF000;                       /* 61440 -> 240.0 px */
for (i = 0; i < 5; i++) {
    world->pipes[i].x    = (i * 0x10E + 0x410) << 8;   /* 1040,1310,1580,1850,2120 px */
    world->pipes[i].gapY = 125 + rng() % 231;          /* 125..355 px */
    world->pipes[i].scored = 0;
}
/* score = ticks = vy = crashed = 0 */
```

### 5.4 Step `0x6cfe` — trái tim của bài

```c
int world_step(World *w, int flap) {
    if (w->crashed || w->ticks > 0x8C9F /*35999*/) { w->crashed = 1; return 0; }
    if (flap) w->vy = -1724;          /* 0xFFFFF944 */
    w->vy += 67;                      /* 0x43 */
    if (w->vy > 2048) w->vy = 2048;   /* 0x800 */
    w->y += w->vy;
    w->ticks++;
    for (i=0;i<5;i++) w->pipes[i].x -= 717;         /* 0x2CD = 2.8 px/tick */
    if (w->y <= 3072 /*0xC00*/ || w->y > 119807 /*0x1D3FF*/) w->crashed = 1;

    int before = w->score;
    for (i=0;i<5;i++) {                              /* vòng 1: va chạm + ghi điểm */
        Pipe *p = &w->pipes[i];
        if (p->x > 30720 && p->x <= 54271) {         /* 0x7800 < x <= 0xD3FF  (120..212 px) */
            int lo = (p->gapY - 87) << 8, hi = (p->gapY + 87) << 8;      /* 0x57 = 87 */
            if (!((w->y - 3071) > lo && (w->y + 3071) < hi))             /* 0xBFF = ±75.00 px */
                w->crashed = 1;
        }
        if (!p->scored && p->x <= 30719) {           /* 0x77FF ~ 119.99 px */
            p->scored = 1;
            if (!w->crashed) w->score++;
        }
    }
    for (i=0;i<5;i++) {                              /* vòng 2: tái chế ống */
        Pipe *p = &w->pipes[i];
        if (p->x < -17408 /*-0x4400 = -68 px*/) {
            int maxx = 0;
            for (j=0;j<5;j++) if (w->pipes[j].x > maxx) maxx = w->pipes[j].x;
            p->x = maxx + 69120;                     /* 0x10E00 = 270 px */
            p->gapY = 125 + rng() % 231;
            p->scored = 0;
        }
    }
    return w->score != before;
}
```

**Bảng hằng số (toàn bộ đều đọc trực tiếp từ listing — đơn vị 1/256 px):**

| Hằng | Hex | Nghĩa |
|---|---|---|
| `-1724` | `0xFFFFF944` | vận tốc đặt khi bấm cánh |
| `67` | `0x43` | trọng lực mỗi tick |
| `2048` | `0x800` | vy tối đa (rơi tự do) |
| `717` | `0x2CD` | tốc độ ống (2.8 px/tick ⇒ 168 px/s) |
| `3072` / `119807` | `0xC00` / `0x1D3FF` | sàn / trần ⇒ chết (12 px / 468 px) |
| `30720`/`54271` | `0x7800`/`0xD3FF` | cửa sổ va chạm theo trục x (120..212 px) |
| `30719` | `0x77FF` | mốc cộng điểm (≤ 119.99 px) |
| `3071` (margin) | `0xBFF` | nửa "hộp" bird ⇒ band an toàn = `gapY ± 75.0039` px |
| `87` | `0x57` | nửa chiều cao khe |
| `-17408` / `69120` | `-0x4400` / `0x10E00` | ngưỡng tái chế / khoảng cách ống (270 px) |
| `125`..`355` | `0x7D`..`0x163` | dải gapY = `125 + rng()%231` |
| `0xF000` | | y khởi tạo (240 px) |
| `1040` / `270` | `0x410` / `0x10E` | ống đầu tiên / khoảng cách ống |
| `35999` | `0x8C9F` | số tick tối đa của một vòng |
| `1200` / `12000` | `0x2EDF` | số flap tối đa (vượt ⇒ "Replay is too large") |
| `1/60` | `0x3F91111111111111` | bước thời gian fixed-step |
| `0.5` | | dt tối đa được clamp mỗi frame |

**Hệ quả thiết kế để chọn chiến thuật (dùng khi viết bot):**

* Bấm cánh ⇒ `vy = -1657` ⇒ đi lên ~6.47 px/tick; nhả ⇒ rơi tối đa 8 px/tick.
* Một cú bấm "nâng" tối đa ~76.8 px (sau ~24.7 tick thì vy về 0) ⇒ chu kỳ "hover" tự nhiên ~49 tick.
* Band an toàn ±75 px quanh `gapY`, mà biên độ hover chỉ ~±38 px ⇒ **bộ điều khiển luật đơn giản là đủ**:
  `aim = (gapY_của_ống_gần_nhất_còn_ở_phía_trước) + 38 px`, và **bấm khi `y >= aim`**.
  Ống gần nhất "phía trước" = ống có `x` nhỏ nhất trong các ống còn `x > 120 px`.
* Ống cách nhau 270 px = 96.4 tick; cửa sổ va chạm rộng 92 px = 32.8 tick.

---

## 6. Giao thức HTTP (đọc từ `41ed`, `477e`, `5259`, `52d1`, `5032`)

| Request | Verb | Body | Response |
|---|---|---|---|
| `/api/attempt` | **POST** (body `""`) | — | `token=<64hex>&round=1&seed=<u32>&remaining_seconds=1200&limit_seconds=1200&target=10&wait_seconds=180` |
| `/api/attempt` | **GET** (Bearer) | — | `round=1&seed=3102798517&remaining_seconds=1199&limit_seconds=1200&target=10&wait_seconds=180` (**cùng seed**) |
| `/api/complete` | POST (Bearer) | `round=<r>&wait_ms=<wait*1000>&ticks=<t>&score=<target>&flaps=<t0,t1,...>` | `round=2&seed=..&...` … `round=4&...&flag=CSSCTF%7B..%7D` |
| `/api/practice` | POST (Bearer) | `""` | `token=..&seed=..&verified_score=0&remaining_seconds=..&limit_seconds=..` |
| `/api/practice/check` | POST (Bearer) | `sequence=<i>&ticks=<chunk>&final=<0/1>&score=<s>&flaps=<...>` | `verified_score=<n>&sequence=<i>&complete=1&cheated=<0/1>&remaining_seconds=..` |

Vòng 1 ⇒ `target=10, wait=180`; vòng 2 ⇒ `20/360`; vòng 3 ⇒ `30/600` (**lưu ý**: `wait` tăng dần, không phải
hằng 180).

**Các thông báo lỗi của server = luôn là "spec" để dò luật:**

| Message | Điều kiện |
|---|---|
| `error=Start a new attempt first.` | không có/không đúng token |
| `error=You cheated. You are banned from this game.` | `score != target` (nộp vòng chưa xong) |
| `error=Virtual waiting timer has not completed.` | `wait_ms < wait_seconds*1000` |
| `error=Replay collides with an obstacle.` | mô phỏng lại thấy bird đâm (hoặc chết) |
| `error=Invalid flap replay.` | danh sách flap không hợp lệ (vd tick âm) |
| `error=Out-of-range ticks` | `ticks` quá lớn (> ~36000, đúng bằng `0x8C9F`) |
| `error=Round order mismatch. Refresh attempt status.` | nộp lại vòng cũ sau khi đã sang vòng mới |
| HTTP **410** | client tự đặt `state = 9` (`SESSION EXPIRED`) tại `0x4608` |

---

## 7. Cách giải

### 7.1 Bước 1 — viết simulator (`ctl.py`)

Port 1-1 §5; thêm bộ điều khiển `aim = gapY_next + 38px`, `flap ⟺ y >= aim`.
Test 300 seed × 3 target (10/20/30) → **900/900 thành công**, tick khớp lý thuyết
(`(1040 + 9*270 - 119.5)/2.8 ≈ 1196.6` tick cho 10 điểm).

### 7.2 Bước 2 — verify bằng **oracle số** (`/api/practice/check`)

Đây là mẹo quan trọng nhất khi gặp bài client-server: tìm endpoint nào **trả về giá trị server tự tính**
(`verified_score`) rồi dùng nó làm oracle, thay vì đoán.

```python
# chuẩn bị: POST /api/attempt -> token ; POST /api/attempt(Bearer) -> session ;
#          POST /api/practice(Bearer) -> practice_token, seed
body = f"sequence=0&ticks={tc}&final=1&score={claim}&flaps=" + ",".join(map(str, flaps))
# -> verified_score=10&complete=1&cheated=0
```

Kết quả đối chiếu (mỗi lần một session mới vì mỗi session chỉ check được 1 lần):

| ticks nộp | model của mình | server trả |
|---|---|---|
| 329 | 1 điểm | `verified_score=1` |
| 425 | 2 | `verified_score=2` |
| 1100 | 9 | `verified_score=9` |
| 1197 | 10 | `verified_score=10`, `cheated=0` |
| (không bấm gì) | chết ở tick 43, 0 điểm | `verified_score=0`, `cheated=1` |

⇒ **RNG, sinh ống, cửa sổ va chạm, mốc cộng điểm, luật chết đều khớp tuyệt đối.**

### 7.3 Bước 3 — verify bằng **client thật** (đọc/ghi `/proc/<pid>/mem`)

Vì sao cần: để chắc `flaps` ghi *trước* step và `ticks` đúng chỗ, và để có một replay "do chính client sinh"
làm mẫu chuẩn.

```python
env = dict(os.environ, DISPLAY=":99")
p = subprocess.Popen(["flappy_board", "--server", "http://127.0.0.1:8123"], env=env)
# base = dòng đầu (r--p offset 0) của /proc/<pid>/maps
BASE = int(open(f"/proc/{p.pid}/maps").readline().split("-")[0], 16)
mem  = open(f"/proc/{p.pid}/mem", "rb+", buffering=0)
mem.seek(BASE + 0x16f01); mem.write(b"\x01")            # = "vừa bấm cánh"
```

Chương trình bot: F2 (`xdotool key --window <id> F2`) → ghi `0.0` vào `base+0xb280` để bỏ qua 180s chờ →
ENTER → mỗi vòng poll `base+0xb2a0` (world) và set cờ flap theo đúng luật `y >= aim`.
Kiểm chứng chéo `y` tại tick 300/600/900 giữa client thật và simulator: **lệch 0.0 px**; replay client sinh
(`nflaps=69, ticks=1197`) được server nhận (`round=2`) ⇒ model đúng từng bit.

### 7.4 Bước 4 — solver cuối (nộp thẳng, không cần chơi)

`flappy_solver.py` (đặt cùng thư mục):

```python
#!/usr/bin/env python3
import urllib.request, urllib.parse, urllib.error, sys

BASE = "http://34.116.80.78:8765"
MASK32 = 0xFFFFFFFF
FLAP_VY, GRAVITY, VY_MAX = -1724, 67, 2048
PIPE_DX  = 717
Y_MIN, Y_MAX = 3072, 119807
COLL_LO, COLL_HI, SCORE_X = 30720, 54271, 30719
RESPAWN_X, RESPAWN_GAP = -17408, 69120
GAP_HALF, BIRD_MARGIN = 87, 0xBFF
NPIPES, Y_START, X_START, PIPE_SPACING = 5, 0xf000, 0x410, 0x10e
MAX_TICKS = 0x8c9f

def rng_next(x):
    x &= MASK32
    x ^= (x << 13) & MASK32; x ^= x >> 17; x ^= (x << 5) & MASK32
    return x & MASK32

def rng_mod231(x):
    edx = x & MASK32
    hi = ((edx * 0x1bb4a405) & 0xFFFFFFFFFFFFFFFF) >> 32
    ecx = ((edx - hi) & MASK32) >> 1
    eax = ((hi + ecx) & MASK32) >> 7
    return (edx - (eax * 0xe7 & MASK32)) & MASK32

class Game:
    def __init__(self, seed):
        self.rng = (seed & MASK32) or 1
        self.y, self.vy, self.score, self.ticks, self.crashed = Y_START, 0, 0, 0, False
        self.pipes = [[(i*PIPE_SPACING + X_START) << 8, self.gap(), False] for i in range(NPIPES)]

    def gap(self):
        self.rng = rng_next(self.rng)
        return 125 + rng_mod231(self.rng)

    def aim(self, dx=38):
        ahead = [p for p in self.pipes if p[0] > COLL_LO]
        return (min(ahead, key=lambda q: q[0])[1] + dx) << 8 if ahead else None

    def step(self, flap):
        if self.crashed or self.ticks > MAX_TICKS:
            self.crashed = True; return False
        if flap: self.vy = FLAP_VY
        self.vy += GRAVITY
        if self.vy > VY_MAX: self.vy = VY_MAX
        self.y += self.vy
        self.ticks += 1
        for p in self.pipes: p[0] -= PIPE_DX
        if self.y <= Y_MIN or self.y > Y_MAX: self.crashed = True
        old = self.score
        for p in self.pipes:
            x = p[0]
            if COLL_LO < x <= COLL_HI:
                if not (self.y - BIRD_MARGIN > (p[1]-GAP_HALF) << 8 and
                        self.y + BIRD_MARGIN < (p[1]+GAP_HALF) << 8):
                    self.crashed = True
            if not p[2] and x <= SCORE_X:
                p[2] = True
                if not self.crashed: self.score += 1
        for p in self.pipes:
            if p[0] < RESPAWN_X:
                p[0] = max(q[0] for q in self.pipes) + RESPAWN_GAP
                p[1] = self.gap(); p[2] = False
        return self.score != old

def play(seed, target):
    g, flaps = Game(seed), []
    while True:
        a = g.aim()
        flap = a is not None and g.y >= a
        if flap: flaps.append(g.ticks)     # ghi TRƯỚC khi step, y như client
        g.step(flap)
        if g.crashed: return None, g.ticks, "crashed"
        if g.score >= target: return flaps, g.ticks, "ok"

def req(path, method="POST", body="", token=None):
    r = urllib.request.Request(BASE + path, data=body.encode() or None, method=method)
    r.add_header("Content-Type", "application/x-www-form-urlencoded")
    r.add_header("Accept", "*/*")
    if token: r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def kv(text, key):
    for part in text.split("&"):
        if "=" in part:
            k, v = part.split("=", 1)
            if k == key: return urllib.parse.unquote_plus(v)
    return None

def main():
    st, r = req("/api/attempt", "POST")                      # 1) TẠO attempt
    print("POST /api/attempt ->", st, r)
    token = kv(r, "token")
    st, r = req("/api/attempt", "GET", token=token)          # 2) HỎI trạng thái (GIỮ seed)
    print("GET  /api/attempt ->", st, r)
    seed, rnd = int(kv(r, "seed")), int(kv(r, "round"))
    target, wait = int(kv(r, "target")), int(kv(r, "wait_seconds"))
    while True:
        flaps, ticks, status = play(seed, target)
        print(f"round {rnd}: seed={seed} target={target} -> {status} ticks={ticks} flaps={len(flaps)}")
        body = (f"round={rnd}&wait_ms={wait*1000}&ticks={ticks}&score={target}"
                f"&flaps=" + ",".join(map(str, flaps)))
        st, r = req("/api/complete", "POST", body, token=token)
        print("POST /api/complete ->", st, r)
        if st != 200: sys.exit("rejected")
        rnd = int(kv(r, "round"))
        if rnd == 4:
            print("\nFLAG:", kv(r, "flag")); return
        seed, target, wait = int(kv(r,"seed")), int(kv(r,"target")), int(kv(r,"wait_seconds"))

if __name__ == "__main__":
    main()
```

Chạy `python3 flappy_solver.py`:

```
POST /api/attempt -> 200 token=a3243d29...&round=1&seed=4119506806&remaining_seconds=1200&limit_seconds=1200&target=10&wait_seconds=180
GET  /api/attempt -> 200 round=1&seed=4119506806&remaining_seconds=1200&limit_seconds=1200&target=10&wait_seconds=180

round 1: seed=4119506806 target=10 -> ok ticks=1197 flaps=58
POST /api/complete -> 200 round=2&seed=131355172&remaining_seconds=1199&limit_seconds=1200&target=20&wait_seconds=360

round 2: seed=131355172 target=20 -> ok ticks=2161 flaps=119
POST /api/complete -> 200 round=3&seed=2548612667&remaining_seconds=1199&limit_seconds=1200&target=30&wait_seconds=600

round 3: seed=2548612667 target=30 -> ok ticks=3125 flaps=161
POST /api/complete -> 200 round=4&seed=1136974664&remaining_seconds=1198&limit_seconds=1200&target=0&wait_seconds=0&flag=CSSCTF%7Bbirdddd%7D

FLAG: CSSCTF{birdddd}
```

Tổng thời gian "chơi" thật: 1197+2161+3125 = 6483 tick ≈ 108 giây — thoải mái trong `limit_seconds = 1200`.

---

## 8. Cách **không** giải / đường cụt đã thử (để tiết kiệm thời gian cho người sau)

Trước khi tìm ra bẫy `POST`/`GET`, mình đã mất rất nhiều thời gian vì **mọi replay đều bị
`Replay collides with an obstacle.`** trong khi oracle `verified_score` khẳng định simulator đúng 100%.
Các giả thuyết đã **loại trừ bằng thực nghiệm** (mỗi giả thuyết vài chục request, mỗi request một session mới):

| Giả thuyết | Cách test | Kết quả |
|---|---|---|
| lệch 1 tick (`flaps ±1`, `ticks ±1`) | thử offset −2..+3 | ❌ vẫn collides |
| pre-roll: ống chạy trước W tick trong lúc "chờ cất cánh" | quét W = 0,60,180,300,600,1200,1800,3600,7200,10800,18000,36000,72000,180000 | ❌ tất cả collides (và `W=10800` làm vòng đấu gần như không chơi được) |
| ống bị dịch pha đúng `s` tick | quét `s = −96..+59` | ❌ |
| **thời gian thực** từ lúc tạo attempt mới cho nộp | nộp sau 25 s | ❌ (vẫn collides) |
| `wait_ms` phải khác | `wait_ms = 0 / 1` | ⚠️ lộ ra thông báo mới: `Virtual waiting timer has not completed.` |
| `ticks` quá lớn | `ticks = 36865` | ⚠️ lộ ra `Out-of-range ticks` ⇒ trần đúng bằng `0x8C9F` |

Điểm mấu chốt: **`/api/practice/check` chấp nhận chính xác danh sách flap mà `/api/complete` từ chối.**
Tức là *vật lý đúng, khác biệt nằm ở phiên làm việc*. Khi đó mới đi sniff traffic.

---

## 9. Bẫy chính: `POST` vs `GET` trên cùng một path

### 9.1 Cách tìm ra

Không thể sniff trực tiếp (server ở xa, không có quyền tcpdump), nhưng client cho phép
`--server http://127.0.0.1:PORT` (whitelist ở `main`: `strcmp(url,"http://34.116.80.78:8765")==0`
hoặc `strncmp(url,"https://",8)==0` hoặc `strncmp(url,"http://127.0.0.1:",17)==0` hoặc
`strncmp(url,"http://localhost:",17)==0`). ⇒ **dựng reverse-proxy logging** đứng trước server thật rồi cho
client chạy qua nó. Log thu được:

```
[   4.89] --> POST /api/attempt
        hdrs={'Accept': '*/*', 'Content-Type': 'application/x-www-form-urlencoded'}
[   5.32] <-- 200 token=d090c5d9...&round=1&seed=3102798517&...&target=10&wait_seconds=180
[   6.41] --> GET  /api/attempt                      <========== GET, KHÔNG phải POST!
        hdrs={'Authorization': 'Bearer d090c5d9...'}
[   6.84] <-- 200 round=1&seed=3102798517&remaining_seconds=1199&...      (CÙNG seed)
[  27.14] --> POST /api/complete
        body=round=1&wait_ms=180000&ticks=1197&score=10&flaps=28,29,80,81,...
[  27.77] <-- 200 round=2&seed=2635025733&...&target=20&wait_seconds=360
```

### 9.2 Vì sao lại như vậy (đọc từ disassembly)

`0x41ed` chỉ set `CURLOPT_POSTFIELDS` **khi con trỏ body != NULL**:

```asm
4497: cmp QWORD PTR [rbp-0x340], 0x0     ; arg2 = body
449f: je  44ce                            ; body == NULL -> KHÔNG set POSTFIELDS -> libcurl GET
44a1: ... CURLOPT_POSTFIELDS ...          ; body != NULL -> POST
44d8: call curl_easy_perform
```

Và hai caller truyền khác nhau:

* `0x477e ensure_token` → `rsi = ""` (con trỏ **hợp lệ**, chuỗi rỗng) ⇒ **POST** (tạo attempt mới).
* `0x5259 begin_attempt` → `mov esi, 0x0` ⇒ **GET** (lấy trạng thái attempt hiện có, `5032` parse y như
  response của POST nhưng **server không sinh seed mới**).

Nếu bạn (như mình) gọi `POST /api/attempt` hai lần:

1. POST #1 ⇒ attempt A, seed `S_A`.
2. POST #2 ⇒ **attempt B, seed `S_B`** — nhưng response trả về `S_B` trong khi… server đã "xoá/đổi" attempt
   đang hiệu lực theo cách mà replay của bạn (tính theo `S_B`) **không bao giờ khớp** ⇒ luôn
   `Replay collides with an obstacle.`
3. Mọi nỗ lực "sửa vật lý" đều vô ích, vì vật lý vốn đã đúng.

Sửa đúng 1 dòng (POST → GET ở bước 2) ⇒ 3 vòng qua liên tiếp, flag hiện ra.

> **Quy tắc rút ra:** khi client-server, hãy sniff **đúng trình tự method** mà client dùng.
> `POST /x` và `GET /x` trên cùng path có thể là "tạo mới" vs "hỏi trạng thái" — và một thông báo lỗi
> mang mùi "logic game" (`collides with an obstacle`) hoàn toàn có thể là hệ quả của việc bạn tự tạo
> session sai, chứ không phải của thuật toán.

---

## 10. Verify cuối & kết quả

* Chạy solver **4 lần độc lập**, mỗi lần một `token`/`seed` hoàn toàn mới (4119506806, 502967252,
  1707535532, 1190700225 …) — flag **không đổi**: `CSSCTF{birdddd}` (15 ký tự, URL-decode từ
  `CSSCTF%7Bbirdddd%7D`).
* Flag do **chính challenge server** trả về trong response `round=4` của `/api/complete`, không phải suy đoán
  hay ghép chuỗi.
* Đối chiếu chéo 3 tầng: `verified_score` (server) == simulator (1) == trajectory client thật đo qua
  `/proc/pid/mem`, lệch 0.0 px (2), và replay client tự sinh được server chấp nhận (3).

---

## 11. Bài học & pitfalls

1. **Bài RE "có server" thì phải tách 2 lớp: vật lý và giao thức.** Lớp vật lý có thể verify tĩnh/động
   (oracle số, so trajectory), nhưng lỗi thường nằm ở lớp giao thức — nơi không có tài liệu và **không
   suy ra được từ code nếu không nhìn thấy traffic**.
2. **Tìm endpoint trả giá trị do server tính** (`verified_score`) và biến nó thành oracle số. Đừng bao giờ
   "tin" một thông báo lỗi mơ hồ khi có cách đo đạc định lượng.
3. **Dùng chính binary làm thiết bị đo:** chạy dưới `Xvfb`, tìm base PIE trong `/proc/<pid>/maps`, rồi
   đọc/ghi trực tiếp vào state (`base+offset`) qua `/proc/<pid>/mem`. Cách này vừa để auto-play, vừa để
   so trajectory tick-by-tick — chứng minh model khớp *từng bit* thay vì "trông có vẻ đúng".
4. **Whitelist `--server` của client = cửa để sniff**: chèn reverse-proxy logging vào giữa và đọc nguyên
   văn method/headers/body. Ở đây nó tiết kiệm hàng giờ.
5. **Thông báo lỗi của server là spec**: `waiting timer has not completed`, `out-of-range ticks`,
   `invalid flap replay`, `you cheated`, `round order mismatch` — mỗi cái là một nhánh kiểm tra, dùng để
   bisect luật kiểm tra bằng cách chỉ đổi **một** tham số mỗi request.
6. **Khi mọi thứ "đúng" mà vẫn fail, hãy kiểm tra lại *trạng thái phiên*, không phải thuật toán.**
   Ở đây: attempt bị tạo lại (POST) vs được hỏi (GET) — cùng path, khác verb, khác ngữ nghĩa.
7. Chi tiết nhỏ nhưng chí mạng khi port thuật toán: `% 231` phải port đúng chuỗi magic
   (`0x1BB4A405`), đơn vị là **1/256 px** với `int32` (mọi phép tính phải mask 32-bit), và `flaps` ghi
   **trước** khi step; `ticks` là tick lúc chạm `target`, không phải lúc hết giờ.

---

## 12. Phụ lục

### A. Lệnh nhanh để dựng lại từ đầu

```console
$ file flappy_board && strings -n 5 flappy_board | head -120
$ r2 -q -c "e scr.color=0; aaa; afl" flappy_board | grep -v sym.imp
$ objdump -d -M intel flappy_board > fb.asm      # rồi đọc 0x6cfe / 0x6c0f / 0x6b88 / 0x6bc6 / 0x41ed
$ python3 flappy_solver.py                        # quét sạch 3 vòng -> flag
```

### B. Chạy client thật (để tự chơi / chụp ảnh)

```console
$ Xvfb :99 -screen 0 1024x900x24 &
$ DISPLAY=:99 ./flappy_board                       # chơi tay (phím flap đổi mỗi điểm!)
$ DISPLAY=:99 ./flappy_board --snapshot out.ppm    # ảnh P6 của khung hình
$ DISPLAY=:99 ./flappy_board --server http://127.0.0.1:8123   # qua proxy logging
```

### C. Hằng số rời (`/api/attempt`)

```
round=1  seed=<random u32>   remaining_seconds=1200  limit_seconds=1200
target=10   wait_seconds=180      (vòng 2: 20/360, vòng 3: 30/600)
```

### D. Thông tin thêm về surface tấn công (không cần cho flag, nhưng đáng ghi)

* `--snapshot` ghi PPM qua `XGetImage` — không ảnh hưởng server.
* `Authorization: Bearer %s` sinh bằng `snprintf(buf, 0x60, ...)` với token 64 hex ⇒ không có chỗ để inject.
* `/api/practice` **bỏ qua** `round`/`target`/`wait` ⇒ đây là đường "luyện tập" miễn phí và là oracle tốt,
  nhưng **không** cộng điểm cho challenge.
