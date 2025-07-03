import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../declarations/BSB_backend/BSB_backend.did.js';
import { canisterId } from '../../../declarations/BSB_backend/index.js';

const Login = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Create a backend actor with the identity from auth client
  const createActor = async (authClient) => {
    const identity = await authClient.getIdentity();
    const host = process.env.DFX_NETWORK === 'ic' 
      ? 'https://ic0.app' 
      : 'http://localhost:4943';
    
    const agent = new HttpAgent({ 
      identity, 
      host 
    });
    
    // Only fetch the root key in development
    if (process.env.DFX_NETWORK !== 'ic') {
      await agent.fetchRootKey();
    }
    
    return Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);

        const isAuthenticated = await client.isAuthenticated();
        setIsAuthenticated(isAuthenticated);
        
        if (isAuthenticated) {
          try {
            // Create an actor with the authenticated identity
            const actor = await createActor(client);
            
            // Check if user already has a profile
            try {
              await actor.get_my_profile();
              console.log("Profile found, redirecting to dashboard");
              navigate('/dashboard');
            } catch (profileError) {
              console.error("No profile found, redirecting to create profile", profileError);
              navigate('/create-profile');
            }
          } catch (error) {
            console.error("Actor creation or profile check failed:", error);
            setError("Failed to check profile. Please try again.");
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setError("Failed to initialize authentication. Please try again.");
        setIsLoading(false);
      }
    };

    initAuth();
  }, [navigate]);

  const handleLogin = async () => {
    if (!authClient) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Get the Internet Identity canister ID
      let iiUrl;
      
      if (process.env.DFX_NETWORK === 'ic') {
        // On IC mainnet
        iiUrl = 'https://identity.ic0.app';
      } else {
        // For local development
        // Using the canister ID from our most recent deployment
        const canisterId = 'c2lt4-zmaaa-aaaaa-qaaiq-cai';
        iiUrl = `http://localhost:4943/?canisterId=${canisterId}`;
        
        console.log("Using Internet Identity at:", iiUrl);
      }
      
      await authClient.login({
        identityProvider: iiUrl,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 1 week in nanoseconds
        onSuccess: async () => {
          setIsAuthenticated(true);
          
          try {
            // Create an actor with the authenticated identity
            const actor = await createActor(authClient);
            
            // Check if user already has a profile
            try {
              await actor.get_my_profile();
              console.log("Profile found, redirecting to dashboard");
              navigate('/dashboard');
            } catch (profileError) {
              console.error("No profile found, redirecting to create profile", profileError);
              navigate('/create-profile');
            }
          } catch (error) {
            console.error("Actor creation or profile check failed:", error);
            setError("Failed to check profile. Please try again.");
            setIsLoading(false);
          }
        },
        onError: (error) => {
          console.error("Login failed:", error);
          setError("Login failed. Please try again.");
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Social DApp</h1>
          <p className="text-gray-600 mb-8">Connect with the decentralized world</p>
          
          <div className="flex justify-center mb-6">
            <img 
              src="/logo2.svg" 
              alt="Internet Computer Logo" 
              className="h-24 w-auto"
            />
          </div>
          
          <p className="text-sm text-gray-500 mb-8">
            Powered by Internet Computer & Internet Identity
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <button
          onClick={handleLogin}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isAuthenticated ? 'Continue to App' : 'Login with Internet Identity'}
        </button>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 