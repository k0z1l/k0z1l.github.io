---
title: "[CSSCTF] Reverse Engineering"
date: '2026-10-02'
description: 'Comprehensive writeup and solutions for the Reverse Engineering challenges in CSSCTF: Lamp Drill, Silicon Snare, PRINCE WALK, and FLAPPY BOARD.'
categories: [CSSCTF, Reverse Engineering]
tags: [cssctf, reverse-engineering, re, sat-solver, hardware-re]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# CSSCTF REVERSE ENGINEERING CHALLENGES WRITEUP

---

## 1. Challenge 1: Lamp Drill (Warm-up)

### 1.1. Challenge Information
* **Challenge Name:** Lamp Drill
* **Category:** Reverse Engineering (Warm-up)
* **Provided Files:** `lampDrill.png`, `lampDrill.svg`
* **Description:**
  > Warm-up. No spaces.  
  > Flag Format: `CSSCTF{...}`

---

### 1.2. Detailed Analysis

Opening the image `lampDrill.png` or inspecting the vector structures inside `lampDrill.svg` reveals two distinct visual sections:

#### 1.2.1. Logic Rule Table (Upper Section)
There are four transformation rules governing the lamp states (solid black circle `●` and hollow white circle `○`):
* `● ● -> ●`
* `● ○ -> ○`
* `○ ● -> ○`
* `○ ○ -> ○`

In digital logic circuit design:
* `●` (black circle / lamp ON) represents logic high: **$1$** (True).
* `○` (white circle / lamp OFF) represents logic low: **$0$** (False).

This lookup table represents the **truth table of an AND logic gate**:
$$\text{Output} = A \land B$$
The output evaluates to $1$ if and only if both input operands $A$ and $B$ are $1$.

---

#### 1.2.2. Logic Box Grid (Lower Section)
The main grid consists of **3 rows**, each containing **8 rectangular boxes** connected sequentially from left to right with arrows ($\rightarrow$).
* The 8 boxes in each row represent **8 bits** (1 ASCII byte), evaluated from the Most Significant Bit (MSB) on the left to the Least Significant Bit (LSB) on the right.
* Each box encloses a pair of lamp circles $[A, B]$. By evaluating the AND logic operation on each pair within a box, we determine the value of the corresponding bit.

##### 1.2.2.1. Row 1
* Box 0: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 1: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 2: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 3: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 4: `[○, ○]` $\rightarrow 0 \land 0 = \mathbf{0}$
* Box 5: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 6: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 7: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$

$\Rightarrow$ Binary sequence: `01100011`$_2 = 0\text{x}63 = 99 = \mathbf{'c'}$

##### 1.2.2.2. Row 2
* Box 0: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 1: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 2: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 3: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 4: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 5: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 6: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 7: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$

$\Rightarrow$ Binary sequence: `01110011`$_2 = 0\text{x}73 = 115 = \mathbf{'s'}$

##### 1.2.2.3. Row 3
* Box 0: `[○, ○]` $\rightarrow 0 \land 0 = \mathbf{0}$
* Box 1: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 2: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 3: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 4: `[●, ○]` $\rightarrow 1 \land 0 = \mathbf{0}$
* Box 5: `[○, ●]` $\rightarrow 0 \land 1 = \mathbf{0}$
* Box 6: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$
* Box 7: `[●, ●]` $\rightarrow 1 \land 1 = \mathbf{1}$

$\Rightarrow$ Binary sequence: `01110011`$_2 = 0\text{x}73 = 115 = \mathbf{'s'}$

Concatenating the 3 decoded characters: `'c'`, `'s'`, `'s'` $\rightarrow$ `"css"`.

---

### 1.3. Automated Decoder Script (Python)

The script below parses `lampDrill.svg` directly, extracts bounding box coordinates for each container and circle, groups them by row, and calculates the resulting ASCII characters:

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

    # Scan all paths in SVG to classify boxes and circles
    for p in root.iter('{http://www.w3.org/2000/svg}path'):
        style = p.attrib.get('style', '')
        d = p.attrib.get('d', '')
        minx, miny, maxx, maxy, cx, cy = get_coords(d)
        
        # Cream-colored boxes with black borders
        if 'fill: #fffdf8' in style:
            boxes.append({'minx': minx, 'miny': miny, 'maxx': maxx, 'maxy': maxy, 'cx': cx, 'cy': cy})
        # Lamp circles (stroke radius 1.6)
        elif '1.6' in style:
            # Black fill (#1c1915) is 1, white/cream fill is 0
            val = 1 if '#1c1915' in style.split('stroke')[0] else 0
            circles.append({'cx': cx, 'cy': cy, 'val': val})

    # Group boxes into 3 rows based on Y coordinates
    boxes.sort(key=lambda b: (b['cy'], b['cx']))
    rows = []
    for b in boxes:
        if not rows or abs(b['cy'] - rows[-1][0]['cy']) > 20:
            rows.append([b])
        else:
            rows[-1].append(b)

    result_chars = []
    for r_idx, r in enumerate(rows):
        r.sort(key=lambda b: b['cx']) # Sort boxes left to right
        bits = []
        for b in r:
            # Retrieve the two circles enclosed within the box
            inside = [c for c in circles if b['minx'] <= c['cx'] <= b['maxx'] and b['miny'] <= c['cy'] <= b['maxy']]
            inside.sort(key=lambda c: c['cx'])
            # Compute logical AND between the two lamps
            out_bit = inside[0]['val'] & inside[1]['val']
            bits.append(str(out_bit))
        
        byte_str = ''.join(bits)
        char = chr(int(byte_str, 2))
        result_chars.append(char)
        print(f"Row {r_idx}: Bit sequence {byte_str} -> ASCII code {ord(char)} = '{char}'")

    flag = f"CSSCTF{{{''.join(result_chars)}}}"
    print(f"\n[+] Flag: {flag}")
    return flag

if __name__ == '__main__':
    solve_lamp_drill('lampDrill.svg')
```

### 1.4. Result & Flag
$$\mathbf{CSSCTF\{css\}}$$

---

## 2. Challenge 2: Silicon Snare (Hardware RE / SAT Solving)

### 2.1. Challenge Information
* **Challenge Name:** Silicon Snare
* **Category:** Reverse Engineering (Hardware / Circuit SAT)
* **Provided Files:** `schematic.png`, `schematic.svg`
* **Description:**
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

### 2.2. Circuit Architecture Analysis

The challenge simulates hardware die reverse engineering (silicon decap / hardware reverse engineering). The circuit forms a concentric optical routing matrix:
1. **32 Primary Inputs:** Labeled from `I00` to `I31`, arranged along the outer ring in clockwise order, starting with `I00` at the 12 o'clock position.
2. **Central Control Destination (`OVERRIDE`):** A large circle situated at the center of the circuit ($x \approx 419.08, y \approx 396.31$). The objective is to identify the 32-bit input vector that drives this node to logic high ($1$).
3. **Logic Gates:** A total of **74 gates** categorized into 4 proprietary gate models:
   * **Flow gate (`f00` to `f13` - 20 gates):**  
     $Y = A \land B$ (Standard AND gate).
   * **Merge gate (`m00` to `m22` - 35 gates):**  
     $Y = A \oplus B$ (Standard XOR gate).
   * **Negate gate (`n00` to `n05` - 6 gates):**  
     $Y = \neg A$ (NOT gate / Inverter).
   * **Shift gate (`s00` to `s0c` - 13 gates):**  
     A custom signal routing gate:
     * Pointed end: Input $A$, Output $Y_0 = A \lor B$.
     * Flat end (marked with a heavy bar `|`): Input $B$, Output $Y_1 = A \land \neg B$.

---

### 2.3. Wire Untangling Technique

The author intentionally laid out overlapping, criss-crossing traces to thwart manual visual tracking. However, analyzing the SVG document structure exposes:

1. **Signal Net Routing Principles:**
   * Challenge description: *"A node is where one wire splits. It is drawn as a filled dot: one wire arrives, and two or more leave. The dot is that wire's colour, and every branch after the node carries the same signal."*
   * By inspecting `<path>` elements in the SVG, all colored wires are drawn using exactly **100 unique hex stroke colors**. Each stroke color corresponds to **exactly one signal net**. A signal emitted from a source never changes color along its transmission line.
2. **Primary Input Mapping:**
   * In the SVG, the 32 small dots corresponding to `I00`..`I31` (from `patch_111` to `patch_142`) carry the exact first 32 hex colors (`#9e1010`, `#3861c7`, `#7cc714`, ..., `#c7c038`).
3. **Negate Gates (Inverters):**
   * Six Negate gates (`n00` to `n05`) are inserted directly onto traces to invert the signal without altering trace color. Each Negate gate divides a trace of identical color into two segments: the segment before the gate (larger radius from center) and the segment after the gate (smaller radius towards center), with the relation:
     $$\text{wire\_after} = \neg (\text{wire\_before})$$
4. **Shift Gate Analysis (`s00` to `s0c`):**
   * Inspecting physical pin connections on all 13 Shift gates reveals that the output pin $Y_0$ at the pointed end terminates with a terminator bar (no wire connected). Only output pin $Y_1$ at the flat end feeds into downstream stages:
     $$Y = A \land \neg B$$
     Here, input $B$ enters adjacent to the heavy bar at the flat end, while input $A$ enters at the pointed end.
5. **Destination Node `OVERRIDE`:**
   * The final stage driving directly into `OVERRIDE` is gate **`f13`** (Flow gate / AND):
     $$\text{OVERRIDE} = f_{13} = f_{11} \land f_{12} = 1 \iff f_{11} = 1 \text{ and } f_{12} = 1$$

---

### 2.4. Boolean Modeling and Solving with Z3

Because the circuit forms a Directed Acyclic Graph (DAG), the entire network corresponds to a 32-variable Boolean equation system. We automatically extract the entire netlist from the SVG file and submit it to the **Z3 SAT Solver**.

#### 2.4.1. Complete Solver Script (`solve_snare_final.py`)

