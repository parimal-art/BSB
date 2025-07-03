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
          
          if (process.env.DFX_NETWORK !== 'ic') {
            await agent.fetchRootKey();
          }
          
          const actorInstance = Actor.createActor(idlFactory, {
            agent,
            canisterId,
          });
          
          setActor(actorInstance);
        } else {
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: reader.result,
        }));
      };
      reader.onerror = () => console.error(`Error reading ${fieldName} file`);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !actor) {
      setErrors({ submit: 'Please ensure all fields are valid and authenticated.' });
      return;
    }
    
    setIsLoading(true);
    
    try {
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

  if (!actor) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#606770' }}>Loading...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '600px',
        padding: '20px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>Create Your Profile</h2>
          <p style={{ fontSize: '14px', color: '#606770' }}>
            Set up your profile to get started with our social network
          </p>
        </div>
        <div style={{
          width: '100%',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          paddingBottom: '10px',
          marginBottom: '20px',
        }}>
          <div style={{
            height: '200px',
            backgroundColor: '#e9ecef',
            position: 'relative',
            backgroundImage: formData.coverPhoto ? `url(${formData.coverPhoto})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            <input
              type="file"
              accept="image/*"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
              onChange={(e) => handleImageChange(e, 'coverPhoto')}
            />
            {!formData.coverPhoto && (
              <div style={{ textAlign: 'center', paddingTop: '80px', color: '#606770' }}>
                Add Cover Photo
              </div>
            )}
          </div>
          <div style={{
            position: 'relative',
            marginTop: '-50px',
            padding: '0 15px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: '#e9ecef',
              border: '5px solid #fff',
              overflow: 'hidden',
              backgroundImage: formData.profileImage ? `url(${formData.profileImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}>
              <input
                type="file"
                accept="image/*"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
                onChange={(e) => handleImageChange(e, 'profileImage')}
              />
              {!formData.profileImage && (
                <div style={{ textAlign: 'center', paddingTop: '60px', color: '#606770' }}>
                  Add Photo
                </div>
              )}
            </div>
            <div style={{ marginLeft: '20px', flexGrow: 1 }}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: 'none',
                  outline: 'none',
                  color: '#1c1e21',
                }}
                required
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : null}
              />
              {errors.name && (
                <p id="name-error" style={{ marginTop: '5px', fontSize: '12px', color: '#fa383e' }}>{errors.name}</p>
              )}
            </div>
          </div>
        </div>
        <div>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #dddfe2',
              borderRadius: '4px',
              resize: 'vertical',
              minHeight: '100px',
              outline: 'none',
            }}
            required
            aria-invalid={errors.bio ? "true" : "false"}
            aria-describedby={errors.bio ? "bio-error" : null}
          />
          {errors.bio && (
            <p id="bio-error" style={{ marginTop: '5px', fontSize: '12px', color: '#fa383e' }}>{errors.bio}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !actor}
          onClick={handleSubmit}
          style={{
            backgroundColor: '#1877f2',
            color: '#fff',
            padding: '10px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            width: '100%',
            marginTop: '20px',
            opacity: isLoading || !actor ? '0.6' : '1',
          }}
          onMouseOver={(e) => !isLoading && !actor && (e.target.style.backgroundColor = '#166fe5')}
          onMouseOut={(e) => !isLoading && !actor && (e.target.style.backgroundColor = '#1877f2')}
        >
          {isLoading ? (
            <>
              <span style={{ marginRight: '8px' }}>Creating Profile...</span>
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid #166fe5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </>
          ) : (
            'Create Profile'
          )}
        </button>
        {errors.submit && (
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#fa383e', textAlign: 'center' }}>{errors.submit}</p>
        )}
      </div>
    </div>
  );
};

export default CreateProfile;