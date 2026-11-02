# Stage 8 — provider-level replay, awaiting one live approval

Base main: `292222f929cf4cdac5efa8346d77287f7915d3a3` (PR #18).
Issue #20 is the scope. **No Stage 8 live RPC, probe, workflow reconstruction,
index scan, funding, secret change or paid service is authorised or performed.**
The fifth playable-position release gate remains open until an authorised real
job succeeds, its evidence is integrated and actual production playback passes.

## Why the fifth run stopped

[Run 41442682018](https://github.com/projectuwb/metric-lp-detective/actions/runs/41442682018)
used four requests, zero checkpoints and a 31-attempt reservation on 2 November
UTC. Its response differed from `0x`, which the old collector treated as a
contract-ownership blocker. Raw code was lost when the optional-secret scanner
failed. PR #18 fixed that scanner and saves usage before snapshot creation.

The evidence still cannot establish actual contract, proxy or EIP-7702 status,
or exclude malformed/null data. `fixtures/research/stage7-fifth-pilot-failure.json`
is retained unchanged. Its full 31-attempt reservation is neither refunded nor
reset. Another job is NOT covered by its consumed approval.

## Source finding: provider position is not beneficial ownership

The exact compiled source revision is
`ddf8ae0cdb2ad0041c3ff3aebc200cf488d5b0d3`:

- `contracts/MetricOmmPool.sol`, `addLiquidity` / `removeLiquidity`: adding
  accepts an owner; removing requires `msg.sender == owner`. There is no EOA-only
  account-code condition in these entry points.
- `contracts/libraries/LiquidityLib.sol`, `_positionBinKey`: shares are keyed by
  `keccak256(abi.encode(owner, salt, bin))`, irrespective of account code.
- `LiquidityLib.removeLiquidity` transfers tokens to that owner/provider and
  emits `LiquidityRemoved`. Callback payer may differ from provider on an add.

Thus an exact provider/salt position can be analysed without establishing a
controller or underlying depositor. Nonempty provider code alone is not a
financial-reconciliation failure. Extensions or RPC execution constraints can
still reject a particular withdrawal simulation; that is a real blocker and
must stop publication. No simulation establishes that a controller can originate
an on-chain withdrawal; no transaction is signed or sent.

## New proof protocol, same monetary rules

`PROVIDER_POSITION_ONLY` supports two historical observations:

| Observed fact at deposit block | Mode | Meaning |
| --- | --- | --- |
| Valid empty code | DIRECT_PROVIDER_ACCOUNT | Empty code at this block only; no claim about current code or controller |
| Valid nonempty code | CONTRACT_OR_DELEGATED_PROVIDER | Contract/proxy classification remains unconfirmed unless a known code marker is observed |
| Exact 23-byte `ef0100 + address` marker | CONTRACT_OR_DELEGATED_PROVIDER | Observed EIP-7702 code target, never inferred beneficial owner |
| Null, malformed, oversized, failed/noncanonical observation | ACCOUNT_TYPE_UNCONFIRMED | No verified replay or price result |

All modes keep **beneficial owner UNKNOWN**, current account type NOT CHECKED,
and provider/salt attribution explicit. Browser metadata exposes only mode,
block/hash/time, code hash/length and optional delegation target. Bounded public
code is retained compressed (maximum 24,576 bytes), not dumped to logs/browser.
The code request observes the exact provider/deposit block-end state (not
transaction-internal code changes), bounded by canonical headers
before and after; those headers also match the source log and state checkpoint.
Failure diagnostics retain curated reason/type information without raw provider
errors, endpoints or credentials. 429/quota failures stop without retry.

The original `scripts/verify-position.ts`, financial engine, ABI, accounting
version and all four verified fixture directories remain unchanged. They retain
their legacy verifier. New captures use schema 2 and a separate hashed provider
verification protocol; fresh jobs cannot fall back to a legacy proof.

The new verifier retains the legacy zero-base-unit share/reserve/receipt/trace
checks, additionally requiring:

- Every planned checkpoint, with all 100 bins / 300 storage words.
- Independent `removeLiquidity` execution at every owned checkpoint, exact
  caller/provider/salt/bin-share calldata and exact resulting quantities.
- Successful receipts matching source pool logs, exact net/gross contributions,
  and actual withdrawals transferred to the provider. Payer/control identity is
  never inferred. Complex multi-position or mixed-action funding transactions
  may fail these strict receipt checks; they are not silently approximated.
- Every attributable swap witness/native flow and all event/funding/head marks.
- Complete canonical provider-code evidence, exact scope and no asserted
  controller/beneficial owner. Bad account evidence never becomes a sample.

A new protocol context fingerprints these checks without rewriting old proofs.
An unexpired legacy job for the same provider/salt/index blocks a fresh-version
job; changing protocol cannot reset its lifetime counters. Daily cost/request
reservations, ten traces, twenty checkpoints and 100 lifetime attempts remain.

## Best next pilot — one fresh Free run, NOT yet approved

No previously unverified provider in the saved index has 1–10 attributable swaps.
The offline counter reproduces all four known counts; pool swaps in other bins
are not LP activity. The smallest untested nonzero case needs eleven traces,
which this stage does not enable. Use a zero-swap full withdrawal to prove the
new real-wallet route first; the original samples retain real swap validation.

### Recommended new provider

`0x5f2d7522799d5d2d5dd7de66a16cdf86654cb190:1044581382818305908510560`

Provider: `0x5f2d7522799d5d2d5dd7de66a16cdf86654cb190`.
Salt: `1044581382818305908510560`.

- Deposit **129094689**: `0xafaa046914574013344de5cde5af4336ed03894ffbdb5e0d24cc3b80a2074dd7`.
- Full withdrawal in index **129094959**: `0x0baa72876252ecfa7583eeb271948e7d800874f2a965fe38b2a997b2ce6af7fe`.
- Zero attributable swaps, two funding transactions, five checkpoints, zero traces.
- Each funding transaction contains only this position's liquidity event in the
  saved pool index. Token receipts and all actual quantities remain unverified.
- Account type **UNKNOWN**. No live code probe has been performed for it. A valid
  canonical empty, contract or delegation response can proceed at provider level;
  invalid/missing data stops before inventory acquisition.

**Proposed date: 3 November 2026 UTC**, no earlier than **11 a.m. Sydney on
3 November**. One fresh owner Run workflow on main, `resume_checkpoint=false`.
Expected **28 requests**, absolute reservation/hard limit **33 transport attempts**
including failures; existing SolidRPC Free, **US$0** maximum charges. No automatic
retry, second wallet, paid fallback, top-up, or discovery/accounting scan.

| Method | Expected attempts |
| --- | ---: |
| eth_chainId | 1 |
| eth_getCode | 2 (pool at indexed head; provider at deposit) |
| eth_getBlockByNumber | 13 (pinned head, ten state boundaries, two account boundaries) |
| eth_call | 10 (five storage, two removal simulations, three marks) |
| eth_getTransactionReceipt | 2 |
| debug_traceTransaction | 0 |
| Total | **28** |

The conservative ceiling assumes a removal and mark at every checkpoint:
`6 setup + 5 × 5 checkpoint reads + 2 receipts = 33`. There is no standalone
classification probe: the canonical code observation is included in this limit.
The owner may approve precisely this proposal after code/CI integration; this
document does not approve or dispatch it. No secret installation is required.

### Alternative only, not an automatic retry

`0xa598e2658ef74196f498b00b289a7d5d64a42cd7:615031639178913965778603`

Original deposit **128019133**, removal **128019250**, zero swaps/traces, five
checkpoints; the existing failed-run document retains exact transaction hashes.
Expected **28**, hard **33** for the new protocol, but account type is still
UNKNOWN. Its earlier guard result is not a code classification. Its old active
job prevents a fresh protocol-version job until **3 November 12:12:24 UTC**.
If selected instead, propose no earlier than **12:15 UTC / 11:15 p.m. Sydney on
3 November**, with separate fresh approval. The old run is never rerun/resumed.
Approval for the recommended provider does not include this alternative.

Machine-readable counts/history: `docs/STAGE_8_CANDIDATES.json`.
Reproduce with `npm run preflight:position -- provider:salt`; this is offline
and explicitly reports ACCOUNT_TYPE_UNCONFIRMED, never EOA eligibility.

## Website and delivery gate

Lookup still matches direct provider/salt in checked **126502643–130841348**;
manager-to-wallet linkage is unknown. The analysis panel explains provider-level
scope and, for the old failed candidate, links the genuine historical failure
without showing a running job or reusing its authority. Copy-ID / owner workflow
remain; no local files, wallet connection, new credentials or Git write token.

A future verified schema-2 replay displays its historical code confidence and
beneficial-owner warning alongside the same inventory/event/cashflow interface.
Amounts describe the LP/provider, not personal control or downstream payouts.
No replay is registered merely by this stage's test configuration or code support.

Production acceptance targets the recommended unfamiliar provider. Until an
approved reconstruction, independent verification, export, successful CI, merge
and deployment, it must report **ANALYSIS_NEEDED_OWNER_HANDOFF_PROVEN**. Only real
published chain evidence can change that to VERIFIED_PUBLIC_REPLAY_PROVEN.
The full public browser then checks every inventory event, actual exit/PnL,
source links, provider scope and mobile layout at the exact deployed commit.

Saved-state tests use genuine monetary fixtures with explicitly synthetic
account-code overlays, including the actual saved pool runtime bytes. They
prove policy separation and preserve all financial checks; they are NOT new
contract-wallet chain evidence and never enter the published position registry.

Recent discovery/accounting architecture is retained but no scan is launched.
The exact eleven-trace candidate has a durable proposal in
`docs/STAGE_8_TRACE_PARENT_PLAN.json`: sixteen checkpoints, thirteen owned-state
withdrawal checks, fourteen marks and two funding receipts. Phase A would acquire
the first ten traces plus all financial/account evidence (93 expected, 98 hard);
phase B on a separately named UTC day would revalidate the saved canonical
boundaries and acquire the final trace (23 expected, 24 hard). Both phases share
one source fingerprint, cumulative ledger and final reconciliation gate; phase A
must never publish a sample. The proposed parent ceiling is 122 attempts over
48 hours. **This exceeds the current 100-attempt/24-hour lifetime policy and is
not implemented or authorised.** Daily 100-request/ten-trace caps would remain;
phase-aware recovery, checksums and expiry must be implemented/tested, and all
parent/day ceilings explicitly approved, before live acquisition. It is not an
alternative implicit authorisation under the recommended 33-attempt pilot.

No cap is raised or reset. PR #19 was independently read:
its two narrow result-limit phrases preserve precedence, but no GitHub checks
were returned for its head during this review, so it remains separate/unmerged.

Final validation, branch/CI/production observations and live approval status are
recorded in DEVELOPMENT_LOG.md and the Stage 8 PR receipt. **No fifth playable
position or arbitrary-current-wallet support is claimed.**