```python
import xml.etree.ElementTree as ET
import re
import math
from collections import defaultdict
from z3 import *

def parse_points(d):
    """Extract all (x, y) coordinates from SVG path 'd' attribute string"""
    nums = [float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+)', d)]
    return list(zip(nums[0::2], nums[1::2]))

def glyph_to_char(href):
    """Convert ASCII hex code from matplotlib glyph defs to character"""
    if not href: return ''
    m = re.search(r'-([0-9a-fA-F]{2,4})$', href.lstrip('#'))
    return chr(int(m.group(1), 16)) if m else '?'

def solve_silicon_snare():
    tree = ET.parse('schematic.svg')
    root = tree.getroot()
    axes = root.find('.//{http://www.w3.org/2000/svg}g[@id="axes_1"]')
    
    # Center of the entire schematic
    cx0, cy0 = 419.083408, 396.308257

    # 1. Extract centroids of gate patches (patch_36 to patch_109)
    gate_patches = {}
    for i in range(36, 110):
        elem = axes.find(f'.//{{http://www.w3.org/2000/svg}}g[@id="patch_{i}"]/{{http://www.w3.org/2000/svg}}path')
        if elem is not None:
            pts = parse_points(elem.attrib.get('d', ''))
            gate_patches[f"patch_{i}"] = (sum(p[0] for p in pts)/len(pts), sum(p[1] for p in pts)/len(pts))

    # 2. Extract text label coordinates for the 74 logic gates
    gate_texts = {}
    for g in axes.iter('{http://www.w3.org/2000/svg}g'):
        uses = g.findall('{http://www.w3.org/2000/svg}use')
        if uses:
            txt = ''.join(glyph_to_char(u.attrib.get('{http://www.w3.org/1999/xlink}href') or u.attrib.get('href')) for u in uses).strip()
            tr = g.attrib.get('transform', '')
            m = re.search(r'translate\(([-0-9.]+)\s+([-0-9.]+)\)', tr)
            if m and re.match(r'^[fnms]\d\w*$', txt):
                gate_texts[txt] = (float(m.group(1)), float(m.group(2)))

    # Map gate names to patch IDs
    patch_to_gate = {}
    for gname, gpos in gate_texts.items():
        best_p = min(gate_patches.items(), key=lambda item: math.hypot(gpos[0] - item[1][0], gpos[1] - item[1][1]))
        patch_to_gate[best_p[0]] = gname

    # 3. Extract colors for 32 Primary Inputs (patch_111 to patch_142)
    inputs = {}
    for i in range(111, 143):
        elem = axes.find(f'.//{{http://www.w3.org/2000/svg}}g[@id="patch_{i}"]/{{http://www.w3.org/2000/svg}}path')
        if elem is not None:
            style = elem.attrib.get('style', '')
            m = re.search(r'fill:\s*(#[0-9a-fA-F]{6})', style)
            col = m.group(1).lower() if m else ''
            idx = i - 111
            inputs[f"I{idx:02d}"] = col

    # 4. Extract colored wire paths
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

    # 5. Split signal nets crossing 6 Negate gates (Inverters)
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
        # Check if wire passes through a Negate gate
        for nname, ncol in negate_colors.items():
            if col == ncol:
                ngcx, ngcy = negate_info[nname]
                d_ng = math.hypot(ngcx - cx0, ngcy - cy0)
                d_pt = math.hypot(pt[0] - cx0, pt[1] - cy0)
                # Outer segment (larger radius) -> before gate
                if d_pt > d_ng - 5:
                    return f"{col}_before_{nname}"
                else:
                    return f"{col}_after_{nname}"
        return col

    # 6. Assign colored wire endpoints to logic gates
    gate_pins = defaultdict(list)
    for pid, (gcx, gcy) in gate_patches.items():
        gname = patch_to_gate[pid]
        if gname.startswith('n'):
            continue # Negate gates are modeled separately
        for cid, col, pts in colored_lines:
            for ep in [pts[0], pts[-1]]:
                d = math.hypot(ep[0] - gcx, ep[1] - gcy)
                if d < 12.0:
                    net_name = get_net_name(col, ep)
                    d_c = math.hypot(ep[0] - cx0, ep[1] - cy0)
                    gate_pins[gname].append((net_name, ep, d_c, cid))

    # Deduplicate connections on the same gate
    for gname in gate_pins:
        seen = {}
        for item in gate_pins[gname]:
            net_name = item[0]
            if net_name not in seen:
                seen[net_name] = item
        gate_pins[gname] = list(seen.values())

    # 7. Locate flat bar on Shift gates to disambiguate inputs A and B
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

    # 8. BUILD MODEL AND SOLVE VIA Z3
    solver = Solver()

    # 32 Boolean variables for inputs I00 to I31
    I_vars = {iname: Bool(iname) for iname in inputs}

    # Collect all signal nets across the schematic
    all_nets = set(inputs.values())
    for gname, plist in gate_pins.items():
        for item in plist:
            all_nets.add(item[0])
    for nname, col in negate_colors.items():
        all_nets.add(f"{col}_before_{nname}")
        all_nets.add(f"{col}_after_{nname}")

    net_vars = {net: Bool(f"N_{net}") for net in all_nets}

    # Bind input variables to initial nets
    for iname, col in inputs.items():
        solver.add(net_vars[col] == I_vars[iname])

    # Constraints for the 6 Negate gates (Inverters)
    for nname, col in negate_colors.items():
        v_before = net_vars[f"{col}_before_{nname}"]
        v_after = net_vars[f"{col}_after_{nname}"]
        solver.add(v_after == Not(v_before))

    # Constraints for Flow, Merge, and Shift gates
    for gname, plist in sorted(gate_pins.items()):
        gtype = gname[0]
        # Sort pins by descending distance from center: 2 outer inputs, 1 inner output
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
            # Input closer to bar is B (flat in); farther is A (pointed in)
            if d1 < d2:
                v_B, v_A = v_in1, v_in2
            else:
                v_B, v_A = v_in2, v_in1
            solver.add(v_out == And(v_A, Not(v_B)))

    # Objective constraint: OVERRIDE node (driven by output of f13: #6c5c8b) must be HIGH (True)
    solver.add(net_vars['#6c5c8b'] == True)

    print("[*] Solving logic constraints using Z3...")
    if solver.check() == sat:
        m = solver.model()
        bits = []
        for i in range(32):
            val = m[I_vars[f"I{i:02d}"]]
            bits.append('1' if is_true(val) else '0')
        pattern = ''.join(bits)
        
        # Convert to ASCII
        ascii_chars = []
        for i in range(0, 32, 8):
            byte_val = int(pattern[i:i+8], 2)
            ascii_chars.append(chr(byte_val))
        ascii_str = ''.join(ascii_chars)
        
        print(f"[+] Extracted 32-bit pattern: {pattern}")
        print(f"[+] Decoded ASCII (4 bytes): '{ascii_str}'")
        flag = f"CSSCTF{{{pattern}}}"
        print(f"[+] Flag: {flag}")
        return flag
    else:
        print("[-] No satisfying assignment found.")

if __name__ == '__main__':
    solve_silicon_snare()
```

---

### 2.5. Solving Results

Executing the script yields the SAT assignment:
```text
[*] Solving logic constraints using Z3...
[+] Extracted 32-bit pattern: 01010000010000010101001101010011
[+] Decoded ASCII (4 bytes): 'PASS'
[+] Flag: CSSCTF{01010000010000010101001101010011}
```

Evaluating the four 8-bit blocks against ASCII:
* Byte 1 ($I_{00} \to I_{07}$): `01010000`$_2 = 0\text{x}50 = 80 = \mathbf{'P'}$
* Byte 2 ($I_{08} \to I_{15}$): `01000001`$_2 = 0\text{x}41 = 65 = \mathbf{'A'}$
* Byte 3 ($I_{16} \to I_{23}$): `01010011`$_2 = 0\text{x}53 = 83 = \mathbf{'S'}$
* Byte 4 ($I_{24} \to I_{31}$): `01010011`$_2 = 0\text{x}53 = 83 = \mathbf{'S'}$

Combining into the bypass keyword: **`PASS`** (the override fail-safe bypass passphrase).

### 2.6. Flag
$$\mathbf{CSSCTF\{01010000010000010101001101010011\}}$$

---

## 3. Challenge 3: PRINCE WALK (RE / "PINCE Int32 memory-editing practice")

> **Flag: `CSSCTF{P12INC3_0R_P1NC3?}`**
>
> **Core Concept:** The binary is a TUI game (an infinite procedurally generated world). The player spawns at `(1,1)`, while the target beacon landmark is at `(999999, 999999)`.
> Walking to the target is impossible/penalized — you must **attach a debugger (PINCE/GDB) and modify the two `int32` coordinate variables X/Y** in RAM. Once the coordinates equal `(999999, 999999)` and the player presses `1` or `2` to "Reply", the game triggers `gen_flag()` and displays the flag on screen.
>
> The flag can also be recovered **offline** by reimplementing `gen_flag()` (an 8320-iteration state machine driven by an 8320-entry lookup table in `.rodata`) — without running the game or interacting with the terminal.

---

### 3.1. TL;DR

```
1. file prince_walk            -> ELF64 PIE, stripped, TUI game 80x24
2. strings                     -> "sandbox for PINCE Int32 memory-editing practice"
                                  PLAYER X: %d  Y: %d   /  TARGET X: 999999 Y: 999999
3. main @0x1b4e                -> Player coordinates = 2 global int32 variables:
                                  X @ base+0x17010   Y @ base+0x17014   (initialized to 1,1)
4. Landmark table @0x16ba0     -> Contains record "THE END OF THE WORLD" at (999999,999999)
                                  with flag "hidden content" = 1 -> triggers gen_flag()
5. gen_flag @0x2c52            -> Only executes when x==999999 && y==999999
                                  -> Generates 128 bytes: out[0] = len, out[1..len] = FLAG,
                                     out[len+1..len+4] = FNV-1a 32 of flag (checksum)
6. Live gameplay (intended):   gdb -p <pid> ; set {int}(base+0x17010)=999999
                                              set {int}(base+0x17014)=999999
                               -> Game shows "THE END OF THE WORLD" -> Press "1"
                               -> "Developer: "No you didn't." MISSION COMPLETE
                                   CSSCTF{P12INC3_0R_P1NC3?}"
```

---

