import { useCallback, useEffect } from 'react';
import { useProfile } from './profile';
import { ipcRenderer } from 'electron';

export const useIgnoreMouseEvent = () => {
  const { profile } = useProfile();
  const onMouseEnter = useCallback(() => {
    if (!profile?.screenShare) {
      return;
    }
    ipcRenderer.send('set-ignore-mouse-events', false);
  }, [profile]);

  const onMouseLeave = useCallback(() => {
    if (!profile?.screenShare || profile?.markable) {
      return;
    }
    ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
  }, [profile]);

  useEffect(() => {
    if (profile?.markable) {
      ipcRenderer.send('set-ignore-mouse-events', false);
    }
  }, [profile]);

  return { onMouseEnter, onMouseLeave };
};
