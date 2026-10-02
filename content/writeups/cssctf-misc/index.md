---
title: '[CSSCTF] Tuyển Tập Writeup Các Thử Thách MISC'
date: '2026-10-02'
description: 'Tuyển tập writeup các thử thách MISC đa dạng trong CSSCTF: Graph Theory,
  Computational Geometry, Custom VM RE.'
categories: [CSSCTF, Misc]
tags: [cssctf, misc, graph-theory, geometry, vm-re]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] Tuyển Tập Writeup Các Thử Thách MISC

**Tác giả:** k0z1l
**Thể loại:** MISC / Graph Theory / Computational Geometry / Custom VM Reverse Engineering / Modular Arithmetic / Elliptic Curves  
**Định dạng Flag:** `CSSCTF{...}`

---

## Mục lục
1. [A Star Trail 1](#1-a-star-trail-1)
   - [1.1. Mô tả thử thách & Đề bài](#11-mô-tả-thử-thách--đề-bài)
   - [1.2. Mô hình hóa đồ thị từ bản đồ không gian](#12-mô-hình-hóa-đồ-thị-từ-bản-đồ-không-gian)
   - [1.3. Giải thuật tìm đường đi tối ưu (Dijkstra / A*)](#13-giải-thuật-tìm-đường-đi-tối-ưu-dijkstra--a)
   - [1.4. Quy tắc tạo Flag & Phân tích cạm bẫy định dạng](#14-quy-tắc-tạo-flag--phân-tích-cạm-bẫy-định-dạng)
   - [1.5. Mã nguồn khai thác có chú thích (Python)](#15-mã-nguồn-khai-thác-có-chú-thích-python)
   - [1.6. Flag](#16-flag)
2. [A Star Trail 2](#2-a-star-trail-2)
   - [2.1. Mô tả thử thách & Bối cảnh](#21-mô-tả-thử-thách--bối-cảnh)
   - [2.2. Khảo sát dữ liệu 10,000 thiên thể](#22-khảo-sát-dữ-liệu-10000-thiên-thể)
   - [2.3. Mô hình hóa đồ thị hình học tính toán (Delaunay & Voronoi)](#23-mô-hình-hóa-đồ-thị-hình-học-tính-toán-delaunay--voronoi)
   - [2.4. Tìm đường đi ngắn nhất & Quy tắc xoay vòng Modulo 6](#24-tìm-đường-đi-ngắn-nhất--quy-tắc-xoay-vòng-modulo-6)
   - [2.5. Giải mã thông điệp ẩn trong chuỗi Flag](#25-giải-mã-thông-điệp-ẩn-trong-chuỗi-flag)
   - [2.6. Mã nguồn khai thác có chú thích (Python)](#26-mã-nguồn-khai-thác-có-chú-thích-python)
   - [2.7. Flag](#27-flag)
3. [A Star Trail 3](#3-a-star-trail-3)
   - [3.1. Mô tả thử thách & Bối cảnh lỗi hỏng dữ liệu](#31-mô-tả-thử-thách--bối-cảnh-lỗi-hỏng-dữ-liệu)
   - [3.2. Khảo sát dữ liệu 25,000 thiên thể bị mất liên kết ([CORRUPTED])](#32-khảo-sát-dữ-liệu-25000-thiên-thể-bị-mất-liên-kết-corrupted)
   - [3.3. Phân tích gợi ý & Khôi phục đồ thị bằng Phép tam giác hóa Delaunay](#33-phân-tích-gợi-ý--khôi-phục-đồ-thị-bằng-phép-tam-giác-hóa-delaunay)
   - [3.4. Mô hình hóa đồ thị & Tìm đường đi ngắn nhất (Dijkstra)](#34-mô-hình-hóa-đồ-thị--tìm-đường-đi-ngắn-nhất-dijkstra)
   - [3.5. Trích xuất Flag theo quy tắc Modulo 6 & Xác minh tính duy nhất](#35-trích-xuất-flag-theo-quy-tắc-modulo-6--xác-minh-tính-duy-nhất)
   - [3.6. Mã nguồn khai thác có chú thích (Python)](#36-mã-nguồn-khai-thác-có-chú-thích-python-1)
   - [3.7. Flag](#37-flag)
4. [Tổng kết chuỗi thử thách A Star Trail Series](#4-tổng-kết-chuỗi-thử-thách-a-star-trail-series)
5. [The Astrolabe Overwrite (Ouroboros Singularity)](#5-the-astrolabe-overwrite-ouroboros-singularity)
   - [5.1. Mô tả thử thách & Bối cảnh](#51-mô-tả-thử-thách--bối-cảnh)
   - [5.2. Phân tích kiến trúc máy ảo Ouroboros VM (`nexus_core`)](#52-phân-tích-kiến-trúc-máy-ảo-ouroboros-vm-nexus_core)
   - [5.3. Cơ chế tự biến đổi mã lệnh & Bảng hoán vị (The Permutation Field)](#53-cơ-chế-tự-biến-đổi-mã-lệnh--bảng-hoán-vị-the-permutation-field)
   - [5.4. Giải mã 3 tầng kiểm tra (Three Rings of the Astrolabe)](#54-giải-mã-3-tầng-kiểm-tra-three-rings-of-the-astrolabe)
   - [5.5. Mô hình hóa toán học & Thuật toán giải hệ phương trình](#55-mô-hình-hóa-toán-học--thuật-toán-giải-hệ-phương-trình)
   - [5.6. Kỹ thuật xây dựng Payload & Điều phối chu kỳ (Cycle Budgeting)](#56-kỹ-thuật-xây-dựng-payload--điều-phối-chu-kỳ-cycle-budgeting)
   - [5.7. Mã nguồn khai thác hoàn chỉnh (C Solver & Python Exploit)](#57-mã-nguồn-khai-thác-hoàn-chỉnh-c-solver--python-exploit)
   - [5.8. Flag & Tổng kết bài học](#58-flag--tổng-kết-bài-học)

---

## 1. A Star Trail 1

### 1.1. Mô tả thử thách & Đề bài
> *Polaris Logistics has an urgent delivery that needs to be transported across the star system. As the pilot of this V.I.P. (Very Important Package), you need to begin planning your trip from Earth to Lancer-RXKRD immediately. Remember to follow company protocol; you have to follow the designated paths between planet/oids to comply with interplanetary law. If you can’t deliver the V.I.P. in under 25 days, you might as well forget about your end of year bonus.*
>
> *- Polaris Logistics.*
>
> *Submit your flag using the by combining the first character of each planet/oid in your path together and then adding the number of days your path takes (with 1 decimal place) onto the end, separated by a dash. E.g. if your path from A-PLANET TO B-PLANET was PAPA, OSCAR, SIERRA, TANGO, 2025PLANET and took exactly 5 days, the flag would be `CSSCTF{POST2-5.0}`*
>
> **Tài nguyên đính kèm:** Tệp ảnh bản đồ sao `A_Star_Trail.png`.

---

### 1.2. Mô hình hóa đồ thị từ bản đồ không gian

Quan sát kỹ hình ảnh bản đồ sao `A_Star_Trail.png`, ta có:
- **Điểm bắt đầu:** `EARTH` (ở góc dưới bên trái).
- **Điểm kết thúc:** `LANCER-RXKRD` (ở góc trên bên phải).
- **Đồ thị:** Gồm 13 đỉnh và 20 cạnh hai chiều có trọng số là số ngày di chuyển ghi trên từng đường nối đứt đoạn:

| Tuyến đường giữa 2 thiên thể | Thời gian di chuyển (ngày) |
| :--- | :---: |
| `EARTH` $\leftrightarrow$ `BACONITE` | $5.0$ |
| `EARTH` $\leftrightarrow$ `PALLUS-XA` | $10.7$ |
| `BACONITE` $\leftrightarrow$ `C3810-ASQUAX-8` | $2.1$ |
| `BACONITE` $\leftrightarrow$ `BARAT-BARAT` | $9.8$ |
| `C3810-ASQUAX-8` $\leftrightarrow$ `BARAT-BARAT` | $6.3$ |
| `BARAT-BARAT` $\leftrightarrow$ `JIP-REIA` | $1.4$ |
| `BARAT-BARAT` $\leftrightarrow$ `PALLUS-XA` | $1.4$ |
| `PALLUS-XA` $\leftrightarrow$ `12-PUCK-8` | $1.8$ |
| `PALLUS-XA` $\leftrightarrow$ `HEMENS-RAJA-2` | $2.5$ |
| `12-PUCK-8` $\leftrightarrow$ `JIP-REIA` | $0.4$ |
| `12-PUCK-8` $\leftrightarrow$ `HEMENS-RAJA-2` | $3.6$ |
| `JIP-REIA` $\leftrightarrow$ `TAYLOR-3489` | $5.5$ |
| `HEMENS-RAJA-2` $\leftrightarrow$ `TAMMY ASTEROID` | $3.7$ |
| `HEMENS-RAJA-2` $\leftrightarrow$ `10-49-SLATER-4090` | $6.0$ |
| `TAYLOR-3489` $\leftrightarrow$ `TAMMY ASTEROID` | $3.2$ |
| `TAYLOR-3489` $\leftrightarrow$ `LANCER-RXKRD` | $2.6$ |
| `TAMMY ASTEROID` $\leftrightarrow$ `LANCER-RXKRD` | $10.1$ |
| `TAMMY ASTEROID` $\leftrightarrow$ `VERGINON` | $2.8$ |
| `10-49-SLATER-4090` $\leftrightarrow$ `VERGINON` | $7.5$ |
| `VERGINON` $\leftrightarrow$ `LANCER-RXKRD` | $8.5$ |

---

### 1.3. Giải thuật tìm đường đi tối ưu (Dijkstra / A*)

Đề bài yêu cầu: *"deliver the V.I.P. in under 25 days"* (giao kiện hàng dưới 25 ngày). Ta áp dụng thuật toán tìm đường đi ngắn nhất (Dijkstra):

Lộ trình tối ưu tìm được:
$$\text{EARTH} \xrightarrow{10.7} \text{PALLUS-XA} \xrightarrow{1.8} \text{12-PUCK-8} \xrightarrow{0.4} \text{JIP-REIA} \xrightarrow{5.5} \text{TAYLOR-3489} \xrightarrow{2.6} \text{LANCER-RXKRD}$$

**Tổng thời gian hành trình:**
$$10.7 + 1.8 + 0.4 + 5.5 + 2.6 = \mathbf{21.0 \text{ ngày}}$$

*(Thời gian 21.0 ngày là đường đi ngắn nhất trong toàn bộ mạng lưới và thỏa mãn điều kiện $< 25$ ngày).*

---

### 1.4. Quy tắc tạo Flag & Phân tích cạm bẫy định dạng

Cụm từ *"your path from Earth to Lancer-RXKRD"* được tác giả quy ước là **các trạm dừng trung gian (waypoints)** nằm giữa điểm xuất phát `Earth` và đích đến `Lancer-RXKRD`:
- **P**ALLUS-XA $\rightarrow$ Lấy ký tự `P`
- **1**2-PUCK-8 $\rightarrow$ Lấy ký tự `1`
- **J**IP-REIA $\rightarrow$ Lấy ký tự `J`
- **T**AYLOR-3489 $\rightarrow$ Lấy ký tự `T`

Ghép các ký tự trạm trung gian: `P1JT`  
Thêm số ngày với 1 chữ số thập phân: `-21.0`  
$\implies$ Flag chuẩn: **`CSSCTF{P1JT-21.0}`**

*(Lưu ý: Nếu tính cả điểm đầu Earth và điểm cuối Lancer-RXKRD thì chuỗi là EP1JTL, tuy nhiên hệ thống chấm điểm của bài này chỉ chấp nhận các trạm dừng trung gian `P1JT-21.0`).*

---

### 1.5. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""A Star Trail 1 Solution Script

Mục đích: Xây dựng đồ thị mạng lưới hành tinh từ bản đồ sao và sử dụng
thuật toán Dijkstra để tìm hành trình ngắn nhất dưới 25 ngày.
"""

import networkx as nx

# Danh sách tất cả các cạnh (tuyến đường) và trọng số (số ngày) trích xuất từ ảnh
edges = [
    # Tuyến xuất phát từ Earth
    ("EARTH", "BACONITE", 5.0),
    ("EARTH", "PALLUS-XA", 10.7),
    # Tuyến từ Baconite & C3810
    ("BACONITE", "C3810-ASQUAX-8", 2.1),
    ("BACONITE", "BARAT-BARAT", 9.8),
    ("C3810-ASQUAX-8", "BARAT-BARAT", 6.3),
    # Tuyến từ Barat-Barat & Pallus-XA
    ("BARAT-BARAT", "JIP-REIA", 1.4),
    ("BARAT-BARAT", "PALLUS-XA", 1.4),
    ("PALLUS-XA", "12-PUCK-8", 1.8),
    ("PALLUS-XA", "HEMENS-RAJA-2", 2.5),
    # Tuyến từ 12-Puck-8 & Jip-Reia
    ("JIP-REIA", "12-PUCK-8", 0.4),
    ("JIP-REIA", "TAYLOR-3489", 5.5),
    ("12-PUCK-8", "HEMENS-RAJA-2", 3.6),
    # Tuyến từ Hemens-Raja-2
    ("HEMENS-RAJA-2", "TAMMY ASTEROID", 3.7),
    ("HEMENS-RAJA-2", "10-49-SLATER-4090", 6.0),
    # Tuyến tới đích Lancer-RXKRD
    ("TAYLOR-3489", "TAMMY ASTEROID", 3.2),
    ("TAYLOR-3489", "LANCER-RXKRD", 2.6),
    ("TAMMY ASTEROID", "LANCER-RXKRD", 10.1),
    ("TAMMY ASTEROID", "VERGINON", 2.8),
    ("10-49-SLATER-4090", "VERGINON", 7.5),
    ("VERGINON", "LANCER-RXKRD", 8.5),
]

# Khởi tạo đồ thị vô hướng
G = nx.Graph()
for u, v, w in edges:
  G.add_edge(u, v, weight=w)

# Tìm đường đi ngắn nhất bằng thuật toán Dijkstra
path = nx.shortest_path(
    G, source="EARTH", target="LANCER-RXKRD", weight="weight"
)
total_days = nx.shortest_path_length(
    G, source="EARTH", target="LANCER-RXKRD", weight="weight"
)

# In chi tiết lộ trình
print("[+] Lộ trình tối ưu:", " -> ".join(path))
print(f"[+] Tổng thời gian: {total_days:.1f} ngày")

# Lấy ký tự đầu của các trạm trung gian (bỏ qua điểm đầu EARTH và điểm cuối LANCER-RXKRD)
intermediate_nodes = path[1:-1]
waypoint_chars = "".join(node[0] for node in intermediate_nodes)

# Định dạng cờ: CSSCTF{WAYPOINTS-DAYS}
flag = f"CSSCTF{{{waypoint_chars}-{total_days:.1f}}}"
print(f"[+] Flag chính xác: {flag}")
```

### 1.6. Flag
$$\mathbf{CSSCTF\{P1JT-21.0\}}$$

---

## 2. A Star Trail 2

### 2.1. Mô tả thử thách & Bối cảnh
> *Congrats on your first, successful delivery cadet! Now that you've got a small taste of logistics and routing, take a gander at this larger galactic map. You've got quite a few more stops this time but thankfully, you won't have to be put to cryosleep now that you've gained your lightspeed vehicle licence. Today, your task is to make it from planetary body `S0jRxc` to planetary body `yRJyDb`. Chart out a path and don't be late; we expect you to make it there in a reasonable time. You'll have to do a bit of work to make sense of everything since our database is stored as Markdown files where each planet links to its neighbours with a wikilink but it should be easy work once you get used to it.*
>
> *Report to command your flightpath by taking the first letter of the ID of your first stop (S0jRxc), the second letter of your second stop, the third letter of your third stop, and so on, wrapping back around to the first letter on your 7th, 13th, 19th, etc. stop. Your flightpath flag is case sensitive. For example: if your path from ASTART to ZFINAL was BCDEFG, hijklm, NOPQRS, tuvwxy, ZFINAL the flag would be CSSCTF{ACjQxL}*
>
> *- Polaris Logistics.*
>
> **Tài nguyên đính kèm:** Thư mục `map` chứa 10,000 tệp tin Markdown.

---

### 2.2. Khảo sát dữ liệu 10,000 thiên thể

Thư mục `E:\CSSCTF\map` chứa đúng **10,000 file `.md`**, mỗi file đại diện cho một thiên thể có mã định danh gồm 6 ký tự chữ và số.

Cấu trúc chuẩn của mỗi tệp Markdown:
```markdown
# S0jRxc

Coords: 1.937346, 1.274873

[[1T5eN4]]
[[1T5WDS]]
[[SwjzJx]]
[[NygbEQ]]
[[L4649b]]
```
- Dòng tiêu đề: ID hành tinh (`S0jRxc`).
- `Coords: X, Y`: Tọa độ thực trên không gian 2 chiều $[0, 100] \times [0, 100]$.
- Các dòng `[[...]]`: Danh sách các hành tinh lân cận kết nối trực tiếp (dạng Wikilink).

---

### 2.3. Mô hình hóa đồ thị hình học tính toán (Delaunay & Voronoi)

1. **Khảo sát đặc tính đồ thị:**
   - 10,000 điểm phân bố trên mặt phẳng 2D.
   - Các cạnh liên kết giữa các điểm chính là một **lưới tam giác Delaunay (Delaunay Triangulation)**.
2. **Điểm xuất phát và Đích đến:**
   - Xuất phát: `S0jRxc` tại tọa độ $(1.937346, 1.274873)$ (nằm ở góc dưới bên trái).
   - Đích đến: `yRJyDb` tại tọa độ $(99.893125, 99.361715)$ (nằm ở góc trên bên phải).
   - Khoảng cách đường thẳng chim bay (Euclidean distance):
     $$D_{\text{straight}} = \sqrt{(99.89 - 1.94)^2 + (99.36 - 1.27)^2} \approx 138.62$$
3. **Trọng số cạnh:**
   - Khi di chuyển bằng phi thuyền ánh sáng giữa 2 thiên thể $u(x_u, y_u)$ và $v(x_v, y_v)$, chi phí di chuyển chính là khoảng cách Euclid:
     $$w(u, v) = \sqrt{(x_u - x_v)^2 + (y_u - y_v)^2}$$

---

### 2.4. Tìm đường đi ngắn nhất & Quy tắc xoay vòng Modulo 6

1. **Thuật toán tìm kiếm (A\* / Dijkstra):**
   - Với đồ thị trọng số Euclid, thuật toán **Dijkstra** (hoặc **A\*** với hàm heuristic là khoảng cách Euclid đến đích) tìm ra đường đi ngắn nhất bao gồm đúng **136 điểm dừng** (135 bước nhảy) với tổng độ dài đường đi xấp xỉ **$144.93$** (bám sát đường thẳng lý tưởng $138.62$).
2. **Quy tắc trích xuất ký tự cờ (Modulo 6 Indexing):**
   - Đề bài hướng dẫn:
     - Điểm thứ 1 ($i=0$): lấy ký tự thứ 1 (chỉ số 0).
     - Điểm thứ 2 ($i=1$): lấy ký tự thứ 2 (chỉ số 1).
     - Điểm thứ 3 ($i=2$): lấy ký tự thứ 3 (chỉ số 2).
     - Điểm thứ 4 ($i=3$): lấy ký tự thứ 4 (chỉ số 3).
     - Điểm thứ 5 ($i=4$): lấy ký tự thứ 5 (chỉ số 4).
     - Điểm thứ 6 ($i=5$): lấy ký tự thứ 6 (chỉ số 5).
     - Điểm thứ 7 ($i=6$): xoay vòng lại chỉ số 0 ($6 \pmod 6 = 0$).
     - Điểm thứ 13 ($i=12$): xoay vòng lại chỉ số 0 ($12 \pmod 6 = 0$).
   - Công thức tổng quát cho điểm dừng thứ $i$ ($i \in [0, 135]$):
     $$\text{Char}_i = \text{NodeID}_i[i \pmod 6]$$

---

### 2.5. Giải mã thông điệp ẩn trong chuỗi Flag

Sau khi ghép toàn bộ 136 ký tự, ta nhận được một chuỗi ký tự phân biệt hoa thường mang ý nghĩa học thuật tuyệt đối:

```text
STARmaPdElAUNaYTriaNGulATioNDIjKStrAVoRonoiGrAPHSdetERmiNaNTcolineaRALGOrITHmSLeEandsCHAcHTERTANgEnTSmErGECirCuMcIrcLEcOnVEXhuLLgeOMeTRy
```

Tách các từ trong chuỗi để thấy toàn bộ kiến trúc mà tác giả đã xây dựng cho bài toán:
- `STAR` `maP`: Bản đồ sao
- `dElAUNaY` `TriaNGulATioN`: Phép tam giác giác hóa Delaunay (Delaunay Triangulation)
- `DIjKStrA`: Thuật toán tìm đường đi ngắn nhất Dijkstra
- `VoRonoi` `GrAPHS`: Đồ thị Voronoi (đối ngẫu của tam giác Delaunay)
- `detERmiNaNT`: Định thức (Determinant, dùng để kiểm tra một điểm có nằm trong đường tròn ngoại tiếp hay không)
- `colineaR`: Điểm đồng tuyến
- `ALGOrITHmS`: Các giải thuật
- `LeEandsCHAcHTER`: Thuật toán chia để trị kinh điển Lee & Schachter (1980) dùng để tạo đồ thị Delaunay
- `TANgEnTS`: Tiếp tuyến chung giữa hai nửa đồ thị
- `mErGE`: Bước hợp nhất (Merge step) trong giải thuật chia để trị
- `CirCuMcIrcLE`: Đường tròn ngoại tiếp tam giác Delaunay
- `cOnVEXhuLL`: Bao lồi của tập điểm
- `geOMeTRy`: Hình học tính toán (Computational Geometry)

---

### 2.6. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""A Star Trail 2 Solution Script

Mục đích: Tự động phân tích 10,000 tệp Markdown, xây dựng đồ thị Delaunay
có trọng số Euclid và tìm đường đi tối ưu Dijkstra để tạo Flag 136 ký tự.
"""

import math
import os
import re
import networkx as nx

# Đường dẫn thư mục chứa 10,000 tệp Markdown
map_dir = r"E:\CSSCTF\map"

coords = {}  # Lưu tọa độ 2D của mỗi hành tinh: coords[node_id] = (x, y)
adj = {}  # Lưu danh sách đỉnh kề của mỗi hành tinh: adj[node_id] = [neighbor_ids...]

print("[*] Đang đọc và bóc tách dữ liệu từ 10,000 tệp Markdown...")
for f in os.listdir(map_dir):
  if f.endswith(".md"):
    node = f[:-3]  # Lấy tên file bỏ đuôi .md làm ID thiên thể
    file_path = os.path.join(map_dir, f)

    with open(file_path, "r", encoding="utf-8") as fp:
      content = fp.read()

    # Bóc tách tọa độ: Coords: x, y
    coord_match = re.search(r"Coords:\s*([0-9.]+),\s*([0-9.]+)", content)
    if coord_match:
      coords[node] = (float(coord_match.group(1)), float(coord_match.group(2)))

    # Bóc tách các liên kết Wikilink: [[Neighbor]]
    neighbors = re.findall(r"\[\[(.*?)\]\]", content)
    adj[node] = neighbors

print(f"[+] Đã bóc tách thành công {len(coords)} đỉnh và hệ thống liên kết.")

# Xây dựng đồ thị vô hướng có trọng số Euclid
print("[*] Đang thiết lập đồ thị hình học tính toán...")
G = nx.Graph()
for u, nbrs in adj.items():
  for v in nbrs:
    if u in coords and v in coords:
      # Tính khoảng cách Euclid giữa u và v
      dist = math.hypot(
          coords[u][0] - coords[v][0], coords[u][1] - coords[v][1]
      )
      G.add_edge(u, v, weight=dist)

# Xác định điểm xuất phát và điểm đích
start_node = "S0jRxc"
target_node = "yRJyDb"

print(
    f"[*] Đang thực thi thuật toán Dijkstra từ {start_node} đến {target_node}..."
)
path = nx.shortest_path(
    G, source=start_node, target=target_node, weight="weight"
)
path_dist = nx.shortest_path_length(
    G, source=start_node, target=target_node, weight="weight"
)

print(f"[+] Tìm thấy hành trình tối ưu gồm {len(path)} trạm dừng.")
print(f"[+] Tổng quãng đường Euclid: {path_dist:.4f}")

# Trích xuất ký tự cờ theo quy tắc Modulo 6: char = node[i % 6]
flag_chars = []
for i, node in enumerate(path):
  char_idx = i % 6
  flag_chars.append(node[char_idx])

flag = f"CSSCTF{{{''.join(flag_chars)}}}"
print(f"[+] Flag chính xác (136 ký tự): {flag}")
```

### 2.7. Flag
$$\mathbf{CSSCTF\{STARmaPdElAUNaYTriaNGulATioNDIjKStrAVoRonoiGrAPHSdetERmiNaNTcolineaRALGOrITHmSLeEandsCHAcHTERTANgEnTSmErGECirCuMcIrcLEcOnVEXhuLLgeOMeTRy\}}$$

---

## 3. A Star Trail 3

### 3.1. Mô tả thử thách & Bối cảnh lỗi hỏng dữ liệu
> *Polaris Logistics has seemingly had a database corruption in the star maps of Sector-A89J3. With routing and deliveries unable to be completed for the foreseeable future, you, cadet, have been tasked with fixing this problem. Otherwise, you can consider yourself fired. Thankfully, all of the planetary body entries are still there, only their paths to neighbouring bodies have been destroyed. We can't seem to remember what rule we used to generate our routes but you can presumably find patterns in your previous postal appointments. Once you've got those records restored, get a move on with the next delivery from iJ2ZcO to pJk9vy to prove it.*
>
> *Report to command your flightpath by taking the first letter of the ID of your first stop (iJ2ZcO), the second letter of your second stop, the third letter of your third stop, and so on, wrapping back around to the first letter on your 7th, 13th, 19th, etc. stop. Your flightpath flag is case sensitive. For example: if your path from ASTART to ZFINAL was BCDEFG, hijklm, NOPQRS, tuvwxy, ZFINAL the flag would be CSSCTF{ACjQxL}. (The flag for this challenge may not be easily recognisable)*
>
> *- Polaris Logistics.*
>
> **Tài nguyên đính kèm:** Tệp lưu trữ `map2.zip` giải nén ra thư mục `map/` chứa 25,000 tệp tin Markdown.

**Tóm tắt yêu cầu & Thách thức cốt lõi:**
1. Cơ sở dữ liệu bản đồ sao của Sector-A89J3 bị sự cố hỏng hóc (corruption). Toàn bộ danh sách liên kết giữa các thiên thể đã bị xóa sạch và thay bằng chuỗi `[CORRUPTED]`.
2. Dữ liệu thiên thể (tên ID và tọa độ không gian 2D) vẫn còn nguyên vẹn.
3. Người chơi phải tìm ra quy luật kiến tạo đồ thị (routing rule) từ "các lần phân công giao hàng trước" (tức là A Star Trail 2) để tự tái cấu trúc lại toàn bộ các tuyến đường bay trong hệ sao.
4. Sau khi khôi phục mạng lưới, lập trình tìm đường đi ngắn nhất từ trạm xuất phát `iJ2ZcO` đến trạm đích `pJk9vy`.
5. Tạo chuỗi Flag theo quy tắc dịch chuyển vòng lặp Modulo 6: Trạm 1 lấy ký tự 1, Trạm 2 lấy ký tự 2, ..., Trạm 7 quay lại ký tự 1.
6. Lưu ý cạm bẫy: Đề bài cảnh báo *(The flag for this challenge may not be easily recognisable)* – nghĩa là cờ sẽ không phải là các từ tiếng Anh có nghĩa ghép lại như ở bài 2, mà là một chuỗi ngẫu nhiên/hash phân biệt hoa thường.

---

### 3.2. Khảo sát dữ liệu 25,000 thiên thể bị mất liên kết ([CORRUPTED])

Kiểm tra thư mục `map2/map`, ta thấy có đúng **25,000 tệp `.md`** tương ứng với 25,000 hành tinh/tiểu hành tinh trong Sector-A89J3.

Cấu trúc của các tệp Markdown trong bài 3 đã bị biến đổi so với bài 2:
```markdown
# iJ2ZcO

Coords: 0.347730, 97.041287


[CORRUPTED]
```

- **Mã định danh:** Chuỗi 6 ký tự gồm chữ và số (ví dụ: `iJ2ZcO`, `pJk9vy`).
- **Tọa độ không gian:** `Coords: X, Y` phân bố trên mặt phẳng 2D trong phạm vi $[0, 100] \times [0, 100]$.
- **Dữ liệu cạnh kề:** Toàn bộ phần danh sách láng giềng `[[...]]` trước đây đã bị thay thế hoàn toàn bởi nhãn `[CORRUPTED]`.

---

### 3.3. Phân tích gợi ý & Khôi phục đồ thị bằng Phép tam giác hóa Delaunay

#### 3.3.1. Truy vết quy tắc từ A Star Trail 2
Cụm từ gợi ý quan trọng nhất trong đề bài:
> *"We can't seem to remember what rule we used to generate our routes but you can presumably find patterns in your previous postal appointments."*

Nhìn lại kết quả giải mã Flag của **A Star Trail 2**:
```text
STARmaPdElAUNaYTriaNGulATioNDIjKStrAVoRonoiGrAPHSdetERmiNaNTcolineaRALGOrITHmSLeEandsCHAcHTERTANgEnTSmErGECirCuMcIrcLEcOnVEXhuLLgeOMeTRy
```
Các từ khóa trong flag:
- `dElAUNaY TriaNGulATioN`: Phép tam giác hóa Delaunay
- `VoRonoi GrAPHS`: Đồ thị Voronoi (đồ thị đối ngẫu)
- `detERmiNaNT colineaR`: Kiểm tra tính đồng tuyến bằng định thức
- `LeEandsCHAcHTER`: Thuật toán chia để trị kinh điển Lee & Schachter (1980) dùng để dựng tam giác Delaunay trong thời gian $\mathcal{O}(N \log N)$
- `CirCuMcIrcLE cOnVEXhuLL geOMeTRy`: Đường tròn ngoại tiếp, bao lồi và hình học tính toán

#### 3.3.2. Thực nghiệm đối chiếu tính tương đồng (Proof of Consistency)
Để chứng minh 100% giả thuyết rằng mạng lưới đường bay của Polaris Logistics luôn được sinh bằng **Delaunay Triangulation**, ta tiến hành chạy kiểm thử độc lập trên tập 10,000 điểm của bài 2:
- Số cạnh có sẵn trong đề bài 2: $29,972$ cạnh.
- Số cạnh tạo bởi `scipy.spatial.Delaunay`: $29,972$ cạnh.
- Độ giao nhau giữa 2 tập cạnh: $29,972$ cạnh.
- Độ lệch (Difference): $0$ cạnh ($\text{orig} - \text{delaunay} = \emptyset$ và $\text{delaunay} - \text{orig} = \emptyset$).

$\implies$ **Kết luận:** Quy luật thiết kế các tuyến đường bay trong toàn bộ vũ trụ của Polaris Logistics chính là **Phép tam giác hóa Delaunay (Delaunay Triangulation)** dựa trên khoảng cách mặt phẳng 2D.

#### 3.3.3. Cơ sở toán học của Phép tam giác hóa Delaunay
Cho tập hợp $P = \{p_1, p_2, \dots, p_n\}$ gồm $n$ điểm trên mặt phẳng $\mathbb{R}^2$:
1. **Điều kiện đường tròn rỗng (Empty Circumcircle Property):** Tam giác $\Delta(p_i, p_j, p_k)$ thuộc phép tam giác hóa Delaunay khi và chỉ khi không tồn tại bất kỳ điểm $p_m \in P$ nào nằm bên trong đường tròn ngoại tiếp của tam giác đó:
   $$\det \begin{pmatrix} x_i & y_i & x_i^2 + y_i^2 & 1 \\ x_j & y_j & x_j^2 + y_j^2 & 1 \\ x_k & y_k & x_k^2 + y_k^2 & 1 \\ x_m & y_m & x_m^2 + y_m^2 & 1 \end{pmatrix} \le 0$$
2. **Tính chất cực đại hóa góc nhỏ nhất (Max-Min Angle Property):** Lưới Delaunay tối ưu hóa góc nhỏ nhất trong toàn bộ các tam giác, triệt tiêu tối đa các tam giác quá nhọn/dẹt ("sliver triangles"). Điều này tạo nên mạng lưới kết nối giữa các thiên thể láng giềng gần nhau nhất về mặt vật lý, mô phỏng tuyến vận tải liên hành tinh tự nhiên và tiết kiệm năng lượng nhất.

---

### 3.4. Mô hình hóa đồ thị & Tìm đường đi ngắn nhất (Dijkstra)

#### 3.4.1. Thông số mô hình hóa
Áp dụng giải thuật Delaunay từ thư viện `scipy.spatial.Delaunay` lên 25,000 điểm:
- **Số đỉnh ($|V|$):** $25,000$ thiên thể.
- **Số cạnh được tái tạo ($|E|$):** $74,970$ tuyến bay hai chiều vô hướng.
- **Trọng số cạnh ($w(u, v)$):** Khoảng cách Euclid thực tế giữa 2 thiên thể $u(x_u, y_u)$ và $v(x_v, y_v)$:
  $$w(u, v) = \sqrt{(x_u - x_v)^2 + (y_u - y_v)^2}$$

#### 3.4.2. Vị trí trạm xuất phát và đích đến
- Trạm xuất phát: `iJ2ZcO` tại $(0.347730, 97.041287)$ (vị trí gần góc trên bên trái).
- Trạm đích: `pJk9vy` tại $(99.781280, 0.935324)$ (vị trí gần góc dưới bên phải).
- Khoảng cách hình học đường thẳng lý tưởng (Euclidean Lower Bound):
  $$D_{\text{straight}} = \sqrt{(99.781280 - 0.347730)^2 + (0.935324 - 97.041287)^2} \approx 138.2713$$

#### 3.4.3. Kết quả tìm đường Dijkstra
Sử dụng thuật toán **Dijkstra** trên đồ thị có trọng số `G_weighted`:
- **Số trạm dừng trong hành trình tối ưu:** $196$ trạm ($195$ chặng bay).
- **Tổng quãng đường di chuyển:** $\mathbf{144.047367}$.
- **Độ dôi đường bay (Stretch Factor):**
  $$\frac{D_{\text{Dijkstra}}}{D_{\text{straight}}} = \frac{144.047367}{138.2713} \approx 1.0418$$
  Độ dài chỉ dôi ra vỏn vẹn $\approx 4.18\%$ so với đường thẳng tuyệt đối, minh chứng cho tính chất bám sát đường thẳng hình học cực kỳ tối ưu của mạng lưới Delaunay.

---

### 3.5. Trích xuất Flag theo quy tắc Modulo 6 & Xác minh tính duy nhất

#### 3.5.1. Quy tắc trích xuất ký tự
Đề bài quy định trích xuất ký tự từ ID trạm dừng theo chu kỳ xoay vòng 6 vị trí:
$$\text{Char}_i = \text{NodeID}_i[i \pmod 6], \quad \forall i \in \{0, 1, 2, \dots, 195\}$$

Chi tiết các trạm dừng tiêu biểu:
- **Trạm 1** ($i = 0$): `iJ2ZcO` $\rightarrow$ Chỉ số $0 \pmod 6 = 0 \implies \mathbf{i}$
- **Trạm 2** ($i = 1$): `gtHQlo` $\rightarrow$ Chỉ số $1 \pmod 6 = 1 \implies \mathbf{t}$
- **Trạm 3** ($i = 2$): `c4rFDK` $\rightarrow$ Chỉ số $2 \pmod 6 = 2 \implies \mathbf{r}$
- **Trạm 4** ($i = 3$): `7Yw6HF` $\rightarrow$ Chỉ số $3 \pmod 6 = 3 \implies \mathbf{6}$
- **Trạm 5** ($i = 4$): `Rvn5GS` $\rightarrow$ Chỉ số $4 \pmod 6 = 4 \implies \mathbf{G}$
- **Trạm 6** ($i = 5$): `ZvaZ98` $\rightarrow$ Chỉ số $5 \pmod 6 = 5 \implies \mathbf{8}$
- **Trạm 7** ($i = 6$): `jXhE4Y` $\rightarrow$ Chỉ số $6 \pmod 6 = 0 \implies \mathbf{j}$ *(quay lại chỉ số 0)*
- ...
- **Trạm 195** ($i = 194$): `hcoXhZ` $\rightarrow$ Chỉ số $194 \pmod 6 = 2 \implies \mathbf{o}$
- **Trạm 196** ($i = 195$): `pJk9vy` $\rightarrow$ Chỉ số $195 \pmod 6 = 3 \implies \mathbf{9}$

Ghép toàn bộ 196 ký tự lại ta được chuỗi 196 ký tự phân biệt hoa thường bắt đầu bằng `itr6G8...` và kết thúc bằng `...peo9`.

#### 3.5.2. Xác minh tính duy nhất của nghiệm (Uniqueness Verification)
Để đảm bảo không xảy ra hiện tượng có nhiều đường đi có cùng độ dài (ties) dẫn đến nhiều Flag khác nhau, ta kiểm tra bằng hàm `nx.all_shortest_paths(G, source='iJ2ZcO', target='pJk9vy', weight='weight')`:
- Kết quả trả về: Đúng **1 đường đi duy nhất** (Unique Path).
- Lý do: Tọa độ là các số thực dấu phẩy động 6 chữ số thập phân (`float64`), do đó xác suất để hai đường đi khác nhau có tổng khoảng cách Euclid bằng nhau đến từng bit là xấp xỉ bằng $0$.

---

### 3.6. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""
A Star Trail 3 Solution Script

Mục đích:
1. Bóc tách dữ liệu 25,000 thiên thể có liên kết bị lỗi [CORRUPTED].
2. Tái tạo mạng lưới giao thông không gian bằng Phép tam giác hóa Delaunay.
3. Tìm đường đi ngắn nhất duy nhất từ 'iJ2ZcO' đến 'pJk9vy' bằng thuật toán Dijkstra.
4. Trích xuất Flag 196 ký tự theo quy tắc xoay vòng chỉ số Modulo 6.
"""

import os
import re
import math
import numpy as np
from scipy.spatial import Delaunay
import networkx as nx

# Đường dẫn thư mục chứa 25,000 tệp Markdown
map_dir = r"E:\CSSCTF\map2\map"
coords = {}

print("[*] Đang đọc tọa độ từ 25,000 tệp Markdown...")
for f in os.listdir(map_dir):
    if f.endswith(".md"):
        node = f[:-3]
        with open(os.path.join(map_dir, f), "r", encoding="utf-8") as fp:
            text = fp.read()
        coord_match = re.search(r"Coords:\s*([0-9.]+),\s*([0-9.]+)", text)
        if coord_match:
            coords[node] = (float(coord_match.group(1)), float(coord_match.group(2)))

print(f"[+] Đã tải thành công {len(coords)} thiên thể vào bộ nhớ.")

start_node = "iJ2ZcO"
end_node = "pJk9vy"

print(f"[*] Điểm xuất phát: {start_node} -> {coords.get(start_node)}")
print(f"[*] Điểm kết thúc:  {end_node} -> {coords.get(end_node)}")

# Chuyển đổi danh sách tọa độ sang mảng NumPy 2D
nodes = list(coords.keys())
points = np.array([coords[n] for n in nodes])

# Tái tạo mạng lưới đồ thị bằng Delaunay Triangulation
print("[*] Đang thực hiện phép tam giác hóa Delaunay (Scipy Delaunay)...")
tri = Delaunay(points)

# Xây dựng đồ thị vô hướng có trọng số khoảng cách Euclid
print("[*] Đang khởi tạo đồ thị NetworkX và gán trọng số khoảng cách Euclid...")
G = nx.Graph()
for simplex in tri.simplices:
    for i in range(3):
        for j in range(i + 1, 3):
            u = nodes[simplex[i]]
            v = nodes[simplex[j]]
            dist = math.hypot(coords[u][0] - coords[v][0], coords[u][1] - coords[v][1])
            G.add_edge(u, v, weight=dist)

print(f"[+] Đồ thị Delaunay hoàn tất: {G.number_of_nodes()} đỉnh, {G.number_of_edges()} cạnh.")

# Tìm kiếm lộ trình tối ưu bằng thuật toán Dijkstra
print(f"[*] Đang thực thi thuật toán Dijkstra tìm đường đi từ {start_node} đến {end_node}...")
path = nx.shortest_path(G, source=start_node, target=end_node, weight="weight")
path_dist = nx.shortest_path_length(G, source=start_node, target=end_node, weight="weight")

print(f"[+] Lộ trình tối ưu gồm {len(path)} trạm dừng.")
print(f"[+] Tổng khoảng cách Euclid: {path_dist:.6f}")

# Trích xuất chuỗi ký tự theo quy tắc Modulo 6: char = node[i % 6]
flag_chars = []
for i, node in enumerate(path):
    char_idx = i % 6
    flag_chars.append(node[char_idx])

flag_str = "".join(flag_chars)
flag = f"CSSCTF{{{flag_str}}}"

print("\n" + "=" * 80)
print(f"[+] FLAG CHÍNH XÁC:\n{flag}")
print("=" * 80)
```

---

### 3.7. Flag
$$\mathbf{CSSCTF\{itr6G8jMTXbOjCmClmMElZxQLqSXqnf53z1Z73liVas3ypn5CJZ4ZGlqZo6Fkc2onoJ6vx5SLfqqEyBotfjpxskQknpUgK9VMfBsFqzc0iEHDbMvv1hwXAo4U1NaimtTt9esb6mskMdUkbgBAjg3TTS1UeTSvf7LFZR0Vxf8KOgkzxHmvO0ifOFaVnwNgwUqpeo9\}}$$

---

## 4. Tổng kết chuỗi thử thách A Star Trail Series

| Tiêu chí | A Star Trail 1 | A Star Trail 2 | A Star Trail 3 |
| :--- | :--- | :--- | :--- |
| **Quy mô đồ thị** | Nhỏ (13 đỉnh, 20 cạnh vẽ tay) | Lớn (10,000 đỉnh, 29,972 cạnh) | Rất lớn (25,000 đỉnh, 74,970 cạnh) |
| **Trạng thái liên kết** | Có sẵn số ngày trên ảnh sơ đồ | Có sẵn danh sách Wikilink `[[...]]` | Bị xóa hỏng hoàn toàn (`[CORRUPTED]`) |
| **Phương thức khôi phục** | Đọc thủ công từ hình ảnh | Trích xuất Regex từ file Markdown | **Phép tam giác hóa Delaunay** từ tọa độ 2D |
| **Trọng số cạnh** | Thời gian bay (ngày) ghi trực tiếp | Khoảng cách hình học Euclid | Khoảng cách hình học Euclid |
| **Thuật toán tìm đường** | Dijkstra trên đồ thị nhỏ | Dijkstra / A* trên đồ thị 10,000 đỉnh | Dijkstra trên đồ thị Delaunay 25,000 đỉnh |
| **Quy tắc tạo Flag** | Ký tự đầu của các trạm trung gian + thời gian | Modulo 6 trên tất cả trạm (ghép thành thông điệp tiếng Anh) | Modulo 6 trên tất cả trạm (chuỗi ngẫu nhiên 196 ký tự) |

**Bài học rút ra:**
1. **Liên kết kiến thức chuỗi bài (Series Correlation):** Trong các giải CTF, các thử thách cùng một chuỗi (như Phần 1 $\to$ Phần 2 $\to$ Phần 3) luôn có tính kế thừa logic rất chặt chẽ. Thông điệp được giải mã trong Flag của bài 2 chính là chìa khóa lý thuyết để khôi phục cấu trúc dữ liệu bị phá hủy trong bài 3.
2. **Hình học tính toán (Computational Geometry) trong an toàn thông tin:** Khái niệm tam giác hóa Delaunay và đồ thị Voronoi không chỉ dùng trong đồ họa máy tính, mà còn xuất hiện trong thiết kế mạng lưới cảm biến không dây (WSN), tối ưu hóa định tuyến mạng và các bài toán MISC/Crypto hiện đại.
3. **Hiệu năng xử lý dữ liệu lớn (Big Data Performance):** Sử dụng các cấu trúc dữ liệu mảng vector hóa của `numpy` và thuật toán Delaunay $\mathcal{O}(N \log N)$ của thư viện `scipy` cho phép xử lý 25,000 điểm và dựng gần 75,000 cạnh chỉ trong chưa đầy 1 giây, thay vì duyệt vét cạn $\mathcal{O}(N^3)$ hoặc $\mathcal{O}(N^4)$.
4. **Kiểm chứng tính duy nhất của lời giải:** Đối với các bài toán tìm đường đi trên đồ thị lớn có thể sinh Flag dài hàng trăm ký tự, việc luôn kiểm tra số lượng đường đi ngắn nhất (`nx.all_shortest_paths`) giúp loại bỏ mọi rủi ro về nghiệm mơ hồ trước khi nộp cờ lên hệ thống chấm điểm.
---

## 5. The Astrolabe Overwrite (Ouroboros Singularity)

### 5.1. Mô tả thử thách & Bối cảnh

> **Mô tả đề bài:**  
> *When "The Severance" hit in 2100, the Kuiper Relay wasn't abandoned. Instead, it was locked into a loop governed by the Council. To prevent manual takeover, the council's instruction consumes and rewrites its own memory.*  
>  
> *To force an administrative override, your payload must achieve harmonic resonance across the three rings of the Astrolabe:*  
>  
> - *Unravel the permutation field of the first gate.*  
> - *Stabilize the coupled wave recurrence across the lattice.*  
> - *Lock onto the projective coordinates of the orbital horizon.*  
>  
> *The telemetry receiver requires exact synchronization with the beacon and will purge the core if total execution falls outside the quantum decay window.*  
>  
> **Flag Format:** `CSSCTF{...}`  
> **Server:** `nc 34.116.80.78 7654`  
> **Tài nguyên đính kèm:** Tệp nén chứa `nexus_core`, `Dockerfile`, `flag.txt`.

#### Bối cảnh & Phân tích gợi ý
Đề bài cung cấp một kịch bản khoa học viễn tưởng chứa đựng các gợi ý kỹ thuật cốt lõi:
1. *"The council's instruction consumes and rewrites its own memory"*: Máy ảo (Custom VM) sử dụng cơ chế tự biến đổi mã lệnh (Self-modifying / Permutation state update).
2. *"Three rings of the Astrolabe"*: Chương trình có 3 tầng xác thực toán học/logic:
   - **Tầng 1 (The first gate):** Trường hoán vị mã lệnh (Permutation field).
   - **Tầng 2 (The lattice):** Hệ phương trình sóng liên kết tuần hoàn (Coupled wave recurrence trên circular lattice).
   - **Tầng 3 (The orbital horizon):** Tọa độ xạ ảnh / Đường cong Elliptic (Projective coordinates on Elliptic Curve).
3. *"Quantum decay window"*: Ràng buộc nghiêm ngặt về số chu kỳ thực thi (Execution cycle budget).

---

### 5.2. Phân tích kiến trúc máy ảo Ouroboros VM (`nexus_core`)

#### Khảo sát nhị phân (Binary Reconnaissance)
Kiểm tra file thực thi `nexus_core`:
```bash
$ file nexus_core
nexus_core: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, stripped
```

Trích xuất các chuỗi ký tự thông báo bằng `strings`:
```text
[!] COHERENCE FAULT: Quantum state cold (cycles < 112).
[!] THERMAL DETONATION: Core runaway (cycles > 128).
[!] HARMONIC FAULT: Astrolabe rings desynchronized.
[+] TELEMETRY STABILIZED. OVERWRITING SYSTEM MASTER KEY...
[!] SYSTEM FAULT: flag.txt missing.
[!] ILLEGAL INSTRUCTION: Core purged.
[!] THERMAL DETONATION: Cycle budget breached.
=== SECTOR 00: OUROBOROS SINGULARITY (INSANE) ===
[SYNC] RELAY EPOCH BEACON: 0x%04X
Transmitting raw telemetry vector (hex max 512 bytes): 
flag.txt
```

Các thông báo trên tiết lộ rõ cơ chế kiểm tra:
- Giới hạn chu kỳ: `112 <= cycles <= 128`.
- Cần vượt qua `HARMONIC FAULT` để nhận thông báo thành công `[+] TELEMETRY STABILIZED. OVERWRITING SYSTEM MASTER KEY...`, sau đó chương trình sẽ mở và in nội dung `flag.txt`.

#### Luồng thực thi hàm `main` (Offset `0x1100`)
1. **Khởi tạo bộ nhớ State:** Trên ngăn xếp cấp phát một vùng nhớ 536 bytes (`rsp+0x20`).
2. **Thiết lập I/O & Ngắt:** Gọi `setvbuf` tắt bộ đệm `stdin/stdout` và thiết lập ngắt thời gian `alarm(45)`.
3. **Sinh ngẫu nhiên Epoch Beacon:**
   - Lấy thời gian thực thông qua `time(NULL)`.
   - Tính toán giá trị modulo số nguyên tố $65521$ ($0xfff1$): $\text{BEACON} = \text{epoch} \pmod{65521}$.
   - Lưu `BEACON` vào cấu trúc State tại offset `0x12`.
4. **Giao tiếp mạng:**
   - In thông báo: `[SYNC] RELAY EPOCH BEACON: 0x%04X\n`.
   - In lời nhắc: `Transmitting raw telemetry vector (hex max 512 bytes): `.
   - Đọc tối đa 1025 ký tự từ `stdin` qua `fgets`.
   - Chuyển đổi từng cặp 2 ký tự hex qua `sscanf("%02x")` thành mảng byte `MEM` trong State (tối đa 512 bytes, bắt đầu từ offset `0x1c`).
5. **Kích hoạt máy ảo:** Gọi hàm điều phối VM tại offset `0x13e0`.

#### Cấu trúc bố cục bộ nhớ State của Ouroboros VM
Bảng ánh xạ các trường trong khối State 536 bytes:

| Offset | Kích thước | Tên trường | Ý nghĩa | Giá trị khởi tạo |
| :---: | :---: | :--- | :--- | :---: |
| `0x00` | 2 bytes | `R0` | Thanh ghi 16-bit 0 | `0x0000` |
| `0x02` | 2 bytes | `R1` | Thanh ghi 16-bit 1 | `0x0000` |
| `0x04` | 2 bytes | `R2` | Thanh ghi 16-bit 2 | `0x0000` |
| `0x06` | 2 bytes | `R3` | Thanh ghi 16-bit 3 | `0x0000` |
| `0x08` | 2 bytes | `PC` | Con trỏ lệnh Program Counter | `0x0000` |
| `0x0a` | 1 byte  | `K` | Khóa xoay chiều (Rolling Key) | `0x5a` |
| `0x0c` | 4 bytes | `CYCLES` | Bộ đếm chu kỳ thực thi | `0` |
| `0x10` | 1 byte  | `RUNNING`| Cờ trạng thái thực thi VM | `1` (Active) |
| `0x12` | 2 bytes | `BEACON` | Giá trị Beacon động từ server | $\text{time} \pmod{65521}$ |
| `0x14` | 8 bytes | `P[0..7]`| Bảng hoán vị opcode (Permutation table) | `[0x10, 0x20, 0x30, 0x35, 0x40, 0x50, 0x7f, 0xff]` |
| `0x1c` | 512 bytes | `MEM` | Bộ nhớ mã lệnh (Payload bytecode) | Dữ liệu người dùng nạp vào |

---

### 5.3. Cơ chế tự biến đổi mã lệnh & Bảng hoán vị (The Permutation Field)

#### Quy trình Fetch - Decode - Execute
Mỗi lệnh chiếm đúng **4 bytes** trong `MEM` tại vị trí con trỏ `PC`:
1. **Nạp tham số:**
   - `b0 = MEM[PC]`, `b1 = MEM[PC+1]`, `b2 = MEM[PC+2]`, `b3 = MEM[PC+3]`.
   - `PC += 4`.
   - `dst = b1 & 3`.
   - `src = b2 & 3`.
   - `imm16 = (b2 << 8) | b3`.
2. **Giải mã Opcode động qua bảng hoán vị:**
   $$\text{idx} = (b_0 \oplus K) \ \& \ 7$$
   $$\text{opcode} = P[\text{idx}]$$
3. **Cập nhật Rolling Key:**
   $$K_{\text{new}} = (31 \times K + (R_0 \ \& \ 0xff)) \ \& \ 0xff$$
   *(Lưu ý quan trọng: Giá trị $R_0$ được đọc trước khi thân lệnh thực thi).*
4. **Thực thi lệnh** (theo bảng opcode dưới đây).
5. **Cơ chế tự đột biến (Self-Mutation of Permutation Table):**
   Sau khi một lệnh thông thường hoàn tất, máy ảo tráo đổi 2 phần tử trong bảng $P$:
   $$\text{swap}(P[R_0 \ \& \ 7], \ P[R_1 \ \& \ 7])$$
   Đồng thời kiểm tra bộ đếm chu kỳ: Nếu `CYCLES > 128`, chương trình sẽ lập tức kích hoạt lỗi nhiệt `[!] THERMAL DETONATION: Cycle budget breached.` và thoát.

#### Bảng chi tiết tập lệnh của Ouroboros VM

| Opcode | Tên lệnh | Cú pháp | Ngữ nghĩa thực thi | Chu kỳ (`cycles`) |
| :---: | :---: | :--- | :--- | :---: |
| `0x10` | **LOADI** | `LOADI R[dst], imm16` | $R[\text{dst}] = \text{imm16} \pmod{65521}$ | $+1$ |
| `0x20` | **MOV** | `MOV R[dst], R[src]` | $R[\text{dst}] = R[\text{src}]$ | $+1$ |
| `0x30` | **ADD** | `ADD R[dst], R[src]` | $R[\text{dst}] = (R[\text{dst}] + R[\text{src}]) \pmod{65521}$ | $+2$ |
| `0x35` | **SUB** | `SUB R[dst], R[src]` | $R[\text{dst}] = (R[\text{dst}] - R[\text{src}] + 65521) \pmod{65521}$ | $+2$ |
| `0x40` | **XOR** | `XOR R[dst], R[src]` | $R[\text{dst}] = R[\text{dst}] \oplus R[\text{src}]$ | $+2$ |
| `0x50` | **JMP** | `JMP offset` | $PC = PC + (\text{int8})b_3$ | $+3$ |
| `0x7f` | **HALT**| `HALT` | Kích hoạt xác thực 3 tầng Astrolabe, dừng máy ảo | $+10$ |
| `0xff` | **ILLEGAL**| N/A | Báo lỗi `[!] ILLEGAL INSTRUCTION: Core purged.` | Bị hủy |

#### Điểm mấu chốt để kiểm soát Opcode
Bảng $P$ luôn luôn là một phép hoán vị của 8 giá trị opcode ban đầu:
$$\{0x10, 0x20, 0x30, 0x35, 0x40, 0x50, 0x7f, 0xff\}$$
Do đó, dù các phần tử trong $P$ bị tráo đổi liên tục theo $(R_0 \ \& \ 7, R_1 \ \& \ 7)$, **mọi opcode hợp lệ đều luôn tồn tại ở một vị trí $\text{idx} \in [0, 7]$ nào đó trong $P$**.  
Để sinh ra opcode mong muốn tại bước hiện tại:
$$b_0 = K \oplus \text{index\_of}(P, \text{desired\_opcode})$$
Đặc biệt, nếu ta giữ $R_0 \equiv R_1 \pmod 8$ (ví dụ cả hai cùng bằng 0), phép tráo đổi $P[0] \leftrightarrow P[0]$ sẽ **không làm thay đổi bảng $P$**.

---

### 5.4. Giải mã 3 tầng kiểm tra (Three Rings of the Astrolabe)

Toàn bộ logic xác thực của Astrolabe nằm trong khối xử lý của opcode `0x7f` (từ offset `0x1590` đến `0x1960` trong nhị phân).

```
          [Opcode 0x7f: HALT & VERIFY]
                       │
             CYCLES += 10
                       │
         112 <= CYCLES <= 128 ? ──── Không ───> [COHERENCE / THERMAL DETONATION]
                       │ Có
                       ▼
      [Ring 1: Beacon Normalization]
      T[i] = (R[i] - BEACON) mod 65521
                       │
                       ▼
         [Ring 2: Nonlinear Waves]
         v[i] = (T[i] ^ 0x5aa5) mod 65521
         w[i] = v[i]^17 mod 65521
         U[i] = (rol16(w[i], 7) ^ 0x1337) mod 65521
                       │
                       ▼
         [Coupled Lattice Cross-Sum]
         X0 = (T1 + U0) mod 65521
         X1 = (T2 + U1) mod 65521
         X2 = (T3 + U2) mod 65521
         X3 = (T0 + U3) mod 65521
                       │
                       ▼
         [Circular Coupled Equations]
         X0^2 + U0*X1 - X3 == 40414 mod 65521
         X1^2 + U1*X2 - X0 == 12506 mod 65521
         X2^2 + U2*X3 - X1 == 4535  mod 65521
         X3^2 + U3*X0 - X2 == 39941 mod 65521
                       │
                       ▼
          [Ring 3: Elliptic Curves]
         X1^2 == X0^3 + 17*X0 + 43 mod 65521
         X3^2 == X2^3 + 17*X2 + 43 mod 65521
                       │
            Thỏa mãn tất cả ? ──── Không ───> [HARMONIC FAULT]
                       │ Có
                       ▼
        [+] TELEMETRY STABILIZED!
             Đọc & in flag.txt
```

#### Ring 1: Quantum Decay Window & Chuẩn hóa Beacon
1. **Kiểm tra ngân sách chu kỳ (Cycle Window):**
   ```asm
   1593: add eax, 0xa        ; cycles += 10
   1599: cmp eax, 0x6f       ; cycles <= 111 (tức < 112)
   159c: jbe 1b28            ; -> "[!] COHERENCE FAULT: Quantum state cold (cycles < 112)."
   15a2: cmp eax, 0x80       ; cycles > 128
   15a7: ja  1b12            ; -> "[!] THERMAL DETONATION: Core runaway (cycles > 128)."
   ```
   Do đó, số chu kỳ tích lũy trước lệnh `0x7f` phải thỏa mãn:
   $$102 \le \text{cycles}_{\text{before\_halt}} \le 118$$
2. **Khử sai lệch Beacon:**
   Đọc `BEACON` từ `state+0x12` và tính mảng 4 phần tử $T$:
   $$T_i = (R_i - \text{BEACON}) \pmod{65521}, \quad \forall i \in \{0, 1, 2, 3\}$$

#### Ring 2: Sóng phi tuyến & Mạng tinh thể liên kết (Coupled Wave Recurrence)
1. **Biến đổi phi tuyến sinh sóng $U$:**
   Với mỗi phần tử $T_j$ ($j = 0, 1, 2, 3$):
   - $v_j = (T_j \oplus 0x5aa5) \pmod{65521}$
   - $w_j = v_j^{17} \pmod{65521}$ (Lũy thừa mô-đun với số mũ nguyên tố $17$)
   - $U_j = (\text{rol}_{16}(w_j, 7) \oplus 0x1337) \pmod{65521}$
2. **Tổ hợp chéo trên mạng tinh thể $X$:**
   $$\begin{cases}
   X_0 = (T_1 + U_0) \pmod{65521} \\
   X_1 = (T_2 + U_1) \pmod{65521} \\
   X_2 = (T_3 + U_2) \pmod{65521} \\
   X_3 = (T_0 + U_3) \pmod{65521}
   \end{cases}$$
3. **Giải mã các phương trình kiểm tra (Mẹo tối ưu hóa phép chia GCC):**
   Trong mã máy nhị phân xuất hiện đoạn mã kiểm tra:
   ```asm
   imul r13, 0x58862fdccdf01111
   add  r13, 0xf04814392f59c642
   cmp  0x1000f00e10d2f, r13
   jb   harmonic_fault
   ```
   Đây là khuôn mẫu tối ưu của trình biên dịch GCC cho phép kiểm tra:
   $$(E \pmod{65521}) == C$$
   - Hằng số nhân $r14 = \mathtt{0x58862fdccdf01111} = 65521^{-1} \pmod{2^{64}}$.
   - Ngưỡng giới hạn $\mathtt{0x1000f00e10d2f} = \lfloor 2^{64} / 65521 \rfloor + 1$.
   - Bằng cách giải phương trình $(-C \times 65521^{-1}) \pmod{2^{64}} = \text{offset}$, ta xác định chính xác 4 hằng số mục tiêu:
     - Check 1: offset $\mathtt{0xf04814392f59c642} \implies C_0 = \mathbf{40414}$
     - Check 2: offset $\mathtt{0x74c1d75b9e5e4786} \implies C_1 = \mathbf{12506}$
     - Check 3: offset $\mathtt{0xcee61f7bd841abd9} \implies C_2 = \mathbf{4535}$
     - Check 4: offset $\mathtt{0x80368331afe94eab} \implies C_3 = \mathbf{39941}$

   Từ đó, 4 phương trình mạng liên kết là:
   $$\begin{cases}
   X_0^2 + U_0 X_1 - X_3 \equiv 40414 \pmod{65521} & (1) \\
   X_1^2 + U_1 X_2 - X_0 \equiv 12506 \pmod{65521} & (2) \\
   X_2^2 + U_2 X_3 - X_1 \equiv 4535 \pmod{65521}  & (3) \\
   X_3^2 + U_3 X_0 - X_2 \equiv 39941 \pmod{65521} & (4)
   \end{cases}$$

#### Ring 3: Tọa độ xạ ảnh / Chân trời quỹ đạo (Elliptic Curve Horizon)
Tại các dòng `0x187c - 0x1960`, mã máy kiểm tra:
```asm
; Kiểm tra cặp (X0, X1):
cmp (X1^2 % 65521), ((X0^3 + 17*X0 + 43) % 65521)
jne harmonic_fault

; Kiểm tra cặp (X2, X3):
cmp (X3^2 % 65521), ((X2^3 + 17*X2 + 43) % 65521)
jne harmonic_fault
```
Tức là hai điểm $(X_0, X_1)$ và $(X_2, X_3)$ bắt buộc phải là các điểm hữu tỉ trên đường cong Elliptic Weierstrass:
$$E: y^2 \equiv x^3 + 17x + 43 \pmod{65521}$$

---

### 5.5. Mô hình hóa toán học & Thuật toán giải hệ phương trình

#### Nhận xét mang tính đột phá
Hệ 6 phương trình trên hoàn toàn **không chứa biến `BEACON`**.  
Các biến $T_0, T_1, T_2, T_3$ chỉ phụ thuộc vào các hằng số toán học nội tại của hệ thống. Do đó, nghiệm $T$ là **cố định và duy nhất cho mọi phiên kết nối**!  
Khi server gửi giá trị `BEACON`, các thanh ghi $R_i$ cần nạp chỉ đơn giản là:
$$R_i = (T_i + \text{BEACON}) \pmod{65521}$$

#### Thuật toán đại số rút gọn (Algebraic Reduction)
Thay trực tiếp phương trình đường cong Elliptic vào phương trình (2) và (4):
- Thay $X_1^2 = X_0^3 + 17X_0 + 43$ vào $(2)$:
  $$(X_0^3 + 17X_0 + 43) + U_1 X_2 - X_0 \equiv 12506 \pmod{65521}$$
  $$\implies U_1 \cdot X_2 \equiv 12506 - (X_0^3 + 16X_0 + 43) \pmod{65521}$$
  Đặt đa thức $K(X_0) = 12506 - (X_0^3 + 16X_0 + 43) \pmod{65521}$. Ta có:
  $$X_2 \equiv K(X_0) \cdot U_1^{-1} \pmod{65521}$$

- Tương tự, thay $X_3^2 = X_2^3 + 17X_2 + 43$ vào $(4)$:
  $$(X_2^3 + 17X_2 + 43) + U_3 X_0 - X_2 \equiv 39941 \pmod{65521}$$
  $$\implies U_3 \cdot X_0 \equiv 39941 - (X_2^3 + 16X_2 + 43) \pmod{65521}$$
  Đặt đa thức $K'(X_2) = 39941 - (X_2^3 + 16X_2 + 43) \pmod{65521}$. Ta có:
  $$U_3 \equiv K'(X_2) \cdot X_0^{-1} \pmod{65521}$$

#### Chiến lược tìm kiếm (Search Pipeline):
Nhờ việc tách biến trên, nếu ta cố định cặp $(T_0, T_1)$:
1. $U_0 = f(T_0)$ và $U_1 = f(T_1)$ được tính trực tiếp từ bảng tra.
2. $X_0 = (T_1 + U_0) \pmod{65521}$.
3. $X_2 = (K(X_0) \cdot U_1^{-1}) \pmod{65521}$ được xác định duy nhất!
4. $U_3 = (K'(X_2) \cdot X_0^{-1}) \pmod{65521}$ được xác định duy nhất!
5. Tra ngược $T_3 = f^{-1}(U_3)$. Nếu $U_3$ không nằm trong miền giá trị của $f$, loại ngay lập tức.
6. Tính $U_2 = (X_2 - T_3) \pmod{65521}$, tra ngược $T_2 = f^{-1}(U_2)$. Nếu không tồn tại, loại ngay.
7. Tính $X_1 = (T_2 + U_1) \pmod{65521}$ và $X_3 = (T_0 + U_3) \pmod{65521}$.
8. Kiểm tra nốt các điều kiện còn lại: đường cong Elliptic và 2 phương trình (1), (3).

Chương trình giải viết bằng ngôn ngữ C kết hợp OpenMP (tận dụng đa luồng CPU) vét cạn không gian $65521 \times 65521$ chỉ trong **vỏn vẹn 3 giây** và cho ra kết quả duy nhất:
$$\mathbf{T = [1, 218, 59611, 783]}$$
$$\mathbf{U = [37101, 35947, 43627, 40060]}$$
$$\mathbf{X = [37319, 30037, 44410, 40061]}$$

---

### 5.6. Kỹ thuật xây dựng Payload & Điều phối chu kỳ (Cycle Budgeting)

Để thỏa mãn toàn bộ yêu cầu của hệ thống:
1. **Giá trị thanh ghi đích:**
   - $R_0 = (1 + \text{BEACON}) \pmod{65521}$
   - $R_1 = (218 + \text{BEACON}) \pmod{65521}$
   - $R_2 = (59611 + \text{BEACON}) \pmod{65521}$
   - $R_3 = (783 + \text{BEACON}) \pmod{65521}$
2. **Cân đối chu kỳ (Cycle Budgeting):**
   - Lệnh kết thúc `HALT (0x7f)` tốn 10 chu kỳ.
   - 4 lệnh `LOADI` nạp 4 thanh ghi $R_0, R_1, R_2, R_3$ tốn 4 chu kỳ.
   - Chọn tổng chu kỳ mục tiêu là **115 cycles** (nằm chính giữa khoảng an toàn $[112, 128]$).
   - Số chu kỳ cần bù thêm: $115 - 10 - 4 = 101$ cycles.
3. **Thiết kế lệnh đệm (Dummy Instructions):**
   - Ta chèn 101 lệnh `LOADI R3, 0` ở đầu payload (mỗi lệnh tốn đúng 1 cycle).
   - Vì trong suốt 101 lệnh này, $R_0 = 0$ và $R_1 = 0$, điều kiện $R_0 \ \& \ 7 = R_1 \ \& \ 7 = 0$ được thỏa mãn tuyệt đối $\implies$ **bảng hoán vị $P$ giữ nguyên trạng thái ban đầu**!
   - Khóa xoay $K$ cập nhật đơn giản: $K_{i+1} = (31 \times K_i) \pmod{256}$.
4. **Kiểm tra kích thước Payload:**
   - Tổng số lệnh: $101 \text{ (dummy)} + 4 \text{ (LOADI)} + 1 \text{ (HALT)} = 106 \text{ lệnh}$.
   - Kích thước bytecode: $106 \times 4 = 424 \text{ bytes} \le 512 \text{ bytes}$ (hoàn toàn hợp lệ theo quy định của server).

---

### 5.7. Mã nguồn khai thác hoàn chỉnh (C Solver & Python Exploit)

#### 1. Bộ giải nghiệm C (`solve.c`)
```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#define P 65521

static inline uint16_t rol16(uint16_t x, int n) {
    return ((x << n) | (x >> (16 - n))) & 0xffff;
}

static inline uint32_t mod_pow(uint32_t base, uint32_t exp, uint32_t mod) {
    uint32_t res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) res = (uint64_t)res * base % mod;
        base = (uint64_t)base * base % mod;
        exp >>= 1;
    }
    return res;
}

uint16_t compute_U(uint16_t t) {
    uint32_t v = (t ^ 0x5aa5) % P;
    uint32_t w = mod_pow(v, 17, P);
    uint32_t u = (rol16(w, 7) ^ 0x1337) % P;
    return (uint16_t)u;
}

uint16_t U_table[P];
int inv_f[P];
uint16_t inv_mod[P];
uint16_t K_table[P];
uint16_t Kprime_table[P];

const uint32_t C0 = 40414;
const uint32_t C1 = 12506;
const uint32_t C2 = 4535;
const uint32_t C3 = 39941;

void init_tables() {
    for (int i = 0; i < P; i++) inv_f[i] = -1;
    for (uint32_t t = 0; t < P; t++) {
        uint16_t u = compute_U(t);
        U_table[t] = u;
        inv_f[u] = t;
    }
    inv_mod[0] = 0;
    for (uint32_t i = 1; i < P; i++) inv_mod[i] = mod_pow(i, P - 2, P);
    for (uint32_t x = 0; x < P; x++) {
        uint64_t x3 = (uint64_t)x * x % P * x % P;
        uint64_t poly = (x3 + 16ULL * x + 43ULL) % P;
        K_table[x] = (C1 + P - poly) % P;
        Kprime_table[x] = (C3 + P - poly) % P;
    }
}

int main() {
    printf("[*] Khởi tạo bảng tra cứu dữ liệu...\n");
    init_tables();
    printf("[*] Đang giải hệ phương trình trên đa luồng OpenMP...\n");

    #pragma omp parallel for schedule(dynamic, 64)
    for (int t0 = 0; t0 < P; t0++) {
        uint32_t u0 = U_table[t0];
        for (int t1 = 0; t1 < P; t1++) {
            uint32_t u1 = U_table[t1];
            if (u1 == 0) continue;

            uint32_t x0 = (t1 + u0) % P;
            if (x0 == 0) continue;

            uint32_t x2 = (uint64_t)K_table[x0] * inv_mod[u1] % P;
            uint32_t u3 = (uint64_t)Kprime_table[x2] * inv_mod[x0] % P;

            int t3 = inv_f[u3];
            if (t3 < 0) continue;

            uint32_t u2 = (x2 + P - t3) % P;
            int t2 = inv_f[u2];
            if (t2 < 0) continue;

            uint32_t x1 = (t2 + u1) % P;
            uint32_t x3 = (t0 + u3) % P;

            // Kiểm tra các điểm thuộc đường cong Elliptic
            uint32_t x1_sq = (uint64_t)x1 * x1 % P;
            uint32_t ec1 = ((uint64_t)x0 * x0 % P * x0 + 17ULL * x0 + 43ULL) % P;
            if (x1_sq != ec1) continue;

            uint32_t x3_sq = (uint64_t)x3 * x3 % P;
            uint32_t ec2 = ((uint64_t)x2 * x2 % P * x2 + 17ULL * x2 + 43ULL) % P;
            if (x3_sq != ec2) continue;

            // Kiểm tra phương trình mạng (1) và (3)
            uint32_t eq0 = ((uint64_t)x0 * x0 + (uint64_t)u0 * x1 + P - x3) % P;
            if (eq0 != C0) continue;

            uint32_t eq2 = ((uint64_t)x2 * x2 + (uint64_t)u2 * x3 + P - x1) % P;
            if (eq2 != C2) continue;

            printf("\n[+] ĐÃ TÌM THẤY NGHIỆM DUY NHẤT!\n");
            printf("T = [%d, %d, %d, %d]\n", t0, t1, t2, t3);
            printf("U = [%d, %d, %d, %d]\n", u0, u1, u2, u3);
            printf("X = [%d, %d, %d, %d]\n", x0, x1, x2, x3);
        }
    }
    return 0;
}
```

#### 2. Kịch bản khai thác từ xa Python (`solve_remote.py`)
```python
#!/usr/bin/env python3
import socket
import re
import struct

P_MOD = 65521

OP_LOADI = 0x10
OP_MOV   = 0x20
OP_ADD   = 0x30
OP_SUB   = 0x35
OP_XOR   = 0x40
OP_JMP   = 0x50
OP_HALT  = 0x7f

class VMAssembler:
    """Mô phỏng máy ảo Ouroboros và tự động biên dịch bytecode"""
    def __init__(self, beacon):
        self.R = [0, 0, 0, 0]
        self.PC = 0
        self.K = 0x5a
        self.cycles = 0
        self.beacon = beacon
        self.P = [0x10, 0x20, 0x30, 0x35, 0x40, 0x50, 0x7f, 0xff]

    def assemble(self, opcode, dst=0, src=0, imm16=0):
        idx = self.P.index(opcode)
        b0 = (self.K ^ idx) & 0xff
        b1 = dst & 0x3
        b2 = (imm16 >> 8) & 0xff
        if opcode in (OP_MOV, OP_ADD, OP_SUB, OP_XOR):
            b2 = src & 0x3
        b3 = imm16 & 0xff
        return bytes([b0, b1, b2, b3])

    def step(self, instr_bytes):
        b0, b1, b2, b3 = instr_bytes
        self.PC += 4
        dst = b1 & 0x3
        src = b2 & 0x3
        imm16 = (b2 << 8) | b3

        idx = (b0 ^ self.K) & 7
        opcode = self.P[idx]

        # Khóa K cập nhật sử dụng giá trị cũ của R0
        old_r0 = self.R[0] & 0xff
        self.K = ((31 * self.K) + old_r0) & 0xff

        if opcode == OP_LOADI:
            self.R[dst] = imm16 % P_MOD
            self.cycles += 1
        elif opcode == OP_HALT:
            self.cycles += 10
            return opcode

        # Tráo đổi bảng P
        r0_low = self.R[0] & 7
        r1_low = self.R[1] & 7
        self.P[r0_low], self.P[r1_low] = self.P[r1_low], self.P[r0_low]
        return opcode

def build_payload(beacon):
    vm = VMAssembler(beacon)
    payload = bytearray()

    # Nghiệm giải được từ hệ phương trình Astrolabe
    T = [1, 218, 59611, 783]
    target_R = [(t + beacon) % P_MOD for t in T]

    # Bước 1: Chèn 101 lệnh dummy LOADI R3, 0 để đạt đúng 115 chu kỳ
    for _ in range(101):
        instr = vm.assemble(OP_LOADI, dst=3, imm16=0)
        vm.step(instr)
        payload.extend(instr)

    # Bước 2: Nạp các giá trị mục tiêu vào R0, R1, R2, R3
    for reg in range(4):
        instr = vm.assemble(OP_LOADI, dst=reg, imm16=target_R[reg])
        vm.step(instr)
        payload.extend(instr)

    # Bước 3: Lệnh HALT (0x7f) kích hoạt kiểm tra
    instr = vm.assemble(OP_HALT)
    vm.step(instr)
    payload.extend(instr)

    print(f"[+] Payload đã sinh: {len(payload)} bytes, tổng chu kỳ VM: {vm.cycles}")
    print(f"[+] Giá trị các thanh ghi mục tiêu: {target_R}")
    return payload

def main():
    host, port = '34.116.80.78', 7654
    print(f"[*] Đang kết nối tới máy chủ challenge {host}:{port}...")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(10)
    s.connect((host, port))

    banner = ""
    while "bytes): " not in banner:
        chunk = s.recv(1024).decode('utf-8', errors='ignore')
        if not chunk: break
        banner += chunk

    print(banner.strip())

    m = re.search(r'BEACON:\s*0x([0-9a-fA-F]+)', banner)
    if not m:
        print("[-] Không tìm thấy BEACON!")
        return

    beacon = int(m.group(1), 16)
    print(f"[+] Trích xuất Epoch Beacon: 0x{beacon:04X} ({beacon})")

    payload = build_payload(beacon)
    hex_payload = payload.hex() + "\n"

    print(f"[*] Đang truyền vector dữ liệu hex ({len(hex_payload.strip())} ký tự)...")
    s.sendall(hex_payload.encode('ascii'))

    while True:
        try:
            chunk = s.recv(1024).decode('utf-8', errors='ignore')
            if not chunk: break
            print(chunk, end='', flush=True)
        except socket.timeout:
            break

    s.close()

if __name__ == '__main__':
    main()
```

---

### 5.8. Flag & Tổng kết bài học

#### Nhật ký thực thi nhận Flag từ Server:
```text
[*] Đang kết nối tới máy chủ challenge 34.116.80.78:7654...
=== SECTOR 00: OUROBOROS SINGULARITY (INSANE) ===
[SYNC] RELAY EPOCH BEACON: 0x143C
Transmitting raw telemetry vector (hex max 512 bytes):
[+] Trích xuất Epoch Beacon: 0x143C (5180)
[+] Payload đã sinh: 424 bytes, tổng chu kỳ VM: 115
[+] Giá trị các thanh ghi mục tiêu: [5181, 5398, 64791, 5963]
[*] Đang truyền vector dữ liệu hex (848 ký tự)...
[+] TELEMETRY STABILIZED. OVERWRITING SYSTEM MASTER KEY...
CSSCTF{0ur0b0r0s_g00d_j0b_b01s_heh3_67}
```

$$\mathbf{CSSCTF\{0ur0b0r0s\_g00d\_j0b\_b01s\_heh3\_67\}}$$

#### Bài học kinh nghiệm & Đánh giá chuyên sâu:
1. **Kết hợp giữa Dịch ngược máy ảo và Mật mã học (VM Reverse & Cryptanalysis):** Thử thách đòi hỏi vừa phải phân tích mã máy cấp thấp để hiểu kiến trúc máy ảo tự biến đổi (self-modifying VM), vừa phải phát hiện cấu trúc toán học ẩn (đường cong Elliptic, mạng tinh thể tuần hoàn).
2. **Kỹ thuật nhận diện tối ưu hóa phép chia số nguyên (Invariant Division via Multiplication):** Việc nhận ra $0x58862fdccdf01111$ là nghịch đảo modulo $2^{64}$ của số nguyên tố Fermat/Adler $65521$ giúp nhanh chóng biến đổi các lệnh hợp ngữ rườm rà thành hệ phương trình modulo quen thuộc.
3. **Kỹ thuật Cycle Budgeting trong Exploit VM:** Khi máy ảo đặt ra ràng buộc chu kỳ (Cycle window $[112, 128]$), việc sử dụng các lệnh đệm trung hòa (NOP-like instructions) như `LOADI R3, 0` cho phép kiểm soát chính xác từng chu kỳ thực thi mà không gây tác dụng phụ lên bảng hoán vị opcode $P$.
