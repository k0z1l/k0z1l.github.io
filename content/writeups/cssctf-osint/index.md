---
title: '[CSSCTF] OSINT Challenges Write-up: Return of Nexus'
date: '2026-10-02'
description: 'Writeup các thử thách Open Source Intelligence (OSINT, SOCMINT, Git
  Forensics) trong CSSCTF: Return of Nexus.'
categories: [CSSCTF, OSINT]
tags: [cssctf, osint, socmint, git-forensics, recon]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# 🌐 OSINT Challenges Write-up

**Cuộc thi:** CSS CTF 2026: Return of Nexus  
**Danh mục:** OSINT (Open-Source Intelligence / SOCMINT / Git Forensics)  

---

## 📑 Mục lục
1. [Challenge 1: Server Juice](#1-server-juice)
2. [Challenge 2: Dead Faction Servers](#2-dead-faction-servers)

---

# 1. Server Juice

* **Danh mục:** OSINT (SOCMINT / Social Media)
* **Flag:** `CSSCTF{premiumreserve}`
* **Độ khó:** Easy / Medium

### 📋 Mô tả & Gợi ý
> *"If you want to appease the algorithm (and maybe get a head start on future hints), consider keeping us on your radar by following."*  
> **Flag Format:** `CSSCTF{...}`

**Hint:**
> `instagram.com/cybersecuritysydney`  
> `Have a scroll...`

### 🔍 Quá trình điều tra & Giải pháp
1. **Xác định kênh mạng xã hội mục tiêu:**
   - Kênh Instagram chính thức của BTC: `https://www.instagram.com/cybersecuritysydney` (Cybersecurity Society Sydney - CSS).
2. **Khai thác gợi ý "Have a scroll...":**
   - Cuộn xuống các bài viết cũ hơn (khoảng 27 tuần trước, ngày 22 tháng 3) có tiêu đề **"General Meeting 01!"**.
3. **Phân tích hình ảnh bài đăng:**
   - Đồ họa hiển thị màn hình tin nhắn chat giả lập:
     > *- Someone tapped the cooling pipes at the local AI data centre...*  
     > *- u seriously care more about a club than the **premium reserve**??*  
     > *- come for the **server juiceeee***
   - Tên bài bắt nguồn từ meme "nước ép máy chủ / server juice" (nước làm mát data centre).
4. **Trích xuất Flag:**
   - Trong phần bình luận của bài viết, người dùng `harrysalvesen` đã để lại bình luận chứa flag:
     `CSSCTF{premiumreserve}`

---

# 2. Dead Faction Servers

* **Danh mục:** OSINT / Git Forensics
* **Starting Trace:** `bobdev508`
* **Flag:** `CSSCTF{u_g0t_130d_508}`
* **Độ khó:** Medium

### 📋 Mô tả
> *"The old faction that ran Sector 9 didn't leave one trail — they left several, and most of them are decoys. Whoever built this infrastructure knew someone would come looking eventually, and buried the real access key across two separate locations, split in half, one piece scrambled beyond plain sight.*  
> *Your recon has already surfaced their handle and at least one archived project. Don't trust the first thing you find — Sector 9's engineers were paranoid, and paranoid engineers plant false leads.*  
> *Starting trace: bobdev508 Flag Format: CSSCTF{...}"*

### 🔍 Quá trình điều tra & Giải pháp

#### Bước 1: Khám phá Profile GitHub
- Truy cập GitHub profile: `https://github.com/bobdev508` (Bob Martinez).
- Rà soát các repository qua GitHub API:
  - `dashboard-app`
  - `decoy-project`

#### Bước 2: Bỏ qua các bẫy giả (Decoys)
- `dashboard-app/app.py`: `DEBUG_TOKEN = "CTF{n0t_qu1t3_1t}"`
- `dashboard-app/utils.py`: `# CTF{4ls0_n0t_r34l}`
- `decoy-project/old_config.txt`: `temp_key=CTF{th1s_1s_n0t_th3_r34l_fl4g}`
- Các chuỗi trên đều là decoy do "Sector 9 engineers" cố tình cài cắm để đánh lạc hướng.

#### Bước 3: Tìm Mảnh 1 (Base64 trong Git Commit History)
- Kiểm tra commit log của repo `dashboard-app`:
  - Thấy commit `99291d3`: *"Remove committed secrets, oops"*
  - Commit trước đó `be82c69`: *"Add local env file"*
- Truy cập cây thư mục của commit `be82c69`:
  - Phát hiện file `.env.local` bị xóa:
    ```bash
    SECRET_PART=Q1NTQ1RGe3VfZzA=
    ```
  - Giải mã Base64:
    ```python
    import base64
    base64.b64decode('Q1NTQ1RGe3VfZzA=').decode()
    # Output: CSSCTF{u_g0
    ```
- **Mảnh 1:** `CSSCTF{u_g0`

#### Bước 4: Tìm Mảnh 2 (Nhánh ẩn experimental)
- Kiểm tra danh sách nhánh qua API `/branches`:
  - Nhánh 1: `main`
  - Nhánh 2: `experimental/auth-rework`
- Truy cập nhánh `experimental/auth-rework`, phát hiện file `auth_notes.md`:
  ```markdown
  # Auth rework notes (WIP, don't merge yet)
  Reminder to self — temp bypass code for local testing only,
  remove before merging:
  bypass_suffix = "t_130d_508}"
  ```
- **Mảnh 2:** `t_130d_508}`

#### Bước 5: Ghép Flag
- `CSSCTF{u_g0` + `t_130d_508}` = `CSSCTF{u_g0t_130d_508}`
