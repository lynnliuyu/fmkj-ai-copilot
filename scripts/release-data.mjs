import { createHash } from 'node:crypto';

const site = 'https://app.fmkj.top';
const github = 'https://github.com/lynnliuyu/fmkj-ai-copilot';
const versionPattern = /^\d+\.\d+\.\d+$/;
const hashPattern = /^[a-f0-9]{64}$/;

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function packageIdentity(asset) {
  requireValue(asset && Number.isSafeInteger(asset.bytes) && asset.bytes > 0 && asset.bytes <= 256 * 1024 * 1024, 'Invalid package size');
  requireValue(hashPattern.test(asset.sha256), 'Invalid package SHA256');
  const url = new URL(asset.url);
  requireValue(url.origin === site && !url.username && !url.password && !url.search && !url.hash &&
    url.pathname === `/downloads/${asset.name}`, 'Invalid public asset URL/name');
}

export function validateManifest(manifest) {
  requireValue(manifest?.schemaVersion === 2, 'Expected current-site release manifest schema 2');
  const version = manifest.windowsVersion;
  requireValue(versionPattern.test(version) && manifest.macVersion === version, 'Windows/Mac release versions must match');
  requireValue(manifest.windowsBundledUi === version && manifest.macBundledUi === version && manifest.uiUpdateVersion === null,
    'Current interface is delivered inside the complete installers');
  requireValue(manifest.tag === `v${version}` && /^[a-f0-9]{40}$/.test(manifest.sourceCommit), 'Invalid release/source identity');
  requireValue(typeof manifest.publishedAt === 'string' && Number.isFinite(Date.parse(manifest.publishedAt)), 'Invalid publication date');
  requireValue(manifest.updater?.mode === 'download-only' && versionPattern.test(manifest.updater.windowsVersion), 'Expected explicit download-only updater status');
  requireValue(Array.isArray(manifest.assets) && manifest.assets.length === 2, 'Expected exactly the Windows installer and universal Mac DMG');
  const expected = new Map([
    ['windows-setup', `FMKJ-Copilot_${version}_x64-setup.exe`],
    ['macos-universal', `FMKJ-Copilot_${version}_universal.dmg`],
  ]);
  for (const asset of manifest.assets) {
    requireValue(expected.get(asset.platform) === asset.name, 'Unexpected or duplicate package platform/name');
    expected.delete(asset.platform);
    packageIdentity(asset);
  }
  requireValue(expected.size === 0, 'Missing release platform');
  requireValue(typeof manifest.title === 'string' && manifest.title.length > 0 && typeof manifest.notes === 'string' && manifest.notes.length > 0,
    'Release title and notes are required');
  return manifest;
}

export function createManifest(delivery) {
  requireValue(delivery?.schemaVersion === 1 && versionPattern.test(delivery.version), 'Invalid published-delivery schema/version');
  requireValue(delivery.mac?.architecture === 'universal' && delivery.mac.minimumSystemVersion === '13.0' &&
    delivery.mac.signing === 'ad-hoc' && delivery.mac.notarized === false, 'Mac package properties differ from the verified release');
  const version = delivery.version;
  const manifest = {
    schemaVersion: 2,
    tag: `v${version}`,
    title: `繁梦Ai Copilot ${version} · 基础版 / 高级版`,
    windowsVersion: version,
    windowsBundledUi: version,
    macVersion: version,
    macBundledUi: version,
    uiUpdateVersion: null,
    sourceCommit: delivery.sourceCommit,
    publishedAt: delivery.publishedAt,
    updater: { mode: delivery.updater?.mode, windowsVersion: delivery.updater?.windowsVersion },
    notes: `新增基础版与高级版切换，同一个客户端可按需选择。基础版无需繁梦登录，提供工具版本、安装/更新、汉化、官方授权和清除配置，保留顶部反馈与原有信息轮播。高级版保留账户及配置功能。\n\n基础版采用紧凑黑白界面；Windows 与 macOS 使用各自的窗口顶部栏。macOS 通用包支持 Apple Silicon 和 Intel，要求 macOS 13+，采用 ad-hoc 完整性签名，未经 Apple Developer ID 签名或公证；Mac 版不提供 Codex 界面汉化。\n\n本次通过完整安装包交付，不提升自动更新清单；Windows 自动更新仍为 ${delivery.updater?.windowsVersion}。Windows 11 实机安装/升级尚未验收。历史版本与更新源保留。\n\n官方下载：${site}/download\n源码快照：${delivery.sourceCommit}\n校验值见本 Release 的 SHA256SUMS.txt。`,
    assets: [
      { platform: 'windows-setup', name: delivery.windows?.file, url: `${site}/downloads/${delivery.windows?.file}`, bytes: delivery.windows?.size, sha256: delivery.windows?.sha256 },
      { platform: 'macos-universal', name: delivery.mac?.file, url: `${site}/downloads/${delivery.mac?.file}`, bytes: delivery.mac?.size, sha256: delivery.mac?.sha256 },
    ],
  };
  return validateManifest(manifest);
}

export async function verifyPublicAssets(manifest, fetchImpl = fetch) {
  validateManifest(manifest);
  return Promise.all(manifest.assets.map(async asset => {
    const response = await fetchImpl(asset.url, { redirect: 'error', signal: AbortSignal.timeout(300_000) });
    if (!response.ok) throw new Error(`Download ${asset.name}: ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    const sha256 = createHash('sha256').update(body).digest('hex');
    if (sha256 !== asset.sha256 || body.length !== asset.bytes) throw new Error(`Asset identity mismatch: ${asset.name}`);
    return { ...asset, body };
  }));
}

export function renderReadmeSection(manifest) {
  validateManifest(manifest);
  const windows = manifest.assets.find(asset => asset.platform === 'windows-setup');
  const mac = manifest.assets.find(asset => asset.platform === 'macos-universal');
  return `<!-- release-sync:start -->\n| 下载 | 客户端版本 | 内置界面 |\n|---|---|---|\n| [Windows x64 安装版](${windows.url}) | ${manifest.windowsVersion} | ${manifest.windowsBundledUi} |\n| [macOS Apple Silicon / Intel 通用版](${mac.url}) | ${manifest.macVersion} | ${manifest.macBundledUi} |\n\n本次界面随完整安装包交付。**自动更新清单未升级，Windows 自动更新仍为 ${manifest.updater.windowsVersion}**；请下载对应系统的完整安装包更新。Mac 包未经 Apple 公证。\n\n[本次发布记录与安装包](${github}/releases/tag/${manifest.tag}) · [所有发布记录](${github}/releases)\n<!-- release-sync:end -->`;
}
