import React, { FC, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import dayjs from 'dayjs';
import { BiDownArrowAlt, BiUpArrowAlt, BiPencil } from 'react-icons/bi';
import cls from 'classnames';
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
import { Button } from 'antd';
import { RtcEngineEvents } from '../../services/RtcEngine';

export interface A6yHeaderProps {
  hasMarkable?: boolean;
  onStopScreenShare?: () => void;
}

export const A6yHeader: FC<A6yHeaderProps> = ({
  hasMarkable,
  onStopScreenShare,
}) => {
  const session = useSession();
  const { profile, refetchProfile } = useProfile();
  const intl = useIntl();
  const ignoreMouseEvent = useIgnoreMouseEvent();
  const [networkQuality, setNetworkQuality] = useState<{
    up: number;
    down: number;
  }>({ up: 0, down: 0 });
  const { rtcEngine } = useEngines();

  const toggleMarkable = async () => {
    if (!session || !profile || !refetchProfile) {
      return;
    }
    await updateProfile(session.id, profile.id, {
      markable: !profile.markable,
    });
    refetchProfile();
  };

  const handleNetworkQualityChange = useCallback(
    ({ up = 0, down = 0 }) => {
      setNetworkQuality({ up, down });
    },
    [setNetworkQuality],
  );

  useEffect(() => {
    if (!rtcEngine) {
      return;
    }

    rtcEngine.on(
      RtcEngineEvents.NETWORK_QUALITY_CHANGE,
      handleNetworkQualityChange,
    );
    return () => {
      rtcEngine.off(
        RtcEngineEvents.NETWORK_QUALITY_CHANGE,
        handleNetworkQualityChange,
      );
    };
  }, [rtcEngine, handleNetworkQualityChange]);

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
      <button
        className={cls({
          'a6y-markable': 1,
          [`enabled`]: profile?.markable,
        })}
        onClick={toggleMarkable}
        disabled={hasMarkable && !profile?.markable}>
        <BiPencil size={16} />
      </button>
      <Button
        onClick={onStopScreenShare}
        className="a6y-stop-screen-share"
        size="small"
        danger={true}>
        {intl.formatMessage({ id: 'session.header.stopScreeShare' })}
      </Button>
    </div>
  );
};
