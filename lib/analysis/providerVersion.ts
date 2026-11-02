import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { accountingVersion } from './version';
// New proof protocol is separate from the immutable legacy financial verifier.
export function providerVerificationVersion() {
  const h = createHash('sha256').update(accountingVersion());
  // Pin immutable v1 rules, not the dispatcher: adding a future v2 route must
  // not invalidate a published v1 proof. Future protocols retain these files.
  for (const f of ['scripts/verify-provider-position.ts', 'lib/analysis/providerEvidence.ts', 'lib/analysis/providerVersion.ts', 'lib/domain/providerIdentity.ts']) h.update(readFileSync(f));
  return h.digest('hex');
}
