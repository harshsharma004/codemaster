import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

const serializeGroup = (group: any, currentUserId: bigint) => {
  const members = group.memberships ? group.memberships.map((m: any) => m.user.username) : [];
  const memberDetails = group.memberships ? group.memberships.map((m: any) => ({
    id: m.user.id.toString(),
    username: m.user.username,
  })) : [];
  
  return {
    id: group.id.toString(),
    name: group.name,
    memberCount: group.memberships?.length || 0,
    problemCount: group.problems?.length || 0,
    lastActiveAt: group.problems && group.problems.length > 0 
      ? group.problems.reduce((latest: any, p: any) => p.sharedAt > latest ? p.sharedAt : latest, new Date(0)) 
      : undefined,
    members,
    memberDetails,
    isOwner: group.ownerId === currentUserId,
  };
};

export const listGroups = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groups = await prisma.group.findMany({
    where: {
      memberships: {
        some: { userId: currentUserId }
      }
    },
    include: {
      memberships: { include: { user: true } },
      problems: true,
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json(groups.map(g => serializeGroup(g, currentUserId)));
};

const createGroupSchema = z.object({
  name: z.string().min(1, 'Field required.'),
  memberIds: z.array(z.number().or(z.string())).optional().default([]),
});

export const createGroup = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ loc: ['body', i.path[0]], msg: i.message }));
    return res.status(422).json({ detail: issues });
  }

  const { name, memberIds } = parsed.data;
  const filteredMemberIds = memberIds
    .map(id => BigInt(id))
    .filter(id => id !== currentUserId);

  try {
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: { name, ownerId: currentUserId, createdAt: new Date() }
      });

      await tx.groupMembership.create({
        data: { groupId: newGroup.id, userId: currentUserId, role: 'owner', createdAt: new Date() }
      });

      if (filteredMemberIds.length > 0) {
        const users = await tx.user.findMany({ where: { id: { in: filteredMemberIds } } });
        for (const user of users) {
          await tx.groupMembership.create({
            data: { groupId: newGroup.id, userId: user.id, role: 'member', createdAt: new Date() }
          });
        }
      }

      return newGroup;
    });

    const loadedGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: { memberships: { include: { user: true } }, problems: true }
    });

    res.status(201).json(serializeGroup(loadedGroup, currentUserId));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to create the group.' });
  }
};

export const topGroups = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);

  const groups = await prisma.$queryRaw<any[]>`
    SELECT 
      groups.id, 
      groups.name, 
      groups.owner_id as ownerId, 
      COUNT(DISTINCT group_memberships.id) AS memberCount, 
      COUNT(DISTINCT problem_shares.id) AS problemCount, 
      MAX(problem_shares.shared_at) AS lastActiveAt, 
      users.username AS ownerUsername
    FROM groups
    JOIN group_memberships ON group_memberships.group_id = groups.id
    JOIN users ON users.id = groups.owner_id
    LEFT JOIN problem_shares ON problem_shares.group_id = groups.id
    GROUP BY groups.id, users.username
    HAVING COUNT(DISTINCT group_memberships.id) > 1
    ORDER BY COUNT(DISTINCT problem_shares.id) DESC, COUNT(DISTINCT group_memberships.id) DESC
    LIMIT 20
  `;

  const groupIds = groups.map(g => BigInt(g.id));

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId: { in: groupIds }, userId: currentUserId },
    select: { groupId: true }
  });
  const memberSet = new Set(memberships.map(m => m.groupId.toString()));

  const pendingRequests = await prisma.joinRequest.findMany({
    where: { groupId: { in: groupIds }, userId: currentUserId, status: 'pending' },
    select: { groupId: true }
  });
  const pendingSet = new Set(pendingRequests.map(p => p.groupId.toString()));

  const response = groups.map(g => {
    let joinStatus = undefined;
    const idStr = g.id.toString();
    if (memberSet.has(idStr)) joinStatus = 'member';
    else if (pendingSet.has(idStr)) joinStatus = 'pending';

    return {
      id: idStr,
      name: g.name,
      memberCount: Number(g.memberCount),
      problemCount: Number(g.problemCount),
      lastActiveAt: g.lastActiveAt,
      ownerUsername: g.ownerUsername,
      joinStatus,
    };
  });

  res.json(response);
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groupId = BigInt(req.params.groupID as string);

  const result = await prisma.group.deleteMany({
    where: { id: groupId, ownerId: currentUserId }
  });

  if (result.count === 0) {
    return res.status(404).json({ detail: "Group not found or you don't have permission." });
  }

  res.status(204).send();
};

