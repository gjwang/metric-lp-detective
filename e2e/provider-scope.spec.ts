import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
test('unverified provider shows account uncertainty and genuine old failure without claiming a running job', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByLabel('START WITH A PUBLIC WALLET').fill('0xa598e2658ef74196f498b00b289a7d5d64a42cd7');
  await page.getByRole('button', { name: 'Find positions', exact: true }).click();
  await page.getByRole('button', { name: /salt 615031639178913965778603/ }).click();
  await expect(page.getByTestId('provider-scope-explanation')).toContainText('Beneficial owner unknown');
  await expect(page.getByTestId('previous-owner-run')).toContainText('stopped after 4 reads');
  await expect(page.getByTestId('previous-owner-run')).toContainText('not a running job');
  await expect(page.getByRole('link', { name: 'previous owner run' })).toHaveAttribute('href', 'https://github.com/projectuwb/metric-lp-detective/actions/runs/41442682018');
  await expect(page.getByRole('button', { name: 'Play replay' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('contract/delegation scope is visible and never presented as a controlling wallet (synthetic metadata UI vector)', async ({ page }) => {
  // This mocks ONLY presentation, using an existing verified sample; no new
  // account classification, sample registration or chain proof is created.
  const meta = JSON.parse(readFileSync('.web-data/632f7d8c3d6ef54f/metadata.json', 'utf8'));
  await page.route('**/api/replay?id=*', async route => route.fulfill({ json: { ...meta, providerIdentity: { scope: 'PROVIDER_POSITION_ONLY', mode: 'CONTRACT_OR_DELEGATED_PROVIDER', form: 'EIP_7702_DELEGATION_MARKER', provider: meta.id.split(':')[0], block: meta.funding[0].block, blockHash: '0x' + 'ab'.repeat(32), timestamp: '0x1', codeHash: '0x' + 'cd'.repeat(32), codeBytes: 23, delegationTarget: '0x' + '12'.repeat(20), beneficialOwner: 'UNKNOWN', currentAccountType: 'NOT_CHECKED' } } }));
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await page.getByRole('button', { name: /Try the smaller sample/ }).click();
  const scope = page.getByLabel('Provider-level attribution'); await expect(scope).toContainText('beneficial owner unknown');
  await expect(scope).toContainText('code-delegation marker'); await expect(scope).toContainText('does not prove a controller can initiate a withdrawal');
  await expect(page.getByRole('heading', { name: 'Provider tokens were withdrawn. Here’s the result.' })).toBeVisible();
  await expect(page.getByTestId('outcome-net')).toHaveText('-1.812248');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
