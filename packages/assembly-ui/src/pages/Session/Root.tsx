import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Collapse, Layout, message, Modal, Tabs } from 'antd';
import {
  useCheckInOut,
  useProfile,
  useProfilesInSession,
  useEngines,
  useSession,
  useSignalling,
  ProfileInSession,
  useIgnoreMouseEvent,
} from '../../hooks';
import {
  A6yStream,
  A6yHeader,
  A6yFastBoard,
  A6yScreenShare,
  A6yScreenSelector,
  A6yScreenSelectorPurpose,
} from '../../components';
import './index.css';
import {
  RDCStatus,
  StreamKind,
  SignalKind,
  RoleType,
  ScreenVisibility,
} from 'assembly-shared';
import { updateProfile } from '../../services/api';
import { Commands } from '../../services/Signalling';
import { useIntl } from 'react-intl';
import { RDCRoleType } from 'agora-rdc-electron';
import { ipcRenderer, remote } from 'electron';
import { BiStopCircle } from 'react-icons/bi';

const BITRATES: { [key: string]: number } = {
  '1280x720': 1000,
  '1920x1080': 2000,
};

export const Root = () => {
  useCheckInOut();
  const profilesInSession = useProfilesInSession();
  const session = useSession();
  const { profile } = useProfile();
  const { signalling } = useSignalling();
  const intl = useIntl();
  const ignoreMouseEvent = useIgnoreMouseEvent();
  const { setDisplayId, setDisplayConfig, rdcEngine, rtcEngine } = useEngines();
  const [screenSelectorVisible, setScreenSelectorVisible] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string>();
  const [screenSelectorPurpose, setScreenSelectorPurpose] =
    useState<A6yScreenSelectorPurpose>();
  const [screenSelectorTitle, setScreenSelectorTitle] = useState<string>();
  const [controlledBy, setControlledBy] = useState<ProfileInSession>();
  const screenStream = profile?.streams.find(
    (s) => s.kind === StreamKind.SCREEN,
  );
  const cameraStream = profile?.streams.find(
    (s) => s.kind === StreamKind.CAMERA,
  );
  const hasMarkable = useMemo(
    () => !!profilesInSession.find((p) => p.markable),
    [profilesInSession],
  );

  const handleStartScreenShare = () => {
    setScreenSelectorPurpose('screenShare');
    setScreenSelectorVisible(true);
  };

  const handleStopScreenShare = () => {
    if (!session || !profile || !screenStream) {
      return;
    }
    updateProfile(session.id, profile.id, {
      screenShare: false,
      markable: false,
      screenVisibility: ScreenVisibility.ONLY_HOST,
      streams: [{ id: screenStream.id, video: false, audio: false }],
    });
  };

  const handleScreenSelectorOk = async (
    displayId: any,
    [width, height]: [number, number],
    withAudio: boolean,
  ) => {
    if (
      !screenStream ||
      !cameraStream ||
      !profile ||
      !session ||
      !setDisplayId ||
      !setDisplayConfig
    ) {
      return;
    }
    if (screenSelectorPurpose === 'screenShare') {
      setDisplayId(displayId);
      setDisplayConfig({
        height,
        width,
        bitrate: BITRATES[`${width}x${height}`],
        frameRate: 15,
      });
      const streams = [{ id: screenStream.id, video: true, audio: withAudio }];
      if (withAudio && !cameraStream.audio) {
        streams.push({
          id: cameraStream.id,
          video: cameraStream.video,
          audio: true,
        });
      }
      await updateProfile(session.id, profile.id, {
        screenShare: !profile.screenShare,
        screenVisibility:
          profile.role === RoleType.HOST
            ? ScreenVisibility.ALL
            : ScreenVisibility.ONLY_HOST,
        streams,
      });
      setScreenSelectorVisible(false);
      return;
    }

    const signal = controlledBy?.signals.find((s) => s.kind === SignalKind.RDC);
    if (screenSelectorPurpose !== 'rdc' || !rdcEngine || !signal) {
      return;
    }

    await updateProfile(session.id, profile.id, {
      rdcStatus: RDCStatus.ACTIVE,
      streams: [{ id: screenStream.id, video: true, audio: withAudio }],
    });
    rdcEngine.authorizeControl(signal.uid, displayId, {
      height,
      width,
      bitrate: BITRATES[`${width}x${height}`],
    });
    setScreenSelectorVisible(false);
    message.warn({
      content: (
        <>
          <span>
            {intl
              .formatMessage({
                id: 'session.controlledBy',
              })
              .replace('{username}', controlledBy?.username ?? '')}
          </span>
          <BiStopCircle
            style={{
              verticalAlign: 'middle',
              marginLeft: 8,
              color: '#a61d24',
              cursor: 'pointer',
            }}
            size={18}
            onClick={() => {
              Modal.confirm({
                content: intl.formatMessage({
                  id: 'session.confirm.stopControl',
                }),
                onOk: handleStopControl,
              });
            }}
          />
        </>
      ),
      duration: 0,
      key: controlledBy?.id,
    });
  };

  const handleScreenSelectorCancel = useCallback(async () => {
    setScreenSelectorVisible(false);
    const signal = controlledBy?.signals.find((s) => s.kind === SignalKind.RDC);
    if (screenSelectorPurpose !== 'rdc' || !rdcEngine || !signal) {
      return;
    }
    rdcEngine.unauthorizeControl(signal.uid);
    setScreenSelectorPurpose(undefined);
    setControlledBy(undefined);
  }, [
    setScreenSelectorVisible,
    screenSelectorPurpose,
    rdcEngine,
    controlledBy,
  ]);

  const handleChangeDeviceStateChange = useCallback(
    async (payload: {
      profileId: string;
      username: string;
      streamId: string;
      screenShare?: boolean;
      audio?: boolean;
      video?: boolean;
    }) => {
      if (!profile || !session) {
        return;
      }
      const updateDeviceState = () =>
        updateProfile(session.id, profile.id, {
          screenShare: payload.screenShare,
          screenVisibility: ScreenVisibility.ONLY_HOST,
          streams: [
            {
              id: payload.streamId,
              audio: payload.audio,
              video: payload.video,
            },
          ],
        });
      Modal.destroyAll();
      if (
        process.platform === 'darwin' &&
        (payload.audio || payload.screenShare || payload.video) &&
        !remote.getCurrentWindow().isVisibleOnAllWorkspaces()
      ) {
        console.log('visible on all workspaces');
        remote.getCurrentWindow().show();
      }
      if (payload.audio) {
        Modal.confirm({
          title: `${payload.username} ${intl.formatMessage({
            id: 'modal.invite.audio.title',
          })}`,
          onOk: updateDeviceState,
          afterClose: () => {
            if (!profile.screenShare) {
              return;
            }
            ipcRenderer.send('set-ignore-mouse-events', true, {
              forward: true,
            });
          },
        });
        ipcRenderer.send('set-ignore-mouse-events', false);
        return;
      }
      if (!payload.screenShare && payload.video) {
        Modal.confirm({
          title: `${payload.username} ${intl.formatMessage({
            id: 'modal.invite.video.title',
          })}`,
          onOk: updateDeviceState,
          afterClose: () => {
            if (!profile.screenShare) {
              return;
            }
            ipcRenderer.send('set-ignore-mouse-events', true, {
              forward: true,
            });
          },
        });
        ipcRenderer.send('set-ignore-mouse-events', false);
        return;
      }
      if (payload.screenShare && payload.video) {
        setScreenSelectorPurpose('screenShare');
        setScreenSelectorTitle(
          `${payload.username} ${intl.formatMessage({
            id: 'modal.invite.screenShare.title',
          })}`,
        );
        setScreenSelectorVisible(true);
        return;
      }
      if (payload.audio === false) {
        message.info(
          `${payload.username} ${intl.formatMessage({
            id: 'message.disable.audio.title',
          })}`,
        );
      }
      if (
        payload.video === false &&
        typeof payload.screenShare === 'undefined'
      ) {
        message.info(
          `${payload.username} ${intl.formatMessage({
            id: 'message.disable.video.title',
          })}`,
        );
      }
      if (payload.screenShare === false) {
        message.info(
          `${payload.username} ${intl.formatMessage({
            id: 'message.disable.screenShare.title',
          })}`,
        );
      }
      updateDeviceState();
    },
    [session, profile, intl],
  );

  const handleRequestControl = useCallback(
    (uid: string) => {
      const profile = profilesInSession.find((p) => {
        const signal = p.signals.find((s) => s.kind === SignalKind.RDC);
        return signal && signal.uid === uid;
      });
      if (!profile) {
        return;
      }
      setControlledBy(profile);
      setScreenSelectorPurpose('rdc');
      setScreenSelectorTitle(
        intl
          .formatMessage({ id: 'modal.request.control.title' })
          .replace('{username}', profile.username),
      );
      setScreenSelectorVisible(true);
      if (
        process.platform === 'darwin' &&
        !remote.getCurrentWindow().isVisibleOnAllWorkspaces()
      ) {
        console.log('visible on all workspaces');
        remote.getCurrentWindow().show();
      }
    },
    [setControlledBy, profilesInSession, intl],
  );

  const handleRequestUnauthorized = useCallback(
    (uid) => {
      const profile = profilesInSession.find((p) => {
        const signal = p.signals.find((s) => s.kind === SignalKind.RDC);
        return signal && signal.uid === uid;
      });
      if (!profile) {
        return;
      }
      message.info(
        intl
          .formatMessage({ id: 'message.rdc.unauthorized.title' })
          .replace('{username}', profile.username),
      );
      setControlledBy(undefined);
    },
    [intl, profilesInSession, setControlledBy],
  );

  const handleQuitControl = useCallback(
    (uid?: string) => {
      const signal = controlledBy?.signals.find(
        (s) => s.kind === SignalKind.RDC,
      );
      if (!rdcEngine || !signal || !rtcEngine) {
        return;
      }
      rtcEngine.unpublishFSS();
      rdcEngine.quitControl(signal.uid, RDCRoleType.CONTROLLED);
      message.destroy(controlledBy?.id);
      setControlledBy(undefined);
    },
    [rdcEngine, rtcEngine, controlledBy, setControlledBy],
  );

  const handleStopControl = useCallback(async () => {
    if (!profile || !session || !screenStream) {
      return;
    }
    handleQuitControl();
    await updateProfile(session.id, profile.id, {
      rdcStatus: RDCStatus.IDLE,
      screenVisibility: ScreenVisibility.ONLY_HOST,
      streams: [{ id: screenStream.id, video: false, audio: false }],
    });
  }, [handleQuitControl, session, profile, screenStream]);

  const handleScreenLocked = useCallback(async () => {
    if (!session || !profile || !screenStream) {
      return;
    }
    if (profile.rdcStatus === RDCStatus.ACTIVE) {
      handleQuitControl();
      await updateProfile(session.id, profile.id, {
        rdcStatus: RDCStatus.IDLE,
        screenVisibility: ScreenVisibility.ONLY_HOST,
        markable: false,
        streams: [{ id: screenStream.id, video: false, audio: false }],
      });
    }
  }, [session, profile, screenStream, handleQuitControl]);

  useEffect(() => {
    if (profile && profile.screenShare) {
      document.body.classList.add('a6y-focus-mode');
    } else {
      document.body.classList.remove('a6y-focus-mode');
    }
  }, [profile]);

  useEffect(() => {
    if (!signalling) {
      return;
    }
    signalling.on(
      Commands.REQUEST_CHANGE_DEVICE_STATE,
      handleChangeDeviceStateChange,
    );
    return () => {
      signalling.off(
        Commands.REQUEST_CHANGE_DEVICE_STATE,
        handleChangeDeviceStateChange,
      );
    };
  }, [signalling, handleChangeDeviceStateChange]);

  useEffect(() => {
    if (!rdcEngine) {
      return;
    }
    rdcEngine.on('rdc-request-control', handleRequestControl);
    rdcEngine.on('rdc-request-control-unauthorized', handleRequestUnauthorized);
    rdcEngine.on('rdc-quit-control', handleQuitControl);
    return () => {
      rdcEngine.off('rdc-request-control', handleRequestControl);
      rdcEngine.off(
        'rdc-request-control-unauthorized',
        handleRequestUnauthorized,
      );
      rdcEngine.off('rdc-quit-control', handleQuitControl);
    };
  }, [
    rdcEngine,
    handleRequestControl,
    handleRequestUnauthorized,
    handleQuitControl,
  ]);

  useEffect(() => {
    const profileInSession = profilesInSession.find(
      (p) => p.screenShare && p.role === RoleType.HOST,
    );
    if (!profileInSession) {
      return;
    }
    setActiveTabKey(profileInSession.id);
  }, [profilesInSession, setActiveTabKey]);

  useEffect(() => {
    remote.powerMonitor.on('lock-screen', handleScreenLocked);
    return () => {
      remote.powerMonitor.off('lock-screen', handleScreenLocked);
    };
  }, [handleScreenLocked]);

  useEffect(() => {
    if (!session?.id || !profile?.id) {
      return;
    }
    updateProfile(session.id, profile.id, {
      aspectRatio: window.screen.height / window.screen.width,
    });
  }, [session?.id, profile?.id]);

  return (
    <>
      <Layout
        style={{
          height: `calc(100vh - ${process.platform === 'darwin' ? 32 : 28}px)`,
          width: '100vw',
          marginTop: process.platform === 'darwin' ? 32 : 28,
        }}>
        <Layout.Header>
          <A6yHeader onStopScreenShare={handleStopScreenShare} />
        </Layout.Header>
        <Layout>
          <Layout.Content>
            <div className="a6y-screen-shares">
              <Tabs
                activeKey={activeTabKey}
                destroyInactiveTabPane={true}
                onTabClick={(activeKey) => setActiveTabKey(activeKey)}>
                {profilesInSession
                  .filter(
                    (p) =>
                      (p.screenShare || p.rdcStatus === RDCStatus.ACTIVE) &&
                      p.id !== profile?.id,
                  )
                  .filter(
                    (p) =>
                      (profile?.role === RoleType.NORMAL &&
                        p.screenVisibility === ScreenVisibility.ALL) ||
                      profile?.role === RoleType.HOST,
                  )
                  .map((p) => (
                    <Tabs.TabPane key={p.id} tab={p.username}>
                      <A6yScreenShare
                        profileInSession={p}
                        hasMarkable={hasMarkable}
                      />
                    </Tabs.TabPane>
                  ))}
              </Tabs>
            </div>
          </Layout.Content>
          <Layout.Sider
            width={216}
            style={{ backgroundColor: 'transparent', overflowY: 'auto' }}>
            <>
              {profile?.screenShare ? (
                <div className="a6y-streams" {...ignoreMouseEvent}>
                  <Collapse bordered={false} defaultActiveKey="streams">
                    <Collapse.Panel key="streams" header={null}>
                      {profilesInSession.map((profile) => (
                        <A6yStream
                          key={profile.id}
                          profileInSession={profile}
                          onStartScreenShare={handleStartScreenShare}
                        />
                      ))}
                    </Collapse.Panel>
                  </Collapse>
                </div>
              ) : (
                profilesInSession.map((profile) => (
                  <A6yStream
                    key={profile.id}
                    profileInSession={profile}
                    onStartScreenShare={handleStartScreenShare}
                  />
                ))
              )}
            </>
          </Layout.Sider>
        </Layout>
      </Layout>
      {profile?.markable ? (
        <A6yFastBoard
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: window.screen.height,
            width: window.screen.width,
          }}
          aspectRatio={profile?.aspectRatio}
          scene={`/screen-share/${profile?.id}`}
        />
      ) : null}
      {screenSelectorVisible ? (
        <A6yScreenSelector
          title={screenSelectorTitle}
          purpose={screenSelectorPurpose}
          visible={screenSelectorVisible}
          onOk={handleScreenSelectorOk}
          onCancel={handleScreenSelectorCancel}
        />
      ) : null}
    </>
  );
};
