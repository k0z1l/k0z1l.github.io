---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: false
tags: ["CTF", "Web"]
categories: ["CTF Writeups", "Web Security"]
description: "Mô tả ngắn gọn về bài thử thách và hướng tiếp cận."
showTableOfContents: true
---

## 📌 Thông tin thử thách
* **Giải đấu**: 
* **Thể loại**: Web / Pwn / Reverse / Crypto / Forensics / OSINT
* **Điểm số**: 
* **Độ khó**: Easy / Medium / Hard

---

## 1. Phân tích đề bài & Trinh sát (Reconnaissance)
* Phân tích sơ bộ giao diện / đề bài / source code được cấp.
* Ghi lại các endpoint hoặc behavior đáng ngờ.

---

## 2. Tìm kiếm lỗ hổng (Vulnerability Analysis)
* Lỗ hổng nằm ở đâu trong mã nguồn?
* Tại sao chương trình lại mắc lỗi này?

---

## 3. Khai thác (Exploitation)

### Payload / Script giải mã:
```python
# Exploit script bằng Python
import requests

url = "http://target.ctf"
```

🚩 **Flag**: `FLAG{example_flag_here}`

---

## 4. Bài học & Biện pháp khắc phục (Remediation)
* Nguyên nhân gốc rễ và cách dev sửa lỗi (Safe coding practices).
