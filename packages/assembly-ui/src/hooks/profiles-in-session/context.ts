import { createContext } from 'react';
import { Profile, Signal, Stream, Whiteboard } from 'assembly-shared';
export interface ProfileInSession extends Profile {
  streams: Omit<Stream, 'token' | 'appId'>[];
  signals: Omit<Signal, 'token' | 'appId'>[];
  whiteboard: Omit<Whiteboard, 'token' | 'appIdentifier' | 'sdkToken'>[];
}

export const ProfilesInSessionContext = createContext<ProfileInSession[]>([]);
