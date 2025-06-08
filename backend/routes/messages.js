const express = require('express');
const { 
  getConversations,
  getConversation,
  createConversation,
  getMessagesByConversation,
  sendMessage,
  markMessagesAsRead // Added markMessagesAsRead
} = require('../controllers/messageController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Conversation routes
router
  .route('/conversations')
  .get(protect, getConversations)
  .post(protect, createConversation);

router
  .route('/conversations/:id')
  .get(protect, getConversation);

router
  .route('/conversations/:conversationId/read') // New route for marking messages as read
  .post(protect, markMessagesAsRead);

// Message routes
router
  .route('/messages')
  .post(protect, sendMessage);

router
  .route('/messages/conversation/:conversationId')
  .get(protect, getMessagesByConversation);

module.exports = router;