### 3.2. File Information & Security Mitigations

```console
$ file prince_walk
prince_walk: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked,
             interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 3.2.0, stripped

$ ls -l prince_walk
-rw-rw-r-- 1 kali kali 92384 prince_walk      # 0x16900 bytes
```

| Property | Value | Significance |
|---|---|---|
| Type | `DYN` (**PIE**) | Addresses require `base` offset (retrieved from `/proc/<pid>/maps`) |
| Symbols | `stripped` | Function names stripped -> identify functions by address |
| Canary | Present (`fs:0x28` in all major functions) | Standard compiler stack protection; no stack exploitation needed |
| NX / RELRO | Full NX, Partial RELRO | Irrelevant: **no memory corruption vulnerability exists** |
| Vulnerability | None | Challenge is **RE + memory editing**, not pwn |
| Build | GCC, `BuildID` PIE | Modern Ubuntu, glibc 2.34+ |

**Section Layout (crucial because critical data tables reside here):**

| Section | Vaddr | File offset | Size | Notes |
|---|---|---|---|---|
| `.text` | `0x1340` | `0x1340` | `0x20e2` | Executable code (~8KB) |
| `.rodata` | `0x4000` | `0x4000` | `0x10e80` | Strings + **8320-entry lookup table** |
| `.eh_frame_hdr` | `0x14e80` | `0x14e80` | `0x104` | Exception handling frames |
| `.data.rel.ro` | `0x16ba0` | `0x15ba0` | `0x170` | **Landmark table + achievement table** |
| `.data` | `0x17000` | `0x16000` | `0x18` | **Player coordinates X, Y** |
| `.bss` | `0x17020` | — | `0xa0` | `stdout`, `stderr`, termios, signal flags |

> Note: `.rodata` (`vaddr 0x4000` = `offset 0x4000`), but `.data.rel.ro` (**`vaddr 0x16ba0` = `offset 0x15ba0`**) — an offset delta of `0x1000`. When parsing with Python or `xxd`, file offsets must be adjusted accordingly, otherwise `struct.error` or invalid data will occur.

---

### 3.3. Recon via `strings` — Disclosing Challenge Mechanics

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

Two decisive clues reveal the solution path:

* `A terminal sandbox for PINCE Int32 memory-editing practice.` -> **Modify `int32` variables in RAM using PINCE** (PINCE is a Linux memory editing frontend similar to Cheat Engine).
* `Attach opt-in unavailable; OS debugger rules apply.` -> The game **explicitly enables debugger attachment** via `prctl(PR_SET_PTRACER, -1)` (see Section 5).

In the tail of `strings`, an extensive block of pseudorandom-looking data (`mH>36`, `r_?q?`, `,8/b_9>`, ...) appears at the end of `.rodata` — this is the **lookup table utilized by the flag generator**, rather than an encrypted string.

---

### 3.4. Function Map (Named by Behavioral Analysis)

Locating `main` from `_start` (`lea rdi,[rip+0x7ef] # 1b4e` -> first argument to `__libc_start_main`):

| Address | Temporary Name | Functionality |
|---|---|---|
| `0x1429` | `now_sec()` | `clock_gettime(CLOCK_MONOTONIC)` -> `double` (used for 2.5s notification timer) |
| `0x1495` | `puts_line()` | `printf("\x1b[2K%s\n", s)` — clear line + print |
| `0x14c3` | **`render()`** | Render frame: map / landmark dialog / achievements screen / HUD |
| `0x1b4e` | **`main()`** | Game loop, keyboard input handling, `landmark_lookup` |
| `0x2144` | `mix64()` | splitmix64 finalizer (multiplies `0xBF58476D1CE4E5B9`, `0x94D049BB133111EB`) |
| `0x21a2` | **`world_get(x,y)`** | Procedural terrain generation based on coordinates (hash) + landmark/player/target overrides |
| `0x22d0` | `is_walkable(x,y)` | `world_get(x,y) != 'T'` |
| `0x22ff` | `clamp_add(a,b)` | Addition clamped to `[INT32_MIN, INT32_MAX]` (prevents integer overflow) |
| `0x234e` | `key_to_delta(key)` | `W=+Y`, `S=-Y`, `A=-X`, `D=+X` (case-insensitive) |
| `0x2431` / `0x252b` | `tty_raw()` / `tty_restore()` | `tcsetattr` terminal mode configuration |
| `0x25b1` | `tty_setup()` | Validates `isatty(0/1)`, `TERM != dumb`, registers signal handlers |
| `0x27e7` | `get_winsize()` | `ioctl(TIOCGWINSZ)`; warns if terminal is smaller than `58x24` |
| `0x2880` / `0x28ae` | `clear()` / `cursor()` | `\x1b[2K`, `\x1b[?25l` / `\x1b[?25h` terminal escape sequences |
| `0x28eb` | `read_key(timeout_ms)` | `poll()` + `read(0,...,1)` input reader |
| `0x29ca` | **`landmark_lookup(x,y,dirty,cnt)`** | Returns landmark record at (x,y) — **implements anti-cheat logic** |
| `0x2a86` | `nag_message(cnt)` | Input milestones (10/50/100/500/1000 inputs) -> developer nagging messages |
| `0x2b0c` | `unlock_ach(arr,rec)` | `arr[rec->ach] = 1`; if `ach == 9`, also unlocks `arr[0]` |
| `0x2b4c` | `walk_ach(arr,cnt)` | If `cnt > 99` -> unlock achievement #8 |
| `0x2b6e` | `sum10(arr)` | Sum 10 bytes -> `ACHIEVEMENTS %u / 10` |
| `0x2baa` | `ach_name(i)` | Achievement name (displays `"???"` if locked) |
| `0x2bf8` | `rol32(v,n)` | 32-bit left rotate, `n & 31` |
| `0x2c18` | `mix32(v)` | `v^=v>>16; v*=0x7feb352d; v^=v>>15; v*=0x846ca68b; v^=v>>16` |
| `0x2c52` | **`gen_flag(x,y,out,cap)`** | **Flag generator function — core problem logic** |

---

### 3.5. Runtime Mechanics (Identifying Target Variables)

#### 3.5.1. Global Variables Governing Game State

`.data` (`0x17000`, 24 bytes) contains only three items:

```console
$ objdump -s -j .data prince_walk
 17000 00000000 00000000 08700100 00000000   .........p......   # 0x17008 = &0x17008 (for __cxa_atexit)
 17010 01000000 01000000                     ........           # X = 1 , Y = 1
```

| Address | Type | Initial Value | Meaning |
|---|---|---|---|
| `base+0x17008` | `void*` | `base+0x17008` | Self-referencing pointer (destructor registration) |
| **`base+0x17010`** | `int32` | `1` | **PLAYER X** |
| **`base+0x17014`** | `int32` | `1` | **PLAYER Y** |

Inside `main`:

```asm
1c28: mov eax, DWORD PTR [rip+0x153e2]   # 17010   <-- player X
1c2e: mov DWORD PTR [rbp-0x74], eax                <-- last_rendered_X
1c31: mov eax, DWORD PTR [rip+0x153dd]   # 17014   <-- player Y
1c37: mov DWORD PTR [rbp-0x70], eax                <-- last_rendered_Y
```

And upon each WASD keystroke (after obstacle verification):

```asm
1fe0: if (dx != 0) { px = clamp_add(px, dx); last_X = px; [0x17010] = px; }
1ff6: if (dy != 0) { py = clamp_add(py, dy); last_Y = py; [0x17014] = py; }
```

-> **Modifying the two `int32` values at `base+0x17010` and `base+0x17014` instantly teleports the player anywhere.** The game maintains no encryption, hashing, or checksum protection on these variables.

#### 3.5.2. Procedural World Generation — `world_get(x,y)` @ `0x21a2`

```c
char world_get(int64_t x, int64_t y) {
    if (x == 999999 && y == 999999) return '*';                       // beacon target
    if (x >= -2 && x <= 4 && y >= -2 && y <= 4) return '.';           // safe spawn clearing
    if (within_int32_range) {                                         // avoid cast overflow
        rec = landmark_lookup(x32, y32, 0, 0);
        if (rec) return ',';                                          // tile contains landmark
    }
    uint64_t h = mix64(x + 0x9E3779B97F4A7C15) ^ mix64(y + 0xD1B54A32D192ED03);
    return "......,,TT~#"[ h % 12 ];                                  // 12 terrain characters
}
```

* Magic constant `mul 0xAAAAAAAAAAAAAAAB` + `shr 3` => `h*3`, `shl 2` => `h*12`, subtracted => **`h % 12`**.
* The table `"......,,TT~#"` @ `0x4450` provides: **6 grass, 2 dirt, 2 trees, 1 water, 1 rock** => **1/6 of all tiles are impassable trees (`T`)**.
* The player position is overlaid by `render()` with `'O'` (when `dx==0 && dy==0`), while the target is `'*'`.

#### 3.5.3. Landmark Table (`.data.rel.ro` @ `0x16ba0`) — Where the Flag Resides

Each record occupies **`0x20` bytes**. There are **2 special records** (hardcoded for the beacon coordinates) and **7 standard coordinate records**:

| # | Coordinates | Title | `hidden` | `ach` |
|---|---|---|---|---|
| special `0x16ba0` | **(999999, 999999)** | `THE END OF THE WORLD` | **1** <- invokes `gen_flag()` | 0 `The End of the World` |
| special `0x16bc0` | (999999, 999999) | `YOU... ACTUALLY... WALKED HERE?` | 0 | 9 `PINCE Tutorial Failed Successfully` |
| 0 | (69, 420) | `AN ANCIENT MONUMENT` (HONK) | 0 | 1 `Nice.` |
| 1 | (404, 404) | `ERROR: LANDMARK NOT FOUND` | 0 | 2 `404: Achievement Not Found` |
| 2 | (1337, 1337) | `A MYSTERIOUS HACKER APPEARS` ("how to modify an int32") | 0 | 3 `1337` |
| 3 | (0, 0) | `THE ORIGIN` | 0 | 4 `The Origin` |
| 4 | (-1, -1) | `WELCOME TO NEGATIVE LAND` | 0 | 5 `Welcome to Negative Land` |
| 5 | (999999, **999998**) | `A WOODEN SIGN STANDS HERE` ("Almost there.") | 0 | 6 `Almost There` |
| 6 | (9999999, 9999999) | `THE REAL END OF THE WORLD` | 0 | 7 `The Real End of the World` |

