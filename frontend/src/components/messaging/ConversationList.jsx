import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import messageService from '../../services/messageService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const ConversationList = ({ onSelectConversation, selectedId }) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false); // To prevent multiple fetches at once from polling

  const fetchConversations = async (isPolling = false) => {
    if (isFetching && isPolling) return; // Skip polling if a fetch is already in progress

    setIsFetching(true);
    if (!isPolling) { // Only set loading true for initial fetch
      setLoading(true);
    }

    try {
      const response = await messageService.getConversations();
      setConversations(response.data.data);
      // setError(''); // Clear error on successful fetch
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Don't set global error for polling failures, could be transient
      if (!isPolling) {
        setError('Failed to load conversations. Please try again later.');
      } else {
        // Optionally, show a small, non-intrusive indicator for polling errors
        console.warn('Polling error for conversations:', err.message);
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
      setIsFetching(false);
    }
  };
  
  useEffect(() => {
    fetchConversations(false); // Initial fetch

    const intervalId = setInterval(() => {
      fetchConversations(true); // Polling fetch
    }, 15000); // Poll every 15 seconds

    return () => {
      clearInterval(intervalId); // Cleanup interval on component unmount
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount
  
  if (loading && conversations.length === 0) { // Show loading spinner only if no conversations are displayed yet
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No conversations yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        // Find the other participant (not the current user)
        const otherParticipant = conversation.participants.find(
          (p) => p._id !== currentUser._id
        );
        
        const unreadCount = conversation.unreadCount || 0;
        
        return (
          <button
            key={conversation._id}
            onClick={() => onSelectConversation(conversation._id)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedId === conversation._id
                ? 'bg-primary bg-opacity-10' // A lighter shade for selection
                : 'hover:bg-gray-100'
            } ${unreadCount > 0 ? 'font-semibold' : ''}`} // Make text bold if unread
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={otherParticipant?.profilePhoto ? `/uploads/profiles/${otherParticipant.profilePhoto}` : '/assets/default-profile.png'}
                  alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className={`truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                  </h4>
                  <span className={`text-xs ${unreadCount > 0 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                    {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    {' '}
                    {new Date(conversation.updatedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                
                <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-700 font-semibold' : 'text-gray-600'}`}>
                  {conversation.lastMessage?.senderId?._id === currentUser._id ? 'You: ' : ''}
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </div>

            {conversation.itemId && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={conversation.itemId.photos && conversation.itemId.photos.length > 0 
                      ? `/uploads/items/${conversation.itemId.photos[0]}` 
                      : '/assets/default-item.png'}
                    alt={conversation.itemId.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-gray-500 truncate">
                  {conversation.itemId.title}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
