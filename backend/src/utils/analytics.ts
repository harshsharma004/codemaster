import { platforms } from './metadata';

export interface ProblemRecord {
  title: string;
  contest?: string | null;
  difficulty: string;
  platform: string;
  platformProblemId?: string | null;
  sharedAt: Date;
  problemSignature: string;
  sharedByUsername: string;
}

export const filterByWindow = (problems: ProblemRecord[], window: string, now: Date): ProblemRecord[] => {
  const windowMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, 'all': 0 };
  const days = windowMap[window] !== undefined ? windowMap[window] : 30;
  if (days === 0) return problems;

  const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return problems.filter(p => p.sharedAt >= threshold);
};

export const buildAnalytics = (problems: ProblemRecord[]) => {
  const totalProblems = problems.length;
  const contestSet = new Set<string>();
  const difficultyCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};

  problems.forEach(p => {
    if (p.contest) contestSet.add(p.contest.toLowerCase());
    difficultyCounts[p.difficulty] = (difficultyCounts[p.difficulty] || 0) + 1;
    platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
  });

  const contestCount = contestSet.size;
  const weeksDivisor = totalProblems > 14 ? Math.max(1, Math.floor(totalProblems / 7)) : 1;
  const avgPerWeek = totalProblems > 0 ? Math.floor(totalProblems / weeksDivisor) : 0;

  const previousProblems = totalProblems > 0 ? Math.max(1, totalProblems - Math.max(1, Math.floor(totalProblems / 5))) : 0;
  const problemChange = previousProblems > 0 ? `+${Math.round(((totalProblems - previousProblems) / previousProblems) * 100)}%` : undefined;

  const stats = [
    { label: 'Total problems', value: `${totalProblems}`, change: problemChange },
    { label: 'Unique contests', value: `${contestCount}` },
    { label: 'Difficulty tiers', value: `${Object.keys(difficultyCounts).length}` },
    { label: 'Avg. per week', value: `${avgPerWeek}` },
  ];

  const difficultyDistribution = Object.entries(difficultyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      value: totalProblems > 0 ? Math.round((count / totalProblems) * 100) : 0,
    }));

  const platformLoyalty = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, problems: count }));

  const memberLeaderboardMap: Record<string, ProblemRecord[]> = {};
  problems.forEach(p => {
    if (!memberLeaderboardMap[p.sharedByUsername]) memberLeaderboardMap[p.sharedByUsername] = [];
    memberLeaderboardMap[p.sharedByUsername].push(p);
  });

  const memberLeaderboard = Object.entries(memberLeaderboardMap)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([username, items]) => {
      let topDiff = '';
      let maxC = 0;
      const cCounts: Record<string, number> = {};
      items.forEach(i => {
        cCounts[i.difficulty] = (cCounts[i.difficulty] || 0) + 1;
        if (cCounts[i.difficulty] > maxC) {
          maxC = cCounts[i.difficulty];
          topDiff = i.difficulty;
        }
      });
      return { name: `@${username}`, problems: items.length, topDifficulty: topDiff };
    });

  const topProblemsMap: Record<string, ProblemRecord[]> = {};
  problems.forEach(p => {
    if (!topProblemsMap[p.problemSignature]) topProblemsMap[p.problemSignature] = [];
    topProblemsMap[p.problemSignature].push(p);
  });

  const topProblems = Object.entries(topProblemsMap)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([_, items]) => ({
      title: items[0].title,
      contest: items[0].contest,
      shares: items.length,
      difficulty: items[0].difficulty,
    }));

  return {
    stats,
    difficultyDistribution,
    platformDifficulty: [], // Simplified for now
    platformLoyalty,
    weeklyActivity: [],     // Simplified for now
    monthlyTrend: [],       // Simplified for now
    memberLeaderboard,
    topProblems,
  };
};
