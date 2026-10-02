---
title: "[CSSCTF] Cryptography"
date: '2026-10-02'
description: In-depth writeups and cryptanalysis of Cryptography challenges in CSSCTF.
categories: [CSSCTF, Cryptography]
tags: [cssctf, crypto, rsa, lattice, elliptic-curve]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] Cryptography Challenges Writeup

**Author:** k0z1l  
**Category:** Cryptography  
**Flag Format:** `CSSCTF{...}`

---

## 1. Chrono I

### 1.1. Challenge Description & Given Data
> *We have intercepted a message and a Ciphertext, please help us crack the Ciphertext!*  
> **Message:** `2026/09/21 14:35:07 - "As always, The time is always the key to unlock it"`  
> **Ciphertext:** `ESUITO{gwfvb_xejqnf_nimgt_b_whhrlv}`  
> **Flag Format:** `CSSCTF{...}`

---

### 1.2. Cryptanalysis

#### 1. Clue Analysis:
- Challenge name: **Chrono** (Greek *Khronos*, meaning time).
- Attached message: *"The time is always the key to unlock it"* $\rightarrow$ The digits of the timestamp `2026/09/21 14:35:07` serve as the decryption key.

#### 2. Known-Plaintext Attack:
The competition flag format always begins with the prefix `CSSCTF{...}`. Aligning this with the first 6 characters of the ciphertext `ESUITO{...}`:
- Ciphertext ($C$): `E S U I T O`
- Plaintext ($P$): `C S S C T F`

Computing the shift $\text{Shift}_i = (C_i - P_i) \pmod{26}$ over the Latin alphabet ($A=0, B=1, \dots, Z=25$):

| Position $i$ | Ciphertext ($C_i$) | Numeric $C_i$ | Plaintext ($P_i$) | Numeric $P_i$ | Shift ($C_i - P_i$) | Corresponding Timestamp Digit |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 0 | **E** | 4 | **C** | 2 | $4 - 2 =$ **2** | **2** (year 2026) |
| 1 | **S** | 18 | **S** | 18 | $18 - 18 =$ **0** | **0** (year 2026) |
| 2 | **U** | 20 | **S** | 18 | $20 - 18 =$ **2** | **2** (year 2026) |
| 3 | **I** | 8 | **C** | 2 | $8 - 2 =$ **6** | **6** (year 2026) |
| 4 | **T** | 19 | **T** | 19 | $19 - 19 =$ **0** | **0** (month 09) |
| 5 | **O** | 14 | **F** | 5 | $14 - 5 =$ **9** | **9** (month 09) |

The derived shift sequence: `2, 0, 2, 6, 0, 9` matches the initial digits of the timestamp `20260921143507` perfectly.

#### 3. Encryption Algorithm:
- This is a periodic polyalphabetic shift cipher (**Vigenère Cipher / Polyalphabetic Shift**) keyed with the 14-digit timestamp sequence:
  $$K = [2, 0, 2, 6, 0, 9, 2, 1, 1, 4, 3, 5, 0, 7]$$
- Only alphabetical characters ($a-z, A-Z$) undergo shifting; special characters (`{`, `}`, `_`) remain unaltered and **do not advance the key pointer**.
- The decryption formula for the $j$-th alphabetical character:
  $$P_j = (C_j - \text{base} - K_{k \pmod{14}}) \pmod{26} + \text{base}$$

---

### 1.3. Annotated Exploit Script (Python)

```python
#!/usr/bin/env python3
"""Chrono I Solution Script

Purpose: Decrypt a Vigenère ciphertext keyed with a timestamp digit sequence.
"""

# Ciphertext intercepted from the challenge
ciphertext = "ESUITO{gwfvb_xejqnf_nimgt_b_whhrlv}"

# Decryption key extracted from the timestamp "2026/09/21 14:35:07"
digits = "20260921143507"

plaintext = []
key_idx = 0  # Pointer traversing the key digit sequence

for char in ciphertext:
  # Only perform shift if character is alphabetic
  if char.isalpha():
    # Retrieve corresponding shift from the key sequence (repeating 14-digit cycle)
    shift = int(digits[key_idx % len(digits)])

    # Determine ASCII base (A=65 for uppercase, a=97 for lowercase)
    base = ord("A") if char.isupper() else ord("a")

    # Invert the shift in modulo 26 space
    decrypted_char = chr((ord(char) - base - shift) % 26 + base)
    plaintext.append(decrypted_char)

    # Increment key pointer upon encountering an alphabetic character
    key_idx += 1
  else:
    # Preserve delimiter characters such as '{', '}', '_'
    plaintext.append(char)

# Assemble character list into the complete flag string
flag = "".join(plaintext)
print(f"[+] Flag: {flag}")
```

### 1.4. Flag
$$\mathbf{CSSCTF\{every\_second\_hides\_a\_secret\}}$$

---

## 2. Chrono II

### 2.1. Challenge Description & Context
> *We have again intercepted their talk and the cipher text, but this time it seems like its always changing. Help us!*  
> *"The Time is ticking, it will never stop, no one will ever decrypt it"*  
> **Online Service:** `http://34.116.80.78:8001`  
> **Flag Format:** `CSSCTF{...}`

---

### 2.2. Data Reconnaissance & Sample Collection

Accessing the challenge server presents a webpage themed after a Clockmaker's Workshop:
- Key clue: *"Gears are beautiful. A few turning together can tell the time."*
- Emission rate: **1 Hz** (the server emits a new ciphertext every second).
- The `/api/feed` endpoint and the `/capture.json` download button provide a rolling 60-second capture of UTC timestamps and corresponding ciphertexts.

Sample ciphertexts at consecutive seconds:
```text
2026-09-30T07:07:55Z -> SWBFVN{bu0_mq9hr_c8r1sj1ee_5cixb_i2h8tq}
2026-09-30T07:07:56Z -> LCSKBG{et0_fu0ks_c8n7zg4dz_1wquh_z3h4ai}
2026-09-30T07:07:57Z -> MXBHAQ{ym1_it8pw_t0q9pr2wa_9iegf_v6l0qt}
```

#### Ciphertext Structure Analysis (Position-wise Invariance):
Examining positional characteristics (fixed length of 40 characters) across the 60 samples:
1. **Fixed Delimiters:** Braces `{` (index 6), `}` (index 39), and underscores `_` (indices 10, 16, 26, 32) **never change**.
2. **Uppercase Characters:** The first 6 characters (indices 0..5) **are always uppercase** $\rightarrow$ corresponding to the prefix `CSSCTF`.
3. **Invariant Character Classes:** 
   - Digit positions ($0-9$): Indices 9, 13, 18, 20, 23, 27, 34, 36 strictly contain digits across all seconds.
   - Lowercase positions ($a-z$): All remaining positions strictly contain lowercase letters.
4. **Shift Alphabet Conclusion:** The system applies independent Caesar/Vigenère shifts partitioned by character set:
   - Letters (uppercase/lowercase): Shifted modulo $26$.
   - Digits ($0-9$): Shifted modulo $10$.

---

### 2.3. The Clockwork Mechanism Analysis

#### Step 1: Compute Shift from Prefix `CSSCTF`
Knowing the first 6 characters of the plaintext are always `CSSCTF`, the exact shift $S(t, p)$ at each second $t$ for positions $p \in [0, 5]$ can be computed:
$$S(t, p) = (C[t][p] - \text{"CSSCTF"}[p]) \pmod{26}$$

