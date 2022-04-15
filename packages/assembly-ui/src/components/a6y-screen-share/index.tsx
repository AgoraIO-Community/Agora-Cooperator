import React, {
  FC,
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
} from 'react';
import {
  RDCStatus,
  RoleType,
  ScreenVisibility,
  SignalKind,
  StreamKind,
} from 'assembly-shared';
import cls from 'classnames';
import { BiPencil, BiExitFullscreen, BiFullscreen } from 'react-icons/bi';
import { RDCRoleType } from 'agora-rdc-electron';
import { useToggle } from 'react-use';
import {
  useProfile,
  useEngines,
  ProfileInSession,
  useSession,
} from '../../hooks';
import { A6yFastBoard } from '../a6y-fast-board';
import { updateProfile } from '../../services/api';
import './index.css';
import { Dropdown, Menu } from 'antd';
import { useIntl } from 'react-intl';

const WORK_AREA_HEIGHT_MAPS: { [k: string]: number } = {
  darwin: 166,
  win32: 138,
};
export interface A6yScreenShareProps {
  profileInSession: ProfileInSession;
  hasMarkable?: boolean;
}
export const A6yScreenShare: FC<A6yScreenShareProps> = memo(
  ({ profileInSession, hasMarkable }) => {
    const [[height, width], setSize] = useState([0, 0]);
    const [[fbHeight, fbWidth], setFbSize] = useState([0, 0]);
    const attachElRef = useRef<HTMLDivElement>(null);
    const screenShareElRef = useRef<HTMLDivElement>(null);
    const intl = useIntl();
    const { rtcEngine, rdcEngine, publishedStreams, authorizedControlUids } =
      useEngines();
    const session = useSession();
    const { profile } = useProfile();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isFullscreen, toggleFullscreen] = useToggle(false);
    const isSelf = profileInSession.id === profile?.id;
    const rdcSignal = profileInSession.signals.find(
      (s) => s.kind === SignalKind.RDC,
    );
    const screenStream = profileInSession?.streams.find(
      (s) => s.kind === StreamKind.SCREEN,
    );

    const SCREEN_VISIBILITY_MAP: { [key in ScreenVisibility]: string } = {
      [ScreenVisibility.ONLY_HOST]: intl.formatMessage({
        id: 'ay6.screenShare.screenVisibility.onlyHost',
      }),
      [ScreenVisibility.ALL]: intl.formatMessage({
        id: 'ay6.screenShare.screenVisibility.all',
      }),
    };

    const updateSize = useCallback(() => {
      const height =
        window.innerHeight - (WORK_AREA_HEIGHT_MAPS[process.platform] ?? 138);
      const width = window.innerWidth - 232;
      console.log('updateSize', height, width);
      setSize([height, width]);
    }, [setSize]);

    const toggleMarkable = async () => {
      if (!session || !profileInSession) {
        return;
      }
      await updateProfile(session.id, profileInSession.id, {
        markable: !profileInSession.markable,
      });
    };

    const handleVisibilityChange =
      (visibility: ScreenVisibility) => async () => {
        if (!session || !profileInSession) {
          return;
        }
        await updateProfile(session.id, profileInSession.id, {
          screenVisibility: visibility,
        });
      };

    useEffect(() => {
      const attachEl = attachElRef.current;
      if (
        !profileInSession ||
        !screenStream ||
        !rtcEngine ||
        !rdcEngine ||
        !rdcSignal ||
        !attachEl ||
        isSelf ||
        isSubscribed
      ) {
        return;
      }
      if (
        profileInSession.rdcStatus === RDCStatus.ACTIVE &&
        screenStream.video &&
        publishedStreams.includes(screenStream.uid) &&
        rdcEngine.getRole() === RDCRoleType.CONTROLLED
      ) {
        rdcEngine.observe(rdcSignal.uid, screenStream.uid, attachEl);
        setIsSubscribed(true);
      }

      if (
        profileInSession.rdcStatus === RDCStatus.ACTIVE &&
        screenStream.video &&
        publishedStreams.includes(screenStream.uid) &&
        authorizedControlUids.includes(rdcSignal.uid) &&
        rdcEngine.getRole() === RDCRoleType.HOST
      ) {
        rdcEngine.takeControl(rdcSignal.uid, screenStream.uid, attachEl);
        setIsSubscribed(true);
      }

      if (
        profileInSession.screenShare &&
        screenStream.video &&
        publishedStreams.includes(screenStream.uid)
      ) {
        rtcEngine.subscribe(screenStream.uid, attachEl);
        setIsSubscribed(true);
      }
      return () => {
        if (!isSubscribed) {
          return;
        }
        rdcEngine.unobserve(rdcSignal.id, screenStream.uid);
        rtcEngine.unsubscribe(screenStream.uid);
      };
    }, [
      rtcEngine,
      profileInSession,
      authorizedControlUids,
      screenStream,
      rdcEngine,
      rdcSignal,
      attachElRef,
      isSelf,
      isSubscribed,
      publishedStreams,
    ]);

    useEffect(() => {
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }, [updateSize]);

    useEffect(() => {
      const attachEl = attachElRef.current;
      if (!attachEl) {
        return;
      }
      let resizeObserver: ResizeObserver;
      const handElResize: ResizeObserverCallback = (entries, _observer) => {
        const entry = entries.find(
          (entry) => entry.target instanceof HTMLCanvasElement,
        );
        if (!entry) {
          return;
        }
        const target = entry.target as HTMLCanvasElement;
        const { width: cWidth, height: cHeight, style } = target;
        // @ts-ignore TS2339: Property 'zoom' does not exist on type 'CSSStyleDeclaration'.
        const zoom = Number(style.zoom);
        console.log('resize w', [cHeight * zoom, cWidth * zoom]);
        setFbSize([cHeight * zoom, cWidth * zoom]);
      };
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const targetEl = mutation.target as HTMLDivElement;
          const renderingEl = targetEl.querySelector('canvas');
          if (mutation.addedNodes.length > 0 && renderingEl) {
            if (resizeObserver) {
              resizeObserver.disconnect();
            }
            resizeObserver = new ResizeObserver(handElResize);
            resizeObserver.observe(renderingEl);
            const { width: cWidth, height: cHeight, style } = renderingEl;
            // @ts-ignore TS2339: Property 'zoom' does not exist on type 'CSSStyleDeclaration'.
            const zoom = Number(style.zoom);
            console.log('resize w', [cHeight * zoom, cWidth * zoom]);
            setFbSize([cHeight * zoom, cWidth * zoom]);
          }
        });
      });
      mutationObserver.observe(attachEl, {
        childList: true,
        attributeFilter: ['style'],
      });
      return () => {
        mutationObserver.disconnect();
      };
    }, [attachElRef]);

    useEffect(() => {
      const screenShareEl = screenShareElRef.current;
      if (!screenShareEl) {
        return;
      }
      if (isFullscreen) {
        screenShareEl.requestFullscreen();
      }
      if (!isFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
    }, [isFullscreen, screenShareElRef]);

    return (
      <div
        style={{
          height: isFullscreen ? '100%' : undefined,
          width: isFullscreen ? '100%' : undefined,
        }}
        className={cls({
          'a6y-screen-share': 1,
          playing: isSubscribed,
        })}
        ref={screenShareElRef}>
        <div
          className="a6y-screen-share-container"
          ref={attachElRef}
          style={{
            height: height === 0 || isFullscreen ? '100%' : `${height}px`,
            width: width === 0 || isFullscreen ? '100%' : `${width}px`,
          }}></div>
        {profileInSession.screenShare ? (
          <div className="a6y-fastboard-container">
            <A6yFastBoard
              scene={`/screen-share/${profileInSession.id}`}
              markable={profileInSession.markable}
              style={{ height: fbHeight, width: fbWidth }}
            />
          </div>
        ) : null}
        {
          <div
            className={cls({
              'a6y-screen-share-controls': 1,
              'host-controls': profile?.role === RoleType.HOST,
            })}>
            {profileInSession.screenShare ? (
              <button
                className={cls({
                  'a6y-markable': 1,
                  [`enabled`]: profileInSession?.markable,
                })}
                onClick={toggleMarkable}
                disabled={hasMarkable && !profileInSession.markable}>
                <BiPencil size={16} />
              </button>
            ) : null}
            <button className="a6y-fullscreen" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <BiExitFullscreen size={16} />
              ) : (
                <BiFullscreen size={16} />
              )}
            </button>
            {profile?.role === RoleType.HOST ? (
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item
                      onClick={handleVisibilityChange(
                        ScreenVisibility.ONLY_HOST,
                      )}>
                      {SCREEN_VISIBILITY_MAP[ScreenVisibility.ONLY_HOST]}
                    </Menu.Item>
                    <Menu.Item
                      onClick={handleVisibilityChange(ScreenVisibility.ALL)}>
                      {SCREEN_VISIBILITY_MAP[ScreenVisibility.ALL]}
                    </Menu.Item>
                  </Menu>
                }>
                <button className="a6y-screen-visibility">
                  {
                    SCREEN_VISIBILITY_MAP[
                      profileInSession.screenVisibility ??
                        ScreenVisibility.ONLY_HOST
                    ]
                  }
                </button>
              </Dropdown>
            ) : null}
          </div>
        }
      </div>
    );
  },
);
