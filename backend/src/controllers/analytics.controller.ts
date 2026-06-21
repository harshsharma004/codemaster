import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { buildAnalytics, filterByWindow, ProblemRecord } from '../utils/analytics';

const toAnalyticsRecords = (problems: any[]): ProblemRecord[] => {
  return problems.map(p => ({
    title: p.title,
    contest: p.contest,
    difficulty: p.difficulty,
    platform: p.platform,
    platformProblemId: p.platformProblemId,
    sharedAt: p.sharedAt,
    problemSignature: p.problemSignature,
    sharedByUsername: p.sharedBy?.username || 'Unknown',
  }));
};

export const globalStats = async (req: AuthRequest, res: Response) => {
  const problems = await prisma.problemShare.findMany({
    include: { sharedBy: true },
    orderBy: { sharedAt: 'desc' }
  });

  const window = (req.query.window as string) || '30d';
  const records = filterByWindow(toAnalyticsRecords(problems), window, new Date());
  
  res.json(buildAnalytics(records));
};

export const groupAnalytics = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groupId = BigInt(req.params.groupID as string);

  const membership = await prisma.groupMembership.findFirst({
    where: { groupId, userId: currentUserId }
  });

  if (!membership) {
    return res.status(404).json({ detail: 'Group not found.' });
  }

  const problems = await prisma.problemShare.findMany({
    where: { groupId },
    include: { sharedBy: true },
    orderBy: { sharedAt: 'desc' }
  });

  const window = (req.query.window as string) || '30d';
  const records = filterByWindow(toAnalyticsRecords(problems), window, new Date());
  
  res.json(buildAnalytics(records));
};

export const personalAnalytics = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);

  const problems = await prisma.problemShare.findMany({
    where: { sharedById: currentUserId },
    include: { sharedBy: true },
    orderBy: { sharedAt: 'desc' }
  });

  const window = (req.query.window as string) || '30d';
  const records = filterByWindow(toAnalyticsRecords(problems), window, new Date());
  
  res.json(buildAnalytics(records));
};
