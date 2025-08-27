const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all conversations for the authenticated user
router.get('/conversations', messagingController.getConversations);

// Get or create conversation with a specific user
router.get('/conversations/:participantId', messagingController.getOrCreateConversation);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', messagingController.getMessages);

// Send a message
router.post('/messages', messagingController.sendMessage);

// Mark message as read
router.put('/messages/:messageId/read', messagingController.markMessageAsRead);

// Add reaction to message
router.post('/messages/:messageId/reactions', messagingController.addReaction);

// Remove reaction from message
router.delete('/messages/:messageId/reactions', messagingController.removeReaction);

// Delete message (soft delete)
router.delete('/messages/:messageId', messagingController.deleteMessage);

// Get users for chat (startups and experts)
router.get('/users', messagingController.getChatUsers);

module.exports = router; 