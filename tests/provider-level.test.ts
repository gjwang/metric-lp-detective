import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { classifyProviderCode, collectProviderEvidence, verifyProviderEvidence } from '../lib/analysis/providerEvidence';
import { providerVerificationVersion } from '../lib/analysis/providerVersion';
import { verifyReplayPosition } from '../scripts/verify-replay-position';
import { historyInputs } from '../scripts/reconstruct-history';
import { context, jobKey } from '../lib/analysis/store';
import { reserveBudgetedRun, refuseActiveLegacyJob } from '../lib/analysis/remote';
import { usagePolicy } from '../lib/analysis/usageBudget';
import { RpcFailure } from '../lib/chain/rpc';
const folders: string[] = [], temp = () => { const p = mkdtempSync(path.join(tmpdir(), 'metric-provider-v1-')); folders.push(p); return p; };
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
afterEach(() => { vi.unstubAllEnvs(); for (const f of folders.splice(0)) rmSync(f, { recursive: true, force: true }); });
const runtime = read('fixtures/raw/code-and-identity.json').runtimeCode;
describe('bounded account facts, not beneficial ownership', () => {
  it('separates empty code, actual saved runtime bytes, delegation markers and unclassified proxies', () => {
    expect(classifyProviderCode('0x')).toMatchObject({ mode: 'DIRECT_PROVIDER_ACCOUNT', form: 'EMPTY_CODE', codeBytes: 0 });
    expect(classifyProviderCode(runtime)).toMatchObject({ mode: 'CONTRACT_OR_DELEGATED_PROVIDER', form: 'NONEMPTY_CODE_PROXY_STATUS_UNKNOWN', codeBytes: 20024 });
    expect(classifyProviderCode('0xef0100' + '12'.repeat(20))).toMatchObject({ form: 'EIP_7702_DELEGATION_MARKER', delegationTarget: '0x' + '12'.repeat(20), codeBytes: 23 });
    expect(classifyProviderCode('0x363d3d373d3d3d363d73' + '12'.repeat(20) + '5af43d82803e903d91602b57fd5bf3')).toMatchObject({ form: 'NONEMPTY_CODE_PROXY_STATUS_UNKNOWN' });
  });
  it.each([null, undefined, {}, 1, '0x0', '0X', '0xzz', 'private response', '0x' + '11'.repeat(24577)])('fails closed on invalid/oversized code', value => {
    expect(classifyProviderCode(value).status).toBe('ACCOUNT_TYPE_UNCONFIRMED');
  });
  it('retains canonical code hashes/markers by block; historical empty code never implies current empty code', async () => {
    const root = pathToFileURL(temp() + '/'), provider = '0x' + '12'.repeat(20), hash = '0x' + 'ab'.repeat(32);
    const observe = (block: string, code: string) => collectProviderEvidence(provider, block, hash, root, async m => m === 'eth_getCode' ? code : { number: '0x' + BigInt(block).toString(16), hash, timestamp: '0x1' });
    const first = await observe('100', '0x'), later = await observe('200', runtime);
    expect(first.mode).toBe('DIRECT_PROVIDER_ACCOUNT'); expect(later.mode).toBe('CONTRACT_OR_DELEGATED_PROVIDER');
    expect(first.currentAccountType).toBe('NOT_CHECKED'); expect(later.beneficialOwner).toBe('UNKNOWN');
    expect(JSON.stringify(later)).not.toContain(runtime);
  });
  it('persists failure-safe diagnostics on null, reorg and quota without retry or raw error content', async () => {
    const root = pathToFileURL(temp() + '/'), provider = '0x' + '12'.repeat(20), hash = '0x' + 'ab'.repeat(32), header = { number: '0x64', hash, timestamp: '0x1' };
    await expect(collectProviderEvidence(provider, '100', hash, root, async m => m === 'eth_getCode' ? null : header)).rejects.toThrow('ACCOUNT_TYPE_UNCONFIRMED');
    expect(read(path.join(root.pathname, 'provider-account.json'))).toMatchObject({ status: 'ACCOUNT_TYPE_UNCONFIRMED', reason: 'NULL_RESPONSE' });
    let calls = 0;
    await expect(collectProviderEvidence(provider, '100', hash, root, async () => { calls++; throw new RpcFailure('rate', 429); })).rejects.toThrow('429');
    expect(calls).toBe(1); expect(read(path.join(root.pathname, 'provider-account.json')).reason).toBe('RPC_RATE');
    let headers = 0;
    await expect(collectProviderEvidence(provider, '100', hash, root, async m => m === 'eth_getCode' ? '0x' : { ...header, hash: ++headers === 2 ? '0x' + 'cd'.repeat(32) : hash })).rejects.toThrow('canonical');
    expect(read(path.join(root.pathname, 'provider-account.json')).status).toBe('ACCOUNT_TYPE_UNCONFIRMED');
  });
  it('does not use a new proof protocol to reset an unexpired legacy reservation', () => {
    const c = context(), { providerVerificationVersion: _v, ...legacy } = c, id = '0xa598e2658ef74196f498b00b289a7d5d64a42cd7:615031639178913965778603';
    // Compare to the real consumed reservation, not just a self-generated key.
    expect(jobKey(id, legacy)).toBe(read('fixtures/research/stage7-fifth-pilot-failure.json').jobKey);
    const now = new Date('2026-11-02T12:12:24Z'), state = reserveBudgetedRun({ schema: 1, reservations: [] }, '123', jobKey(id, legacy), usagePolicy(), 31, 0, 'analysis', now);
    expect(jobKey(id, c)).not.toBe(jobKey(id, legacy));
    expect(() => refuseActiveLegacyJob(state, id, c, now.getTime())).toThrow('cannot reset');
    expect(() => refuseActiveLegacyJob(state, id, c, now.getTime() + 86400001)).not.toThrow();
    expect(state.reservations[0].requests).toBe(31);
  });
});
it('retains every real saved share/receipt/withdrawal/quote check under provider-level analysis (synthetic account-code overlay)', async () => {
  // Actual existing LP financial fixtures; synthetic contract-code response at
  // that provider. This tests policy separation, NEVER new blockchain evidence.
  const folder = temp(); cpSync('fixtures/positions/632f7d8c3d6ef54f', folder, { recursive: true });
  const root = pathToFileURL(folder + '/'), config = read(path.join(folder, 'config.json')), h = historyInputs();
  const provider = config.id.split(':')[0], block = config.funding[0].block;
  const states = read(path.join(folder, 'states.json')), state = states.find((s: any) => s.block === block);
  const identity = await collectProviderEvidence(provider, block, state.blockHash, root, async m => m === 'eth_getCode' ? runtime : { number: '0x' + BigInt(block).toString(16), hash: state.blockHash, timestamp: state.timestamp });
  delete config.ownerCode; Object.assign(config, { schema: 2, analyticsScope: 'PROVIDER_POSITION_ONLY', beneficialOwner: 'UNKNOWN', providerVerificationVersion: providerVerificationVersion() });
  const save = (name: string, value: unknown) => writeFileSync(path.join(folder, name), JSON.stringify(value)); save('config.json', config);
  const verified = verifyReplayPosition(config.slug, root);
  expect(verified.verification).toMatchObject({ status: 'VERIFIED', swaps: 9, storageComparisons: 6000, withdrawalChecks: 12, tolerance: '0', final: ['0', '0'] });
  expect(verified.providerIdentity).toEqual(identity); expect(identity.beneficialOwner).toBe('UNKNOWN');
  expect(() => verifyReplayPosition('632f7d8c3d6ef54f', undefined, providerVerificationVersion())).toThrow('legacy');
  // Fake claims and cross-block account evidence never reach financial promotion.
  save('config.json', { ...config, beneficialOwner: provider }); expect(() => verifyReplayPosition(config.slug, root)).toThrow(); save('config.json', config);
  expect(() => verifyProviderEvidence(root, provider, String(BigInt(block) + 1n), h.logs, state)).toThrow();
  const evidence = read(path.join(folder, 'provider-account.json'));
  save('provider-account.json', { ...evidence, identity: { ...evidence.identity, codeHash: '0x' + 'ab'.repeat(32) } });
  expect(() => verifyProviderEvidence(root, provider, block, h.logs, state)).toThrow('identity'); save('provider-account.json', evidence);
  const missing = structuredClone(states); delete missing.find((s: any) => s.withdrawal).withdrawal; save('states.json', missing);
  expect(() => verifyReplayPosition(config.slug, root)).toThrow('withdrawal'); save('states.json', states);
  const marks = read(path.join(folder, 'marks.json')); save('marks.json', marks.slice(1)); expect(() => verifyReplayPosition(config.slug, root)).toThrow();
}, 120000);
