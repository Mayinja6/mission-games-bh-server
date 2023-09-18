import express from 'express';

import {
  deleteAUserById,
  fetchAllUsers,
  getAUserById,
  signInAUser,
  signOutAUser,
  signUpAUser,
  updateAUserById,
} from '../controllers/users.js';
import { loginRequired } from '../utils/middleware.js';

const router = express.Router();

router.route('/').get(fetchAllUsers).post(signUpAUser);

router
  .post('/login/', signInAUser)
  .post('/logout/', loginRequired, signOutAUser);

router
  .route('/profile')
  .get(loginRequired, getAUserById)
  .patch(loginRequired, updateAUserById)
  .delete(loginRequired, deleteAUserById);

export default router;
