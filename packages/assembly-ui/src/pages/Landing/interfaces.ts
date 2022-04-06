import { Session, Profile } from 'assembly-shared';
export type JoinSessionParams = Pick<Session, 'channel'> &
  Pick<Profile, 'username' | 'role'> & {
    resolutionAndBitrate: string;
  };
