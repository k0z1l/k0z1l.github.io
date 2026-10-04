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
| **07** | [HTTP request smuggling, bypassing front-end security controls, TE.CL vulnerability](lab-07-HTTP%20request%20smuggling-bypassing%20front-end%20security%20controls,%20TE.CL%20vulnerability/) | Practitioner | Bypassing perimeter `/admin` access control and localhost restriction via TE.CL smuggling |
| **08** | [HTTP request smuggling, revealing front-end request rewriting](lab-08-HTTP%20request%20smuggling-revealing%20front-end%20request%20rewriting/) | Practitioner | Leaking internal front-end rewritten headers via search parameter reflection to bypass IP controls |
| **09** | [HTTP request smuggling, capturing other users' requests](lab-09-HTTP%20request%20smuggling-capturing%20other%20users%20requests/) | Practitioner | Exfiltrating victim credentials and session cookies via storage sink smuggling into blog comments |
| **10** | [HTTP request smuggling, delivering reflected XSS](lab-10-HTTP%20request%20smuggling-delivering%20reflected%20XSS/) | Practitioner | Weaponizing unexploitable User-Agent reflected XSS into unsolicited zero-click execution |
| **11** | [Response queue poisoning via H2.TE request smuggling](lab-11-HTTP%20request%20smuggling-response%20queue%20poisoning%20via%20H2.TE%20request%20smuggling/) | Practitioner | Exploiting H2.TE HTTP/2 downgrading to poison the FIFO response queue and capture admin sessions |
| **12** | [H2.CL request smuggling](lab-12-HTTP%20request%20smuggling-H2.CL%20request%20smuggling/) | Practitioner | Exploiting H2.CL downgrading and on-site path redirection to hijack script imports and execute XSS |
| **13** | [HTTP/2 request smuggling via CRLF injection](lab-13-HTTP%20request%20smuggling-H2%20request%20smuggling%20via%20CRLF%20injection/) | Practitioner | Injecting CRLF into HTTP/2 headers to synthesize Transfer-Encoding: chunked and capture sessions |
| **14** | [HTTP/2 request splitting via CRLF injection](lab-14-HTTP%20request%20smuggling-H2%20request%20splitting%20via%20CRLF%20injection/) | Practitioner | Weaponizing header CRLF injection to split bodyless GET requests and poison response queues |
| **15** | [CL.0 request smuggling](lab-15-HTTP%20request%20smuggling-CL.0%20request%20smuggling/) | Practitioner | Exploiting static asset handlers that ignore Content-Length to bypass perimeter admin controls |
| **16** | [Exploiting HTTP request smuggling to perform web cache poisoning](lab-16-HTTP%20request%20smuggling-exploiting%20HTTP%20request%20smuggling%20to%20perform%20web%20cache%20poisoning/) | Expert | Chaining CL.TE smuggling with open redirection to poison the front-end cache and deliver persistent XSS |
| **17** | [Exploiting HTTP request smuggling to perform web cache deception](lab-17-HTTP%20request%20smuggling-exploiting%20HTTP%20request%20smuggling%20to%20perform%20web%20cache%20deception/) | Expert | Exploiting CL.TE smuggling and static cache heuristics to capture victim account data into the public cache |
| **18** | [Bypassing access controls via HTTP/2 request tunnelling](lab-18-HTTP%20request%20smuggling-bypassing%20access%20controls%20via%20H2%20request%20tunnelling/) | Expert | HTTP/2 downgrading and header name CRLF injection to leak internal auth headers and tunnel admin requests |

*Upcoming challenges will be continuously documented here.*

