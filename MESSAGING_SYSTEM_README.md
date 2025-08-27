# 🚀 SynergyPark Messaging System

A comprehensive real-time messaging system for the Smart Tunisienne Technopark application, enabling seamless communication between Startups, Experts, and S2T team members.

## ✨ Features

### Core Messaging
- **Real-time Text Chat**: Instant messaging with typing indicators
- **User Management**: View and connect with Startups, Experts, and S2T team members
- **Conversation Management**: Automatic conversation creation and management
- **Message History**: Persistent message storage and retrieval

### Advanced Communication
- **Voice & Video Calls**: Built-in calling capabilities
- **Screen Sharing**: Collaborative screen sharing during conversations
- **File Sharing**: Support for images, videos, documents, and other file types
- **Message Reactions**: Emoji reactions to messages
- **Typing Indicators**: Real-time typing status

### Security & Privacy
- **End-to-End Encryption**: Secure message transmission
- **User Authentication**: JWT-based authentication system
- **Role-Based Access**: Different permissions for different user roles
- **Message Privacy**: Users can only access conversations they're part of

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
```
backend/
├── src/
│   ├── models/
│   │   ├── User.js          # User model with roles (STARTUP, EXPERT, S2T)
│   │   ├── Conversation.js  # Conversation management
│   │   └── Message.js       # Message storage and metadata
│   ├── controllers/
│   │   └── messagingController.js  # API endpoints for messaging
│   ├── routes/
│   │   └── messaging.js     # Messaging API routes
│   ├── socket.js            # Socket.IO server for real-time features
│   └── server.js            # Main server with Socket.IO integration
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── services/
│   │   ├── messagingService.js  # REST API calls for messaging
│   │   └── socketService.js     # Socket.IO client for real-time features
│   ├── feature-module/
│   │   ├── modals/
│   │   │   └── chatModal.tsx    # Main chat interface
│   │   └── crm/contacts/
│   │       └── contactGrid.tsx  # User listing with chat integration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create `.env` file):
   ```env
   MONGODB_URI=mongodb://localhost:27017/synergypark
   JWT_SECRET=your-secret-key-here
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## 📱 Usage

### For S2T Team Members
1. **View All Users**: See startups, experts, and other S2T team members
2. **Start Conversations**: Click the chat button on any user card
3. **Send Messages**: Type and send text messages in real-time
4. **Make Calls**: Initiate voice or video calls with users
5. **Share Files**: Upload and share documents, images, and videos

### For Startups
1. **Connect with S2T**: Get support and guidance from S2T team
2. **Consult Experts**: Ask technical and business questions
3. **Network**: Connect with other startups in the ecosystem
4. **Real-time Support**: Get instant responses to queries

### For Experts
1. **Provide Guidance**: Answer questions from startups
2. **Collaborate**: Work with S2T team on projects
3. **Share Knowledge**: Upload and share expertise materials
4. **Network**: Connect with other experts and startups

## 🔌 API Endpoints

### Messaging API
- `GET /api/messaging/conversations` - Get user conversations
- `GET /api/messaging/conversations/:participantId` - Get/create conversation
- `GET /api/messaging/conversations/:conversationId/messages` - Get messages
- `POST /api/messaging/messages` - Send message
- `PUT /api/messaging/messages/:messageId/read` - Mark as read
- `POST /api/messaging/messages/:messageId/reactions` - Add reaction
- `DELETE /api/messaging/messages/:messageId/reactions` - Remove reaction
- `DELETE /api/messaging/messages/:messageId` - Delete message
- `GET /api/messaging/users` - Get chat users

### Socket.IO Events
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `message_reaction` - Handle message reactions
- `call_request` - Request voice/video call
- `call_response` - Respond to call request
- `call_end` - End call
- `screen_share_start` - Start screen sharing
- `screen_share_stop` - Stop screen sharing

## 🎯 User Roles & Permissions

### STARTUP
- Can chat with S2T team members
- Can chat with Experts
- Can send messages, files, and make calls
- Limited to their own conversations

### EXPERT
- Can chat with Startups
- Can chat with S2T team members
- Can provide guidance and share expertise
- Access to relevant conversations

### S2T
- Can chat with all users
- Can send announcements and updates
- Full access to messaging system
- Can moderate conversations

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions per user role
- **Conversation Privacy**: Users can only access their conversations
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Protection against abuse
- **Secure File Uploads**: File type and size validation

## 🚀 Future Enhancements

- **AI-Powered Responses**: Smart reply suggestions
- **Advanced Analytics**: Message insights and metrics
- **Group Conversations**: Multi-user chat rooms
- **Message Translation**: Multi-language support
- **Advanced File Management**: Cloud storage integration
- **Mobile App**: Native mobile applications
- **Push Notifications**: Real-time alerts
- **Message Encryption**: Enhanced security features

## 🐛 Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check if backend server is running
   - Verify Socket.IO server configuration
   - Check CORS settings

2. **Messages Not Sending**
   - Verify user authentication
   - Check conversation permissions
   - Validate message format

3. **File Upload Issues**
   - Check file size limits
   - Verify file type restrictions
   - Ensure upload directory permissions

### Debug Mode
Enable debug logging by setting environment variables:
```env
DEBUG=socket.io:*
NODE_ENV=development
```

## 📞 Support

For technical support or questions about the messaging system:
- Check the logs for error messages
- Verify database connectivity
- Ensure all services are running
- Check network connectivity and firewall settings

## 📄 License

This project is part of the SynergyPark MERN Stack application.

---

**Built with ❤️ for Smart Tunisienne Technopark** 