#### Step 2: Column Phase Offset Correlation ($\Delta t = 34$)
Comparing the time-series shift of column $p$ with the subsequent column $p+1$ reveals a perfect synchronization law:
$$S(t + 34, p + 1) = S(t, p)$$

*Intuitive interpretation:* Transitioning to the next character in the ciphertext stream is equivalent to delaying the previous character's state by exactly **34 time steps (34 seconds)**.

#### Step 3: Global Period $T = 77$ Seconds
Comparing two capture batches collected a few minutes apart (the initial capture and a subsequent live feed) and searching for identical shift vectors across time:
- The system state repeats identically at time intervals:
  $$\Delta t_1 = 308 \text{ s}, \quad \Delta t_2 = 385 \text{ s}$$
- Computing the greatest common divisor of these repetition periods:
  $$T = \gcd(308, 385) = \mathbf{77 \text{ seconds}}$$
- **Decoding the Clockwork Riddle:** The number $77 = 7 \times 11$. This represents the interaction of **two co-axial gears with 7 and 11 teeth**, producing a global period equal to the least common multiple:
  $$\operatorname{lcm}(7, 11) = 77 \text{ states!}$$

---

### 2.4. Keystream Reconstruction

Because the entire system operates over exactly 77 periodic states ($t \pmod{77} \in [0..76]$), combining the initial 60-second capture with the subsequent 60-second live feed covers all **77/77 phases** without gaps.

For each timestamp $t$ and character position $p$ (alphanumeric characters only, skipping delimiters `{`, `}`, `_`):
1. Compute the keystream phase index:
   $$\text{key\_index} = (t - 34 \times p) \pmod{77}$$
2. Retrieve the corresponding shift value from the key array: $\text{shift} = K[\text{key\_index}]$
3. Decrypt accordingly:
   - Uppercase letter: $(C - \text{'A'} - \text{shift}) \pmod{26} + \text{'A'}$
   - Lowercase letter: $(C - \text{'a'} - \text{shift}) \pmod{26} + \text{'a'}$
   - Digit: $(C - \text{'0'} - \text{shift}) \pmod{10} + \text{'0'}$

Testing decryption across all 77 states produces **the exact same unique plaintext** with 0 discrepancies.

---

### 2.5. Annotated Exploit Script (Python)

```python
#!/usr/bin/env python3
"""Chrono II Solution Script

Purpose: Automatically fetch capture data from the API server, reconstruct the
77-second keystream via Known-Plaintext Attack, and decrypt the flag completely.
"""

from datetime import datetime
import json
import urllib.request


def parse_iso(ts):
  """Convert UTC ISO timestamp string to integer Unix timestamp."""
  return int(datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp())


# 1. Fetch data from the server's API endpoint
url = "http://34.116.80.78:8001/api/feed"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

print("[*] Connecting to server and fetching capture data...")
with urllib.request.urlopen(req) as resp:
  records = json.loads(resp.read().decode("utf-8"))

# Store ciphertexts indexed by phase: phase = timestamp % 77
states = {}
for r in records:
  phase = parse_iso(r["timestamp"]) % 77
  states[phase] = r["ciphertext"]

print(
    f"[+] Recorded {len(states)}/77 state phases from current capture."
)

# 2. Recover the entire keystream array K (length 77) from the known "CSSCTF" prefix
K = {}
for phase, ct in states.items():
  # Iterate through the 6 known prefix characters
  for p in range(6):
    # Apply phase shift formula: key_index = (phase - 34 * p) % 77
    k_idx = (phase - 34 * p) % 77
    shift = (ord(ct[p]) - ord("CSSCTF"[p])) % 26
    K[k_idx] = shift

print(f"[+] Successfully reconstructed {len(K)}/77 elements of keystream K.")


# 3. Generalized decryption function
def decrypt(ct, phase):
  res = []
  p_idx = 0  # Counter for alphanumeric characters (skipping delimiters)

  for c in ct:
    if c.isupper():
      # Decrypt uppercase letter (modulo 26)
      shift = K[(phase - 34 * p_idx) % 77]
      res.append(chr((ord(c) - ord("A") - shift) % 26 + ord("A")))
      p_idx += 1
    elif c.islower():
      # Decrypt lowercase letter (modulo 26)
      shift = K[(phase - 34 * p_idx) % 77]
      res.append(chr((ord(c) - ord("a") - shift) % 26 + ord("a")))
      p_idx += 1
    elif c.isdigit():
      # Decrypt digit (modulo 10)
      shift = K[(phase - 34 * p_idx) % 77]
      res.append(chr((ord(c) - ord("0") - shift) % 10 + ord("0")))
      p_idx += 1
    else:
      # Preserve delimiters '{', '}', '_'
      res.append(c)

  return "".join(res)


# Select a recorded sample phase to decrypt the flag
sample_phase = list(states.keys())[0]
flag = decrypt(states[sample_phase], sample_phase)

print(f"[+] Ciphertext at phase {sample_phase}: {states[sample_phase]}")
print(f"[+] Successfully decrypted Flag: {flag}")
```

### 2.6. Flag
$$\mathbf{CSSCTF\{th3\_cl0ck\_r3m3mb3rs\_3very\_s3c0nd\}}$$

---

## 3. Chimera Vault

### 3.1. Challenge Description & Context
> *The ancient custodians of the Chimera Vault didn't rely on standard asymmetric primitives to secure their root register.*  
> *Demodulate the carrier, trace the invariant through the matrix state transitions, and invert the resonance to breach the vault.*  
> **Online Service:** `nc 34.116.80.78 7334`  
> **Flag Format:** `CSSCTF{...}`  
> **Attached Files:** `server.py`, `Dockerfile`

---

### 3.2. Architecture & Security Model of Chimera Vault

The challenge models a 3-tier resonant vault system. To retrieve the flag, an exploit must automatically solve and pass three consecutive phases within a strict 45-second deadline (`signal.alarm(45)`):

```
       [ Client / Attacker ]
                 │
                 ▼ (TCP Handshake)
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: ACOUSTIC CARRIER SYNCHRONIZATION                   │
│ - 16-bit PCM 8000Hz signal (Base64)                         │
│ - 2 sine waves: f1 = 440 + 5*k1, f2 = 1200 + 5*k2 + Noise   │
│ - Requirement: Demodulate to extract session_token (16-bit) │
└────────────────────────┬────────────────────────────────────┘
                         │ [+] Phase Locked!
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: NON-COMMUTATIVE MATRIX DRIFT TELEMETRY             │
│ - Matrix evolution: M_{k+1} = M_k + D (mod N)               │
│ - D = diag(d1, d2, d3) with d1 + d2 + d3 = W (mod N)        │
│ - Requirement: Recover secret key W via matrix trace        │
└────────────────────────┬────────────────────────────────────┘
                         │ [+] W = Tr(M1 - M0) mod N
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: RESONANT KNAPSACK INTERCEPT                        │
│ - Merkle-Hellman cryptosystem: S = (W * r) mod M_mod        │
│ - Superincreasing sequence r = [r0, ..., r47], Target Sum C │
│ - Requirement: Invert W^-1 mod M_mod and solve 48-bit subset│
└────────────────────────┬────────────────────────────────────┘
                         │ [+] Master Key Overwritten!
                         ▼
             [ Flag: CSSCTF{...} ]
```

