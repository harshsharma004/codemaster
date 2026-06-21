import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper to calculate friendship states
const serializeFriendUser = async (friendUser: any, currentUserId: bigint) => {
  const [outgoing, incoming] = await Promise.all([
    prisma.friendship.findFirst({
      where: { userId: currentUserId, friendId: friendUser.id }
    }),
    prisma.friendship.findFirst({
      where: { userId: friendUser.id, friendId: currentUserId }
    })
  ]);

  let isFriend = false;
  let friendshipStatus = 'none';

  if (outgoing && outgoing.status === 'accepted') {
    isFriend = true;
    friendshipStatus = 'accepted';
  } else if (outgoing && outgoing.status === 'pending') {
    friendshipStatus = 'pending_outgoing';
  } else if (incoming && incoming.status === 'pending') {
    friendshipStatus = 'pending_incoming';
  }

  return {
    id: friendUser.id.toString(),
    username: friendUser.username,
    displayName: friendUser.displayName,
    avatarUrl: friendUser.avatarUrl,
    isFriend,
    friendshipStatus,
  };
};

export const lookupFriendByUsername = async (req: AuthRequest, res: Response) => {
  const username = (req.query.username as string || '').trim().toLowerCase();
  if (!username) {
    return res.status(400).json({ detail: [{ field: 'username', message: 'Field required.' }] });
  }

  if (username === req.user.username.toLowerCase()) {
    return res.status(400).json({ detail: 'You cannot add yourself as a friend.' });
  }

  const friend = await prisma.user.findFirst({
    where: { username }
  });

  if (!friend) {
    return res.json({ user: null });
  }

  const responseUser = await serializeFriendUser(friend, BigInt(req.user.id));
  res.json({ user: responseUser });
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  let query = (req.query.q as string || '').trim().toLowerCase();
  if (query.startsWith('@')) query = query.substring(1);
  if (query.length < 2) {
    return res.status(400).json({ detail: [{ field: 'q', message: 'String should have at least 2 characters.' }] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { not: BigInt(req.user.id) },
      OR: [
        { username: { contains: query } },
        { displayName: { contains: query } }
      ]
    },
    take: 10,
    orderBy: { displayName: 'asc' }
  });

  const response = await Promise.all(users.map(u => serializeFriendUser(u, BigInt(req.user.id))));
  res.json(response);
};

export const listFriends = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const friendships = await prisma.friendship.findMany({
    where: { userId: currentUserId, status: 'accepted' },
    include: { friend: true },
    orderBy: { friend: { displayName: 'asc' } }
  });

  const response = friendships.map(f => ({
    id: f.friend.id.toString(),
    username: f.friend.username,
    displayName: f.friend.displayName,
    avatarUrl: f.friend.avatarUrl,
    isFriend: true,
    friendshipStatus: 'accepted',
  }));

  res.json(response);
};

export const addFriend = async (req: AuthRequest, res: Response) => {
  const friendId = BigInt(req.params.friendID as string);
  const currentUserId = BigInt(req.user.id);

  if (friendId === currentUserId) {
    return res.status(400).json({ detail: 'You cannot add yourself as a friend.' });
  }

  const friend = await prisma.user.findUnique({ where: { id: friendId } });
  if (!friend) {
    return res.status(404).json({ detail: 'User not found.' });
  }

  const existing = await prisma.friendship.findFirst({
    where: { userId: currentUserId, friendId }
  });

  if (existing) {
    const status = existing.status === 'accepted' ? 'accepted' : 'pending_outgoing';
    return res.json({
      id: friend.id.toString(),
      username: friend.username,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      isFriend: existing.status === 'accepted',
      friendshipStatus: status
    });
  }

  const reverse = await prisma.friendship.findFirst({
    where: { userId: friendId, friendId: currentUserId }
  });

  if (reverse && reverse.status === 'pending') {
    await prisma.$transaction([
      prisma.friendship.update({
        where: { id: reverse.id },
        data: { status: 'accepted' }
      }),
      prisma.friendship.create({
        data: { userId: currentUserId, friendId, status: 'accepted', createdAt: new Date() }
      })
    ]);
    return res.json({
      id: friend.id.toString(),
      username: friend.username,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      isFriend: true,
      friendshipStatus: 'accepted'
    });
  }

  await prisma.friendship.create({
    data: { userId: currentUserId, friendId, status: 'pending', createdAt: new Date() }
  });

  res.json({
    id: friend.id.toString(),
    username: friend.username,
    displayName: friend.displayName,
    avatarUrl: friend.avatarUrl,
    isFriend: false,
    friendshipStatus: 'pending_outgoing'
  });
};