Memory layout parsed from file (accounting for `vaddr - 0x1000` file offset):

* Standard records: `+0x00 x(int32)`, `+0x04 y(int32)`, `+0x08 title(char*)`, `+0x10 desc(char*)`, `+0x18 zero`, `+0x1c ach(int32)`; `landmark_lookup` returns **`base+0x08`** (pointing to title).
* Special records: `+0x00 title(char*)`, `+0x08 desc(char*)`, `+0x10 hidden(int32)`, `+0x14 ach(int32)`; returns **`base+0x00`**.

Because `rec->hidden` is at `rec+0x10` and `rec->ach` is at `rec+0x14`, both layouts share identical access offsets in code.

Achievement array @ `0x16cc0` (`char*[10]`):

```
0  The End of the World                5  Welcome to Negative Land
1  Nice.                               6  Almost There
2  404: Achievement Not Found          7  The Real End of the World
3  1337                                8  Reject Debugger, Embrace Walking
4  The Origin                          9  PINCE Tutorial Failed Successfully
```

#### 3.5.4. "Anti-Cheat" in `landmark_lookup` @ `0x29ca` — Walking Yields NO Flag

```c
rec = NULL;
if (x == 999999 && y == 999999) {
    if (dirty /* position was modified */ != 0) return &REC_END_OF_WORLD; // 0x16ba0 (contains flag)
    if (wasd_inputs <= 1999995)                 return &REC_END_OF_WORLD; // 0x16ba0 (contains flag)
    return &REC_WALKED_HERE;                                               // 0x16bc0 (NO flag)
}
for (i = 0; i < 7; i++)                         // look up 7 standard landmarks
    if (rec[i].x == x && rec[i].y == y) return &rec[i];
return NULL;
```

* Threshold `0x1E847B = 1,999,995`. The Manhattan distance from `(1,1)` to `(999999,999999)` is `999998 + 999998 = 1,999,996` WASD keystrokes => threshold = **minimum theoretical steps minus one**. If you actually walk (even on an optimal path without dodging trees), your step counter exceeds this threshold. Conversely, memory editing leaves the counter near 0.
* Flag `dirty` (`[rbp-0x81]` in `main`) is **only set to 1 when `(X,Y)` changes without passing through WASD handlers** (`1d1e`, `1e82`). Modifying memory while the game blocks in `poll()` causes the next frame to observe coordinate divergence => sets `dirty = 1` => **always returns record `0x16ba0` (with flag)**.
* Walking manually updates `last_X/last_Y` (`1ff0`, `2006`), keeping `dirty = 0`. Upon reaching the beacon, the condition `wasd_inputs > 1999995` triggers => returns "You actually walked here" => **no flag**, awarding only achievement `PINCE Tutorial Failed Successfully`.

**Displaying the Flag on Screen** (inside `render()` @ `0x14c3`):

```c
body = rec->desc;                                     // Default: Developer dialogue
if (rec->hidden != 0 && dialog_expanded) {            // 0x173f / 0x1747
    if (gen_flag(x, y, tmp, 0x80)) body = tmp;        // 0x1750 -> 0x2c52
}
print_multiline(body);                                // Print up to 10 lines split by '
'
```

`dialog_expanded` (`[rbp-0x7f]`) is activated when **pressing `1` or `2`** while standing on a landmark where `hidden != 0` (`0x20ba`), when the HUD prompts `1 / 2: Reply | WASD: Keep walking | Q: Quit`.

-> **Intended Game Flow:** Attach debugger -> Modify `X = Y = 999999` -> Dialog `THE END OF THE WORLD` appears -> Press `1` -> `gen_flag()` runs -> Flag is printed.

---

### 3.6. Flag Generator `gen_flag()` @ `0x2c52` — Detailed Analysis

#### 3.6.1. Function Signature & Entry Gate

```asm
1750: lea rdx,[rbp-0x130]        ; 128-byte stack buffer in render()
1757: mov esi,[rbp-0x178]        ; y
175d: mov eax,[rbp-0x174]        ; x
1763: mov ecx,0x80               ; cap = 128
1768: mov edi,eax
176a: call 2c52
```

```c
int gen_flag(int32_t x, int32_t y, char *out /*rdi*/, size_t cap /*rcx*/)
```

Function prologue:

```asm
2c8b: cmp [rbp-0x1c0],0 ; je fail      ; out == NULL
2c95: cmp [rbp-0x1c8],0 ; je fail      ; cap == 0
2cb0: mov BYTE [rax],0                 ; out[0] = ' '
2cb3: cmp [rbp-0x1b4],0xf423f          ; x == 999999 ?
2cbd: jne fail
2cbf: cmp [rbp-0x1b8],0xf423f          ; y == 999999 ?
2cc9: je  continue   ; otherwise return 0
```

-> The function **fails immediately at all other coordinates**; only `(999999, 999999)` activates computation (`0xF423F = 999999`).

#### 3.6.2. Initialization: `state[16]` and `seed`

```asm
2cd5: for (i = 0; i <= 15; i++) {                        ; [rbp-0x1ac] = i
2ce1:   eax = rol32(y, (i+1) & 31)                       ; call 2bf8
2cf9:   edx = x ^ eax
2d01:   eax = (i+1) * 0x9E3779B9
2d10:   eax ^= edx
2d14:   call mix32  (2c18)
2d1f:   state[i] = eax                                   ; [rbp-0x160 + i*4]
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

#### 3.6.3. Main Loop: 8320 Iterations, Each Executing One "Opcode"

```asm
2e05: [rbp-0x1a4] = 0     ; cnt (written byte count)
2e0f: [rbp-0x1a0] = 0     ; c   (loop counter)
2e19: jmp 325b
2e1e: ; ---- loop body ----
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

Lookup Table: Located at **`.rodata+0xA80` = `0x4a80`**, consisting of 8-byte entries `{uint32 a; uint32 b;}`. With 8320 entries, the table occupies `0x10400` bytes: `0x4a80 + 0x10400 = 0x14E80`, which spans the entire remainder of `.rodata`.

The magic division: `(t * 0xFC0FC0FD) >> 45` precisely implements `t / 8320`. Since `t <= 8320*217 + 3286 = 1,811,815 < 2^21`, the expression simplifies identically to `idx = t % 8320`.

#### 3.6.4. Eight "Opcodes" (`switch (k1 & 0xFF)`)

| `k1 & 0xFF` | Address | Operation | Notes |
|---|---|---|---|
| `0x8B` | `0x2fcd` | `st[dst] = a + rol32(b, sh) + k2` | |
| `0x48` | `0x3004` | `st[dst] = rol32(b + k2, sh) ^ a` | |
| `0x31` | `0x303b` | `st[dst] = ((b + k2) ^ a) * (k2 \| 1)` | |
| `0x71` | `0x306d` | `st[dst] = a - rol32(b ^ k2, sh)` | |
| `0xB3` | `0x30a2` | `st[dst] = (a & k2) \| (~k2 & b)` | Bitwise multiplexer `k2 ? a : b` |
| `0x12` | `0x30d2` | `st[dst] = mix32(a + b + k2)` | |
| `0xFF` | `0x3101` | `st[dst] = rol32(a ^ k2, (b ^ sh) & 31)` | |
| **`0x83`** | **`0x3139`** | **EMIT 1 BYTE** | Flag emission branch |
| other | `0x31f8` | `return 0` | Any invalid opcode aborts execution |

Branch `0x83` — The sole output channel:

```asm
3139: eax = k2 >> 0x19            ; oi = (k2 >> 25) & 0x7F   -> target index 0..127
3148: if (oi > 0x7F) fail
3151: if (seen[oi] != 0) return 0        ; already written -> FAIL (overwrites forbidden)
316d: ebx = a ; call rol32(b, sh) ; ebx ^= eax
318e: byte = k2 ^ (a ^ rol32(b, sh))      ; [rbp-0x1ad]
319c: obuf[oi] = byte                     ; [rbp-0xa0 + oi]
31b0: seen[oi] = 1                        ; [rbp-0x120 + oi]
31be: cnt++                               ; [rbp-0x1a4]
31c5: edx = st[dst] ; eax = (oi + byte) * 0x45D9F3B ; edx ^= eax ; st[dst] = edx
```

* `seen[128]` tracks written byte indices: **if two iterations attempt to write the same index, the function returns 0 immediately**. The 8320 loop steps must hit **exactly 128 unique positions** (`collected = 128, collisions = 0`).
* Counter `cnt` tracks the emitted payload byte count.
* Only 1 in 8 opcodes writes data, averaging ~1 byte per 65 iterations.

#### 3.6.5. Final Verification & Result Packaging

```asm
326b: cmp [rbp-0x1a4],0x80 ; jne fail      ; must have collected EXACTLY 128 bytes
3281: n = (uint8_t)obuf[0]                 ; obuf[0] = MESSAGE LENGTH
3291: if (n == 0 || n > 0x7B) fail         ; 1..123
32a3: if (n >= cap) fail
32bc: h = 0x811C9DC5                       ; FNV-1a 32 initial hash basis
32d2: for (i = 1; i <= n; i++) {
          ch = obuf[i];
          if ((ch <= 0x1F && ch != 0x0A) || ch > 0x7E) fail;   ; printable ASCII + '
' only
          h = (h ^ ch) * 0x01000193;
      }
334a: chk = LE32(obuf[n+1..n+4])
33a3: if (chk != h) fail                   ; embedded checksum -> self-validating!
33b8: memcpy(out, obuf+1, n); out[n] = 0;  ; out = FLAG STRING
33ee: return 1
```

-> **Structure of the 128-byte Buffer:**
* `[0]`: Payload length $n$
* `[1..n]`: Flag payload string
* `[n+1..n+4]`: **Little-endian FNV-1a 32-bit hash** of the payload string

For the correct solution: $n = 72$, $	ext{chk} = 	ext{0x763CC96C}$, and recomputed FNV-1a matches $	ext{0x763CC96C}$.

