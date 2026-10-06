---
title: "[PortSwigger] HTTP Request Smuggling Series"
date: 2026-09-22
description: "Comprehensive technical analysis and walk-throughs of HTTP Request Smuggling vulnerabilities on PortSwigger Web Security Academy: core concepts, attack architecture, exploitation tradecraft, and defense-in-depth remediations."
categories: ["PortSwigger Labs"]
series: ["HTTP Request Smuggling"]
showAuthor: false
showTableOfContents: true
---

Welcome to the definitive **HTTP Request Smuggling (HRS) Master Compendium**, synthesizing technical analyses, transport-layer mechanics, and exploitation tradecraft across all **22 practical labs** from the **PortSwigger Web Security Academy**.

HTTP Request Smuggling is one of the most structurally complex, high-impact vulnerability classes in distributed systems. It operates at the boundaries between transport-layer byte streaming, proxy pipelining, and protocol parser discrepancies. When intermediate proxies, CDNs, load balancers, and upstream application servers disagree on where an HTTP request begins and ends, an adversary can manipulate the raw byte stream to slip unauthorized request fragments past perimeter firewalls—hijacking victim sessions, poisoning web caches, bypassing perimeter access controls, and executing zero-click client-side attacks.

---

## Complete Series Challenge Index

The table below catalogs all 22 challenges, tracking the evolution of HTTP Request Smuggling from classic HTTP/1.1 boundary desynchronization to modern browser-powered desync and 0.CL double-desync attacks:

