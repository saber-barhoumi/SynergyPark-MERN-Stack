const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

class SocketServer {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: Token missing'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('Authentication error: Invalid user'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: ' + error.message));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.username} (${socket.userId})`);
      
      // Store socket mapping
      this.userSockets.set(socket.userId, socket.id);
      this.socketUsers.set(socket.id, socket.userId);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Handle user going online
      this.handleUserOnline(socket);

      // Handle joining conversation
      socket.on('join_conversation', (conversationId) => {
        this.handleJoinConversation(socket, conversationId);
      });

      // Handle leaving conversation
      socket.on('leave_conversation', (conversationId) => {
        this.handleLeaveConversation(socket, conversationId);
      });

      // Handle typing indicator
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Handle message reactions
      socket.on('message_reaction', async (data) => {
        await this.handleMessageReaction(socket, data);
      });

      // Handle voice/video call requests
      socket.on('call_request', (data) => {
        this.handleCallRequest(socket, data);
      });

      socket.on('call_response', (data) => {
        this.handleCallResponse(socket, data);
      });

      socket.on('call_end', (data) => {
        this.handleCallEnd(socket, data);
      });

      // Handle screen sharing
      socket.on('screen_share_start', (data) => {
        this.handleScreenShareStart(socket, data);
      });

      socket.on('screen_share_stop', (data) => {
        this.handleScreenShareStop(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleUserOnline(socket) {
    // Notify other users that this user is online
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.user.username,
      timestamp: new Date()
    });
  }

  handleJoinConversation(socket, conversationId) {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
  }

  handleLeaveConversation(socket, conversationId) {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.user.username} left conversation ${conversationId}`);
  }

  handleTypingStart(socket, data) {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username,
      conversationId,
      isTyping: true
    });
  }

  handleTypingStop(socket, data) {
    const { conversationId } = data;
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.user.username,
      conversationId,
      isTyping: false
    });
  }

  async handleMessageReaction(socket, data) {
    try {
      const { messageId, emoji, action } = data;
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Verify user is part of conversation
      const conversation = await Conversation.findById(message.conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      if (action === 'add') {
        await message.addReaction(socket.userId, emoji);
      } else if (action === 'remove') {
        await message.removeReaction(socket.userId);
      }

      // Broadcast reaction to conversation
      this.io.to(`conversation_${message.conversationId}`).emit('message_reaction_updated', {
        messageId,
        reactions: message.reactions
      });

    } catch (error) {
      console.error('Error handling message reaction:', error);
      socket.emit('error', { message: 'Failed to update reaction' });
    }
  }

  handleCallRequest(socket, data) {
    const { targetUserId, callType } = data;
    
    // Send call request to target user
    const targetSocketId = this.userSockets.get(targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('incoming_call', {
        fromUserId: socket.userId,
        fromUsername: socket.user.username,
        callType, // 'voice' or 'video'
        timestamp: new Date()
      });
    }
  }

  handleCallResponse(socket, data) {
    const { fromUserId, accepted, callType } = data;
    
    // Send response back to caller
    const callerSocketId = this.userSockets.get(fromUserId);
    if (callerSocketId) {
      this.io.to(callerSocketId).emit('call_response', {
        fromUserId: socket.userId,
        accepted,
        callType,
        timestamp: new Date()
      });
    }
  }

  handleCallEnd(socket, data) {
    const { targetUserId, callType } = data;
    
    // Notify target user that call ended
    const targetSocketId = this.userSockets.get(targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('call_ended', {
        fromUserId: socket.userId,
        callType,
        timestamp: new Date()
      });
    }
  }

  handleScreenShareStart(socket, data) {
    const { conversationId } = data;
    
    // Notify other users in conversation
    socket.to(`conversation_${conversationId}`).emit('screen_share_started', {
      userId: socket.userId,
      username: socket.user.username,
      conversationId,
      timestamp: new Date()
    });
  }

  handleScreenShareStop(socket, data) {
    const { conversationId } = data;
    
    // Notify other users in conversation
    socket.to(`conversation_${conversationId}`).emit('screen_share_stopped', {
      userId: socket.userId,
      username: socket.user.username,
      conversationId,
      timestamp: new Date()
    });
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.user.username} (${socket.userId})`);
    
    // Remove socket mappings
    this.userSockets.delete(socket.userId);
    this.socketUsers.delete(socket.id);

    // Notify other users that this user is offline
    socket.broadcast.emit('user_offline', {
      userId: socket.userId,
      username: socket.user.username,
      timestamp: new Date()
    });
  }

  // Method to send message to specific conversation
  sendMessageToConversation(conversationId, event, data) {
    this.io.to(`conversation_${conversationId}`).emit(event, data);
  }

  // Method to send message to specific user
  sendMessageToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Method to broadcast to all users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Method to get online users
  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  // Method to check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }
}

module.exports = SocketServer; 