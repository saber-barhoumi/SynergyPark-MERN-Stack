const socketAuth = require('../middleware/socketAuth');
const ChatMessage = require('../models/ChatMessage');
const Conversation = require('../models/Conversation');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map();    // socketId -> userId
    this.typingUsers = new Map();    // conversationId -> Set of userIds
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(socketAuth);
    
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.userId} connected`);
      
      // Store user connection
      this.connectedUsers.set(socket.user.userId, socket.id);
      this.userSockets.set(socket.id, socket.user.userId);
      
      // Join user to their conversations
      this.joinUserConversations(socket);
      
      // Handle socket events
      this.handleSocketEvents(socket);
      
      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async joinUserConversations(socket) {
    try {
      const conversations = await Conversation.find({
        'participants.userId': socket.user.userId,
        'participants.isActive': true
      });
      
      conversations.forEach(conversation => {
        socket.join(`conversation_${conversation._id}`);
      });
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }
  }

  handleSocketEvents(socket) {
    // Join conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.user.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user.userId} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        await this.handleNewMessage(socket, data);
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        await this.handleAddReaction(socket, data);
      } catch (error) {
        socket.emit('reaction_error', { error: error.message });
      }
    });

    // Handle message read status
    socket.on('mark_as_read', async (data) => {
      try {
        await this.handleMarkAsRead(socket, data);
      } catch (error) {
        socket.emit('read_error', { error: error.message });
      }
    });

    // Handle online status
    socket.on('update_status', (status) => {
      socket.broadcast.emit('user_status_update', {
        userId: socket.user.userId,
        status: status,
        timestamp: new Date()
      });
    });
  }

  async handleNewMessage(socket, data) {
    const { conversationId, messageType, content, replyTo, attachments } = data;
    
    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': socket.user.userId,
      'participants.isActive': true
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    // Create message
    const messageData = {
      conversationId,
      senderId: socket.user.userId,
      messageType: messageType || 'text',
      content: content || {},
      attachments: attachments || []
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    const message = new ChatMessage(messageData);
    await message.save();

    // Update conversation
    await conversation.updateLastMessage(message);

    // Populate message for broadcasting
    await message.populate('senderId', 'firstName lastName avatar email role');
    if (message.replyTo) {
      await message.populate('replyTo', 'content senderId createdAt');
    }

    // Broadcast to conversation participants
    this.io.to(`conversation_${conversationId}`).emit('new_message', {
      message,
      conversationId
    });

    // Send delivery confirmations to online users
    const onlineParticipants = conversation.participants.filter(p => 
      p.userId.toString() !== socket.user.userId && 
      this.connectedUsers.has(p.userId.toString())
    );

    onlineParticipants.forEach(participant => {
      const participantSocketId = this.connectedUsers.get(participant.userId.toString());
      if (participantSocketId) {
        this.io.to(participantSocketId).emit('message_delivered', {
          messageId: message._id,
          conversationId,
          deliveredAt: new Date()
        });
      }
    });

    // Clear typing indicators for sender
    this.handleTypingStop(socket, { conversationId });
  }

  handleTypingStart(socket, { conversationId }) {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    this.typingUsers.get(conversationId).add(socket.user.userId);
    
    // Broadcast typing status to other participants
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.user.userId,
      conversationId,
      isTyping: true
    });

    // Auto-stop typing after 3 seconds
    setTimeout(() => {
      this.handleTypingStop(socket, { conversationId });
    }, 3000);
  }

  handleTypingStop(socket, { conversationId }) {
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId).delete(socket.user.userId);
      
      if (this.typingUsers.get(conversationId).size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }
    
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.user.userId,
      conversationId,
      isTyping: false
    });
  }

  async handleAddReaction(socket, { messageId, emoji }) {
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.userId.toString() === socket.user.userId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.userId.toString() === socket.user.userId && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        emoji,
        userId: socket.user.userId
      });
    }

    await message.save();
    await message.populate('reactions.userId', 'firstName lastName avatar');

    // Broadcast reaction update
    this.io.to(`conversation_${message.conversationId}`).emit('reaction_updated', {
      messageId,
      reactions: message.reactions
    });
  }

  async handleMarkAsRead(socket, { conversationId, messageIds }) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': socket.user.userId
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Mark conversation as read
    await conversation.markAsRead(socket.user.userId);

    // Mark specific messages as read if provided
    if (messageIds && messageIds.length > 0) {
      await ChatMessage.updateMany(
        { 
          _id: { $in: messageIds },
          conversationId,
          'readBy.userId': { $ne: socket.user.userId }
        },
        {
          $push: {
            readBy: {
              userId: socket.user.userId,
              readAt: new Date()
            }
          },
          deliveryStatus: 'read'
        }
      );
    }

    // Broadcast read status to conversation participants
    socket.to(`conversation_${conversationId}`).emit('messages_read', {
      userId: socket.user.userId,
      conversationId,
      messageIds: messageIds || [],
      readAt: new Date()
    });
  }

  handleDisconnect(socket) {
    const userId = this.userSockets.get(socket.id);
    
    if (userId) {
      console.log(`User ${userId} disconnected`);
      
      // Remove from connected users
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);
      
      // Clear typing indicators
      this.typingUsers.forEach((typingSet, conversationId) => {
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          this.io.to(`conversation_${conversationId}`).emit('user_typing', {
            userId,
            conversationId,
            isTyping: false
          });
        }
      });
      
      // Broadcast offline status
      socket.broadcast.emit('user_status_update', {
        userId,
        status: 'offline',
        timestamp: new Date()
      });
    }
  }

  // Utility method to send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Get online users for a conversation
  getOnlineUsers(conversationId, participants) {
    return participants.filter(participant => 
      this.connectedUsers.has(participant.userId.toString())
    ).map(participant => participant.userId);
  }

  // Get typing users for a conversation
  getTypingUsers(conversationId) {
    return Array.from(this.typingUsers.get(conversationId) || []);
  }
}

module.exports = SocketManager;
