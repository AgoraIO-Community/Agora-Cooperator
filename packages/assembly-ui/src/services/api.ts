import axios from 'axios';
import { Profile, Session, Signal, Stream, Whiteboard } from 'assembly-shared';

declare const API_HOST: string;

export type ProfileEntity = Profile & {
  streams: Stream[];
  signals: Signal[];
  whiteboard: Whiteboard;
};

export const createSession = (params: Pick<Session, 'channel'>) =>
  axios.post<Session>(`${API_HOST}/api/session`, params);

export const getSession = (sessionId: string) =>
  axios.get<Session>(`${API_HOST}/api/session/${sessionId}`);

export const createProfile = (
  sessionId: string,
  params: Pick<Profile, 'username' | 'role'>,
) =>
  axios.post<Profile>(`${API_HOST}/api/session/${sessionId}/profile`, params);

export const getProfile = (sessionId: string, profileId: string) =>
  axios.get<ProfileEntity>(
    `${API_HOST}/api/session/${sessionId}/profile/${profileId}`,
  );

export const updateProfile = (
  sessionId: string,
  profileId: string,
  params: Partial<
    Pick<
      Profile,
      'rdcStatus' | 'screenShare' | 'markable' | 'screenVisibility'
    > & {
      streams: Partial<Stream>[];
    }
  >,
) =>
  axios.put<Profile>(
    `${API_HOST}/api/session/${sessionId}/profile/${profileId}`,
    params,
  );

export const checkInOut = (
  sessionId: string,
  profileId: string,
  isIn: boolean,
) =>
  axios.patch<Profile>(
    `${API_HOST}/api/session/${sessionId}/profile/${profileId}`,
    { isIn },
  );
