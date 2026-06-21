import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { resolveProblem } from '../utils/metadata';
import { globalSearchIndex } from '../services/search.service';

const serializeProblem = (problem: any) => ({
  id: problem.id.toString(),
  title: problem.title,
  contest: problem.contest,
  tags: problem.tags,
  difficulty: problem.difficulty,
  url: problem.problemUrl,
  platform: problem.platform,
  sharedBy: problem.sharedBy?.username || '',
  thumbnailUrl: problem.thumbnailUrl,
  solvedByCount: problem.solvedByCount,
  sharedAt: problem.sharedAt,
});

export const listGroupProblems = async (req: AuthRequest, res: Response) => {
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

  res.json(problems.map(serializeProblem));
};

const addProblemSchema = z.object({
  url: z.string().min(1, 'Field required.'),
});

export const addProblem = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groupId = BigInt(req.params.groupID as string);

  const membership = await prisma.groupMembership.findFirst({
    where: { groupId, userId: currentUserId }
  });

  if (!membership) {
    return res.status(404).json({ detail: 'Group not found.' });
  }

  const parsed = addProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ detail: [{ loc: ['body', 'url'], msg: 'Field required.' }] });
  }

  try {
    const resolved = resolveProblem(parsed.data.url);

    const problem = await prisma.problemShare.create({
      data: {
        groupId,
        sharedById: currentUserId,
        platform: resolved.platform,
        problemUrl: resolved.problemUrl,
        platformProblemId: resolved.platformProblemId,
        title: resolved.title,
        contest: resolved.contest,
        tags: resolved.tags,
        difficulty: resolved.difficulty || 'Unknown',
        thumbnailUrl: resolved.thumbnailUrl,
        solvedByCount: resolved.solvedByCount,
        problemSignature: resolved.signature,
        sharedAt: new Date(),
      },
      include: { sharedBy: true }
    });

    res.status(201).json(serializeProblem(problem));
  } catch (error: any) {
    res.status(400).json({ detail: [{ loc: ['body', 'url'], msg: error.message || 'Invalid URL.' }] });
  }
};

export const removeGroupProblem = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groupId = BigInt(req.params.groupID as string);
  const problemId = BigInt(req.params.problemID as string);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ detail: 'Group not found.' });

  const problem = await prisma.problemShare.findUnique({
    where: { id: problemId }
  });

  if (!problem || problem.groupId !== groupId) {
    return res.status(404).json({ detail: 'Problem not found in group.' });
  }

  if (problem.sharedById !== currentUserId && group.ownerId !== currentUserId) {
    return res.status(403).json({ detail: 'Not authorized to remove this problem.' });
  }

  await prisma.problemShare.delete({ where: { id: problemId } });
  res.status(204).send();
};

export const getProblemsFeed = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: currentUserId },
    select: { groupId: true }
  });
  const groupIds = memberships.map(m => m.groupId);

  const problems = await prisma.problemShare.findMany({
    where: { groupId: { in: groupIds } },
    include: { sharedBy: true },
    orderBy: { sharedAt: 'desc' },
    take: 50
  });

  res.json(problems.map(serializeProblem));
};
