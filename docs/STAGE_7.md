# Stage 7 — new-wallet release gate (NOT COMPLETE)

Stage 6 main: `5cf3a38f9b8ac9366c70be879b7f8a5a5ad5e1bc` (PR #15).
Stage 7 implementation merged at `1168aba3e1f0f8badd2b3a871e0a6ed1877b9800` (PR #17).
The approved fifth-position pilot ran once and stopped after **4 RPC attempts**
before independent position reconciliation. No verified fifth replay exists.
No payments, account/secret changes, index scans or infrastructure changes.

## Actual fifth pilot — stopped, do not rerun

[Owner run 41442682018](https://github.com/projectuwb/metric-lp-detective/actions/runs/41442682018)
was dispatched by the owner on main at **11:11 p.m. Sydney, 2 November 2026**
(12:11:38 UTC), inside the approved day/window. Its admitted position/key match
the named approval exactly; 31 attempts were reserved, Free/$0, resume off.
It stopped after chain identity, pinned-head hash, pool runtime and provider-code
reads: **4 transport attempts**, no traces, 0/5 inventory checkpoints.

The prior guard saw a historical provider-code response unequal to `0x` and
returned `UNSUPPORTED: Contract-provider beneficial ownership requires separate
proof`. The raw code was not retained remotely, so contract implementation,
manager ownership, EIP-7702 delegation or a malformed/null response cannot be
independently distinguished. The original guard did not validate the response
type; the fix now rejects malformed code as invalid RPC data rather than
classifying it as a contract. Valid nonempty code still stops for ownership review.
Do not infer beneficial wallet ownership or remove the guard to get a green run.
The offline candidate was feasible by event count, not proven eligible by
provider account type; that dependency could only be tested during this pilot.

The snapshot step also failed. GitHub exposes the unset optional `LP_RPC_URL`
as an empty string; the scanner treated that as an invalid configured URL.
This was independently reproduced offline. The fix accepts an absent/empty
optional variable while still rejecting malformed nonempty URLs and scanning
all configured credentials. Future checkpoint handling saves actual usage
counters first, so rejected snapshots cannot discard their durable accounting.

The actual state-branch receipt retains the **entire 31-attempt reservation**,
$0 reserved charges, `attempts: 0, checkpointed: false` (the initial allocation,
NOT actual zero usage), and only an old other-position snapshot. The runner log
records **4** attempts. This lost checkpoint cannot be repaired by fabricating a
local meter or replaying calls; no ledger counter/reservation was reset/refunded.
The preserved evidence is `fixtures/research/stage7-fifth-pilot-failure.json`.
It is failure research, never a verified position artifact or replay registration.

No state/withdrawal checkpoint, funding receipt, reference mark, selected-point
PnL or zero-discrepancy reconciliation was obtained. The indexed position still
has **zero attributable swaps**; no execution quotes were invented.

The single approved fresh run has been used. **No further live requests, fresh
dispatch, resume or rerun are authorised.** No additional owner action is needed
for this stopped run. Any future live work needs a separate named approval after
provider-ownership eligibility is resolved; it is not part of the remaining
reservation. Existing four verified replays and accounting remain unchanged.

## Offline candidate and explicit approval boundary

Position: `0xa598e2658ef74196f498b00b289a7d5d64a42cd7:615031639178913965778603`.
New provider, unregistered. The saved pool index shows a deposit at **128019133**
and full removal at **128019250**, with **zero attributable swaps**. This is
index evidence, NOT independent verification of balances or PnL.

An exhaustive offline owner/share-per-bin activity count matches all four known
positions (26,202 / 9 / 1 / 10 swaps). No previously untested provider has 1–10
attributable swaps. The smallest nonzero untested case has 11, beyond the existing
ten-trace cap; that cap has not been weakened. Swaps elsewhere in the pool during
an LP's lifetime are not attributed to the LP.

Reproduce without RPC:

```sh
npm run preflight:position -- 0xa598e2658ef74196f498b00b289a7d5d64a42cd7:615031639178913965778603
```

Five checkpoints: 128019132, 128019133, 128019249, 128019250, 130841348.
Expected **26 requests**, conservative reservation/hard stop **31 attempts**
including failures. Method breakdown: chain identity 1, code 2, headers 11,
historical calls 10 (five storage, two withdrawal simulations, three marks),
funding receipts 2, traces 0. The actual owner job's durable meter enforces its
31-attempt reservation; no automatic retries, paid fallback or index scan.

**Approval executed once; no retry authorised.** The 26/31 figures above were
preflight predictions. Actual usage and failure are recorded in the preceding
section. The old 12-call research allowance and this stopped run cannot fund
another wallet, scan or retry. No charge is authorised.

The public route remains wallet input → position/salt → owner handoff, not an
anonymous job trigger. The owner already performed the Run action for this
candidate; **do not perform it again**. The installed RPC secret needs no change.

Connected GitHub tools still expose no workflow dispatch; the cloud network
allowlist excludes api.github.com. Neither limitation caused this run's failure:
the actual owner dispatch succeeded, then the eligibility guard stopped work.

## Actual public operational acceptance

`Production wallet acceptance` runs after successful **main Validate**, with a
read-only token, no RPC secrets, no dispatch API and no artifact storage upload.
It polls the existing production `/api/release` until the **exact main commit**
and its independently prepared playable registry are observed. Then it enters
the candidate wallet, selects its salt and inspects the public app in Chromium
at mobile width. `PUBLIC_BROWSER_PROOF` in actual Actions logs is the receipt.

Before real evidence is published it must report
`ANALYSIS_NEEDED_OWNER_HANDOFF_PROVEN`; it checks the copied ID and absence of
playback. After actual owner evidence is independently verified, exported,
merged and deployed, the same test must report `VERIFIED_PUBLIC_REPLAY_PROVEN`:
all event pages, each playhead inventory, every attributable swap witness,
full-close payout/PnL, source link and no mobile overflow. It makes no RPC calls.
It cannot convert a missing registration into a sample or manufacture progress.

The same interaction is exercised by local production-build browser tests with
`mode: LOCAL_REGRESSION`; those are not public deployment evidence. The cloud
cannot directly open the Vercel origin under its existing network policy. The
public GitHub runner test checks the actual origin; a Vercel Ready status alone
is insufficient to claim the wallet flow succeeded.

## Discovery and full accounting are separate

Published checked deployment-origin coverage remains **126502643–130841348**.
Stage 6's dated finalized observation is **131119667**, at
**2026-11-01T21:18:28Z**; this is NOT a freshly checked chain head. No later
continuous window has been scanned/published here.

Liquidity-topic discovery uses the existing measured Free-account 30,000-block
profile, with ABI/source/report provenance. Explicit range/result-limit errors
split a page into complete inclusive halves; 429, quota and temporary errors
stop immediately. Every subattempt uses the existing shared meter. Canonical
checks still cover all event blocks and both page boundaries before commit;
an unfinished page never advances coverage. FOUND / NONE FOUND IN CHECKED
WINDOW / NOT CHECKED YET and managed-ownership caveats are preserved.

The dated 278,319-block gap needs ten 30k liquidity pages: **34 + E** calls on a
fresh run, where E is distinct event blocks, plus discarded pages/failures and
five setup calls per resumed run. The previous 1k approach needed at least 841.
A possible next discovery task is one **20-attempt** owner refresh, with no
promise that the entire gap fits. This is a proposal, NOT authorization.

`Owner full accounting index capture` is a separate, main-only, owner-dispatch
workflow. It takes an **exact target block** and **20/40/60-attempt** ceiling;
shares concurrency, global 100/day reservations and exact cost accounting with
analysis/discovery; no refunds, reruns or automatic spending. It uses all pool
events (no liquidity filter), deployment-origin bin ledger and owner changes.
Pages begin at 130841349, initially at most **1000 blocks**. Explicit dense
result/range failures shrink the range; single-block saturation fails closed.
No 30k capability is inferred for dense all-event logs.

Every completed accounting page persists an independent historical `extsload`
result for reserves and total shares of **all 100 bins**, exact requested slots,
page logs/checksum, source/version and canonical boundary. Replay compares
reserves, total shares and sum of attributed owner shares with **zero base-unit
tolerance**. Canonical event blocks and pre/post state-read boundary hashes are
checked. Budget exhaustion retains only completed reconciled pages. A new run
checks baseline and saved-head canonicality and independently rechecks saved
storage evidence before sending further requests. Provider errors stop the run.

Public candidate evidence goes to `fixtures/accounting/candidate.json` via a
validated evidence branch. `prepare:web` / `verify:accounting` independently
recheck it, rather than trusting a saved PASS. Its honest status is
`POOL_LEDGER_RECONCILED_POSITION_PROOFS_REQUIRED`.

**The candidate is deliberately not selected by the published LP replay engine.**
Existing immutable proof source hashes and heads remain fixed. Extending the
versioned LP-job context, collecting new LP-specific state/removal simulations,
receipts, trace witnesses and reference marks, and independently verifying them
are still required to enable later LPs. Capturing liquidity events or passing a
pool-wide boundary check alone never unlocks later positions. This is an
implemented acquisition/reconciliation bridge, not completed current-chain LP
replay support.

Accounting calls on an uninterrupted fresh job: **4 setup + 4 per page + E**,
where E is distinct event blocks; resume adds one saved-head check. Range failures
cost header + failed log request before subdivision. The dated gap at 1k pages
requires at least **1120 + E** calls (279 pages), before errors/resumes. Actual
density/range feasibility after the pinned head is NOT MEASURED; no cost or
catch-up completion is promised from an offline estimate.

A precise next accounting experiment, separately requiring approval, is
**130841349–130842348**, maximum **20 attempts**, on an allowed UTC day after
the wallet pilot; expected **8 + E** calls if a single page succeeds. It may
pause without completing any page if activity requires more canonical reads.
The report will measure actual density, range fallback, attempts and reconciled
through-block. It never spends beyond the approved attempt count. No paid mode
is needed for this proposal and none is enabled.

## Release status

| Capability | Current operational state |
| --- | --- |
| Old-window provider/salt discovery | Existing checked 236-position index |
| Later liquidity discovery | Bounded owner workflow implemented; not live refreshed |
| Later full accounting | Bounded capture/reconciliation candidate workflow implemented; not live run |
| Fifth independent reconstruction | Actual owner run stopped UNSUPPORTED after 4 requests; no retry authorised |
| Public fifth-wallet replay | Unavailable: no independently reconciled artifact; release gate remains open |
| Anonymous reconstruction | Not authorized or enabled |
| Larger positions | Existing job/checkpoint/trace limits apply; staged work required |

Existing accounting/PnL math, four verified proofs, partial contributions and
withdrawals, actual-token bridge, selected-point comparisons, infeasible holding
explanations and clearly hypothetical settlement conversions are preserved.

## Safe expansion after this failed pilot (not activated)

Account type is an eligibility dependency, not an inference from a short
liquidity history. A future preflight must separately label `account code not
yet checked`, `empty historical code`, `contract code`, or `delegation/ownership
unresolved`, retaining the actual sanitized code hash/type observation. Nonempty
code alone does not prove a managed wallet's beneficial owner. To support direct
contract-provider analysis, first specify the identity being proved (the exact
provider/salt versus an underlying wallet), audit the provider/delegation path,
then retain the same LP-specific state, receipt, withdrawal and mark checks.
The current guard has not been disabled and this run cannot be continued.

For positions above ten trace transactions, buying credit or splitting fresh
jobs cannot reset today's caps. The safe design is one source-bound parent job
with immutable trace/checkpoint manifests, cumulative lifetime counters and
separately approved per-day phases. Each saved trace must match all ordered
pool swaps/native deltas in its transaction; final promotion still requires
complete witnesses, independent state/removal/receipt checks and all marks.
Lost/latest-checkpoint refusal and canonical checks remain mandatory.

A concrete arithmetic example (NOT a new wallet observation): 16 checkpoints,
13 withdrawal simulations, 14 marks, two receipts and 11 traces require 92
uninterrupted calls. Resuming after ten traces adds 18 canonical/identity reads,
for about **110 total** before failures. Therefore even two days of <=10 traces
cannot safely fit that example under the current 100-attempt lifetime cap.
A possible future explicitly approved 150-attempt parent ceiling, retaining
<=100/day and <=10 traces/day, would need a real phase planner and independent
completion gate. It is **not implemented or enabled**, and this pilot approval
cannot authorise it. No quota, trace, checkpoint or lifetime limit changed here.

Recent-wallet expansion still needs separate bounded liquidity discovery and
full-accounting capture approvals, followed by versioned LP-specific proof
integration. Neither the four eligibility reads nor a provider identity fix
extends accounting beyond 130841348.