---

### 3.3. Cryptanalysis & Stage Vulnerabilities

#### 3.3.1. Phase 1: Acoustic Carrier Synchronization (Digital Audio Demodulation)

##### Signal Modulation Mechanism:
- The server generates a random 16-bit session token: $T \in [0x1000, 0xEFFF]$.
- The two bytes of the token are decomposed into:
  $$k_1 = T \ \& \ 0\text{xFF} \in [0, 255]$$
  $$k_2 = (T \gg 8) \ \& \ 0\text{xFF} \in [16, 239]$$
- The corresponding carrier frequencies are:
  $$f_1 = 440 + 5 \cdot k_1 \quad (\text{range } [440, 1715]\text{ Hz})$$
  $$f_2 = 1200 + 5 \cdot k_2 \quad (\text{range } [1280, 2395]\text{ Hz})$$
- The continuous-time signal consists of two sinusoidal carriers of amplitude $0.4$ contaminated with Gaussian noise $\epsilon \sim \mathcal{N}(0, 0.05^2)$:
  $$s(t) = 0.4 \sin(2\pi f_1 t) + 0.4 \sin(2\pi f_2 t) + \epsilon(t)$$
- The signal is sampled at $F_s = 8000\text{ Hz}$ for $0.8\text{ seconds}$ (totaling $N_s = 6400\text{ samples}$), quantized into 16-bit signed PCM little-endian, and transmitted as Base64.

##### Digital Signal Processing (DSP) Analysis:
- **Natural Frequency Resolution:**
  $$\Delta f = \frac{F_s}{N_s} = \frac{8000}{6400} = 1.25\text{ Hz}$$
  Because the frequency step between adjacent $k$ values is $5\text{ Hz}$ ($\Delta f_{\text{step}} = 5\text{ Hz} = 4 \times \Delta f$), the resolution is more than sufficient to distinguish adjacent carrier frequencies without overlap.
- **Discrete Candidate Frequencies:**
  All valid carrier frequencies are multiples of $5\text{ Hz}$ within $[440, 2395]\text{ Hz}$. The total candidate set size is:
  $$\frac{2395 - 440}{5} + 1 = 392\text{ frequencies!}$$
- **Direct Orthogonal Projection (DTFT):**
  Rather than performing a broad FFT susceptible to sidelobe leakage, direct inner products between the signal vector $x[n]$ and the orthogonal basis $\{\cos(2\pi f t), \sin(2\pi f t)\}$ are evaluated for exactly the 392 candidate frequencies:
  $$C(f) = \sum_{n=0}^{N_s-1} x[n] \cos\left(2\pi f \frac{n}{F_s}\right), \quad S(f) = \sum_{n=0}^{N_s-1} x[n] \sin\left(2\pi f \frac{n}{F_s}\right)$$
  $$E(f) = C(f)^2 + S(f)^2$$
- **Frequency Extraction:**
  1. Rank frequencies by descending energy $E(f)$.
  2. Select the top 2 frequencies satisfying a minimum separation $\ge 10\text{ Hz}$ (to avoid adjacent sidelobes).
  3. If $f_1 = f_2$ (when $k_1 - k_2 = 152$), the spectrum exhibits a single peak of double energy.
  4. Invert frequencies back to key values:
     $$k_1 = \frac{f_1 - 440}{5}, \quad k_2 = \frac{f_2 - 1200}{5} \implies T = (k_2 \ll 8) \mid k_1$$

---

#### 3.3.2. Phase 2: Non-Commutative Matrix Drift Telemetry (Matrix Trace Invariant)

##### Matrix Drift Mechanics:
- The server initializes an RSA modulus $N = p \cdot q$ (128-bit) and randomly chooses a secret integer $W \in [2, N-2]$.
- The diagonal drift matrix $D = \operatorname{diag}(d_1, d_2, d_3)$ is generated with:
  $$d_1, d_2 \in_R [1, N-1], \quad d_3 \equiv (W - d_1 - d_2) \pmod N$$
- The matrix state evolves additively modulo $N$:
  $$M_{k+1} \equiv (M_k + D) \pmod N$$
- The server provides the state sequence: $M_0, M_1, M_2, M_3$.

##### Mathematical Vulnerability (Trace Invariant):
- Observe the trace of the diagonal drift matrix $D$:
  $$\operatorname{Tr}(D) = d_1 + d_2 + d_3 \equiv d_1 + d_2 + (W - d_1 - d_2) \equiv W \pmod N$$
- By the linearity of the matrix trace ($\operatorname{Tr}(A + B) = \operatorname{Tr}(A) + \operatorname{Tr}(B)$):
  $$\operatorname{Tr}(M_{k+1}) \equiv \operatorname{Tr}(M_k) + \operatorname{Tr}(D) \equiv \operatorname{Tr}(M_k) + W \pmod N$$
- Given $M_0$ and $M_1$:
  $$D \equiv (M_1 - M_0) \pmod N$$
  The diagonal elements of $D$ are computed directly:
  $$d_1 \equiv (M_1[0][0] - M_0[0][0]) \pmod N$$
  $$d_2 \equiv (M_1[1][1] - M_0[1][1]) \pmod N$$
  $$d_3 \equiv (M_1[2][2] - M_0[2][2]) \pmod N$$
- Yielding $W$:
  $$W = (d_1 + d_2 + d_3) \pmod N$$
- **Crucial Observation:** Because $W$ was initially chosen in $[2, N-2]$, $W < N$. Thus, modular reduction modulo $N$ recovers the exact integer value of $W$ with zero ambiguity.

---

#### 3.3.3. Phase 3: Resonant Knapsack Intercept (Merkle-Hellman Cryptanalysis)

##### Merkle-Hellman Cryptosystem Architecture:
- The server generates a **superincreasing sequence** $r = [r_0, r_1, \dots, r_{47}]$ of 48 elements:
  $$r_0 \in [10, 50], \quad r_k = \sum_{i=0}^{k-1} r_i + \text{randint}(5, 50) \implies r_k > \sum_{i=0}^{k-1} r_i \quad (\forall k \ge 1)$$
- Knapsack modulus:
  $$M_{\text{mod}} = \sum_{i=0}^{47} r_i + \text{randint}(1000, 50000), \quad \text{with } \gcd(W, M_{\text{mod}}) = 1$$
- Public weights $S = [s_0, s_1, \dots, s_{47}]$:
  $$s_i \equiv (W \cdot r_i) \pmod{M_{\text{mod}}}$$
- A 48-bit secret vector $b = [b_0, b_1, \dots, b_{47}] \in \{0, 1\}^{48}$ is encrypted into the target resonance sum:
  $$C = \sum_{i=0}^{47} b_i \cdot s_i$$

