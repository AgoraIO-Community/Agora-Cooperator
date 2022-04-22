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
import { useToggle, useWindowSize, useFullscreen } from 'react-use';
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
  ({
    profileInSession: {
      id,
      signals,
      streams,
      screenShare,
      markable,
      screenVisibility,
      rdcStatus,
      aspectRatio,
    },
    hasMarkable,
  }) => {
    const attachElRef = useRef<HTMLDivElement>(null);
    const rootElRef = useRef<HTMLDivElement>(null);
    const [isFull, toggleFullscreen] = useToggle(false);
    const isFullscreen = useFullscreen(rootElRef, isFull, {
      onClose: () => toggleFullscreen(false),
    });
    const { height, width } = useWindowSize();
    const [[fbHeight, fbWidth], setFbSize] = useState([0, 0]);
    const intl = useIntl();
    const { rtcEngine, rdcEngine, publishedStreams, authorizedControlUids } =
      useEngines();
    const session = useSession();
    const { profile } = useProfile();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const isSelf = id === profile?.id;
    const rdcSignal = signals.find((s) => s.kind === SignalKind.RDC);
    const screenStream = streams.find((s) => s.kind === StreamKind.SCREEN);

    const SCREEN_VISIBILITY_MAP: { [key in ScreenVisibility]: string } = {
      [ScreenVisibility.ONLY_HOST]: intl.formatMessage({
        id: 'ay6.screenShare.screenVisibility.onlyHost',
      }),
      [ScreenVisibility.ALL]: intl.formatMessage({
        id: 'ay6.screenShare.screenVisibility.all',
      }),
    };

    const toggleMarkable = async () => {
      if (!session) {
        return;
      }
      await updateProfile(session.id, id, {
        markable: !markable,
      });
    };

    const handleVisibilityChange = async (visibility: ScreenVisibility) => {
      if (!session) {
        return;
      }
      await updateProfile(session.id, id, {
        screenVisibility: visibility,
      });
    };

    const updateFBSize = useCallback(
      (target: HTMLCanvasElement) => {
        const { width: cWidth, height: cHeight, style } = target;
        // @ts-ignore TS2339: Property 'zoom' does not exist on type 'CSSStyleDeclaration'.
        const zoom = Number(style.zoom);
        console.log('resize w', [cHeight * zoom, cWidth * zoom]);
        setFbSize([cHeight * zoom, cWidth * zoom]);
      },
      [setFbSize],
    );

    const resizeObserverRef = useRef<ResizeObserver>(
      new ResizeObserver((entries, _observer) => {
        const entry = entries.find(
          (entry) => entry.target instanceof HTMLCanvasElement,
        );
        if (!entry) {
          return;
        }
        updateFBSize(entry.target as HTMLCanvasElement);
      }),
    );

    const mutationObserverRef = useRef<MutationObserver>(
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const targetEl = mutation.target as HTMLDivElement;
          const renderingEl = targetEl.querySelector('canvas');
          if (mutation.addedNodes.length > 0 && renderingEl) {
            resizeObserverRef.current.observe(renderingEl);
            updateFBSize(renderingEl);
          }
          if (mutation.removedNodes.length > 0 && renderingEl) {
            resizeObserverRef.current.unobserve(renderingEl);
            updateFBSize(renderingEl);
          }
        });
      }),
    );

    useEffect(() => {
      const attachEl = attachElRef.current;
      if (
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
        rdcStatus === RDCStatus.ACTIVE &&
        screenStream.video &&
        publishedStreams.includes(screenStream.uid) &&
        rdcEngine.getRole() === RDCRoleType.CONTROLLED
      ) {
        rdcEngine.observe(rdcSignal.uid, screenStream.uid, attachEl);
        setIsSubscribed(true);
      }

      if (
        rdcStatus === RDCStatus.ACTIVE &&
        screenStream.video &&
        publishedStreams.includes(screenStream.uid) &&
        authorizedControlUids.includes(rdcSignal.uid) &&
        rdcEngine.getRole() === RDCRoleType.HOST
      ) {
        rdcEngine.takeControl(rdcSignal.uid, screenStream.uid, attachEl);
        setIsSubscribed(true);
      }

      if (
        screenShare &&
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
      rdcStatus,
      screenShare,
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
      const attachEl = attachElRef.current;
      if (!attachEl) {
        return;
      }
      mutationObserverRef.current.observe(attachEl, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    }, [attachElRef]);

    const attachElH = isFullscreen
      ? height
      : height - (WORK_AREA_HEIGHT_MAPS[process.platform] ?? 138);
    const attachElW = isFullscreen ? width : width - 232;

    return (
      <div
        style={{
          height: isFullscreen ? '100%' : 'calc(100% - 16px)',
          width: isFullscreen ? '100%' : 'calc(100% - 16px)',
        }}
        className={cls({ 'a6y-screen-share': 1, playing: isSubscribed })}
        ref={rootElRef}>
        <div
          style={{
            height: `${attachElH}px`,
            width: `${attachElW}px`,
          }}
          className="a6y-screen-share-container"
          ref={attachElRef}></div>
        {profile && screenShare && markable ? (
          <div className="a6y-fastboard-container">
            <A6yFastBoard
              profile={profile}
              scene={`screen-share-${id}`}
              aspectRatio={aspectRatio}
              style={{ height: fbHeight, width: fbWidth }}
            />
          </div>
        ) : null}
        <div
          className={cls({
            'a6y-screen-share-controls': 1,
            'host-controls': profile?.role === RoleType.HOST,
          })}>
          {screenShare ? (
            <button
              className={cls({
                'a6y-markable': 1,
                [`enabled`]: markable,
              })}
              onClick={toggleMarkable}
              disabled={hasMarkable && !markable}>
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
                    key={`${ScreenVisibility.ONLY_HOST}`}
                    onClick={() =>
                      handleVisibilityChange(ScreenVisibility.ONLY_HOST)
                    }>
                    {SCREEN_VISIBILITY_MAP[ScreenVisibility.ONLY_HOST]}
                  </Menu.Item>
                  <Menu.Item
                    key={`${ScreenVisibility.ALL}`}
                    onClick={() =>
                      handleVisibilityChange(ScreenVisibility.ALL)
                    }>
                    {SCREEN_VISIBILITY_MAP[ScreenVisibility.ALL]}
                  </Menu.Item>
                </Menu>
              }>
              <button className="a6y-screen-visibility">
                {
                  SCREEN_VISIBILITY_MAP[
                    screenVisibility ?? ScreenVisibility.ONLY_HOST
                  ]
                }
              </button>
            </Dropdown>
          ) : null}
        </div>
      </div>
    );
  },
);
