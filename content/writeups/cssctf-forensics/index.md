---
title: '[CSSCTF] Digital Forensics: Nexus Series'
date: '2026-10-02'
description: In-depth technical writeups for the Nexus Series Digital Forensics challenges in CSSCTF 2026 (Audio DSP Demodulation, Disk Carving, PCAP Analysis, Linux Artifacts).
categories: [CSSCTF, Forensics]
tags: [cssctf, forensics, pcap, audio-dsp, disk-carving, ext4, steganography]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] Digital Forensics Writeup: Nexus Series

**Author:** k0z1l  
**Category:** Digital Forensics / Audio DSP / Disk Carving / PCAP Analysis / Linux Artifacts  
**Flag Format:** `CSSCTF{...}`  

---

## Table of Contents
1. [The False Timeline](#1-the-false-timeline)
   - [1.1. Challenge Description & Scenario](#11-challenge-description--scenario)
   - [1.2. Initial Reconnaissance & Ext4 Filesystem Analysis](#12-initial-reconnaissance--ext4-filesystem-analysis)
   - [1.3. True Timeline Reconstruction](#13-true-timeline-reconstruction)
   - [1.4. Recovery & Decryption of Emergency Access Key (`.ekey-cache`)](#14-recovery--decryption-of-emergency-access-key-ekey-cache)
   - [1.5. Annotated Solution Script (Python)](#15-annotated-solution-script-python)
   - [1.6. Flag](#16-flag)
2. [Signal Fracture](#2-signal-fracture)
   - [2.1. Challenge Description & Scenario](#21-challenge-description--scenario)
   - [2.2. Disk Image & Network Packet Reconnaissance (PCAP & Disk Recon)](#22-disk-image--network-packet-reconnaissance-pcap--disk-recon)
   - [2.3. Dissecting the `NXFR` Fragmentation Architecture](#23-dissecting-the-nxfr-fragmentation-architecture)
   - [2.4. Recovery and Integrity Verification of 8 Fragments (Fragment Carving)](#24-recovery-and-integrity-verification-of-8-fragments-fragment-carving)
   - [2.5. Archive Reconstruction and Flag Extraction](#25-archive-reconstruction-and-flag-extraction)
   - [2.6. Annotated Solution Script (Python)](#26-annotated-solution-script-python)
   - [2.7. Flag](#27-flag)
3. [Ghost Frequency](#3-ghost-frequency)
   - [3.1. Challenge Description & Scenario](#31-challenge-description--scenario)
   - [3.2. Blackbox Audio Reconnaissance (`KBR17_blackbox.wav`)](#32-blackbox-audio-reconnaissance-kbr17_blackboxwav)
   - [3.3. Nature of the "Ghost Frequency" (1536 Hz vs. Bell 202 AFSK)](#33-nature-of-the-ghost-frequency-1536-hz-vs-bell-202-afsk)
   - [3.4. Bell 202 AFSK 1200 Baud Demodulation & UART 8N1 Frame Recovery](#34-bell-202-afsk-1200-baud-demodulation--uart-8n1-frame-recovery)
   - [3.5. Dissecting `NXPKT` & Forward Error Correction (RAID-4 / XOR Parity)](#35-dissecting-nxpkt--forward-error-correction-raid-4--xor-parity)
   - [3.6. Raw DEFLATE Stream Decompression & Flag Extraction](#36-raw-deflate-stream-decompression--flag-extraction)
   - [3.7. Annotated Solution Script (Python)](#37-annotated-solution-script-python)
   - [3.8. Flag](#38-flag)
4. [Echoes of the Relay](#4-echoes-of-the-relay)
   - [4.1. Challenge Analysis & Investigative Strategy](#41-challenge-analysis--investigative-strategy)
   - [4.2. Step 1: Disk Image Identification](#42-step-1--disk-image-identification)
   - [4.3. Step 2: Filesystem Metadata Inspection](#43-step-2--filesystem-metadata-inspection)
   - [4.4. Step 3: Directory Tree Enumeration](#44-step-3--directory-tree-enumeration)
   - [4.5. Step 4: Identifying Deleted Inodes (`lsdel`)](#45-step-4--identifying-deleted-inodes-lsdel)
   - [4.6. Step 5: Direct Carving of Residual Data Blocks](#46-step-5--direct-carving-of-residual-data-blocks)
   - [4.7. Step 6: Extracting PNG Image from Filesystem](#47-step-6--extracting-png-image-from-filesystem)
   - [4.8. Step 7: PNG Chunk Structure Analysis](#48-step-7--png-chunk-structure-analysis)
   - [4.9. Step 8: ZIP Archive Analysis & Decryption](#49-step-8--zip-archive-analysis--decryption)
   - [4.10. Step 9: Flag Retrieval](#410-step-9--flag-retrieval)
   - [4.11. Flag](#411-flag)
   - [4.12. Attack Chain Summary](#412-attack-chain-summary)
   - [4.13. Key Forensic Takeaways](#413-key-forensic-takeaways)
   - [4.14. Quick Command Cheat-Sheet](#414-quick-command-cheat-sheet)
   - [4.15. Appendix: Offsets & Reference Values](#415-appendix--offsets--reference-values)
5. [Summary & Key Takeaways](#5-summary--key-takeaways)

---

## 1. The False Timeline

### 1.1. Challenge Description & Scenario
> *Nexus Incident Response recovered a filesystem image from Relay NX-17 after an unauthorised emergency key export. Investigators concluded that Relay Administrator KAI-7 performed the export at approximately 03:17.*
> 
> *There is one problem. KAI-7 had already disconnected. Someone wanted the investigation to end there.*
> 
> *Reconstruct the true incident timeline and recover the stolen emergency access key. Flag format: `CSSCTF{...}`*
> 
> **Attached Asset:** System disk image `nexus_relay.img` (128 MB).

---

### 1.2. Initial Reconnaissance & Ext4 Filesystem Analysis

Inspecting magic bytes of `nexus_relay.img`:
- At offset `0x400` (Linux Ext filesystem Superblock block):
  - Bytes at `0x438:0x43A` read `53 ef` (`0xEF53` Little-Endian).
  - This identifies standard **Linux Ext4** (`s_magic = EXT4_SUPER_MAGIC`).

Extracting the directory hierarchy using Python's `ext4` library exposes the critical artifacts:
- `/etc/machine-id`: Machine identifier string (`8f3b2a1c9e4d56781234abcd567890ef`).
- `/home/kai/.bash_history`: Bash command history for user `kai`.
- `/opt/nexus/lib/exporter.py`: Python module detailing key derivation and encryption routines.
- `/var/cache/nexus/.ekey-cache`: Binary payload containing the stolen emergency key package.
- `/var/lib/nexus/metadata.db`: SQLite database storing user sessions and export jobs.
- `/var/log/auth.log`: SSH authentication logs and user session transitions.
- `/var/log/audit/audit.log`: Linux Auditd kernel log recording exact syscall events.
- `/var/log/nexus/relay.log`: Application runtime logs from Relay NX-17.

---

### 1.3. True Timeline Reconstruction

#### 1. Fabricated Evidence in `relay.log`
Initial triage attributed the key export to KAI-7 at `03:17` based on `/var/log/nexus/relay.log`:
```text
2101-10-01T03:17:03+10:00 relay-core[1847]: WARN export request accepted principal=KAI-7 resource=emergency-core
2101-10-01T03:17:04+10:00 relay-core[1847]: INFO resource package completed.
```
The adversary planted or manipulated this application log entry to frame Administrator KAI-7.

#### 2. KAI-7's Alibi in `auth.log`
Cross-referencing authentication records in `/var/log/auth.log`:
- **`02:52:11`**: Administrator `kai` logged in via SSH from IP `10.5.21.99`, assigned Session 4 (`New session 4 of user kai`).
- **`02:55:01`**: `kai` checked service health: `sudo /bin/systemctl status nexus-relay`.
- **`03:05:41`**: `kai` **disconnected and fully terminated the SSH session**:
  ```text
  Oct  1 03:05:41 nx-17 sshd[1822]: pam_unix(sshd:session): session closed for user kai
  Oct  1 03:05:41 nx-17 systemd-logind[789]: Session 4 logged out. Waiting for processes to exit.
  Oct  1 03:05:41 nx-17 systemd-logind[789]: Removed session 4.
  ```
- **`03:10:02`**: A `su` privilege escalation to service account `svc-relay` was performed by `root`:
  ```text
  Oct  1 03:10:02 nx-17 su[1890]: Successful su for svc-relay by root
  Oct  1 03:10:02 nx-17 su[1890]: pam_unix(su:session): session opened for user svc-relay(uid=998) by (uid=0)
  ```
- **Conclusion:** KAI-7 disconnected more than 11 minutes prior to 03:17. This provides an absolute alibi.

#### 3. Process Execution Traces in `audit.log`
Linux Auditd captures immutable, kernel-level syscall records with precise Unix Epoch timestamps:
1. `audit(4157542380)`: `kai` (uid=1001, auid=1001, session=4) executed `systemctl status nexus-relay`.
2. `audit(4157543482)`: A shell (`sh`) was spawned by `uid=998 (svc-relay)` at `03:11:22`.
3. **`audit(4157543568)`**: Execution of the emergency key export utility:
   ```text
   type=SYSCALL msg=audit(4157543568.045:92): arch=c000003e syscall=59 ... uid=998 ... comm="nx-export" exe="/opt/nexus/bin/nx-export" key="nexus_export"
   type=EXECVE msg=audit(4157543568.045:92): argc=2 a0="/opt/nexus/bin/nx-export" a1="--emergency"
   ```
   - Execution Timestamp: **Epoch = `4157543568`** (`03:12:48`).
   - Executing User: **`uid=998 (svc-relay)`** (not KAI-7).
4. `audit(4157543712)` (at `03:15:12`): Evidence tampering via **Timestomping**:
   ```text
   type=PROC_PROCTITLE msg=audit(4157543712.500:99): proctitle=746f756368002d72002f6574632f6d616368696e652d6964002f7661722f63616368652f6e657875732f2e656b65792d6361636865
   ```
   Decoded proctitle hex: `touch -r /etc/machine-id /var/cache/nexus/.ekey-cache`.  
   *Adversary Intent:* Copy timestamps from `/etc/machine-id` onto `.ekey-cache` to conceal its creation time.

#### 4. Session & Job Metadata in SQLite `metadata.db`
Querying `/var/lib/nexus/metadata.db`:
- **Table `sessions`:**
  - KAI-7's Session: `session_uuid = b7a1c8d9-23f4-4d8e-9c12-78d1f2a4b679` (terminated at `4157543141` $\approx$ `03:05:41`).
  - `svc-relay` Session: **`session_uuid = aab0c8b2-f8b1-4f11-9a72-6d8123a1005a`** (started at `4157543482` $\approx$ `03:11:22`).
- **Table `jobs`:**
  - Job ID 2: `emergency_export` on resource `emergency-core`, status `completed`.
  - Created Timestamp: `created_at = 4157543568`.
  - Responsible Session: **`session_uuid = aab0c8b2-f8b1-4f11-9a72-6d8123a1005a`** (`svc-relay`).

#### 5. Timeline Reconciliation Table (True Timeline vs. False Timeline)

| Timestamp (UTC) | Epoch | Real Incident Event (True Timeline) | Evidentiary Source | Fabricated Narrative (False Timeline) |
| :--- | :---: | :--- | :--- | :--- |
| `02:52:11` | 4157542331 | KAI-7 SSH login (Session 4) | `auth.log` | |
| `02:55:01` | 4157542501 | KAI-7 checks relay status | `auth.log`, `audit.log` | |
| **`03:05:41`** | **4157543141** | **KAI-7 logs out and terminates SSH session** | `auth.log`, `metadata.db` | |
| `03:10:02` | 4157543402 | Root performs `su` transition to `svc-relay` | `auth.log` | |
| `03:11:22` | 4157543482 | `svc-relay` initializes interactive shell | `audit.log`, `metadata.db` | |
| **`03:12:48`** | **4157543568** | **`svc-relay` executes `nx-export --emergency` to steal key** | `audit.log`, `metadata.db` | |
| `03:15:12` | 4157543712 | Adversary timestomps `.ekey-cache` via `touch -r` | `audit.log` | |
| *`03:17:03`* | *4157543823* | *No background process activity recorded* | Quiescent system | **Fabricated log in `relay.log` blaming KAI-7** |

---

### 1.4. Recovery & Decryption of Emergency Access Key (`.ekey-cache`)

Examining `/opt/nexus/lib/exporter.py`:
```python
def derive_emergency_key(
    machine_id: str, session_uuid: str, event_epoch: int
) -> bytes:
  material = f"{machine_id.strip()}|{session_uuid.strip()}|{int(event_epoch)}"
  return hashlib.sha256(material.encode("utf-8")).digest()
```

Packet layout of `.ekey-cache` (61 bytes):
- Bytes 0..7 (8 bytes): Magic header `b"NXKEY_V1"`
- Bytes 8..19 (12 bytes): AES-GCM IV/Nonce (`ceb41b1eb7393aafd5229166`)
- Bytes 20..60 (41 bytes): AES-GCM Ciphertext and 16-byte Authentication Tag.

Artifact values derived from the True Timeline:
- `machine_id` = `8f3b2a1c9e4d56781234abcd567890ef`
- `session_uuid` = `aab0c8b2-f8b1-4f11-9a72-6d8123a1005a` (`svc-relay`)
- `event_epoch` = `4157543568`

---

### 1.5. Annotated Solution Script (Python)

```python
#!/usr/bin/env python3
"""
The False Timeline Solution Script
Purpose: Derive AES-256 key from reconstructed forensic artifacts
and decrypt the .ekey-cache container.
"""

import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# 1. Read binary cache data
cache_file = r"e:\CSSCTF\extracted\var\cache\nexus\.ekey-cache"
with open(cache_file, "rb") as f:
    encrypted_data = f.read()

# 2. Parse NXKEY_V1 container
magic = encrypted_data[:8]         # First 8 bytes: b'NXKEY_V1'
nonce = encrypted_data[8:20]       # Next 12 bytes: Nonce / IV
ciphertext = encrypted_data[20:]   # Remainder: Ciphertext + Auth Tag

print(f"[*] Header format: {magic}")
print(f"[*] Nonce (hex): {nonce.hex()}")
print(f"[*] Ciphertext length: {len(ciphertext)} bytes")

# 3. Parameters from True Timeline
machine_id = "8f3b2a1c9e4d56781234abcd567890ef"  # /etc/machine-id
session_uuid = "aab0c8b2-f8b1-4f11-9a72-6d8123a1005a"  # Actual svc-relay session
event_epoch = 4157543568  # Timestamp from audit.log

# 4. Derive AES-256 key matching exporter.py logic
# Formula: SHA256(machine_id|session_uuid|event_epoch)
key_material = f"{machine_id}|{session_uuid}|{event_epoch}"
aes_key = hashlib.sha256(key_material.encode("utf-8")).digest()

print(f"[*] Derivation string: {key_material}")
print(f"[*] Derived AES-256 key: {aes_key.hex()}")

# 5. Decrypt using AES-GCM
aesgcm = AESGCM(aes_key)
try:
    decrypted_key = aesgcm.decrypt(nonce, ciphertext, None)
    flag = decrypted_key.decode("utf-8")
    print("\n" + "=" * 50)
    print(f"[+] EMERGENCY ACCESS KEY SUCCESSFULLY DECRYPTED:")
    print(f"[+] Flag: {flag}")
    print("=" * 50)
except Exception as e:
    print(f"[-] Decryption failed: {e}")
```

### 1.6. Flag

```text
CSSCTF{kai_did_not_do_it}
```

---

## 2. Signal Fracture

### 2.1. Challenge Description & Scenario
> *KBR-17 came back online for only fourteen seconds before the Nexus fabric collapsed again. A passive tap captured the relay's final uplink, and technicians recovered the relay drive exactly as it was after emergency shutdown.*
> 
> *Two details survived in the maintenance notes: the scheduler catalog was intact even though the spool index had been purged and uplink retries may have produced more than one copy of the same fragment.*
> 
> *Flag Format: `CSSCTF{...}`*
> 
> **Provided Assets:**
> - `KBR17_relay.img` (64 MB - relay storage image).
> - `KBR17_uplink.pcap` (5.3 KB - uplink network packet capture).

---

### 2.2. Disk Image & Network Packet Reconnaissance (PCAP & Disk Recon)

#### 1. Disk Image Analysis (`KBR17_relay.img`):
Examining MBR partition table at sector 0:
- **Partition 0:** Starts at LBA `2048` (offset `1,048,576` bytes), 24 MB. **Linux Ext4** labeled `NEXUS_SYS`.
- **Partition 1:** Starts at LBA `53248` (offset `27,262,976` bytes), 32 MB, type `0xda` (Non-FS raw data).

Extracting Partition 0 (`NEXUS_SYS`) reveals vital logs and specifications:
1. `/opt/nexus/docs/fragment-format.txt`: Protocol specification for fragment data structures.
2. `/home/operator/maintenance.txt`: Note 17-B confirming:
   - The scheduler catalog retains authoritative fragment sequences and expected SHA-256 hashes.
   - The raw spool operates as a circular Ring Buffer: purging merely unlinks catalog references while **leaving raw sector data intact**.
   - Network capture may contain duplicate fragments caused by transmission retries.
3. `/var/log/nexus/transfer.log`: Log of the emergency burst transfer:
   ```text
   2101-03-17T02:18:41Z relay17 transfer_mgr[418]: object=emergency_burst_17 session=6E2C17A9 fragments=8 queued
   2101-03-17T02:18:46Z relay17 uplinkd[502]: session=6E2C17A9 retry requested seq=6
   2101-03-17T02:18:47Z relay17 uplinkd[502]: session=6E2C17A9 retry acknowledged seq=6
   ```
   $\implies$ Transfer `session = 0x6E2C17A9`, object `emergency_burst_17` comprises exactly **8 fragments** (seq 0 to 7). Fragment 6 underwent retry!
4. `/var/lib/nexus/scheduler/relay.db`: SQLite database holding the `fragments` table, providing expected SHA-256 hashes for all 8 fragments.

---

### 2.3. Dissecting the `NXFR` Fragmentation Architecture

Per `/opt/nexus/docs/fragment-format.txt`, `NXFR` packets follow Big-Endian byte order:

| Offset | Size | Data Type | Field Description |
| :---: | :---: | :---: | :--- |
| `0x00` | 4 bytes | ASCII | Magic header: `NXFR` (`0x4E 0x58 0x46 0x52`) |
| `0x04` | 4 bytes | uint32 | `session_id` (`0x6E2C17A9`) |
| `0x08` | 2 bytes | uint16 | `sequence` (0-indexed fragment sequence number) |
| `0x0A` | 2 bytes | uint16 | `total_fragments` (total fragment count: 8) |
| `0x0C` | 4 bytes | uint32 | `payload_length` (length of fragment payload) |
| `0x10` | 4 bytes | uint32 | `payload_crc32` (CRC32 checksum of payload) |
| `0x14` | ... | bytes | Fragment `payload` data |

*Crucial Detail:* The **SHA-256** checksum stored in `relay.db` applies strictly to the **payload bytes**, excluding the 20-byte `NXFR` header.

---

### 2.4. Recovery and Integrity Verification of 8 Fragments (Fragment Carving)

Querying table `fragments` in `relay.db` for session `6E2C17A9`:

| Seq | Source Type | Status | Expected SHA-256 (Scheduler Catalog) | Actual Recovery Location |
| :---: | :---: | :---: | :--- | :--- |
| **0** | `SPOOL` | `PURGED` | `fdde3a6dc2c9d43e0bbf21b1e90d1214d5776405397ab54426ff7bb6bec8831d` | Disk `KBR17_relay.img` @ offset `0x1a40000` |
| **1** | `CACHE` | `RESIDENT` | `82fc22cae997c805035ef22fd98c260c626c67aaaef45301236bc549897e47ae` | File `/var/cache/nexus/objects/82fc22cae997c805.blob` |
| **2** | `SPOOL` | `PURGED` | `5cd4fd1f9bdc1360dc272362ee421b4f62f2818c7d68332440042c3e46b8f732` | Disk `KBR17_relay.img` @ offset `0x1d20000` |
| **3** | `UPLINK` | `CAPTURED` | `3258da54f56a49e79a1719d9145a6cd82691a0d2b10a9a1e8782e9cacf507dc6` | PCAP `KBR17_uplink.pcap` (Packet 8) |
| **4** | `CACHE` | `RESIDENT` | `4e86900e878981dcaec4e63b381395496598282d68f2a63e578350bdccfe7daa` | File `/var/cache/nexus/objects/4e86900e878981dc.blob` |
| **5** | `SPOOL` | `PURGED` | `27ffcedf5e0e4bbec59c36c662aa1397d729c9a8bcd6005131a048856efb3e58` | Disk `KBR17_relay.img` @ offset `0x2090000` |
| **6** | `UPLINK` | `RETRIED` | `fa9dbecb99768ea4d8470546b270845127278e797e09f71073df7e5658bdabae` | PCAP `KBR17_uplink.pcap` (Packet 10; Packet 9 was corrupted) |
| **7** | `UPLINK` | `CAPTURED` | `a9d2e70930248e74b776c1db737637d2e2a354308d216921225216288a94b7d0` | PCAP `KBR17_uplink.pcap` (Packet 11) |

*Resolving Seq 6 Conflict:*
The PCAP contains two packets claiming `seq = 6`:
- Packet 9: SHA256 = `a6b0308e...` $\rightarrow$ Mismatches catalog (corrupted attempt triggering retry).
- Packet 10: SHA256 = `fa9dbecb...` $\rightarrow$ Matches scheduler catalog 100% (valid retry).

---

### 2.5. Archive Reconstruction and Flag Extraction

With all 8 payloads verified:
1. Concatenate payloads in ascending order from `seq 0` to `seq 7`.
2. Total concatenated size: **6,725 bytes**.
3. Examining header bytes: `1f 8b 08 08` followed by original filename `emergency_burst_17.tar` confirms a **GZIP compressed TAR archive** (`.tar.gz`).
4. Decompressing GZIP yields a 10,240-byte TAR archive containing 3 files:
   - `burst_metadata.json`
   - `telemetry.bin`
   - `final_message.txt`
5. Reading `final_message.txt`:
   ```text
   KBR-17 EMERGENCY BURST // FINAL RECOVERY
   Origin: Kuiper Belt Relay 17
   Event: The Severance

   The relay did not fail silently. Its final burst survived as fragments across the spool ring and uplink.
   Authorization token: CSSCTF{fragment_t3ll_th3_st0ry}
   ```

---

### 2.6. Annotated Solution Script (Python)

```python
#!/usr/bin/env python3
"""
Signal Fracture Solution Script
Purpose:
1. Carve NXFR fragments from raw disk KBR17_relay.img (spool ring + cache).
2. Extract NXFR fragments from KBR17_uplink.pcap, resolving retry conflicts.
3. Validate SHA-256 against catalog and assemble 8 fragments into a tar.gz archive.
4. Decompress and read flag from final_message.txt.
"""

import gzip
import hashlib
import io
import struct
import tarfile

# Expected SHA-256 hashes from relay.db (Scheduler Catalog)
EXPECTED_HASHES = {
    0: "fdde3a6dc2c9d43e0bbf21b1e90d1214d5776405397ab54426ff7bb6bec8831d",
    1: "82fc22cae997c805035ef22fd98c260c626c67aaaef45301236bc549897e47ae",
    2: "5cd4fd1f9bdc1360dc272362ee421b4f62f2818c7d68332440042c3e46b8f732",
    3: "3258da54f56a49e79a1719d9145a6cd82691a0d2b10a9a1e8782e9cacf507dc6",
    4: "4e86900e878981dcaec4e63b381395496598282d68f2a63e578350bdccfe7daa",
    5: "27ffcedf5e0e4bbec59c36c662aa1397d729c9a8bcd6005131a048856efb3e58",
    6: "fa9dbecb99768ea4d8470546b270845127278e797e09f71073df7e5658bdabae",
    7: "a9d2e70930248e74b776c1db737637d2e2a354308d216921225216288a94b7d0",
}

SESSION_ID = 0x6E2C17A9
recovered_frags = {}

# ==========================================
# STEP 1: Scan for NXFR fragments in KBR17_relay.img
# ==========================================
print("[*] Scanning NXFR fragments in KBR17_relay.img...")
with open(r"e:\CSSCTF\KBR17_relay.img", "rb") as f:
    img_bytes = f.read()

pos = 0
while True:
    idx = img_bytes.find(b"NXFR", pos)
    if idx == -1:
        break

    hdr = img_bytes[idx : idx + 20]
    if len(hdr) == 20:
        magic, sess, seq, total, plen, pcrc = struct.unpack(">4sIHHII", hdr)
        if sess == SESSION_ID:
            payload = img_bytes[idx + 20 : idx + 20 + plen]
            phash = hashlib.sha256(payload).hexdigest()

            if seq in EXPECTED_HASHES and EXPECTED_HASHES[seq] == phash:
                recovered_frags[seq] = payload
                print(f"  [+] Disk: Successfully recovered Seq {seq} ({plen} bytes)")
    pos = idx + 4

# ==========================================
# STEP 2: Extract fragments from KBR17_uplink.pcap
# ==========================================
print("\n[*] Extracting NXFR fragments from KBR17_uplink.pcap...")
with open(r"e:\CSSCTF\KBR17_uplink.pcap", "rb") as f:
    pcap_bytes = f.read()

pos = 0
while True:
    idx = pcap_bytes.find(b"NXFR", pos)
    if idx == -1:
        break

    hdr = pcap_bytes[idx : idx + 20]
    if len(hdr) == 20:
        magic, sess, seq, total, plen, pcrc = struct.unpack(">4sIHHII", hdr)
        if sess == SESSION_ID:
            payload = pcap_bytes[idx + 20 : idx + 20 + plen]
            phash = hashlib.sha256(payload).hexdigest()

            if seq in EXPECTED_HASHES and EXPECTED_HASHES[seq] == phash:
                recovered_frags[seq] = payload
                print(f"  [+] Network PCAP: Successfully recovered Seq {seq} (SHA-256 Verified)")
    pos = idx + 4

print(f"\n[+] Total fragments assembled: {len(recovered_frags)}/8")

# ==========================================
# STEP 3: Concatenate and Decompress Archive
# ==========================================
if len(recovered_frags) == 8:
    assembled_gz = b"".join(recovered_frags[i] for i in range(8))
    print(f"[+] Successfully concatenated GZIP stream: {len(assembled_gz)} bytes")

    tar_data = gzip.decompress(assembled_gz)

    with tarfile.open(fileobj=io.BytesIO(tar_data)) as tar:
        message_file = tar.extractfile("final_message.txt")
        if message_file:
            message_content = message_file.read().decode("utf-8")
            print("\n" + "=" * 50)
            print("[+] CONTENT OF final_message.txt:")
            print(message_content)
            print("=" * 50)
```

### 2.7. Flag

```text
CSSCTF{fragment_t3ll_th3_st0ry}
```

---

## 3. Ghost Frequency

### 3.1. Challenge Description & Scenario
> *Following the collapse of the Nexus Fabric at relay station KBR-17, blackbox audio telemetry (`KBR17_blackbox.wav`) was recovered from the station's monitoring sensors.*
> 
> *The transmission was heavily interfered with by an uncharacterized "Ghost Frequency". Demodulate the covert radio signal hidden within to recover the final emergency transmission.*
> 
> *Flag Format: `CSSCTF{...}`*
> 
> **Provided Asset:** Audio file `KBR17_blackbox.wav` (22 MB, duration 115.2 seconds).

---

### 3.2. Blackbox Audio Reconnaissance (`KBR17_blackbox.wav`)

Technical audio parameters:
- Format: Stereo (2 discrete channels).
- Sample Rate: **48,000 Hz**.
- Bit Depth: **16-bit Signed Integer** (PCM).
- Total Samples: $5,529,608$ samples per channel $\approx$ **$115.20$ seconds**.

---

### 3.3. Nature of the "Ghost Frequency" (1536 Hz vs. Bell 202 AFSK)

Analyzing the spectrogram and instantaneous frequency across both channels:
1. **Left Channel:**
   - Dominated ($95\%$ of duration) by a constant **$1536 \text{ Hz}$** sine tone—this is the jamming **"Ghost Frequency"**.
   - Contains 18 intermittent wideband noise bursts spanning 0–4000 Hz.
2. **Right Channel:**
   - Active continuously from $0.000\text{s}$ to $111.145\text{s}$.
   - Evaluating half-period zero-crossings:
     - 20-sample intervals: $f = \frac{48000}{2 \times 20} = \mathbf{1200 \text{ Hz}}$ (Mark tone).
     - 11-sample intervals: $f = \frac{48000}{2 \times 11} \approx \mathbf{2200 \text{ Hz}}$ (Space tone).
   - $\implies$ **The right channel carries standard Bell 202 Audio Frequency Shift Keying (AFSK)!**
   - Transmission Baud Rate: **1200 baud**, yielding:
     $$\text{Samples per bit} = \frac{48000}{1200} = \mathbf{40 \text{ samples}}$$

---

### 3.4. Bell 202 AFSK 1200 Baud Demodulation & UART 8N1 Frame Recovery

#### 1. Matched Filter Demodulator:
For each 40-sample window, orthogonal energy projections are calculated:
$$E_{1200} = \left(\sum x[n] \sin(2\pi \cdot 1200 \cdot n / 48000)\right)^2 + \left(\sum x[n] \cos(2\pi \cdot 1200 \cdot n / 48000)\right)^2$$
$$E_{2200} = \left(\sum x[n] \sin(2\pi \cdot 2200 \cdot n / 48000)\right)^2 + \left(\sum x[n] \cos(2\pi \cdot 2200 \cdot n / 48000)\right)^2$$
- If $E_{1200} > E_{2200} \implies \text{Bit} = 1$ (Mark).
- If $E_{2200} > E_{1200} \implies \text{Bit} = 0$ (Space).

#### 2. Asynchronous UART 8N1 Framing:
The demodulated bitstream follows standard UART protocol:
- Idle State: High level $1$ (Mark).
- Start Bit: Low level $0$ (Space).
- Data Bits: 8 data bits transmitted **LSB-first**.
- Stop Bit: High level $1$ (Mark).

Framing yields clean ASCII protocol packets.

---

### 3.5. Dissecting `NXPKT` & Forward Error Correction (RAID-4 / XOR Parity)

Extracted plaintext lines exhibit the `NXPKT` structure:
```text
NXPKT|SESSION=NX-771|TYPE=DATA|SEQ=00|RETRY=0|LEN=1024|WIRECRC=A66FEFC8|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=DATA|SEQ=03|RETRY=0|LEN=1024|WIRECRC=BB1810C0|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=PARITY|GROUP=A|LEN=1024|WIRECRC=96ED68C1|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=DATA|SEQ=01|RETRY=0|LEN=1024|WIRECRC=7C3DCD2A|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=DATA|SEQ=06|RETRY=1|LEN=1024|WIRECRC=C04CF7F5|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=DATA|SEQ=04|RETRY=0|LEN=1024|WIRECRC=D6CCE79E|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=PARITY|GROUP=B|LEN=1024|WIRECRC=456CA33D|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=DATA|SEQ=07|RETRY=0|LEN=1024|WIRECRC=3D924BBF|DATA=<base64>
NXPKT|SESSION=NX-771|TYPE=DATA|SEQ=06|RETRY=2|LEN=1024|WIRECRC=2A18C562|DATA=<base64>
```

#### Forward Error Correction (RAID-4 / XOR Parity):
Session `NX-771` comprises **8 data blocks** (1024 bytes each), divided into two parity groups:

1. **Group A:**
   - Members: `SEQ 00`, `SEQ 01`, `SEQ 02`, `SEQ 03`, and `PARITY A`.
   - **`SEQ 02` was lost** in transmission.
   - Recover `SEQ 02` via XOR parity reconstruction:
     $$\text{SEQ 02} = \text{SEQ 00} \oplus \text{SEQ 01} \oplus \text{SEQ 03} \oplus \text{PARITY A}$$

2. **Group B:**
   - Members: `SEQ 04`, `SEQ 05`, `SEQ 06`, `SEQ 07`, and `PARITY B`.
   - **`SEQ 05` was lost** in transmission.
   - `SEQ 06` has two retries (`RETRY=1` and `RETRY=2`); select `RETRY=2`.
   - Recover `SEQ 05` via XOR parity reconstruction:
     $$\text{SEQ 05} = \text{SEQ 04} \oplus \text{SEQ 06} \oplus \text{SEQ 07} \oplus \text{PARITY B}$$

---

### 3.6. Raw DEFLATE Stream Decompression & Flag Extraction

1. Concatenate 8 recovered blocks (`SEQ 00` through `SEQ 07`) into an **$8192 \text{ byte}$** buffer.
2. Inspecting the first 10 bytes:
   - `0x00 .. 0x07`: Header metadata.
   - `0x08 .. 0x09`: Magic bytes `0x02 0x03`.
   - `0x0A ..`: Begins with signature bytes `ed 98 57 50 53 df be c7 ...` $\rightarrow$ **Raw DEFLATE Stream (RFC 1951)**.
3. Decompressing via `zlib.decompress(data[10:], -zlib.MAX_WBITS)` produces a 10,240-byte TAR archive:
   - `NX-771/relay_status.log`
   - `NX-771/navigation.dat`
   - `NX-771/final_message.txt`
4. Contents of `NX-771/final_message.txt`:
   ```text
   NEXUS EMERGENCY TRANSMISSION
   KBR-17 // SESSION NX-771

   The Severance did not erase every transmission.
   Some signals survived only because the relay kept redundant fragments.

   CSSCTF{th3_gh0st_fr3qu3ncy_w4s_n3v3r_s1l3nt}
   ```

---

### 3.7. Annotated Solution Script (Python)

```python
#!/usr/bin/env python3
"""
Ghost Frequency Solution Script
Purpose:
1. Parse KBR17_blackbox.wav and demodulate Bell 202 AFSK (1200/2200 Hz).
2. Frame UART 8N1 bits into ASCII NXPKT packets.
3. Reconstruct missing fragments (SEQ 02 and SEQ 05) via XOR Parity FEC.
4. Concatenate data blocks, decompress Raw DEFLATE, and read flag from TAR archive.
"""

import base64
import io
import tarfile
import wave
import zlib
import numpy as np

# ==========================================
# STEP 1: Load Right Audio Channel from WAV
# ==========================================
wav_path = r"e:\CSSCTF\KBR17_blackbox.wav"
print(f"[*] Loading audio asset {wav_path}...")
with wave.open(wav_path, "rb") as w:
    framerate = w.getframerate()
    nframes = w.getnframes()
    raw_bytes = w.readframes(nframes)

audio = np.frombuffer(raw_bytes, dtype=np.int16)
right_channel = audio[1::2].astype(np.float64)  # Right channel holds AFSK data

# ==========================================
# STEP 2: Demodulate Bell 202 AFSK (1200 baud)
# ==========================================
sps = 40  # 48000 Hz / 1200 baud = 40 samples/bit
num_bits = len(right_channel) // sps

t = np.arange(sps)
sin1200 = np.sin(2 * np.pi * 1200 * t / framerate)
cos1200 = np.cos(2 * np.pi * 1200 * t / framerate)
sin2200 = np.sin(2 * np.pi * 2200 * t / framerate)
cos2200 = np.cos(2 * np.pi * 2200 * t / framerate)

print("[*] Running matched filter correlator (1200 Hz Mark / 2200 Hz Space)...")
raw_bits = []
for i in range(num_bits):
    chunk = right_channel[i * sps : (i + 1) * sps]
    p1200 = np.dot(chunk, sin1200) ** 2 + np.dot(chunk, cos1200) ** 2
    p2200 = np.dot(chunk, sin2200) ** 2 + np.dot(chunk, cos2200) ** 2
    raw_bits.append(1 if p1200 > p2200 else 0)

# ==========================================
# STEP 3: Decode UART 8N1 Framing
# ==========================================
print("[*] Framing UART 8N1 byte stream (LSB first)...")
decoded_bytes = []
i = 0
start_bit, stop_bit = 0, 1

while i < len(raw_bits) - 10:
    if raw_bits[i] == start_bit and raw_bits[i + 9] == stop_bit:
        byte_val = sum(raw_bits[i + 1 + k] << k for k in range(8))
        decoded_bytes.append(byte_val)
        i += 10
        continue
    i += 1

packet_stream = bytes(decoded_bytes).decode("latin-1")

# ==========================================
# STEP 4: Parse NXPKT and Perform Parity FEC
# ==========================================
print("[*] Parsing NXPKT packets for session NX-771...")
lines = [l.strip() for l in packet_stream.split("\n") if l.strip()]

packets = {}
for line in lines:
    if line.startswith("NXPKT|"):
        parts = line.split("|")
        props = dict(p.split("=", 1) for p in parts[1:] if "=" in p)
        if props.get("SESSION") == "NX-771":
            ptype = props.get("TYPE")
            seq = props.get("SEQ", props.get("GROUP"))
            retry = props.get("RETRY", "0")
            data_bytes = base64.b64decode(props["DATA"])
            packets[(ptype, seq, retry)] = data_bytes

def xor_blocks(block_list):
    """Bitwise XOR across a list of bytearrays."""
    res = bytearray(len(block_list[0]))
    for b in block_list:
        for idx in range(len(res)):
            res[idx] ^= b[idx]
    return bytes(res)

# Reconstruct Group A (Missing SEQ 02):
d00 = packets[("DATA", "00", "0")]
d01 = packets[("DATA", "01", "0")]
d03 = packets[("DATA", "03", "0")]
parA = packets[("PARITY", "A", "0")]
d02 = xor_blocks([d00, d01, d03, parA])
print("[+] Reconstructed SEQ 02 using Group A Parity.")

# Reconstruct Group B (Missing SEQ 05, using SEQ 06 RETRY 2):
d04 = packets[("DATA", "04", "0")]
d06 = packets[("DATA", "06", "2")]
d07 = packets[("DATA", "07", "0")]
parB = packets[("PARITY", "B", "0")]
d05 = xor_blocks([d04, d06, d07, parB])
print("[+] Reconstructed SEQ 05 using Group B Parity.")

# Concatenate all 8 blocks
full_payload = d00 + d01 + d02 + d03 + d04 + d05 + d06 + d07

# ==========================================
# STEP 5: Decompress Raw DEFLATE and Read Flag
# ==========================================
print("[*] Decompressing Raw DEFLATE stream from offset 10...")
raw_deflate_data = full_payload[10:]
decompressed_tar = zlib.decompress(raw_deflate_data, -zlib.MAX_WBITS)

with tarfile.open(fileobj=io.BytesIO(decompressed_tar)) as tar:
    msg_file = tar.extractfile("NX-771/final_message.txt")
    if msg_file:
        msg_content = msg_file.read().decode("utf-8")
        print("\n" + "=" * 50)
        print("[+] CONTENT OF final_message.txt:")
        print(msg_content)
        print("=" * 50)
```

### 3.8. Flag

```text
CSSCTF{th3_gh0st_fr3qu3ncy_w4s_n3v3r_s1l3nt}
```

---
---

## 4. Echoes of the Relay

- **Category:** Forensics  
- **Challenge:** Echoes of the Relay  
- **File:** `relay_backup.img` (33,554,432 bytes = 32 MiB)  
- **Flag:** `CSSCTF{d3l3t3d_d03snt_m34n_g0n3}`  

---

### 4.1. Challenge Analysis & Investigative Strategy

> *"Its recovery lasted exactly 47 seconds. Then it went silent again... an automated recovery system transmitted a **damaged storage image** from one of its maintenance terminals. Nexus engineers inspected the visible files but found nothing useful. However, the terminal's final operator apparently tried to **preserve something** before the system shut down. Recover the operator's final transmission."*

Key clues mapped to forensic techniques:

| Clue Phrase | Technical Implication |
|---|---|
| "damaged storage image" | Raw **disk image**, not a plain archive $\rightarrow$ inspect raw filesystem structures |
| "maintenance terminal" | Linux-based host $\rightarrow$ **ext4** filesystem |
| "visible files but found nothing useful" | Crucial data resides in **unreferenced/unlinked** areas (deleted inodes, slack space) |
| "tried to **preserve** something before shutdown" | **Deleted file carving** — file was unlinked, but physical blocks remain |
| "final **transmission**" | Target data represents an operator transmission package or note |

Standard methodology:
1. Identify image structure with `file`.
2. Inspect low-level filesystem structures via `debugfs` instead of mounting (mounting only surfaces live files).
3. Search for **deleted inodes** (`lsdel`) and carve raw allocation blocks.
4. Analyze secondary data layers (e.g., polyglot data trailing image chunks).

---

### 4.2. Step 1: Disk Image Identification

```bash
cd /home/kali/Downloads/CSSCTF/FORENCIS/
ls -la
file relay_backup.img
```

Output:

```text
relay_backup.img: Linux rev 1.0 ext4 filesystem data,
    UUID=c5502026-0017-4047-8013-210100000004,
    volume name "KUIPER_RELAY" (extents) (large files) (huge files)
```

The image contains a direct **ext4** filesystem with volume label `KUIPER_RELAY`. No partition table is present; the filesystem starts at offset 0.

---

### 4.3. Step 2: Filesystem Metadata Inspection

```bash
dumpe2fs -h relay_backup.img
```

Extracted parameters:

| Parameter | Value |
|---|---|
| Volume name | `KUIPER_RELAY` |
| Filesystem state | `clean` |
| Block size | **1024** bytes |
| Blocks per group | 8192 |
| Inodes per group | 2048 |
| **Inode size** | **256** bytes |
| First inode | 11 |
| Journal inode | 8 |
| Inode table (group 0) | blocks **138 – 649** |
| FS created / last write | 2026-09-13 17:17:36 |
| Mount count | 0 (unmounted snapshot) |

`Block size = 1024` and `Inode size = 256` are vital parameters for computing manual block offsets.

---

### 4.4. Step 3: Directory Tree Enumeration

Using `debugfs` in read-only mode:

```bash
debugfs -R "ls -l /" relay_backup.img
```

```text
      2   40755 (2)      0      0    1024 . 
      2   40755 (2)      0      0    1024 ..
     11   40700 (2)      0      0   12288 lost+found
     12   40755 (2)   1000   1000    1024 LOST
     13  100644 (1)   1000   1000     128 README.txt
     14   40755 (2)   1000   1000    1024 logs
     18   40755 (2)   1000   1000    1024 operator
```

Hierarchy:
```text
/
├── lost+found/
├── LOST/                        <- Suspicious empty decoy
├── README.txt
├── logs/
│   ├── boot.log
│   ├── network.log
│   └── recovery.log
└── operator/
    ├── Documents/shift_report.txt
    ├── Downloads/diagnostics.txt
    └── Pictures/relay_status.png     <- Diagnostic image reference
```

Reading system logs:

```bash
debugfs -R "cat /README.txt"                     relay_backup.img
debugfs -R "cat /logs/boot.log"                  relay_backup.img
debugfs -R "cat /logs/network.log"               relay_backup.img
debugfs -R "cat /logs/recovery.log"              relay_backup.img
debugfs -R "cat /operator/Documents/shift_report.txt" relay_backup.img
debugfs -R "cat /operator/Downloads/diagnostics.txt"  relay_backup.img
```

In `/operator/Downloads/diagnostics.txt`:
```text
NEXUS RELAY DIAGNOSTICS
Power subsystem.............OK
Navigation..................OFFLINE
Quantum Link................DEGRADED
Emergency Storage...........ACTIVE

Image integrity warning:
Residual filesystem entries detected.
```

- **Forensic Indicator:** `Residual filesystem entries detected`. While directory `LOST/` is completely empty (a distractor), true artifacts remain in **unlinked/deleted inodes**.

---

### 4.5. Step 4: Identifying Deleted Inodes (`lsdel`)

```bash
debugfs -R "lsdel" relay_backup.img
```

```text
 Inode  Owner  Mode    Size      Blocks   Time deleted
    25      0 100644    303      1/     1 Sun Sep 13 17:17:36 2026
1 deleted inodes found.
```

One deleted entry exists: **Inode 25**, size 303 bytes. Examining details:

```bash
debugfs -R "stat <25>" relay_backup.img
```

```text
Inode: 25   Type: regular    Mode:  0644   Flags: 0x80000
Size: 303
Links: 0                    <- Unlinked
 ctime: ... Sun Sep 13 17:17:36 2026
 dtime: ... Sun Sep 13 17:17:36 2026   <- Non-zero deletion timestamp
EXTENTS:
(0):2232                    <- Physical block #2232
```

In ext4, unlinking a file zeroes `i_links_count` and marks block bitmap entries as free; the underlying data block **remains intact** until overwritten.

---

### 4.6. Step 5: Direct Carving of Residual Data Blocks

Carving data block 2232 using `dd` (`bs=1024`):

```bash
dd if=relay_backup.img bs=1024 skip=2232 count=1 of=out/deleted_block.bin
strings -a out/deleted_block.bin
```

Recovered transmission note:

```text
NX-17 PERSONAL NOTE

They are wiping the relay.

I couldn't leave the transmission as a normal file.

I attached the recovery package to the diagnostic image before
the node went offline.

If someone finds this:
    archive password = severance2101
Look beyond what the image viewer shows you.

-NX17
```

Key intelligence gathered:
1. `archive password = severance2101` $\rightarrow$ Password protecting the recovery package.
2. Target file: `/operator/Pictures/relay_status.png`.
3. *"Look beyond what the image viewer shows you"* $\rightarrow$ Trailing payload appended **after the PNG `IEND` chunk**.

---

### 4.7. Step 6: Extracting PNG Image from Filesystem

```bash
mkdir -p out
debugfs -R "dump /operator/Pictures/relay_status.png out/relay_status.png" relay_backup.img
file out/relay_status.png
```

```text
out/relay_status.png: PNG image data, 960 x 540, 8-bit/color RGB, non-interlaced
```

Total file size is 19,834 bytes, noticeably exceeding expected image raster data.

---

### 4.8. Step 7: PNG Chunk Structure Analysis

Parsing chunks via Python:

```python
import struct
d = open('out/relay_status.png', 'rb').read()
print("signature:", d[:8].hex())
off = 8
while off < len(d):
    ln  = struct.unpack('>I', d[off:off+4])[0]
    typ = d[off+4:off+8].decode('latin1')
    print(f"{typ:>5}  len={ln:<6} offset=0x{off:x}")
    if typ == 'IEND':
        print("IEND ends at offset 0x%x (%d)" % (off+12, off+12))
        print("bytes AFTER IEND:", len(d) - (off+12))
        break
    off += 12 + ln
```

Output:

```text
signature: 89504e470d0a1a0a
 IHDR  len=13     offset=0x8
 IDAT  len=19217  offset=0x21
 IEND  len=0      offset=0x4b3e
IEND ends at offset 0x4b4a (19274)
bytes AFTER IEND: 560
```

There are **560 extraneous bytes** trailing the `IEND` chunk. Examining the signature at offset `0x4b4a`:

```bash
python3 -c "d=open('out/relay_status.png','rb').read(); i=d.find(b'PK\x03\x04'); print(hex(i), d[i-4:i+16].hex())"
```

```text
0x4b4a 504b0304 1400 0900 ...
```

The data trailing `IEND` forms a valid ZIP archive starting with magic `PK\x03\x04`—a classic **PNG/ZIP polyglot (appended data)**.

Carving the embedded ZIP:

```python
d = open('out/relay_status.png', 'rb').read()
i = d.find(b'PK\x03\x04')
open('out/recovery.zip', 'wb').write(d[i:])
```

---

### 4.9. Step 8: ZIP Archive Analysis & Decryption

```bash
zipinfo -v out/recovery.zip
```

```text
Archive: out/recovery.zip
Zip archive file size: 560
central directory contains 2 entries
Entry #1: transmission/manifest.txt
    compression method: deflated
    file security status: encrypted
    file last modified: 2026 Sep 13 20:17:36
```

The archive uses standard **ZipCrypto**, allowing direct extraction using `unzip -P` with the recovered password `severance2101`:

```bash
mkdir -p out/recovered
unzip -P severance2101 out/recovery.zip -d out/recovered
```

Output:
```text
  inflating: out/recovered/transmission/manifest.txt
 extracting: out/recovered/transmission/core_recovery.txt
```

---

### 4.10. Step 9: Flag Retrieval

```bash
cat out/recovered/transmission/manifest.txt
cat out/recovered/transmission/core_recovery.txt
```

Content of `transmission/core_recovery.txt`:
```text
The Nexus remembers what the filesystem forgets.

CSSCTF{d3l3t3d_d03snt_m34n_g0n3}
```

### 4.11. Flag

```text
CSSCTF{d3l3t3d_d03snt_m34n_g0n3}
```

---

### 4.12. Attack Chain Summary

```text
ext4 disk image
  -> debugfs lsdel          : Identify deleted Inode 25 (303 bytes, block 2232)
  -> dd block 2232          : Carve operator note -> password + stego target hint
  -> dump relay_status.png  : Extract target image
  -> parse PNG chunks       : Identify 560 trailing bytes after IEND (PNG/ZIP polyglot)
  -> unzip -P severance2101 : Decrypt carved ZIP archive
  -> core_recovery.txt      : Read final Flag
```

---

### 4.13. Key Forensic Takeaways

1. **Unlinked File $\neq$ Erased Data:** An unlinked file in ext3/ext4 releases metadata markers while retaining underlying sector data until allocation reuse occurs.
2. **`debugfs` vs. Mounting:** Low-level inspection utilities expose unreferenced inodes, extent trees, and deleted entries that OS mount routines ignore.
3. **Appended Data Steganography:** Trailing bytes appended past standard file terminators (`IEND` for PNG, `FFD9` for JPEG, `%%EOF` for PDF) are routinely used to conceal embedded archives.
4. **Multi-layered Concealment:** Forensic artifacts frequently follow sequential tiers (deleted metadata $\rightarrow$ credential note $\rightarrow$ embedded encrypted container $\rightarrow$ final plaintext).

---

### 4.14. Quick Command Cheat-Sheet

```bash
# 1) Image identification
file target.img
xxd -l 512 target.img

# 2) Filesystem metadata
dumpe2fs -h target.img

# 3) Directory browsing and dumping
debugfs -R "ls -l /" target.img
debugfs -R "cat /path/file" target.img
debugfs -R "dump /path/file out/" target.img

# 4) Deleted inode analysis
debugfs -R "lsdel" target.img
debugfs -R "stat <INODE>" target.img

# 5) Raw block carving
dd if=target.img bs=1024 skip=BLOCK count=1 of=blk.bin
strings -a blk.bin

# 6) Carving trailing ZIP past EOF
python3 -c "d=open('target.png','rb').read(); i=d.find(b'PK\x03\x04'); open('out.zip','wb').write(d[i:])"

# 7) Decrypt encrypted archive
unzip -P <password> out.zip -d out/
```

---

### 4.15. Appendix: Offsets & Reference Values

| Item | Value |
|---|---|
| Block size | 1024 bytes |
| Inode size | 256 bytes |
| Inode table (Group 0) | Block 138 |
| Inode 25 location | Block 144, offset `0x0000` |
| Inode 25 Extent | `ee_block=0, ee_len=1, ee_start=2232` |
| Physical Data Block | Block **2232** (`dd bs=1024 skip=2232`) |
| PNG `IEND` termination | Offset `0x4b4a` (19274) |
| Appended Data Length | 560 bytes |
| Archive Password | `severance2101` |
| Flag | `CSSCTF{d3l3t3d_d03snt_m34n_g0n3}` |

---

## 5. Summary & Key Takeaways

| Metric | The False Timeline | Signal Fracture | Ghost Frequency | Echoes of the Relay |
| :--- | :--- | :--- | :--- | :--- |
| **Forensic Domain** | Linux Artifacts & Timeline Auditing | Raw Disk Carving & Network Reassembly | Audio DSP Demodulation & Parity FEC | Ext4 Inode Carving & Polyglot Analysis |
| **Primary Data Source** | Auditd (`audit.log`), Auth log, SQLite `metadata.db` | Raw MBR Spool Ring Partition + PCAP + Scheduler DB | Stereo WAV Audio (48 kHz PCM) | Linux Ext4 Disk Image (32 MiB) + Deleted Inodes |
| **Security Context** | Exposing Timestomping & log falsification | Network retry conflict resolution & data integrity | Bell 202 AFSK radio demodulation & noise filtering | Carving unlinked blocks & trailing file steganography |
| **Reconstruction / Auth** | AES-256-GCM authenticated decryption | SHA-256 integrity catalog verification | XOR Parity Forward Error Correction | Trailing ZIP carving & ZipCrypto password recovery |

**Core Technical Lessons:**
1. **Audio Forensics & Covert Channels:** High-resolution stereo recordings may embed modulated carrier signals (such as AFSK) within secondary channels. Channel separation and instantaneous frequency profiling are critical for signal characterization.
2. **Forward Error Correction (FEC):** Systems operating over lossy mediums often deploy parity redundancy (such as XOR parity). Recovering lost packets through algebraic reconstruction avoids the need for retransmission.
3. **Deleted Block Carving & File Polyglots:** Operating system file deletions (`unlink`) rarely sanitize physical storage sectors. In parallel, evaluating payloads trailing standardized EOF markers remains an essential technique for identifying concealed multi-format containers.
