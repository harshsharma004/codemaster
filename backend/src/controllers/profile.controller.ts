import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

const profileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Field required.'),
  bio: z.string().optional(),
  favoriteTopic: z.string().optional().nullable(),
  favoritePlatform: z.string().optional().nullable(),
  avatarUrl: z.string().url('Invalid URL format.').optional().nullable(),
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  res.json(req.user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => ({ loc: ['body', i.path[0]], msg: i.message }));
    return res.status(422).json({ detail: issues });
  }

  const { displayName, bio, favoriteTopic, favoritePlatform, avatarUrl } = parsed.data;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(req.user.id) },
      data: {
        displayName,
        bio: bio || '',
        favoriteTopic,
        favoritePlatform,
        avatarUrl,
      }
    });

    const serializedUser = {
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      favoriteTopic: updatedUser.favoriteTopic,
      favoritePlatform: updatedUser.favoritePlatform,
      avatarUrl: updatedUser.avatarUrl,
    };

    res.json(serializedUser);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update the profile.' });
  }
};