##### Flag Recovery Attack:
- While general Subset Sum (Knapsack) is NP-complete, the Merkle-Hellman cryptosystem relies on modular multiplication by $W \pmod{M_{\text{mod}}}$ as its trapdoor.
- Once the secret key $W$ has been recovered from Phase 2 and $M_{\text{mod}}$ is provided publicly, the trapdoor is completely inverted:
  1. Compute the modular inverse:
     $$W^{-1} \equiv W^{-1} \pmod{M_{\text{mod}}}$$
  2. Invert the public weights back to the superincreasing sequence $r$:
     $$r_i \equiv (s_i \cdot W^{-1}) \pmod{M_{\text{mod}}}$$
  3. Transform the target sum into the superincreasing space:
     $$C' \equiv (C \cdot W^{-1}) \pmod{M_{\text{mod}}} = \sum_{i=0}^{47} b_i \cdot r_i$$
- **Solving Subset Sum on Superincreasing Sequences in $O(n)$ Time:**
  Because each element $r_k$ exceeds the sum of all preceding elements ($\sum_{i=0}^{k-1} r_i < r_k$), each bit $b_i$ is determined deterministically via a greedy pass from $i = 47$ down to $0$:
  $$\begin{cases} 
  \text{If } C' \ge r_i: & b_i = 1, \quad C' \leftarrow C' - r_i \\ 
  \text{If } C' < r_i: & b_i = 0 
  \end{cases}$$
- After the pass, verify $C' = 0$. Concatenate the 48 bits into a bitstring (e.g., `11001101...`) and send it to the server to claim the flag.

---

### 3.4. End-to-End Exploit Pipeline

The automated network exploit follows this sequence:
1. **Network Handshake & Parameter Parsing:** Connect to `34.116.80.78:7334`, parse the welcome banner, extract $N$, $M_{\text{mod}}$, and the Base64 telemetry audio stream.
2. **Phase 1 Signal Processing:** Base64 decode $\rightarrow$ compute DTFT projections over 392 candidate frequencies $\rightarrow$ locate peaks $f_1, f_2 \rightarrow$ calculate session token $\rightarrow$ transmit hex string (e.g., `0xe829\n`).
3. **Phase 2 Matrix Analysis:** Receive state matrices $M_0, M_1, M_2, M_3 \rightarrow$ compute diagonal difference $d_i = (M_1[i][i] - M_0[i][i]) \pmod N \rightarrow$ calculate $W = \sum d_i \pmod N$.
4. **Phase 3 Merkle-Hellman Breach:** Receive public weights $S$ and target sum $C \rightarrow$ compute $W^{-1} \pmod{M_{\text{mod}}} \rightarrow$ reconstruct superincreasing sequence $r \rightarrow$ greedily extract 48-bit solution $\rightarrow$ send bitstring.
5. **Flag Retrieval:** Read authentication confirmation and extract `CSSCTF{...}`.

---

### 3.5. Full Exploit Script (Python)

```python
#!/usr/bin/env python3
"""Chimera Vault Exploit Script

Purpose: Fully automate all three stages:
1. Demodulate 16-bit PCM audio to recover session token.
2. Exploit matrix trace invariant modulo N to recover secret key W.
3. Invert Merkle-Hellman trapdoor and solve superincreasing knapsack.
"""

import ast
import base64
import re
import socket
import numpy as np


def solve():
  # Audio sampling parameters for Phase 1
  sample_rate = 8000
  duration = 0.8
  num_samples = int(sample_rate * duration)
  t = np.arange(num_samples) / sample_rate

  # Candidate frequency range: multiples of 5Hz from 440Hz to 2395Hz (392 frequencies)
  cand_freqs = np.arange(440, 2400, 5)

  # Orthogonal projection matrices for spectral energy analysis
  cos_mat = np.cos(2 * np.pi * cand_freqs[:, None] * t[None, :])
  sin_mat = np.sin(2 * np.pi * cand_freqs[:, None] * t[None, :])

  host = "34.116.80.78"
  port = 7334

  while True:
    print(f"[*] Connecting to server {host}:{port}...")
    s = socket.socket()
    s.settimeout(15)
    s.connect((host, port))

    def recv_until(target_bytes):
      data = b""
      while target_bytes not in data:
        chunk = s.recv(4096)
        if not chunk:
          raise EOFError("Connection lost from server")
        data += chunk
      return data.decode("utf-8", errors="ignore")

    try:
      # Receive banner and parse N, M_mod
      greeting = recv_until(b"Enter decoded session token")
      N = int(re.search(r"System Modulus N = (\d+)", greeting).group(1))
      M_mod = int(
          re.search(r"Knapsack Modulus M_mod = (\d+)", greeting).group(1)
      )
      print(f"[+] System Modulus N = {N}")
      print(f"[+] Knapsack Modulus M_mod = {M_mod}")

      # --- STEP 1: DEMODULATE AUDIO SIGNAL (PHASE 1) ---
      b64_audio = re.search(
          r"stream \(Base64\):\s*([A-Za-z0-9+/=]+)", greeting
      ).group(1).strip()
      raw_pcm = base64.b64decode(b64_audio)
      samples = (
          np.frombuffer(raw_pcm, dtype=np.int16).astype(np.float64) / 32767.0
      )

      # Evaluate spectral energy at each candidate frequency
      c_proj = cos_mat @ samples
      s_proj = sin_mat @ samples
      energy = c_proj**2 + s_proj**2

      # Find top 2 energy peaks separated by >= 10 Hz
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
      print(f"[+] Predicted Session Token: {token_hex}")

      # Send session token to server
      s.sendall((token_hex + "\n").encode())

      phase1_res = recv_until(b"M_0 =")
      if "Phase locked!" not in phase1_res:
        print("[-] Incorrect session token, retrying connection...")
        s.close()
        continue

      print("[+] Phase 1 Passed! Carrier synchronized.")

      # --- STEP 2: RECOVER SECRET KEY W VIA MATRIX TRACE (PHASE 2) ---
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

      # Diagonal difference D = (M_1 - M_0) mod N
      d1 = (M_1[0][0] - M_0[0][0]) % N
      d2 = (M_1[1][1] - M_0[1][1]) % N
      d3 = (M_1[2][2] - M_0[2][2]) % N

      # W = Tr(D) mod N
      W = (d1 + d2 + d3) % N
      print(f"[+] Successfully recovered secret key W = {W}")

      # --- STEP 3: MERKLE-HELLMAN KNAPSACK CRYPTANALYSIS (PHASE 3) ---
      W_inv = pow(W, -1, M_mod)

      # Reconstruct superincreasing sequence r and transformed target sum C'
      r = [(si * W_inv) % M_mod for si in weights_S]
      target_prime = (target_sum * W_inv) % M_mod

      # Greedy algorithm to solve Subset Sum on superincreasing sequence
      knapsack_len = len(weights_S)
      sol_bits = [0] * knapsack_len
      curr = target_prime

      for i in range(knapsack_len - 1, -1, -1):
        if curr >= r[i]:
          sol_bits[i] = 1
          curr -= r[i]

      assert (
          curr == 0
      ), "[-] Error: Non-zero remainder after knapsack solving (invalid solution)"

      sol_str = "".join(str(b) for b in sol_bits)
      print(f"[+] Found 48-bit solution vector: {sol_str}")

      # Send solution to server
      s.sendall((sol_str + "\n").encode())

      # Read flag response
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
        print("[+] FLAG ACQUIRED SUCCESSFULLY!")
        s.close()
        return

    except Exception as e:
      print(f"[-] Encountered error: {e}, restarting...")
      try:
        s.close()
      except:
        pass


if __name__ == "__main__":
  solve()
```

