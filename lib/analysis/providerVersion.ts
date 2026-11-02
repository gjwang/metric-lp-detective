import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { accountingVersion } from './version';
// New proof protocol is separate from the immutable legacy financial verifier.
export function providerVerificationVersion() {
  const h = createHash('sha256').update(accountingVersion());
  for (const f of ['scripts/verify-provider-position.ts', 'scripts/verify-replay-position.ts', 'lib/analysis/providerEvidence.ts', 'lib/domain/providerIdentity.ts']) h.update(readFileSync(f));
  return h.digest('hex');
}
