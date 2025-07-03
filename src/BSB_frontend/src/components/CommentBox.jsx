import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { BSB_backend } from '../../../declarations/BSB_backend';

const CommentBox = ({ comment }) => {
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const authorProfile = await BSB_backend.get_profile(comment.author);
        if ('Ok' in authorProfile) {
          setAuthor(authorProfile.Ok);
        }
      } catch (error) {
        console.error('Error fetching comment author:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAuthor();
  }, [comment.author]);
  
  const formatTime = (timestamp) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex space-x-3 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-gray-300"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex space-x-3">
      <div 
        className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0"
        style={{
          backgroundImage: author?.profile_image_url && author.profile_image_url.length > 0 
            ? `url(${author.profile_image_url[0]})` 
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {(!author?.profile_image_url || author.profile_image_url.length === 0) && (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-xs">
            {author?.name ? author.name.charAt(0) : '?'}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="bg-gray-100 rounded-lg px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900">
              {author?.name || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(comment.timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-700">{comment.text}</p>
        </div>
      </div>
    </div>
  );
};

export default CommentBox; 