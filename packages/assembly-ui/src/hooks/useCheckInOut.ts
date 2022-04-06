import { useEffect, useState } from 'react';
import { message } from 'antd';
import { useInterval } from 'react-use';
import { useSession } from './session';
import { useProfile } from './profile';
import { useSignalling } from './signalling';
import { checkInOut } from '../services/api';

export const useCheckInOut = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const session = useSession();
  const { profile } = useProfile();
  const { status } = useSignalling();
  const { id: sessionId } = session ?? {};
  const { id: profileId } = profile ?? {};

  useInterval(async () => {
    if (!sessionId || !profileId || status !== 'CONNECTED') {
      return;
    }
    await checkInOut(sessionId, profileId, true)
  }, 1000 *  60 * 3);

  useEffect(() => {
    if (!sessionId || !profileId || status !== 'CONNECTED') {
      return;
    }
    checkInOut(sessionId, profileId, true).then(() => {
      message.success('Checked in');
      setIsCheckedIn(true);
    });
    return () => {
      checkInOut(sessionId, profileId, false).then(() => {
        message.success('Checked out');
      });
    };
  }, [sessionId, profileId, status]);
  return isCheckedIn;
};
