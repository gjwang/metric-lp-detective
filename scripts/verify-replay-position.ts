import { readFileSync } from 'node:fs';
import { verifyPosition } from './verify-position';
import { verifyProviderPosition } from './verify-provider-position';
export function verifyReplayPosition(slug: string, capturedRoot?: URL, requiredProviderVersion?: string) {
  if (!/^[a-f0-9]{16}$/.test(slug)) throw new Error('Invalid artifact identifier');
  const root = capturedRoot ?? new URL('../fixtures/positions/' + slug + '/', import.meta.url);
  const config = JSON.parse(readFileSync(new URL('config.json', root), 'utf8'));
  if (requiredProviderVersion && (config.schema !== 2 || config.providerVerificationVersion !== requiredProviderVersion)) throw new Error('Fresh provider job cannot fall back to a legacy proof or another verification version');
  if (config.schema === 2) return verifyProviderPosition(slug, root);
  if (config.schema !== undefined && config.schema !== 1) throw new Error('Unsupported proof schema');
  return { ...verifyPosition(slug, root), providerIdentity: null };
}
if (process.argv[1]?.endsWith('verify-replay-position.ts')) {
  try { console.log(JSON.stringify(verifyReplayPosition(process.argv[2] ?? '').verification)); }
  catch { console.error('Position NOT VERIFIED: independent proof validation failed; no artifact changed.'); process.exitCode = 1; }
}
