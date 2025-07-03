import React, { useState, useEffect } from 'react';
import { BSB_backend } from '../../../declarations/BSB_backend';

const FollowButton = ({ targetPrincipal, onFollowStateChanged }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        // Get current user's principal
        const userProfile = await BSB_backend.get_my_profile();
        
        if ('Ok' in userProfile) {
          const currentUserPrincipal = userProfile.Ok.principal_id;
          
          // Check if current user is following the target
          const following = await BSB_backend.is_following(currentUserPrincipal, targetPrincipal);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkFollowStatus();
  }, [targetPrincipal]);
  
  const handleFollowToggle = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isFollowing) {
        await BSB_backend.unfollow_user(targetPrincipal);
      } else {
        await BSB_backend.follow_user(targetPrincipal);
      }
      
      setIsFollowing(!isFollowing);
      
      if (onFollowStateChanged) {
        onFollowStateChanged();
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <button 
        className="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-500"
        disabled
      >
        Loading...
      </button>
    );
  }
  
  return (
    <button
      onClick={handleFollowToggle}
      disabled={isProcessing}
      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
        isFollowing
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isProcessing
        ? (isFollowing ? 'Unfollowing...' : 'Following...')
        : (isFollowing ? 'Following' : 'Follow')}
    </button>
  );
};

export default FollowButton; 