import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { BSB_backend } from '../../../declarations/BSB_backend';
import CommentBox from './CommentBox';
import FollowButton from './FollowButton';

const PostCard = ({ post, currentUserPrincipal, onPostUpdated }) => {
  const [author, setAuthor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const authorProfile = await BSB_backend.get_profile(post.author);
        if ('Ok' in authorProfile) {
          setAuthor(authorProfile.Ok);
        }
      } catch (error) {
        console.error('Error fetching post author:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAuthor();
  }, [post.author]);
  
  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await BSB_backend.like_post(post.post_id);
      if (onPostUpdated) {
        onPostUpdated();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleCommentSubmit = async () => {
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      await BSB_backend.comment_post(post.post_id, newComment.trim());
      setNewComment('');
      if (onPostUpdated) {
        onPostUpdated();
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const formatTime = (timestamp) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };
  
  const isCurrentUserPost = currentUserPrincipal === post.author.toString();
  const hasLiked = post.likes.some(principal => principal.toString() === currentUserPrincipal);
  
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-gray-300"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Post Header */}
      <div className="p-4 sm:p-6 flex items-start">
        <div 
          className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mr-4"
          style={{
            backgroundImage: author?.profile_image_url && author.profile_image_url.length > 0 
              ? `url(${author.profile_image_url[0]})` 
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {(!author?.profile_image_url || author.profile_image_url.length === 0) && (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
              {author?.name ? author.name.charAt(0) : '?'}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-medium text-gray-900">{author?.name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-500">{formatTime(post.timestamp)}</p>
            </div>
            
            {!isCurrentUserPost && (
              <FollowButton 
                targetPrincipal={post.author} 
                onFollowStateChanged={onPostUpdated}
              />
            )}
          </div>
          
          <p className="mt-2 text-base text-gray-700">{post.content}</p>
          
          {post.image_url && post.image_url.length > 0 && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img 
                src={post.image_url[0]} 
                alt="Post content" 
                className="w-full object-cover"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Post Actions */}
      <div className="border-t border-gray-200 px-4 py-3 flex space-x-8">
        <button 
          className={`flex items-center space-x-2 ${hasLiked ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill={hasLiked ? "currentColor" : "none"} 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={hasLiked ? "0" : "2"}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</span>
        </button>
        
        <button 
          className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
          onClick={() => setShowComments(!showComments)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</span>
        </button>
        
        <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 px-4 py-3">
          {/* Comment Input */}
          <div className="flex space-x-3 mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write a comment..."
              rows="2"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={!newComment.trim() || isSubmittingComment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 self-end"
            >
              {isSubmittingComment ? 'Posting...' : 'Post'}
            </button>
          </div>
          
          {/* Comments List */}
          <div className="space-y-4">
            {post.comments.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">No comments yet. Be the first to comment!</p>
            ) : (
              post.comments.map((comment, index) => (
                <CommentBox key={index} comment={comment} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard; 