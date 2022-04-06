import { useCallback } from 'react';
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
    if (!profile?.screenShare) {
      return;
    }
    ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
  }, [profile]);
  return { onMouseEnter, onMouseLeave };
};
