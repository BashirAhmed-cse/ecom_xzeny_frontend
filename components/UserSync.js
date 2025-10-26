'use client';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useApi } from '@/lib/api';

export default function UserSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { syncUserWithBackend } = useApi();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          console.log('🔄 Auto-syncing user with backend...', user.id);
          await syncUserWithBackend();
          console.log('✅ User auto-synced successfully');
        } catch (error) {
          console.error('❌ Auto-sync failed:', error);
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user]);

  return null;
}
