const express = require('express')
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')
const {
  createTaskHandler,
  listTasksHandler,
  getTaskHandler,
  approveTaskHandler,
  rejectTaskHandler,
  completeTaskHandler,
  addCommentHandler,
  addAttachmentHandler
} = require('../controllers/taskController')

const router = express.Router()

router.post('/', authMiddleware, createTaskHandler)
router.get('/', authMiddleware, listTasksHandler)
router.get('/:id', authMiddleware, getTaskHandler)

router.post('/:id/approve', authMiddleware, roleMiddleware(['admin']), approveTaskHandler)
router.post('/:id/reject', authMiddleware, roleMiddleware(['admin']), rejectTaskHandler)
router.post('/:id/complete', authMiddleware, completeTaskHandler)

router.post('/:id/comments', authMiddleware, addCommentHandler)
router.post('/:id/attachments', authMiddleware, addAttachmentHandler)

module.exports = router