### 3.6. Flag

$$\mathbf{CSSCTF\{tr4c3\_1nv4r14nc3\_4nd\_4c0ust1c\_sp3ctr4\_7f9b8c\}}$$

---

## 4. Severed Symmetry

### 4.1. Challenge Description & Context
> *As the Kuiper Belt Relay reboots, your terminal intercepts an encrypted archive belonging to the Ætheric Order. Its contents survived The Severance, but the private key did not; only the encryption program, public equations, and ciphertext remain. The Order is already moving to reclaim it; recover the access key hidden inside before their secrets disappear into the Nexus again.*  
> **Given Files:**  
> - `source.py`: Source code containing key generation (`keygen`), vector encryption (`encrypt_vector`), and decryption (`decrypt_vector`).  
> - `out.txt` (~31 MB): Contains `public_key` (34 degree-4 polynomials with over 58,000 monomials) and `ciphertext` (3 ciphertext blocks with $m = 34$).  
> **Flag Format:** `CSSCTF{...}`

---

### 4.2. Architecture & Algebraic Structure of the Cryptosystem

This challenge belongs to **Multivariate Public Key Cryptography (MPKC)**. The system is designed by hybridizing a **Tame Transformation** with an **Unbalanced Oil and Vinegar (UOV)** signature/encryption layer.

#### 1. System Parameters:
```python
PARAMETERS = dict(p=17, n=32, m=34, t=16, s=4)
```
- Base field: $\mathbb{F}_p$ with $p = 17$.
- Plaintext space: $x \in \mathbb{F}_{17}^{n}$ ($n = 32$).
- Ciphertext space: $C \in \mathbb{F}_{17}^{m}$ ($m = 34$).
- Triangular separation parameter: $t = 16$.
- Additional Vinegar variable count: $s = 4$.
- Oil variable count in UOV layer: $o = n - t - s = 32 - 16 - 4 = 12$.

#### 2. Trapdoor Map Decomposition:
The private key comprises two invertible affine maps $A_1 \in \mathbb{F}_{17}^{m \times m}, A_2 \in \mathbb{F}_{17}^{n \times n}$ and internal polynomials:
1. **Input Affine Layer:**
   $$z = A_2 x + b_2 \in \mathbb{F}_{17}^{32}$$
   Splitting $z$ into two halves: $z_{0 \dots 15}$ (first 16 variables) and $z_{16 \dots 31}$ (last 16 variables).
2. **Tame Transformation Layer (Triangular Layer):**
   $$w_i = z_i - q_i(z_{16}, \dots, z_{31}) \quad (i = 0, \dots, 15)$$
   where each $q_i$ is a random quadratic polynomial depending solely on the 16 variables $z_{16 \dots 31}$.
   Since $z_i$ is affine (degree 1) and $q_i$ is quadratic in $x$, $w_i(x)$ has **degree 2** in $x$.
3. **Unbalanced Oil and Vinegar (UOV Layer):**
   Constructs $m - t = 18$ quadratic polynomials $U_k$ over a 32-element vector:
   $$u = (w_0, \dots, w_{15}, z_{16}, \dots, z_{19}, z_{20}, \dots, z_{31})$$
   - The first $t + s = 16 + 4 = 20$ variables are **Vinegar variables** ($w_0 \dots w_{15}$ and $z_{16} \dots z_{19}$).
   - The last $o = 12$ variables are **Oil variables** ($z_{20} \dots z_{31}$).
   - By UOV design, all cross-terms between two Oil variables vanish identically:
     $$\forall i, j \ge 20: \quad \text{Coeff}(u_i u_j) = 0$$
4. **Central Map:**
   $$\text{central}(x) = \big[ w_0(x), \dots, w_{15}(x), \; U_0(u), \dots, U_{17}(u) \big] \in \mathbb{F}_{17}^{34}$$
5. **Public Key:**
   $$P(x) = A_1 \cdot \text{central}(x) + b_1 \in \mathbb{F}_{17}^{34}$$
   Substituting $u_i = w_i(x)$ (degree 2) into quadratic terms $u_i u_j$ ($i, j < 16$) of $U_k$ drives the overall degree of public polynomials to **degree 4**:
   $$\deg(w_i \cdot w_j) = 2 + 2 = 4$$
   This explains why `out.txt` is ~31 MB in size, containing 34 degree-4 polynomials spanning up to $\binom{32+4}{4} = 58,905$ possible monomials.

---

### 4.3. Cryptanalysis & 5-Stage Exploit Pipeline

The challenge title **"Severed Symmetry"** hints at two structural vulnerabilities:
1. *Severed:* The intermediate layer $w$ is output directly into $\text{central}$ without being elevated to degree 4.
2. *Symmetry:* The bilinear form vanishes on the Oil subspace ($o > v$), creating an opening for a Kipnis-Shamir kernel attack.

```
+---------------------------------------------------------------------------------------+
|                                    PUBLIC POLYNOMIALS                                 |
|                                 P_k(x) in F_17[x_0..x_31]                             |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Stage 1: Left Nullspace Attack]
+---------------------------------------------------------------------------------------+
|  Mat_deg34 (34 x 58344) has Rank = 18  -->  Left Nullspace V_null (dim = 16)          |
|  Q(x) = V_null * P(x) COMPLETELY ELIMINATES DEGREE 3 & 4 (Yields 16 polys of deg <= 2)|
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Stage 2: Subspace Isolation]
+---------------------------------------------------------------------------------------+
|  Gradients grad(P_k^(4)) lie in span(z_16..z_31)  -->  Rank = 16                      |
|  Recovers basis matrix L (16 x 32) and invertible change-of-basis T (32 x 32)         |
|  New coordinates: x = T^(-1) * [u, y]^T (y represents z_16..z_31, u represents z_0..z_15)|
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Stage 3: Linearization of u]
+---------------------------------------------------------------------------------------+
|  Q(u, y) = K * u + G(y) with K (16 x 16) invertible --> u*(y) = K^(-1)*(target_Q - G)|
|  Substitute u = u*(y) into the remaining 18 equations:                                |
|  All equations COLLAPSE FROM DEGREE 4 TO DEGREE 2 IN 16 VARIABLES y!                 |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Stage 4: Breaking UOV Symmetry]
+---------------------------------------------------------------------------------------+
|  18 quadratic forms M_k (16 x 16) have rank = 2*v = 8                                 |
|  Kernel ker(M_k) (dim = 8) lies entirely inside Oil subspace O (dim = 12)             |
|  O = sum_k ker(M_k)  -->  Recovers 100% of Oil Subspace O with O^T * M_k * O = 0      |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v  [Stage 5: Fast C Solver]
+---------------------------------------------------------------------------------------+
|  y = S_V * v + S_O * o  (v in F_17^4, o in F_17^12)                                   |
|  18 equations become LINEAR in 12 variables o:  A(v)*o + b(v) = 0                     |
|  Exhaust 17^4 = 83,521 cases of v in solver.c (< 5ms)                                 |
|  Find unique solution (v, o)  -->  y  -->  u  -->  x  -->  DECODE FLAG!               |
+---------------------------------------------------------------------------------------+
```

---

