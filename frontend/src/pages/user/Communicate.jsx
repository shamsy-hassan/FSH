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
    try {
      // This would require a user search endpoint
      // For now, we'll mock this functionality
      console.log('Searching for users:', query);
      // In a real implementation, you would call an API endpoint to search users
      const mockUsers = [
        { id: 2, username: 'farmer_john', type: 'user', avatar: '👨‍🌾' },
        { id: 3, username: 'agriculture_expert', type: 'expert', avatar: '👨‍🔬' },
        { id: 4, username: 'admin_support', type: 'admin', avatar: '👨‍💼' },
        { id: 5, username: 'seed_supplier', type: 'supplier', avatar: '👨‍💼' },
        { id: 6, username: 'organic_farmer', type: 'user', avatar: '👩‍🌾' }
      ];
      setAvailableUsers(mockUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase())
      ));
    } catch (err) {
      console.error('Error searching users:', err);
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
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await agriConnectAPI.message.sendMessage(selectedConversation.id, newMessage);
      setNewMessage('');
      fetchMessages(selectedConversation.id); // Refresh messages
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
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
          <div className="flex items-center justify-between">
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
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
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
        {selectedConversation ? (
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
                  const isCurrentUser = message.sender_id === agriConnectAPI.getUserId();
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'ml-12' : 'mr-12'}`}>
                        {!isCurrentUser && showAvatar && (
                          <div className="flex items-end space-x-2 mb-1">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                              {getConversationAvatar(selectedConversation)}
                            </div>
                            <span className="text-xs text-gray-500">{formatTime(message.sent_at)}</span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        {isCurrentUser && (
                          <div className="flex items-center justify-end space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{formatTime(message.sent_at)}</span>
                            <span className="text-xs text-gray-500">
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
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">Welcome to Messages</h2>
              <p className="text-gray-500 mb-6">Select a conversation or start a new one to begin messaging</p>
              <button 
                onClick={() => setShowNewConversation(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Conversation
              </button>
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