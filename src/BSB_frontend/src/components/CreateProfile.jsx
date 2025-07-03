import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from '../../../declarations/BSB_backend/BSB_backend.did.js';
import { canisterId } from '../../../declarations/BSB_backend/index.js';

const CreateProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    profileImage: '',
    coverPhoto: '',
  });
  const [errors, setErrors] = useState({});
  const [actor, setActor] = useState(null);

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
        } else {
          // If not authenticated, redirect to login
          navigate('/');
        }
      } catch (error) {
        console.error("Failed to initialize actor:", error);
        setErrors({ submit: 'Authentication error. Please login again.' });
      }
    };
    
    initActor();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // For a real app, you would upload to a storage solution
    // Here we're using a mock URL as placeholder
    const mockImageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/400/400`;
    
    setFormData((prev) => ({
      ...prev,
      [fieldName]: mockImageUrl,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !actor) return;
    
    setIsLoading(true);
    
    try {
      // Convert to Option type format for Candid
      const profileImageOpt = formData.profileImage ? [formData.profileImage] : [];
      const coverPhotoOpt = formData.coverPhoto ? [formData.coverPhoto] : [];
      
      await actor.create_profile(
        formData.name,
        formData.bio,
        profileImageOpt,
        coverPhotoOpt
      );
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      setErrors({ submit: 'Failed to create profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your profile to get started with our decentralized social network
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo
            </label>
            <div 
              className="relative h-32 rounded-lg border-dashed border-2 border-gray-300 flex justify-center items-center bg-gray-100 hover:bg-gray-200 transition"
              style={{
                backgroundImage: formData.coverPhoto ? `url(${formData.coverPhoto})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleImageChange(e, 'coverPhoto')}
              />
              {!formData.coverPhoto && (
                <div className="text-center">
                  <span className="block text-sm text-gray-600">
                    Click to upload cover photo
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Picture Upload */}
          <div className="flex justify-center -mt-10 relative z-10">
            <div 
              className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: formData.profileImage ? `url(${formData.profileImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleImageChange(e, 'profileImage')}
              />
              {!formData.profileImage && (
                <span className="text-gray-500 text-xs">Add Profile Photo</span>
              )}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Bio Input */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              About / Bio*
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              value={formData.bio}
              onChange={handleChange}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${
                errors.bio ? 'border-red-500' : ''
              }`}
              placeholder="Tell us about yourself..."
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !actor}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Profile...
                </>
              ) : (
                'Create Profile'
              )}
            </button>
            {errors.submit && (
              <p className="mt-2 text-sm text-red-600 text-center">{errors.submit}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile; 