export const listJoinRequests = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  
  const requests = await prisma.joinRequest.findMany({
    where: {
      status: 'pending',
      group: { ownerId: currentUserId }
    },
    include: { user: true, group: true },
    orderBy: { createdAt: 'desc' }
  });

  const response = requests.map(r => ({
    id: r.id.toString(),
    groupId: r.groupId.toString(),
    groupName: r.group.name,
    userId: r.user.id.toString(),
    username: r.user.username,
    displayName: r.user.displayName,
    avatarUrl: r.user.avatarUrl,
    status: r.status,
    createdAt: r.createdAt
  }));

  res.json(response);
};

export const acceptJoinRequest = async (req: AuthRequest, res: Response) => {
  return resolveJoinRequestAction(req, res, 'accepted');
};

export const rejectJoinRequest = async (req: AuthRequest, res: Response) => {
  return resolveJoinRequestAction(req, res, 'rejected');
};

const resolveJoinRequestAction = async (req: AuthRequest, res: Response, status: string) => {
  const currentUserId = BigInt(req.user.id);
  const requestId = BigInt(req.params.requestID as string);

  const joinRequest = await prisma.joinRequest.findFirst({
    where: { id: requestId, status: 'pending' },
    include: { group: true }
  });

  if (!joinRequest || joinRequest.group.ownerId !== currentUserId) {
    return res.status(404).json({ detail: 'Join request not found.' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.joinRequest.update({
      where: { id: joinRequest.id },
      data: { status }
    });

    if (status === 'accepted') {
      const exists = await tx.groupMembership.findFirst({
        where: { groupId: joinRequest.groupId, userId: joinRequest.userId }
      });
      if (!exists) {
        await tx.groupMembership.create({
          data: { groupId: joinRequest.groupId, userId: joinRequest.userId, role: 'member', createdAt: new Date() }
        });
      }
    }
  });

  res.json({ status });
};

export const requestJoinGroup = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groupId = BigInt(req.params.groupID as string);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ detail: 'Group not found.' });

  const isMember = await prisma.groupMembership.findFirst({ where: { groupId, userId: currentUserId } });
  if (isMember) return res.status(409).json({ detail: 'You are already a member of this squad.' });

  const isPending = await prisma.joinRequest.findFirst({ where: { groupId, userId: currentUserId, status: 'pending' } });
  if (isPending) return res.status(409).json({ detail: 'You already have a pending request for this squad.' });

  await prisma.joinRequest.create({
    data: { groupId, userId: currentUserId, status: 'pending', createdAt: new Date() }
  });

  res.status(201).json({ status: 'pending' });
};

const addGroupMembersSchema = z.object({
  memberIds: z.array(z.number().or(z.string())).min(1, 'Field required.')
});

export const addGroupMembers = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groupId = BigInt(req.params.groupID as string);

  const parsed = addGroupMembersSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ detail: [{ loc: ['body', 'memberIds'], msg: 'Field required.' }] });
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { memberships: { include: { user: true } }, problems: true }
  });

  // Simplified access control (needs proper robust check usually, but matching Go)
  if (!group || !group.memberships.some(m => m.userId === currentUserId)) {
    return res.status(404).json({ detail: 'Group not found.' });
  }

  const memberIds = parsed.data.memberIds.map(id => BigInt(id));
  const existingIds = new Set(group.memberships.map(m => m.userId.toString()));
  const newIds = memberIds.filter(id => !existingIds.has(id.toString()));

  if (newIds.length > 0) {
    const users = await prisma.user.findMany({ where: { id: { in: newIds } } });
    for (const user of users) {
      await prisma.groupMembership.create({
        data: { groupId, userId: user.id, role: 'member', createdAt: new Date() }
      });
    }
  }

  const loadedGroup = await prisma.group.findUnique({
    where: { id: groupId },
    include: { memberships: { include: { user: true } }, problems: true }
  });

  res.json(serializeGroup(loadedGroup, currentUserId));
};

export const removeGroupMember = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const groupId = BigInt(req.params.groupID as string);
  const userId = BigInt(req.params.userID as string);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ detail: 'Group not found.' });

  if (userId !== currentUserId && group.ownerId !== currentUserId) {
    return res.status(403).json({ detail: 'Not authorized to remove this member.' });
  }

  const membership = await prisma.groupMembership.findFirst({
    where: { groupId, userId }
  });

  if (!membership) return res.status(404).json({ detail: 'Member not found in group.' });

  await prisma.$transaction(async (tx) => {
    if (userId === group.ownerId) {
      const nextMembership = await tx.groupMembership.findFirst({
        where: { groupId, userId: { not: userId } },
        orderBy: { createdAt: 'asc' }
      });

      if (!nextMembership) {
        await tx.group.delete({ where: { id: groupId } });
        return;
      }

      await tx.group.update({ where: { id: groupId }, data: { ownerId: nextMembership.userId } });
      await tx.groupMembership.update({ where: { id: nextMembership.id }, data: { role: 'owner' } });
    }
    await tx.groupMembership.delete({ where: { id: membership.id } });
  });

  res.status(204).send();
};
