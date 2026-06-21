

export interface CFProblem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

export const fetchProblems = async (tags: string[], minRating?: number, maxRating?: number): Promise<CFProblem[]> => {
  let url = 'https://codeforces.com/api/problemset.problems';
  if (tags.length > 0) {
    url += `?tags=${tags.join(';')}`;
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`Codeforces API error: ${data.comment || 'unknown error'}`);
    }

    const allProblems: CFProblem[] = data.result.problems;
    return allProblems.filter((p: any) => {
      if (p.rating === undefined) return false;
      if (minRating !== undefined && p.rating < minRating) return false;
      if (maxRating !== undefined && p.rating > maxRating) return false;
      return true;
    });
  } catch (error: any) {
    throw new Error(`Failed to load challenge problems from Codeforces. ${error.message}`);
  }
};

export const pickRandomProblems = (problems: CFProblem[], count: number): CFProblem[] => {
  if (problems.length <= count) return [...problems];
  
  const shuffled = [...problems];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
};
