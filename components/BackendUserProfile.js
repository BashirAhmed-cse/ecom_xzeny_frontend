// components/BackendUserProfile.js
'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getBackendProfile, syncUserWithBackend } from '../lib/api';

export default function BackendUserProfile() {
  const { user, isLoaded } = useUser();
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      if (isLoaded && user) {
        setLoading(true);
        try {
          // First, sync user with backend
          await syncUserWithBackend();
          // Then get backend profile
          const profile = await getBackendProfile();
          setBackendUser(profile.user);
        } catch (error) {
          console.error('Failed to initialize user:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeUser();
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return <div>Loading backend data...</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h3>Backend User Data</h3>
      {backendUser ? (
        <div>
          <p>User ID: {backendUser.user_id}</p>
          <p>Role: {backendUser.role}</p>
          <p>Database ID: {backendUser.user_id}</p>
        </div>
      ) : (
        <p>No backend data available</p>
      )}
    </div>
  );
}