---

### 3.7. Solution Approaches

#### 3.7.1. Method 1 — "Intended Approach": Attach Debugger and Edit Memory

Run the game in a terminal ($\ge 58\times 24$), then execute:

```bash
# 1) Retrieve PIE base address
pid=$(pgrep -n prince_walk)
base=$(grep prince_walk /proc/$pid/maps | head -1 | cut -d- -f1)

# 2) Patch player coordinate variables
gdb -q -batch -p $pid     -ex "set {int}(0x$base + 0x17010) = 999999"     -ex "set {int}(0x$base + 0x17014) = 999999"     -ex detach
```

> **Using PINCE:** Attach to `prince_walk` -> Scan for integer value `1` -> Walk a few steps and rescan -> Identify `base+0x17010` -> Set value to `999999`; repeat for `base+0x17014`.  
> **No root privileges required:** The game invokes `prctl(PR_SET_PTRACER, PR_SET_PTRACER_ANY, 0,0,0)` (`0x1c05`: `edi=0x59616D61`, `rsi=(unsigned long)-1`) to explicitly permit debugger attachment by any process.

Live execution transcript (running inside pty, attaching gdb, writing variables, pressing `1`):

```
--- AFTER MODIFYING X,Y -> 999999,999999 ---
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
Reality appears to have shifted.

--- AFTER PRESSING "1" ---
========================================================
THE END OF THE WORLD
Developer:
"No you didn't."
MISSION COMPLETE
CSSCTF{P12INC3_0R_P1NC3?}
========================================================
```

Viewing achievements (`H`) confirms Achievement #0 is unlocked:

```
ACHIEVEMENTS  1 / 10
01  [x]  The End of the World
02  [ ]  ???
...
```

#### 3.7.2. Method 2 — Offline Emulation: Reimplementing `gen_flag()` in Python

Complete solver script (`solve.py`):

```python
import struct
d = open('prince_walk','rb').read()
TAB = d[0x4a80:0x14e80]        # 8320 entries x 8 bytes = {uint32 a, uint32 b}
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
for c in range(0x2080):                       # 8320 iterations
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
        if not seen[oi]:                       # duplicate slot -> binary aborts
            byt = (k2 ^ (a ^ rol(b, sh))) & 0xff
            out[oi] = byt; seen[oi] = 1; cnt += 1
            state[dst] = (state[dst] ^ ((oi + byt) * 0x45d9f3b & M)) & M
    else:
        raise SystemExit('Unexpected opcode: %02x' % op)
    seed = (rol((state[i1] ^ seed) ^ state[dst] ^ k1, 9) + k2 + c*0x3c6ef372) & M

n = out[0]
h = 0x811c9dc5
for i in range(1, n+1):
    h = ((h ^ out[i]) * 0x1000193) & M
chk = struct.unpack_from('<I', out, n+1)[0]
print('n =', n, '| bytes =', cnt, '| Checksum match:', chk == h)
print('FLAG =', out[1:n+1].decode())
```

```console
$ python3 solve.py
n = 72 | bytes = 128 | Checksum match: True
FLAG = Developer:
"No you didn't."

MISSION COMPLETE

CSSCTF{P12INC3_0R_P1NC3?}
```

-> **Flag: `CSSCTF{P12INC3_0R_P1NC3?}`**

#### 3.7.3. Method 3 — Direct In-Memory Invocation of `gen_flag()` via GDB

Using `.bss` (writable, ~160 bytes) as an output buffer:

```console
$ gdb -q -batch ./prince_walk     -ex 'starti'     -ex 'tbreak *0x555555555340'     -ex 'continue'     -ex 'p ((int(*)(int,int,char*,unsigned long))(0x555555554000+0x2c52))(999999,999999,(char*)(0x555555554000+0x17030),128)'     -ex 'x/s 0x55555556b030'

Temporary breakpoint 1, 0x0000555555555340 in ?? ()
$2 = 1                                            <-- Function returned 1 (success)
0x55555556b030: "Developer:
"No you didn't."

MISSION COMPLETE

CSSCTF{P12INC3_0R_P1NC3?}"
```

* `0x555555555340` corresponds to entry point (`0x1340`) after loader initialization with default base `$base = 0x555555554000` (GDB disables ASLR by default).
* Destination buffer `base + 0x17030` resides in `.bss` (`0x17020..0x170c0`). While writing here overwrites default termios configuration, it is harmless in a `-batch` session that terminates immediately.
* Executing `starti` followed by continuing to the entry point ensures libc runtime initialization before function dispatch.

---

### 3.8. Verification & Cross-Referencing

| Step | Method | Result |
|---|---|---|
| 1 | Python algorithm reimplementation | `n=72`, collected `128` bytes, `0` collisions |
| 2 | Compare embedded FNV-1a 32 checksum with recomputed hash | `0x763CC96C == 0x763CC96C` [Passed] |
| 3 | Execute `gen_flag()` directly in memory via GDB | Returns `1`, buffer matches expected text [Passed] |
| 4 | Live test: pty + `gdb -p` coordinate patch + keystroke `1` | Dialog displays and outputs flag in HUD [Passed] |
| 5 | Inspect achievements screen (`H`) | `ACHIEVEMENTS 1 / 10`, `[x] The End of the World` [Passed] |

