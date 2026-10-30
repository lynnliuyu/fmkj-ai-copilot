import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createManifest, renderReadmeSection, verifyPublicAssets } from './release-data.mjs';

// Input is produced only after the real download-site packages are published and read back.
// Local candidates cannot be synced: both immutable public URLs are downloaded and verified again.
const source = process.argv.slice(2).find(arg => !arg.startsWith('--'));
if (!source) throw new Error('Usage: node scripts/sync-public-release.mjs <published-delivery.json> [--check]');
const check = process.argv.includes('--check');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).trim();
if (!/github\.com[:/]lynnliuyu\/fmkj-ai-copilot(?:\.git)?$/.test(remote)) throw new Error('Unexpected showcase repository');
const manifest = createManifest(JSON.parse(await readFile(resolve(source), 'utf8')));
await verifyPublicAssets(manifest);
const readmePath = join(root, 'README.md');
const readme = await readFile(readmePath, 'utf8');
if (!readme.includes('<!-- release-sync:start -->') || !readme.includes('<!-- release-sync:end -->')) throw new Error('README release markers missing');
const nextReadme = readme.replace(/<!-- release-sync:start -->[\s\S]*?<!-- release-sync:end -->/, renderReadmeSection(manifest));
for (const [name, content] of [['release-manifest.json', JSON.stringify(manifest, null, 2) + '\n'], ['README.md', nextReadme]]) {
  if (check) {
    if (await readFile(join(root, name), 'utf8') !== content) throw new Error(`Showcase stale: ${name}`);
  } else await writeFile(join(root, name), content);
}
console.log(`${check ? 'Verified' : 'Prepared'} ${manifest.tag}; both public packages match their published sizes and SHA256. Verify the Sync public release workflow after publishing showcase changes.`);
