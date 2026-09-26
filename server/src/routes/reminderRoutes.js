const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  subscribePush,
  sendTestPush,
  checkDueReminders,
} = require('../controllers/reminderController');

// All reminder routes are protected with JWT
router.use(protect);

router.route('/')
  .get(getReminders)
  .post(createReminder);

router.route('/:id')
  .put(updateReminder)
  .delete(deleteReminder);

router.post('/subscribe', subscribePush);
router.post('/test-push', sendTestPush);
router.post('/trigger-check', checkDueReminders);

module.exports = router;
