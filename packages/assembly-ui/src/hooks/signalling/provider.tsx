import React, { FC, useEffect, useState } from 'react';
import { SignallingContext } from './context';
import {
  Signalling,
  Commands,
  SignallingStatus,
} from '../../services/Signalling';
import { useProfile } from '../profile';
import { useSession } from '../session';
import { SignalKind } from 'assembly-shared';

export const SignallingProvider: FC = ({ children }) => {
  const [signalling, setSignalling] = useState<Signalling | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<SignallingStatus>(
    SignallingStatus.DISCONNECTED,
  );
  const [isJoined, setIsJoined] = useState(false);
  const session = useSession();
  const { profile } = useProfile();
  const signal = profile?.signals.find((s) => s.kind === SignalKind.NORMAL);

  useEffect(() => {
    if (!signal || !session || signalling) {
      return;
    }
    const { id: channel } = session;
    const { appId } = signal;
    setSignalling(Signalling.create(appId, channel));
  }, [signal, session, signalling]);

  useEffect(() => {
    if (!signalling || !signal || isJoined) {
      return;
    }
    signalling.on(Commands.CONNECTION_CHANGE, (status: SignallingStatus) => {
      setStatus(status);
    });
    signalling.join(signal.uid, signal.token).then(() => setIsJoined(true));
  }, [signalling, setStatus, signal, isJoined]);

  return (
    <SignallingContext.Provider value={{ signalling, status }}>
      {children}
    </SignallingContext.Provider>
  );
};
