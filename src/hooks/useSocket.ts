import { useEffect, useRef } from 'react';
import { socketService } from '@/services/socketService';
import { useAppDispatch } from '@/store/hooks';
import { connectionStatusChanged } from '@/store/slices/uiSlice';
import type { ConnectionStatus } from '@/types/socket.types';


export function useSocket(authToken: string | null): ConnectionStatus {
  const dispatch = useAppDispatch();
  const statusRef = useRef<ConnectionStatus>('idle');

  useEffect(() => {
    if (!authToken) {
      socketService.disconnect();
      return;
    }

    socketService.connect(authToken);

    const unsubscribeStatus = socketService.onStatusChange((status) => {
      console.log(`[Socket] Connection status: ${status}`);
      statusRef.current = status;
      dispatch(connectionStatusChanged(status));
    });

    return () => {
      unsubscribeStatus();
      socketService.disconnect();
    };
  }, [authToken, dispatch]);

  return statusRef.current;
}
