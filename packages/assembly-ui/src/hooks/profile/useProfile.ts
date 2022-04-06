import { useContext } from 'react';
import { ProfileContext } from './context';

export const useProfile = () => {
  const profileContext = useContext(ProfileContext);
  return profileContext;
};
