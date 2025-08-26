import React, { useEffect, useState, useRef } from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { Link, useLocation } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import "react-modal-video/scss/modal-video.scss";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import ChatService from "../../services/chatService";
import { useAuth } from "../../contexts/AuthContext";

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: 'STARTUP' | 'ADMIN' | 'USER' | 'MANAGER';
  phone?: string;
  country?: string;
  position?: string;
  avatar?: string;
  profilePhoto?: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
  messageType: 'text' | 'file' | 'voice' | 'emoji' | 'system';
  content: {
    text?: string;
    emoji?: string;
    systemMessage?: string;
  };
  attachments: Array<{
    type: 'file' | 'voice' | 'image';
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    duration?: number;
  }>;
  createdAt: string;
  deliveryStatus: 'sent' | 'delivered' | 'read';
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
}

interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  participants: Array<{
    userId: {
      _id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      avatar?: string;
      role: string;
      isActive: boolean;
    };
    isActive: boolean;
    lastSeenAt: string;
  }>;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  unreadCount: Array<{
    userId: string;
    count: number;
  }>;
  updatedAt: string;
}

interface ChatUser {
  user: User;
  conversation?: Conversation;
  lastMessage?: Message;
  unreadCount: number;
  isOnline: boolean;
  lastSeen: Date;
  lastMessageTime: Date;
}

