import apiService from './apiService';

class MessagingService {
  // Get all conversations for the authenticated user
  async getConversations() {
    try {
      const response = await apiService.get('/api/messaging/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get or create conversation with a specific user
  async getOrCreateConversation(participantId) {
    try {
      const response = await apiService.get(`/api/messaging/conversations/${participantId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId) {
    try {
      const response = await apiService.get(`/api/messaging/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(messageData) {
    try {
      const response = await apiService.post('/api/messaging/messages', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      const response = await apiService.put(`/api/messaging/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(messageId, emoji) {
    try {
      const response = await apiService.post(`/api/messaging/messages/${messageId}/reactions`, { emoji });
      return response.data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from message
  async removeReaction(messageId) {
    try {
      const response = await apiService.delete(`/api/messaging/messages/${messageId}/reactions`);
      return response.data;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Delete message (soft delete)
  async deleteMessage(messageId) {
    try {
      const response = await apiService.delete(`/api/messaging/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Get users for chat (startups and experts)
  async getChatUsers(role = 'ALL', search = '') {
    try {
      const params = new URLSearchParams();
      if (role !== 'ALL') params.append('role', role);
      if (search) params.append('search', search);
      
      const response = await apiService.get(`/api/messaging/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat users:', error);
      throw error;
    }
  }

  // Get startups only
  async getStartups(search = '') {
    return this.getChatUsers('STARTUP', search);
  }

  // Get experts only
  async getExperts(search = '') {
    return this.getChatUsers('EXPERT', search);
  }

  // Get S2T users only
  async getS2TUsers(search = '') {
    return this.getChatUsers('S2T', search);
  }
}

export default new MessagingService(); 