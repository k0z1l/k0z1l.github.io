---
title: "[CSSCTF] OSINT"
date: '2026-10-02'
description: 'Write-up for the Open Source Intelligence (OSINT, SOCMINT, Git Forensics) challenges in CSSCTF: Return of Nexus.'
categories: [CSSCTF, OSINT]
tags: [cssctf, osint, socmint, git-forensics, recon]
series: ['CSSCTF 2026']
showAuthor: false
showTableOfContents: true
---

# OSINT Challenges Write-up

**Competition:** CSS CTF 2026: Return of Nexus  
**Category:** OSINT (Open-Source Intelligence / SOCMINT / Git Forensics)  

---

## Table of Contents
1. [Challenge 1: Server Juice](#1-server-juice)
2. [Challenge 2: Dead Faction Servers](#2-dead-faction-servers)

---

## 1. Server Juice

* **Category:** OSINT (SOCMINT / Social Media)
* **Flag:** `CSSCTF{premiumreserve}`
* **Difficulty:** Easy / Medium

### Description & Hints
> *"If you want to appease the algorithm (and maybe get a head start on future hints), consider keeping us on your radar by following."*  
> **Flag Format:** `CSSCTF{...}`

**Hint:**
> `instagram.com/cybersecuritysydney`  
> `Have a scroll...`

### Investigation & Solution
1. **Identify the target social media channel:**
   - Official Instagram handle of the organizers: `https://www.instagram.com/cybersecuritysydney` (Cybersecurity Society Sydney - CSS).
2. **Follow the "Have a scroll..." clue:**
   - Scrolling down past earlier posts (approx. 27 weeks prior, March 22nd) leads to a post titled **"General Meeting 01!"**.
3. **Analyze the post imagery:**
   - The graphic displays a simulated messaging chat screen:
     > *- Someone tapped the cooling pipes at the local AI data centre...*  
     > *- u seriously care more about a club than the **premium reserve**??*  
     > *- come for the **server juiceeee***
   - The challenge name originates from the "server juice" meme (data centre cooling fluid).
4. **Extract the Flag:**
   - In the comments section of the post, user `harrysalvesen` posted a comment containing the flag:
     `CSSCTF{premiumreserve}`

---

## 2. Dead Faction Servers

* **Category:** OSINT / Git Forensics
* **Starting Trace:** `bobdev508`
* **Flag:** `CSSCTF{u_g0t_130d_508}`
* **Difficulty:** Medium

### Description
> *"The old faction that ran Sector 9 didn't leave one trail — they left several, and most of them are decoys. Whoever built this infrastructure knew someone would come looking eventually, and buried the real access key across two separate locations, split in half, one piece scrambled beyond plain sight.*  
> *Your recon has already surfaced their handle and at least one archived project. Don't trust the first thing you find — Sector 9's engineers were paranoid, and paranoid engineers plant false leads.*  
> *Starting trace: bobdev508 Flag Format: CSSCTF{...}"*

### Investigation & Solution

#### Step 1: Inspect the GitHub Profile
- Navigate to the GitHub profile: `https://github.com/bobdev508` (Bob Martinez).
- Enumerate the public repositories via the GitHub interface / API:
  - `dashboard-app`
  - `decoy-project`

#### Step 2: Identify and Discard Decoys
- Inspecting the code reveals multiple bait strings planted to distract solvers:
  - `dashboard-app/app.py`: `DEBUG_TOKEN = "CTF{n0t_qu1t3_1t}"`
  - `dashboard-app/utils.py`: `# CTF{4ls0_n0t_r34l}`
  - `decoy-project/old_config.txt`: `temp_key=CTF{th1s_1s_n0t_th3_r34l_fl4g}`
- These correspond to the paranoid false leads mentioned in the prompt.

#### Step 3: Locate Part 1 (Base64 in Git Commit History)
- Examine the commit log of repository `dashboard-app`:
  - Notice commit `99291d3`: *"Remove committed secrets, oops"*
  - The preceding commit `be82c69`: *"Add local env file"*
- Inspect the commit tree and diff for `be82c69`:
  - Identify the deleted `.env.local` file:
    ```bash
    SECRET_PART=Q1NTQ1RGe3VfZzA=
    ```
  - Decode Base64:
    ```python
    import base64
    base64.b64decode('Q1NTQ1RGe3VfZzA=').decode()
    # Output: CSSCTF{u_g0
    ```
- **Part 1:** `CSSCTF{u_g0`

#### Step 4: Locate Part 2 (Hidden Experimental Branch)
- Check the branch list via the repository branches endpoint or UI:
  - Branch 1: `main`
  - Branch 2: `experimental/auth-rework`
- Inspect branch `experimental/auth-rework` and locate `auth_notes.md`:
  ```markdown
  # Auth rework notes (WIP, don't merge yet)
  Reminder to self — temp bypass code for local testing only,
  remove before merging:
  bypass_suffix = "t_130d_508}"
  ```
- **Part 2:** `t_130d_508}`

#### Step 5: Assemble the Flag
- Concatenating Part 1 and Part 2:
  `CSSCTF{u_g0` + `t_130d_508}` = `CSSCTF{u_g0t_130d_508}`
