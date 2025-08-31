import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Connect to Socket.IO server
  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      this.socket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 20000
      });

      this.setupEventHandlers();
      this.setupReconnectionHandling();
    } catch (error) {
      console.error('Error connecting to Socket.IO:', error);
      throw error;
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('user_connected', { timestamp: new Date() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to Socket.IO server after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to Socket.IO server');
      this.isConnected = false;
    });
  }

  // Setup reconnection handling
  setupReconnectionHandling() {
    if (!this.socket) return;

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      console.log(`Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
    });
  }

  // Disconnect from Socket.IO server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Listen for events from server
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected, cannot listen for event:', event);
      return;
    }

    // Store listener for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      // Remove all listeners for this event
      this.socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  // Join conversation room
  joinConversation(conversationId) {
    this.emit('join_conversation', { conversationId });
  }

  // Leave conversation room
  leaveConversation(conversationId) {
    this.emit('leave_conversation', { conversationId });
  }

  // Start typing indicator
  startTyping(conversationId) {
    this.emit('typing_start', { conversationId });
  }

  // Stop typing indicator
  stopTyping(conversationId) {
    this.emit('typing_stop', { conversationId });
  }

  // Add reaction to message
  addMessageReaction(messageId, emoji) {
    this.emit('message_reaction', { messageId, emoji, action: 'add' });
  }

  // Remove reaction from message
  removeMessageReaction(messageId) {
    this.emit('message_reaction', { messageId, action: 'remove' });
  }

  // Request voice call
  requestVoiceCall(targetUserId) {
    this.emit('call_request', { targetUserId, callType: 'voice' });
  }

  // Request video call
  requestVideoCall(targetUserId) {
    this.emit('call_request', { targetUserId, callType: 'video' });
  }

  // Respond to call request
  respondToCall(fromUserId, accepted, callType) {
    this.emit('call_response', { fromUserId, accepted, callType });
  }

  // End call
  endCall(targetUserId, callType) {
    this.emit('call_end', { targetUserId, callType });
  }

  // Start screen sharing
  startScreenShare(conversationId) {
    this.emit('screen_share_start', { conversationId });
  }

  // Stop screen sharing
  stopScreenShare(conversationId) {
    this.emit('screen_share_stop', { conversationId });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

export default new SocketService(); 