#### 4.3.1. Stage 1: Left Nullspace Degree Elimination
Examine the structure of $\text{central} \in \mathbb{F}_{17}^{34}$:
$$\text{central} = \big[ w_0, \dots, w_{15}, \; U_0, \dots, U_{17} \big]$$
- The first $16$ components are $w_i(x) = z_i - q_i(z_{16 \dots 31})$, having **degree at most 2 in $x$** (containing no degree-3 or degree-4 monomials).
- Only the latter $18$ components ($U_0, \dots, U_{17}$) contain degree-3 and degree-4 monomials.

Since $P(x) = A_1 \cdot \text{central}(x) + b_1$, every public polynomial $P_k(x)$ is a linear combination of all 34 components. However, the degree-3 and degree-4 parts across all 34 public polynomials **are spanned by only 18 polynomials** ($U_0 \dots U_{17}$).

Consider the coefficient matrix for degree-3 and degree-4 monomials, sized $34 \times 58,344$:
$$\operatorname{Rank}(M_{\text{deg 3,4}}) \le 18$$
Performing Gaussian elimination on the transposed matrix identifies the Left Nullspace of dimension:
$$\dim(V_{\text{null}}) = 34 - 18 = 16$$
There exists a matrix $V_{\text{null}} \in \mathbb{F}_{17}^{16 \times 34}$ of full rank 16 such that:
$$V_{\text{null}} \cdot M_{\text{deg 3,4}} \equiv 0 \pmod{17}$$
Multiplying $V_{\text{null}}$ by the public polynomial vector $P(x)$ eliminates all degree-3 and degree-4 monomials:
$$Q(x) = V_{\text{null}} \cdot P(x) \quad \text{satisfies } \deg(Q_k) \le 2 \quad (\forall k \in [0..15])$$
Moreover, for ciphertext $C = P(x^*)$, we immediately obtain 16 quadratic equations satisfied by plaintext $x^*$:
$$Q(x^*) = V_{\text{null}} \cdot C \pmod{17}$$

---

#### 4.3.2. Stage 2: Subspace Isolation via Degree-4 Gradients
Consider the algebraic origin of the degree-4 terms:
In $U_k(w, z_{16 \dots 31})$, degree-4 terms arise exclusively from products $w_i w_j$. Because:
$$w_i(x) = z_i(x) - q_i(z_{16 \dots 31}) = -q_i(z_{16 \dots 31}) + \text{affine terms}$$
The pure degree-4 part of $w_i w_j$ is:
$$(-q_i(z_{16 \dots 31})) \cdot (-q_j(z_{16 \dots 31})) = q_i(z_{16 \dots 31}) q_j(z_{16 \dots 31})$$
**Crucial Property:** The entire degree-4 homogeneous component of all public polynomials $P_k(x)$ depends strictly on the 16 linear forms $z_{16}, \dots, z_{31}$ (the last 16 rows of private matrix $A_2$).

Evaluating the gradient of the degree-4 component with respect to $x$:
$$\nabla P_k^{(4)}(x) \in \operatorname{span}\big( A_{2, [16:32], :} \big)$$
By sampling 50 random points $x \in \mathbb{F}_{17}^{32}$, calculating $\nabla P_0^{(4)}(x)$, and applying Gaussian elimination, an exact 16-dimensional vector subspace is recovered. Let $L \in \mathbb{F}_{17}^{16 \times 32}$ denote a basis for this space:
$$z_{16 \dots 31} = B \cdot (L x) + d$$
Selecting a complementary matrix $R \in \mathbb{F}_{17}^{16 \times 32}$ forms an invertible change-of-basis matrix:
$$T = \begin{pmatrix} R \\ L \end{pmatrix} \in \mathbb{F}_{17}^{32 \times 32}$$
Applying the variable substitution:
$$x = T^{-1} \begin{pmatrix} u \\ y \end{pmatrix}, \quad u \in \mathbb{F}_{17}^{16}, \; y \in \mathbb{F}_{17}^{16}$$
In the new coordinate system, $y = L x$ represents the subspace of $z_{16 \dots 31}$, while $u$ represents the complementary subspace of $z_{0 \dots 15}$.

---

#### 4.3.3. Stage 3: Linearization of Variable $u$ & Degree Collapse
Expressing $w_i$ in coordinates $(u, y)$:
$$w_i(x) = z_i - q_i(z_{16 \dots 31}) = (J \cdot u)_i + (H \cdot y)_i + b_{2, i} - q_i(B y + d)$$
Notice that:
- Variable $u$ **appears purely linearly** in $J \cdot u$.
- Variable $u$ **does not appear** in $q_i$ (since $q_i$ depends solely on $y$).
- Therefore, in the 16 equations $Q(x) = V_{\text{null}} P(x)$, variable $u$ appears strictly at degree 1:
  $$Q(u, y) = K \cdot u + G(y)$$
  where $K \in \mathbb{F}_{17}^{16 \times 16}$ is a constant integer matrix and $G(y)$ is a vector of pure quadratic polynomials in $y$.

Checking invertibility: $\det(K) \not\equiv 0 \pmod{17}$, confirming that $K$ is fully invertible.  
For ciphertext $C$, let $\text{target\_Q} = V_{\text{null}} \cdot C$. At plaintext $x^* = T^{-1} (u^*, y^*)$:
$$K \cdot u^* + G(y^*) = \text{target\_Q} \implies u^*(y) = K^{-1} \big( \text{target\_Q} - G(y) \big)$$
This implies that **variable $u$ is completely eliminated and uniquely expressed in terms of $y$**.

**Consequence of Degree Collapse:**  
When assigning $u = u^*(y)$, by definition of $V_{\text{null}}$:
$$w(u^*(y), y) \equiv w(x^*) = \text{const} \quad (\forall y)$$
Because $w$ has collapsed into a constant vector, when evaluated in the remaining 18 independent public polynomials $P_{\text{indep}}$:
$$U_k(w^*, z_{16 \dots 31}) = U_k(w^*, B y + d)$$
Since $U_k$ is quadratic in $(w, z)$, holding $w$ constant causes $U_k$ to **collapse from degree 4 down to purely quadratic polynomials in $y$**:
$$E_k(y) = y^T M_k y + L_k y + c_k = 0 \quad (k = 0, \dots, 17)$$
Third-order discrete differences $\Delta_d^3 E_k(y) \equiv 0 \pmod{17}$ empirically verify that 100% of these equations have collapsed into degree 2.

---

#### 4.3.4. Stage 4: Breaking UOV Symmetry - Oil Subspace Recovery (Kipnis-Shamir Kernel Attack)
We now face 18 quadratic equations in 16 variables $y$. Each equation is defined by a symmetric matrix $M_k \in \mathbb{F}_{17}^{16 \times 16}$.

Recall the internal UOV structure of layer $U$:
- The vector $z_{16 \dots 31}$ contains $s = 4$ Vinegar variables and $o = 12$ Oil variables.
- There are no cross-terms between Oil variables ($\text{Oil} \times \text{Oil} = 0$).
- Thus, there exists an Oil subspace $O \subset \mathbb{F}_{17}^{16}$ of dimension $\dim(O) = 12$ on which the quadratic forms vanish identically:
  $$\forall x, z \in O, \; \forall k \in [0..17]: \quad x^T M_k z = 0 \iff O^T M_k O = 0_{12 \times 12}$$

