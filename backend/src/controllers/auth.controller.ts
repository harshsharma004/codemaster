import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { hashPassword, verifyPassword, createAccessToken } from '../utils/security';
import { globalSearchIndex } from '../services/search.service';
import { verifyGoogleToken } from '../utils/google';
import { AuthRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
  email: z.string().email('Invalid email format.'),
  username: z.string().min(3, 'Username must be at least 3 characters.').max(32, 'Username is too long.'),
  displayName: z.string().min(1, 'Display name is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  favoriteTopic: z.string().optional().nullable(),
  favoritePlatform: z.string().optional().nullable(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Field required.'),
  password: z.string().min(1, 'Field required.'),
});

const googleSchema = z.object({
  code: z.string().min(1, 'Field required.'),
});

const serializeUser = (user: any) => ({
  id: user.id.toString(),
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  bio: user.bio,
  favoriteTopic: user.favoriteTopic,
  favoritePlatform: user.favoritePlatform,
  avatarUrl: user.avatarUrl,
});

export const checkUsername = async (req: Request, res: Response) => {
  const username = (req.query.username as string || '').trim().toLowerCase();
  if (!username) {
    return res.status(400).json({ detail: [{ field: 'username', message: 'Field required.' }] });
  }

  if (!globalSearchIndex.usernameMayExist(username)) {
    return res.json({ available: true });
  }

  const count = await prisma.user.count({
    where: { username: username } // Prisma is case-sensitive or insensitive based on collation, usually insensitive for mysql varchar
  });
  res.json({ available: count === 0 });
};

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ loc: ['body', i.path[0]], msg: i.message }));
    return res.status(422).json({ detail: issues });
  }

  const { email, username, displayName, password, favoriteTopic, favoritePlatform } = parsed.data;
  const emailLower = email.toLowerCase();
  const usernameLower = username.toLowerCase();

  const existingEmail = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existingEmail) {
    return res.status(409).json({ detail: 'An account already exists for that email.' });
  }

  const existingUsername = await prisma.user.findUnique({ where: { username: usernameLower } });
  if (existingUsername) {
    return res.status(409).json({ detail: 'That username is already taken.' });
  }

  const hashed = await hashPassword(password);
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${usernameLower}`;

  try {
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: emailLower,
          username: usernameLower,
          displayName,
          passwordHash: hashed,
          favoriteTopic,
          favoritePlatform,
          avatarUrl,
          authProvider: 'local',
          createdAt: new Date(),
        }
      });

      const group = await tx.group.create({
        data: {
          name: `${displayName}'s Squad`,
          ownerId: newUser.id,
          createdAt: new Date(),
        }
      });

      await tx.groupMembership.create({
        data: {
          groupId: group.id,
          userId: newUser.id,
          role: 'owner',
          createdAt: new Date(),
        }
      });

      return newUser;
    });

    globalSearchIndex.addUsername(user.username);
    const token = createAccessToken(user.id);

    res.status(201).json({
      accessToken: token,
      tokenType: 'bearer',
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(409).json({ detail: 'An account with those credentials already exists.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ loc: ['body', i.path[0]], msg: i.message }));
    return res.status(422).json({ detail: issues });
  }

  const { identifier, password } = parsed.data;
  const identLower = identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identLower },
        { username: identLower }
      ]
    }
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ detail: 'Invalid email, username, or password.' });
  }

  const match = await verifyPassword(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ detail: 'Invalid email, username, or password.' });
  }

  const token = createAccessToken(user.id);
  res.json({
    accessToken: token,
    tokenType: 'bearer',
    user: serializeUser(user),
  });
};

export const googleAuth = async (req: Request, res: Response) => {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ loc: ['body', i.path[0]], msg: i.message }));
    return res.status(422).json({ detail: issues });
  }

  try {
    const googleUser = await verifyGoogleToken(parsed.data.code);
    if (!googleUser.emailVerified) {
      return res.status(401).json({ detail: 'Google account email must be verified before sign-in.' });
    }

    const emailLower = googleUser.email.toLowerCase();

    // Check by googleId
    let user = await prisma.user.findUnique({ where: { googleId: googleUser.googleId } });
    if (user) {
      const token = createAccessToken(user.id);
      return res.json({ accessToken: token, tokenType: 'bearer', user: serializeUser(user) });
    }

    // Check by email
    user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          authProvider: user.passwordHash ? 'both' : 'google',
          avatarUrl: (user.avatarUrl?.includes('dicebear') && googleUser.picture) ? googleUser.picture : user.avatarUrl,
        }
      });
      const token = createAccessToken(user.id);
      return res.json({ accessToken: token, tokenType: 'bearer', user: serializeUser(user) });
    }

    // Create new user
    let baseUsername = emailLower.split('@')[0];
    if (baseUsername.length > 24) baseUsername = baseUsername.substring(0, 24);
    let username = baseUsername;
    let counter = 1;

    while (true) {
      const count = await prisma.user.count({ where: { username } });
      if (count === 0) break;
      const suffix = counter.toString();
      let trimmed = baseUsername;
      if (trimmed.length + suffix.length > 24) trimmed = trimmed.substring(0, 24 - suffix.length);
      username = trimmed + suffix;
      counter++;
    }

    const avatarUrl = googleUser.picture || `https://api.dicebear.com/9.x/initials/svg?seed=${username}`;

    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: emailLower,
          username,
          displayName: googleUser.name,
          bio: '',
          avatarUrl,
          googleId: googleUser.googleId,
          authProvider: 'google',
          createdAt: new Date(),
        }
      });

      const group = await tx.group.create({
        data: { name: `${googleUser.name}'s Squad`, ownerId: newUser.id, createdAt: new Date() }
      });

      await tx.groupMembership.create({
        data: { groupId: group.id, userId: newUser.id, role: 'owner', createdAt: new Date() }
      });

      return newUser;
    });

    globalSearchIndex.addUsername(user.username);
    const token = createAccessToken(user.id);
    res.status(201).json({ accessToken: token, tokenType: 'bearer', user: serializeUser(user) });

  } catch (error) {
    res.status(401).json({ detail: 'Google authentication failed. Please try again.' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  res.json(serializeUser(req.user));
};
