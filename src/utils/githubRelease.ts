import { isAndroid, isTauri } from './platform';

export const GITHUB_REPO = 'wazyf-cell/shuati';
export const RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases`;
export const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface ReleaseAsset {
  name: string;
  url: string;
  size: number;
  digest?: string | null;
}

export interface LatestRelease {
  tag: string;
  version: string;
  name: string;
  notes: string;
  htmlUrl: string;
  publishedAt: string;
  assets: ReleaseAsset[];
}

type AssetKind = 'setup' | 'portable' | 'apk' | 'checksums';

export function normalizeVersion(tag: string): string {
  return tag.trim().replace(/^v/i, '');
}

export function isSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export function compareVersions(a: string, b: string): number {
  const pa = normalizeVersion(a).split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = normalizeVersion(b).split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

export function parseReleaseNotes(body: string): string[] {
  const lines = (body || '').replace(/\r\n/g, '\n').split('\n');
  const items: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (items.length && /^#{1,6}\s/.test(line)) break;
    if (/^[-*•]\s+/.test(line)) {
      const item = line.replace(/^[-*•]\s+/, '').trim();
      if (item) items.push(item);
    }
  }
  if (items.length) return items;
  return lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line !== '---')
    .slice(0, 20);
}

export function pickAsset(release: LatestRelease, kind: AssetKind): ReleaseAsset | undefined {
  const assets = release.assets || [];
  if (kind === 'checksums') {
    return assets.find((a) => a.name.toLowerCase() === 'sha256sums.txt');
  }
  if (kind === 'portable') {
    return assets.find((a) => a.name.toLowerCase() === 'shuati.exe');
  }
  if (kind === 'apk') {
    const apks = assets.filter((a) => /\.apk$/i.test(a.name));
    return apks.find((a) => a.name.toLowerCase().includes(release.version)) || apks[0];
  }
  const setups = assets.filter((a) => /^shuati_.+_x64-setup\.exe$/i.test(a.name));
  return setups.find((a) => a.name.includes(release.version)) || setups[0];
}

export function parseChecksums(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of text.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^([0-9a-fA-F]{64})\s+\*?(.+)$/);
    if (!match) continue;
    const name = match[2].trim().replace(/^\.\//, '').toLowerCase();
    result[name] = match[1].toLowerCase();
  }
  return result;
}

export function checksumFor(checksums: Record<string, string>, asset: ReleaseAsset): string | undefined {
  return checksums[asset.name.toLowerCase()];
}

function toLatestRelease(data: any): LatestRelease {
  const version = normalizeVersion(String(data.tag_name || data.name || ''));
  if (!isSemver(version)) {
    throw new Error('最新 Release 的版本号不是 x.y.z 格式');
  }
  return {
    tag: String(data.tag_name || ''),
    version,
    name: String(data.name || data.tag_name || ''),
    notes: String(data.body || ''),
    htmlUrl: String(data.html_url || RELEASES_PAGE),
    publishedAt: String(data.published_at || ''),
    assets: Array.isArray(data.assets)
      ? data.assets.map((a: any) => ({
          name: String(a.name || ''),
          url: String(a.browser_download_url || ''),
          size: Number(a.size || 0),
          digest: a.digest ?? null,
        }))
      : [],
  };
}

export async function fetchLatestRelease(): Promise<LatestRelease> {
  let text: string;
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core');
    text = await invoke<string>('fetch_latest_release');
  } else {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(LATEST_RELEASE_API, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal,
      });
      if (res.status === 404) throw new Error('还没有发布任何 Release');
      if (res.status === 403) throw new Error('GitHub API 请求过于频繁，请稍后重试');
      if (!res.ok) throw new Error(`GitHub 返回 HTTP ${res.status}`);
      text = await res.text();
    } finally {
      window.clearTimeout(timer);
    }
  }
  return toLatestRelease(JSON.parse(text));
}

export async function fetchText(url: string): Promise<string> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string>('fetch_text', { url });
  }
  if (isAndroid) {
    const { CapacitorHttp } = await import('@capacitor/core');
    const res = await CapacitorHttp.get({
      url,
      responseType: 'text',
      headers: { Accept: 'text/plain,*/*' },
      connectTimeout: 12000,
      readTimeout: 12000,
    });
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`下载校验文件失败: HTTP ${res.status}`);
    }
    return String(res.data ?? '');
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`下载校验文件失败: HTTP ${res.status}`);
  return res.text();
}

export async function fetchChecksums(release: LatestRelease): Promise<Record<string, string>> {
  const asset = pickAsset(release, 'checksums');
  if (!asset) throw new Error('该 Release 没有 SHA256SUMS.txt，无法自动更新');
  return parseChecksums(await fetchText(asset.url));
}