In a coordinate basis where $O$ spans the last 12 coordinates:
$$M_k = \begin{pmatrix} A_k & B_k \\ B_k^T & 0_{12 \times 12} \end{pmatrix}$$
where $A_k$ is $4 \times 4$ and $B_k$ is $4 \times 12$.
- The rank of $M_k$ is bounded by:
  $$\operatorname{Rank}(M_k) \le \operatorname{Rank}(A_k) + 2 \cdot \operatorname{Rank}(B_k) \le 4 + 4 = 8$$
  Empirically, all $18/18$ matrices exhibit rank **strictly equal to 8**.
- Kernel dimension: $\dim(\ker(M_k)) = 16 - 8 = 8$.
- Consider a vector $v = \begin{pmatrix} x \\ z \end{pmatrix} \in \ker(M_k)$:
  $$M_k v = \begin{pmatrix} A_k x + B_k z \\ B_k^T x \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix} \implies B_k^T x = 0$$
  Since $B_k^T$ is $12 \times 4$ with full column rank 4, $B_k^T x = 0$ implies $x = 0$.  
  Consequently, $v = \begin{pmatrix} 0 \\ z \end{pmatrix} \in O$.

$$\mathbf{\ker(M_k) \subseteq O \quad (\forall k \in [0..17])}$$
The kernels of all 18 matrices are contained entirely within the Oil subspace.  
Taking the sum of these kernel spaces:
$$O = \sum_{k=0}^{17} \ker(M_k) \subset \mathbb{F}_{17}^{16}$$
Summing the kernels of just the first few matrices immediately yields a vector space of dimension exactly **12**.  
Verifying the isotropic condition:
$$O_{\text{basis}} \cdot M_k \cdot O_{\text{basis}}^T \equiv 0 \pmod{17} \quad (\forall k)$$
Holds identically. The Oil subspace $O$ is 100% recovered.

---

#### 4.3.5. Stage 5: Vinegar Exhaustion & High-Speed Gaussian Elimination (High-Performance C Solver)
Choose a complementary subspace $V$ of dimension $16 - 12 = 4$ such that $\mathbb{F}_{17}^{16} = V \oplus O$.  
Let $S = [S_V \mid S_O]$ denote the basis change matrix, where $S_V \in \mathbb{F}_{17}^{16 \times 4}$ and $S_O \in \mathbb{F}_{17}^{16 \times 12}$.  
Any vector $y$ decomposes uniquely as:
$$y = S_V \cdot v + S_O \cdot o \quad (v \in \mathbb{F}_{17}^4, \; o \in \mathbb{F}_{17}^{12})$$

Substituting into the 18 quadratic equations $E_k(y) = y^T M_k y + L_k y + c_k = 0$:
$$y^T M_k y = v^T (S_V^T M_k S_V) v + 2 v^T (S_V^T M_k S_O) o + \underbrace{o^T (S_O^T M_k S_O) o}_{= 0}$$
The quadratic term in $o$ vanishes completely. The system becomes **linear in the 12 Oil variables $o$**:
$$A(v) \cdot o + b(v) = 0 \pmod{17}$$
where:
$$\begin{aligned}
A(v)_{k, :} &= 2 (S_V v)^T M_k S_O + L_k S_O \in \mathbb{F}_{17}^{1 \times 12} \\
b(v)_k &= v^T (S_V^T M_k S_V) v + L_k S_V v + c_k \in \mathbb{F}_{17}
\end{aligned}$$

- The search space for the Vinegar vector $v \in \mathbb{F}_{17}^4$ is only:
  $$17^4 = \mathbf{83,521 \text{ cases}}$$
- For each $v$, there are 18 linear equations for 12 unknowns $o$. The system has $18 - 12 = 6$ redundant constraints, meaning the probability that an arbitrary incorrect $v$ admits a solution is:
  $$17^{-6} \approx \frac{1}{24,137,569}$$
  Hence, **only the single correct Vinegar vector $v$** yields a consistent linear system.

Implemented in C (`solver.c`):
- Loop over all $83,521$ values of $v$.
- Build the augmented matrix $[A(v) \mid -b(v)]$ of size $18 \times 13$.
- Perform Gaussian elimination on the first 12 columns. If an inconsistency appears in the bottom 6 rows ($0 \ne \text{RHS}$), immediately trigger an early exit to the next $v$.
- **Performance:** The C solver completes all $83,521$ iterations and extracts $(v, o)$ in less than **4 milliseconds**!

---

### 4.4. End-to-End Exploit Pipeline

1. **Offline Precomputation (`step1_save.py`):**
   - Parse `out.txt`, sample degree-3 and degree-4 monomials to determine Left Nullspace $V_{\text{null}}$ ($16 \times 34$).
   - Compute degree-4 gradients to derive change-of-basis matrices $T$ and $T^{-1}$ ($32 \times 32$).
   - Reduce the 16 quadratic polynomials $Q(x)$ and store in `Q_polys.json`.
   - Compute linear matrix $K$ and inverse $K^{-1}$ ($16 \times 16$).
   - Interpolate 18 quadratic forms $M_k$ ($16 \times 16$).
   - Compute kernels of $M_k$ and span the Oil basis $S_O$ ($16 \times 12$) and complement $S_V$ ($16 \times 4$).
   - Save precomputed structures into `precomputed.npz` (one-off ~100s execution).

2. **Online Block Decryption (`solve_all.py`):**
   For each ciphertext block $C \in \mathbb{F}_{17}^{34}$:
   - Compute $\text{target\_Q} = V_{\text{null}} \cdot C$.
   - Interpolate linear terms $L_k$ and constants $c_k$ (17 reduced polynomial evaluations, ~5s).
   - Write parameters into binary `params.bin`.
   - Invoke `solver.exe` to find $(v, o)$ in milliseconds.
   - Reconstruct: $y = S_V v + S_O o \implies u = K^{-1}(\text{target\_Q} - Q(0, y)) \implies x = T^{-1} \begin{pmatrix} u \\ y \end{pmatrix}$.
   - Verify: $P(x) \equiv C \pmod{17}$ matching 100%.

3. **Base-17 Frame Decoding:**
   - Concatenate the 3 solution vectors $x_0, x_1, x_2$ into a 96-digit base-17 stream.
   - Convert pairs of base-17 digits into bytes ($17^2 = 289 > 256$).
   - Read the 4-byte big-endian length prefix and extract the flag UTF-8 string.

---

### 4.5. Complete Exploit Code (C & Python)