const Chat = () => {
  const useBodyClass = (className: string) => {
    const location = useLocation();

    useEffect(() => {
      if (location.pathname === "/application/chat") {
        document.body.classList.add(className);
      } else {
        document.body.classList.remove(className);
      }
      return () => {
        document.body.classList.remove(className);
      };
    }, [location.pathname, className]);
  };
  useBodyClass("app-chat");

  const routes = all_routes;
  const { user: currentUser } = useAuth();
  
  // State management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<string>("0:00");
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  
  // UI Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const audioChunks = useRef<Blob[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Cleanup audio elements on unmount
  useEffect(() => {
    const currentAudioRefs = audioRefs.current;
    const currentTimer = recordingTimer.current;
    return () => {
      Object.values(currentAudioRefs).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      if (currentTimer) {
        clearInterval(currentTimer);
      }
    };
  }, []);

  // Sanitize message to ensure proper structure
  const sanitizeMessage = (message: any): Message => {
    console.log('Raw message from backend:', message);
    
    // Handle case where content might be a string (JSON) that needs parsing
    let content = message.content;
    console.log('Original content:', content, 'Type:', typeof content);
    
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
        console.log('Parsed content:', content);
      } catch (e) {
        // If parsing fails, treat as text content
        content = { text: content };
        console.log('Parse failed, using as text:', content);
      }
    }

    const sanitized = {
      _id: message._id || Date.now().toString(),
      conversationId: message.conversationId || '',
      senderId: {
        _id: message.senderId?._id || message.senderId || '',
        firstName: message.senderId?.firstName || '',
        lastName: message.senderId?.lastName || '',
        email: message.senderId?.email || '',
        avatar: message.senderId?.avatar || ''
      },
      messageType: message.messageType || 'text',
      content: {
        text: content?.text || (message.messageType === 'text' ? content || '' : ''),
        emoji: content?.emoji || '',
        systemMessage: content?.systemMessage || ''
      },
      attachments: message.attachments || [],
      createdAt: message.createdAt || new Date().toISOString(),
      deliveryStatus: message.deliveryStatus || 'sent',
      isEdited: message.isEdited || false,
      isDeleted: message.isDeleted || false
    };
    
    console.log('Sanitized message:', sanitized);
    return sanitized;
  };

  // Get user avatar or default
  const getUserAvatar = (user: User | null): string => {
    if (!user) return 'assets/img/profiles/avatar-29.jpg';
    
    if (user.avatar) {
      return user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`;
    }
    if (user.profilePhoto) {
      return user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`;
    }
    return 'assets/img/profiles/avatar-29.jpg';
  };

  // Get user display name
  const getUserDisplayName = (user: User | null): string => {
    if (!user) return 'Select a user';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email.split('@')[0];
  };

  // Load selected user from sessionStorage and fetch data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load selected user from sessionStorage
        const storedUser = sessionStorage.getItem('selectedChatUser');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setSelectedUser(userData);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }

        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found. Using mock data for demo.');
          // Create mock users for demo when not authenticated
          const mockUsers: User[] = [
            {
              _id: '1',
              email: 'john.doe@example.com',
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              role: 'USER',
              phone: '+1234567890',
              country: 'USA'
            },
            {
              _id: '2', 
              email: 'jane.smith@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
              username: 'janesmith',
              role: 'MANAGER',
              phone: '+1234567891',
              country: 'Canada'
            },
            {
              _id: '3',
              email: 'faten.meziou@example.com',
              firstName: 'Faten',
              lastName: 'Meziou',
              username: 'fatenmeziou',
              role: 'USER',
              phone: '+1234567892',
              country: 'Tunisia'
            }
          ];
          
          const chatUsersData: ChatUser[] = mockUsers.map((user: User, index: number) => {
            // Create varied unread counts for demo
            const unreadCount = index === 0 ? 3 : index === 1 ? 0 : 2;
            const lastMessageTime = new Date(Date.now() - (index * 2 * 60 * 60 * 1000)); // Stagger times
            
            return {
              user,
              unreadCount,
              isOnline: Math.random() > 0.5,
              lastSeen: new Date(Date.now() - Math.random() * 86400000),
              lastMessageTime,
              // Add mock last message for users with unread counts
              lastMessage: unreadCount > 0 ? {
                _id: `mock-${index}`,
                conversationId: `conv-${index}`,
                senderId: {
                  _id: user._id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  avatar: ''
                },
                messageType: 'text' as const,
                content: {
                  text: index === 0 ? 'Hey! How are you doing?' : 'Can we schedule a meeting?',
                  emoji: '',
                  systemMessage: ''
                },
                attachments: [],
                createdAt: lastMessageTime.toISOString(),
                deliveryStatus: 'delivered' as const,
                isEdited: false,
                isDeleted: false
              } : undefined
            };
          });
          
          setChatUsers(chatUsersData);
          setLoading(false);
          return;
        }

        try {
          // Initialize chat service with token
          ChatService.token = token;
          
          // Fetch users for chat list
          const usersResponse = await ChatService.getUsers();
          const users = usersResponse || [];
          
          // Also fetch existing conversations
          const conversationsResponse = await ChatService.getConversations();
          const userConversations = conversationsResponse || [];
          
          // Convert users to chat users format
          const chatUsersData: ChatUser[] = users.map((user: any) => {
            const existingConversation = userConversations.find((conv: Conversation) => 
              conv.type === 'direct' && 
              conv.participants.some(p => p.userId._id === user._id)
            );
            
            const unreadCount = existingConversation?.unreadCount.find(
              (uc: any) => uc.userId === currentUser?.id
            )?.count || 0;
            
            // Get the last message time for sorting
            const lastMessageTime = existingConversation?.lastMessage?.createdAt || 
                                  existingConversation?.updatedAt || 
                                  user.createdAt || 
                                  new Date(Date.now() - Math.random() * 86400000);
            
            return {
              user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar
              },
              conversation: existingConversation,
              unreadCount,
              isOnline: user.isActive && Math.random() > 0.3, // Simulate online status
              lastSeen: new Date(Date.now() - Math.random() * 86400000),
              lastMessageTime: new Date(lastMessageTime),
              lastMessage: existingConversation?.lastMessage
            };
          });

          // Sort chat users: unread messages first, then by last message time
          chatUsersData.sort((a, b) => {
            // First priority: unread messages
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
            
            // Second priority: last message time (most recent first)
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
          });
          
          setChatUsers(chatUsersData);
        } catch (error) {
          console.error('Error fetching chat data from API, using mock data:', error);
          // Fallback to mock data if API fails
          const mockUsers: User[] = [
            {
              _id: '1',
              email: 'faten.meziou@example.com',
              firstName: 'Faten',
              lastName: 'Meziou',
              username: 'fatenmeziou',
              role: 'USER'
            },
            {
              _id: '2',
              email: 'john.doe@example.com',
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              role: 'MANAGER'
            }
          ];
          
          const chatUsersData: ChatUser[] = mockUsers.map((user: User) => ({
            user,
            unreadCount: Math.floor(Math.random() * 3),
            isOnline: Math.random() > 0.5,
            lastSeen: new Date(Date.now() - Math.random() * 86400000),
            lastMessageTime: new Date(Date.now() - Math.random() * 86400000)
          }));
          
          setChatUsers(chatUsersData);
        }
        
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [currentUser]);

  // Load messages for selected user
  const loadMessagesForUser = React.useCallback(async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // No token, show empty conversation
        setMessages([]);
        return;
      }

      // Get or create conversation
      const conversation = await ChatService.createDirectConversation(userId);
      setCurrentConversation(conversation);
      
      // Load messages for this conversation
      console.log('Loading messages for conversation:', conversation._id);
      const messagesData = await ChatService.getMessages(conversation._id);
      console.log('Raw messages data from backend:', messagesData);
      
      const formattedMessages = (messagesData.messages || []).map(sanitizeMessage);
      console.log('Formatted messages after sanitization:', formattedMessages);
      
      setMessages(formattedMessages);
      
      // Mark conversation as read
      if (formattedMessages.length > 0) {
        await ChatService.markAsRead(conversation._id);
      }
      
    } catch (error) {
      console.error('Error loading messages:', error);
      // Set empty messages on error
      setMessages([]);
    }
  }, [currentUser]);

  // Load messages for selected user
  useEffect(() => {
    if (selectedUser) {
      loadMessagesForUser(selectedUser._id);
    }
  }, [selectedUser, loadMessagesForUser]);

  // Filter and sort chat users based on search term
  const filteredChatUsers = React.useMemo(() => {
    const filtered = chatUsers.filter(chatUser => 
      getUserDisplayName(chatUser.user).toLowerCase().includes(searchTerm.toLowerCase()) ||
      chatUser.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort filtered results: unread messages first, then by last message time
    return filtered.sort((a, b) => {
      // First priority: unread messages
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // Second priority: last message time (most recent first)
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }, [chatUsers, searchTerm]);

  // Handle user selection for chat
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    sessionStorage.setItem('selectedChatUser', JSON.stringify(user));
    
    // Mark conversation as read and update unread count
    setChatUsers(prevUsers => 
      prevUsers.map(chatUser => 
        chatUser.user._id === user._id 
          ? { ...chatUser, unreadCount: 0 }
          : chatUser
      )
    );
  };

  // Update chat user with new message
  const updateChatUserWithNewMessage = React.useCallback((message: Message, isCurrentUserSender: boolean = false) => {
    const targetUserId = isCurrentUserSender ? 
      (selectedUser?._id) : 
      message.senderId._id;
      
    if (!targetUserId) return;

    setChatUsers(prevUsers => {
      const updatedUsers = prevUsers.map(chatUser => {
        if (chatUser.user._id === targetUserId) {
          return {
            ...chatUser,
            lastMessage: message,
            lastMessageTime: new Date(message.createdAt),
            // Only increment unread count if message is from another user and not currently selected
            unreadCount: isCurrentUserSender || chatUser.user._id === selectedUser?._id ? 
              chatUser.unreadCount : 
              chatUser.unreadCount + 1
          };
        }
        return chatUser;
      });

      // Sort updated users: unread messages first, then by last message time
      return updatedUsers.sort((a, b) => {
        // First priority: unread messages
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        
        // Second priority: last message time (most recent first)
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    });
  }, [selectedUser]);

  // Handle view profile
  const handleViewProfile = () => {
    if (!selectedUser) {
      setModalMessage('Please select a user first');
      setModalType('info');
      return;
    }
    setShowProfileModal(true);
  };

  // Handle add to group
  const handleAddToGroup = () => {
    if (!selectedUser) {
      setModalMessage('Please select a user first');
      setModalType('info');
      return;
    }
    setShowGroupModal(true);
  };

  // Handle block user
  const handleBlockUser = () => {
    if (!selectedUser) {
      setModalMessage('Please select a user first');
      setModalType('info');
      return;
    }
    setShowBlockModal(true);
  };

  // Confirm block user
  const confirmBlockUser = () => {
    if (!selectedUser) return;
    
    // Add user to blocked list
    setBlockedUsers(prev => [...prev, selectedUser]);
    
    // Remove user from chat list
    setChatUsers(prevUsers => 
      prevUsers.filter(chatUser => chatUser.user._id !== selectedUser._id)
    );
    
    // Clear selected user and messages
    setSelectedUser(null);
    setMessages([]);
    setCurrentConversation(null);
    sessionStorage.removeItem('selectedChatUser');
    
    setModalMessage(`Blocked ${getUserDisplayName(selectedUser)} successfully`);
    setModalType('success');
    setShowBlockModal(false);
  };

  // Handle unblock user
  const handleUnblockUser = (userToUnblock: User) => {
    setBlockedUsers(prev => prev.filter(user => user._id !== userToUnblock._id));
    setModalMessage(`Unblocked ${getUserDisplayName(userToUnblock)} successfully`);
    setModalType('success');
    setShowUnblockModal(false);
  };

  // Handle delete conversation
  const handleDeleteConversation = () => {
    if (!selectedUser) {
      setModalMessage('Please select a user first');
      setModalType('info');
      return;
    }
    setShowDeleteModal(true);
  };

  // Confirm delete conversation
  const confirmDeleteConversation = () => {
    if (!selectedUser) return;
    
    // Remove conversation from chat list
    setChatUsers(prevUsers => 
      prevUsers.filter(chatUser => chatUser.user._id !== selectedUser._id)
    );
    
    // Clear selected user and messages
    setSelectedUser(null);
    setMessages([]);
    setCurrentConversation(null);
    sessionStorage.removeItem('selectedChatUser');
    
    setModalMessage(`Conversation with ${getUserDisplayName(selectedUser)} deleted successfully`);
    setModalType('success');
    setShowDeleteModal(false);
  };

  // Handle search in messages
  const handleMessageSearch = () => {
    setShowMessageSearch(!showMessageSearch);
    if (!showMessageSearch) {
      setMessageSearchTerm("");
    }
  };

  // Filter messages based on search term
  const filteredMessages = React.useMemo(() => {
    if (!messageSearchTerm.trim()) {
      return messages;
    }
    
    return messages.filter(message => 
      message.content?.text?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
      message.content?.emoji?.includes(messageSearchTerm) ||
      (message.attachments && message.attachments.some(att => 
        att.fileName?.toLowerCase().includes(messageSearchTerm.toLowerCase())
      ))
    );
  }, [messages, messageSearchTerm]);

  // Highlight search terms in message text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404',
          padding: '2px 4px',
          borderRadius: '3px',
          fontWeight: 'bold'
        }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Handle sending new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser || isSending) return;

    setIsSending(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token available - using demo mode');
        // Demo mode - create temporary message
        const tempMessage: Message = {
          _id: Date.now().toString(),
          conversationId: 'demo',
          senderId: {
            _id: currentUser.id,
            firstName: currentUser.firstName || 'You',
            lastName: currentUser.lastName || '',
            email: currentUser.email,
            avatar: currentUser.avatar
          },
          messageType: 'text',
          content: { text: newMessage },
          attachments: [],
          createdAt: new Date().toISOString(),
          deliveryStatus: 'sent',
          isEdited: false,
          isDeleted: false
        };

        setMessages(prev => [...prev, tempMessage]);
        
        // Update chat user list with new message (demo mode)
        if (selectedUser) {
          updateChatUserWithNewMessage(tempMessage, true);
        }
        
        setNewMessage("");
        setIsSending(false);
        return;
      }

      // Get or create conversation first
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await ChatService.createDirectConversation(selectedUser._id);
        setCurrentConversation(conversation);
      }

      if (!conversation) {
        throw new Error('No conversation available');
      }

      // Send message via API
      console.log('Sending message with params:', {
        conversationId: conversation._id,
        messageType: 'text',
        content: { text: newMessage }
      });
      
      const sentMessage = await ChatService.sendMessage(
        conversation._id,
        'text',
        { text: newMessage }
      );
      
      console.log('Received response from backend:', sentMessage);
      
      // Add message to state with sanitization
      const sanitizedMessage = sanitizeMessage(sentMessage);
      setMessages(prev => [...prev, sanitizedMessage]);
      
      // Update chat user list with new message
      updateChatUserWithNewMessage(sanitizedMessage, true);
      
      setNewMessage("");
      
    } catch (error) {
      console.error('Error sending message:', error);
      setModalMessage('Failed to send message. Please try again.');
      setModalType('error');
    } finally {
      setIsSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser || !currentUser || isSending) return;

    setIsSending(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token available - file upload not supported in demo mode');
        setModalMessage('File upload requires authentication. Please log in.');
        setModalType('info');
        setIsSending(false);
        return;
      }

      // Get or create conversation first
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await ChatService.createDirectConversation(selectedUser._id);
        setCurrentConversation(conversation);
      }

      if (!conversation) {
        throw new Error('No conversation available');
      }

      // Send file via API - using the correct method from ChatService
      const formData = new FormData();
      formData.append('file', file);
      
      const sentMessage = await ChatService.sendMessage(
        conversation._id, 
        'file', 
        { text: `Shared a file: ${file.name}` }, 
        [file]
      );
      
      // Add message to state with sanitization
      const sanitizedMessage = sanitizeMessage(sentMessage);
      setMessages(prev => [...prev, sanitizedMessage]);
      
      // Update chat user list with new message
      updateChatUserWithNewMessage(sanitizedMessage, true);
      
    } catch (error) {
      console.error('Error sending file:', error);
      setModalMessage('Failed to send file. Please try again.');
      setModalType('error');
    } finally {
      setIsSending(false);
      event.target.value = '';
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser || !currentUser || isSending) return;

    setIsSending(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token available - image upload not supported in demo mode');
        setModalMessage('Image upload requires authentication. Please log in.');
        setModalType('info');
        setIsSending(false);
        return;
      }

      // Get or create conversation first
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await ChatService.createDirectConversation(selectedUser._id);
        setCurrentConversation(conversation);
      }

      if (!conversation) {
        throw new Error('No conversation available');
      }

      // Send image via API
      const sentMessage = await ChatService.sendMessage(
        conversation._id, 
        'file', 
        { text: `Shared an image: ${file.name}` }, 
        [file]
      );
      
      // Add message to state with sanitization
      const sanitizedMessage = sanitizeMessage(sentMessage);
      setMessages(prev => [...prev, sanitizedMessage]);
      
      // Update chat user list with new message
      updateChatUserWithNewMessage(sanitizedMessage, true);
      
    } catch (error) {
      console.error('Error sending image:', error);
      setModalMessage('Failed to send image. Please try again.');
      setModalType('error');
    } finally {
      setIsSending(false);
      event.target.value = '';
    }
  };

  // Handle voice recording
  const handleVoiceRecording = async () => {
    if (!selectedUser || !currentUser || isSending) return;

    if (!isRecording) {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        
        audioChunks.current = [];
        setMediaRecorder(recorder);
        const startTime = Date.now();
        startRecordingTimer(startTime);
        setIsRecording(true);
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          
          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Send voice message via API if authenticated
          const token = localStorage.getItem('token');
          if (token && currentConversation) {
            try {
              setIsSending(true);
              
              // Create a File object from the blob
              const audioFile = new File([audioBlob], 'voice_recording.wav', { type: 'audio/wav' });
              
              const sentMessage = await ChatService.sendMessage(
                currentConversation._id,
                'file',
                { text: 'Voice message' },
                [audioFile]
              );
              
              const sanitizedMessage = sanitizeMessage(sentMessage);
              setMessages(prev => [...prev, sanitizedMessage]);
              
              // Update chat user list with new message
              updateChatUserWithNewMessage(sanitizedMessage, true);
            } catch (error) {
              console.error('Error sending voice message:', error);
              setModalMessage('Failed to send voice message. Please try again.');
              setModalType('error');
            } finally {
              setIsSending(false);
            }
          } else {
            // Demo mode - create temporary message
            const audioUrl = URL.createObjectURL(audioBlob);
            const tempMessage: Message = {
              _id: Date.now().toString(),
              conversationId: 'demo',
              senderId: {
                _id: currentUser.id,
                firstName: currentUser.firstName || 'You',
                lastName: currentUser.lastName || '',
                email: currentUser.email,
                avatar: currentUser.avatar
              },
              messageType: 'file',
              content: { text: 'Voice message' },
              attachments: [{
                type: 'voice',
                fileName: 'voice_recording.wav',
                filePath: audioUrl,
                fileSize: audioBlob.size,
                mimeType: 'audio/wav',
                duration: Math.floor((Date.now() - startTime) / 1000)
              }],
              createdAt: new Date().toISOString(),
              deliveryStatus: 'sent',
              isEdited: false,
              isDeleted: false
            };

            setMessages(prev => [...prev, tempMessage]);
            
            // Update chat user list with new message (demo mode)
            if (selectedUser) {
              updateChatUserWithNewMessage(tempMessage, true);
            }
          }
        };

        recorder.start();
        console.log('Starting voice recording...');
        
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setModalMessage('Microphone access denied. Please enable microphone permissions and try again.');
        setModalType('error');
        setIsRecording(false);
        stopRecordingTimer();
      }
    } else {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      setIsRecording(false);
      stopRecordingTimer();
      setMediaRecorder(null);
      console.log('Stopping voice recording...');
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  // Format last seen
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Handle audio playback
  const handleAudioPlayback = (messageId: string, audioUrl?: string) => {
    // If no audio URL, show message that it's a demo
    if (!audioUrl) {
      setModalMessage('This is a demo voice message. No actual audio file available.');
      setModalType('info');
      return;
    }

    if (playingAudio === messageId) {
      // Pause current audio
      const audio = audioRefs.current[messageId];
      if (audio) {
        audio.pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = audioRefs.current[playingAudio];
        if (currentAudio) {
          currentAudio.pause();
        }
      }

      // Create or get audio element
      if (!audioRefs.current[messageId]) {
        audioRefs.current[messageId] = new Audio(audioUrl);
        audioRefs.current[messageId].addEventListener('ended', () => {
          setPlayingAudio(null);
        });
        audioRefs.current[messageId].addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setPlayingAudio(null);
          setModalMessage('Error playing audio file.');
          setModalType('error');
        });
      }

      // Play new audio
      try {
        audioRefs.current[messageId].play().catch((error) => {
          console.error('Audio play failed:', error);
          setPlayingAudio(null);
          setModalMessage('Unable to play audio file.');
          setModalType('error');
        });
        setPlayingAudio(messageId);
      } catch (error) {
        console.error('Audio playback error:', error);
        setPlayingAudio(null);
      }
    }
  };

  // Handle file download
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle image transfer/share
  const handleImageTransfer = async (imageUrl: string, fileName: string) => {
    try {
      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share({
          title: 'Shared Image',
          text: `Sharing image: ${fileName}`,
          url: imageUrl
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(imageUrl);
        setModalMessage('Image URL copied to clipboard!');
        setModalType('success');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      // Additional fallback: create a sharing modal or copy URL
      const shareText = `Check out this image: ${imageUrl}`;
      await navigator.clipboard.writeText(shareText);
      setModalMessage('Image link copied to clipboard!');
      setModalType('success');
    }
  };

  // Get recording duration for display
  const getRecordingDuration = () => {
    return recordingDuration;
  };

  // Start recording timer
  const startRecordingTimer = (startTime: number) => {
    setRecordingDuration('0:00');
    
    recordingTimer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setRecordingDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
  };

  // Stop recording timer
  const stopRecordingTimer = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    setRecordingDuration('0:00');
  };

  return (
    <>
      {/* Loading Animation Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Page Header */}
          <div className="page-header">
            <div className="row">
              <div className="col-sm-12">
                <ul className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <i className="feather-chevron-right" />
                  </li>
                  <li className="breadcrumb-item active">Chat</li>
                </ul>
              </div>
            </div>
          </div>
          {/* /Page Header */}
          
          <div className="row">
            <div className="col-lg-12">
              <CollapseHeader />
            </div>
          </div>
          
          <div className="chat-wrapper">
            {/* Chats sidebar */}
            <div className="sidebar-group">
              <div id="chats" className="sidebar-content active slimscroll">
                <Scrollbars>
                  <div className="chat-search-header">
                    <div className="header-title d-flex align-items-center justify-content-between">
                      <h4 className="mb-3">Chats</h4>
                    </div>
                    {/* Chat Search */}
                    <div className="search-wrap">
                      <form action="#" onSubmit={(e) => e.preventDefault()}>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search For Contacts or Messages"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <span className="input-group-text">
                            <i className="ti ti-search" />
                          </span>
                        </div>
                      </form>
                    </div>
                    {/* /Chat Search */}
                  </div>
                  
                  <div className="sidebar-body chat-body" id="chatsidebar">
                    {/* Left Chat Title */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="chat-title">All Chats</h5>
                    </div>
                    {/* /Left Chat Title */}
                    
                    <div className="chat-users-wrap">
                      <div className="chat-list">
                        {loading ? (
                          <div className="text-center p-3">
                            <div className="spinner-border text-primary" role="status">
                              <span className="sr-only">Loading...</span>
                            </div>
                          </div>
                        ) : filteredChatUsers.length > 0 ? (
                          filteredChatUsers.map((chatUser) => (
                            <div key={chatUser.user._id} className="d-flex align-items-center position-relative mb-2">
                              <Link 
                                to="#"
                                className={`chat-user-list flex-grow-1 ${selectedUser?._id === chatUser.user._id ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleUserSelect(chatUser.user);
                                }}
                              >
                                <div className={`avatar avatar-lg ${chatUser.isOnline ? 'online' : 'offline'} me-2`}>
                                  <ImageWithBasePath
                                    src={getUserAvatar(chatUser.user)}
                                    className="rounded-circle"
                                    alt="image"
                                  />
                                </div>
                                <div className="chat-user-info">
                                  <div className="chat-user-msg">
                                    <h6 style={{ 
                                      fontWeight: chatUser.unreadCount > 0 ? 'bold' : 'normal',
                                      color: chatUser.unreadCount > 0 ? '#333' : '#666'
                                    }}>
                                      {getUserDisplayName(chatUser.user)}
                                    </h6>
                                    <p style={{ 
                                      fontWeight: chatUser.unreadCount > 0 ? '500' : 'normal',
                                      color: chatUser.unreadCount > 0 ? '#555' : '#888'
                                    }}>
                                      {chatUser.lastMessage ? (
                                        // Show last message preview
                                        <span>
                                          {chatUser.lastMessage.messageType === 'file' ? (
                                            <>
                                              <i className="ti ti-paperclip me-1"></i>
                                              {chatUser.lastMessage.content?.text || 'Attachment'}
                                            </>
                                          ) : chatUser.lastMessage.messageType === 'emoji' ? (
                                            chatUser.lastMessage.content?.emoji || '😊'
                                          ) : (
                                            chatUser.lastMessage.content?.text?.substring(0, 30) + 
                                            (chatUser.lastMessage.content?.text && chatUser.lastMessage.content.text.length > 30 ? '...' : '') ||
                                            'No message'
                                          )}
                                        </span>
                                      ) : chatUser.isOnline ? (
                                        <span className="text-success">Online</span>
                                      ) : (
                                        <span className="text-muted">
                                          Last seen {formatLastSeen(chatUser.lastSeen)}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="chat-user-time">
                                    <span className="time" style={{ fontSize: '12px' }}>
                                      {chatUser.lastMessage ? 
                                        formatLastSeen(new Date(chatUser.lastMessage.createdAt)) :
                                        formatLastSeen(chatUser.lastSeen)
                                      }
                                    </span>
                                    {chatUser.unreadCount > 0 && (
                                      <div className="badge bg-primary rounded-pill" style={{
                                        fontSize: '11px',
                                        minWidth: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '4px'
                                      }}>
                                        {chatUser.unreadCount > 99 ? '99+' : chatUser.unreadCount}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-3">
                            <p className="text-muted">
                              {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Scrollbars>
              </div>
            </div>
            {/* /Chats sidebar */}

            {/* Chat */}
            <div className="chat chat-messages" id="middle">
              <div className="slimscroll">
                <Scrollbars>
                  <div className="chat-header">
                    <div className="user-details">
                      <div className="d-lg-flex">
                        <div className="avatar avatar-lg online me-2">
                          <ImageWithBasePath
                            src={getUserAvatar(selectedUser)}
                            className="rounded-circle"
                            alt="image"
                          />
                        </div>
                        <div className="mt-1">
                          <h6>{getUserDisplayName(selectedUser)}</h6>
                          <p className="last-seen">
                            {selectedUser ? (
                              chatUsers.find(cu => cu.user._id === selectedUser._id)?.isOnline ? (
                                <span className="text-success">Online</span>
                              ) : (
                                <span>Last Seen at {formatLastSeen(new Date())}</span>
                              )
                            ) : (
                              'Select a user to start chatting'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="chat-options">
                      <ul>
                        <li>
                          <Link
                            className="btn"
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#video-call"
                          >
                            <i className="ti ti-phone" />
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="btn"
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#video-call"
                          >
                            <i className="ti ti-video" />
                          </Link>
                        </li>
                        <li>
                          <button 
                            className="btn" 
                            type="button"
                            onClick={handleMessageSearch}
                            style={{ 
                              background: showMessageSearch ? '#e3f2fd' : 'transparent',
                              color: showMessageSearch ? '#2563eb' : 'inherit'
                            }}
                          >
                            <i className="ti ti-search" />
                          </button>
                        </li>
                        <li className="dropdown">
                          <Link
                            to="#"
                            className="dropdown-toggle btn"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical" />
                          </Link>
                          <div className="dropdown-menu dropdown-menu-end p-3">
                            <button 
                              type="button" 
                              className="dropdown-item" 
                              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                              onClick={handleViewProfile}
                            >
                              <i className="ti ti-user-check me-2" />
                              View Profile
                            </button>
                            <button 
                              type="button" 
                              className="dropdown-item" 
                              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                              onClick={handleAddToGroup}
                            >
                              <i className="ti ti-users me-2" />
                              Add to Group
                            </button>
                            <button 
                              type="button" 
                              className="dropdown-item" 
                              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                              onClick={handleBlockUser}
                            >
                              <i className="ti ti-ban me-2" />
                              Block
                            </button>
                            {blockedUsers.length > 0 && (
                              <button 
                                type="button" 
                                className="dropdown-item" 
                                style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                                onClick={() => setShowUnblockModal(true)}
                              >
                                <i className="ti ti-user-plus me-2" />
                                Unblock Users
                              </button>
                            )}
                            <button 
                              type="button" 
                              className="dropdown-item" 
                              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                              onClick={handleDeleteConversation}
                            >
                              <i className="ti ti-trash me-2" />
                              Delete
                            </button>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Message Search Bar */}
                  {showMessageSearch && (
                    <div style={{
                      padding: '10px 15px',
                      borderBottom: '1px solid #e4e7ea',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search in messages..."
                          value={messageSearchTerm}
                          onChange={(e) => setMessageSearchTerm(e.target.value)}
                          style={{
                            border: '1px solid #ddd',
                            borderRadius: '20px',
                            padding: '8px 15px'
                          }}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setMessageSearchTerm("")}
                          style={{
                            borderRadius: '0 20px 20px 0',
                            border: '1px solid #ddd',
                            marginLeft: '-1px'
                          }}
                        >
                          <i className="ti ti-x" />
                        </button>
                      </div>
                      {messageSearchTerm && (
                        <small className="text-muted mt-1 d-block">
                          Found {filteredMessages.length} message(s)
                        </small>
                      )}
                    </div>
                  )}
                  
                  <div className="chat-body slimscroll">
                    <div className="messages">
                      {selectedUser ? (
                        filteredMessages.length > 0 ? (
                          filteredMessages.filter(message => message && message._id).map((message) => (
                            <div
                              key={message._id}
                              className={`chats ${message.senderId._id === currentUser?.id ? 'chats-right' : ''}`}
                            >
                              <div className="chat-avatar">
                                <ImageWithBasePath
                                  src={message.senderId._id === currentUser?.id ? 
                                    getUserAvatar(currentUser as any) : 
                                    (message.senderId.avatar ? 
                                      (message.senderId.avatar.startsWith('http') ? 
                                        message.senderId.avatar : 
                                        `http://localhost:5000${message.senderId.avatar}`
                                      ) : 
                                      'assets/img/profiles/avatar-29.jpg'
                                    )
                                  }
                                  className="rounded-circle dreams_chat"
                                  alt="image"
                                />
                              </div>
                              <div className="chat-content">
                                <div className="chat-profile-name">
                                  <h6>
                                    {message.senderId._id === currentUser?.id ? 
                                      'You' : 
                                      getUserDisplayName({
                                        _id: message.senderId._id,
                                        email: message.senderId.email,
                                        firstName: message.senderId.firstName,
                                        lastName: message.senderId.lastName,
                                        role: 'USER'
                                      } as User)
                                    }
                                    <span>{formatTimestamp(new Date(message.createdAt))}</span>
                                    {/* Message Status Indicator */}
                                    {message.senderId._id === currentUser?.id && (
                                      <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                        {message.deliveryStatus === 'sent' && (
                                          <i className="ti ti-check" style={{ color: '#666' }} title="Sent"></i>
                                        )}
                                        {message.deliveryStatus === 'delivered' && (
                                          <i className="ti ti-checks" style={{ color: '#2563eb' }} title="Delivered"></i>
                                        )}
                                        {message.deliveryStatus === 'read' && (
                                          <i className="ti ti-checks" style={{ color: '#10b981' }} title="Read"></i>
                                        )}
                                      </span>
                                    )}
                                  </h6>
                                </div>
                                <div className="message-content">
                                  {message.messageType === 'text' && (
                                    messageSearchTerm ? 
                                      highlightSearchTerm(message.content?.text || 'Message content unavailable', messageSearchTerm) :
                                      (message.content?.text || 'Message content unavailable')
                                  )}
                                  {message.messageType === 'emoji' && message.content?.emoji}
                                  {message.messageType === 'file' && (
                                    messageSearchTerm ?
                                      highlightSearchTerm(
                                        message.content?.text || 
                                        (message.attachments && message.attachments.length > 0 ? 
                                          `Shared ${message.attachments[0].type}: ${message.attachments[0].fileName}` : 
                                          'Shared a file'
                                        ),
                                        messageSearchTerm
                                      ) :
                                      (message.content?.text || 
                                        (message.attachments && message.attachments.length > 0 ? 
                                          `Shared ${message.attachments[0].type}: ${message.attachments[0].fileName}` : 
                                          'Shared a file'
                                        )
                                      )
                                  )}
                                  {message.attachments && message.attachments.length > 0 && message.attachments.map((attachment, index) => (
                                    <div key={index}>
                                      {attachment.type === 'image' && (
                                        <div style={{ position: 'relative' }}>
                                          <img 
                                            src={`http://localhost:5000${attachment.filePath}`}
                                            alt={attachment.fileName}
                                            style={{ 
                                              maxWidth: '200px', 
                                              maxHeight: '200px', 
                                              borderRadius: '8px',
                                              display: 'block'
                                            }}
                                          />
                                          <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            marginTop: '5px'
                                          }}>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#666', flex: 1 }}>
                                              {attachment.fileName}
                                            </p>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                              {/* Download Button */}
                                              <button
                                                onClick={() => handleFileDownload(`http://localhost:5000${attachment.filePath}`, attachment.fileName)}
                                                style={{
                                                  background: 'rgba(37, 99, 235, 0.1)',
                                                  border: '1px solid rgba(37, 99, 235, 0.2)',
                                                  borderRadius: '4px',
                                                  padding: '4px 8px',
                                                  cursor: 'pointer',
                                                  color: '#2563eb',
                                                  fontSize: '12px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '3px'
                                                }}
                                                title="Download image"
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.2)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)'}
                                              >
                                                <i className="ti ti-download" style={{ fontSize: '14px' }}></i>
                                                <span>Download</span>
                                              </button>
                                              
                                              {/* Transfer/Share Button */}
                                              <button
                                                onClick={() => handleImageTransfer(`http://localhost:5000${attachment.filePath}`, attachment.fileName)}
                                                style={{
                                                  background: 'rgba(16, 185, 129, 0.1)',
                                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                                  borderRadius: '4px',
                                                  padding: '4px 8px',
                                                  cursor: 'pointer',
                                                  color: '#10b981',
                                                  fontSize: '12px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '3px'
                                                }}
                                                title="Share image"
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'}
                                              >
                                                <i className="ti ti-share" style={{ fontSize: '14px' }}></i>
                                                <span>Share</span>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {attachment.type === 'file' && (
                                        <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'space-between',
                                          padding: '10px', 
                                          backgroundColor: '#f0f0f0', 
                                          borderRadius: '8px',
                                          maxWidth: '250px'
                                        }}>
                                          <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <i className="ti ti-file-text" style={{ fontSize: '24px', marginRight: '10px', color: '#666' }}></i>
                                            <div>
                                              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{attachment.fileName}</p>
                                              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>File ({(attachment.fileSize / 1024).toFixed(1)} KB)</p>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => handleFileDownload(`http://localhost:5000${attachment.filePath}`, attachment.fileName)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              cursor: 'pointer',
                                              padding: '5px',
                                              borderRadius: '4px',
                                              color: '#2563eb'
                                            }}
                                            title="Download file"
                                          >
                                            <i className="ti ti-download" style={{ fontSize: '18px' }}></i>
                                          </button>
                                        </div>
                                      )}
                                      {attachment.type === 'voice' && (
                                        <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          padding: '10px', 
                                          backgroundColor: '#e3f2fd', 
                                          borderRadius: '8px',
                                          maxWidth: '200px'
                                        }}>
                                          <button
                                            onClick={() => handleAudioPlayback(message._id, `http://localhost:5000${attachment.filePath}`)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              cursor: 'pointer',
                                              marginRight: '10px',
                                              color: '#2563eb',
                                              fontSize: '24px'
                                            }}
                                            title={playingAudio === message._id ? 'Pause' : 'Play'}
                                          >
                                            <i className={playingAudio === message._id ? "ti ti-player-pause" : "ti ti-player-play"}></i>
                                          </button>
                                          <div>
                                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Voice Message</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                              {attachment.duration ? `${Math.floor(attachment.duration / 60)}:${(attachment.duration % 60).toString().padStart(2, '0')}` : 'Audio recording'}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4">
                            {messageSearchTerm ? (
                              // No search results
                              <>
                                <div style={{ marginBottom: '20px' }}>
                                  <i className="ti ti-search-off" style={{ fontSize: '48px', color: '#ddd' }}></i>
                                </div>
                                <h5 style={{ color: '#666', marginBottom: '10px' }}>No messages found</h5>
                                <p className="text-muted">
                                  No messages match your search for "{messageSearchTerm}"
                                </p>
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => setMessageSearchTerm("")}
                                >
                                  Clear search
                                </button>
                              </>
                            ) : (
                              // No messages at all
                              <>
                                <div style={{ marginBottom: '20px' }}>
                                  <i className="ti ti-message-circle" style={{ fontSize: '48px', color: '#ddd' }}></i>
                                </div>
                                <h5 style={{ color: '#666', marginBottom: '10px' }}>Start a conversation</h5>
                                <p className="text-muted">
                                  Send a message to {getUserDisplayName(selectedUser)} to begin your chat!
                                </p>
                              </>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-muted">Select a user to start chatting</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Scrollbars>
              </div>
              
              {/* Chat Footer */}
              <div className="chat-footer">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px',
                  backgroundColor: '#fff',
                  borderTop: '1px solid #e4e7ea'
                }}>
                  <div className="smile-foot" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    
                    
                    {/* Emoji Button */}
                    <div className="smile-foot-emoj" style={{ position: 'relative' }}>
                      <button 
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                        disabled={isSending}
                        style={{
                          width: '38px',
                          height: '38px',
                          backgroundColor: showEmojiPicker ? '#e3f2fd' : '#f8f9fa',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: isSending ? 'not-allowed' : 'pointer',
                          color: showEmojiPicker ? '#2563eb' : '#666',
                          opacity: isSending ? 0.5 : 1
                        }}
                      >
                        <i className="ti ti-mood-smile" />
                      </button>
                      
                      {/* Simple Emoji Picker */}
                      {showEmojiPicker && !isSending && (
                        <div 
                          ref={emojiPickerRef}
                          style={{
                            position: 'absolute',
                            bottom: '50px',
                            left: '0',
                            backgroundColor: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '10px',
                            zIndex: 1000,
                            minWidth: '200px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px' }}>
                            {['😀', '😊', '😂', '🥰', '😍', '🤔', '😎', '👍', '👏', '🎉', '❤️', '💯'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiSelect(emoji)}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '20px',
                                  cursor: 'pointer',
                                  padding: '5px',
                                  borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Voice Recording Button */}
                    <div className="smile-foot-box">
                      {isRecording ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#ff4444',
                          borderRadius: '20px',
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          <i className="ti ti-microphone" style={{ marginRight: '8px' }}></i>
                          Recording... {getRecordingDuration()}
                          <button 
                            type="button"
                            onClick={handleVoiceRecording}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              marginLeft: '8px',
                              padding: '2px',
                              borderRadius: '2px'
                            }}
                            title="Stop recording"
                          >
                            <i className="ti ti-square" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={handleVoiceRecording}
                          disabled={!selectedUser || isSending}
                          style={{
                            width: '38px',
                            height: '38px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: (selectedUser && !isSending) ? 'pointer' : 'not-allowed',
                            color: '#666',
                            opacity: (!selectedUser || isSending) ? 0.5 : 1
                          }}
                          title="Record voice message"
                        >
                          <i className="ti ti-microphone" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="chat-action-btns">
                      <div className="chat-action-col">
                        <button
                          type="button"
                          className="action-circle"
                          data-bs-toggle="dropdown"
                          disabled={isSending}
                          style={{
                            width: '38px',
                            height: '38px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: isSending ? 'not-allowed' : 'pointer',
                            color: '#666',
                            opacity: isSending ? 0.5 : 1
                          }}
                        >
                          <i className="ti ti-plus" />
                        </button>
                        <div className="dropdown-menu dropdown-menu-end p-3">
                          <label className="dropdown-item" style={{ cursor: 'pointer' }}>
                            <i className="ti ti-file-text me-2" />
                            Document
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={handleFileUpload}
                              style={{ display: 'none' }}
                              disabled={isSending}
                            />
                          </label>
                          <label className="dropdown-item" style={{ cursor: 'pointer' }}>
                            <i className="ti ti-photo-up me-2" />
                            Gallery
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                              disabled={isSending}
                            />
                          </label>
                          <button type="button" className="dropdown-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}>
                            <i className="ti ti-camera-selfie me-2" />
                            Camera
                          </button>
                          <button type="button" className="dropdown-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}>
                            <i className="ti ti-music me-2" />
                            Audio
                          </button>
                          <button type="button" className="dropdown-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}>
                            <i className="ti ti-map-pin-share me-2" />
                            Location
                          </button>
                          <button type="button" className="dropdown-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}>
                            <i className="ti ti-user-check me-2" />
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  
                  <div className="smile-foot-text" style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="form-control chat_form"
                      placeholder={isSending ? "Sending..." : "Type your message here..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!selectedUser || isSending}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '25px',
                        padding: '10px 15px',
                        width: '100%',
                        opacity: isSending ? 0.7 : 1
                      }}
                    />
                  </div>
                  
                  <div className="form-btn">
                    <button 
                      className="btn btn-primary" 
                      type="submit"
                      disabled={!selectedUser || !newMessage.trim() || isSending}
                      style={{
                        borderRadius: '50%',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        backgroundColor: (!selectedUser || !newMessage.trim() || isSending) ? '#ccc' : '#2563eb',
                        cursor: (!selectedUser || !newMessage.trim() || isSending) ? 'not-allowed' : 'pointer'
                      }}
                      title={isSending ? 'Sending...' : 'Send message'}
                    >
                      {isSending ? (
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid #fff',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      ) : (
                        <i className="ti ti-send" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {/* /Chat */}
          </div>
        </div>
      </div>
      
      {/* Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Profile</h5>
                <button type="button" className="btn-close" onClick={() => setShowProfileModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <img 
                    src={getUserAvatar(selectedUser)} 
                    alt="Profile" 
                    className="rounded-circle" 
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                </div>
                <div className="row">
                  <div className="col-12 mb-2">
                    <strong>👤 Name:</strong> {getUserDisplayName(selectedUser)}
                  </div>
                  <div className="col-12 mb-2">
                    <strong>📧 Email:</strong> {selectedUser.email}
                  </div>
                  <div className="col-12 mb-2">
                    <strong>🏷️ Role:</strong> {selectedUser.role}
                  </div>
                  {selectedUser.phone && (
                    <div className="col-12 mb-2">
                      <strong>📞 Phone:</strong> {selectedUser.phone}
                    </div>
                  )}
                  {selectedUser.country && (
                    <div className="col-12 mb-2">
                      <strong>🌍 Country:</strong> {selectedUser.country}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add to Group</h5>
                <button type="button" className="btn-close" onClick={() => setShowGroupModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Add <strong>{getUserDisplayName(selectedUser)}</strong> to group:</p>
                <div className="list-group">
                  {['Development Team', 'Marketing Team', 'HR Team', 'Management'].map((group, index) => (
                    <button 
                      key={index}
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        setModalMessage(`✅ Added ${getUserDisplayName(selectedUser)} to ${group}`);
                        setModalType('success');
                        setShowGroupModal(false);
                      }}
                    >
                      {group}
                    </button>
                  ))}
                  <button 
                    className="list-group-item list-group-item-action text-primary"
                    onClick={() => {
                      const groupName = prompt('Enter new group name:');
                      if (groupName && groupName.trim()) {
                        setModalMessage(`✅ Created new group "${groupName.trim()}" and added ${getUserDisplayName(selectedUser)}`);
                        setModalType('success');
                        setShowGroupModal(false);
                      }
                    }}
                  >
                    <i className="ti ti-plus me-2"></i>Create New Group...
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGroupModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Block User</h5>
                <button type="button" className="btn-close" onClick={() => setShowBlockModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to block <strong>{getUserDisplayName(selectedUser)}</strong>?</p>
                <div className="alert alert-warning">
                  <strong>This action will:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Hide their messages from your chat list</li>
                    <li>Prevent them from sending you new messages</li>
                    <li>Remove this conversation from your active chats</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBlockModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmBlockUser}>
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Users Modal */}
      {showUnblockModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Blocked Users</h5>
                <button type="button" className="btn-close" onClick={() => setShowUnblockModal(false)}></button>
              </div>
              <div className="modal-body">
                {blockedUsers.length > 0 ? (
                  <div className="list-group">
                    {blockedUsers.map((user) => (
                      <div key={user._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <img 
                            src={getUserAvatar(user)} 
                            alt="Profile" 
                            className="rounded-circle me-3" 
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                          <div>
                            <strong>{getUserDisplayName(user)}</strong>
                            <br />
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </div>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleUnblockUser(user)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No blocked users</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUnblockModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Conversation</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete your conversation with <strong>{getUserDisplayName(selectedUser)}</strong>?</p>
                <div className="alert alert-danger">
                  <strong>Warning:</strong>
                  <ul className="mb-0 mt-2">
                    <li>This will permanently delete all messages in this conversation</li>
                    <li>The conversation will be removed from your chat list</li>
                    <li>This action cannot be undone!</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDeleteConversation}>
                  Delete Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error/Info Toast */}
      {modalMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className={`alert alert-${modalType === 'success' ? 'success' : modalType === 'error' ? 'danger' : 'info'} alert-dismissible fade show`}>
            {modalMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setModalMessage("")}
            ></button>
          </div>
        </div>
      )}
      {/* /Page Wrapper */}
    </>
  );
};

export default Chat;
