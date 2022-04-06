import React, { FC, useEffect } from 'react';
import { useAsyncFn } from 'react-use';
import { ProfileContext } from './context';
import { getProfile } from '../../services/api';

export interface ProfileProviderProps {
  sessionId: string;
  profileId: string;
}

export const ProfileProvider: FC<ProfileProviderProps> = ({
  children,
  sessionId,
  profileId,
}) => {
  const [state, fetch] = useAsyncFn(() => getProfile(sessionId, profileId));
  const refetchProfile = () => {
    fetch();
  };

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <ProfileContext.Provider
      value={{
        profile: state.value?.data,
        refetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
