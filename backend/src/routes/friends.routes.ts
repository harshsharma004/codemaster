import { Router } from 'express';
import { 
  lookupFriendByUsername, searchUsers, listFriends, 
  addFriend, removeFriend, listFriendRequests, 
  acceptFriendRequest, rejectFriendRequest 
} from '../controllers/friends.controller';
import { requireAuth, friendLookupLimiter } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/lookup', friendLookupLimiter, lookupFriendByUsername);
router.get('/search', friendLookupLimiter, searchUsers);
router.get('/list', listFriends);
router.get('/requests', listFriendRequests);

router.post('/:friendID', addFriend);
router.delete('/:friendID', removeFriend);
router.post('/requests/:requestID/accept', acceptFriendRequest);
router.post('/requests/:requestID/reject', rejectFriendRequest);

export default router;
