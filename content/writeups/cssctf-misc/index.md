---
title: "[CSSCTF] Miscellaneous"
date: '2026-10-02'
description: Comprehensive writeups for diverse MISC challenges in CSSCTF spanning Graph Theory, Computational Geometry, and Custom VM Reverse Engineering.
categories: [CSSCTF, Misc]
tags: [cssctf, misc, graph-theory, geometry, vm-re]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] MISC Challenges Writeup Collection

**Author:** k0z1l  
**Category:** MISC / Graph Theory / Computational Geometry / Custom VM Reverse Engineering / Modular Arithmetic / Elliptic Curves  
**Flag Format:** `CSSCTF{...}`

---

## 1. A Star Trail 1

### 1.1. Challenge Description & Given Problem
> *Polaris Logistics has an urgent delivery that needs to be transported across the star system. As the pilot of this V.I.P. (Very Important Package), you need to begin planning your trip from Earth to Lancer-RXKRD immediately. Remember to follow company protocol; you have to follow the designated paths between planet/oids to comply with interplanetary law. If you can’t deliver the V.I.P. in under 25 days, you might as well forget about your end of year bonus.*
>
> *- Polaris Logistics.*
>
> *Submit your flag using the by combining the first character of each planet/oid in your path together and then adding the number of days your path takes (with 1 decimal place) onto the end, separated by a dash. E.g. if your path from A-PLANET TO B-PLANET was PAPA, OSCAR, SIERRA, TANGO, 2025PLANET and took exactly 5 days, the flag would be `CSSCTF{POST2-5.0}`*
>
> **Attached Resource:** Star map image `A_Star_Trail.png`.

---

### 1.2. Graph Modeling from Star Map

Analyzing the star map image `A_Star_Trail.png`:
- **Start Node:** `EARTH` (bottom-left corner).
- **Destination Node:** `LANCER-RXKRD` (top-right corner).
- **Graph:** Consists of 13 vertices and 20 bidirectional edges weighted by the travel time (in days) indicated on each dashed connection:

| Route Between 2 Celestial Bodies | Travel Time (Days) |
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

### 1.3. Optimal Pathfinding Algorithm (Dijkstra / A*)

The challenge requires: *"deliver the V.I.P. in under 25 days"*. Applying Dijkstra's shortest path algorithm:

The optimal route found:
$$\text{EARTH} \xrightarrow{10.7} \text{PALLUS-XA} \xrightarrow{1.8} \text{12-PUCK-8} \xrightarrow{0.4} \text{JIP-REIA} \xrightarrow{5.5} \text{TAYLOR-3489} \xrightarrow{2.6} \text{LANCER-RXKRD}$$

**Total Travel Time:**
$$10.7 + 1.8 + 0.4 + 5.5 + 2.6 = \mathbf{21.0 \text{ days}}$$

*(A travel duration of 21.0 days represents the global shortest path across the network, strictly fulfilling the requirement of $< 25$ days).*

---

### 1.4. Flag Generation Rules & Format Pitfall Analysis

The phrasing *"your path from Earth to Lancer-RXKRD"* was specified by the author as the **intermediate waypoints** located between the departure point `Earth` and the destination `Lancer-RXKRD`:
- **P**ALLUS-XA $\rightarrow$ Extract character `P`
- **1**2-PUCK-8 $\rightarrow$ Extract character `1`
- **J**IP-REIA $\rightarrow$ Extract character `J`
- **T**AYLOR-3489 $\rightarrow$ Extract character `T`

Concatenating intermediate waypoint characters: `P1JT`  
Appending travel time with 1 decimal place: `-21.0`  
$\implies$ Standard Flag: **`CSSCTF{P1JT-21.0}`**

*(Note: Including origin Earth and destination Lancer-RXKRD produces EP1JTL, but the platform validator strictly accepts intermediate waypoints `P1JT-21.0`).*

---

### 1.5. Annotated Exploit Script (Python)

```python
#!/usr/bin/env python3
"""A Star Trail 1 Solution Script

Purpose: Build the planetary network graph from the star map and apply
Dijkstra's algorithm to find the shortest delivery route under 25 days.
"""

import networkx as nx

# List of all edges (routes) and weights (travel days) extracted from the image
edges = [
    # Routes originating from Earth
    ("EARTH", "BACONITE", 5.0),
    ("EARTH", "PALLUS-XA", 10.7),
    # Routes from Baconite & C3810
    ("BACONITE", "C3810-ASQUAX-8", 2.1),
    ("BACONITE", "BARAT-BARAT", 9.8),
    ("C3810-ASQUAX-8", "BARAT-BARAT", 6.3),
    # Routes from Barat-Barat & Pallus-XA
    ("BARAT-BARAT", "JIP-REIA", 1.4),
    ("BARAT-BARAT", "PALLUS-XA", 1.4),
    ("PALLUS-XA", "12-PUCK-8", 1.8),
    ("PALLUS-XA", "HEMENS-RAJA-2", 2.5),
    # Routes from 12-Puck-8 & Jip-Reia
    ("JIP-REIA", "12-PUCK-8", 0.4),
    ("JIP-REIA", "TAYLOR-3489", 5.5),
    ("12-PUCK-8", "HEMENS-RAJA-2", 3.6),
    # Routes from Hemens-Raja-2
    ("HEMENS-RAJA-2", "TAMMY ASTEROID", 3.7),
    ("HEMENS-RAJA-2", "10-49-SLATER-4090", 6.0),
    # Routes leading to destination Lancer-RXKRD
    ("TAYLOR-3489", "TAMMY ASTEROID", 3.2),
    ("TAYLOR-3489", "LANCER-RXKRD", 2.6),
    ("TAMMY ASTEROID", "LANCER-RXKRD", 10.1),
    ("TAMMY ASTEROID", "VERGINON", 2.8),
    ("10-49-SLATER-4090", "VERGINON", 7.5),
    ("VERGINON", "LANCER-RXKRD", 8.5),
]

# Initialize undirected graph
G = nx.Graph()
for u, v, w in edges:
  G.add_edge(u, v, weight=w)

# Find shortest path using Dijkstra's algorithm
path = nx.shortest_path(
    G, source="EARTH", target="LANCER-RXKRD", weight="weight"
)
total_days = nx.shortest_path_length(
    G, source="EARTH", target="LANCER-RXKRD", weight="weight"
)

# Output detailed itinerary
print("[+] Optimal Route:", " -> ".join(path))
print(f"[+] Total Time: {total_days:.1f} days")

# Extract first character of intermediate waypoints (omitting EARTH and LANCER-RXKRD)
intermediate_nodes = path[1:-1]
waypoint_chars = "".join(node[0] for node in intermediate_nodes)

# Format flag: CSSCTF{WAYPOINTS-DAYS}
flag = f"CSSCTF{{{waypoint_chars}-{total_days:.1f}}}"
print(f"[+] Correct Flag: {flag}")
```

