import { createContext } from 'react';
import { Session } from 'assembly-shared';

export const SessionContext = createContext<Session | undefined>(undefined);
