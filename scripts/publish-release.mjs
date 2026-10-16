import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const owner = 'lynnliuyu', repo = 'fmkj-ai-copilot';
const manifest = JSON.parse(await readFile(new URL('../release-manifest.json', import.meta.url)));
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is required');
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.status === 404 && method === 'GET') return null;
  if (!response.ok) throw new Error(`GitHub ${method} ${path}: ${response.status}`);
  return response.status === 204 ? null : response.json();
}
const files = [];
for (const asset of manifest.assets) {
  const url = new URL(asset.url);
  if (url.protocol !== 'https:' || url.hostname !== 'copilot.fmkj.top' || !url.pathname.startsWith('/download/') || !/^[\w.-]+$/.test(asset.name)) throw new Error('Invalid public asset URL/name');
  const response = await fetch(url, { redirect: 'error' });
  if (!response.ok) throw new Error(`Download ${asset.name}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== asset.sha256 || bytes.length !== asset.bytes) throw new Error(`Asset identity mismatch: ${asset.name}`);
  files.push({ ...asset, bytes });
}
const checksums = Buffer.from(manifest.assets.map(a => `${a.sha256}  ${a.name}`).join('\n') + '\n');
files.push({ name: 'SHA256SUMS.txt', bytes: checksums, sha256: createHash('sha256').update(checksums).digest('hex') });
let release = await api(`/releases/tags/${encodeURIComponent(manifest.tag)}`);
if (!release) release = await api('/releases', 'POST', { tag_name: manifest.tag, target_commitish: process.env.GITHUB_SHA || 'main', name: manifest.title, body: manifest.notes, prerelease: true, draft: true });
for (const file of files) {
  const existing = release.assets.find(a => a.name === file.name);
  if (existing) {
    if (existing.digest !== `sha256:${file.sha256}`) throw new Error(`Existing asset differs: ${file.name}`);
    continue;
  }
  const response = await fetch(`${release.upload_url.split('{')[0]}?name=${encodeURIComponent(file.name)}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/octet-stream' }, body: file.bytes });
  if (!response.ok) throw new Error(`Upload ${file.name}: ${response.status}`);
  const uploaded = await response.json();
  if (uploaded.size !== file.bytes.length || uploaded.digest !== `sha256:${file.sha256}`) throw new Error(`Upload identity mismatch: ${file.name}`);
}
release = await api(`/releases/${release.id}`, 'PATCH', { name: manifest.title, body: manifest.notes, draft: false, prerelease: true });
console.log(`Published ${release.html_url}`);
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `Release verified: ${release.html_url}\n`, { flag: 'a' });
