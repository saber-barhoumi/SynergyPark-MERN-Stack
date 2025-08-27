const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  conversationType: {
    type: String,
    enum: ['PRIVATE', 'GROUP'],
    default: 'PRIVATE'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Method to get conversation between two users
conversationSchema.statics.getConversation = function(user1Id, user2Id) {
  return this.findOne({
    participants: { $all: [user1Id, user2Id] },
    conversationType: 'PRIVATE'
  });
};

// Method to get all conversations for a user
conversationSchema.statics.getUserConversations = function(userId) {
  return this.find({
    participants: userId,
    isActive: true
  }).populate('participants', 'firstName lastName profilePhoto role')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });
};

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation; 