### 1.6. Flag
$$\mathbf{CSSCTF\{P1JT-21.0\}}$$

---

## 2. A Star Trail 2

### 2.1. Challenge Description & Context
> *Congrats on your first, successful delivery cadet! Now that you've got a small taste of logistics and routing, take a gander at this larger galactic map. You've got quite a few more stops this time but thankfully, you won't have to be put to cryosleep now that you've gained your lightspeed vehicle licence. Today, your task is to make it from planetary body `S0jRxc` to planetary body `yRJyDb`. Chart out a path and don't be late; we expect you to make it there in a reasonable time. You'll have to do a bit of work to make sense of everything since our database is stored as Markdown files where each planet links to its neighbours with a wikilink but it should be easy work once you get used to it.*
>
> *Report to command your flightpath by taking the first letter of the ID of your first stop (S0jRxc), the second letter of your second stop, the third letter of your third stop, and so on, wrapping back around to the first letter on your 7th, 13th, 19th, etc. stop. Your flightpath flag is case sensitive. For example: if your path from ASTART to ZFINAL was BCDEFG, hijklm, NOPQRS, tuvwxy, ZFINAL the flag would be CSSCTF{ACjQxL}*
>
> *- Polaris Logistics.*
>
> **Attached Resource:** `map` directory containing 10,000 Markdown files.

---

### 2.2. Reconnaissance of 10,000 Celestial Bodies

The directory `E:\CSSCTF\map` contains exactly **10,000 `.md` files**, each representing a celestial body with a 6-character alphanumeric identifier.

Standard structure of each Markdown file:
```markdown
# S0jRxc

Coords: 1.937346, 1.274873

[[1T5eN4]]
[[1T5WDS]]
[[SwjzJx]]
[[NygbEQ]]
[[L4649b]]
```
- Header line: Planet ID (`S0jRxc`).
- `Coords: X, Y`: 2D spatial coordinates in $[0, 100] \times [0, 100]$.
- `[[...]]` lines: Directly connected adjacent bodies (Wikilink format).

---

### 2.3. Computational Geometry Graph Modeling (Delaunay & Voronoi)

1. **Graph Characteristics:**
   - 10,000 points distributed across the 2D plane.
   - The connections between points form a **Delaunay Triangulation**.
2. **Departure & Destination:**
   - Origin: `S0jRxc` at $(1.937346, 1.274873)$ (bottom-left corner).
   - Destination: `yRJyDb` at $(99.893125, 99.361715)$ (top-right corner).
   - Straight-line Euclidean distance:
     $$D_{\text{straight}} = \sqrt{(99.89 - 1.94)^2 + (99.36 - 1.27)^2} \approx 138.62$$
3. **Edge Weights:**
   - When traveling between celestial bodies $u(x_u, y_u)$ and $v(x_v, y_v)$, the cost corresponds to Euclidean distance:
     $$w(u, v) = \sqrt{(x_u - x_v)^2 + (y_u - y_v)^2}$$

---

### 2.4. Shortest Path & Modulo 6 Rotation Rule

1. **Pathfinding (A\* / Dijkstra):**
   - On Euclidean-weighted graphs, **Dijkstra** (or **A\*** with Euclidean heuristic) discovers the optimal path consisting of exactly **136 waypoints** (135 hops) with a total path length of approximately **$144.93$** (closely following the ideal straight line $138.62$).
2. **Modulo 6 Flag Extraction Rule:**
   - The prompt specifies:
     - Stop 1 ($i=0$): take character 1 (index 0).
     - Stop 2 ($i=1$): take character 2 (index 1).
     - Stop 3 ($i=2$): take character 3 (index 2).
     - Stop 4 ($i=3$): take character 4 (index 3).
     - Stop 5 ($i=4$): take character 5 (index 4).
     - Stop 6 ($i=5$): take character 6 (index 5).
     - Stop 7 ($i=6$): wrap back to index 0 ($6 \pmod 6 = 0$).
     - Stop 13 ($i=12$): wrap back to index 0 ($12 \pmod 6 = 0$).
   - General formula for the $i$-th waypoint ($i \in [0, 135]$):
     $$\text{Char}_i = \text{NodeID}_i[i \pmod 6]$$

---

### 2.5. Decoding the Hidden Message in the Flag String

Concatenating all 136 extracted characters produces a case-sensitive string with clear academic meaning:

```text
STARmaPdElAUNaYTriaNGulATioNDIjKStrAVoRonoiGrAPHSdetERmiNaNTcolineaRALGOrITHmSLeEandsCHAcHTERTANgEnTSmErGECirCuMcIrcLEcOnVEXhuLLgeOMeTRy
```

Decomposing the string reveals the architectural pillars designed by the author:
- `STAR` `maP`: Star map
- `dElAUNaY` `TriaNGulATioN`: Delaunay Triangulation
- `DIjKStrA`: Dijkstra's shortest path algorithm
- `VoRonoi` `GrAPHS`: Voronoi diagram (geometric dual of Delaunay triangulation)
- `detERmiNaNT`: Determinant (used in circumcircle testing)
- `colineaR`: Collinear point predicate
- `ALGOrITHmS`: Algorithms
- `LeEandsCHAcHTER`: Classic divide-and-conquer algorithm by D.T. Lee & B.J. Schachter (1980) for constructing Delaunay triangulations
- `TANgEnTS`: Common tangents between point sets
- `mErGE`: Merge step in divide-and-conquer
- `CirCuMcIrcLE`: Circumcircle of Delaunay triangles
- `cOnVEXhuLL`: Convex hull
- `geOMeTRy`: Computational Geometry

---

### 2.6. Annotated Exploit Script (Python)

