import type { ProviderIdentity } from '../lib/domain/providerIdentity';
export default function ProviderScope({ identity }: { identity: ProviderIdentity }) {
  return <section className="notice provider-scope" aria-label="Provider-level attribution">
    <strong>Provider-level LP analysis · beneficial owner unknown</strong>
    <p>{identity.mode === 'DIRECT_PROVIDER_ACCOUNT' ? 'Empty historical code was observed' : identity.form === 'EIP_7702_DELEGATION_MARKER' ? 'A code-delegation marker was observed' : 'Nonempty historical code was observed; contract or proxy implementation is unclassified'} at <a href={'https://bscscan.com/block/' + identity.block} target="_blank" rel="noreferrer">block {identity.block}</a>. Current account type is not checked.</p>
    <p>Inventory and LP cashflows are attributed to provider <code>{identity.provider}</code> and this salt. Contributions may be funded by another address; withdrawals go to the provider. Underlying-user payouts and controller identity are not inferred. The pool withdrawal simulation checks entitlement under that provider caller; it does not prove a controller can initiate a withdrawal.</p>
    <details><summary>Historical account evidence</summary><p>{identity.codeBytes} code bytes · code hash <code>{identity.codeHash}</code>. {identity.delegationTarget && <>Delegation code target: <code>{identity.delegationTarget}</code>; this is not an owner identity.</>}</p></details>
  </section>;
}