#### 1. High-Performance C Solver (`solver.c`)

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Multiplicative inverse table modulo 17: inv17[a] * a = 1 (mod 17)
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

    // Exhaust 17^4 = 83521 combinations of Vinegar vector v
    for (v[0] = 0; v[0] < 17; v[0]++) {
    for (v[1] = 0; v[1] < 17; v[1]++) {
    for (v[2] = 0; v[2] < 17; v[2]++) {
    for (v[3] = 0; v[3] < 17; v[3]++) {
        // Construct augmented coefficient matrix [A(v) | -b(v)]
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

        // Gaussian elimination over F_17
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

        // Check consistency of the 6 redundant equations
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

#### 2. End-to-End Decryption Script (`solve_all.py`)

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

print("[*] Loading public key and ciphertext from out.txt...")
t0 = time.time()
with open("out.txt") as f:
  data = json.load(f)

polys = data["public_key"]["polynomials"]
blocks = data["ciphertext"]["blocks"]

print("[*] Loading precomputed algebraic structures...")
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


# Precompute tensors H and F (independent of ciphertext C)
H_tensors = np.zeros((18, 4, 12), dtype=np.int32)
F_tensors = np.zeros((18, 4, 4), dtype=np.int32)
for k in range(18):
  H_tensors[k] = (S_V.T @ M_mats[k] @ S_O) % p
  F_tensors[k] = (S_V.T @ M_mats[k] @ S_V) % p


def solve_block(block_idx, C):
  print(f"\n[*] Decrypting ciphertext block {block_idx}...")
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

  # Fast interpolation at 0 and 16 unit vectors e_i (only 17 evaluation points)
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

  # Write parameters to binary for C solver processing
  with open("params.bin", "wb") as f:
    f.write(H_tensors.tobytes())
    f.write(D_mat.tobytes())
    f.write(F_tensors.tobytes())
    f.write(G_mat.tobytes())
    f.write(C_const_32.tobytes())

  res = subprocess.run(["./solver.exe", "params.bin"], capture_output=True, text=True)
  if "SOLUTION_FOUND" not in res.stdout:
    raise RuntimeError("[-] C Solver found no solution!")

  lines = res.stdout.strip().split("\n")
  v_line = [l for l in lines if l.startswith("V:")][0]
  o_line = [l for l in lines if l.startswith("O:")][0]
  v_sol = np.array([int(x) for x in v_line[2:].split()], dtype=int)
  o_sol = np.array([int(x) for x in o_line[2:].split()], dtype=int)
  print(f"[+] Found Vinegar solution: {v_sol}")
  print(f"[+] Found Oil solution:     {o_sol}")

  # Recover original coordinates x
  y_sol = (S_V @ v_sol + S_O @ o_sol) % p
  u_sol = get_u_star(y_sol)
  x_sol = (T_inv @ np.concatenate([u_sol, y_sol])) % p

  # Re-verify with the original polynomial system
  encrypted = np.array([eval_poly_all(poly, x_sol) for poly in polys])
  assert np.all((encrypted - C) % p == 0), "[-] Verification failed!"
  print(f"[+] Block {block_idx} successfully decrypted and verified in {time.time() - t_blk:.2f}s!")
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


# Solve all 3 ciphertext blocks sequentially
all_x = []
for idx, blk in enumerate(blocks):
  x_sol = solve_block(idx, np.array(blk))
  all_x.extend(list(x_sol))

print("\n[*] All blocks have been successfully decrypted!")
plaintext = decode_frame(all_x, p, n)
print("\n" + "=" * 48)
print(f"FLAG: {plaintext.decode('utf-8', errors='replace')}")
print("=" * 48 + "\n")
```

---

### 4.6. Flag

$$\mathbf{CSSCTF\{P35T0\_5CH3M3\_4TT4CK2026\}}$$

*(Flag Meaning: **PESTO Scheme Attack** - PESTO is a culinary pun referencing pesto sauce (oil and vinegar blended with herbs), symbolizing the hybridization between the Tame triangular transformation layer and the Unbalanced Oil and Vinegar (UOV) layer).*

---

## 5. Summary & Key Takeaways

| Criteria | Chrono I | Chrono II | Chimera Vault | Severed Symmetry |
| :--- | :--- | :--- | :--- | :--- |
| **Cryptography Class** | Polyalphabetic Substitution (Vigenère) | Multi-gear Stream Cipher | Multi-layer Cryptosystem (DSP + Linear Algebra + Knapsack) | Multivariate Public Key Cryptography (MPKC - Tame + UOV) |
| **Input Data** | Static Ciphertext + Timestamp | Real-time dynamic ciphertext stream (1 Hz) | Base64 PCM audio stream + State matrices + Knapsack sum | 34 public degree-4 polynomials (31MB out.txt) + 3 ciphertext blocks |
| **Decryption Key** | Timestamp digits (14 digits) | Periodic 77-second keystream ($\operatorname{lcm}(7, 11)$) | Key $W$ embedded in matrix trace $\operatorname{Tr}(D) \pmod N$ | Affine maps $A_1, A_2$ and trapdoor polynomials $q, U$ |
| **Core Vulnerability** | Fixed `CSSCTF` prefix exposes shift | Spatiotemporal phase delay $\Delta t = 34$ | - Frequencies are multiples of 5Hz<br>- Matrix trace invariant $\operatorname{Tr}(M_{k+1}-M_k)$<br>- Superincreasing knapsack collapses given $W$ | - Incomplete high-degree dimension ($\operatorname{Rank}=18 < 34$)<br>- Degree-4 terms depend solely on 16 base variables<br>- Oil space $O$ vanishes on quadratic forms ($o=12 > v=4$) |
| **Attack Technique** | Known-Plaintext Attack | KPA + Cycle analysis via $\gcd$ | DTFT Orthogonal Projection + Matrix Trace Invariant + Merkle-Hellman Trapdoor Inversion | Left Nullspace Degree Elimination + Gradient Subspace Isolation + Kipnis-Shamir Kernel Attack + Exhaustive C Solver |

### Key Takeaways:
1. **Frequency-Domain Analysis (DSP in Cryptography):** When an encryption scheme encodes keys within acoustic waveforms, identifying structural constraints (sampling rate, quantization step, discrete candidate set) enables direct orthogonal projection with absolute precision, avoiding white noise distortion and spectral leakage.
2. **Security through Pseudo-Complexity:** Fancy terminology such as *"Non-commutative Matrix Drift"* was simply camouflage for additive linear shifts. In linear algebra, trace is strictly linear: $\operatorname{Tr}(A + B) = \operatorname{Tr}(A) + \operatorname{Tr}(B)$. The trace invariant remains a fatal flaw in diagonal drift designs.
3. **The Collapse of Merkle-Hellman Knapsack Cryptosystems:** While general Subset Sum is NP-complete, the superincreasing variant solves in linear time $O(n)$. The entire security of Merkle-Hellman depends on keeping the multiplier $W$ and modulus $M_{\text{mod}}$ secret. Once $W$ is exposed, the trapdoor inverts trivially.
4. **Fragility of Multivariate Schemes (MPKC Vulnerabilities):**
   - **Degree Elimination:** When lower-degree components ($w$ of degree 2) are mixed into higher-degree equations (degree 4) via an affine map $A_1$, if the count of higher-degree polynomials ($18$) is less than the total count of public polynomials ($34$), the higher-degree coefficient matrix possesses a non-trivial Left Nullspace. This projection strips away the high-degree shell immediately.
   - **Breaking UOV Symmetry (Kipnis-Shamir Attack):** In Oil & Vinegar schemes, security requires $v \ge o$. When $o > v$ (here $o = 12, v = 4$), the quadratic form matrices undergo severe rank deficiency ($\operatorname{Rank} \le 2v = 8$). The kernels of these matrices lie entirely inside the Oil subspace, reducing trapdoor recovery to basic linear algebra.
   - **Multi-tiered Optimization (C Acceleration for CTF):** Combining abstract algebraic reduction in Python to narrow the search space to $17^4 = 83,521$ states, and leveraging low-level C to exhaust and Gaussian-eliminate within milliseconds, exemplifies modern real-time MPKC cryptanalysis.
