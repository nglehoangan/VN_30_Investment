/** Resolve a sub-account from API 2.1 for this request. Never persist account numbers. */
export async function resolveSubAccount(request, custody, type = 'NORMAL') {
  if (!['NORMAL', 'MARGIN', 'DERIVATIVE'].includes(type)) throw new Error('INVALID_ACCOUNT_TYPE');
  const profile = await request('GET', `/eros/v2/get-profile/by-username/${encodeURIComponent(custody)}`,
    { fields: 'basicInfo,bankSubAccounts' });
  if (!profile.ok) throw new Error('PROFILE_HTTP_ERROR');
  const identity = profile.data?.basicInfo?.code105C ?? profile.data?.basicInfo?.custodyCode;
  if (identity !== custody) throw new Error('PROFILE_CUSTODY_MISMATCH');
  const accounts = profile.data?.bankSubAccounts;
  if (!Array.isArray(accounts)) throw new Error('PROFILE_SCHEMA_UNCONFIRMED');
  const matches = accounts.filter(a => a.accountType === type && a.status === '1' &&
    typeof a.accountNo === 'string' && a.accountNo.trim() === a.accountNo && a.accountNo.length > 0);
  if (matches.length !== 1) throw new Error(matches.length ? 'AMBIGUOUS_SUB_ACCOUNT' : 'ACTIVE_SUB_ACCOUNT_NOT_FOUND');
  return matches[0].accountNo;
}