```python
#!/usr/bin/env python3
"""A Star Trail 2 Solution Script

Purpose: Parse 10,000 Markdown files, construct the Euclidean-weighted
Delaunay graph, and find the Dijkstra shortest path to build the 136-char flag.
"""

import math
import os
import re
import networkx as nx

# Directory path containing 10,000 Markdown files
map_dir = r"E:\CSSCTF\map"

coords = {}  # 2D coordinates: coords[node_id] = (x, y)
adj = {}  # Neighbor list: adj[node_id] = [neighbor_ids...]

print("[*] Parsing data from 10,000 Markdown files...")
for f in os.listdir(map_dir):
  if f.endswith(".md"):
    node = f[:-3]  # Filename without .md serves as celestial body ID
    file_path = os.path.join(map_dir, f)

    with open(file_path, "r", encoding="utf-8") as fp:
      content = fp.read()

    # Extract coordinates: Coords: x, y
    coord_match = re.search(r"Coords:\s*([0-9.]+),\s*([0-9.]+)", content)
    if coord_match:
      coords[node] = (float(coord_match.group(1)), float(coord_match.group(2)))

    # Extract Wikilink neighbors: [[Neighbor]]
    neighbors = re.findall(r"\[\[(.*?)\]\]", content)
    adj[node] = neighbors

print(f"[+] Loaded {len(coords)} nodes and their link system.")

# Build undirected Euclidean-weighted graph
print("[*] Constructing computational geometry graph...")
G = nx.Graph()
for u, nbrs in adj.items():
  for v in nbrs:
    if u in coords and v in coords:
      # Calculate Euclidean distance between u and v
      dist = math.hypot(
          coords[u][0] - coords[v][0], coords[u][1] - coords[v][1]
      )
      G.add_edge(u, v, weight=dist)

# Identify origin and destination
start_node = "S0jRxc"
target_node = "yRJyDb"

print(
    f"[*] Executing Dijkstra pathfinding from {start_node} to {target_node}..."
)
path = nx.shortest_path(
    G, source=start_node, target=target_node, weight="weight"
)
path_dist = nx.shortest_path_length(
    G, source=start_node, target=target_node, weight="weight"
)

print(f"[+] Optimal route found with {len(path)} waypoints.")
print(f"[+] Total Euclidean distance: {path_dist:.4f}")

# Extract flag characters via Modulo 6 rule: char = node[i % 6]
flag_chars = []
for i, node in enumerate(path):
  char_idx = i % 6
  flag_chars.append(node[char_idx])

flag = f"CSSCTF{{{''.join(flag_chars)}}}"
print(f"[+] Final Flag (136 characters): {flag}")
```

### 2.7. Flag
$$\mathbf{CSSCTF\{STARmaPdElAUNaYTriaNGulATioNDIjKStrAVoRonoiGrAPHSdetERmiNaNTcolineaRALGOrITHmSLeEandsCHAcHTERTANgEnTSmErGECirCuMcIrcLEcOnVEXhuLLgeOMeTRy\}}$$

---

## 3. A Star Trail 3

### 3.1. Challenge Description & Data Corruption Context
> *Polaris Logistics has seemingly had a database corruption in the star maps of Sector-A89J3. With routing and deliveries unable to be completed for the foreseeable future, you, cadet, have been tasked with fixing this problem. Otherwise, you can consider yourself fired. Thankfully, all of the planetary body entries are still there, only their paths to neighbouring bodies have been destroyed. We can't seem to remember what rule we used to generate our routes but you can presumably find patterns in your previous postal appointments. Once you've got those records restored, get a move on with the next delivery from iJ2ZcO to pJk9vy to prove it.*
>
> *Report to command your flightpath by taking the first letter of the ID of your first stop (iJ2ZcO), the second letter of your second stop, the third letter of your third stop, and so on, wrapping back around to the first letter on your 7th, 13th, 19th, etc. stop. Your flightpath flag is case sensitive. For example: if your path from ASTART to ZFINAL was BCDEFG, hijklm, NOPQRS, tuvwxy, ZFINAL the flag would be CSSCTF{ACjQxL}. (The flag for this challenge may not be easily recognisable)*
>
> *- Polaris Logistics.*
>
> **Attached Resource:** Archive `map2.zip` containing 25,000 Markdown files in `map/`.

**Summary of Requirements & Core Challenge:**
1. The star map database of Sector-A89J3 suffered severe corruption: all neighbor links were erased and replaced with the string `[CORRUPTED]`.
2. Celestial body metadata (ID and 2D spatial coordinates) remained intact.
3. The solver must deduce the routing generation rule from "previous postal appointments" (A Star Trail 2) to reconstruct all interplanetary routes across the star system.
4. Once restored, determine the shortest path from origin `iJ2ZcO` to destination `pJk9vy`.
5. Form the flag using the Modulo 6 cyclical extraction rule: Stop 1 extracts index 0, Stop 2 extracts index 1, ..., Stop 7 wraps to index 0.
6. The prompt warns: *(The flag for this challenge may not be easily recognisable)* – meaning the flag will not form readable English words as in part 2, but rather a pseudo-random hash-like string.

---

### 3.2. Reconnaissance of 25,000 Disconnected Celestial Bodies ([CORRUPTED])

Inspecting `map2/map` confirms exactly **25,000 `.md` files** corresponding to 25,000 planets and asteroids in Sector-A89J3.

File structure:
```markdown
# iJ2ZcO

Coords: 0.347730, 97.041287


[CORRUPTED]
```

- **Identifier:** 6-character alphanumeric string (e.g., `iJ2ZcO`, `pJk9vy`).
- **Spatial Coordinates:** `Coords: X, Y` spanning $[0, 100] \times [0, 100]$.
- **Adjacency Data:** All previous `[[...]]` neighbor links are completely replaced with `[CORRUPTED]`.

---

### 3.3. Clue Analysis & Graph Reconstruction via Delaunay Triangulation

#### 3.3.1. Tracing the Rule from A Star Trail 2
The key prompt clue:
> *"We can't seem to remember what rule we used to generate our routes but you can presumably find patterns in your previous postal appointments."*

Reviewing the decrypted flag from **A Star Trail 2**:
```text
STARmaPdElAUNaYTriaNGulATioNDIjKStrAVoRonoiGrAPHSdetERmiNaNTcolineaRALGOrITHmSLeEandsCHAcHTERTANgEnTSmErGECirCuMcIrcLEcOnVEXhuLLgeOMeTRy
```
Core keywords include:
- `dElAUNaY TriaNGulATioN`: Delaunay Triangulation
- `VoRonoi GrAPHS`: Voronoi diagram
- `detERmiNaNT colineaR`: In-circle determinant predicate
- `LeEandsCHAcHTER`: Lee-Schachter $\mathcal{O}(N \log N)$ divide-and-conquer Delaunay triangulation algorithm

#### 3.3.2. Proof of Consistency
To verify the hypothesis that Polaris Logistics routes are universally generated via **Delaunay Triangulation**, we ran an independent verification on the 10,000-point dataset of challenge 2:
- Original edge count in challenge 2: $29,972$ edges.
- Edge count generated by `scipy.spatial.Delaunay`: $29,972$ edges.
- Edge set intersection: $29,972$ edges.
- Set difference: $0$ edges ($\text{orig} \setminus \text{delaunay} = \emptyset$ and $\text{delaunay} \setminus \text{orig} = \emptyset$).

$\implies$ **Conclusion:** The routing rule across Polaris Logistics maps is strictly **Delaunay Triangulation** over 2D Euclidean coordinates.