| <span style="white-space: nowrap">Lab</span> | Challenge Name | <span style="white-space: nowrap">Level</span> | <span style="white-space: nowrap">Attack Generation</span> | Primary Exploit Technique & Vector |
| :---: | :--- | :---: | :---: | :--- |
| <span style="white-space: nowrap">**1**</span> | [HTTP request smuggling, basic CL.TE vulnerability](lab-01-HTTP%20request%20smuggling-basic%20CL.TE%20vulnerability/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Front-end relies on `Content-Length`, Back-end relies on `Transfer-Encoding`, mutating subsequent victim requests into `GPOST` |
| <span style="white-space: nowrap">**2**</span> | [HTTP request smuggling, basic TE.CL vulnerability](lab-02-HTTP%20request%20smuggling-basic%20TE.CL%20vulnerability/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Front-end processes chunked stream, Back-end processes byte length, leaving unread chunk fragments to corrupt incoming traffic |
| <span style="white-space: nowrap">**3**</span> | [HTTP request smuggling, obfuscating the TE header](lab-03-HTTP%20request%20smuggling-obfuscating%20the%20TE%20header/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | TE.TE parser divergence via header obfuscation (`Transfer-Encoding: xchunked`, whitespace, duplicate headers) |
| <span style="white-space: nowrap">**4**</span> | [HTTP request smuggling, confirming a CL.TE vulnerability via differential responses](lab-04-HTTP%20request%20smuggling-confirming%20a%20CL.TE%20vulnerability%20via%20differential%20responses/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Non-destructive validation of CL.TE desync by inducing a forced `404 Not Found` response on secondary requests |
| <span style="white-space: nowrap">**5**</span> | [HTTP request smuggling, confirming a TE.CL vulnerability via differential responses](lab-05-HTTP%20request%20smuggling-confirming%20a%20TE.CL%20vulnerability%20via%20differential%20responses/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Non-destructive validation of TE.CL desync by inducing a forced `404 Not Found` response on secondary requests |
| <span style="white-space: nowrap">**6**</span> | [HTTP request smuggling, bypassing front-end security controls, CL.TE vulnerability](lab-06-HTTP%20request%20smuggling-bypassing%20front-end%20security%20controls,%20CL.TE%20vulnerability/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Weaponizing CL.TE smuggling to bypass perimeter `/admin` blocks and forge `Host: localhost` headers |
| <span style="white-space: nowrap">**7**</span> | [HTTP request smuggling, bypassing front-end security controls, TE.CL vulnerability](lab-07-HTTP%20request%20smuggling-bypassing%20front-end%20security%20controls,%20TE.CL%20vulnerability/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Weaponizing TE.CL smuggling to bypass perimeter `/admin` blocks and forge `Host: localhost` headers |
| <span style="white-space: nowrap">**8**</span> | [HTTP request smuggling, revealing front-end request rewriting](lab-08-HTTP%20request%20smuggling-revealing%20front-end%20request%20rewriting/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Exfiltrating internal proxy headers (`X-Gkxtgp-Ip`) by reflecting them into search parameter response sinks |
| <span style="white-space: nowrap">**9**</span> | [HTTP request smuggling, capturing other users' requests](lab-09-HTTP%20request%20smuggling-capturing%20other%20users%20requests/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Exfiltrating victim credentials and session cookies by appending unread request bodies to public blog comment sinks |
| <span style="white-space: nowrap">**10**</span> | [HTTP request smuggling, delivering reflected XSS](lab-10-HTTP%20request%20smuggling-delivering%20reflected%20XSS/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 1: Classic HTTP/1.1</span> | Chaining request smuggling with unexploitable `User-Agent` reflected XSS to achieve zero-click client-side code execution |
| <span style="white-space: nowrap">**11**</span> | [Response queue poisoning via H2.TE request smuggling](lab-11-HTTP%20request%20smuggling-response%20queue%20poisoning%20via%20H2.TE%20request%20smuggling/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 2: HTTP/2 Downgrade</span> | Exploiting H2.TE downgrading to poison the back-end FIFO response queue and steal administrative credentials |
| <span style="white-space: nowrap">**12**</span> | [H2.CL request smuggling](lab-12-HTTP%20request%20smuggling-H2.CL%20request%20smuggling/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 2: HTTP/2 Downgrade</span> | Weaponizing H2.CL downgrading and on-site redirect heuristics to hijack script imports and deliver stored XSS |
| <span style="white-space: nowrap">**13**</span> | [HTTP/2 request smuggling via CRLF injection](lab-13-HTTP%20request%20smuggling-H2%20request%20smuggling%20via%20CRLF%20injection/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 2: HTTP/2 Downgrade</span> | Injecting CRLF into HTTP/2 binary header values to synthesize downstream `Transfer-Encoding: chunked` headers |
| <span style="white-space: nowrap">**14**</span> | [HTTP/2 request splitting via CRLF injection](lab-14-HTTP%20request%20smuggling-H2%20request%20splitting%20via%20CRLF%20injection/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 2: HTTP/2 Downgrade</span> | Injecting double CRLF (`\r\n\r\n`) to split bodyless GET requests into two distinct HTTP/1.1 transactions, poisoning queues |
| <span style="white-space: nowrap">**15**</span> | [CL.0 request smuggling](lab-15-HTTP%20request%20smuggling-CL.0%20request%20smuggling/) | <span style="white-space: nowrap">Practitioner</span> | <span style="white-space: nowrap">Gen 4: Next-Gen State Desync</span> | Exploiting back-end endpoints that ignore `Content-Length` on static assets to bypass perimeter admin access controls |
| <span style="white-space: nowrap">**16**</span> | [Exploiting HTTP request smuggling to perform web cache poisoning](lab-16-HTTP%20request%20smuggling-exploiting%20HTTP%20request%20smuggling%20to%20perform%20web%20cache%20poisoning/) | <span style="white-space: nowrap">Expert</span> | <span style="white-space: nowrap">Gen 3: Advanced Caching</span> | Chaining CL.TE smuggling with open redirection to poison the front-end static cache and execute persistent XSS |
| <span style="white-space: nowrap">**17**</span> | [Exploiting HTTP request smuggling to perform web cache deception](lab-17-HTTP%20request%20smuggling-exploiting%20HTTP%20request%20smuggling%20to%20perform%20web%20cache%20deception/) | <span style="white-space: nowrap">Expert</span> | <span style="white-space: nowrap">Gen 3: Advanced Caching</span> | Inducing static caching heuristics on private authenticated responses (`/my-account`) to exfiltrate victim API keys |
| <span style="white-space: nowrap">**18**</span> | [Bypassing access controls via HTTP/2 request tunnelling](lab-18-HTTP%20request%20smuggling-bypassing%20access%20controls%20via%20H2%20request%20tunnelling/) | <span style="white-space: nowrap">Expert</span> | <span style="white-space: nowrap">Gen 3: Request Tunnelling</span> | Leaking internal client auth headers via reflection sinks, then tunnelling privileged `HEAD /login` admin requests |
| <span style="white-space: nowrap">**19**</span> | [Web cache poisoning via HTTP/2 request tunnelling](lab-19-HTTP%20request%20smuggling-web%20cache%20poisoning%20via%20H2%20request%20tunnelling/) | <span style="white-space: nowrap">Expert</span> | <span style="white-space: nowrap">Gen 3: Request Tunnelling</span> | Injecting CRLF into `:path` to tunnel a padded unencoded redirect via `HEAD`, poisoning the homepage cache with XSS |
| <span style="white-space: nowrap">**20**</span> | [Client-side desync](lab-20-HTTP%20request%20smuggling-client-side%20desync/) | <span style="white-space: nowrap">Expert</span> | <span style="white-space: nowrap">Gen 4: Browser-Powered CSD</span> | Weaponizing browser connection pooling and server-side CL.0 via cross-origin fetch to exfiltrate victim session cookies |
| <span style="white-space: nowrap">**21**</span> | [Server-side pause-based request smuggling](lab-21-HTTP%20request%20smuggling-server-side%20pause-based%20request%20smuggling/) | <span style="white-space: nowrap">Expert</span> | <span style="white-space: nowrap">Gen 4: Pause-Based Desync</span> | Exploiting Apache `mod_reqtimeout` body timeouts on directory redirects via Turbo Intruder byte-pause streaming |
| <span style="white-space: nowrap">**22**</span> | [0.CL request smuggling](lab-22-HTTP%20request%20smuggling-0.CL%20request%20smuggling/) | <span style="white-space: nowrap">Expert</span> | <span style="white-space: nowrap">Gen 4: Double-Desync Endgame</span> | Defeating upstream deadlocks via Early-Response Gadgets & whitespace obfuscation to execute a Double-Desync pipeline |

---

## 1. Deep Root Cause Analysis (Nguyên nhân gốc rễ toàn diện)

Drawing from the empirical evidence across all 22 labs, HTTP Request Smuggling is **not a single bug**, but rather an emergent property of modern multi-tiered network architectures. The vulnerability arises from five foundational architectural discrepancies:

```text
+-------------------------------------------------------------------------------------------------------+
|                                  THE 5 PILLARS OF REQUEST DESYNCHRONIZATION                           |
+-------------------------------------------------------------------------------------------------------+
| [1] Inherent Ambiguity of ASCII Message Framing (HTTP/1.1 Stream Delimitation)                        |
| [2] RFC Implementation Drift & Conflict Resolution Divergence (CL vs TE vs TE.TE)                    |
| [3] Protocol Translation Impedance Mismatch (HTTP/2 Binary Framing -> HTTP/1.1 Text Downgrading)      |
| [4] The Connection Reuse Paradox (Multiplexed TCP Keep-Alive Socket Pooling)                          |
| [5] Application State Machine & Timeout Asynchrony (CL.0, 0.CL, Early-Response Gadgets, Timeouts)      |
+-------------------------------------------------------------------------------------------------------+
```

### 1.1 Inherent Ambiguity of ASCII Message Framing in HTTP/1.1
HTTP/1.1 (RFC 7230 / RFC 9112) is fundamentally a continuous, ASCII-based text stream transmitted over a raw TCP socket. Unlike modern protocols, an HTTP/1.1 connection possesses **no out-of-band packet markers or hardware-level frame delimiters**. 
To determine where Request A ends and Request B begins on a persistent connection, parsers rely entirely on in-band metadata:
* **`Content-Length` (CL):** An explicit integer declaring the exact octet count of the body.
* **`Transfer-Encoding: chunked` (TE):** A dynamic framing format where the body is transmitted in variable-sized hexadecimal chunks terminating with an empty chunk (`0\r\n\r\n`).
* **Implicit Zero (0):** Routes or methods (such as `GET`, `HEAD`, redirects, or static file requests) where the body length is presumed to be 0 octets immediately following the header terminator (`\r\n\r\n`).

Because these framing mechanisms operate on the same data stream, any discrepancy in how two sequential parsers prioritize or calculate these headers creates a **boundary mismatch**. Any unconsumed bytes from Request A remain stranded in the TCP socket receive buffer, directly prepending to and mutating Request B.

### 1.2 RFC Implementation Drift & Precedence Divergence (Labs 01–07)
Under RFC 7230 §3.3.3 and RFC 9112 §6.1, the standards committee recognized the risk of conflicting headers and formulated an explicit precedence rule:
> *"If a message is received with both a Transfer-Encoding and a Content-Length header field, the Transfer-Encoding overrides the Content-Length."*

In reality, web server developers prioritize performance, backwards compatibility, and legacy resilience over strict standard adherence:
* **CL.TE Topology (Labs 1, 4, 6):** The edge proxy prioritizes `Content-Length` (or lacks chunked processing on incoming client streams), while the backend complies with RFC and evaluates `Transfer-Encoding: chunked`.
* **TE.CL Topology (Labs 2, 5, 7):** The edge proxy evaluates `Transfer-Encoding: chunked`, while the backend ignores chunked encoding (due to reverse proxy misconfiguration or legacy web server defaults) and evaluates `Content-Length`.
* **TE.TE Header Obfuscation (Lab 3):** Both servers ostensibly support `Transfer-Encoding: chunked`. However, by injecting subtle non-compliances (e.g., `Transfer-Encoding: xchunked`, whitespace before the colon `Transfer-Encoding : chunked`, duplicate headers, or tab characters), an attacker forces one parser to reject the header while the other accepts it, deliberately degrading the connection into either CL.TE or TE.CL.

### 1.3 Protocol Downgrading Impedance Mismatch (Labs 11–14, 18–19)
The industry's transition toward HTTP/2 introduced a critical architectural vulnerability: **Protocol Downgrading**.
* **HTTP/2 Binary Framing:** In HTTP/2 (RFC 7540 / RFC 9113), messages are divided into binary frames (`HEADERS`, `DATA`). Every frame begins with a fixed 24-bit integer explicitly encoding its exact length. Delimiters such as Carriage Return (`\r`) and Line Feed (`\n`) hold **zero structural significance**; they are treated as literal byte characters.
* **The Downgrade Semantic Gap:** Edge proxies frequently negotiate HTTP/2 with client browsers but downgrade incoming traffic to HTTP/1.1 cleartext streams when forwarding to internal microservices. During this translation, binary header fields are serialized into ASCII lines: `Header-Name: Header-Value\r\n`.
* **The Root Cause:** If the edge proxy fails to sanitize control characters (`0x0D`, `0x0A`, `0x00`) in HTTP/2 headers or pseudo-headers (such as `:path`), literal CRLF bytes are injected into the downstream HTTP/1.1 stream. This allows adversaries to synthesize illegal framing headers (`H2.TE` in Lab 11, `H2.CL` in Lab 12), split bodyless GET requests into distinct HTTP/1.1 transactions (`HTTP/2 Request Splitting` in Lab 14), or tunnel privileged requests inside dedicated connections (`Request Tunnelling` in Labs 18 and 19).

### 1.4 The Connection Reuse Paradox (Labs 9, 11, 20)
To maximize throughput and eliminate TCP/TLS handshake latency, reverse proxies maintain long-lived **Keep-Alive connection pools** to backend application servers. Multiple independent requests from completely unrelated external users are multiplexed sequentially across the same shared TCP socket.
* **Shared Blast Radius:** When an attacker desynchronizes a shared backend socket, the residual request prefix remains queued in the socket buffer. The next client whose request is routed over that socket is completely compromised—their request line is mutated, their session credentials are leaked into public comment sinks (Lab 9), or their private responses are misrouted to the attacker via FIFO response queue poisoning (Lab 11).
* **The 1:1 Fallacy Disproven:** Modern research (Labs 18–20) disproved the common misconception that disabling connection pooling between users prevents request smuggling:
  * In **Request Tunnelling (Labs 18, 19)**, attackers tunnel unauthorized requests down their *own* dedicated 1:1 socket, using `HEAD` requests to consume responses.
  * In **Client-Side Desync (Lab 20)**, the attack occurs entirely between the *victim's browser* and the target server over the browser's own connection pool.

### 1.5 State Machine Asynchrony & Timeout Quirks (Labs 15, 21, 22)
The frontier of HTTP desynchronization targets application-level state machines rather than conflicting framing headers:
* **CL.0 (Lab 15):** Generic edge proxies forward request bodies based on `Content-Length`. However, backend static asset handlers (serving `.svg`, `.css`, `.js`) or redirect handlers conclude request processing upon reading headers (`\r\n\r\n`). The backend serves the file without reading the body, abandoning unread body bytes inside the TCP receive buffer.
* **Server-Side Pause-Based Desync (Lab 21):** Web servers like Apache 2.4.52 implement `mod_reqtimeout` (`RequestReadTimeout body=60`) to combat Slowloris attacks. On endpoints triggering directory redirects (`mod_dir`), when a client pauses body transmission for $> 60$ seconds, Apache triggers a body timeout, generates a `302 Found` response, and **fails to close the TCP socket**, allowing subsequent bytes to be treated as a new request.
* **0.CL & The Upstream Deadlock (Lab 22):** When a front-end ignores `Content-Length` (treating length as 0) while a backend enforces it, an upstream deadlock occurs. By weaponizing an **Early-Response Gadget (ERG)** to trigger an instant response before reading the body, the deadlock is bypassed, priming the backend socket to swallow a specific number of bytes from the subsequent request.

---

## 2. Advanced Methodology & Security Mindset (Tư duy & Quy trình kiểm thử)

Auditing enterprise applications for HTTP Request Smuggling requires a profound shift in mindset: **stop viewing endpoints as isolated API routes, and start analyzing how raw byte streams traverse intermediate infrastructure tiers**.

```text
========================================================================================
                          4-PHASE DESYNCHRONIZATION METHODOLOGY
========================================================================================
  [Phase 1: Reconnaissance] ──► [Phase 2: Timing Probes] ──► [Phase 3: Differential Proof] ──► [Phase 4: Weaponization]
  • Identify Proxies, CDNs      • CL.TE Timeout Probe        • Controlled 404 Trigger          • Access Control Bypass
  • Map HTTP/2 & ALPN           • TE.CL Timeout Probe        • Single-Connection Sequence      • Credential Exfiltration
  • Identify Keep-Alive Limits  • CL.0 / 0.CL Probing        • Zero Production Impact          • Web Cache Attacks
========================================================================================
```

### 2.1 The Desync Mindset: Architectural Decoupling
A penetration tester auditing for request smuggling must maintain three core mental models:
1. **Never Trust Perimeter Normalization:** WAFs and edge proxies inspect the request *as they understand it*. If the backend interprets message boundaries differently, perimeter inspections are completely invalidated.
2. **Think in Byte Offsets, Not Headers:** Request smuggling is fundamentally transport-layer arithmetic. Calculating `Content-Length`, chunk sizes, and delimiter lengths must be exact to the single octet. A 1-byte calculation error turns a critical account takeover into a `400 Bad Request`.
3. **Seek Transport-Layer Asynchrony:** Look for points where request processing decouples from socket lifecycle: static asset routes that ignore bodies (CL.0), early redirects that respond prematurely (ERG), and timeout directives that abandon streams without issuing TCP resets.

---

### 2.2 Phase 1: Reconnaissance & Infrastructure Mapping
Before firing desynchronization payloads, map the operational environment:
* **Fingerprint Header Signatures:** Inspect `Server`, `Via`, `X-Cache`, `X-Served-By`, and `CF-Ray` headers to detect proxy chains (e.g., Cloudflare $\rightarrow$ Nginx $\rightarrow$ Apache/Tomcat).
* **Verify Protocol Negotiation:** Inspect ALPN negotiation via `openssl s_client -connect target.com:443 -alpn h2,http/1.1`. If HTTP/2 is negotiated externally, verify whether the backend downgrades to HTTP/1.1.
* **Audit Static & Redirect Routes:** Enumerate unslashed directory paths (`/resources`, `/admin`), static assets (`.svg`, `.css`, `.js`), and endpoints that issue immediate 301/302 redirects. These represent primary candidates for CL.0 and Early-Response Gadgets.

---

### 2.3 Phase 2: Timing-Based Boundary Probing
To detect request smuggling without corrupting production traffic or affecting real users, security professionals utilize **differential timing probes**:

#### 1. Probing for CL.TE (Timing):
Send an HTTP request where the front-end (using `Content-Length`) forwards the entire message, but the back-end (using `Transfer-Encoding`) pauses waiting for the next chunk:
```http
POST / HTTP/1.1
Host: target.com
Transfer-Encoding: chunked
Content-Length: 4

1
Z
Q
```
* **Detection Criteria:** The front-end forwards all 4 bytes (`1\r\nZ\r\nQ`). The back-end parses chunk `1` (`Z`), encounters `Q` (an invalid chunk length), and stalls waiting for the terminating chunk. If the response hangs for **5 to 10 seconds** before returning a timeout (504 Gateway Timeout or 408 Request Timeout), a **CL.TE vulnerability is present**.

#### 2. Probing for TE.CL (Timing):
Send an HTTP request where the front-end forwards the chunked stream, but the back-end (using `Content-Length`) waits for additional body octets:
```http
POST / HTTP/1.1
Host: target.com
Transfer-Encoding: chunked
Content-Length: 6

0

X
```
* **Detection Criteria:** The front-end parses through terminating chunk `0\r\n\r\n` and forwards the packet. The back-end expects 6 bytes per `Content-Length` but only receives 5 bytes, hanging while waiting for the 6th byte. A **5 to 10-second timeout confirms TE.CL**.

#### 3. Probing for CL.0 / 0.CL (Timing & Status):
Send a `POST` request with `Content-Length: 10` but an empty body to static files (`/resources/images/blog.svg`) or redirects (`/resources`). If the server returns `200 OK` or `302 Found` instantaneously without hanging, the endpoint ignores `Content-Length`, confirming CL.0 behavior.

---

### 2.4 Phase 3: Differential Response Confirmation (Non-Destructive Proof)
Timing probes indicate potential vulnerabilities, but transport jitter can cause false positives. To confirm desynchronization conclusively, an analyst must elicit a **differential status code (404 Not Found)** across a single connection:

1. **Craft the Smuggled Prefix:** In Burp Repeater, prepare Request 1 with a smuggled prefix that targets a non-existent path:
   ```http
   GET /404_test_probe HTTP/1.1
   Foo: x
   ```
2. **Send in Single Connection:** Use Burp Repeater's **Send group (single connection)** or Turbo Intruder to pipeline Request 1 followed immediately by an ordinary Request 2 (`GET / HTTP/1.1`).
3. **Forensic Validation:** If Request 2 returns `404 Not Found`, you have mathematically verified that the back-end prepended the unconsumed bytes of Request 1 to the request line of Request 2.

---

### 2.5 Phase 4: Weaponization & Impact Escalation Matrix
Once desynchronization is verified, select the attack primitive that maximizes impact while minimizing denial-of-service risks:

```text
+----------------------------------------------------------------------------------------------------+
|                                    WEAPONIZATION DECISION MATRIX                                   |
+----------------------------------------------------------------------------------------------------+
| Scenario A: Administrative perimeter blocking /admin based on URL or Host header.                  |
|   ===> Smuggle "GET /admin HTTP/1.1" with "Host: localhost" (Labs 06, 07, 15, 21).                |
+----------------------------------------------------------------------------------------------------+
| Scenario B: Front-end appends internal IP headers (X-Forwarded-For, X-Custom-IP-Authorization).    |
|   ===> Smuggle search query with inflated Content-Length to reflect secret headers (Labs 08, 18).  |
+----------------------------------------------------------------------------------------------------+
| Scenario C: Application features a public reflection or storage sink (Blog comments, profile bio). |
|   ===> Smuggle comment POST with oversized Content-Length to steal victim cookies (Labs 09, 20).   |
+----------------------------------------------------------------------------------------------------+
| Scenario D: Edge tier implements public caching of static assets (JS, CSS, images).                |
|   ===> Poison static cache keys via open redirects (Lab 16) or Deceive private APIs (Lab 17).     |
+----------------------------------------------------------------------------------------------------+
| Scenario E: Unexploitable reflected XSS residing in User-Agent header.                             |
|   ===> Smuggle GET request with malicious User-Agent to deliver zero-click XSS (Labs 10, 22).      |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Master Attack Taxonomy: Technical Breakdown of All 22 Labs

The 22 labs in this series represent the most comprehensive compendium of HTTP request smuggling techniques ever documented. Below is the master architectural breakdown across all four generations:

```text
========================================================================================
                          MASTER ATTACK TAXONOMY (LABS 1 - 22)
========================================================================================
```

### Generation 1: Classic HTTP/1.1 Boundary Desync (Labs 1–10)

#### Lab 1: Basic CL.TE Vulnerability
* **Mechanics:** Front-end uses `Content-Length: 6`; Back-end uses `Transfer-Encoding: chunked`.
* **Payload Structure:**
  ```http
  POST / HTTP/1.1
  Host: target.net
  Content-Length: 6
  Transfer-Encoding: chunked

  0

  G
  ```
* **Impact:** The back-end terminates at `0\r\n\r\n`. Character `G` lingers in the TCP buffer. The next incoming request (`POST /`) is mutated into `GPOST /`, triggering a `403 Forbidden` ("Unrecognized method GPOST").

#### Lab 2: Basic TE.CL Vulnerability
* **Mechanics:** Front-end uses `Transfer-Encoding: chunked`; Back-end uses `Content-Length: 4`.
* **Payload Structure:**
  ```http
  POST / HTTP/1.1
  Host: target.net
  Content-Length: 4
  Transfer-Encoding: chunked

  5a
  GPOST / HTTP/1.1
  Content-Type: application/x-www-form-urlencoded
  Content-Length: 15

  x=1
  0

  ```
* **Impact:** Front-end forwards chunk `5a` (90 bytes). Back-end reads only 4 bytes (`5a\r\n`), leaving `GPOST / HTTP/1.1...` in the socket buffer to corrupt the subsequent request.

#### Lab 3: Obfuscating the TE Header (TE.TE)
* **Mechanics:** Both servers support chunked encoding, but diverge when presented with duplicate or obfuscated headers.
* **Obfuscation Techniques Tested:** `Transfer-Encoding: xchunked`, `Transfer-Encoding : chunked`, duplicate headers (`Transfer-Encoding: chunked` followed by `Transfer-Encoding: cow`), and line-folding.
* **Exploit:** Duplicating the header causes the back-end to discard chunked processing and fall back to `Content-Length`, degrading the system into an exploitable TE.CL flaw.

#### Labs 4 & 5: Confirming CL.TE and TE.CL via Differential Responses
* **Mechanics:** Smuggling a complete request line targeting a non-existent route (`GET /404 HTTP/1.1\r\nFoo: x`).
* **Impact:** Proves desynchronization non-destructively: Request 1 returns `200 OK`, while Request 2 returns `404 Not Found` across the same connection.

#### Labs 6 & 7: Bypassing Front-End Security Controls (CL.TE & TE.CL)
* **Mechanics:** Front-end blocks `/admin` based on URL path inspection.
* **Exploit:** An authorized `POST /` request conceals an inner `GET /admin/delete?username=carlos HTTP/1.1` request with `Host: localhost`. The front-end perimeter evaluates only the outer request, while the back-end executes the privileged administrative command.

#### Lab 8: Revealing Front-End Request Rewriting
* **Mechanics:** The front-end validates client IP via an internal header (`X-Gkxtgp-Ip: <client-ip>`). External requests supplying this header are stripped or overwritten.
* **Exploit:** Smuggling an unclosed `POST /` request targeting the blog's search feature (`search=test`) with an inflated `Content-Length: 300`. The back-end consumes the front-end's internally rewritten headers as the parameter value for `search`, reflecting the secret header name and value in the HTML response. The discovered header is then forged in a subsequent smuggled request to access `/admin`.

#### Lab 9: Capturing Other Users' Requests
* **Mechanics:** Weaponizing an application storage sink (the blog comment section).
* **Exploit:** Smuggling a `POST /post/comment` request with an inflated `Content-Length: 800`, leaving the `comment=` parameter open-ended at the end of the body. When an innocent victim visits the site on the same TCP connection, their entire incoming HTTP request—including sensitive session cookies (`session=...`) and authorization tokens—is appended to `comment=` and saved permanently in the public database.

#### Lab 10: Delivering Reflected XSS
* **Mechanics:** The application reflects the `User-Agent` header unescaped in blog post 5: `<input value="Mozilla/5.0...">`. Normally unexploitable because attackers cannot force victim browsers to send custom User-Agent strings.
* **Exploit:** Smuggling an unauthorized request targeting `/post?postId=5` with `User-Agent: a"/><script>alert(1)</script>`. When an unsuspecting visitor requests any page, their connection is routed to the XSS endpoint, executing code in their browser in a zero-click attack.

---

### Generation 2: HTTP/2 Downgrading & Request Splitting (Labs 11–14)

#### Lab 11: Response Queue Poisoning via H2.TE
* **Mechanics:** The front-end terminates HTTP/2 and downgrades to HTTP/1.1, failing to strip `Transfer-Encoding: chunked`.
* **Exploit:** Smuggling a complete, self-contained secondary request (`GET /x HTTP/1.1`) inside an H2 chunked stream. 1 front-end request causes the back-end to return 2 responses. This induces an off-by-one misalignment in the front-end's FIFO response queue. When an administrator logs in, their `302 Found` response containing the administrative session cookie is pushed into the queue and served to the attacker's next request.

#### Lab 12: H2.CL Request Smuggling
* **Mechanics:** The front-end uses HTTP/2 DATA frame length, while the back-end prioritizes an injected `Content-Length: 0` header.
* **Exploit:** Smuggling a prefix that triggers an on-site directory redirect (`/resources` $\rightarrow$ `/resources/`). Because the back-end evaluates the smuggled `Host` header during redirect generation, the attacker poisons relative `<script src="/resources/js/tracking.js">` imports across the application, delivering stored XSS.

#### Lab 13: HTTP/2 Request Smuggling via CRLF Injection
* **Mechanics:** The front-end accepts binary HTTP/2 header values containing newlines without validation.
* **Exploit:** Injecting `\r\n` into a custom header value:
  ```text
  Name:  foo
  Value: bar\r\nTransfer-Encoding: chunked
  ```
  During downgrade, the proxy outputs a literal CRLF, synthesizing an illegal `Transfer-Encoding: chunked` header that desynchronizes the back-end parser.

#### Lab 14: HTTP/2 Request Splitting via CRLF Injection
* **Mechanics:** Splitting bodyless requests at the header level.
* **Exploit:** Injecting a double newline (`\r\n\r\n`) into an HTTP/2 header value of a `GET` request:
  ```text
  Name:  tuan
  Value: kiet\r\n\r\nGET /x HTTP/1.1\r\nHost: target.net
  ```
  The back-end terminates Request #1 at the first `\r\n\r\n` and parses the remainder as Request #2. This carves two complete HTTP/1.1 transactions out of a single HTTP/2 request without requiring any message body, poisoning the response queue to hijack administrative credentials.

---

### Generation 3: Advanced Caching & Request Tunnelling (Labs 16–19)

#### Lab 16: Web Cache Poisoning via Request Smuggling
* **Mechanics:** Chaining CL.TE desynchronization with edge static caching heuristics.
* **Exploit:** Smuggling a request that triggers an on-site redirect on `/post/next?path=...` pointing to an external exploit server hosting malicious JavaScript. When the edge proxy requests `/resources/js/tracking.js`, the back-end returns the malicious redirect. The edge cache commits this redirect to the public script's cache key, executing persistent XSS on all visitors to the homepage.

#### Lab 17: Web Cache Deception via Request Smuggling
* **Mechanics:** Forcing the edge cache to store private, authenticated dynamic content under a public static cache key.
* **Exploit:** Smuggling a prefix targeting `/my-account` with an unclosed header `X: X`. When an administrative bot requests `/resources/js/tracking.js`, the back-end executes the authenticated `/my-account` request. The edge cache, believing it received the tracking script, saves the administrator's private profile (and secret API key) under `/resources/js/tracking.js`, allowing trivial exfiltration.

#### Lab 18: Bypassing Access Controls via HTTP/2 Request Tunnelling
* **Mechanics:** The front-end enforces a dedicated 1:1 backend connection lifecycle (no cross-user socket reuse).
* **Exploit Pipeline:**
  1. **Phase 1 (Leaking Internal Headers):** Using an unclosed `POST /` search parameter with `Content-Length: 500` to leak the front-end's internal authentication headers (`X-SSL-VERIFIED`, `X-SSL-CLIENT-CN`, `X-FRONTEND-KEY`).
  2. **Phase 2 (Tunnelling via HEAD):** Changing `:method` to `HEAD` and `:path` to `/login` (to avoid length mismatch errors) while tunnelling `GET /admin/delete?username=carlos` with the forged authentication headers. Because `HEAD` expects no body, the back-end's secondary response is read off the socket, executing the deletion.

#### Lab 19: Web Cache Poisoning via HTTP/2 Request Tunnelling
* **Mechanics:** Injecting CRLF into the HTTP/2 `:path` pseudo-header to tunnel a redirect response into the homepage cache.
* **Exploit:**
  ```http
  :method: HEAD
  :path:   / HTTP/1.1\r\nHost: target\r\n\r\nGET /resources?<script>alert(1)</script>AAA...[8,700 A's] HTTP/1.1\r\nFoo: bar
  ```
  The unencoded redirect at `/resources?` reflects the script tag. By padding the query string with 8,700 `A`s, the tunnelled response body matches the expected `Content-Length: 8634` of the homepage, poisoning the cache key `GET /` with persistent XSS.

---

### Generation 4: Browser-Powered & Next-Gen State Desync (Labs 15, 20–22)

#### Lab 15: CL.0 Request Smuggling
* **Mechanics:** Static asset handlers ignore `Content-Length` entirely.
* **Exploit:** Sending a `POST /resources/images/blog.svg` request with `Content-Length: 50` and an inner payload `GET /admin/delete?username=carlos HTTP/1.1\r\nFoo: x`. The static handler serves the SVG and abandons the 50 body bytes in the socket buffer. The subsequent client request triggers the deletion command.

#### Lab 20: Client-Side Desync (CSD)
* **Mechanics:** Exploiting connection pooling directly between the victim's web browser and the origin server.
* **Exploit:** An external exploit page executes cross-origin JavaScript:
  ```javascript
  fetch('https://target.com', {
      method: 'POST',
      body: 'POST /en/post/comment HTTP/1.1\r\n...Content-Length: 900\r\n\r\n...comment=',
      mode: 'cors',
      credentials: 'include'
  }).catch(() => {
      fetch('https://target.com/capture-me', { mode: 'no-cors', credentials: 'include' });
  });
  ```
  The target server ignores `Content-Length` on the root redirect `/` (CL.0). The browser traps the CORS failure in `.catch()` and immediately sends `/capture-me` on the same open socket. The browser automatically appends the victim's session cookies into the unclosed `comment=` parameter, publicly storing the credentials on the blog.

#### Lab 21: Server-Side Pause-Based Request Smuggling
* **Mechanics:** Apache 2.4.52 `mod_reqtimeout` (`RequestReadTimeout body=60`) on directory redirects (`mod_dir`).
* **Exploit:** In Turbo Intruder, configuring `pauseMarker=['Content-Length: 221\r\n\r\n']` and `pauseTime=61000`. The tool pauses transmission for 61 seconds after sending the outer headers of `POST /resources`. Apache times out waiting for the body, issues a `302 Found` redirect, and **leaves the socket open**. When Turbo Intruder resumes streaming, the inner request (`POST /admin/delete/` with `Host: localhost`, CSRF token, and session cookie) is processed as a new request, deleting Carlos.

#### Lab 22: 0.CL Request Smuggling (The Double-Desync Endgame)
* **Mechanics:** Header-Value whitespace (`Content-Length : %s`) causes the front-end to ignore CL (treating length as 0), while the back-end processes CL, causing an upstream deadlock.
* **The Breakthrough:** Bypassing the deadlock via an **Early-Response Gadget (ERG)** at `POST /resources/css/anything`.
* **The Double-Desync Pipeline:**
  1. **Stage 1 (ERG):** Sets a trap on the socket, leaving the back-end expecting $N$ bytes of body.
  2. **Stage 2 (Chopped & Weaponized):** Turbo Intruder sends `stage2_chopped` ($N$ bytes) + `stage2_revealed` (`GET /404`) + `smuggled` (`GET /post?postId=10` with `User-Agent: a"/><script>alert(1)</script>`). The back-end swallows `stage2_chopped` to satisfy Stage 1, executes `GET /404`, and leaves the smuggled XSS payload primed in the socket buffer.
  3. **Stage 3 (Victim Execution):** When Carlos visits the homepage, his request is concatenated into the primed XSS payload, rendering `<script>alert(1)</script>` in his browser and solving the lab.

---

## 4. Defense-in-Depth Engineering & Hardening Blueprint (Chiến lược phòng thủ toàn diện)

Remediating HTTP Request Smuggling requires a multi-tiered engineering strategy. Relying on perimeter WAF regexes is provably ineffective against modern desynchronization tradecraft.

```text
+----------------------------------------------------------------------------------------------------+
|                               DEFENSE-IN-DEPTH HARDENING BLUEPRINT                                 |
+----------------------------------------------------------------------------------------------------+
| Tier 1: Protocol Architecture  ===> Mandate End-to-End HTTP/2 or HTTP/3; eliminate downgrading.    |
| Tier 2: Reverse Proxy & WAF    ===> Strict RFC 9112 validation; normalize headers; isolate sockets. |
| Tier 3: Web Server Hardening   ===> Upgrade Apache/IIS; force Connection: close on early responses.|
| Tier 4: Application & Session  ===> Zero-Trust APIs (mTLS/JWT); SameSite=Strict; robust CSP.       |
+----------------------------------------------------------------------------------------------------+
```

### 4.1 Tier 1: Protocol Architecture (The Definitive Solution)
The single most effective defense against HTTP Request Smuggling is eliminating text-based framing:
1. **Mandate End-to-End HTTP/2 or HTTP/3:** Enforce binary framing throughout the entire infrastructure—from client browsers, through edge CDNs, to backend application servers. In pure HTTP/2, frame boundaries are mathematically encoded via 24-bit binary length headers, and streams are multiplexed via Stream IDs. Byte-level desynchronization is mathematically impossible.
2. **Prohibit Protocol Downgrading:** Never translate incoming HTTP/2 requests into cleartext HTTP/1.1 byte streams for internal forwarding. If backend microservices cannot support HTTP/2 natively, terminate the connection cleanly and translate using strict binary serialization libraries that validate control characters.

---

### 4.2 Tier 2: Reverse Proxy & WAF Normalization

#### 1. Strict RFC 9112 Conformance
* **Disallow Header Whitespace:** In accordance with RFC 9112 §5.1, strictly reject any request containing whitespace between a header name and the colon (`Content-Length :` or `Transfer-Encoding :`) with an immediate `400 Bad Request`.
* **Sanitize Control Characters:** Abort streams immediately (`RST_STREAM` with `PROTOCOL_ERROR`) if any HTTP/2 header name, value, or pseudo-header (such as `:path`) contains `\r`, `\n`, whitespace, or `0x00`.
* **Reject Conflicting Headers:** If a request contains both `Transfer-Encoding` and `Content-Length`, reject the request entirely or strip `Content-Length` before forwarding.

#### 2. Socket Management & Connection Pool Isolation
* **Terminate Sockets on Early Responses:** If a backend server issues a response (especially a 3xx redirect or 4xx error) before consuming the declared request body, the proxy **MUST forcefully close the backend TCP connection (`Connection: close` / `TCP RST`)** rather than returning it to the idle pool.
* **Partition Connection Pools:** Never reuse backend Keep-Alive connections across distinct unauthenticated client sessions. If persistent connections are required for latency optimization, partition socket pools by authenticated session token or client IP.

#### Sample Nginx Hardening Configuration:
```nginx
# Enforce strict RFC parsing and disable raw header forwarding
proxy_pass_request_headers on;
ignore_invalid_headers on;
underscores_in_headers off;

# Prevent connection reuse across untrusted client streams
proxy_http_version 1.1;
proxy_set_header Connection "";

# Restrict caching strictly to GET requests; exclude HEAD from body caching
proxy_cache_methods GET;
proxy_cache_key "$scheme$request_method$host$request_uri";

# Force connection termination upon upstream timeouts or errors
proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
```

#### Sample HAProxy Hardening Configuration:
```haproxy
frontend fe_secure
    mode http
    bind :443 ssl crt /etc/ssl/certs/site.pem alpn h2,http/1.1
    
    # Reject control characters in URI and headers
    http-request deny if { path -m reg [\r\n] }
    http-request deny if { req.hdr_cnt() gt 100 }
    
    # Enforce framing normalization
    http-request deny if { hdr_cnt(content-length) gt 1 }
    http-request deny if { hdr_cnt(transfer-encoding) gt 1 }
    http-request deny if { hdr(transfer-encoding) -m found } && { hdr(content-length) -m found }
```

---

### 4.3 Tier 3: Web Server Hardening (Apache, IIS, Nginx)

#### 1. Upgrade Web Server Software
Ensure Apache HTTP Server is updated beyond 2.4.52 to patch `mod_reqtimeout` and `mod_dir` connection-handling flaws. Modern releases enforce RFC 9112 compliance by terminating persistent TCP connections if requests stall mid-stream.

#### 2. Enforce Connection Closure on Redirects
Configure web servers to append `Connection: close` on any internal directory redirect to ensure unconsumed bodies cannot linger in socket buffers:
```apache
<IfModule mod_headers.c>
    # Force connection close on directory redirects
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteCond %{REQUEST_URI} !/$
    RewriteRule ^(.*)$ $1/ [R=301,L]
    Header always set Connection "close" env=REDIRECT_STATUS
</IfModule>
```

#### 3. Disable Legacy Device Name Lookups (IIS)
On Windows/IIS deployments, configure URL Rewrite rules to reject DOS reserved names (`CON`, `PRN`, `AUX`, `NUL`) at the web server layer, neutralizing filesystem Early-Response Gadgets.

---

### 4.4 Tier 4: Application & Session Layer Hardening

#### 1. Zero-Trust Internal Authorization
Never rely on `Host: localhost`, `X-Forwarded-For`, or client IP checks to authenticate administrative interfaces:
* Mandate strong cryptographic authentication (Mutual TLS, signed JWT tokens, or multi-factor authentication) for all administrative and internal APIs.
* Enforce role-based access control (RBAC) at the application layer rather than delegating security checks to reverse proxies.

#### 2. Cookie Hardening against Client-Side Desync
Mitigate credential theft by enforcing strict browser cookie policies:
```http
Set-Cookie: session=xyz; Path=/; Secure; HttpOnly; SameSite=Lax
```
* **`SameSite=Lax` or `Strict`:** Prevents modern browsers from attaching sensitive session cookies to cross-origin `POST` fetch requests initiated by third-party exploit pages, neutralizing Client-Side Desync credential harvesting.
* **`HttpOnly`:** Precludes JavaScript from accessing session tokens, limiting the blast radius of chained XSS vulnerabilities.

#### 3. Context-Aware Output Encoding & Content Security Policy (CSP)
* Sanitize and HTML-entity-encode all reflected headers (such as `User-Agent`, `Referer`, and query parameters) before embedding them into HTML output.
* Deploy a restrictive Content Security Policy (`script-src 'self' 'nonce-...'`) to prevent smuggled payloads from executing inline scripts even if reflected XSS sinks are reached.

---

## Conclusion & The Future of HTTP Desynchronization

HTTP Request Smuggling is not a single vulnerability—it is a **systemic design flaw** rooted in the textual nature of HTTP/1.1 and the operational complexities of multi-tiered reverse proxy architectures.

As perimeter defenses adapt to block classic CL.TE and TE.CL vectors, the attack frontier has decisively shifted toward:
1. **Binary-to-text downgrading flaws (H2.TE, H2.CL, H2 Splitting, Request Tunnelling).**
2. **Client-side socket reuse in browsers (CSD).**
3. **State machine and timeout anomalies (CL.0, Pause-Based, 0.CL Double-Desync).**

To build resilient infrastructure, security teams must move beyond superficial WAF filtering. The future of web security demands **end-to-end binary protocol adoption (HTTP/2 and HTTP/3)**, mathematically rigorous message normalization, and zero-trust internal architecture.

*Explore the detailed technical write-ups and PoC demonstrations for all 22 labs in the directory index above.*
