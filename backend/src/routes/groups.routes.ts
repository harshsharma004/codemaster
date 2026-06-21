import { Router } from 'express';
import { 
  listGroups, createGroup, topGroups, listJoinRequests, 
  acceptJoinRequest, rejectJoinRequest, requestJoinGroup, 
  deleteGroup, addGroupMembers, removeGroupMember 
} from '../controllers/groups.controller';
import { requireAuth } from '../middleware/auth.middleware';

import { addProblem, listGroupProblems, removeGroupProblem } from '../controllers/problems.controller';
import { groupAnalytics } from '../controllers/analytics.controller';

const router = Router();

router.use(requireAuth);

router.get('/', listGroups);
router.post('/', createGroup);
router.get('/top', topGroups);

router.get('/join-requests', listJoinRequests);
router.post('/join-requests/:requestID/accept', acceptJoinRequest);
router.post('/join-requests/:requestID/reject', rejectJoinRequest);

router.post('/:groupID/join', requestJoinGroup);
router.delete('/:groupID', deleteGroup);
router.post('/:groupID/members', addGroupMembers);
router.delete('/:groupID/members/:userID', removeGroupMember);

router.get('/:groupID/problems', listGroupProblems);
router.post('/:groupID/problems', addProblem);
router.delete('/:groupID/problems/:problemID', removeGroupProblem);

router.get('/:groupID/analytics', groupAnalytics);

export default router;