#### 3.3.3. Mathematical Foundations of Delaunay Triangulation
For point set $P = \{p_1, p_2, \dots, p_n\}$ in $\mathbb{R}^2$:
1. **Empty Circumcircle Property:** Triangle $\Delta(p_i, p_j, p_k)$ belongs to the Delaunay triangulation if and only if no point $p_m \in P$ lies strictly within its circumcircle:
   $$\det \begin{pmatrix} x_i & y_i & x_i^2 + y_i^2 & 1 \\ x_j & y_j & x_j^2 + y_j^2 & 1 \\ x_k & y_k & x_k^2 + y_k^2 & 1 \\ x_m & y_m & x_m^2 + y_m^2 & 1 \end{pmatrix} \le 0$$
2. **Max-Min Angle Property:** Delaunay triangulations maximize the minimum angle among all triangles, avoiding sliver triangles and connecting physically closest spatial neighbors.

---

### 3.4. Graph Modeling & Shortest Path Finding (Dijkstra)

#### 3.4.1. Modeling Parameters
Applying Delaunay triangulation via `scipy.spatial.Delaunay` to 25,000 points:
- **Vertices ($|V|$):** $25,000$ celestial bodies.
- **Reconstructed Edges ($|E|$):** $74,970$ undirected bidirectional routes.
- **Edge Weight ($w(u, v)$):** Real Euclidean distance:
  $$w(u, v) = \sqrt{(x_u - x_v)^2 + (y_u - y_v)^2}$$

#### 3.4.2. Origin and Destination Locations
- Origin: `iJ2ZcO` at $(0.347730, 97.041287)$ (near top-left corner).
- Destination: `pJk9vy` at $(99.781280, 0.935324)$ (near bottom-right corner).
- Straight-line Euclidean distance:
  $$D_{\text{straight}} = \sqrt{(99.781280 - 0.347730)^2 + (0.935324 - 97.041287)^2} \approx 138.2713$$

#### 3.4.3. Dijkstra Search Results
Running **Dijkstra** on the reconstructed graph:
- **Waypoints in optimal route:** $196$ nodes ($195$ hops).
- **Total travel distance:** $\mathbf{144.047367}$.
- **Stretch Factor:**
  $$\frac{D_{\text{Dijkstra}}}{D_{\text{straight}}} = \frac{144.047367}{138.2713} \approx 1.0418$$
  The path length deviates by only $\approx 4.18\%$ from an ideal straight line, confirming the optimal planar nature of the Delaunay network.

---

### 3.5. Modulo 6 Flag Extraction & Uniqueness Verification

#### 3.5.1. Extraction Mechanics
Extracting characters via Modulo 6 cyclic indexing:
$$\text{Char}_i = \text{NodeID}_i[i \pmod 6], \quad \forall i \in \{0, 1, 2, \dots, 195\}$$

Representative stops:
- **Stop 1** ($i = 0$): `iJ2ZcO` $\rightarrow$ Index $0 \pmod 6 = 0 \implies \mathbf{i}$
- **Stop 2** ($i = 1$): `gtHQlo` $\rightarrow$ Index $1 \pmod 6 = 1 \implies \mathbf{t}$
- **Stop 3** ($i = 2$): `c4rFDK` $\rightarrow$ Index $2 \pmod 6 = 2 \implies \mathbf{r}$
- **Stop 4** ($i = 3$): `7Yw6HF` $\rightarrow$ Index $3 \pmod 6 = 3 \implies \mathbf{6}$
- **Stop 5** ($i = 4$): `Rvn5GS` $\rightarrow$ Index $4 \pmod 6 = 4 \implies \mathbf{G}$
- **Stop 6** ($i = 5$): `ZvaZ98` $\rightarrow$ Index $5 \pmod 6 = 5 \implies \mathbf{8}$
- **Stop 7** ($i = 6$): `jXhE4Y` $\rightarrow$ Index $6 \pmod 6 = 0 \implies \mathbf{j}$ *(wraps to 0)*
- ...
- **Stop 195** ($i = 194$): `hcoXhZ` $\rightarrow$ Index $194 \pmod 6 = 2 \implies \mathbf{o}$
- **Stop 196** ($i = 195$): `pJk9vy` $\rightarrow$ Index $195 \pmod 6 = 3 \implies \mathbf{9}$

Concatenating all 196 characters produces the string starting with `itr6G8...` and ending with `...peo9`.

#### 3.5.2. Uniqueness Verification
To prevent ambiguity from multiple potential shortest paths, we verified uniqueness via `nx.all_shortest_paths(G, source='iJ2ZcO', target='pJk9vy', weight='weight')`:
- Result: Exactly **1 unique shortest path**.
- Because coordinates are 64-bit floating-point numbers, the probability of two distinct paths yielding identical total floating-point lengths bit-for-bit is approximately $0$.

---

### 3.6. Annotated Exploit Script (Python)

```python
#!/usr/bin/env python3
"""A Star Trail 3 Solution Script

Purpose:
1. Parse coordinates of 25,000 celestial bodies with corrupted link data.
2. Reconstruct interplanetary network via Delaunay Triangulation.
3. Find unique shortest path from 'iJ2ZcO' to 'pJk9vy' via Dijkstra.
4. Extract 196-character flag via Modulo 6 cyclical indexing.
"""

import math
import os
import re
import networkx as nx
import numpy as np
from scipy.spatial import Delaunay

# Directory path containing 25,000 Markdown files
map_dir = r"E:\CSSCTF\map2\map"
coords = {}

print("[*] Reading coordinates from 25,000 Markdown files...")
for f in os.listdir(map_dir):
  if f.endswith(".md"):
    node = f[:-3]
    with open(os.path.join(map_dir, f), "r", encoding="utf-8") as fp:
      text = fp.read()
    coord_match = re.search(r"Coords:\s*([0-9.]+),\s*([0-9.]+)", text)
    if coord_match:
      coords[node] = (float(coord_match.group(1)), float(coord_match.group(2)))

print(f"[+] Successfully loaded {len(coords)} celestial bodies into memory.")

start_node = "iJ2ZcO"
end_node = "pJk9vy"

print(f"[*] Origin:      {start_node} -> {coords.get(start_node)}")
print(f"[*] Destination: {end_node} -> {coords.get(end_node)}")

# Convert coordinate dictionary to 2D NumPy array
nodes = list(coords.keys())
points = np.array([coords[n] for n in nodes])

# Reconstruct graph network using Delaunay Triangulation
print("[*] Executing Delaunay triangulation (Scipy Delaunay)...")
tri = Delaunay(points)

# Build undirected Euclidean graph
print("[*] Initializing NetworkX graph and assigning Euclidean weights...")
G = nx.Graph()
for simplex in tri.simplices:
  for i in range(3):
    for j in range(i + 1, 3):
      u = nodes[simplex[i]]
      v = nodes[simplex[j]]
      dist = math.hypot(
          coords[u][0] - coords[v][0], coords[u][1] - coords[v][1]
      )
      G.add_edge(u, v, weight=dist)

print(
    f"[+] Delaunay graph complete: {G.number_of_nodes()} nodes,"
    f" {G.number_of_edges()} edges."
)

# Search optimal route using Dijkstra
print(
    f"[*] Running Dijkstra pathfinding from {start_node} to {end_node}..."
)
path = nx.shortest_path(
    G, source=start_node, target=end_node, weight="weight"
)
path_dist = nx.shortest_path_length(
    G, source=start_node, target=end_node, weight="weight"
)

print(f"[+] Optimal route found with {len(path)} waypoints.")
print(f"[+] Total Euclidean distance: {path_dist:.6f}")

# Extract flag characters via Modulo 6 rule: char = node[i % 6]
flag_chars = []
for i, node in enumerate(path):
  char_idx = i % 6
  flag_chars.append(node[char_idx])

flag_str = "".join(flag_chars)
flag = f"CSSCTF{{{flag_str}}}"

print("\n" + "=" * 80)
print(f"[+] ACCURATE FLAG:\n{flag}")
print("=" * 80)
```

