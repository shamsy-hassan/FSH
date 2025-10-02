// Communicate.jsx
import React, { useState, useEffect, useRef } from 'react';
import { agriConnectAPI } from '../../services/api';

function Communicate() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [aiChatActive, setAiChatActive] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      startMessagePolling();
    } else {
      stopMessagePolling();
    }

    return () => stopMessagePolling();
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  let pollingInterval;

  const startMessagePolling = () => {
    pollingInterval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.id, false); // Silent refresh
      }
    }, 3000); // Poll every 3 seconds
  };

  const stopMessagePolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await agriConnectAPI.message.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError('Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId, markAsRead = true) => {
    try {
      const data = await agriConnectAPI.message.getMessages(conversationId);
      setMessages(data.messages || []);

      // Mark unread messages as read
      if (markAsRead) {
        const unreadMessages = data.messages.filter(
          msg => !msg.is_read && msg.receiver_id === agriConnectAPI.getUserId()
        );
        
        for (const msg of unreadMessages) {
          await agriConnectAPI.message.markAsRead(msg.id);
        }
      }
    } catch (err) {
      setError('Failed to fetch messages');
      console.error('Error fetching messages:', err);
    }
  };

    const searchForUsers = async (query) => {
    if (!query || query.length < 2) {
      setAvailableUsers([]);
      return;
    }

    try {
      setSearchLoading(true);
      const data = await agriConnectAPI.user.searchUsers(query, 10);
      setAvailableUsers(data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setAvailableUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const showUsersList = async () => {
    setShowUserList(true);
    setShowNewConversation(false);
    setAiChatActive(false);
    setSelectedConversation(null);
    
    // Load all users immediately
    try {
      setSearchLoading(true);
      const data = await agriConnectAPI.user.searchUsers('', 50, true); // Get all users
      setAvailableUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setAvailableUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const startNewConversation = async (userId) => {
    try {
      const data = await agriConnectAPI.message.createConversation(userId);
      setSelectedConversation(data);
      setShowNewConversation(false);
      setSearchUsers('');
      setAvailableUsers([]);
      fetchConversations(); // Refresh conversations list
    } catch (err) {
      setError('Failed to start conversation');
      console.error('Error creating conversation:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (aiChatActive) {
      // Handle AI chat
      await sendAiMessage();
    } else if (selectedConversation) {
      // Handle regular user message
      try {
        await agriConnectAPI.message.sendMessage(selectedConversation.id, newMessage);
        setNewMessage('');
        fetchMessages(selectedConversation.id); // Refresh messages
      } catch (err) {
        setError('Failed to send message');
        console.error('Error sending message:', err);
      }
    }
  };

  const sendAiMessage = async () => {
    const userMessage = {
      id: Date.now(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setAiMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');

    // Simulate AI response (you can replace this with actual AI API)
    setTimeout(() => {
      const aiResponse = generateAiResponse(currentMessage);
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, aiMessage]);
    }, 1500);
  };

  const generateAiResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Simple rule-based responses for agriculture topics
    if (message.includes('crop') || message.includes('farming') || message.includes('planting')) {
      return "🌱 Great question about farming! For optimal crop growth, consider factors like soil quality, weather conditions, and proper irrigation. What specific crop are you planning to grow?";
    } else if (message.includes('weather') || message.includes('rain') || message.includes('drought')) {
      return "🌤️ Weather is crucial for farming success. I recommend checking our AgriClimate section for detailed weather forecasts and historical data for your region.";
    } else if (message.includes('market') || message.includes('sell') || message.includes('price')) {
      return "💰 For market information, check our Market section where you can see current prices and connect with buyers. You can also post your products there!";
    } else if (message.includes('loan') || message.includes('credit') || message.includes('sacco')) {
      return "🏦 Need financial support? Our SACCO section offers various loan products for farmers. You can apply for agricultural loans with competitive interest rates.";
    } else if (message.includes('storage') || message.includes('warehouse')) {
      return "🏪 For storage solutions, visit our Storage section where you can find nearby warehouses and request storage for your agricultural products.";
    } else if (message.includes('help') || message.includes('guide') || message.includes('how')) {
      return "🤝 I'm here to help! I can assist with:\n• Farming techniques and best practices\n• Market prices and selling opportunities\n• Weather information\n• SACCO loans and financial services\n• Storage solutions\n• General agricultural advice\n\nWhat would you like to know more about?";
    } else {
      return "🤖 Hello! I'm your AgriConnect AI Assistant. I'm here to help with farming advice, market information, weather updates, and connecting you with agricultural services. How can I assist you today?";
    }
  };

  const startAiChat = () => {
    setAiChatActive(true);
    setSelectedConversation(null);
    setShowNewConversation(false);
    setShowUserList(false);
    
    if (aiMessages.length === 0) {
      const welcomeMessage = {
        id: 1,
        content: "🌾 Welcome to AgriConnect AI Assistant! I'm here to help you with farming advice, market information, weather updates, and agricultural services. How can I assist you today?",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setAiMessages([welcomeMessage]);
    }
  };

  const getConversationName = (conversation) => {
    const currentUserId = agriConnectAPI.getUserId();
    if (conversation.user1_id === currentUserId) {
      return conversation.user2_name || `User ${conversation.user2_id}`;
    } else {
      return conversation.user1_name || `User ${conversation.user1_id}`;
    }
  };

  const getConversationAvatar = (conversation) => {
    const currentUserId = agriConnectAPI.getUserId();
    if (conversation.user1_id === currentUserId) {
      return conversation.user2_avatar || '👤';
    } else {
      return conversation.user1_avatar || '👤';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (today.toDateString() === messageDate.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === messageDate.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading messages...</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
            <button 
              onClick={() => setShowNewConversation(true)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={startAiChat}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                aiChatActive 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              🤖 AI Assistant
            </button>
            <button
              onClick={showUsersList}
              className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                showUserList 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              👥 Find Users
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {showUserList ? (
            /* User Search and List */
            <div className="p-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users by username..."
                  value={searchUsers}
                  onChange={(e) => {
                    setSearchUsers(e.target.value);
                    searchForUsers(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              {searchLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  <span className="text-sm text-gray-600 mt-2">Loading users...</span>
                </div>
              )}
              
              {!searchLoading && availableUsers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {searchUsers ? 'Search Results' : 'All Users'} ({availableUsers.length})
                  </h4>
                  {availableUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => startNewConversation(user.id)}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors border border-gray-200 hover:border-purple-300"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-lg">
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user.user_type}
                        </p>
                      </div>
                      <div className="text-purple-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!searchLoading && availableUsers.length === 0 && searchUsers && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No users found</p>
                  <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                </div>
              )}
              
              {!searchLoading && availableUsers.length === 0 && !searchUsers && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No users available</p>
                  <p className="text-sm text-gray-500 mt-1">There are no other users to chat with</p>
                </div>
              )}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">No conversations yet</p>
              <button 
                onClick={() => setShowNewConversation(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Conversation
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                      {getConversationAvatar(conversation)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {getConversationName(conversation)}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatDate(conversation.updated_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col">
        {aiChatActive ? (
          <>
            {/* AI Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setAiChatActive(false)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    AgriConnect AI Assistant
                  </h2>
                  <p className="text-sm text-green-600">Always available to help</p>
                </div>
              </div>
            </div>

            {/* AI Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {aiMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Message Input */}
            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me anything about farming, weather, markets, or loans..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : selectedConversation ? (
          <>
            {/* Messages Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                  {getConversationAvatar(selectedConversation)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getConversationName(selectedConversation)}
                  </h2>
                  <p className="text-sm text-gray-500">Online</p>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 极l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const currentUserId = agriConnectAPI.getUserId();
                  const isCurrentUser = message.sender_id === parseInt(currentUserId) || message.sender_id === currentUserId;
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'ml-12' : 'mr-12'}`}>
                        {!isCurrentUser && showAvatar && (
                          <div className="flex items-end space-x-2 mb-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                              {getConversationAvatar(selectedConversation)}
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{getConversationName(selectedConversation)}</span>
                            <span className="text-xs text-gray-400">{formatTime(message.sent_at)}</span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 shadow-sm ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                        {!isCurrentUser && !showAvatar && (
                          <div className="flex items-center justify-start space-x-2 mt-1 ml-2">
                            <span className="text-xs text-gray-400">{formatTime(message.sent_at)}</span>
                          </div>
                        )}
                        {isCurrentUser && (
                          <div className="flex items-center justify-end space-x-2 mt-1">
                            <span className="text-xs text-gray-400">{formatTime(message.sent_at)}</span>
                            <span className="text-xs text-blue-500">
                              {message.is_read ? '✓✓' : '✓'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">Welcome to AgriConnect Messages</h2>
              <p className="text-gray-500 mb-6">Connect with other farmers, get AI assistance, or start a new conversation</p>
              <div className="space-y-3">
                <button 
                  onClick={startAiChat}
                  className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  🤖 Chat with AI Assistant
                </button>
                <button 
                  onClick={showUsersList}
                  className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  👥 Find Users to Chat
                </button>
                <button 
                  onClick={() => setShowNewConversation(true)}
                  className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💬 View All Options
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Start New Conversation</h3>
                <button 
                  onClick={() => setShowNewConversation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => {
                    setSearchUsers(e.target.value);
                    searchForUsers(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => startNewConversation(user.id)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{user.username}</h4>
                      <p className="text-xs text-gray-500 capitalize">{user.type}</p>
                    </div>
                  </div>
                ))}
                
                {availableUsers.length === 0 && searchUsers && (
                  <p className="text-center text-gray-500 py-4">No users found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-800 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Communicate;