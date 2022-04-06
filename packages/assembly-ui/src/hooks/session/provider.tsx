import React, { FC } from 'react';
import { useAsync } from 'react-use';
import { getSession } from '../../services/api';
import { SessionContext } from './context';

export interface SessionProviderProps {
  sessionId: string;
}

export const SessionProvider: FC<SessionProviderProps> = ({
  children,
  sessionId,
}) => {
  const { value } = useAsync(() => getSession(sessionId));
  return (
    <SessionContext.Provider value={value?.data}>
      {children}
    </SessionContext.Provider>
  );
};
