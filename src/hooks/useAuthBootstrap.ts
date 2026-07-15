import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { currentUserSet } from '@/store/slices/userSlice';
import { clearAuthToken, getAuthToken, getMyProfile } from '@/services/authApi';

export function useAuthBootstrap() {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const token = getAuthToken();
      if (!token) {
        if (isMounted) setIsReady(true);
        return;
      }

      try {
        const user = await getMyProfile();
        if (!user.id) {
          throw new Error('Invalid user profile');
        }

        if (isMounted) {
          dispatch(
            currentUserSet({
              id: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl,
              isOnline: true,
            }),
          );
        }
      } catch (error) {
        console.error('[authBootstrap] Failed to restore session:', error);
        clearAuthToken();
      } finally {
        if (isMounted) setIsReady(true);
      }
    };

     bootstrap();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return { isReady };
}
