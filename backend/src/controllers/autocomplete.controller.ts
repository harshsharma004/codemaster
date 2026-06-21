import { Response } from 'express';
import { globalSearchIndex } from '../services/search.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const autocompleteUsers = async (req: AuthRequest, res: Response) => {
  let query = (req.query.q as string || '').trim().toLowerCase();
  if (query.startsWith('@')) query = query.substring(1);
  if (!query) {
    return res.status(400).json({ detail: [{ field: 'q', message: 'String should have at least 1 character.' }] });
  }

  const results = globalSearchIndex.searchUsernames(query, 10);
  res.json(results);
};

export const autocompleteProblems = async (req: AuthRequest, res: Response) => {
  // We'll leave the search index for problems empty for now or stub it
  // Since we haven't implemented problem search index yet.
  res.json([]);
};
