// Server/owner only. Canonical, bounded account evidence; never a controller proof.
import { keccak256, type Hex } from 'viem';
import { gzipSync, gunzipSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import type { ProviderIdentity } from '../domain/providerIdentity';
import type { Rpc, RawLog } from '../chain/rpc';
import { RpcFailure } from '../chain/rpc';
import { atomicJson, AnalysisLimit } from './store';
import { fileURLToPath } from 'node:url';
export const ACCOUNT_SCOPE = 'PROVIDER_POSITION_ONLY' as const;
export const MAX_PROVIDER_CODE_BYTES = 24576;
export function classifyProviderCode(value: unknown) {
  if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) return { status: 'ACCOUNT_TYPE_UNCONFIRMED' as const, reason: value === null ? 'NULL_RESPONSE' : typeof value !== 'string' ? 'NON_STRING_RESPONSE' : 'MALFORMED_CODE' };
  const code = value.toLowerCase() as Hex, bytes = (code.length - 2) / 2;
  if (bytes > MAX_PROVIDER_CODE_BYTES) return { status: 'ACCOUNT_TYPE_UNCONFIRMED' as const, reason: 'CODE_SIZE_LIMIT' };
  return { status: 'OBSERVED' as const, code, codeHash: keccak256(code), codeBytes: bytes,
    mode: bytes === 0 ? 'DIRECT_PROVIDER_ACCOUNT' as const : 'CONTRACT_OR_DELEGATED_PROVIDER' as const,
    form: bytes === 0 ? 'EMPTY_CODE' as const : bytes === 23 && code.startsWith('0xef0100') ? 'EIP_7702_DELEGATION_MARKER' as const : 'NONEMPTY_CODE_PROXY_STATUS_UNKNOWN' as const,
    ...(bytes === 23 && code.startsWith('0xef0100') ? { delegationTarget: '0x' + code.slice(8) } : {}) };
}
const hash = (v: unknown) => typeof v === 'string' && /^0x[0-9a-f]{64}$/i.test(v);
function checkedHeader(value: any, block: string, expectedHash: string) {
  if (!value || typeof value.number !== 'string' || !/^0x[0-9a-f]+$/i.test(value.number) || BigInt(value.number) !== BigInt(block) || !hash(value.hash) || value.hash !== expectedHash || typeof value.timestamp !== 'string' || !/^0x[0-9a-f]+$/i.test(value.timestamp)) throw new Error('Account observation header is not canonical');
  return { number: value.number, hash: value.hash, timestamp: value.timestamp };
}
export async function collectProviderEvidence(provider: string, block: string, expectedHash: string, root: URL, rpc: Rpc) {
  const tag = '0x' + BigInt(block).toString(16), request = { method: 'eth_getCode', params: [provider, tag] };
  const save = (value: unknown) => atomicJson(fileURLToPath(new URL('provider-account.json', root)), value);
  const pending = { schema: 1, status: 'ACCOUNT_TYPE_UNCONFIRMED', scope: ACCOUNT_SCOPE, provider, block, expectedHash, request, beneficialOwner: 'UNKNOWN', currentAccountType: 'NOT_CHECKED' };
  save({ ...pending, reason: 'OBSERVATION_NOT_COMPLETE' });
  try {
    const before = checkedHeader(await rpc('eth_getBlockByNumber', [tag, false]), block, expectedHash);
    const value = await rpc('eth_getCode', request.params), parsed = classifyProviderCode(value);
    const after = checkedHeader(await rpc('eth_getBlockByNumber', [tag, false]), block, expectedHash);
    if (before.timestamp !== after.timestamp) throw new Error('Account observation timestamp changed');
    if (parsed.status !== 'OBSERVED') { save({ ...pending, reason: parsed.reason, before, after }); throw new AnalysisLimit('UNSUPPORTED', 'ACCOUNT_TYPE_UNCONFIRMED: historical code response is invalid or outside safe limits', 'eth_getCode'); }
    const { code, status: _status, ...facts } = parsed;
    const identity: ProviderIdentity = { scope: ACCOUNT_SCOPE, provider, block, blockHash: expectedHash, timestamp: before.timestamp, ...facts, beneficialOwner: 'UNKNOWN', currentAccountType: 'NOT_CHECKED' };
    // Public bytecode retained compressed and bounded, never dumped to logs/browser.
    writeFileSync(new URL('provider-code.json.gz', root), gzipSync(JSON.stringify({ provider, block, code })), { mode: 0o600 });
    save({ schema: 1, status: 'OBSERVED', identity, request, before, after });
    return identity;
  } catch (e) {
    if (!(e instanceof AnalysisLimit)) save({ ...pending, reason: e instanceof RpcFailure ? 'RPC_' + e.kind.toUpperCase() : 'CANONICAL_OBSERVATION_FAILED' });
    throw e;
  }
}
export function verifyProviderEvidence(root: URL, provider: string, block: string, logs: RawLog[], state: any): ProviderIdentity {
  const evidence = JSON.parse(readFileSync(new URL('provider-account.json', root), 'utf8'));
  if (evidence.schema !== 1 || evidence.status !== 'OBSERVED') throw new Error('ACCOUNT_TYPE_UNCONFIRMED: complete canonical observation required');
  if (Object.keys(evidence).sort().join(',') !== 'after,before,identity,request,schema,status') throw new Error('Unexpected account evidence or ownership claims');
  const logHashes = new Set(logs.filter(l => BigInt(l.blockNumber) === BigInt(block)).map(l => l.blockHash));
  if (logHashes.size !== 1 || !state || !logHashes.has(state.blockHash)) throw new Error('Provider code/source checkpoint mismatch');
  const before = checkedHeader(evidence.before, block, state.blockHash), after = checkedHeader(evidence.after, block, state.blockHash);
  if (before.timestamp !== after.timestamp || before.timestamp !== state.timestamp) throw new Error('Provider code timestamp mismatch');
  const raw = JSON.parse(gunzipSync(readFileSync(new URL('provider-code.json.gz', root)), { maxOutputLength: MAX_PROVIDER_CODE_BYTES * 2 + 1024 }).toString());
  if (Object.keys(raw).sort().join(',') !== 'block,code,provider') throw new Error('Unexpected raw account evidence fields');
  if (raw.provider !== provider || raw.block !== block) throw new Error('Provider code belongs to another account/block');
  const parsed = classifyProviderCode(raw.code); if (parsed.status !== 'OBSERVED') throw new Error('ACCOUNT_TYPE_UNCONFIRMED: invalid retained code');
  const { code: _code, status: _status, ...facts } = parsed;
  const expected: ProviderIdentity = { scope: ACCOUNT_SCOPE, provider, block, blockHash: state.blockHash, timestamp: before.timestamp, ...facts, beneficialOwner: 'UNKNOWN', currentAccountType: 'NOT_CHECKED' };
  if (JSON.stringify(evidence.request) !== JSON.stringify({ method: 'eth_getCode', params: [provider, '0x' + BigInt(block).toString(16)] }) || JSON.stringify(evidence.identity) !== JSON.stringify(expected)) throw new Error('Provider identity/ownership claim differs from canonical code evidence');
  return expected;
}
