import React from 'react';
import { useIntl } from 'react-intl';
import dayjs from 'dayjs';
import { BiDownArrowAlt, BiUpArrowAlt, BiPencil } from 'react-icons/bi';
import {
  useIgnoreMouseEvent,
  useEngines,
  useSession,
  useProfile,
} from '../../hooks';
import { Timer } from './Timer';
import './index.css';
import { NetworkIndicator } from './NetworkIndicator';
import { updateProfile } from '../../services/api';

export const A6yHeader = () => {
  const session = useSession();
  const { profile, refetchProfile } = useProfile();
  const intl = useIntl();
  const ignoreMouseEvent = useIgnoreMouseEvent();
  const { networkQuality } = useEngines();

  const toggleMarkable = async () => {
    if (!session || !profile || !refetchProfile) {
      return;
    }
    await updateProfile(session.id, profile.id, {
      markable: !profile.markable,
    });
    refetchProfile();
  };

  return (
    <div {...ignoreMouseEvent} className="a6y-header">
      <div className="a6y-header-start"></div>
      <div className="a6y-channel">
        {intl.formatMessage({ id: 'session.header.channel' })}:{' '}
        {session?.channel}
      </div>
      <div className="a6y-header-end">
        <Timer beginTime={dayjs(session?.createdAt).toString()} />
        <div className="a6y-network-quality">
          <span className="a6y-download">
            <BiUpArrowAlt size={20} />
            &nbsp;
            <NetworkIndicator quality={networkQuality.up} />
          </span>
          <span className="a6y-upload">
            <BiDownArrowAlt size={20} />
            &nbsp;
            <NetworkIndicator quality={networkQuality.down} />
          </span>
        </div>
      </div>
      <button className="a6y-markable" onClick={toggleMarkable}>
        <BiPencil size={16} />
      </button>
    </div>
  );
};