Automation script for live terminal emulation (used for verification):

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
base = int(open('/proc/%d/maps'%pid).read().split('
')[0].split('-')[0],16)
subprocess.run(['gdb','-q','-batch','-p',str(pid),
    '-ex','set {int}(0x%x)=999999'%(base+0x17010),
    '-ex','set {int}(0x%x)=999999'%(base+0x17014),
    '-ex','detach'], capture_output=True)
drain(0.8)
os.write(fd, b'1')          # Reply -> invokes gen_flag() and prints flag
print(re.sub(r'\[[0-9;?]*[a-zA-Z]','', drain(1.0).decode('utf-8','replace')))
os.write(fd, b'q'); time.sleep(0.3); os.kill(pid, 9)
```

---

### 3.9. Key Takeaways & Pitfalls

1. **Section Alignment Offset:** `.data.rel.ro` differs by `0x1000` from its virtual address (`vaddr 0x16ba0` <-> `offset 0x15ba0`). Binary readers parsing tables must adjust file offsets accordingly.
2. **Lookup Table Placement:** The 8320-entry table resides directly at `.rodata` offset `0x4a80` (`0x4a80 + 8320*8 = 0x14E80`). Although `strings` renders it as junk, it constitutes the execution microcode of `gen_flag()`.
3. **32-Bit Arithmetic Masking:** When reimplementing in Python, apply `& 0xffffffff` across all additions, multiplications, and shifts. Unmasked overflows will diverge the internal RNG state and ruin output generation.
4. **Magic Division Optimization:** The instruction pattern `mul 0xFC0FC0FD; shr 45` calculates `t % 8320`, while `mul 0xAAAAAAAAAAAAAAAB; shr 3` implements `% 12` in `world_get`.
5. **Deduplication Constraints:** The generator fails if duplicate writes hit the same slot. Reimplementations must respect slot occupancy checks rather than overwriting existing values.
6. **Self-Validating Checksum:** The embedded FNV-1a checksum provides an internal oracle to verify emulation integrity without running the binary.
7. **Anti-Walk Penalty:** Walking manually requires $\ge 1,999,996$ steps. Exceeding the threshold triggers the non-flag dialogue.
8. **Semantic Clues in Strings:** Strings such as `"sandbox for PINCE Int32 memory-editing practice"` and `"Attach opt-in unavailable"` outline the entire vulnerability model prior to disassembly.
9. **Coordinate Divergence Detection:** `landmark_lookup` tracks whether coordinates changed through WASD input handlers or via external memory writes.
10. **Challenge Nomenclature:** The name `prince_walk` and the flag `P12INC3_0R_P1NC3?` playfully highlight that memory editing with **PINCE** is the intended solution rather than manual traversal.

---

### 3.10. Appendices

**A. Landmark / Achievement Strings in Memory:**

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

**B. Key Constants Reference:**

| Constant | Value | Usage |
|---|---|---|
| Beacon Coordinates | `999999` (`0xF423F`) | `landmark_lookup`, `gen_flag`, `world_get` |
| Manual Walk Threshold | `0x1E847B` = 1,999,995 (minimum steps - 1) | `landmark_lookup` |
| Generator Iterations | `0x2080` = 8320 | `gen_flag` |
| Lookup Table Size | `8320 * 8` bytes @ `0x4a80` | `gen_flag` |
| Buffer Capacity | `0x80` = 128 | `render` -> `gen_flag` |
| Golden Ratio Constants | `0x9E3779B9` / `0x9E3779B97F4A7C15` / `0x3C6EF372` | `state`, `seed`, PRNG |
| `k2` Salt | `0x6A09E667` (SHA-256 $H_0$) | `gen_flag` |
| Seed Salt | `0xA4093822` (SHA-256 $H_3$) | `gen_flag` |
| FNV-1a 32 Parameters | Offset `0x811C9DC5`, Prime `0x01000193` | Verification checksum |
| `mix64` Constants | `0xBF58476D1CE4E5B9`, `0x94D049BB133111EB` | `world_get` |
| `mix32` Constants | `0x7FEB352D`, `0x846CA68B` | `gen_flag` |
| `PR_SET_PTRACER` | `0x59616D61`, arg `-1` | Debugger attach authorization |

**C. Procedural Terrain Palette (`0x4450`):**
`"......,,TT~#"` (12 characters => `h % 12`):
`'.'` x 6 grass; `','` x 2 dirt; `'T'` x 2 trees (impassable); `'~'` water; `'#'` rock.
Overrides: `'O'` = player, `'*'` = beacon `(999999,999999)`, `','` = landmark site.

---

## 4. Challenge 4: FLAPPY BOARD (RE / Client-Server, Replay Validation)

> **Flag: `CSSCTF{birdddd}`**
>
> **Core Concept:** The binary is an X11 game (Flappy Bird) that **contains no embedded flag**. To obtain the flag, the player must **submit a valid replay** — a series of flap tick timestamps — to the flight-control server at `http://34.116.80.78:8765`, successfully clearing all 3 challenge rounds (10 / 20 / 30 points) within a 20-minute session deadline. Because the server **re-simulates** the replay using identical client physics calculations, one must accurately reverse-engineer the physics engine (`0x6cfe`), RNG generator (`0x6b88`), and pipe generation (`0x6bc6`), then reimplement them in Python to generate automated winning replays.
>
> **The primary pitfall lies in HTTP semantics rather than physics:** `POST /api/attempt` creates a brand-new attempt with a newly generated seed, whereas `GET /api/attempt` queries the status of the ongoing attempt while retaining the original seed. Invoking POST twice re-seeds the active attempt on the server, causing **every valid replay to be rejected with `error=Replay collides with an obstacle.`** — an error message disguised as a collision failure. See Section 9.

---

### 4.1. TL;DR

```
1. file flappy_board      -> ELF64 PIE, stripped, libX11 + libcurl, hardcoded server
                             http://34.116.80.78:8765 (0x55f8 in .rodata)
2. strings -n5            -> Discloses the full API contract between client and server:
                             /api/attempt  /api/practice  /api/practice/check  /api/complete
                             "round=%d&wait_ms=%d&ticks=%d&score=%d&flaps="
                             "sequence=%d&ticks=%d&final=%d&score=%d&flaps="
3. Function Map:
     0x6c0f init_world(seed)          -> y=0xf000 (240px), 5 pipes x=(i*270+1040)<<8,
                                         gapY = 125 + rng()%231
     0x6b88 xorshift32(x)             -> Global RNG
     0x6bc6 gap_y(world)              -> 125 + rng()%231
     0x6cfe world_step(world, flap)   -> Complete physics engine, 1/256 px units, 60Hz
     0x5bdf main                      -> State machine + X11 event loop + frame timing
4. Reimplement physics in Python      -> Simulator (sim.py / ctl.py)
5. Verification #1 (Numeric Oracle):  POST /api/practice then POST /api/practice/check
                                      -> Server responds with "verified_score" simulated server-side
                                      -> Perfect match (ticks 329->1pt, 425->2pt, 1100->9pt, 1197->10pt)
6. Verification #2 (Live Client):     Run binary under Xvfb, read world via /proc/<pid>/mem,
                                      write flap flag (base+0x16f01) for automated playback
                                      -> 0.0 px discrepancy across all milestones -> bit-exact physics
7. Protocol Semantics:
       POST /api/attempt                 (No auth, empty body) -> token + round + seed + ...
       GET  /api/attempt   Bearer <token>                       -> Current attempt status (same seed)
       POST /api/complete  Bearer <token> round/wait_ms/ticks/score/flaps
                                          -> Next round, or round=4 containing flag
8. Round 1/2/3 submissions -> Round 4 response returns flag: CSSCTF{birdddd}
```

---

### 4.2. File Information & Runtime Environment

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

Standard Linux PIE binary with NX enabled. No memory corruption exploitation is required; solving relies on reverse engineering the physics engine and communicating accurately over the protocol.

Section `.rodata` (`0x8000`-`0x8a88`) contains UI strings, formatting templates, and a jump table at `0x8504` (10 `int32` relative offsets):

| State `b288` | Handler | Screen Description |
|---|---|---|
| 0 | `0x35b8` | FLIGHT SCHOOL (Main menu: `[ENTER] PRACTICE`, `[F2] BEGIN THE THREE-ROUND CHALLENGE`) |
| 1 | `0x3a79` | Practice mode active |
| 2 | `0x3814` | Practice results (`VERIFIED SCORE %d` / `SCORE NOT VERIFIED`) |
| 3 | `0x3653` | Departure countdown: `DEPARTURE DELAY %02d : %02d` + `ROUND %d / %d POINTS REQUIRED` |
| 4 | `0x3797` | Ready prompt: `CLEARED FOR TAKEOFF` / `[ ENTER ] START ROUND` |
| 5 | `0x3a79` | Challenge mode active |
| 6 | `0x3814` | Crash screen: `UNSCHEDULED LANDING` / `[ ENTER ] TRY AGAIN` |
| 7 | `0x3926` | Victory screen: `ROUND CLEARED` / `[ ENTER ] CONTINUE` |
| 8 | `0x39a3` | Final victory: `ALL THREE ROUNDS CLEARED` |
| 9 | `0x3a1d` | Expiration screen: `SESSION EXPIRED` / `The server deadline has passed.` |

Function `is_playing()` @ `0x2e93` returns `true` if and only if `state == 1 || state == 5`, controlling whether the main loop advances simulation steps (`0x6a5a`).

---

### 4.3. Function Map (Behavioral Analysis)

| Address | Function Name | Role & Implementation |
|---|---|---|
| `0x2b75` | `now(clk_id)` | `clock_gettime(clk_id)` -> `double` seconds; uses clock 1 (MONOTONIC) and 6 (BOOTTIME) |
| `0x2bee` `0x2c6b` `0x2d22` `0x2dac` | Render helpers | Rectangle drawing, text rendering, XSetForeground, XCopyArea |
| `0x2ec2` | `render()` | Full UI renderer, dispatches via jump table at `0x8504` based on `b288` |
| `0x3e4a` | `kv_extract(resp,key,out,maxlen)` | Parses query parameters from URL-encoded response, decodes `+` to space and invokes `curl_easy_unescape` |
| `0x4134` | `kv_int(resp,key)` | Converts `kv_extract` result via `strtol`, returns `-1` on error |
| `0x41ed` | `http(url, body, tokenbuf, resp)` | libcurl wrapper: sets headers (`Content-Type`, `Authorization: Bearer %s`), timeouts, and output buffers. **Sets `CURLOPT_POSTFIELDS` only when `body != NULL`** (meaning `body == NULL` executes a **GET** request, while non-NULL executes a **POST**) |
| `0x463b` | `http_path(path, body, out)` | Invokes `41ed` using global token buffer `0x17020` |
| `0x477e` | `ensure_token()` | If token exists, returns; otherwise executes **POST `/api/attempt`**, verifies 64-character token, `round==1`, and `target==10` |
| `0x4714` | `set_deadline(resp)` | Sets session deadline `b030 = now(6) + remaining_seconds` |
| `0x4673` | `reset_world()` | Reinitializes world state: `init_world(b024)`, zeroes tick counters, generates initial flap key `'a' + rng(b028) % 26` |
| `0x5032` | `parse_attempt(resp)` | Parses round parameters (`round`, `seed`, `target`, `wait_seconds`). On round 4, extracts `flag` and sets `b2f4=4, b288=8` |
| `0x5259` | `begin_attempt()` | Calls `ensure_token()`, then executes **GET `/api/attempt`** -> `parse_attempt` |
| `0x52d1` | `submit_round()` | Formats payload `round=%d&wait_ms=%d&ticks=%d&score=%d&flaps=...`, executes **POST `/api/complete`**, passes response to `parse_attempt` |
| `0x491a` | `start_practice()` | Executes POST `/api/practice`, creates temporary replay record, invokes `reset_world()`, sets `state=1` |
| `0x4b54` | `verify_practice()` | Reads replay, chunks into 6000-tick segments, submits POST `/api/practice/check` with relative flap ticks |
| `0x58a2` | `on_key(keysym)` | Handles navigation keys (ENTER/F1/F2/F3); sets flap trigger `16f01` if key matches current dynamic flap character |
| `0x5a7c` | `write_snapshot()` | Writes frame snapshot `--snapshot file.ppm` (P6) via `XGetImage` |
| `0x6b88` | `rng(x*)` | xorshift32 PRNG |
| `0x6bc6` | `gap_y(world)` | Computes obstacle opening: `125 + rng() % 231` |
| `0x6c0f` | `init_world(world, seed)` | Clears world struct (`0x54` bytes), initializes RNG with seed, sets spawn position and 5 pipe obstacles |
| `0x6cfe` | `world_step(world, flap)` | Advances world simulation by 1 tick; returns `true` upon scoring |
| `0x5bdf` | `main` | Event loop: pumps X11 events, manages 60Hz fixed timestep, steps physics, renders frames |

---

### 4.4. Global Memory Layout

| Address | Type | Meaning |
|---|---|---|
| `0xb288` | `int` | **State ID** (see Section 1) |
| `0xb2a0` | `struct` | **World structure** (`0x54` bytes) |
| `0xb2f4` | `int` | Active round (`0`=practice, `1..3`=challenge, `4`=completed) |
| `0xb2f8` | `int` | Required round target score |
| `0xb2fc` | `int` | Departure delay `wait_seconds` |
| `0xb280` | `double` | **Departure delay countdown timer** (decrements in real time; triggers state 4 upon expiration) |
| `0xb030` | `double` | Absolute session deadline (`now(BOOTTIME) + remaining_seconds`) |
| `0xb024` | `u32` | **Seed** received from server |
| `0xb020` | `int` | Active **flap key** (`'a' + rng() % 26`, shifts after each point) |
| `0xb028` | `u32` | Dedicated RNG state for key shuffling (initialized to `0x000e0301`) |
| `0xb038` | `int` | Previous flap key (prevents consecutive repeats) |
| `0xb300` | `int[12000]` | **Flap tick array** (`flaps`) |
| `0x16e80` | `int` | Recorded flap count (exceeding `0x2edf` flags "Replay is too large") |
| `0x16e88` | `double` | Fixed timestep accumulator (subtracts `1/60` per physics tick) |
| `0x16e90` | `double` | Flap key grace timer (`ticks/60 + 0.25`) |
| `0x16ea0` | `FILE*` | Temporary file handle for practice replays |
| `0x16ea8` | `u64` | Practice tick counter |
| `0x16eb0` / `0x16eb4` | `u8` / `int` | Practice active flag / final practice score |
| `0x16f01` | `u8` | **Flap trigger flag** (consumed and cleared each tick) |
| `0x16f20` | `u8[256]` | Keyboard state array indexed by `keysym & 0xff` |
| `0x17020` | `char[64+]` | Session Bearer **token** |
| `0x171a0` | `char[256]` | Error and notification string buffer |
| `0x172a0` | `Display*` | Active X11 display connection |

**World Struct Layout (`0xb2a0`, `0x54` bytes):**

| Offset | Type | Field Description |
|---|---|---|
| `+0x00` | `int` | Bird vertical position `y` (**1/256 px units**) |
| `+0x04` | `int` | Vertical velocity `vy` (1/256 px per tick) |
| `+0x08` | `int` | Current score |
| `+0x0c` | `int` | Elapsed ticks in current round |
| `+0x10` | `u32` | PRNG state (xorshift32) |
| `+0x14` | `u8` | Crash status flag (`crashed`) |
| `+0x18 + 12*i` | `int, int, u8` | Pipe obstacle $i$: horizontal position `x` (8.8 fixed-point), `gapY` (px), `scored` flag |

---

### 4.5. Lifecycle of a Challenge Round

```
[State 0] FLIGHT SCHOOL
   |-- F2 -> begin_attempt():  POST /api/attempt -> Retrieves token
                               GET  /api/attempt -> Retrieves round, seed, target, wait_seconds
                               reset_world(seed) -> Sets state = 3 if wait > 0, else state = 4
[State 3] DEPARTURE DELAY: b280 (double) decrements in real-time; upon expiration -> State 4
[State 4] CLEARED FOR TAKEOFF
   |-- ENTER -> reset_world(seed) -> Sets state = 5
[State 5] IN PLAY (is_playing: executes world_step(flap) at 60Hz):
     - on_key(): If pressed key matches b020 (flap key) -> sets 16f01 = 1
     - main loop:
         1. Checks 16f01: if set, records flaps[16e80++] = world.ticks (LOGGED BEFORE STEP)
         2. Executes world_step(world, flap) -> increments ticks; checks scoring boundaries
         3. If score incremented -> rotates flap key via rng(b028)
         4. If world.crashed -> sets state = 6 (crash) or state = 2 (practice)
         5. If score >= target -> sets state = 7
[State 7] ROUND CLEARED
   |-- ENTER -> submit_round(): POST /api/complete with round/wait_ms/ticks/score/flaps
              -> Server response advances to next round (state 3) or final victory (state 8) with flag
```

Two critical rules emerge from this flow:
1. **Flap Timestamps:** `flaps[i]` logs the exact tick `world.ticks` before calling `world_step`. The tick is zero-based, and an action at tick $t$ affects the transition from tick $t$ to $t+1$.
2. **Submitted Ticks:** The submitted `ticks` parameter must match the exact tick when `score` reached `target`. Furthermore, `wait_ms` must be set to at least `wait_seconds * 1000`.

---

### 4.6. Reverse Engineering the Physics Simulation (`0x6cfe`, `0x6c0f`, `0x6b88`, `0x6bc6`)

#### 4.6.1. PRNG `0x6b88` — xorshift32

```c
uint32_t rng(uint32_t *s) {
    uint32_t x = *s;
    x ^= x << 13;  x ^= x >> 17;  x ^= x << 5;
    return *s = x;
}
```

#### 4.6.2. Obstacle Opening Generation `0x6bc6` — `125 + rng() % 231`

The compiler replaces `% 231` with an optimized multiplication sequence (`mul 0x1BB4A405 / shr 32 / sub / shr 1 / add / shr 7`). We replicate the exact integer arithmetic:

```python
def rng_mod231(x):
    edx = x & 0xFFFFFFFF
    hi  = ((edx * 0x1bb4a405) & 0xFFFFFFFFFFFFFFFF) >> 32
    ecx = ((edx - hi) & 0xFFFFFFFF) >> 1
    eax = ((hi + ecx) & 0xFFFFFFFF) >> 7
    return (edx - (eax * 0xe7 & 0xFFFFFFFF)) & 0xFFFFFFFF
```

#### 4.6.3. World Initialization `0x6c0f`

```c
memset(world, 0, 0x54);
world->rng   = seed ? seed : 1;
world->y     = 0xF000;                       /* 61440 in 1/256 units -> 240.0 px */
for (i = 0; i < 5; i++) {
    world->pipes[i].x    = (i * 0x10E + 0x410) << 8;   /* 1040, 1310, 1580, 1850, 2120 px */
    world->pipes[i].gapY = 125 + rng() % 231;          /* 125..355 px */
    world->pipes[i].scored = 0;
}
```

#### 4.6.4. Physics Tick `0x6cfe`

```c
int world_step(World *w, int flap) {
    if (w->crashed || w->ticks > 0x8C9F /*35999*/) { w->crashed = 1; return 0; }
    if (flap) w->vy = -1724;          /* 0xFFFFF944 */
    w->vy += 67;                      /* Gravity: 0x43 */
    if (w->vy > 2048) w->vy = 2048;   /* Terminal velocity: 0x800 */
    w->y += w->vy;
    w->ticks++;
    for (i = 0; i < 5; i++) w->pipes[i].x -= 717;     /* Pipe velocity: 0x2CD = 2.8 px/tick */
    if (w->y <= 3072 /*0xC00*/ || w->y > 119807 /*0x1D3FF*/) w->crashed = 1;

    int before = w->score;
    for (i = 0; i < 5; i++) {                          /* Collision and scoring pass */
        Pipe *p = &w->pipes[i];
        if (p->x > 30720 && p->x <= 54271) {         /* Horizontal collision bounds: 120..212 px */
            int lo = (p->gapY - 87) << 8, hi = (p->gapY + 87) << 8;      /* Half-opening: 87 px */
            if (!((w->y - 3071) > lo && (w->y + 3071) < hi))             /* Bird margin: ±75.00 px */
                w->crashed = 1;
        }
        if (!p->scored && p->x <= 30719) {           /* Score threshold: <= 119.99 px */
            p->scored = 1;
            if (!w->crashed) w->score++;
        }
    }
    for (i = 0; i < 5; i++) {                          /* Pipe recycling pass */
        Pipe *p = &w->pipes[i];
        if (p->x < -17408 /* -68 px */) {
            int maxx = 0;
            for (j = 0; j < 5; j++) if (w->pipes[j].x > maxx) maxx = w->pipes[j].x;
            p->x = maxx + 69120;                     /* Pipe spacing: 270 px */
            p->gapY = 125 + rng() % 231;
            p->scored = 0;
        }
    }
    return w->score != before;
}
```

**Physics Constants Reference Table (all values in 1/256 px units):**

| Constant | Hex Value | Meaning |
|---|---|---|
| `-1724` | `0xFFFFF944` | Velocity applied upon flapping |
| `67` | `0x43` | Downward gravity per tick |
| `2048` | `0x800` | Terminal downward velocity |
| `717` | `0x2CD` | Pipe horizontal translation (2.8 px/tick = 168 px/s) |
| `3072` / `119807` | `0xC00` / `0x1D3FF` | Floor / Ceiling collision limits (12 px / 468 px) |
| `30720` / `54271` | `0x7800` / `0xD3FF` | Pipe horizontal collision window (120..212 px) |
| `30719` | `0x77FF` | Scoring boundary threshold ($\le 119.99$ px) |
| `3071` | `0xBFF` | Bird half-box margin -> Safe band is `gapY ± 75.0039` px |
| `87` | `0x57` | Half-height of gap opening |
| `-17408` / `69120` | `-0x4400` / `0x10E00` | Despawn boundary / Pipe respawn spacing (270 px) |
| `125`..`355` | `0x7D`..`0x163` | Range of opening center `gapY` |
| `0xF000` | | Initial bird vertical position (240.0 px) |
| `1040` / `270` | `0x410` / `0x10E` | First obstacle offset / Obstacle horizontal spacing |
| `35999` | `0x8C9F` | Maximum permitted ticks per round |
| `12000` | `0x2EDF` | Maximum permitted flaps per submission |
| `1/60` | `0x3F91111111111111` | Fixed timestep duration (seconds) |

**Derived Control Strategy:**
* Each flap imparts $pprox 76.8$ px of vertical lift before velocity reaches 0 (after $pprox 24.7$ ticks).
* Safe tolerance is $\pm 75$ px around `gapY`, while hover amplitude is only $pprox \pm 38$ px.
* A simple bang-bang control rule suffices: calculate `aim = (next_pipe.gapY) + 38 px`, and command a flap whenever `y >= aim`.

---

### 4.7. HTTP Protocol Specification

| Endpoint | HTTP Method | Body Content | Response Format |
|---|---|---|---|
| `/api/attempt` | **POST** (body `""`) | — | `token=<64hex>&round=1&seed=<u32>&remaining_seconds=1200&limit_seconds=1200&target=10&wait_seconds=180` |
| `/api/attempt` | **GET** (Bearer) | — | `round=1&seed=3102798517&remaining_seconds=1199&limit_seconds=1200&target=10&wait_seconds=180` (**same seed**) |
| `/api/complete` | POST (Bearer) | `round=<r>&wait_ms=<wait*1000>&ticks=<t>&score=<target>&flaps=<t0,t1,...>` | `round=2&seed=...` ... `round=4&...&flag=CSSCTF%7B..%7D` |
| `/api/practice` | POST (Bearer) | `""` | `token=..&seed=..&verified_score=0&remaining_seconds=..&limit_seconds=..` |
| `/api/practice/check` | POST (Bearer) | `sequence=<i>&ticks=<chunk>&final=<0/1>&score=<s>&flaps=<...>` | `verified_score=<n>&sequence=<i>&complete=1&cheated=<0/1>&remaining_seconds=..` |

Challenge round requirements scale dynamically:
* Round 1: `target = 10, wait = 180s`
* Round 2: `target = 20, wait = 360s`
* Round 3: `target = 30, wait = 600s`

**Server Error Codes & Failure Rules:**

| Error Response | Trigger Condition |
|---|---|
| `error=Start a new attempt first.` | Missing, invalid, or expired session token |
| `error=You cheated. You are banned from this game.` | `score != target` (submission before completing goal) |
| `error=Virtual waiting timer has not completed.` | `wait_ms < wait_seconds * 1000` |
| `error=Replay collides with an obstacle.` | Server-side re-simulation detects crash or ceiling/floor breach |
| `error=Invalid flap replay.` | Malformed flap array (e.g., negative ticks, non-monotonic values) |
| `error=Out-of-range ticks` | `ticks` exceeds maximum limit ($> 35,999$, matching `0x8C9F`) |
| `error=Round order mismatch. Refresh attempt status.` | Submitting an earlier round after advancing |
| HTTP **410** | Session expired; client switches to State 9 |

---

### 4.8. Solution Methodology

#### 4.8.1. Step 1 — Building the Simulator (`ctl.py`)

Port the physics routine from Section 5 directly into Python. Implement the control law:
`aim = next_pipe.gapY + 38px`, triggering a flap when `y >= aim`.
Validation across 300 random seeds for all 3 score tiers yielded a **100% success rate**, with completion ticks matching theory ($pprox 1196.6$ ticks for 10 points).

#### 4.8.2. Step 2 — Validation via Numeric Oracle (`/api/practice/check`)

Rather than guessing physics parameters, we use the server's practice evaluation endpoint as an oracle:

```python
# Session initialization: POST /api/attempt -> token; POST /api/practice -> practice_token, seed
body = f"sequence=0&ticks={tc}&final=1&score={claim}&flaps=" + ",".join(map(str, flaps))
# Returns: verified_score=10&complete=1&cheated=0
```

Oracle verification results across independent test runs:

| Submitted Ticks | Python Model Score | Server `verified_score` |
|---|---|---|
| 329 | 1 point | `verified_score=1` |
| 425 | 2 points | `verified_score=2` |
| 1100 | 9 points | `verified_score=9` |
| 1197 | 10 points | `verified_score=10`, `cheated=0` |
| (Idle baseline) | Crashes at tick 43, 0 points | `verified_score=0`, `cheated=1` |

-> **The RNG sequence, pipe generation, collision thresholds, and scoring gates match the server implementation with bit-level precision.**

#### 4.8.3. Step 3 — Validation via Live Client (`/proc/<pid>/mem`)

To verify tick timing and replay formatting against the official binary:

```python
env = dict(os.environ, DISPLAY=":99")
p = subprocess.Popen(["flappy_board", "--server", "http://127.0.0.1:8123"], env=env)
BASE = int(open(f"/proc/{p.pid}/maps").readline().split("-")[0], 16)
mem  = open(f"/proc/{p.pid}/mem", "rb+", buffering=0)
mem.seek(BASE + 0x16f01); mem.write(b"") # Emulate flap keystroke
```

Comparing trajectory vertical coordinates at ticks 300, 600, and 900 between live memory and the Python simulator demonstrated a **0.0 px discrepancy**, proving mathematical equivalence.

#### 4.8.4. Step 4 — Complete Automated Solver

Full solver implementation (`flappy_solver.py`):

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
        if flap: flaps.append(g.ticks)     # Record BEFORE advancing step
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
    st, r = req("/api/attempt", "POST")                      # 1) CREATE attempt
    print("POST /api/attempt ->", st, r)
    token = kv(r, "token")
    st, r = req("/api/attempt", "GET", token=token)          # 2) QUERY status (RETAINS seed)
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

Execution output:

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

Total replay computation time spanned $pprox 6483$ simulation ticks ($pprox 108$ seconds in game time), completed within seconds over the network.

---

### 4.9. Failed Approaches & Dead Ends (Post-Mortem)

Prior to discovering the `POST`/`GET` ambiguity on `/api/attempt`, submissions consistently failed with `Replay collides with an obstacle.` despite the practice oracle confirming 100% physics accuracy. The following failed hypotheses were systematically tested and eliminated:

| Disproven Hypothesis | Testing Methodology | Outcome |
|---|---|---|
| Single-tick timing skew (`flaps ±1`, `ticks ±1`) | Offset window tests from -2 to +3 | Failed: Obstacle collision error persisted |
| Pipe pre-roll during departure delay | Tested pre-roll offsets $W \in [0, 180000]$ ticks | Failed: All rejected |
| Pipe spatial phase shift | Scanned shift window $s \in [-96, +59]$ | Failed |
| Real-time enforcement before submission | Delayed submission by 25+ seconds | Failed |
| Virtual wait time mismatch | Tested `wait_ms = 0 / 1` | Note: Disclosed `Virtual waiting timer has not completed.` |
| Tick upper limit violation | Tested `ticks = 36865` | Note: Disclosed `Out-of-range ticks` (ceiling matches `0x8C9F`) |

The breakthrough arrived by observing that `/api/practice/check` accepted identical flap trajectories that `/api/complete` rejected. Because the physics simulation was proven correct, the failure had to stem from session management.

---

### 4.10. The Core Trap: `POST` vs `GET` on `/api/attempt`

#### 4.10.1. Discovery via Logging Reverse Proxy

Because server-side packet captures were unavailable, we utilized the client's `--server` argument whitelist (`strcmp(url, "http://34.116.80.78:8765") == 0` or prefixes `https://`, `http://127.0.0.1:`, `http://localhost:`) to route official game client traffic through a local logging proxy.

Recorded traffic capture:

```
[   4.89] --> POST /api/attempt
        hdrs={'Accept': '*/*', 'Content-Type': 'application/x-www-form-urlencoded'}
[   5.32] <-- 200 token=d090c5d9...&round=1&seed=3102798517&...&target=10&wait_seconds=180
[   6.41] --> GET  /api/attempt                      <========== GET, NOT POST!
        hdrs={'Authorization': 'Bearer d090c5d9...'}
[   6.84] <-- 200 round=1&seed=3102798517&remaining_seconds=1199&...      (SAME seed)
[  27.14] --> POST /api/complete
        body=round=1&wait_ms=180000&ticks=1197&score=10&flaps=28,29,80,81,...
[  27.77] <-- 200 round=2&seed=2635025733&...&target=20&wait_seconds=360
```

#### 4.10.2. Disassembly Analysis

Function `0x41ed` configures `CURLOPT_POSTFIELDS` **only when the body pointer is non-NULL**:

```asm
4497: cmp QWORD PTR [rbp-0x340], 0x0     ; arg2 = body
449f: je  44ce                            ; body == NULL -> Omits POSTFIELDS -> Defaults to GET
44a1: ... CURLOPT_POSTFIELDS ...          ; body != NULL -> Sets POST
44d8: call curl_easy_perform
```

Inspecting calling conventions:
* `0x477e ensure_token`: Passes `rsi = ""` (a valid pointer to an empty string) => executes **POST** (generates attempt).
* `0x5259 begin_attempt`: Passes `mov esi, 0x0` (NULL pointer) => executes **GET** (retrieves current attempt parameters without modifying seed).

If an automated solver mistakenly issues `POST /api/attempt` twice:
1. POST #1 creates Attempt A with seed $S_A$.
2. POST #2 creates Attempt B with seed $S_B$. However, server-side session race conditions invalidate the replay state, ensuring any trajectory generated for $S_B$ collides with ghost obstacles => returns `Replay collides with an obstacle.`

Switching the second query to a standard `GET` maintains session synchronization, allowing all three rounds to succeed immediately.

---

### 4.11. Final Verification & Results

* Executing the solver across multiple independent runs with distinct seeds confirmed the static flag: `CSSCTF{birdddd}` (URL-decoded from `CSSCTF%7Bbirdddd%7D`).
* The flag is issued directly by the challenge server upon clearing Round 3.
* Triangulated verification:
  1. Server evaluation matches Python simulator (`verified_score`).
  2. Memory extraction via `/proc/<pid>/mem` showed a 0.0 px delta against official client rendering.
  3. Client-generated replays passed server validation seamlessly.

---

### 4.12. Key Takeaways & Pitfalls

1. **Decouple Physics from Protocol:** In networked reverse engineering challenges, isolate the game engine from transport semantics. Physics models can be proven mathematically, whereas protocol bugs often hide behind misleading error strings.
2. **Leverage Intermediate Oracles:** Endpoints like `/api/practice/check` serve as ground-truth evaluators to validate game simulation logic before tackling multi-round challenges.
3. **Inspect Process Memory for Verification:** Running GUI binaries headless via `Xvfb` and inspecting internal structs through `/proc/<pid>/mem` allows fine-grained, tick-by-tick trajectory verification.
4. **Take Advantage of Built-in Whitelists:** Reverse-proxying official clients through debug ports exposes undocumented request flows and header combinations.
5. **Treat Error Responses as Specifications:** Server error messages outline exact parameter boundaries (`Virtual waiting timer has not completed`, `Out-of-range ticks`, etc.).
6. **Mind HTTP Method Semantics:** `POST` versus `GET` on identical URL paths often differentiates object creation from state inspection.
7. **Maintain Bit-Exact Arithmetic:** When reimplementing assembly math, reproduce optimized magic constants (e.g., `% 231` via `0x1BB4A405`) and enforce 32-bit integer boundaries on every step.

---

### 4.13. Appendices

#### 4.13.1. Quick Reproduction Commands

```console
$ file flappy_board && strings -n 5 flappy_board | head -120
$ r2 -q -c "e scr.color=0; aaa; afl" flappy_board | grep -v sym.imp
$ objdump -d -M intel flappy_board > fb.asm      # Inspect 0x6cfe / 0x6c0f / 0x6b88 / 0x6bc6 / 0x41ed
$ python3 flappy_solver.py                        # Solves all 3 rounds and extracts flag
```

#### 4.13.2. Live Client Execution & Headless Capture

```console
$ Xvfb :99 -screen 0 1024x900x24 &
$ DISPLAY=:99 ./flappy_board                       # Manual play
$ DISPLAY=:99 ./flappy_board --snapshot out.ppm    # Captures P6 screenshot of current state
$ DISPLAY=:99 ./flappy_board --server http://127.0.0.1:8123   # Routes traffic via debug proxy
```

#### 4.13.3. Challenge Configuration Constants (`/api/attempt`)

```
round=1  seed=<random u32>   remaining_seconds=1200  limit_seconds=1200
target=10   wait_seconds=180      (Round 2: 20/360, Round 3: 30/600)
```

#### 4.13.4. Attack Surface Analysis

* Snapshot functionality (`--snapshot`) extracts PPM buffers locally via `XGetImage` without network side effects.
* Header formatting (`Authorization: Bearer %s`) utilizes `snprintf` bounded to 64 hexadecimal characters, preventing header injection.
* Endpoint `/api/practice` bypasses round gating and departure delays, providing a sandbox for algorithm verification.
