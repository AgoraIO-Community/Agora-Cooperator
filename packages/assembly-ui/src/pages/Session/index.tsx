import React from 'react';
import { useParams } from 'react-router-dom';
import {
  ProfileProvider,
  ProfilesInSessionProvider,
  SessionProvider,
  SignallingProvider,
  EnginesProvider,
} from '../../hooks';
import { Root } from './Root';

const Session = () => {
  const { sessionId, profileId } =
    useParams<{ sessionId: string; profileId: string }>();

  if (!sessionId || !profileId) {
    return null;
  }
  return (
    <SessionProvider sessionId={sessionId}>
      <ProfileProvider sessionId={sessionId} profileId={profileId}>
        <SignallingProvider>
          <ProfilesInSessionProvider>
            <EnginesProvider>
              <Root />
            </EnginesProvider>
          </ProfilesInSessionProvider>
        </SignallingProvider>
      </ProfileProvider>
    </SessionProvider>
  );
};

export default Session;
