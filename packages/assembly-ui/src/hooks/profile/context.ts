import { createContext } from 'react';
import { ProfileEntity } from '../../services/api';

export const ProfileContext = createContext<{
  profile?: ProfileEntity;
  refetchProfile?: () => void;
}>({});
