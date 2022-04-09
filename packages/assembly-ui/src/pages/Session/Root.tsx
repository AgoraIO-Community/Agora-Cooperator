import React, { useCallback, useEffect, useState } from 'react';
import { Layout, message, Modal, Tabs } from 'antd';
import {
  useCheckInOut,
  useProfile,
  useProfilesInSession,
  useEngines,
  useSession,
  useSignalling,
  ProfileInSession,
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
import { RDCStatus, StreamKind, SignalKind } from 'assembly-shared';
import { updateProfile } from '../../services/api';
import { Commands } from '../../services/Signalling';
import { useIntl } from 'react-intl';
import { RDCRoleType } from 'agora-rdc-electron';

export const Root = () => {
  useCheckInOut();
  const profilesInSession = useProfilesInSession();
  const session = useSession();
  const { profile } = useProfile();
  const { signalling } = useSignalling();
  const intl = useIntl();
  const { setDisplayId, rdcEngine } = useEngines();
  const [screenSelectorVisible, setScreenSelectorVisible] = useState(false);
  const [screenSelectorPurpose, setScreenSelectorPurpose] =
    useState<A6yScreenSelectorPurpose>();
  const [screenSelectorTitle, setScreenSelectorTitle] = useState<string>();
  const [controlledBy, setControlledBy] = useState<ProfileInSession>();
  const screenStream = profile?.streams.find(
    (s) => s.kind === StreamKind.SCREEN,
  );

  useEffect(() => {
    if (profile && profile.screenShare) {
      document.body.classList.add('a6y-focus-mode');
    } else {
      document.body.classList.remove('a6y-focus-mode');
    }
  }, [profile]);

  const handleStartScreenShare = () => {
    setScreenSelectorPurpose('screenShare');
    setScreenSelectorVisible(true);
  };

  const handleScreenSelectorOk = async (displayId: any, withAudio: boolean) => {
    if (!screenStream || !profile || !session || !setDisplayId) {
      return;
    }
    if (screenSelectorPurpose === 'screenShare') {
      setDisplayId(displayId);
      await updateProfile(session.id, profile.id, {
        screenShare: !profile.screenShare,
        streams: [{ id: screenStream.id, video: true, audio: withAudio }],
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
    rdcEngine.authorizeControl(signal.uid, displayId);
    setScreenSelectorVisible(false);
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
          streams: [
            {
              id: payload.streamId,
              audio: payload.audio,
              video: payload.video,
            },
          ],
        });
      Modal.destroyAll();
      if (payload.audio) {
        Modal.confirm({
          title: `${payload.username} ${intl.formatMessage({
            id: 'modal.invite.audio.title',
          })}`,
          onOk: updateDeviceState,
        });
        return;
      }
      if (!payload.screenShare && payload.video) {
        Modal.confirm({
          title: `${payload.username} ${intl.formatMessage({
            id: 'modal.invite.video.title',
          })}`,
          onOk: updateDeviceState,
        });
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
      if (payload.video === false && typeof payload.screenShare === 'undefined') {
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
    },
    [intl, profilesInSession],
  );

  const handleQuitControl = useCallback(
    (uid: string) => {
      const signal = controlledBy?.signals.find(
        (s) => s.kind === SignalKind.RDC,
      );
      if (!rdcEngine || !signal) {
        return;
      }
      rdcEngine.quitControl(signal.uid, RDCRoleType.CONTROLLED);
    },
    [rdcEngine, controlledBy],
  );

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

  return (
    <>
      <Layout
        style={{
          height: `calc(100vh - ${process.platform === 'darwin' ? 32 : 28}px)`,
          width: '100vw',
          marginTop: process.platform === 'darwin' ? 32 : 28,
        }}>
        <Layout.Header>
          <A6yHeader />
        </Layout.Header>
        <Layout>
          <Layout.Content className="a6y-screen-shares">
            <Tabs>
              {profilesInSession
                .filter(
                  (p) =>
                    (p.screenShare || p.rdcStatus === RDCStatus.ACTIVE) &&
                    p.id !== profile?.id,
                )
                .map((p) => (
                  <Tabs.TabPane key={p.id} tab={p.username}>
                    <A6yScreenShare profileInSession={p} />
                  </Tabs.TabPane>
                ))}
            </Tabs>
          </Layout.Content>
          <Layout.Sider
            width={216}
            style={{ backgroundColor: 'transparent', overflowY: 'auto' }}>
            {profilesInSession.map((profile) => (
              <A6yStream
                key={profile.id}
                profileInSession={profile}
                onStartScreenShare={handleStartScreenShare}
              />
            ))}
          </Layout.Sider>
        </Layout>
      </Layout>
      <A6yFastBoard markable={profile?.markable} />
      <A6yScreenSelector
        title={screenSelectorTitle}
        purpose={screenSelectorPurpose}
        visible={screenSelectorVisible}
        onOk={handleScreenSelectorOk}
        onCancel={handleScreenSelectorCancel}
      />
    </>
  );
};
