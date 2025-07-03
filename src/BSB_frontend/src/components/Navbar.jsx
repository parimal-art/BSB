import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../declarations/BSB_backend/BSB_backend.did.js';
import { canisterId } from '../../../declarations/BSB_backend/index.js';

const Navbar = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
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
          await fetchProfile(actor);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize actor:", error);
        setIsLoading(false);
      }
    };
    
    initActor();
  }, []);

  const fetchProfile = async (backendActor) => {
    try {
      const userProfile = await backendActor.get_my_profile();
      
      if ('Ok' in userProfile) {
        setProfile(userProfile.Ok);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const authClient = await AuthClient.create();
      await authClient.logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                Social DApp
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <Link 
              to="/create-post" 
              className="mr-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Post
            </Link>
            
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : profile ? (
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu-button"
                    onClick={toggleDropdown}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 text-blue-800 font-medium">
                      {profile.profile_image_url && profile.profile_image_url.length > 0 ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={profile.profile_image_url[0]}
                          alt={profile.name}
                        />
                      ) : (
                        profile.name.charAt(0)
                      )}
                    </div>
                  </button>
                </div>

                {showDropdown && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{profile.name}</p>
                    </div>
                    <Link
                      to="/edit-profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Edit Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 