import React, { FC, useCallback, useEffect, useState } from 'react';
import { useUnmount } from 'react-use';
import { EnginesContext } from './context';
import {
  RtcEngine,
  DisplayConfiguration,
  RtcEngineEvents,
} from '../../services/RtcEngine';
import { useProfile } from '../profile';
import { RoleType, SignalKind, StreamKind } from 'assembly-shared';
import { useSession } from '../session';
import { AgoraRemoteDesktopControl, RDCRoleType } from 'agora-rdc-electron';
import { uniq } from 'lodash';
import { ipcRenderer } from 'electron';
import { useTitlebar } from '../titlebar';

enum ExternalStatus {
  IDLE_FOR_RDC = 0,
  IDLE_FOR_SCREEN_SHARE = 1,
  OCCUPIED_BY_RDC = 2,
  OCCUPIED_BY_SCREEN_SHARE = 3,
}

const ROLE_MAPS: { [key in RoleType]: RDCRoleType } = {
  [RoleType.HOST]: RDCRoleType.HOST,
  [RoleType.NORMAL]: RDCRoleType.CONTROLLED,
};

export const EnginesProvider: FC = ({ children }) => {
  const titleBar = useTitlebar();
  const [rtcEngine, setRtcEngine] = useState<RtcEngine>();
  const [rdcEngine, setRdcEngine] = useState<AgoraRemoteDesktopControl>();
  const [networkQuality, setNetworkQuality] = useState<{
    up: number;
    down: number;
  }>({ up: 0, down: 0 });
  const [publishedStreams, setPublishedStreams] = useState<number[]>([]);
  const [authorizedControlUids, setAuthorizedControlUids] = useState<string[]>(
    [],
  );
  const [displayId, setDisplayId] = useState<any>(undefined);
  const [displayConfig, setDisplayConfig] = useState<DisplayConfiguration>({
    frameRate: 15,
    bitrate: 1000,
    height: 720,
    width: 1280,
  });
  const [externalStatus, setExternalStatus] = useState<ExternalStatus>(
    ExternalStatus.IDLE_FOR_RDC,
  );
  const { profile } = useProfile();
  const session = useSession();

  const handleNetworkQualityChange = useCallback(
    ({ up = 0, down = 0 }) => {
      setNetworkQuality({ up, down });
    },
    [setNetworkQuality],
  );

  const handleStreamPublished = useCallback(
    (uid: number) => {
      console.log('stream published', uniq([...publishedStreams, uid]));
      setPublishedStreams(uniq([...publishedStreams, uid]));
    },
    [publishedStreams, setPublishedStreams],
  );

  const handleStreamUnpublished = useCallback(
    (uid: number) => {
      setPublishedStreams(publishedStreams.filter((s) => s !== uid));
    },
    [publishedStreams, setPublishedStreams],
  );

  const handleAuthorizedControl = useCallback(
    (uid: string) => {
      setAuthorizedControlUids(uniq([...authorizedControlUids, uid]));
    },
    [authorizedControlUids],
  );

  const handleQuitControl = useCallback(
    (uid: string) => {
      setAuthorizedControlUids(authorizedControlUids.filter((u) => u !== uid));
    },
    [authorizedControlUids],
  );

  // initialize rtc engine
  useEffect(() => {
    const cameraStream = profile?.streams.find(
      (s) => s.kind === StreamKind.CAMERA,
    );
    const channel = session?.channel;
    if (!cameraStream || !session || !channel || rtcEngine) {
      return;
    }
    const { appId, token, uid } = cameraStream;
    const engine = RtcEngine.singleton(appId);
    engine.joinChannel(token, channel, uid);
    setRtcEngine(engine);
  }, [profile, session, rtcEngine]);

  // initialize rdc engine
  useEffect(() => {
    if (
      !rtcEngine ||
      !session ||
      !profile ||
      externalStatus !== ExternalStatus.IDLE_FOR_RDC
    ) {
      return;
    }
    const screenStream = profile.streams.find(
      (s) => s.kind === StreamKind.SCREEN,
    );
    const signal = profile.signals.find((s) => s.kind === SignalKind.RDC);
    if (!screenStream || !signal) {
      return;
    }
    const instance = new AgoraRemoteDesktopControl(rtcEngine.instance, {
      appId: signal.appId,
      role: ROLE_MAPS[profile.role],
    });
    const { uid: userId, token } = signal;
    const { uid: streamId, token: streamToken } = screenStream;
    instance.join(userId, token, session.channel, streamId, streamToken);
    setRdcEngine(instance);
    setExternalStatus(ExternalStatus.OCCUPIED_BY_RDC);
  }, [profile, session, rtcEngine, externalStatus]);

  // handle camera stream publish or unpublish
  useEffect(() => {
    const cameraStream = profile?.streams.find(
      (s) => s.kind === StreamKind.CAMERA,
    );
    if (!cameraStream || !rtcEngine) {
      return;
    }
    const { video, audio } = cameraStream;
    rtcEngine.publishOrUnpublish(audio, video);
  }, [profile, rtcEngine]);

  // handle screen stream publish
  useEffect(() => {
    const screenStream = profile?.streams.find(
      (s) => s.kind === StreamKind.SCREEN,
    );
    if (!rtcEngine || !profile || !session || !screenStream) {
      return;
    }
    const { appId, token, uid, video, audio } = screenStream;
    if (
      video &&
      displayId &&
      externalStatus === ExternalStatus.OCCUPIED_BY_RDC &&
      rdcEngine
    ) {
      const channel = session?.channel;
      rtcEngine.unpublishFSS();
      rtcEngine.leaveFSSChannel();
      rdcEngine.dispose();
      setRdcEngine(undefined);
      setExternalStatus(ExternalStatus.OCCUPIED_BY_SCREEN_SHARE);
      rtcEngine.initializeFSSRtcEngine(appId);
      rtcEngine.joinFSSChannel(token, uid, channel);
      rtcEngine.publishFSS(displayId, displayConfig, audio);
      titleBar.setVisible(false);
      ipcRenderer.invoke('screenShareStarted');
    }
    if (!video && externalStatus === ExternalStatus.OCCUPIED_BY_SCREEN_SHARE) {
      rtcEngine.unpublishFSS();
      rtcEngine.leaveFSSChannel();
      rtcEngine.releaseFSSRtcEngine();
      setExternalStatus(ExternalStatus.IDLE_FOR_RDC);
      titleBar.setVisible(true);
      ipcRenderer.invoke('screenShareStopped');
    }
  }, [
    rtcEngine,
    rdcEngine,
    session,
    displayId,
    displayConfig,
    profile,
    externalStatus,
    titleBar,
  ]);

  // handle RTC engine events
  useEffect(() => {
    if (!rtcEngine) {
      return;
    }
    rtcEngine.on(
      RtcEngineEvents.NETWORK_QUALITY_CHANGE,
      handleNetworkQualityChange,
    );
    rtcEngine.on(RtcEngineEvents.PUBLISHED, handleStreamPublished);
    rtcEngine.on(RtcEngineEvents.UNPUBLISHED, handleStreamUnpublished);
    return () => {
      rtcEngine.off(
        RtcEngineEvents.NETWORK_QUALITY_CHANGE,
        handleNetworkQualityChange,
      );
      rtcEngine.off(RtcEngineEvents.PUBLISHED, handleStreamPublished);
      rtcEngine.off(RtcEngineEvents.UNPUBLISHED, handleStreamUnpublished);
    };
  }, [
    rtcEngine,
    handleNetworkQualityChange,
    handleStreamPublished,
    handleStreamUnpublished,
  ]);

  // handle RDC engine events
  useEffect(() => {
    if (!rdcEngine) {
      return;
    }
    rdcEngine.on('rdc-request-control-authorized', handleAuthorizedControl);
    rdcEngine.on('rdc-quit-control', handleQuitControl);
    return () => {
      rdcEngine.off('rdc-request-control-authorized', handleAuthorizedControl);
      rdcEngine.off('rdc-quit-control', handleQuitControl);
    };
  }, [rdcEngine, handleAuthorizedControl, handleQuitControl]);

  useUnmount(async () => {
    await rtcEngine?.leaveFSSChannel();
    await rtcEngine?.releaseFSSRtcEngine();
    await rtcEngine?.leaveChannel();
    await rtcEngine?.release();
  });
  return (
    <EnginesContext.Provider
      value={{
        rtcEngine,
        networkQuality,
        publishedStreams,
        authorizedControlUids,
        setDisplayId,
        setDisplayConfig,
        rdcEngine,
      }}>
      {children}
    </EnginesContext.Provider>
  );
};