export const removeFriend = async (req: AuthRequest, res: Response) => {
  const friendId = BigInt(req.params.friendID as string);
  const currentUserId = BigInt(req.user.id);

  await prisma.$transaction(async (tx) => {
    await tx.friendship.deleteMany({
      where: { userId: currentUserId, friendId }
    });
    await tx.friendship.deleteMany({
      where: { userId: friendId, friendId: currentUserId }
    });
    // Remove friend from groups owned by current user
    const ownedGroups = await tx.group.findMany({ where: { ownerId: currentUserId }, select: { id: true } });
    const ownedGroupIds = ownedGroups.map(g => g.id);
    if (ownedGroupIds.length > 0) {
      await tx.groupMembership.deleteMany({
        where: { userId: friendId, groupId: { in: ownedGroupIds } }
      });
    }

    // Remove current user from groups owned by friend
    const friendOwnedGroups = await tx.group.findMany({ where: { ownerId: friendId }, select: { id: true } });
    const friendOwnedGroupIds = friendOwnedGroups.map(g => g.id);
    if (friendOwnedGroupIds.length > 0) {
      await tx.groupMembership.deleteMany({
        where: { userId: currentUserId, groupId: { in: friendOwnedGroupIds } }
      });
    }
  });

  res.status(204).send();
};

export const listFriendRequests = async (req: AuthRequest, res: Response) => {
  const currentUserId = BigInt(req.user.id);
  const requests = await prisma.friendship.findMany({
    where: { friendId: currentUserId, status: 'pending' },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const response = requests.map(r => ({
    id: r.id.toString(),
    fromUser: {
      id: r.user.id.toString(),
      username: r.user.username,
      displayName: r.user.displayName,
      avatarUrl: r.user.avatarUrl,
      isFriend: false,
      friendshipStatus: 'pending_incoming'
    },
    createdAt: r.createdAt
  }));

  res.json(response);
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  const requestId = BigInt(req.params.requestID as string);
  const currentUserId = BigInt(req.user.id);

  const request = await prisma.friendship.findFirst({
    where: { id: requestId, friendId: currentUserId, status: 'pending' },
    include: { user: true }
  });

  if (!request) {
    return res.status(404).json({ detail: 'Friend request not found.' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.friendship.update({
      where: { id: requestId },
      data: { status: 'accepted' }
    });

    const reverse = await tx.friendship.findFirst({
      where: { userId: currentUserId, friendId: request.userId }
    });

    if (reverse) {
      await tx.friendship.update({
        where: { id: reverse.id },
        data: { status: 'accepted' }
      });
    } else {
      await tx.friendship.create({
        data: { userId: currentUserId, friendId: request.userId, status: 'accepted', createdAt: new Date() }
      });
    }
  });

  res.json({
    id: request.user.id.toString(),
    username: request.user.username,
    displayName: request.user.displayName,
    avatarUrl: request.user.avatarUrl,
    isFriend: true,
    friendshipStatus: 'accepted'
  });
};

export const rejectFriendRequest = async (req: AuthRequest, res: Response) => {
  const requestId = BigInt(req.params.requestID as string);
  const currentUserId = BigInt(req.user.id);

  const result = await prisma.friendship.deleteMany({
    where: { id: requestId, friendId: currentUserId, status: 'pending' }
  });

  if (result.count === 0) {
    return res.status(404).json({ detail: 'Friend request not found.' });
  }

  res.status(204).send();
};
