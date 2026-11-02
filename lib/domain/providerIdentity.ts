// Public facts about one provider address at one historical block, not its controller.
export interface ProviderIdentity {
  scope: 'PROVIDER_POSITION_ONLY';
  mode: 'DIRECT_PROVIDER_ACCOUNT' | 'CONTRACT_OR_DELEGATED_PROVIDER';
  form: 'EMPTY_CODE' | 'NONEMPTY_CODE_PROXY_STATUS_UNKNOWN' | 'EIP_7702_DELEGATION_MARKER';
  provider: string; block: string; blockHash: string; timestamp: string;
  codeHash: string; codeBytes: number; delegationTarget?: string;
  beneficialOwner: 'UNKNOWN'; currentAccountType: 'NOT_CHECKED';
}
