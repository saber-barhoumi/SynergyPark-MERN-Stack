import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Phone, Video, Share2, Paperclip, Mic, MessageCircle } from 'lucide-react';
import messagingService from '../../services/messagingService';
import socketService from '../../services/socketService';
import ImageWithBasePath from '../../core/common/imageWithBasePath';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  role: string;
  email: string;
  department?: string;
  position?: string;
}

interface Message {
  _id: string;
  conversationId: string;
  content: string;
  sender: User;
  messageType: string;
  mediaUrl?: string;
  fileName?: string;
  createdAt: string;
  isRead: boolean;
  reactions: Array<{
    user: string;
    emoji: string;
  }>;
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: Map<string, number>;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: User;
  currentUser: User;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, selectedUser, currentUser }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);


  const [isRecording, setIsRecording] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  // Load or create conversation
  const loadConversation = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await messagingService.getOrCreateConversation(userId);
      setConversation(response.data);
      
      // Load messages
      const messagesResponse = await messagingService.getMessages(response.data._id);
      setMessages(messagesResponse.data || []);
      
      // Join conversation room
      socketService.joinConversation(response.data._id);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      const messageData = {
        conversationId: conversation._id,
        content: newMessage.trim(),
        messageType: 'TEXT'
      };

      const response = await messagingService.sendMessage(messageData);
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };



  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !conversation) return;

    // Handle file upload logic here
    console.log('File selected:', file);
  };

  // Handle voice recording
  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  // Handle voice call
  const handleVoiceCall = () => {
    if (!selectedUser) return;
    socketService.requestVoiceCall(selectedUser._id);
    setIsCallActive(true);
  };

  // Handle video call
  const handleVideoCall = () => {
    if (!selectedUser) return;
    socketService.requestVideoCall(selectedUser._id);
    setIsCallActive(true);
  };

  // Handle screen sharing
  const toggleScreenSharing = () => {
    if (!conversation) return;
    
    if (isScreenSharing) {
      socketService.stopScreenShare(conversation._id);
      setIsScreenSharing(false);
    } else {
      socketService.startScreenShare(conversation._id);
      setIsScreenSharing(true);
    }
  };



  // Load conversation when selected user changes
  useEffect(() => {
    if (selectedUser) {
      loadConversation(selectedUser._id);
    }
  }, [selectedUser, loadConversation]);

  // Setup Socket.IO event listeners
  useEffect(() => {
    if (!conversation) return;

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };



    // Listen for message reactions
    const handleMessageReaction = (data: { messageId: string; reactions: any[] }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    };

    // Listen for incoming calls
    const handleIncomingCall = (data: { fromUserId: string; callType: string }) => {
      // Handle incoming call logic here
      console.log('Incoming call:', data);
    };

    // Setup listeners
    socketService.on('new_message', handleNewMessage);
    socketService.on('message_reaction_updated', handleMessageReaction);
    socketService.on('incoming_call', handleIncomingCall);

    // Cleanup listeners
    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_reaction_updated', handleMessageReaction);
      socketService.off('incoming_call', handleIncomingCall);
    };
  }, [conversation, currentUser._id]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            {selectedUser && (
              <>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <ImageWithBasePath
                    src={selectedUser.profilePhoto || 'assets/img/users/user-01.jpg'}
                    alt={selectedUser.firstName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{selectedUser.role}</p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedUser && (
              <>
                <button
                  onClick={handleVoiceCall}
                  className={`p-2 rounded-lg ${isCallActive ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
                  disabled={isCallActive}
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={handleVideoCall}
                  className={`p-2 rounded-lg ${isCallActive ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
                  disabled={isCallActive}
                >
                  <Video size={20} />
                </button>
                <button
                  onClick={toggleScreenSharing}
                  className={`p-2 rounded-lg ${isScreenSharing ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                  <Share2 size={20} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender._id === currentUser._id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {message.messageType === 'TEXT' && (
                            <p>{message.content}</p>
                          )}
                          {message.messageType === 'IMAGE' && (
                            <img src={message.mediaUrl} alt="Image" className="max-w-full rounded" />
                          )}
                          {message.messageType === 'FILE' && (
                            <div className="flex items-center space-x-2">
                              <Paperclip size={16} />
                              <span>{message.fileName}</span>
                            </div>
                          )}
                          
                          {/* Message reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              {message.reactions.map((reaction, index) => (
                                <span key={index} className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  

                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Paperclip size={20} />
                    </button>
                    
                    <button
                      onClick={toggleVoiceRecording}
                      className={`p-2 rounded-lg ${isRecording ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
                    >
                      <Mic size={20} />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No user selected for chat</p>
                  <p className="text-sm">Please select a user from the main page to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
      </div>
    </div>
  );
};

export default ChatModal; 