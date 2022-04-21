import React, { FC, useEffect, useRef, useState } from 'react';
import cls from 'classnames';
import {
  RDCStatus,
  RoleType,
  ScreenVisibility,
  SignalCommand,
  SignalKind,
  StreamKind,
} from 'assembly-shared';
import {
  BiVideo,
  BiVideoOff,
  BiMicrophone,
  BiMicrophoneOff,
} from 'react-icons/bi';
import { ImDisplay } from 'react-icons/im';
import { MdOutlineScreenShare, MdOutlineStopScreenShare } from 'react-icons/md';
import { message, Tooltip } from 'antd';
import { useIntl } from 'react-intl';
import {
  ProfileInSession,
  useProfile,
  useEngines,
  useSession,
  useSignalling,
} from '../../hooks';
import { updateProfile } from '../../services/api';
import './index.css';
import { StopScreenShareInfo } from '../../pages/Session/Root';

export interface StreamProps {
  profileInSession: ProfileInSession;
  onStartScreenShare: () => void;
  onStopScreenShare?: (payload: StopScreenShareInfo) => void;
}

export const A6yStream: FC<StreamProps> = ({
  profileInSession,
  onStartScreenShare,
  onStopScreenShare,
}) => {
  const attachElRef = useRef<HTMLDivElement>(null);
  const session = useSession();
  const { profile } = useProfile();
  const { rtcEngine, publishedStreams, rdcEngine } = useEngines();
  const { signalling } = useSignalling();
  const intl = useIntl();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { role, streams, username, id, rdcStatus, signals, screenShare } =
    profileInSession;
  const cameraStream = streams.find((s) => s.kind === StreamKind.CAMERA);
  const screenStream = streams.find((s) => s.kind === StreamKind.SCREEN);
  const signal = signals.find((s) => s.kind === SignalKind.NORMAL);
  const isSelf = id === profile?.id;

  const handleMicrophone = () => {
    if (!profile || !cameraStream || !session || !signalling || !signal) {
      return;
    }
    if (isSelf) {
      updateProfile(session.id, profile.id, {
        streams: [{ id: cameraStream.id, audio: !cameraStream.audio }],
      });
      return;
    }
    signalling.sendMessage(signal.uid, {
      command: SignalCommand.REQUEST_CHANGE_DEVICE_STATE,
      payload: {
        profileId: profile.id,
        username: profile.username,
        streamId: cameraStream.id,
        audio: !cameraStream.audio,
      },
    });
    message.success(
      intl
        .formatMessage({
          id: `message.invite.audio.request.${
            cameraStream.audio ? 'off' : 'on'
          }`,
        })
        .replace('{username}', username),
    );
  };

  const handleCamera = () => {
    if (!profile || !cameraStream || !session || !signalling || !signal) {
      return;
    }
    if (isSelf) {
      updateProfile(session.id, profile.id, {
        streams: [{ id: cameraStream.id, video: !cameraStream.video }],
      });
      return;
    }
    signalling.sendMessage(signal.uid, {
      command: SignalCommand.REQUEST_CHANGE_DEVICE_STATE,
      payload: {
        profileId: profile.id,
        username: profile.username,
        streamId: cameraStream.id,
        video: !cameraStream.video,
      },
    });
    message.success(
      intl
        .formatMessage({
          id: `message.invite.video.request.${
            cameraStream.video ? 'off' : 'on'
          }`,
        })
        .replace('{username}', username),
    );
  };

  const handleScreenShare = async () => {
    if (!profile || !screenStream || !session || !signalling || !signal) {
      return;
    }
    if (isSelf && !screenShare) {
      onStartScreenShare();
      return;
    }
    if (isSelf && screenShare) {
      await updateProfile(session.id, profile.id, {
        screenShare: false,
        screenVisibility: ScreenVisibility.ONLY_HOST,
        markable: false,
        streams: [{ id: screenStream.id, video: false, audio: false }],
      });
      onStopScreenShare && onStopScreenShare({profileId:profile.id,username:profile.username});
      return;
    }
    signalling.sendMessage(signal.uid, {
      command: SignalCommand.REQUEST_CHANGE_DEVICE_STATE,
      payload: {
        profileId: profile.id,
        username: profile.username,
        screenShare: !screenShare,
        streamId: screenStream.id,
        video: !screenStream.video,
      },
    });
    if (!screenStream.video) {
      message.success(
        intl
          .formatMessage({ id: 'message.invite.screenShare.request' })
          .replace('{username}', username),
      );
    }
  };

  const handleRemoteDesktop = () => {
    const rdcSignal = signals.find((s) => s.kind === SignalKind.RDC);
    if (!rdcEngine || !rdcSignal) {
      return;
    }
    if (rdcStatus === RDCStatus.IDLE) {
      rdcEngine.requestControl(rdcSignal.uid);
      message.success(intl.formatMessage({ id: 'message.rdc.request' }));
      return;
    }
    if (rdcStatus === RDCStatus.ACTIVE && session && profile && screenStream) {
      rdcEngine.quitControl(rdcSignal.uid, rdcEngine.getRole());
      updateProfile(session.id, id, {
        rdcStatus: RDCStatus.IDLE,
        screenVisibility: ScreenVisibility.ONLY_HOST,
        streams: [{ id: screenStream.id, video: false, audio: false }],
      });
      message.success(intl.formatMessage({ id: 'message.rdc.quit' }));
    }
  };

  useEffect(() => {
    const attacheEL = attachElRef.current;
    if (!attacheEL || !rtcEngine || !cameraStream) {
      return;
    }
    if (
      cameraStream.video &&
      (isSelf || publishedStreams.includes(cameraStream.uid)) &&
      !isSubscribed
    ) {
      rtcEngine.subscribe(cameraStream.uid, attacheEL, isSelf);
      setIsSubscribed(true);
    }
    if (!cameraStream.video && isSubscribed) {
      rtcEngine.unsubscribe(cameraStream.uid, isSelf);
      setIsSubscribed(false);
    }
    return () => {
      if (!cameraStream.video && isSubscribed) {
        rtcEngine.unsubscribe(cameraStream.uid);
      }
    };
  }, [
    attachElRef,
    rtcEngine,
    cameraStream,
    isSelf,
    isSubscribed,
    publishedStreams,
  ]);

  return (
    <div
      className={cls({
        'a6y-stream': 1,
        'a6y-host': role === RoleType.HOST,
        'a6y-normal': role === RoleType.NORMAL,
        'a6y-playing':
          cameraStream?.video && publishedStreams.includes(cameraStream?.uid),
        'a6y-mirror': !isSelf,
      })}
      ref={attachElRef}>
      <div className="a6y-stream-username">{username}</div>
      {profile?.role === RoleType.HOST || isSelf ? (
        <div className="a6y-stream-actions">
          <Tooltip
            placement="bottomLeft"
            overlay={
              cameraStream?.audio
                ? intl.formatMessage({ id: 'a6y.stream.audio.off' })
                : intl.formatMessage({
                    id: `a6y.stream.audio.on${isSelf ? '' : '.request'}`,
                  })
            }>
            <button className="action" onClick={handleMicrophone}>
              {cameraStream?.audio ? (
                <BiMicrophone size={20} />
              ) : (
                <BiMicrophoneOff size={20} />
              )}
            </button>
          </Tooltip>
          <Tooltip
            placement="bottomLeft"
            overlay={
              cameraStream?.video
                ? intl.formatMessage({ id: 'a6y.stream.video.off' })
                : intl.formatMessage({
                    id: `a6y.stream.video.on${isSelf ? '' : '.request'}`,
                  })
            }>
            <button className="action" onClick={handleCamera}>
              {cameraStream?.video ? (
                <BiVideo size={20} />
              ) : (
                <BiVideoOff size={20} />
              )}
            </button>
          </Tooltip>
          {profile?.role === RoleType.HOST && !isSelf ? (
            <Tooltip
              placement="bottomLeft"
              visible={screenShare ? false : undefined}
              overlay={
                screenStream?.video
                  ? intl.formatMessage({ id: 'a6y.stream.rdc.off' })
                  : intl.formatMessage({ id: 'a6y.stream.rdc.on' })
              }>
              <button
                className="action"
                onClick={handleRemoteDesktop}
                disabled={screenShare}>
                <ImDisplay size={16} />
              </button>
            </Tooltip>
          ) : null}
          <Tooltip
            placement="bottomLeft"
            visible={rdcStatus !== RDCStatus.IDLE ? false : undefined}
            overlay={
              screenStream?.video
                ? intl.formatMessage({ id: 'a6y.stream.screenShare.off' })
                : intl.formatMessage({
                    id: `a6y.stream.screenShare.on${isSelf ? '' : '.request'}`,
                  })
            }>
            <button
              className="action"
              onClick={handleScreenShare}
              disabled={rdcStatus !== RDCStatus.IDLE}>
              {screenStream?.video && rdcStatus !== RDCStatus.ACTIVE ? (
                <MdOutlineScreenShare size={20} />
              ) : (
                <MdOutlineStopScreenShare size={20} />
              )}
            </button>
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
};
