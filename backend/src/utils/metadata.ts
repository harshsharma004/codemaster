export const platforms = {
  leetCode: 'leetcode',
  codeforces: 'codeforces',
  codeChef: 'codechef',
  atCoder: 'atcoder',
  hackerRank: 'hackerrank',
  topCoder: 'topcoder',
  geeksForGeeks: 'geeksforgeeks',
  coder: 'coder',
};

const supportedHosts: Record<string, string> = {
  'leetcode.com': platforms.leetCode,
  'www.leetcode.com': platforms.leetCode,
  'codeforces.com': platforms.codeforces,
  'www.codeforces.com': platforms.codeforces,
  'codechef.com': platforms.codeChef,
  'www.codechef.com': platforms.codeChef,
  'atcoder.jp': platforms.atCoder,
  'www.atcoder.jp': platforms.atCoder,
  'hackerrank.com': platforms.hackerRank,
  'www.hackerrank.com': platforms.hackerRank,
  'topcoder.com': platforms.topCoder,
  'www.topcoder.com': platforms.topCoder,
  'geeksforgeeks.org': platforms.geeksForGeeks,
  'www.geeksforgeeks.org': platforms.geeksForGeeks,
  'coderbyte.com': platforms.coder,
  'www.coderbyte.com': platforms.coder,
  'coder.com': platforms.coder,
  'www.coder.com': platforms.coder,
};

// Simplified catalog based on the Go backend
const catalog: Record<string, any> = {
  [`${platforms.leetCode}::two-sum`]: { title: 'Two Sum', tags: 'arrays,hashing', difficulty: 'Easy', solvedByCount: 5938247 },
  [`${platforms.codeforces}::4A`]: { title: 'Watermelon', tags: 'math,bruteforce', difficulty: '800', solvedByCount: 514287 },
  [`${platforms.codeChef}::FLOW001`]: { title: 'Add Two Numbers', tags: 'implementation,ad-hoc', difficulty: '1★', solvedByCount: 371104 },
};

export const ensureSupportedUrl = (rawUrl: string) => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Problem links must be valid URLs.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Problem links must use HTTPS.');
  }

  const host = parsed.hostname.toLowerCase();
  const platform = supportedHosts[host];
  if (!platform) {
    throw new Error('Unsupported coding platform. Use LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, TopCoder, GeeksForGeeks, or Coder.');
  }

  return { canonicalUrl: parsed.toString(), platform, host, path: parsed.pathname };
};

const extractPlatformProblemId = (platform: string, path: string): string | null => {
  if (platform === platforms.leetCode) {
    const match = path.match(/\/problems\/([^/]+)/);
    if (match) return match[1].toLowerCase();
  } else if (platform === platforms.codeforces) {
    const match = path.match(/\/(?:problemset\/problem|contest)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/);
    if (match) return match[1] + match[2].toUpperCase();
  } else if (platform === platforms.codeChef) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1].toUpperCase();
  }
  // Simplified for other platforms
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 0) return parts[parts.length - 1].toLowerCase();
  return null;
};

const slugToTitle = (slug: string) => {
  return slug
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || 'Untitled Problem';
};

const buildFallbackEntry = (platform: string, problemId: string | null) => {
  const rawSlug = problemId || platform;
  return {
    title: slugToTitle(rawSlug),
    difficulty: 'Medium',
    solvedByCount: 1000,
  };
};

export const resolveProblem = (rawUrl: string) => {
  const { canonicalUrl, platform, path } = ensureSupportedUrl(rawUrl);
  const problemId = extractPlatformProblemId(platform, path);
  
  const key = `${platform}::${problemId || ''}`;
  let entry = catalog[key];
  if (!entry) {
    entry = buildFallbackEntry(platform, problemId);
  }

  return {
    platform,
    problemUrl: canonicalUrl,
    platformProblemId: problemId,
    title: entry.title,
    contest: entry.contest || null,
    tags: entry.tags || null,
    difficulty: entry.difficulty,
    thumbnailUrl: entry.thumbnailUrl || null,
    solvedByCount: entry.solvedByCount,
    signature: `${platform}::${problemId || entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  };
};
