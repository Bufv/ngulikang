const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  listUsers,
  listTukang,
  createUser,
  updateUser,
  deleteUser,
  verifyTukang
} = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/users', listUsers);
router.get('/tukang', listTukang);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/tukang/:id/verify', verifyTukang);

module.exports = router;
