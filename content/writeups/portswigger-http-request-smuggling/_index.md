---
title: "[PortSwigger] HTTP Request Smuggling Series"
date: 2026-09-22
description: "Comprehensive technical analysis and walk-throughs of HTTP Request Smuggling vulnerabilities on PortSwigger Web Security Academy: core concepts, attack architecture, exploitation tradecraft, and defense-in-depth remediations."
categories: ["PortSwigger Labs"]
series: ["HTTP Request Smuggling"]
showAuthor: false
showTableOfContents: true
---

Welcome to the **HTTP Request Smuggling** series covering the practical labs from the **PortSwigger Web Security Academy**.

HTTP Request Smuggling is a high-impact attack vector that targets how chains of HTTP servers (such as front-end reverse proxies, CDNs, or load balancers, and back-end application servers) parse and process sequences of HTTP requests transmitted over shared, persistent TCP connections (HTTP Keep-Alive / Pipelining).

The vulnerability arises when front-end and back-end servers disagree on message boundaries, primarily due to discrepancies in handling the two length-determining headers: `Content-Length` and `Transfer-Encoding`. An attacker can manipulate request formatting to cause a server to interpret part of an attacker's request as the start of the next incoming request from a victim, resulting in critical impacts: access control bypass, session hijacking, cache poisoning, and cross-site scripting (XSS).

---

## Standardized Analysis Framework

Each writeup in this series adheres to a rigorous four-part framework:
1. **Core Fundamentals**: Protocol specifications, header parsing mechanisms, and HTTP message boundary rules.
2. **Attack Architecture**: Data-flow modeling and differential parsing analysis between front-end and back-end components.
3. **Exploitation & Step-by-Step PoC**: Detailed experimental steps, request/response tampering using Burp Suite (Repeater, Turbo Intruder, HTTP/2).
4. **Remediation Strategies**: Secure configuration guidelines for intermediate proxies and backend servers, promoting end-to-end HTTP/2 adoption.

---

## Series Challenge Index

| Lab | Challenge name | Level | Primary Exploit Technique |
| :---: | :--- | :---: | :--- |
| **01** | [HTTP request smuggling, basic CL.TE vulnerability](lab-01-HTTP%20request%20smuggling-basic%20CL.TE%20vulnerability/) | Practitioner | CL.TE desync distorting the victim's subsequent request into `GPOST` |
| **02** | [HTTP request smuggling, basic TE.CL vulnerability](lab-02-HTTP%20request%20smuggling-basic%20TE.CL%20vulnerability/) | Practitioner | TE.CL desync smuggling request fragments via chunked payloads mutating method into `GPOST` |
| **03** | [HTTP request smuggling, obfuscating the TE header](lab-03-HTTP%20request%20smuggling-obfuscating%20the%20TE%20header/) | Practitioner | Transfer-Encoding obfuscation (TE.TE) inducing parser discrepancy |
| **04** | [HTTP request smuggling, confirming a CL.TE vulnerability via differential responses](lab-04-HTTP%20request%20smuggling-confirming%20a%20CL.TE%20vulnerability%20via%20differential%20responses/) | Practitioner | Confirming CL.TE desynchronization via differential responses (404 trigger) |
| **05** | [HTTP request smuggling, confirming a TE.CL vulnerability via differential responses](lab-05-HTTP%20request%20smuggling-confirming%20a%20TE.CL%20vulnerability%20via%20differential%20responses/) | Practitioner | Confirming TE.CL desynchronization via differential responses (404 trigger) |
| **06** | [HTTP request smuggling, bypassing front-end security controls, CL.TE vulnerability](lab-06-HTTP%20request%20smuggling-bypassing%20front-end%20security%20controls,%20CL.TE%20vulnerability/) | Practitioner | Bypassing perimeter `/admin` access control and localhost restriction via CL.TE smuggling |

*Upcoming challenges will be continuously documented here.*