### 3.7. Flag
$$\mathbf{CSSCTF\{itr6G8jMTXbOjCmClmMElZxQLqSXqnf53z1Z73liVas3ypn5CJZ4ZGlqZo6Fkc2onoJ6vx5SLfqqEyBotfjpxskQknpUgK9VMfBsFqzc0iEHDbMvv1hwXAo4U1NaimtTt9esb6mskMdUkbgBAjg3TTS1UeTSvf7LFZR0Vxf8KOgkzxHmvO0ifOFaVnwNgwUqpeo9\}}$$

---


## 4. The Astrolabe Overwrite (Ouroboros Singularity)

### 4.1. Challenge Description & Context

> **Challenge Description:**  
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
> **Attached Archive:** Archive containing `nexus_core`, `Dockerfile`, `flag.txt`.

#### 4.1.1. Context & Clue Analysis
The narrative outlines several concrete technical requirements:
1. *"The council's instruction consumes and rewrites its own memory"*: The custom virtual machine (VM) employs self-modifying code and dynamic permutation table mutation.
2. *"Three rings of the Astrolabe"*: The program enforces 3 validation stages:
   - **Ring 1 (The first gate):** Instruction permutation field.
   - **Ring 2 (The lattice):** Coupled wave recurrence across a circular lattice.
   - **Ring 3 (The orbital horizon):** Projective coordinates / Elliptic Curve point validation.
3. *"Quantum decay window"*: Strict constraints on total execution cycle count.

---

### 4.2. Architecture Analysis of Ouroboros VM (`nexus_core`)

#### 4.2.1. Binary Reconnaissance
Inspecting the executable `nexus_core`:
```bash
$ file nexus_core
nexus_core: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, stripped
```

Extracting diagnostic strings via `strings`:
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

These messages reveal:
- Cycle budget constraints: `112 <= cycles <= 128`.
- Passing the checks avoids `HARMONIC FAULT` and triggers `[+] TELEMETRY STABILIZED. OVERWRITING SYSTEM MASTER KEY...`, prompting the server to print `flag.txt`.

#### 4.2.2. Main Execution Flow (Offset `0x1100`)
1. **State Memory Allocation:** Allocates a 536-byte stack structure at `rsp+0x20`.
2. **I/O Setup & Timeout:** Disables buffering via `setvbuf` and arms `alarm(45)`.
3. **Dynamic Epoch Beacon Generation:**
   - Obtains time via `time(NULL)`.
   - Computes beacon value modulo prime $65521$ ($0xfff1$): $\text{BEACON} = \text{epoch} \pmod{65521}$.
   - Stores `BEACON` at State offset `0x12`.
4. **Network Exchange:**
   - Prints: `[SYNC] RELAY EPOCH BEACON: 0x%04X\n`.
   - Prompts: `Transmitting raw telemetry vector (hex max 512 bytes): `.
   - Reads up to 1025 characters from `stdin` via `fgets`.
   - Converts pairs of hex characters via `sscanf("%02x")` into byte array `MEM` (up to 512 bytes, starting at offset `0x1c`).
5. **VM Dispatch:** Calls VM dispatcher at offset `0x13e0`.

#### 4.2.3. Ouroboros VM State Memory Layout
Layout mapping of the 536-byte VM State structure:

| Offset | Size | Field Name | Description | Initial Value |
| :---: | :---: | :--- | :--- | :---: |
| `0x00` | 2 bytes | `R0` | 16-bit Register 0 | `0x0000` |
| `0x02` | 2 bytes | `R1` | 16-bit Register 1 | `0x0000` |
| `0x04` | 2 bytes | `R2` | 16-bit Register 2 | `0x0000` |
| `0x06` | 2 bytes | `R3` | 16-bit Register 3 | `0x0000` |
| `0x08` | 2 bytes | `PC` | Program Counter | `0x0000` |
| `0x0a` | 1 byte  | `K` | Rolling Key | `0x5a` |
| `0x0c` | 4 bytes | `CYCLES` | Execution Cycle Counter | `0` |
| `0x10` | 1 byte  | `RUNNING`| VM Execution Status Flag | `1` (Active) |
| `0x12` | 2 bytes | `BEACON` | Dynamic Server Beacon | $\text{time} \pmod{65521}$ |
| `0x14` | 8 bytes | `P[0..7]`| Opcode Permutation Table | `[0x10, 0x20, 0x30, 0x35, 0x40, 0x50, 0x7f, 0xff]` |
| `0x1c` | 512 bytes | `MEM` | Instruction Bytecode Memory | User payload |

---

### 4.3. Self-Modifying Bytecode Mechanism & Permutation Table

#### 4.3.1. Fetch - Decode - Execute Pipeline
Each instruction spans exactly **4 bytes** in `MEM` at `PC`:
1. **Fetch Parameters:**
   - `b0 = MEM[PC]`, `b1 = MEM[PC+1]`, `b2 = MEM[PC+2]`, `b3 = MEM[PC+3]`.
   - `PC += 4`.
   - `dst = b1 & 3`.
   - `src = b2 & 3`.
   - `imm16 = (b2 << 8) | b3`.
2. **Dynamic Opcode Decoding via Permutation Table:**
   $$\text{idx} = (b_0 \oplus K) \ \& \ 7$$
   $$\text{opcode} = P[\text{idx}]$$
