import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { fetchProblems, pickRandomProblems } from '../utils/codeforces';

const serializeChallenge = (challenge: any) => ({
  id: challenge.id.toString(),
  title: challenge.title,
  platform: challenge.platform,
  numProblems: challenge.numProblems,
  minRating: challenge.minRating,
  maxRating: challenge.maxRating,
  tags: challenge.tags,
  status: challenge.status,
  createdBy: challenge.createdBy?.username || '',
  createdById: challenge.createdById.toString(),
  participants: challenge.participants?.map((p: any) => ({
    userId: p.user.id.toString(),
    username: p.user.username,
    displayName: p.user.displayName,
    avatarUrl: p.user.avatarUrl,
    status: p.status,
  })) || [],
  problems: challenge.problems?.map((p: any) => ({
    id: p.id.toString(),
    problemUrl: p.problemUrl,
    title: p.title,
    contestId: p.contestId,
    problemIndex: p.problemIndex,
    rating: p.rating,
    tags: p.tags,
    orderIndex: p.orderIndex,
  })) || [],
  createdAt: challenge.createdAt,
  startedAt: challenge.startedAt,
});

const createChallengeSchema = z.object({
  title: z.string().min(1, 'Field required.'),
  platform: z.string().optional().default('codeforces'),
  numProblems: z.number().min(1, 'Value must be between 1 and 10.').max(10, 'Value must be between 1 and 10.').optional().default(3),
  minRating: z.number().min(0, 'Value must be between 0 and 3500.').max(3500, 'Value must be between 0 and 3500.').optional(),
  maxRating: z.number().min(0, 'Value must be between 0 and 3500.').max(3500, 'Value must be between 0 and 3500.').optional(),
  tags: z.array(z.string()).optional().default([]),
  inviteUserIds: z.array(z.number().or(z.string())).min(1, 'Field required.'),
});

export const createChallenge = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const parsed = createChallengeSchema.safeParse(req.body);

  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ loc: ['body', i.path[0]], msg: i.message }));
    return res.status(422).json({ detail: issues });
  }

  const { title, platform, numProblems, minRating, maxRating, tags, inviteUserIds } = parsed.data;
  
  const minR = minRating ?? 800;
  const maxR = maxRating ?? 1600;

  try {
    const cfProblems = await fetchProblems(tags, minR, maxR);
    const selected = pickRandomProblems(cfProblems, numProblems);

    const challenge = await prisma.$transaction(async (tx) => {
      const newChallenge = await tx.challenge.create({
        data: {
          createdById: currentUserId,
          title,
          platform,
          numProblems,
          minRating: minR,
          maxRating: maxR,
          status: 'pending',
          tags: tags.length > 0 ? tags.join(',') : null,
          createdAt: new Date(),
        }
      });

      await tx.challengeParticipant.create({
        data: {
          challengeId: newChallenge.id,
          userId: currentUserId,
          status: 'accepted',
          joinedAt: new Date(),
        }
      });

      const inviteIds = Array.from(new Set(inviteUserIds.map(id => BigInt(id))));
      for (const inviteId of inviteIds) {
        if (inviteId !== currentUserId) {
          await tx.challengeParticipant.create({
            data: { challengeId: newChallenge.id, userId: inviteId, status: 'invited' }
          });
        }
      }

      for (let i = 0; i < selected.length; i++) {
        const p = selected[i];
        await tx.challengeProblem.create({
          data: {
            challengeId: newChallenge.id,
            problemUrl: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
            title: p.name,
            contestId: p.contestId,
            problemIndex: p.index,
            rating: p.rating,
            tags: p.tags.length > 0 ? p.tags.join(',') : null,
            orderIndex: i,
          }
        });
      }

      return newChallenge;
    });

    const loaded = await prisma.challenge.findUnique({
      where: { id: challenge.id },
      include: { createdBy: true, participants: { include: { user: true } }, problems: true }
    });

    res.status(201).json(serializeChallenge(loaded));
  } catch (error: any) {
    res.status(502).json({ detail: error.message || 'Failed to load challenge problems from Codeforces. Please try again.' });
  }
};

export const listChallenges = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const challenges = await prisma.challenge.findMany({
    where: {
      participants: { some: { userId: currentUserId } }
    },
    include: { createdBy: true, participants: { include: { user: true } }, problems: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json(challenges.map(serializeChallenge));
};

export const getChallenge = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const challengeId = BigInt(req.params.challengeID as string);

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { createdBy: true, participants: { include: { user: true } }, problems: true }
  });

  if (!challenge || !challenge.participants.some(p => p.userId === currentUserId)) {
    return res.status(404).json({ detail: 'Challenge not found.' });
  }

  res.json(serializeChallenge(challenge));
};

export const acceptChallenge = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const challengeId = BigInt(req.params.challengeID as string);

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { participants: true }
  });

  if (!challenge || !challenge.participants.some(p => p.userId === currentUserId)) {
    return res.status(404).json({ detail: 'Challenge not found.' });
  }

  const participant = challenge.participants.find(p => p.userId === currentUserId);
  if (participant?.status !== 'invited') {
    return res.status(400).json({ detail: 'Already responded.' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.challengeParticipant.update({
      where: { id: participant.id },
      data: { status: 'accepted', joinedAt: new Date() }
    });

    const participants = await tx.challengeParticipant.findMany({ where: { challengeId } });
    const allAccepted = participants.every(p => p.status === 'accepted' || (p.id === participant.id));

    if (allAccepted && challenge.status === 'pending') {
      await tx.challenge.update({
        where: { id: challengeId },
        data: { status: 'active', startedAt: new Date() }
      });
    }
  });

  const loaded = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { createdBy: true, participants: { include: { user: true } }, problems: true }
  });

  res.json(serializeChallenge(loaded));
};

export const declineChallenge = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const challengeId = BigInt(req.params.challengeID as string);

  const participant = await prisma.challengeParticipant.findFirst({
    where: { challengeId, userId: currentUserId }
  });

  if (!participant) return res.status(404).json({ detail: 'Challenge not found.' });
  if (participant.status !== 'invited') return res.status(400).json({ detail: 'Already responded.' });

  await prisma.challengeParticipant.update({
    where: { id: participant.id },
    data: { status: 'declined' }
  });

  res.status(204).send();
};

export const startChallenge = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const challengeId = BigInt(req.params.challengeID as string);

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { participants: true }
  });

  if (!challenge || challenge.createdById !== currentUserId) {
    return res.status(404).json({ detail: 'Challenge not found.' });
  }

  if (challenge.status !== 'pending') {
    return res.status(400).json({ detail: 'Challenge is not pending.' });
  }

  if (challenge.participants.some(p => p.status === 'declined')) {
    return res.status(400).json({ detail: 'Some participants have declined.' });
  }

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { status: 'active', startedAt: new Date() }
  });

  const loaded = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { createdBy: true, participants: { include: { user: true } }, problems: true }
  });

  res.json(serializeChallenge(loaded));
};
