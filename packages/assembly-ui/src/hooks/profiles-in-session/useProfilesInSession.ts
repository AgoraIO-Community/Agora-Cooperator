import { useContext } from 'react';
import { ProfileInSession, ProfilesInSessionContext } from './context';

export const useProfilesInSession = (): ProfileInSession[] => {
  const profilesInSessions = useContext(ProfilesInSessionContext);
  return profilesInSessions;
};