3. **Rolling Key Update:**
   $$K_{\text{new}} = (31 \times K + (R_0 \ \& \ 0xff)) \ \& \ 0xff$$
   *(Crucial detail: The value of $R_0$ is sampled before the instruction body executes).*
4. **Instruction Execution** (per instruction set table below).
5. **Self-Mutation of Permutation Table:**
   After executing a standard instruction, the VM swaps two entries in $P$:
   $$\operatorname{swap}(P[R_0 \ \& \ 7], \ P[R_1 \ \& \ 7])$$
   Cycle checks verify: If `CYCLES > 128`, the VM triggers `[!] THERMAL DETONATION: Cycle budget breached.` and terminates.

#### 4.3.2. Ouroboros VM Instruction Set

| Opcode | Mnemonic | Syntax | Execution Semantics | Cycles |
| :---: | :---: | :--- | :--- | :---: |
| `0x10` | **LOADI** | `LOADI R[dst], imm16` | $R[\text{dst}] = \text{imm16} \pmod{65521}$ | $+1$ |
| `0x20` | **MOV** | `MOV R[dst], R[src]` | $R[\text{dst}] = R[\text{src}]$ | $+1$ |
| `0x30` | **ADD** | `ADD R[dst], R[src]` | $R[\text{dst}] = (R[\text{dst}] + R[\text{src}]) \pmod{65521}$ | $+2$ |
| `0x35` | **SUB** | `SUB R[dst], R[src]` | $R[\text{dst}] = (R[\text{dst}] - R[\text{src}] + 65521) \pmod{65521}$ | $+2$ |
| `0x40` | **XOR** | `XOR R[dst], R[src]` | $R[\text{dst}] = R[\text{dst}] \oplus R[\text{src}]$ | $+2$ |
| `0x50` | **JMP** | `JMP offset` | $PC = PC + (\text{int8})b_3$ | $+3$ |
| `0x7f` | **HALT**| `HALT` | Triggers 3-ring verification, stops VM | $+10$ |
| `0xff` | **ILLEGAL**| N/A | Triggers `[!] ILLEGAL INSTRUCTION: Core purged.` | Terminated |

#### 4.3.3. Controlling Opcode Generation
The table $P$ is always a permutation of the 8 distinct opcodes:
$$\{0x10, 0x20, 0x30, 0x35, 0x40, 0x50, 0x7f, 0xff\}$$
Therefore, regardless of permutations, **every valid opcode always exists at some index $\text{idx} \in [0, 7]$ within $P$**.  
To emit a desired opcode at the current step:
$$b_0 = K \oplus \operatorname{index\_of}(P, \text{desired\_opcode})$$
Importantly, if we enforce $R_0 \equiv R_1 \pmod 8$ (e.g., keeping both equal to 0), the swap $P[0] \leftrightarrow P[0]$ leaves the permutation table $P$ **completely invariant**.

---

### 4.4. Deciphering the Three Rings of the Astrolabe

The Astrolabe verification logic resides in the handler for opcode `0x7f` (offsets `0x1590` to `0x1960`).

```
          [Opcode 0x7f: HALT & VERIFY]
                       │
              CYCLES += 10
                       │
         112 <= CYCLES <= 128 ? ──── No ─────> [COHERENCE / THERMAL DETONATION]
                       │ Yes
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
            Satisfies All ? ──────── No ─────> [HARMONIC FAULT]
                       │ Yes
                       ▼
         [+] TELEMETRY STABILIZED!
              Read & print flag.txt
```

#### 4.4.1. Ring 1: Quantum Decay Window & Beacon Normalization
1. **Cycle Window Verification:**
   ```asm
   1593: add eax, 0xa        ; cycles += 10
   1599: cmp eax, 0x6f       ; cycles <= 111 (i.e., < 112)
   159c: jbe 1b28            ; -> "[!] COHERENCE FAULT: Quantum state cold (cycles < 112)."
   15a2: cmp eax, 0x80       ; cycles > 128
   15a7: ja  1b12            ; -> "[!] THERMAL DETONATION: Core runaway (cycles > 128)."
   ```
   Thus, accumulated cycles before executing `0x7f` must satisfy:
   $$102 \le \text{cycles}_{\text{before\_halt}} \le 118$$
2. **Beacon Offset Subtraction:**
   Reads `BEACON` from `state+0x12` and calculates 4-element array $T$:
   $$T_i = (R_i - \text{BEACON}) \pmod{65521}, \quad \forall i \in \{0, 1, 2, 3\}$$

#### 4.4.2. Ring 2: Nonlinear Waves & Coupled Lattice Recurrence
1. **Nonlinear Wave Transformation $U$:**
   For each $T_j$ ($j = 0, 1, 2, 3$):
   - $v_j = (T_j \oplus 0x5aa5) \pmod{65521}$
   - $w_j = v_j^{17} \pmod{65521}$ (modular exponentiation with prime exponent $17$)
   - $U_j = (\operatorname{rol}_{16}(w_j, 7) \oplus 0x1337) \pmod{65521}$
2. **Coupled Lattice Cross-Sum $X$:**
   $$\begin{cases}
   X_0 = (T_1 + U_0) \pmod{65521} \\
   X_1 = (T_2 + U_1) \pmod{65521} \\
   X_2 = (T_3 + U_2) \pmod{65521} \\
   X_3 = (T_0 + U_3) \pmod{65521}
   \end{cases}$$
3. **Deciphering Verification Checks (GCC Division Optimization Pattern):**
   The disassembly contains:
   ```asm
   imul r13, 0x58862fdccdf01111
   add  r13, 0xf04814392f59c642
   cmp  0x1000f00e10d2f, r13
   jb   harmonic_fault
   ```
   This is GCC's optimized pattern for testing:
   $$(E \pmod{65521}) == C$$
   - Multiplier $r14 = \mathtt{0x58862fdccdf01111} = 65521^{-1} \pmod{2^{64}}$.
   - Threshold $\mathtt{0x1000f00e10d2f} = \lfloor 2^{64} / 65521 \rfloor + 1$.
   - Solving $(-C \times 65521^{-1}) \pmod{2^{64}} = \text{offset}$ identifies the 4 target constants:
     - Check 1: offset $\mathtt{0xf04814392f59c642} \implies C_0 = \mathbf{40414}$
     - Check 2: offset $\mathtt{0x74c1d75b9e5e4786} \implies C_1 = \mathbf{12506}$
     - Check 3: offset $\mathtt{0xcee61f7bd841abd9} \implies C_2 = \mathbf{4535}$
     - Check 4: offset $\mathtt{0x80368331afe94eab} \implies C_3 = \mathbf{39941}$

   Forming the 4 coupled circular equations:
   $$\begin{cases}
   X_0^2 + U_0 X_1 - X_3 \equiv 40414 \pmod{65521} & (1) \\
   X_1^2 + U_1 X_2 - X_0 \equiv 12506 \pmod{65521} & (2) \\
   X_2^2 + U_2 X_3 - X_1 \equiv 4535 \pmod{65521}  & (3) \\
   X_3^2 + U_3 X_0 - X_2 \equiv 39941 \pmod{65521} & (4)
   \end{cases}$$

