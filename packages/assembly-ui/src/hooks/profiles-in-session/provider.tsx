import React, { FC, useCallback, useEffect, useState } from 'react';
import { Commands } from '../../services/Signalling';
import { useSignalling } from '../signalling';
import { ProfileInSession, ProfilesInSessionContext } from './context';
import { useProfile } from '../profile';
import dayjs from 'dayjs';
import { RoleType } from 'assembly-shared';
import { uniqBy } from 'lodash';
import { ProfileEntity } from '../../services/api';

const distinctSort = (
  profiles: ProfileInSession[],
  profile?: ProfileEntity,
): ProfileInSession[] => {
  return uniqBy(profiles, 'id')
    .map((p) => {
      let weight = dayjs(p.createdAt).unix();
      if (p.role === RoleType.HOST) {
        weight = 0;
      }
      if (p.id === profile?.id) {
        weight = 1;
      }
      return { ...p, weight };
    })
    .sort((a, b) => a.weight - b.weight)
    .map(({ weight, ...p }) => ({ ...p }));
};

export const ProfilesInSessionProvider: FC = ({ children }) => {
  const [profilesInSession, setProfilesInSession] = useState<
    ProfileInSession[]
  >([]);
  const { signalling } = useSignalling();
  const { profile, refetchProfile } = useProfile();

  const handleUserIn = useCallback(
    (profileInSession: ProfileInSession) => {
      setProfilesInSession(
        distinctSort([...profilesInSession, profileInSession], profile),
      );
    },
    [profilesInSession, setProfilesInSession, profile],
  );

  const handleUserOut = useCallback(
    (profile: ProfileInSession) => {
      setProfilesInSession(
        profilesInSession.filter((p) => p.id !== profile.id),
      );
    },

    [profilesInSession, setProfilesInSession],
  );

  const handleProfileChange = useCallback(
    (profile: ProfileInSession) => {
      const nextProfilesInSession = profilesInSession.map((p) => {
        if (p.id === profile.id) {
          return profile;
        }
        return p;
      });
      if (refetchProfile) {
        refetchProfile();
      }
      setProfilesInSession(nextProfilesInSession);
    },
    [profilesInSession, setProfilesInSession, refetchProfile],
  );

  const handleAllOnlineProfiles = useCallback(
    (profiles: ProfileInSession[]) => {
      setProfilesInSession(distinctSort(profiles, profile));
    },
    [setProfilesInSession, profile],
  );

  useEffect(() => {
    if (!signalling) {
      return;
    }
    signalling.on(Commands.USER_IN, handleUserIn);
    signalling.on(Commands.USER_OUT, handleUserOut);
    signalling.on(Commands.PROFILE_CHANGE, handleProfileChange);
    signalling.on(Commands.ALL_ONLINE_PROFILES, handleAllOnlineProfiles);
    return () => {
      signalling.off(Commands.USER_IN, handleUserIn);
      signalling.off(Commands.USER_OUT, handleUserOut);
      signalling.off(Commands.PROFILE_CHANGE, handleProfileChange);
      signalling.off(Commands.ALL_ONLINE_PROFILES, handleAllOnlineProfiles);
    };
  }, [signalling, handleProfileChange, handleUserOut, handleUserIn, handleAllOnlineProfiles]);
  return (
    <ProfilesInSessionContext.Provider value={profilesInSession}>
      {children}
    </ProfilesInSessionContext.Provider>
  );
};
