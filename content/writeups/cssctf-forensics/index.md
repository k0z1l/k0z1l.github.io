---
title: '[CSSCTF] Digital Forensics: Nexus Series'
date: '2026-10-02'
description: Writeup chuyên sâu các thử thách Digital Forensics thuộc chuỗi Nexus
  Series trong CSSCTF (Audio DSP, Disk Carving, PCAP Analysis).
categories: [CSSCTF, Forensics]
tags: [cssctf, forensics, pcap, audio-dsp, disk-carving]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] Digital Forensics Writeup: Nexus Series

**Tác giả:** k0zil
**Thể loại:** Digital Forensics / Audio DSP / Disk Carving / PCAP Analysis / Linux Artifacts  
**Định dạng Flag:** `CSSCTF{...}`

---

## Mục lục
1. [The False Timeline](#1-the-false-timeline)
   - [1.1. Mô tả thử thách & Đề bài](#11-mô-tả-thử-thách--đề-bài)
   - [1.2. Khảo sát ban đầu & Phân tích hệ thống tệp Ext4](#12-khảo-sát-ban-đầu--phân-tích-hệ-thống-tệp-ext4)
   - [1.3. Tái dựng mốc thời gian thực sự (Timeline Reconstruction)](#13-tái-dựng-mốc-thời-gian-thực-sự-timeline-reconstruction)
   - [1.4. Khôi phục & Giải mã chìa khóa truy cập khẩn cấp (`.ekey-cache`)](#14-khôi-phục--giải-mã-chìa-khóa-truy-cập-khẩn-cấp-ekey-cache)
   - [1.5. Mã nguồn khai thác có chú thích (Python)](#15-mã-nguồn-khai-thác-có-chú-thích-python)
   - [1.6. Flag](#16-flag)
2. [Signal Fracture](#2-signal-fracture)
   - [2.1. Mô tả thử thách & Bối cảnh](#21-mô-tả-thử-thách--bối-cảnh)
   - [2.2. Khảo sát dữ liệu đĩa và gói mạng (PCAP & Disk Recon)](#22-khảo-sát-dữ-liệu-đĩa-và-gói-mạng-pcap--disk-recon)
   - [2.3. Bóc tách kiến trúc phân mảnh dữ liệu `NXFR`](#23-bóc-tách-kiến-trúc-phân-mảnh-dữ-liệu-nxfr)
   - [2.4. Khôi phục và đối chiếu toàn vẹn 8 phân mảnh (Fragment Carving)](#24-khôi-phục-và-đối-chiếu-toàn-vẹn-8-phân-mảnh-fragment-carving)
   - [2.5. Tái tạo tệp lưu trữ và bóc tách Flag](#25-tái-tạo-tệp-lưu-trữ-và-bóc-tách-flag)
   - [2.6. Mã nguồn khai thác có chú thích (Python)](#26-mã-nguồn-khai-thác-có-chú-thích-python)
   - [2.7. Flag](#27-flag)
3. [Ghost Frequency](#3-ghost-frequency)
   - [3.1. Mô tả thử thách & Bối cảnh](#31-mô-tả-thử-thách--bối-cảnh)
   - [3.2. Khảo sát tệp âm thanh hộp đen (`KBR17_blackbox.wav`)](#32-khảo-sát-tệp-âm-thanh-hộp-đen-kbr17_blackboxwav)
   - [3.3. Bản chất của "Tần số ma" (Ghost Frequency 1536 Hz vs Bell 202 AFSK)](#33-bản-chất-của-tần-số-ma-ghost-frequency-1536-hz-vs-bell-202-afsk)
   - [3.4. Giải điều chế sóng AFSK 1200 baud & Khôi phục khung truyền UART 8N1](#34-giải-điều-chế-sóng-afsk-1200-baud--khôi-phục-khung-truyền-uart-8n1)
   - [3.5. Bóc tách giao thức `NXPKT` & Sửa lỗi chẵn lẻ Parity (Forward Error Correction)](#35-bóc-tách-giao-thức-nxpkt--sửa-lỗi-chẵn-lẻ-parity-forward-error-correction)
   - [3.6. Giải nén luồng DEFLATE thô và khôi phục Flag](#36-giải-nén-luồng-deflate-thô-và-khôi-phục-flag)
   - [3.7. Mã nguồn khai thác có chú thích (Python)](#37-mã-nguồn-khai-thác-có-chú-thích-python)
   - [3.8. Flag](#38-flag)
4. [Tổng kết & Bài học kinh nghiệm](#4-tổng-kết--bài-học-kinh-nghiệm)

---

## 1. The False Timeline

### 1.1. Mô tả thử thách & Đề bài
> *Nexus Incident Response recovered a filesystem image from Relay NX-17 after an unauthorised emergency key export. Investigators concluded that Relay Administrator KAI-7 performed the export at approximately 03:17.*
> 
> *There is one problem. KAI-7 had already disconnected. Someone wanted the investigation to end there.*
> 
> *Reconstruct the true incident timeline and recover the stolen emergency access key. Flag format: `CSSCTF{...}`*
> 
> **Tài nguyên đính kèm:** Tệp ảnh đĩa hệ thống `nexus_relay.img` (kích thước 128 MB).

---

### 1.2. Khảo sát ban đầu & Phân tích hệ thống tệp Ext4

Kiểm tra các byte đặc trưng (Magic Bytes) của tệp ảnh `nexus_relay.img`:
- Tại offset `0x400` (khối Superblock của Linux Ext filesystem):
  - Byte tại offset `0x438:0x43A` có giá trị `53 ef` (tức `0xEF53` dạng Little-Endian).
  - Đây là giá trị magic chuẩn của hệ thống tệp **Linux Ext4** (`s_magic = EXT4_SUPER_MAGIC`).

Trích xuất toàn bộ cấu trúc thư mục bằng thư viện Python `ext4`, ta thu được các tệp tin quan trọng:
- `/etc/machine-id`: Chứa định danh phần cứng máy chủ (`8f3b2a1c9e4d56781234abcd567890ef`).
- `/home/kai/.bash_history`: Lịch sử câu lệnh của người dùng `kai`.
- `/opt/nexus/lib/exporter.py`: Mã nguồn Python thực hiện thuật toán sinh khóa và mã hóa gói chìa khóa khẩn cấp.
- `/var/cache/nexus/.ekey-cache`: Tệp tin nhị phân chứa gói dữ liệu chìa khóa bị đánh cắp.
- `/var/lib/nexus/metadata.db`: Cơ sở dữ liệu SQLite lưu vết phiên làm việc (`sessions`) và các tác vụ trích xuất (`jobs`).
- `/var/log/auth.log`: Nhật ký xác thực SSH và chuyển đổi phiên làm việc của người dùng.
- `/var/log/audit/audit.log`: Nhật ký hệ thống Linux Auditd ghi nhận các lời gọi hệ thống (`syscall`).
- `/var/log/nexus/relay.log`: Nhật ký ứng dụng của hệ thống Relay NX-17.

---

### 1.3. Tái dựng mốc thời gian thực sự (Timeline Reconstruction)

#### 1. Hiện trường giả mạo trong `relay.log`
Báo cáo điều tra ban đầu quy kết KAI-7 thực hiện trích xuất chìa khóa vào lúc `03:17` dựa trên nhật ký ứng dụng `/var/log/nexus/relay.log`:
```text
2101-10-01T03:17:03+10:00 relay-core[1847]: WARN export request accepted principal=KAI-7 resource=emergency-core
2101-10-01T03:17:04+10:00 relay-core[1847]: INFO resource package completed.
```
Kẻ tấn công đã cố tình chỉnh sửa hoặc làm giả bản ghi log này để vu khống cho Administrator KAI-7.

#### 2. Bằng chứng ngoại phạm của KAI-7 trong `auth.log`
Kiểm tra chi tiết nhật ký xác thực `/var/log/auth.log`:
- **`02:52:11`**: Administrator `kai` đăng nhập SSH từ IP `10.5.21.99`, hệ thống cấp phát phiên làm việc số 4 (`New session 4 of user kai`).
- **`02:55:01`**: `kai` thực thi kiểm tra trạng thái dịch vụ: `sudo /bin/systemctl status nexus-relay`.
- **`03:05:41`**: `kai` **đã ngắt kết nối SSH và đăng xuất hoàn toàn khỏi hệ thống**:
  ```text
  Oct  1 03:05:41 nx-17 sshd[1822]: pam_unix(sshd:session): session closed for user kai
  Oct  1 03:05:41 nx-17 systemd-logind[789]: Session 4 logged out. Waiting for processes to exit.
  Oct  1 03:05:41 nx-17 systemd-logind[789]: Removed session 4.
  ```
- **`03:10:02`**: Tiến trình `su` chuyển quyền sang tài khoản dịch vụ `svc-relay` bởi `root`:
  ```text
  Oct  1 03:10:02 nx-17 su[1890]: Successful su for svc-relay by root
  Oct  1 03:10:02 nx-17 su[1890]: pam_unix(su:session): session opened for user svc-relay(uid=998) by (uid=0)
  ```
$\implies$ **KAI-7 đã ngắt kết nối trước mốc 03:17 hơn 11 phút. Đây là bằng chứng ngoại phạm tuyệt đối!**

#### 3. Dấu vết thực thi tiến trình trong `audit.log`
Linux Auditd ghi nhận các lời gọi hệ thống cấp kernel kèm mốc thời gian Unix Epoch không thể bị làm giả:
1. `audit(4157542380)`: `kai` (uid=1001, auid=1001, session=4) thực thi `systemctl status nexus-relay`.
2. `audit(4157543482)`: Lệnh `sh` được gọi bởi `uid=998 (svc-relay)` vào lúc `03:11:22`.
3. **`audit(4157543568)`**: Lời gọi thực thi lệnh xuất chìa khóa khẩn cấp:
   ```text
   type=SYSCALL msg=audit(4157543568.045:92): arch=c000003e syscall=59 ... uid=998 ... comm="nx-export" exe="/opt/nexus/bin/nx-export" key="nexus_export"
   type=EXECVE msg=audit(4157543568.045:92): argc=2 a0="/opt/nexus/bin/nx-export" a1="--emergency"
   ```
   - Thời điểm thực thi: **Epoch = `4157543568`** (tương ứng `03:12:48`).
   - Người thực thi: **`uid=998 (svc-relay)`** (hoàn toàn không phải KAI-7!).
4. `audit(4157543712)` (vào lúc `03:15:12`): Hành vi làm sai lệch dấu vết thời gian (**Timestomping**):
   ```text
   type=PROC_PROCTITLE msg=audit(4157543712.500:99): proctitle=746f756368002d72002f6574632f6d616368696e652d6964002f7661722f63616368652f6e657875732f2e656b65792d6361636865
   ```
   Giải mã hex proctitle: `touch -r /etc/machine-id /var/cache/nexus/.ekey-cache`.  
   *Ý đồ của kẻ tấn công:* Sao chép timestamp của `/etc/machine-id` đè lên `.ekey-cache` nhằm che giấu thời gian tệp này vừa được tạo ra.

#### 4. Dấu vết phiên làm việc & Job trong SQLite `metadata.db`
Truy vấn cơ sở dữ liệu `/var/lib/nexus/metadata.db`:
- **Bảng `sessions`:**
  - Phiên của KAI-7: `session_uuid = b7a1c8d9-23f4-4d8e-9c12-78d1f2a4b679` (kết thúc lúc `4157543141` $\approx$ `03:05:41`).
  - Phiên của `svc-relay`: **`session_uuid = aab0c8b2-f8b1-4f11-9a72-6d8123a1005a`** (bắt đầu lúc `4157543482` $\approx$ `03:11:22`).
- **Bảng `jobs`:**
  - Job ID 2: `emergency_export` trên tài nguyên `emergency-core`, trạng thái `completed`.
  - Mốc thời gian: `created_at = 4157543568`.
  - Phiên thực hiện: **`session_uuid = aab0c8b2-f8b1-4f11-9a72-6d8123a1005a`** (`svc-relay`).

#### 5. Bảng đối chiếu dòng thời gian (True Timeline vs False Timeline)

| Mốc thời gian (UTC) | Epoch | Sự kiện thực tế (True Timeline) | Nguồn chứng cứ | Hiện trường ngụy tạo (False Timeline) |
| :--- | :---: | :--- | :--- | :--- |
| `02:52:11` | 4157542331 | KAI-7 đăng nhập SSH (Session 4) | `auth.log` | |
| `02:55:01` | 4157542501 | KAI-7 kiểm tra trạng thái relay | `auth.log`, `audit.log` | |
| **`03:05:41`** | **4157543141** | **KAI-7 đăng xuất SSH và thoát khỏi hệ thống** | `auth.log`, `metadata.db` | |
| `03:10:02` | 4157543402 | Chuyển quyền `su` sang `svc-relay` | `auth.log` | |
| `03:11:22` | 4157543482 | Phiên làm việc của `svc-relay` khởi tạo shell | `audit.log`, `metadata.db` | |
| **`03:12:48`** | **4157543568** | **`svc-relay` thực thi lệnh `nx-export --emergency` để trích xuất khóa** | `audit.log`, `metadata.db` | |
| `03:15:12` | 4157543712 | Kẻ tấn công timestomp `.ekey-cache` bằng lệnh `touch -r` | `audit.log` | |
| *`03:17:03`* | *4157543823* | *Không có tiến trình nào chạy* | Hệ thống yên lặng | **Log giả trong `relay.log` đổ tội cho KAI-7** |

---

### 1.4. Khôi phục & Giải mã chìa khóa truy cập khẩn cấp (`.ekey-cache`)

Đọc mã nguồn `/opt/nexus/lib/exporter.py`:
```python
def derive_emergency_key(
    machine_id: str, session_uuid: str, event_epoch: int
) -> bytes:
  material = f"{machine_id.strip()}|{session_uuid.strip()}|{int(event_epoch)}"
  return hashlib.sha256(material.encode("utf-8")).digest()
```

Cấu trúc gói tin `.ekey-cache` (61 bytes):
- Bytes 0..7 (8 bytes): Magic header `b"NXKEY_V1"`
- Bytes 8..19 (12 bytes): IV/Nonce của AES-GCM (`ceb41b1eb7393aafd5229166`)
- Bytes 20..60 (41 bytes): Bản mã và 16 bytes Authentication Tag của AES-GCM.

Các tham số chính xác trích xuất từ True Timeline:
- `machine_id` = `8f3b2a1c9e4d56781234abcd567890ef`
- `session_uuid` = `aab0c8b2-f8b1-4f11-9a72-6d8123a1005a` (`svc-relay`)
- `event_epoch` = `4157543568`

---

### 1.5. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""The False Timeline Solution Script

Mục đích: Sử dụng các tham số pháp y (Forensic Artifacts) đã phục hồi từ
dòng thời gian thực sự để tạo khóa AES-256 và giải mã tệp tin .ekey-cache.
"""

import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# 1. Đọc dữ liệu nhị phân từ tệp tin chìa khóa bị đánh cắp
cache_file = r"e:\CSSCTF\extracted\var\cache\nexus\.ekey-cache"
with open(cache_file, "rb") as f:
  encrypted_data = f.read()

# 2. Phân tách cấu trúc gói tin NXKEY_V1
magic = encrypted_data[:8]  # 8 bytes đầu là b'NXKEY_V1'
nonce = encrypted_data[8:20]  # 12 bytes tiếp theo là Nonce/IV
ciphertext = encrypted_data[20:]  # Phần còn lại là Ciphertext + Tag

print(f"[*] Định dạng header: {magic}")
print(f"[*] Nonce (hex): {nonce.hex()}")
print(f"[*] Độ dài Ciphertext: {len(ciphertext)} bytes")

# 3. Thiết lập các tham số trích xuất từ True Timeline
machine_id = "8f3b2a1c9e4d56781234abcd567890ef"  # Đọc từ /etc/machine-id
session_uuid = (
    "aab0c8b2-f8b1-4f11-9a72-6d8123a1005a"  # Session thực sự của svc-relay
)
event_epoch = 4157543568  # Mốc thời gian Epoch ghi nhận trong audit.log

# 4. Sinh khóa giải mã AES-256 theo đúng logic của exporter.py
# Công thức: SHA256(machine_id|session_uuid|event_epoch)
key_material = f"{machine_id}|{session_uuid}|{event_epoch}"
aes_key = hashlib.sha256(key_material.encode("utf-8")).digest()

print(f"[*] Chuỗi sinh khóa: {key_material}")
print(f"[*] Khóa AES-256 derived: {aes_key.hex()}")

# 5. Giải mã dữ liệu bằng thuật toán AES-GCM
aesgcm = AESGCM(aes_key)
try:
  decrypted_key = aesgcm.decrypt(nonce, ciphertext, None)
  flag = decrypted_key.decode("utf-8")
  print("\n" + "=" * 50)
  print(f"[+] GIẢI MÃ THÀNH CÔNG CHÌA KHÓA TRUY CẬP KHẨN CẤP:")
  print(f"[+] Flag: {flag}")
  print("=" * 50)
except Exception as e:
  print(f"[-] Giải mã thất bại: {e}")
```

### 1.6. Flag
$$\mathbf{CSSCTF\{kai\_did\_not\_do\_it\}}$$

---

## 2. Signal Fracture

### 2.1. Mô tả thử thách & Bối cảnh
> *KBR-17 came back online for only fourteen seconds before the Nexus fabric collapsed again. A passive tap captured the relay's final uplink, and technicians recovered the relay drive exactly as it was after emergency shutdown.*
> 
> *Two details survived in the maintenance notes: the scheduler catalog was intact even though the spool index had been purged and uplink retries may have produced more than one copy of the same fragment.*
> 
> *Flag Format: `CSSCTF{...}`*
> 
> **Tài nguyên đính kèm:**
> - `KBR17_relay.img` (64 MB - tệp ảnh ổ đĩa chuyển tiếp).
> - `KBR17_uplink.pcap` (5.3 KB - tệp bắt gói tin đường truyền uplink).

---

### 2.2. Khảo sát dữ liệu đĩa và gói mạng (PCAP & Disk Recon)

#### 1. Phân tích ảnh đĩa `KBR17_relay.img`:
Kiểm tra bảng phân vùng MBR tại sector 0:
- **Phân vùng 0:** Bắt đầu tại LBA `2048` (offset `1,048,576` bytes), kích thước 24 MB. Định dạng tệp **Linux Ext4** mang nhãn `NEXUS_SYS`.
- **Phân vùng 1:** Bắt đầu tại LBA `53248` (offset `27,262,976` bytes), kích thước 32 MB, loại `0xda` (Non-FS raw data).

Trích xuất Phân vùng 0 (`NEXUS_SYS`), ta thu được các tài liệu và nhật ký quan trọng:
1. `/opt/nexus/docs/fragment-format.txt`: Tài liệu đặc tả cấu trúc bản ghi phân mảnh truyền dữ liệu.
2. `/home/operator/maintenance.txt`: Ghi chú kỹ thuật số 17-B xác nhận:
   - Danh mục bộ lập lịch (`scheduler catalog`) lưu trữ thứ tự và mã băm SHA-256 chính xác.
   - Vùng đệm thô (`raw spool`) hoạt động theo cơ chế Ring Buffer (vòng tròn): việc xóa (`purge`) chỉ hủy bỏ chỉ mục phân vùng mà **không xóa ngay lập tức dữ liệu thực tế trên đĩa**.
   - Bắt gói uplink có thể thu được nhiều bản sao của cùng một phân mảnh do cơ chế gửi lại (`retry`).
3. `/var/log/nexus/transfer.log`: Ghi lại phiên truyền tải khẩn cấp:
   ```text
   2101-03-17T02:18:41Z relay17 transfer_mgr[418]: object=emergency_burst_17 session=6E2C17A9 fragments=8 queued
   2101-03-17T02:18:46Z relay17 uplinkd[502]: session=6E2C17A9 retry requested seq=6
   2101-03-17T02:18:47Z relay17 uplinkd[502]: session=6E2C17A9 retry acknowledged seq=6
   ```
   $\implies$ Phiên truyền tải có mã `session = 0x6E2C17A9`, đối tượng `emergency_burst_17` gồm đúng **8 phân mảnh** (seq 0 đến seq 7). Phân mảnh số 6 đã từng xảy ra sự cố và được gửi lại!
4. `/var/lib/nexus/scheduler/relay.db`: Cơ sở dữ liệu SQLite lưu bảng `fragments`:
   Chứa mã băm SHA-256 kỳ vọng của toàn bộ 8 phân mảnh!

---

### 2.3. Bóc tách kiến trúc phân mảnh dữ liệu `NXFR`

Theo tài liệu `/opt/nexus/docs/fragment-format.txt`:
Gói tin `NXFR` sử dụng định dạng nhị phân Big-Endian (Network Byte Order):

| Offset | Kích thước | Kiểu dữ liệu | Ý nghĩa |
| :---: | :---: | :---: | :--- |
| `0x00` | 4 bytes | ASCII | Magic header: `NXFR` (`0x4E 0x58 0x46 0x52`) |
| `0x04` | 4 bytes | uint32 | `session_id` (ví dụ `0x6E2C17A9`) |
| `0x08` | 2 bytes | uint16 | `sequence` (chỉ số phân mảnh, bắt đầu từ 0) |
| `0x0A` | 2 bytes | uint16 | `total_fragments` (tổng số phân mảnh, ở đây là 8) |
| `0x0C` | 4 bytes | uint32 | `payload_length` (kích thước dữ liệu payload thực tế) |
| `0x10` | 4 bytes | uint32 | `payload_crc32` (giá trị kiểm tra CRC32 của payload) |
| `0x14` | ... | bytes | Dữ liệu `payload` của phân mảnh |

*Lưu ý cốt lõi:* Mã băm **SHA-256** lưu trong `relay.db` chỉ tính trên **phần bytes dữ liệu payload**, không bao gồm 20 bytes header của `NXFR`!

---

### 2.4. Khôi phục và đối chiếu toàn vẹn 8 phân mảnh (Fragment Carving)

Truy vấn bảng `fragments` trong cơ sở dữ liệu `relay.db` cho phiên `6E2C17A9`:

| Seq | Nguồn lưu trữ | Trạng thái | SHA-256 kỳ vọng (Scheduler Catalog) | Nguồn thu hồi thực tế |
| :---: | :---: | :---: | :--- | :--- |
| **0** | `SPOOL` | `PURGED` | `fdde3a6dc2c9d43e0bbf21b1e90d1214d5776405397ab54426ff7bb6bec8831d` | Quét trên đĩa `KBR17_relay.img` tại offset `0x1a40000` |
| **1** | `CACHE` | `RESIDENT` | `82fc22cae997c805035ef22fd98c260c626c67aaaef45301236bc549897e47ae` | Tệp `/var/cache/nexus/objects/82fc22cae997c805.blob` |
| **2** | `SPOOL` | `PURGED` | `5cd4fd1f9bdc1360dc272362ee421b4f62f2818c7d68332440042c3e46b8f732` | Quét trên đĩa `KBR17_relay.img` tại offset `0x1d20000` |
| **3** | `UPLINK` | `CAPTURED` | `3258da54f56a49e79a1719d9145a6cd82691a0d2b10a9a1e8782e9cacf507dc6` | Trích xuất từ tệp `KBR17_uplink.pcap` (Packet 8) |
| **4** | `CACHE` | `RESIDENT` | `4e86900e878981dcaec4e63b381395496598282d68f2a63e578350bdccfe7daa` | Tệp `/var/cache/nexus/objects/4e86900e878981dc.blob` |
| **5** | `SPOOL` | `PURGED` | `27ffcedf5e0e4bbec59c36c662aa1397d729c9a8bcd6005131a048856efb3e58` | Quét trên đĩa `KBR17_relay.img` tại offset `0x2090000` |
| **6** | `UPLINK` | `RETRIED` | `fa9dbecb99768ea4d8470546b270845127278e797e09f71073df7e5658bdabae` | Trích xuất từ `KBR17_uplink.pcap` (Packet 10, loại Packet 9 bị lỗi) |
| **7** | `UPLINK` | `CAPTURED` | `a9d2e70930248e74b776c1db737637d2e2a354308d216921225216288a94b7d0` | Trích xuất từ `KBR17_uplink.pcap` (Packet 11) |

*Xử lý xung đột phân mảnh số 6:*
Trong tệp PCAP có 2 gói tin mang `seq = 6`:
- Gói 9: SHA256 = `a6b0308e...` $\rightarrow$ Không khớp với catalog (bản lỗi gây ra yêu cầu retry).
- Gói 10: SHA256 = `fa9dbecb...` $\rightarrow$ Khớp 100% với scheduler catalog (bản phát lại chuẩn).

---

### 2.5. Tái tạo tệp lưu trữ và bóc tách Flag

Sau khi thu hồi đủ 8 payload và xác thực mã băm SHA-256:
1. Nối các khối payload theo thứ tự từ `seq 0` đến `seq 7`.
2. Tổng kích thước payload sau khi ghép: **6,725 bytes**.
3. Kiểm tra byte đầu của tệp phục hồi: `1f 8b 08 08` kèm chuỗi tên gốc `emergency_burst_17.tar`.  
   $\rightarrow$ Đây là một kho lưu trữ **GZIP nén tệp TAR** (`.tar.gz`).
4. Giải nén GZIP thu được tệp TAR dung lượng 10,240 bytes gồm 3 tệp:
   - `burst_metadata.json`
   - `telemetry.bin`
   - `final_message.txt`
5. Đọc nội dung tệp văn bản `final_message.txt`:
   ```text
   KBR-17 EMERGENCY BURST // FINAL RECOVERY
   Origin: Kuiper Belt Relay 17
   Event: The Severance

   The relay did not fail silently. Its final burst survived as fragments across the spool ring and uplink.
   Authorization token: CSSCTF{fragment_t3ll_th3_st0ry}
   ```

---

### 2.6. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""Signal Fracture Solution Script

Mục đích:
1. Thu hồi phân mảnh từ tệp ảnh đĩa KBR17_relay.img (Spool ring buffer + Cache).
2. Thu hồi phân mảnh từ tệp mạng KBR17_uplink.pcap, phân giải xung đột bản retry.
3. Đối chiếu SHA-256 với scheduler catalog và ghép nối 8 phân mảnh thành file tar.gz.
4. Tự động giải nén và trích xuất Flag từ final_message.txt.
"""

import gzip
import hashlib
import io
import struct
import tarfile

# Bảng mã băm SHA-256 kỳ vọng trích xuất từ relay.db (Scheduler Catalog)
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
# BƯỚC 1: Quét tìm phân mảnh trong tệp đĩa KBR17_relay.img
# ==========================================
print("[*] Đang quét các phân mảnh NXFR trong KBR17_relay.img...")
with open(r"e:\CSSCTF\KBR17_relay.img", "rb") as f:
  img_bytes = f.read()

pos = 0
while True:
  # Tìm vị trí xuất hiện của header 'NXFR'
  idx = img_bytes.find(b"NXFR", pos)
  if idx == -1:
    break

  hdr = img_bytes[idx : idx + 20]
  if len(hdr) == 20:
    magic, sess, seq, total, plen, pcrc = struct.unpack(">4sIHHII", hdr)
    # Lọc đúng phiên khẩn cấp 0x6E2C17A9
    if sess == SESSION_ID:
      payload = img_bytes[idx + 20 : idx + 20 + plen]
      phash = hashlib.sha256(payload).hexdigest()

      # So khớp mã băm với catalog
      if seq in EXPECTED_HASHES and EXPECTED_HASHES[seq] == phash:
        recovered_frags[seq] = payload
        print(f"  [+] Đĩa: Khôi phục thành công Seq {seq} ({plen} bytes)")
  pos = idx + 4

# ==========================================
# BƯỚC 2: Quét tìm phân mảnh trong tệp mạng KBR17_uplink.pcap
# ==========================================
print("\n[*] Đang trích xuất các phân mảnh NXFR từ KBR17_uplink.pcap...")
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
        print(
            f"  [+] Mạng PCAP: Khôi phục thành công Seq {seq} (Đã xác thực"
            " SHA-256)"
        )
  pos = idx + 4

print(f"\n[+] Tổng số phân mảnh thu hồi: {len(recovered_frags)}/8")

# ==========================================
# BƯỚC 3: Ghép nối và Giải nén Archive
# ==========================================
if len(recovered_frags) == 8:
  # Ghép đúng thứ tự tuần tự từ seq 0 -> seq 7
  assembled_gz = b"".join(recovered_frags[i] for i in range(8))
  print(f"[+] Ghép nối thành công dữ liệu GZIP: {len(assembled_gz)} bytes")

  # Giải nén GZIP trong bộ nhớ
  tar_data = gzip.decompress(assembled_gz)

  # Đọc nội dung tệp TAR
  with tarfile.open(fileobj=io.BytesIO(tar_data)) as tar:
    message_file = tar.extractfile("final_message.txt")
    if message_file:
      message_content = message_file.read().decode("utf-8")
      print("\n" + "=" * 50)
      print("[+] NỘI DUNG TỆP final_message.txt:")
      print(message_content)
      print("=" * 50)
```

### 2.7. Flag
$$\mathbf{CSSCTF\{fragment\_t3ll\_th3\_st0ry\}}$$

---

## 3. Ghost Frequency

### 3.1. Mô tả thử thách & Bối cảnh
> *Tiếp nối sự kiện sập nguồn của mạng lưới Nexus Fabric tại trạm chuyển tiếp KBR-17. Một tệp ghi âm hộp đen (`KBR17_blackbox.wav`) được thu hồi từ cảm biến giám sát âm thanh của trạm.*
> 
> *Tín hiệu âm thanh bị nhiễu loạn nghiêm trọng bởi một tần số lạ được gọi là "Ghost Frequency". Nhiệm vụ của bạn là giải mã tín hiệu vô tuyến ngầm ẩn chứa bên trong để khôi phục thông điệp khẩn cấp cuối cùng.*
> 
> *Flag Format: `CSSCTF{...}`*
> 
> **Tài nguyên đính kèm:** Tệp âm thanh `KBR17_blackbox.wav` (kích thước 22 MB, thời lượng 115.2 giây).

---

### 3.2. Khảo sát tệp âm thanh hộp đen (`KBR17_blackbox.wav`)

Kiểm tra thông số kỹ thuật âm thanh:
- Định dạng: Stereo (2 kênh âm thanh độc lập).
- Tần số lấy mẫu (Sample Rate): **48,000 Hz**.
- Độ sâu bit: **16-bit Signed Integer** (PCM).
- Tổng số mẫu: $5,529,608$ mẫu mỗi kênh $\approx$ **$115.20$ giây**.

---

### 3.3. Bản chất của "Tần số ma" (Ghost Frequency 1536 Hz vs Bell 202 AFSK)

Khi phân tích quang phổ (Spectrogram) và biến thiên tần số tức thời (Instantaneous Frequency qua biến đổi Hilbert) trên 2 kênh:
1. **Kênh trái (Left Channel):**
   - Chứa một sóng sin liên tục có tần số **$1536 \text{ Hz}$** chiếm tới $95\%$ thời lượng. Đây chính là **"Ghost Frequency"** (tần số ma) gây nhiễu và đè sóng.
   - Thỉnh thoảng xuất hiện 18 cụm xung nhiễu (noise bursts) trải rộng từ 0 đến 4000 Hz.
2. **Kênh phải (Right Channel):**
   - Hoạt động liên tục từ $0.000\text{s}$ đến $111.145\text{s}$.
   - Khảo sát các khoảng cách nửa chu kỳ (half-period zero-crossings):
     - Khoảng cách $20$ mẫu: Tương ứng tần số $f = \frac{48000}{2 \times 20} = \mathbf{1200 \text{ Hz}}$ (Mark tone).
     - Khoảng cách $11$ mẫu: Tương ứng tần số $f = \frac{48000}{2 \times 11} \approx \mathbf{2200 \text{ Hz}}$ (Space tone).
   - $\implies$ **Kênh phải là một luồng tín hiệu điều chế số vô tuyến Bell 202 AFSK (Audio Frequency Shift Keying)!**
   - Tốc độ truyền (Baud Rate): **1200 baud**, tương ứng mỗi bit dữ liệu kéo dài chính xác:
     $$\text{Samples per bit} = \frac{48000}{1200} = \mathbf{40 \text{ mẫu}}$$

---

### 3.4. Giải điều chế sóng AFSK 1200 baud & Khôi phục khung truyền UART 8N1

#### 1. Bộ giải điều chế tương quan (Matched Filter / Correlator):
Với mỗi cửa sổ 40 mẫu, ta tính tích vô hướng (năng lượng trực giao) với 2 sóng chuẩn:
$$E_{1200} = \left(\sum x[n] \sin(2\pi \cdot 1200 \cdot n / 48000)\right)^2 + \left(\sum x[n] \cos(2\pi \cdot 1200 \cdot n / 48000)\right)^2$$
$$E_{2200} = \left(\sum x[n] \sin(2\pi \cdot 2200 \cdot n / 48000)\right)^2 + \left(\sum x[n] \cos(2\pi \cdot 2200 \cdot n / 48000)\right)^2$$
- Nếu $E_{1200} > E_{2200} \implies \text{Bit} = 1$ (Mark).
- Nếu $E_{2200} > E_{1200} \implies \text{Bit} = 0$ (Space).

#### 2. Giải mã nối tiếp bất đồng bộ UART 8N1:
Luồng bit giải điều chế tuân theo chuẩn nối tiếp UART:
- Trạng thái chờ (Idle): Mức cao $1$ (Mark).
- Bit bắt đầu (Start Bit): Mức thấp $0$ (Space).
- Dữ liệu: 8 bit dữ liệu truyền **LSB-first** (bit trọng số thấp truyền trước).
- Bit kết thúc (Stop Bit): Mức cao $1$ (Mark).

Giải mã thu được toàn bộ văn bản giao thức truyền tin dạng ký tự ASCII rõ ràng!

---

### 3.5. Bóc tách giao thức `NXPKT` & Sửa lỗi chẵn lẻ Parity (Forward Error Correction)

Các gói tin văn bản thu được có tiền tố định dạng `NXPKT`:
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

#### Cơ chế sửa lỗi chẵn lẻ Forward Error Correction (RAID-4 / XOR Parity):
Phiên truyền tải `NX-771` gồm đúng **8 khối dữ liệu** (mỗi khối dài 1024 bytes), được chia làm 2 nhóm kiểm tra chẵn lẻ:

1. **Nhóm A (Group A):**
   - Gồm các khối: `SEQ 00`, `SEQ 01`, `SEQ 02`, `SEQ 03` và `PARITY A`.
   - Trong luồng dữ liệu, **khối `SEQ 02` bị mất** trên đường truyền.
   - Khôi phục `SEQ 02` bằng phép toán XOR:
     $$\text{SEQ 02} = \text{SEQ 00} \oplus \text{SEQ 01} \oplus \text{SEQ 03} \oplus \text{PARITY A}$$

2. **Nhóm B (Group B):**
   - Gồm các khối: `SEQ 04`, `SEQ 05`, `SEQ 06`, `SEQ 07` và `PARITY B`.
   - Trong luồng dữ liệu, **khối `SEQ 05` bị mất**.
   - Khối `SEQ 06` có 2 bản gửi lại (`RETRY=1` và `RETRY=2`), ta chọn bản mới nhất (`RETRY=2`).
   - Khôi phục `SEQ 05` bằng phép toán XOR:
     $$\text{SEQ 05} = \text{SEQ 04} \oplus \text{SEQ 06} \oplus \text{SEQ 07} \oplus \text{PARITY B}$$

---

### 3.6. Giải nén luồng DEFLATE thô và khôi phục Flag

1. Ghép 8 khối nhị phân từ `SEQ 00` đến `SEQ 07` thành một khối duy nhất dài **$8192 \text{ bytes}$**.
2. Phân tích 10 bytes đầu tiên của khối dữ liệu:
   - `0x00 .. 0x07`: Metadata tiêu đề gói.
   - `0x08 .. 0x09`: Header `0x02 0x03`.
   - `0x0A ..`: Bắt đầu bằng các byte đặc trưng `ed 98 57 50 53 df be c7 ...` $\rightarrow$ Đây là **luồng nén DEFLATE thô (Raw Deflate Stream, RFC 1951)**.
3. Giải nén raw deflate bằng Python `zlib.decompress(data[10:], -zlib.MAX_WBITS)`:
   - Thu được một kho lưu trữ **tệp TAR** dung lượng 10,240 bytes gồm 3 tệp:
     - `NX-771/relay_status.log`
     - `NX-771/navigation.dat`
     - `NX-771/final_message.txt`
4. Nội dung tệp `NX-771/final_message.txt`:
   ```text
   NEXUS EMERGENCY TRANSMISSION
   KBR-17 // SESSION NX-771

   The Severance did not erase every transmission.
   Some signals survived only because the relay kept redundant fragments.

   CSSCTF{th3_gh0st_fr3qu3ncy_w4s_n3v3r_s1l3nt}
   ```

---

### 3.7. Mã nguồn khai thác có chú thích (Python)

```python
#!/usr/bin/env python3
"""Ghost Frequency Solution Script

Mục đích:
1. Đọc tệp âm thanh KBR17_blackbox.wav và giải điều chế Bell 202 AFSK (1200/2200 Hz).
2. Đồng bộ bit và giải mã UART 8N1 thành luồng gói tin NXPKT.
3. Khôi phục các phân mảnh bị mất (SEQ 02 và SEQ 05) bằng thuật toán XOR Parity FEC.
4. Nối các khối dữ liệu, giải nén Raw DEFLATE và đọc cờ từ kho lưu trữ TAR.
"""

import base64
import io
import tarfile
import wave
import zlib
import numpy as np

# ==========================================
# BƯỚC 1: Đọc Kênh Phải (Right Channel) từ file WAV
# ==========================================
wav_path = r"e:\CSSCTF\KBR17_blackbox.wav"
print(f"[*] Đang tải tệp âm thanh {wav_path}...")
with wave.open(wav_path, "rb") as w:
  framerate = w.getframerate()
  nframes = w.getnframes()
  raw_bytes = w.readframes(nframes)

audio = np.frombuffer(raw_bytes, dtype=np.int16)
right_channel = audio[1::2].astype(np.float64)  # Kênh phải chứa AFSK

# ==========================================
# BƯỚC 2: Giải điều chế Bell 202 AFSK (1200 baud)
# ==========================================
sps = 40  # 48000 Hz / 1200 baud = 40 mẫu/bit
num_bits = len(right_channel) // sps

t = np.arange(sps)
sin1200 = np.sin(2 * np.pi * 1200 * t / framerate)
cos1200 = np.cos(2 * np.pi * 1200 * t / framerate)
sin2200 = np.sin(2 * np.pi * 2200 * t / framerate)
cos2200 = np.cos(2 * np.pi * 2200 * t / framerate)

print("[*] Đang giải điều chế tương quan tần số (1200 Hz Mark / 2200 Hz Space)...")
raw_bits = []
for i in range(num_bits):
  chunk = right_channel[i * sps : (i + 1) * sps]
  # Tính tương quan năng lượng tại 1200 Hz và 2200 Hz
  p1200 = np.dot(chunk, sin1200) ** 2 + np.dot(chunk, cos1200) ** 2
  p2200 = np.dot(chunk, sin2200) ** 2 + np.dot(chunk, cos2200) ** 2
  raw_bits.append(1 if p1200 > p2200 else 0)

# ==========================================
# BƯỚC 3: Giải mã luồng UART 8N1
# ==========================================
print("[*] Đang giải mã khung nối tiếp UART 8N1 (LSB first)...")
decoded_bytes = []
i = 0
start_bit, stop_bit = 0, 1

while i < len(raw_bits) - 10:
  # Phát hiện Start Bit (0) và Stop Bit (1)
  if raw_bits[i] == start_bit and raw_bits[i + 9] == stop_bit:
    # 8 bit dữ liệu ở giữa (LSB first)
    byte_val = sum(raw_bits[i + 1 + k] << k for k in range(8))
    decoded_bytes.append(byte_val)
    i += 10
    continue
  i += 1

packet_stream = bytes(decoded_bytes).decode("latin-1")

# ==========================================
# BƯỚC 4: Bóc tách gói tin NXPKT và khôi phục FEC Parity
# ==========================================
print("[*] Đang trích xuất các gói tin NXPKT của phiên NX-771...")
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
  """Thực hiện phép XOR bitwise giữa các khối dữ liệu cùng độ dài."""
  res = bytearray(len(block_list[0]))
  for b in block_list:
    for idx in range(len(res)):
      res[idx] ^= b[idx]
  return bytes(res)


# Khôi phục Nhóm A (Khối SEQ 02 bị mất):
d00 = packets[("DATA", "00", "0")]
d01 = packets[("DATA", "01", "0")]
d03 = packets[("DATA", "03", "0")]
parA = packets[("PARITY", "A", "0")]
d02 = xor_blocks([d00, d01, d03, parA])
print("[+] Khôi phục thành công khối SEQ 02 qua Parity A.")

# Khôi phục Nhóm B (Khối SEQ 05 bị mất, dùng SEQ 06 bản RETRY 2):
d04 = packets[("DATA", "04", "0")]
d06 = packets[("DATA", "06", "2")]
d07 = packets[("DATA", "07", "0")]
parB = packets[("PARITY", "B", "0")]
d05 = xor_blocks([d04, d06, d07, parB])
print("[+] Khôi phục thành công khối SEQ 05 qua Parity B.")

# Ghép 8 khối tuần tự từ SEQ 00 -> SEQ 07 (Tổng 8192 bytes)
full_payload = d00 + d01 + d02 + d03 + d04 + d05 + d06 + d07

# ==========================================
# BƯỚC 5: Giải nén Raw DEFLATE và đọc Flag từ TAR
# ==========================================
print("[*] Đang giải nén luồng nén Raw DEFLATE từ offset 10...")
raw_deflate_data = full_payload[10:]
decompressed_tar = zlib.decompress(raw_deflate_data, -zlib.MAX_WBITS)

with tarfile.open(fileobj=io.BytesIO(decompressed_tar)) as tar:
  msg_file = tar.extractfile("NX-771/final_message.txt")
  if msg_file:
    msg_content = msg_file.read().decode("utf-8")
    print("\n" + "=" * 50)
    print("[+] NỘI DUNG TỆP final_message.txt:")
    print(msg_content)
    print("=" * 50)
```

### 3.8. Flag
$$\mathbf{CSSCTF\{th3\_gh0st\_fr3qu3ncy\_w4s\_n3v3r\_s1l3nt\}}$$

---

---

## 4. Echoes of the Relay

- **Category:** Forensics
- **Challenge:** Echoes of the Relay
- **File:** `relay_backup.img` (33,554,432 bytes = 32 MiB)
- **Flag:** `CSSCTF{d3l3t3d_d03snt_m34n_g0n3}`

---

### 4.1. Đọc đề và chốt hướng tiếp cận

> "Its recovery lasted exactly 47 seconds. Then it went silent again... an automated recovery system transmitted a **damaged storage image** from one of its maintenance terminals. Nexus engineers inspected the visible files but found nothing useful. However, the terminal's final operator apparently tried to **preserve something** before the system shut down. Recover the operator's final transmission."

Các keyword quyết định hướng giải:

| Keyword trong đề | Suy ra kỹ thuật |
|---|---|
| "damaged storage image" | Đây là **ảnh đĩa (disk image)**, không phải file thường → cần mount/dump filesystem |
| "maintenance terminal" | Một máy Linux → filesystem **ext4** |
| "visible files but found nothing useful" | Dữ liệu nằm ở phần **không hiển thị** của filesystem (inode đã xoá, slack space) |
| "tried to **preserve** something before shutdown" | **Deleted file recovery** — file bị `unlink` nhưng data còn trên đĩa |
| "final **transmission**" | Nội dung cần tìm = note/gói dữ liệu của operator |

Phương pháp chuẩn cho bài dạng này:

1. `file` để xác định loại image.
2. Dùng công cụ đọc filesystem **ở mức thấp** (`debugfs`) thay vì mount, vì mount sẽ chỉ thấy file còn sống.
3. Tìm **inode đã xoá** (`lsdel`) và đọc thẳng block dữ liệu còn sót.
4. Xử lý tiếp lớp dữ liệu thứ hai (ở đây là file ảnh có dữ liệu nối sau chunk `IEND`).

> **Vì sao không mount?** Mount chỉ cho thấy cây thư mục "sạch". Một bài forensics kiểu "deleted file" thì phần thú vị nằm ở inode đã unlink hoặc dữ liệu nằm ngoài các file được tham chiếu. `debugfs` cho phép duyệt trực tiếp superblock / group descriptor / inode table / block bitmap nên nhìn được cả những thứ đó.

---

### 4.2. Bước 1 — Nhận diện image

```bash
cd /home/kali/Downloads/CSSCTF/FORENCIS/
ls -la
file relay_backup.img
```

Kết quả:

```
relay_backup.img: Linux rev 1.0 ext4 filesystem data,
    UUID=c5502026-0017-4047-8013-210100000004,
    volume name "KUIPER_RELAY" (extents) (large files) (huge files)
```

→ Image là **ext4**, volume name `KUIPER_RELAY` khớp với đề bài. Không có phân vùng (partition table) — filesystem nằm ngay ở offset 0.

---

### 4.3. Bước 2 — Đọc metadata filesystem

```bash
dumpe2fs -h relay_backup.img
```

Các thông số quan trọng:

| Thông số | Giá trị |
|---|---|
| Volume name | `KUIPER_RELAY` |
| Filesystem state | `clean` |
| Block size | **1024** bytes |
| Blocks per group | 8192 |
| Inodes per group | 2048 |
| **Inode size** | **256** bytes |
| First inode | 11 |
| Journal inode | 8 |
| Inode table (group 0) | block **138 – 649** |
| FS created / last write | 2026-09-13 17:17:36 |
| Mount count | 0 (chưa từng mount → gợi ý snapshot thô) |

Hai con số `Block size = 1024` và `Inode size = 256` là bắt buộc để **tính offset thủ công** ở bước 6 (đọc inode bằng `dd` khi cần):

```
địa chỉ inode N (group 0) = InodeTableStart + (N - 1) * 256
```

---

### 4.4. Bước 3 — Liệt kê cây thư mục

Dùng `debugfs` (chế độ read-only) để duyệt filesystem:

```bash
debugfs -R "ls -l /" relay_backup.img
```

```
      2   40755 (2)      0      0    1024 . 
      2   40755 (2)      0      0    1024 ..
     11   40700 (2)      0      0   12288 lost+found
     12   40755 (2)   1000   1000    1024 LOST
     13  100644 (1)   1000   1000     128 README.txt
     14   40755 (2)   1000   1000    1024 logs
     18   40755 (2)   1000   1000    1024 operator
```

Cấu trúc:

```
/
├── lost+found/
├── LOST/                        <- thư mục "đáng ngờ"
├── README.txt
├── logs/
│   ├── boot.log
│   ├── network.log
│   └── recovery.log
└── operator/
    ├── Documents/shift_report.txt
    ├── Downloads/diagnostics.txt
    └── Pictures/relay_status.png     <- file "diagnostic image" trong note
```

#### Đọc các file văn bản

```bash
debugfs -R "cat /README.txt"                     relay_backup.img
debugfs -R "cat /logs/boot.log"                  relay_backup.img
debugfs -R "cat /logs/network.log"               relay_backup.img
debugfs -R "cat /logs/recovery.log"              relay_backup.img
debugfs -R "cat /operator/Documents/shift_report.txt" relay_backup.img
debugfs -R "cat /operator/Downloads/diagnostics.txt"  relay_backup.img
```

Nội dung:

**README.txt** — xác nhận bối cảnh (terminal KR-04, operator NX-17, snapshot sau emergency shutdown).

**logs/boot.log**
```
2101-04-17T03:00:00Z KR-04 boot initiated
2101-04-17T03:00:01Z Nexus recovery mode enabled
```

**logs/network.log**
```
2101-04-17T03:00:00Z Relay carrier acquired
2101-04-17T03:00:31Z Nexus link degraded
2101-04-17T03:00:47Z Carrier lost          <- khớp "47 seconds" trong đề
```

**logs/recovery.log**
```
2101-04-17T03:00:02Z Maintenance snapshot scheduled
2101-04-17T03:00:46Z Emergency storage active
2101-04-17T03:00:47Z Node offline; snapshot transmitted
```

**operator/Documents/shift_report.txt**
```
... Nothing unusual detected during filesystem check.
```

**operator/Downloads/diagnostics.txt**
```
NEXUS RELAY DIAGNOSTICS
Power subsystem.............OK
Navigation..................OFFLINE
Quantum Link................DEGRADED
Emergency Storage...........ACTIVE

Image integrity warning:
Residual filesystem entries detected.     <- HINT: còn entry "sót lại"
```

> 🔎 **Hint chính:** `Residual filesystem entries detected`. Cộng với thư mục `LOST/` **rỗng hoàn toàn** (một cái bẫy để mọi người chỉ nhìn vào đó rồi bỏ cuộc) → dữ liệu thật nằm ở **inode đã bị xoá**, không phải file trong `LOST/`.

---

### 4.5. Bước 4 — Tìm inode đã xoá (`lsdel`)

```bash
debugfs -R "lsdel" relay_backup.img
```

```
 Inode  Owner  Mode    Size      Blocks   Time deleted
    25      0 100644    303      1/     1 Sun Sep 13 17:17:36 2026
1 deleted inodes found.
```

Có **1 inode bị xoá**: inode **25**, 303 byte, 1 block dữ liệu. Xem chi tiết:

```bash
debugfs -R "stat <25>" relay_backup.img
```

```
Inode: 25   Type: regular    Mode:  0644   Flags: 0x80000
Size: 303
Links: 0                    <- đã unlink
 ctime: ... Sun Sep 13 17:17:36 2026
 dtime: ... Sun Sep 13 17:17:36 2026   <- thời điểm bị xoá (khác 0 => deleted)
EXTENTS:
(0):2232                    <- dữ liệu nằm ở block #2232
```

**Điểm mấu chốt:** trong ext4, khi bạn `rm` một file, kernel chỉ:
- giảm `i_links_count` về 0,
- set `i_dtime`,
- ghi các block vào **block bitmap** là "free".

Nó **KHÔNG xoá nội dung block**. Nếu chưa có gì khác ghi đè, đọc thẳng block đó vẫn ra nguyên dữ liệu → đây chính là lỗ hổng khai thác của bài.

---

### 4.6. Bước 5 — Đọc thẳng block dữ liệu còn sót

Có 3 cách, đây là các cách dùng:

#### Cách A — `dd` theo số block (thô, chắc chắn nhất)

`Block size = 1024`, block cần đọc = 2232:

```bash
dd if=relay_backup.img bs=1024 skip=2232 count=1 of=out/deleted_block.bin
strings -a out/deleted_block.bin
```

#### Cách B — `debugfs dump` theo inode

```bash
debugfs -R "dump <25> out/inode25.bin" relay_backup.img
```

#### Cách C — `debugfs cat` theo inode (nếu inode chưa bị tái sử dụng)

```bash
debugfs -R "cat <25>" relay_backup.img
```

Kết quả thu được — **"final transmission" của operator NX-17**:

```
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

Đọc được **3 thông tin vàng**:

1. `archive password = severance2101` → password cho gói nén.
2. "the **diagnostic image**" → chính là `/operator/Pictures/relay_status.png`.
3. **"Look beyond what the image viewer shows you"** → dữ liệu nằm ở phần **sau chunk `IEND`** của PNG (viewer chỉ render tới `IEND` rồi dừng, phần dư bị bỏ qua hoàn toàn).

---

### 4.7. Bước 6 — Dump ảnh PNG từ image

```bash
mkdir -p out
debugfs -R "dump /operator/Pictures/relay_status.png out/relay_status.png" relay_backup.img
file out/relay_status.png
```

```
out/relay_status.png: PNG image data, 960 x 540, 8-bit/color RGB, non-interlaced
```

Mở ảnh bằng mắt thì chỉ thấy một bảng trạng thái vô hại:

```
KUIPER RELAY
SYSTEM STATUS

CONNECTION: LOST
POWER: 13%
NEXUS LINK: DEGRADED
```

→ Đúng như note nói: **nhìn thì không có gì**. Nhưng kích thước file là 19,834 byte — **lệch** so với phần ảnh "hợp lệ".

---

### 4.8. Bước 7 — Phân tích cấu trúc chunk của PNG

PNG = `8-byte signature` + chuỗi chunk `[length(4)][type(4)][data][crc(4)]`, kết thúc bằng chunk `IEND`.

Liệt kê chunk bằng Python:

```python
import struct
d = open('out/relay_status.png','rb').read()
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

Kết quả:

```
signature: 89504e470d0a1a0a
 IHDR  len=13     offset=0x8
 IDAT  len=19217  offset=0x21
 IEND  len=0      offset=0x4b3e
IEND ends at offset 0x4b4a (19274)
bytes AFTER IEND: 560        <-- 560 byte "lạ"
```

Một PNG hợp lệ phải **kết thúc ngay tại `IEND`**. Ở đây còn dư **560 byte** → thủ phạm.

Kiểm tra magic của khối dư:

```bash
python3 -c "d=open('out/relay_status.png','rb').read(); i=d.find(b'PK\x03\x04'); print(hex(i), d[i-4:i+16].hex())"
```

```
0x4b4a 504b0304 1400 0900 ...
         ^^^^^^ Magic của ZIP local file header (PK\x03\x04)
```

Dữ liệu nối sau `IEND` **ngay lập tức** là 1 file ZIP → kỹ thuật **polyglot PNG/ZIP (file appended after EOF marker)**.

#### Trích ZIP ra

```python
d = open('out/relay_status.png','rb').read()
i = d.find(b'PK\x03\x04')
open('out/recovery.zip','wb').write(d[i:])
```

```bash
file out/recovery.zip
# out/recovery.zip: Zip archive data, at least v2.0 to extract
```

> 💡 Vì sao phải cắt thủ công mà không dùng `binwalk -e` / `foremost`? Hai tool đó vẫn chạy được, nhưng cắt bằng Python cho ta **kiểm soát chính xác offset** và tránh việc tool tự đoán sai; đây là cách "chắc ăn" khi chỉ có một khối ZIP đơn giản.

---

### 4.9. Bước 8 — Phân tích ZIP và giải mã

```bash
zipinfo -v out/recovery.zip
7z l out/recovery.zip
```

```
Archive: out/recovery.zip
Zip archive file size: 560
central directory contains 2 entries
Entry #1: transmission/manifest.txt
    compression method: deflated
    file security status: encrypted        <-- có mật khẩu
    file last modified: 2026 Sep 13 20:17:36
```

```
------------------- ----- ------------ ------------  ------------------------
2026-09-13 20:17:36 .....          155          149  transmission/manifest.txt
2026-09-13 20:17:36 .....           83           95  transmission/core_recovery.txt
------------------- ----- ------------ ------------  ------------------------
```

Chi tiết cần để ý (đọc từ raw header):

Bản ghi đầu tiên: `50 4b 03 04 | 14 00 | 09 00 | 08 00 | ...`

| Field | Giá trị | Ý nghĩa |
|---|---|---|
| `14 00` = 0x0014 | version needed = 2.0 | ZIP thường |
| `09 00` = 0x0009 | general purpose flags | bit0 = **encrypted**, bit3 = có data descriptor |
| `08 00` = 0x0008 | compression method | **deflate** |
| `32 a2 2d 5d` | DOS time/date | 2026-09-13 20:17:36 |

→ Đây là **ZipCrypto cổ điển** (không phải AES/Zip 7.0), nên `unzip -P` giải mã được trực tiếp. (Nếu là WinZip AES thì phải dùng `7z x -p...`.)

Dùng password từ note của operator:

```bash
mkdir -p out/recovered
unzip -P severance2101 out/recovery.zip -d out/recovered
```

```
  inflating: out/recovered/transmission/manifest.txt
 extracting: out/recovered/transmission/core_recovery.txt
```

Giải mã thành công (ZipCrypto có CRC check — nếu password sai, `unzip` sẽ báo hoặc file ra rác).

---

### 4.10. Bước 9 — Lấy flag

```bash
cat out/recovered/transmission/manifest.txt
cat out/recovered/transmission/core_recovery.txt
```

**transmission/manifest.txt**
```
NEXUS EMERGENCY TRANSMISSION

SOURCE: KUIPER-RELAY-04
OPERATOR: NX-17

If this archive survived, some fragments of the old Nexus
network survived with it.
```

**transmission/core_recovery.txt**
```
The Nexus remembers what the filesystem forgets.

CSSCTF{d3l3t3d_d03snt_m34n_g0n3}
```

### 4.11. Flag

```
CSSCTF{d3l3t3d_d03snt_m34n_g0n3}
```

---

### 4.12. Chuỗi khai thác — tóm tắt 1 dòng

```
ext4 image
  → debugfs lsdel          : phát hiện inode 25 bị xoá (303 B, block 2232)
  → dd block 2232          : đọc note operator  →  password + hint
  → dump relay_status.png  : ảnh "vô hại"
  → phân tích chunk        : 560 byte dư SAU IEND = ZIP ẩn (polyglot)
  → unzip -P severance2101 : giải mã gói emergency transmission
  → core_recovery.txt      : FLAG
```

---

### 4.13. Kiến thức rút ra (dùng cho các bài forensics sau)

1. **"Deleted file" không phải "deleted data".** `rm` trong ext3/4 chỉ giải phóng inode + bitmap; block dữ liệu vẫn nguyên cho tới khi bị ghi đè. Với image tĩnh, gần như luôn còn đọc được.
   - Công cụ: `debugfs -R "lsdel"`, `extundelete`, `testdisk`, `photorec`, `sleuthkit (fls/icat)`, `binwalk`.

2. **`debugfs` mạnh hơn mount cho forensics.** Nó cho đọc theo inode (`cat <N>`, `stat <N>`, `dump <N>`) kể cả khi inode đã unlink và không còn tên trong thư mục.

3. **Đừng bị "concept bẫy" dẫn sai.** Thư mục `LOST/` rỗng là một bẫy; hint thật nằm trong `diagnostics.txt` ("Residual filesystem entries detected"). Luôn đọc hết mọi file văn bản trước khi hành động.

4. **File appended after EOF marker (polyglot) là mẫu bài rất phổ biến.**
   - PNG: mọi thứ sau `IEND` là rác với mọi image viewer.
   - JPEG: mọi thứ sau `FFD9`.
   - GIF: sau `3B`.
   - PDF: sau `%%EOF`.
   - Kiểm tra nhanh: so **kích thước "hợp lệ"** (tổng chunk tới `IEND`) với kích thước file thật; hoặc `grep -abo` các magic `PK\x03\x04`, `Rar!`, `7z\xbc\xaf\x27\x1c`, `ustar`, `SQLite format 3`.

5. **Đọc flag/hint ở dạng thô khi cần.** Dùng `strings -a`, `xxd`, `hexdump -C` để nhìn raw thay vì chỉ tin vào công cụ tự động (tool có thể bỏ qua hoặc tự ý cắt dữ liệu).

6. **Mật khẩu thường được "giấu" vài lớp.** Bài này xếp lớp: deleted inode → note chứa password → PNG chứa ZIP mã hoá → file trong ZIP chứa flag. Luôn đi hết chuỗi, không dừng ở hint đầu tiên.

---

### 4.14. Cheat-sheet lệnh nhanh (dùng lại cho box sau)

```bash
# 1) Nhận diện
file target.img
xxd -l 512 target.img               # đọc superblock/partition table offset 0

# 2) Metadata ext
dumpe2fs -h target.img              # block size, inode size, inode table, state

# 3) Duyệt cây + đọc file (không mount)
debugfs -R "ls -l /"            target.img
debugfs -R "cat /path/file"     target.img
debugfs -R "dump /path/file out/"   target.img

# 4) Inode đã xoá
debugfs -R "lsdel"              target.img
debugfs -R "stat <INODE>"       target.img
debugfs -R "cat  <INODE>"       target.img

# 5) Đọc raw theo block (block size = 1024 ở bài này)
dd if=target.img bs=1024 skip=BLOCK count=1 of=blk.bin
strings -a blk.bin

# 6) Kiểm tra dữ liệu nối sau EOF
binwalk target.png                 # liệt kê nhanh
python3 - <<'EOF'
d=open('target.png','rb').read(); i=d.find(b'PK\x03\x04')
print(hex(i)); open('out.zip','wb').write(d[i:])
EOF

# 7) ZIP mã hoá
zipinfo -v out.zip
unzip -P <password> out.zip -d out/     # ZipCrypto cổ điển
7z x -p<password> out.zip               # hỗ trợ cả AES
```

---

### 4.15. Phụ lục — Các offset / giá trị đã dùng (để tái lập)

| Mục | Giá trị |
|---|---|
| Block size | 1024 |
| Inode size | 256 |
| Inode table group 0 | block 138 |
| Vị trí inode 25 | block 144, offset 0x0000 |
| Inode 25: mode | `0x81a4` (regular, 0644) |
| Inode 25: links | 0 (đã xoá), `dtime` ≠ 0 |
| Inode 25: size | 303 byte |
| Extent của inode 25 | `ee_block=0, ee_len=1, ee_start=2232` |
| Block dữ liệu | **2232** (`dd bs=1024 skip=2232`) |
| PNG: IHDR / IDAT / IEND | off 0x8 / 0x21 / 0x4b3e, IDAT len = 19217 |
| PNG kết thúc (hợp lệ) | offset 0x4b4a = 19274 |
| Dữ liệu nối sau IEND | 560 byte, bắt đầu bằng `PK\x03\x04` tại 0x4b4a |
| ZIP: số entry | 2 (ZipCrypto, method 8 = deflate) |
| Password | `severance2101` |
| Flag | `CSSCTF{d3l3t3d_d03snt_m34n_g0n3}` |

---

## 5. Tổng kết & Bài học kinh nghiệm

| Tiêu chí | The False Timeline | Signal Fracture | Ghost Frequency | Echoes of the Relay |
| :--- | :--- | :--- | :--- | :--- |
| **Kỹ thuật điều tra** | Linux Artifact Analysis & Timeline Auditing | Raw Disk Carving & Network Packet Assembly | Audio DSP Demodulation & Forward Error Correction | Ext4 Inode Carving & Polyglot Steganography Analysis |
| **Nguồn dữ liệu chính** | Auditd (`audit.log`), Auth log, SQLite `metadata.db` | Raw MBR Spool Ring Partition + PCAP Stream + Scheduler DB | Stereo WAV Audio (48 kHz PCM) | Linux Ext4 Disk Image (32 MiB) + Deleted Inode Data |
| **Khía cạnh bảo mật** | Vạch trần Timestomping & ngụy tạo log | Xử lý giao thức truyền tin tin cậy, giải quyết Retry/Conflict | Giải mã sóng vô tuyến AFSK 1200, khử nhiễu kênh truyền | Khôi phục tệp bị unlink qua raw block, phân tích PNG chunk trailing data |
| **Cơ chế xác thực / phục hồi** | Giải mã xác thực AES-256-GCM | Xác thực toàn vẹn bằng SHA-256 catalog | Tái tạo dữ liệu phân mảnh bị mất qua thuật toán XOR Parity | Trích xuất encrypted ZIP sau PNG IEND chunk và giải mã bằng mật khẩu operator |

**Bài học rút ra:**
1. **Phân tích âm thanh trong điều tra kỹ thuật số (Audio Forensics):** Một tệp âm thanh stereo không chỉ chứa tiếng nói con người mà còn có thể mang các kênh truyền dữ liệu số (Digital Subcarrier / AFSK). Việc tách riêng từng kênh (Stereo Channel Splitting) và phân tích biến thiên tần số tức thời là bước tiên quyết để nhận diện loại tín hiệu điều chế.
2. **Kỹ thuật sửa lỗi chuyển tiếp (Forward Error Correction - FEC):** Trong các hệ thống thông tin vũ trụ hoặc mạng lưới vệ tinh chuyển tiếp, các gói dữ liệu thường đi kèm các khối Parity dự phòng (XOR Parity). Khi các gói tin dữ liệu bị thất lạc trong quá trình truyền dẫn, ta hoàn toàn có thể khôi phục 100% bản gốc nguyên vẹn bằng phép toán bù đại số mà không cần yêu cầu phát lại.
3. **Phục hồi tệp tin đã xóa và kỹ thuật phân tích tệp đa cấu trúc (Polyglot / Steganography):** Lệnh xóa tệp (`rm` / `unlink`) trong hệ thống tệp ext4 thực tế chỉ đánh dấu inode và block bitmap là rảnh rỗi (free) mà không hề xóa sạch dữ liệu vật lý trên đĩa. Ngoài ra, việc kiểm tra các byte thừa sau điểm kết thúc chuẩn của định dạng tệp (ví dụ dữ liệu nằm sau `IEND` chunk của ảnh PNG) là kỹ thuật quan trọng để phát hiện dữ liệu ẩn hoặc tệp lưu trữ được giấu tinh vi.
