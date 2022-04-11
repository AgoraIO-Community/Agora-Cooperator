import { useCallback, useEffect } from 'react';
import { useProfile } from './profile';
import { ipcRenderer } from 'electron';

export const useIgnoreMouseEvent = () => {
  const { profile } = useProfile();
  const onMouseEnter = useCallback(() => {
    if (!profile?.screenShare || profile.markable) {
      return;
    }
    ipcRenderer.send(
      'set-ignore-mouse-events',
      false,
      { forward: false },
      { source: 'onMouseEnter' },
    );
  }, [profile]);

  const onMouseLeave = useCallback(() => {
    if (!profile?.screenShare || profile.markable) {
      return;
    }
    ipcRenderer.send(
      'set-ignore-mouse-events',
      true,
      { forward: true },
      { source: 'onMouseLeave' },
    );
  }, [profile]);

  useEffect(() => {
    if (!profile?.screenShare) {
      return;
    }
    if (profile?.markable) {
      ipcRenderer.send(
        'set-ignore-mouse-events',
        false,
        { forward: false },
        { source: 'useEffect' },
      );
    } else {
      ipcRenderer.send(
        'set-ignore-mouse-events',
        true,
        { forward: true },
        { source: 'useEffect' },
      );
    }
  }, [profile]);

  return { onMouseEnter, onMouseLeave };
};
