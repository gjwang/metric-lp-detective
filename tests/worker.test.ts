import { afterEach, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { gunzipSync } from 'node:zlib';
import { processJob } from '../scripts/analysis-worker';
import { context, submit, getJob, retryJob, jobFolder, updateJob } from '../lib/analysis/store';
import { runtimeMeta, runtimePage } from '../lib/analysis/artifact';
import { RpcFailure, type Rpc } from '../lib/chain/rpc';
import { SMALL_SAMPLE_ID } from '../lib/domain/samples';
import { historyInputs } from '../scripts/reconstruct-history';
import { snapshot, restoreSnapshot } from '../lib/analysis/remote';
let folder: string | undefined;
afterEach(() => { vi.unstubAllEnvs(); if (folder) rmSync(folder, { recursive: true, force: true }); });
it('real saved evidence: failed request, bounded retry, independent promotion, immutable recovery and corruption rejection', async () => {
  folder = mkdtempSync(path.join(os.tmpdir(), 'metric-worker-fixture-')); vi.stubEnv('LP_ANALYSIS_DIR', folder); vi.stubEnv('LP_ANALYSIS_MODE', 'owner-local'); vi.stubEnv('VERCEL', '');
  const root = 'fixtures/positions/632f7d8c3d6ef54f/', states = JSON.parse(readFileSync(root + 'states.json', 'utf8')), marks = JSON.parse(readFileSync(root + 'marks.json', 'utf8'));
  const job = submit(SMALL_SAMPLE_ID, context()).job;
  // This is a transport-failure unit vector, not new blockchain evidence.
  await processJob(job, async () => { throw new RpcFailure('rate', 429); }, async () => {});
  expect(getJob(job.key)).toMatchObject({ status: 'RATE_LIMITED', requests: 1, method: 'eth_chainId' });
  // An ephemeral remote runner is replaced. The same lifetime request budget and
  // versioned public inputs survive; this saved-fixture test is NOT a live run.
  const paused = getJob(job.key)!, saved = snapshot(jobFolder(job.key), job.key, context(), '123', paused.expiresAt);
  rmSync(jobFolder(job.key), { recursive: true });
  restoreSnapshot(saved, jobFolder(job.key), job.key, context());
  const next = retryJob(job.key);
  const fixtureRpc: Rpc = async (method, params) => {
    if (method === 'eth_chainId') return '0x38';
    if (method === 'eth_getCode') return params[0] === SMALL_SAMPLE_ID.split(':')[0] ? '0x' : JSON.parse(readFileSync('fixtures/raw/code-and-identity.json', 'utf8')).runtimeCode;
    if (method === 'eth_getBlockByNumber') { const s = states.find((s: any) => BigInt(s.block) === BigInt(params[0] as string)); return { number: params[0], hash: s.blockHash, timestamp: s.timestamp }; }
    if (method === 'eth_getTransactionReceipt') return JSON.parse(readFileSync(root + 'receipts/' + params[0] + '.json', 'utf8'));
    if (method === 'debug_traceTransaction') return JSON.parse(gunzipSync(readFileSync(root + 'traces/' + params[0] + '.json.gz')).toString());
    if (method === 'eth_call') {
      const block = BigInt(params[1] as string).toString(), call = params[0] as any, s = states.find((s: any) => s.block === block);
      if (call.data === s?.call.data) return s.raw;
      if (call.data === s?.withdrawal?.request.data) return s.withdrawal.result;
      const m = marks.find((m: any) => m.block === block && m.request.data === call.data); if (m) return m.result;
    }
    throw new Error('Fixture has no response for this exact method/call');
  };
  // Also lose the runner after a SUCCESSFUL canonical storage checkpoint. This
  // exercises real cached responses/header revalidation, not just an empty job.
  let interrupt = true;
  await processJob(next, async (method, params) => {
    if (interrupt && method === 'eth_getBlockByNumber' && getJob(job.key)!.completedCheckpoints > 0) {
      interrupt = false; throw new RpcFailure('rate', 429);
    }
    return fixtureRpc(method, params);
  }, async () => {});
  const checkpointed = getJob(job.key)!;
  expect(checkpointed.status).toBe('RATE_LIMITED'); expect(checkpointed.completedCheckpoints).toBeGreaterThan(0);
  const resumed = snapshot(jobFolder(job.key), job.key, context(), '124', checkpointed.expiresAt);
  rmSync(jobFolder(job.key), { recursive: true }); restoreSnapshot(resumed, jobFolder(job.key), job.key, context());
  expect(getJob(job.key)?.requests).toBe(checkpointed.requests);
  await processJob(retryJob(job.key), fixtureRpc, async () => {});
  const finished = getJob(job.key)!;
  expect(finished.status).toBe('VERIFIED'); expect(finished.requests).toBeLessThanOrEqual(100);
  expect(finished.attempts).toBe(3);
  expect(finished.verification).toMatchObject({ storageComparisons: 6000, withdrawalChecks: 12, tolerance: '0' });
  expect(runtimeMeta(job.id)?.final).toEqual(['0', '0']); expect(runtimePage(job.id, 0)).toHaveLength(14);
  expect(runtimeMeta(job.id)?.providerIdentity).toMatchObject({ mode: 'DIRECT_PROVIDER_ACCOUNT', scope: 'PROVIDER_POSITION_ONLY', beneficialOwner: 'UNKNOWN', currentAccountType: 'NOT_CHECKED' });
  const issued = finished.requests;
  // Model a crash after rename but before promotion: recover from independently checked raw evidence.
  updateJob(job.key, { status: 'RUNNING', attempts: 1 });
  await processJob(getJob(job.key)!, async () => { throw new Error('No RPC is permitted for completed capture recovery'); }, async () => {});
  expect(getJob(job.key)).toMatchObject({ status: 'VERIFIED', requests: issued });
  const file = path.join(jobFolder(job.key), 'replay/events-0.json'); writeFileSync(file, '[]');
  expect(() => runtimePage(job.id, 0)).toThrow('checksum');
}, 90000);
it.each([
  { name: 'valid contract code but missing financial proof', code: '0x6000', status: 'FAILED', attempts: 8, error: 'Independent capture/verification failed; replay remains locked. Owner review is required.' },
  { name: 'invalid account response', code: null, status: 'UNSUPPORTED', attempts: 6, error: 'ACCOUNT_TYPE_UNCONFIRMED: historical code response is invalid or outside safe limits' },
])('keeps $name unplayable without complete financial reconciliation', async ({ code, status, attempts, error }) => {
  // Synthetic nonempty bytecode is an eligibility vector, NOT the failed
  // pilot's raw provider code (which was not retained by that runner).
  folder = mkdtempSync(path.join(os.tmpdir(), 'metric-code-provider-')); vi.stubEnv('LP_ANALYSIS_DIR', folder); vi.stubEnv('LP_ANALYSIS_MODE', 'owner-local'); vi.stubEnv('VERCEL', '');
  const id = '0xa598e2658ef74196f498b00b289a7d5d64a42cd7:615031639178913965778603', c = context(), job = submit(id, c).job;
  const calls: string[] = [], h = historyInputs();
  await processJob(job, async (method, params) => {
    calls.push(method);
    if (method === 'eth_chainId') return '0x38';
    if (method === 'eth_getBlockByNumber') { const head = params[0] === '0x' + BigInt(c.indexEnd).toString(16), log = h.logs.find(l => BigInt(l.blockNumber) === BigInt(params[0] as string)); return { number: params[0], hash: head ? c.indexEndHash : log?.blockHash ?? '0x' + '11'.repeat(32), timestamp: '0x1' }; }
    if (method === 'eth_getCode') return params[0] === id.split(':')[0] ? code : JSON.parse(readFileSync('fixtures/raw/code-and-identity.json', 'utf8')).runtimeCode;
    throw new Error('No historical inventory/receipt/trace read is permitted after eligibility refusal');
  }, async () => {});
  expect(calls.slice(0, 6)).toEqual(['eth_chainId', 'eth_getBlockByNumber', 'eth_getCode', 'eth_getBlockByNumber', 'eth_getCode', 'eth_getBlockByNumber']);
  expect(getJob(job.key)).toMatchObject({ status, requests: attempts, completedCheckpoints: 0, error });
  expect(runtimeMeta(id)).toBeNull();
}, 60000);
