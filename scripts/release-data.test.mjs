import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createManifest, renderReadmeSection, validateManifest, verifyPublicAssets } from './release-data.mjs';

const body = Buffer.from('verified test package');
const sha256 = createHash('sha256').update(body).digest('hex');
function delivery() {
  return { schemaVersion: 1, version: '0.1.197', sourceCommit: 'a'.repeat(40), publishedAt: '2026-10-30T10:00:00Z',
    windows: { file: 'FMKJ-Copilot_0.1.197_x64-setup.exe', size: body.length, sha256 },
    mac: { file: 'FMKJ-Copilot_0.1.197_universal.dmg', size: body.length, sha256, architecture: 'universal', minimumSystemVersion: '13.0', signing: 'ad-hoc', notarized: false },
    updater: { mode: 'download-only', windowsVersion: '0.1.194' } };
}

test('delivery names both real platforms and distinguishes bundled UI from unchanged updater', () => {
  const manifest = createManifest(delivery());
  const section = renderReadmeSection(manifest);
  assert.equal(manifest.assets.length, 2);
  assert.equal(manifest.uiUpdateVersion, null);
  assert.match(section, /Apple Silicon \/ Intel/);
  assert.match(section, /自动更新仍为 0\.1\.194/);
  assert.doesNotMatch(section, /standalone|免安装版|copilot\.fmkj\.top/);
});

test('rejects stale package identities, duplicate platforms and unsafe public destinations before download', () => {
  const stale = delivery(); stale.mac.file = 'FMKJ-Copilot_0.1.196_universal.dmg';
  assert.throws(() => createManifest(stale), /platform\/name/);
  for (const url of ['https://copilot.fmkj.top/download/package.exe', 'https://app.fmkj.top.evil.test/downloads/package.exe',
    'https://app.fmkj.top/downloads/FM KJ.exe', 'https://app.fmkj.top/downloads/FMKJ-Copilot_0.1.197_x64-setup.exe?token=secret']) {
    const manifest = createManifest(delivery()); manifest.assets[0].url = url;
    assert.throws(() => validateManifest(manifest), /URL\/name/);
  }
  const duplicate = createManifest(delivery()); duplicate.assets[1] = duplicate.assets[0];
  assert.throws(() => validateManifest(duplicate), /platform\/name/);
});

test('public download verification requires exact bytes and SHA256 and forbids redirects', async () => {
  const manifest = createManifest(delivery());
  const files = await verifyPublicAssets(manifest, async (_url, options) => {
    assert.equal(options.redirect, 'error');
    return new Response(body);
  });
  assert.equal(files.length, 2);
  await assert.rejects(verifyPublicAssets(manifest, async () => new Response(Buffer.from('different bytes'))), /identity mismatch/);
  await assert.rejects(verifyPublicAssets(manifest, async () => new Response('missing', { status: 404 })), /404/);
});

test('incomplete publication metadata cannot be promoted or imply Apple notarization', () => {
  const input = delivery(); delete input.sourceCommit;
  assert.throws(() => createManifest(input), /release\/source/);
  input.sourceCommit = 'a'.repeat(40); input.mac.notarized = true;
  assert.throws(() => createManifest(input), /Mac package properties/);
  input.mac.notarized = false; input.updater.mode = 'automatic';
  assert.throws(() => createManifest(input), /download-only/);
});
