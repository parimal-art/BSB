import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from '../../../declarations/BSB_backend/BSB_backend.did.js';
import { canisterId } from '../../../declarations/BSB_backend/index.js';
import Navbar from './Navbar';

const CreatePost = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    imageUrl: '',
  });
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
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
    
    if (!formData.content.trim()) {
      newErrors.content = 'Post content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For a real app, you would upload to a storage solution
    // Here we're using a mock URL as placeholder
    const mockImageUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/600`;
    
    setFormData((prev) => ({
      ...prev,
      imageUrl: mockImageUrl,
    }));
    
    setPreviewImage(mockImageUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !actor) return;
    
    setIsLoading(true);
    
    try {
      // Convert to Option type format for Candid
      const imageUrlOpt = formData.imageUrl ? [formData.imageUrl] : [];
      
      await actor.create_post(
        formData.content,
        imageUrlOpt
      );
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors({ submit: 'Failed to create post. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Create a New Post</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                What's on your mind?*
              </label>
              <textarea
                id="content"
                name="content"
                rows="4"
                value={formData.content}
                onChange={handleChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${
                  errors.content ? 'border-red-500' : ''
                }`}
                placeholder="Share your thoughts..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add an image (optional)
              </label>
              <div 
                className={`relative h-40 rounded-lg border-dashed border-2 border-gray-300 flex justify-center items-center bg-gray-100 hover:bg-gray-200 transition ${
                  previewImage ? 'bg-gray-300' : ''
                }`}
                style={{
                  backgroundImage: previewImage ? `url(${previewImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageChange}
                />
                {!previewImage && (
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      Click to upload an image
                    </p>
                  </div>
                )}
              </div>
              {previewImage && (
                <button
                  type="button"
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                  onClick={() => {
                    setPreviewImage(null);
                    setFormData((prev) => ({ ...prev, imageUrl: '' }));
                  }}
                >
                  Remove image
                </button>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !actor}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
            
            {errors.submit && (
              <p className="mt-2 text-sm text-red-600 text-center">{errors.submit}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost; 