#### 4.4.3. Ring 3: Projective Coordinates / Elliptic Curve Horizon
At offsets `0x187c - 0x1960`, the binary verifies:
```asm
; Check pair (X0, X1):
cmp (X1^2 % 65521), ((X0^3 + 17*X0 + 43) % 65521)
jne harmonic_fault

; Check pair (X2, X3):
cmp (X3^2 % 65521), ((X2^3 + 17*X2 + 43) % 65521)
jne harmonic_fault
```
Both pairs $(X_0, X_1)$ and $(X_2, X_3)$ must be rational points on the Weierstrass Elliptic Curve:
$$E: y^2 \equiv x^3 + 17x + 43 \pmod{65521}$$

---

### 4.5. Mathematical Modeling & Equation System Solver

#### 4.5.1. Critical Breakthrough
The system of 6 equations is **completely independent of `BEACON`**.  
The target values $T_0, T_1, T_2, T_3$ depend solely on static algebraic constants, remaining **invariant across all connection sessions**.  
Given `BEACON`, the register targets are simply:
$$R_i = (T_i + \text{BEACON}) \pmod{65521}$$

#### 4.5.2. Algebraic Reduction
Substituting the Elliptic Curve relations directly into equations (2) and (4):
- Substitute $X_1^2 = X_0^3 + 17X_0 + 43$ into $(2)$:
  $$(X_0^3 + 17X_0 + 43) + U_1 X_2 - X_0 \equiv 12506 \pmod{65521}$$
  $$\implies U_1 \cdot X_2 \equiv 12506 - (X_0^3 + 16X_0 + 43) \pmod{65521}$$
  Define polynomial $K(X_0) = 12506 - (X_0^3 + 16X_0 + 43) \pmod{65521}$:
  $$X_2 \equiv K(X_0) \cdot U_1^{-1} \pmod{65521}$$

- Similarly, substitute $X_3^2 = X_2^3 + 17X_2 + 43$ into $(4)$:
  $$(X_2^3 + 17X_2 + 43) + U_3 X_0 - X_2 \equiv 39941 \pmod{65521}$$
  $$\implies U_3 \cdot X_0 \equiv 39941 - (X_2^3 + 16X_2 + 43) \pmod{65521}$$
  Define polynomial $K'(X_2) = 39941 - (X_2^3 + 16X_2 + 43) \pmod{65521}$:
  $$U_3 \equiv K'(X_2) \cdot X_0^{-1} \pmod{65521}$$

#### 4.5.3. Search Pipeline
Fixing pair $(T_0, T_1)$:
1. $U_0 = f(T_0)$ and $U_1 = f(T_1)$ are retrieved from precomputed lookup tables.
2. $X_0 = (T_1 + U_0) \pmod{65521}$.
3. $X_2 = (K(X_0) \cdot U_1^{-1}) \pmod{65521}$ is uniquely determined.
4. $U_3 = (K'(X_2) \cdot X_0^{-1}) \pmod{65521}$ is uniquely determined.
5. Invert $T_3 = f^{-1}(U_3)$. If $U_3$ is outside the range of $f$, prune immediately.
6. Compute $U_2 = (X_2 - T_3) \pmod{65521}$, invert $T_2 = f^{-1}(U_2)$. If nonexistent, prune.
7. Compute $X_1 = (T_2 + U_1) \pmod{65521}$ and $X_3 = (T_0 + U_3) \pmod{65521}$.
8. Verify remaining conditions: Elliptic Curve checks and equations (1), (3).

An OpenMP multi-threaded C solver sweeps the search space in **under 3 seconds**, outputting the unique solution:
$$\mathbf{T = [1, 218, 59611, 783]}$$
$$\mathbf{U = [37101, 35947, 43627, 40060]}$$
$$\mathbf{X = [37319, 30037, 44410, 40061]}$$

---

### 4.6. Payload Engineering & Cycle Budgeting

To satisfy all architectural constraints:
1. **Target Register States:**
   - $R_0 = (1 + \text{BEACON}) \pmod{65521}$
   - $R_1 = (218 + \text{BEACON}) \pmod{65521}$
   - $R_2 = (59611 + \text{BEACON}) \pmod{65521}$
   - $R_3 = (783 + \text{BEACON}) \pmod{65521}$
2. **Cycle Budgeting:**
   - `HALT (0x7f)` consumes 10 cycles.
   - 4 `LOADI` instructions loading $R_0, R_1, R_2, R_3$ consume 4 cycles.
   - Target total cycles: **115 cycles** (safely centered within $[112, 128]$).
   - Cycles to pad: $115 - 10 - 4 = 101$ cycles.
3. **Designing Neutral Padding Instructions:**
   - Prepend 101 `LOADI R3, 0` instructions (each consuming 1 cycle).
   - Because $R_0 = 0$ and $R_1 = 0$ throughout these 101 instructions, $R_0 \ \& \ 7 = R_1 \ \& \ 7 = 0$ holds identically $\implies$ **the permutation table $P$ remains completely static**!
   - Key $K$ updates simply as: $K_{i+1} = (31 \times K_i) \pmod{256}$.
4. **Bytecode Size Verification:**
   - Total instructions: $101 \text{ (padding)} + 4 \text{ (LOADI)} + 1 \text{ (HALT)} = 106 \text{ instructions}$.
   - Bytecode size: $106 \times 4 = 424 \text{ bytes} \le 512 \text{ bytes}$ (strictly within limits).

---

### 4.7. Full Exploit Source Code (C Solver & Python Exploit)

#### 4.7.1. OpenMP C Solver (`solve.c`)
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
    printf("[*] Initializing lookup tables...\n");
    init_tables();
    printf("[*] Solving equation system with OpenMP multi-threading...\n");

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

            // Verify Elliptic Curve points
            uint32_t x1_sq = (uint64_t)x1 * x1 % P;
            uint32_t ec1 = ((uint64_t)x0 * x0 % P * x0 + 17ULL * x0 + 43ULL) % P;
            if (x1_sq != ec1) continue;

            uint32_t x3_sq = (uint64_t)x3 * x3 % P;
            uint32_t ec2 = ((uint64_t)x2 * x2 % P * x2 + 17ULL * x2 + 43ULL) % P;
            if (x3_sq != ec2) continue;

            // Verify circular network equations (1) and (3)
            uint32_t eq0 = ((uint64_t)x0 * x0 + (uint64_t)u0 * x1 + P - x3) % P;
            if (eq0 != C0) continue;

            uint32_t eq2 = ((uint64_t)x2 * x2 + (uint64_t)u2 * x3 + P - x1) % P;
            if (eq2 != C2) continue;

            printf("\n[+] UNIQUE SOLUTION FOUND!\n");
            printf("T = [%d, %d, %d, %d]\n", t0, t1, t2, t3);
            printf("U = [%d, %d, %d, %d]\n", u0, u1, u2, u3);
            printf("X = [%d, %d, %d, %d]\n", x0, x1, x2, x3);
        }
    }
    return 0;
}
```

#### 4.7.2. Remote Python Exploit (`solve_remote.py`)
```python
#!/usr/bin/env python3
import re
import socket
import struct

