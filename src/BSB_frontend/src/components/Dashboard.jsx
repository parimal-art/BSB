import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from '../../../declarations/BSB_backend/BSB_backend.did.js';
import { canisterId } from '../../../declarations/BSB_backend/index.js';
import Navbar from './Navbar';
import PostCard from './PostCard';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actor, setActor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initActor = async () => {
      try {
        const authClient = await AuthClient.create();
        
        if (await authClient.isAuthenticated()) {
          const identity = await authClient.getIdentity();
          const host = process.env.DFX_NETWORK === 'ic' 
            ? 'https://ic0.app' 
            : 'http://localhost:4943';
          
          const agent = new HttpAgent({ identity, host });
          
          // Only fetch the root key in development
          if (process.env.DFX_NETWORK !== 'ic') {
            await agent.fetchRootKey();
          }
          
          const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
          });
          
          setActor(actor);
          
          // Now that we have the actor, load data
          await loadDashboardData(actor);
        } else {
          // If not authenticated, redirect to login
          navigate('/');
        }
      } catch (error) {
        console.error("Failed to initialize actor:", error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    initActor();
  }, [navigate]);

  const loadDashboardData = async (backendActor) => {
    try {
      await fetchProfile(backendActor);
      await fetchPosts(backendActor);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (error.message === 'Profile not found') {
        navigate('/create-profile');
      } else {
        navigate('/');
      }
    }
  };

  const fetchProfile = async (backendActor) => {
    try {
      const userProfile = await backendActor.get_my_profile();
      
      if ('Ok' in userProfile) {
        setProfile(userProfile.Ok);
      } else {
        throw new Error('Profile not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  const fetchPosts = async (backendActor) => {
    try {
      const allPosts = await backendActor.get_all_posts();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleRefresh = async () => {
    if (!actor) return;
    
    setIsLoading(true);
    await fetchPosts(actor);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {profile && (
        <div className="relative">
          {/* Cover photo */}
          <div 
            className="h-48 w-full bg-gray-200"
            style={{ 
              backgroundImage: profile.cover_photo_url && profile.cover_photo_url.length > 0 
                ? `url(${profile.cover_photo_url[0]})` 
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          
          {/* Profile info */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-end sm:space-x-5 relative -mt-16 pb-4">
              <div className="flex">
                <div 
                  className="h-24 w-24 rounded-full ring-4 ring-white sm:h-32 sm:w-32 bg-gray-200 flex items-center justify-center"
                  style={{ 
                    backgroundImage: profile.profile_image_url && profile.profile_image_url.length > 0 
                      ? `url(${profile.profile_image_url[0]})` 
                      : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!profile.profile_image_url || profile.profile_image_url.length === 0 && (
                    <span className="text-gray-500 text-xl">{profile.name.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">{profile.name}</h1>
                  <p className="text-gray-500">{profile.bio}</p>
                  <div className="mt-1 flex flex-wrap">
                    <div className="mr-5">
                      <span className="font-medium text-gray-900">{profile.followers.length}</span>
                      <span className="text-gray-500"> followers</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{profile.following.length}</span>
                      <span className="text-gray-500"> following</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Posts</h2>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No posts yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new post.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard 
                key={post.post_id} 
                post={post} 
                currentUserPrincipal={profile ? profile.principal_id.toString() : ''}
                onPostUpdated={handleRefresh}
                actor={actor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 