const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { User } = require('../models/User');

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.getUserConversations(userId);
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message
    });
  }
};

// Get or create conversation between two users
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { participantId } = req.params;
    const userId = req.user.id;

    if (userId === participantId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.getConversation(userId, participantId);

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userId, participantId],
        conversationType: 'PRIVATE'
      });
      await conversation.save();
    }

    // Populate participant details
    await conversation.populate('participants', 'firstName lastName profilePhoto role');
    await conversation.populate('lastMessage');

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get/create conversation',
      error: error.message
    });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
    .populate('sender', 'firstName lastName profilePhoto role')
    .populate('replyTo')
    .sort({ createdAt: 1 })
    .limit(100);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    // Update conversation unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${userId}`]: 0 }
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType = 'TEXT', mediaUrl, fileName, fileSize, location, replyTo } = req.body;
    const userId = req.user.id;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Create message
    const message = new Message({
      conversationId,
      sender: userId,
      content,
      messageType,
      mediaUrl,
      fileName,
      fileSize,
      location,
      replyTo
    });

    await message.save();

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${conversation.participants.find(p => p.toString() !== userId)}`]: 1 }
    });

    // Populate sender details
    await message.populate('sender', 'firstName lastName profilePhoto role');
    await message.populate('replyTo');

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    await message.addReaction(userId, emoji);

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this message'
      });
    }

    await message.removeReaction(userId);

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction',
      error: error.message
    });
  }
};

// Delete message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their own message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Can only delete your own messages'
      });
    }

    await message.softDelete();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

// Get users for chat (startups and experts)
exports.getChatUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, search } = req.query;

    let query = {
      _id: { $ne: userId },
      isActive: true
    };

    // Filter by role if specified
    if (role && role !== 'ALL') {
      query.role = role;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('firstName lastName profilePhoto role email phone department position')
      .sort({ firstName: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting chat users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat users',
      error: error.message
    });
  }
}; 