P_MOD = 65521

OP_LOADI = 0x10
OP_MOV = 0x20
OP_ADD = 0x30
OP_SUB = 0x35
OP_XOR = 0x40
OP_JMP = 0x50
OP_HALT = 0x7F


class VMAssembler:
  """Ouroboros VM emulator and bytecode assembler."""

  def __init__(self, beacon):
    self.R = [0, 0, 0, 0]
    self.PC = 0
    self.K = 0x5A
    self.cycles = 0
    self.beacon = beacon
    self.P = [0x10, 0x20, 0x30, 0x35, 0x40, 0x50, 0x7F, 0xFF]

  def assemble(self, opcode, dst=0, src=0, imm16=0):
    idx = self.P.index(opcode)
    b0 = (self.K ^ idx) & 0xFF
    b1 = dst & 0x3
    b2 = (imm16 >> 8) & 0xFF
    if opcode in (OP_MOV, OP_ADD, OP_SUB, OP_XOR):
      b2 = src & 0x3
    b3 = imm16 & 0xFF
    return bytes([b0, b1, b2, b3])

  def step(self, instr_bytes):
    b0, b1, b2, b3 = instr_bytes
    self.PC += 4
    dst = b1 & 0x3
    src = b2 & 0x3
    imm16 = (b2 << 8) | b3

    idx = (b0 ^ self.K) & 7
    opcode = self.P[idx]

    # Key K updates using pre-execution value of R0
    old_r0 = self.R[0] & 0xFF
    self.K = ((31 * self.K) + old_r0) & 0xFF

    if opcode == OP_LOADI:
      self.R[dst] = imm16 % P_MOD
      self.cycles += 1
    elif opcode == OP_HALT:
      self.cycles += 10
      return opcode

    # Swap entries in P
    r0_low = self.R[0] & 7
    r1_low = self.R[1] & 7
    self.P[r0_low], self.P[r1_low] = self.P[r1_low], self.P[r0_low]
    return opcode


def build_payload(beacon):
  vm = VMAssembler(beacon)
  payload = bytearray()

  # Target T recovered from algebraic reduction
  T = [1, 218, 59611, 783]
  target_R = [(t + beacon) % P_MOD for t in T]

  # Step 1: Prepend 101 dummy LOADI R3, 0 instructions to reach exactly 115 cycles
  for _ in range(101):
    instr = vm.assemble(OP_LOADI, dst=3, imm16=0)
    vm.step(instr)
    payload.extend(instr)

  # Step 2: Load target values into R0, R1, R2, R3
  for reg in range(4):
    instr = vm.assemble(OP_LOADI, dst=reg, imm16=target_R[reg])
    vm.step(instr)
    payload.extend(instr)

  # Step 3: Emit HALT (0x7f) to trigger Astrolabe verification
  instr = vm.assemble(OP_HALT)
  vm.step(instr)
  payload.extend(instr)

  print(
      f"[+] Generated payload: {len(payload)} bytes, total VM cycles:"
      f" {vm.cycles}"
  )
  print(f"[+] Target register values: {target_R}")
  return payload


def main():
  host, port = "34.116.80.78", 7654
  print(f"[*] Connecting to challenge server {host}:{port}...")
  s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  s.settimeout(10)
  s.connect((host, port))

  banner = ""
  while "bytes): " not in banner:
    chunk = s.recv(1024).decode("utf-8", errors="ignore")
    if not chunk:
      break
    banner += chunk

  print(banner.strip())

  m = re.search(r"BEACON:\s*0x([0-9a-fA-F]+)", banner)
  if not m:
    print("[-] BEACON not found!")
    return

  beacon = int(m.group(1), 16)
  print(f"[+] Extracted Epoch Beacon: 0x{beacon:04X} ({beacon})")

  payload = build_payload(beacon)
  hex_payload = payload.hex() + "\n"

  print(
      f"[*] Transmitting hex telemetry vector ({len(hex_payload.strip())}"
      " characters)..."
  )
  s.sendall(hex_payload.encode("ascii"))

  while True:
    try:
      chunk = s.recv(1024).decode("utf-8", errors="ignore")
      if not chunk:
        break
      print(chunk, end="", flush=True)
    except socket.timeout:
      break

  s.close()


if __name__ == "__main__":
  main()
```

---

### 4.8. Flag & Key Takeaways

#### 4.8.1. Server Execution Log
```text
[*] Connecting to challenge server 34.116.80.78:7654...
=== SECTOR 00: OUROBOROS SINGULARITY (INSANE) ===
[SYNC] RELAY EPOCH BEACON: 0x143C
Transmitting raw telemetry vector (hex max 512 bytes):
[+] Extracted Epoch Beacon: 0x143C (5180)
[+] Generated payload: 424 bytes, total VM cycles: 115
[+] Target register values: [5181, 5398, 64791, 5963]
[*] Transmitting hex telemetry vector (848 characters)...
[+] TELEMETRY STABILIZED. OVERWRITING SYSTEM MASTER KEY...
CSSCTF{0ur0b0r0s_g00d_j0b_b01s_heh3_67}
```

$$\mathbf{CSSCTF\{0ur0b0r0s\_g00d\_j0b\_b01s\_heh3\_67\}}$$

#### 4.8.2. Key Takeaways
1. **Synergy of VM Reverse Engineering and Cryptanalysis:** This challenge bridges low-level bytecode analysis of self-modifying architectures with advanced algebraic structures (Elliptic Curves, coupled circular recurrence).
2. **Invariant Division via Multiplication Recognition:** Spotting $0x58862fdccdf01111$ as the modular inverse of prime $65521$ modulo $2^{64}$ allows converting complex compiled assembly sequences back into standard modular arithmetic constraints.
3. **Cycle Budgeting in VM Exploitation:** When virtual machines mandate precise cycle bounds ($[112, 128]$), injecting neutral padding instructions (`LOADI R3, 0`) enables exact cycle control while preserving the internal opcode permutation state $P$.
