import { RDCStatus, SignalKind, StreamKind } from 'assembly-shared';
import React, { FC, useEffect, useRef, useState, useCallback } from 'react';
import cls from 'classnames';
import { useProfile, useEngines, ProfileInSession } from '../../hooks';
import './index.css';
import { A6yFastBoard } from '../a6y-fast-board';
import { RDCRoleType } from 'agora-rdc-electron';

const ASPECT_RATIO = 9 / 16;

const WORK_AREA_HEIGHT_MAPS: {[k: string]: number} = {
  'darwin': 178,
  'win32': 170,
}
export interface A6yScreenShareProps {
  profileInSession: ProfileInSession;
}
export const A6yScreenShare: FC<A6yScreenShareProps> = ({
  profileInSession,
}) => {
  // eslint-disable-next-line no-unused-vars
  const [[height, width], setSize] = useState([0, 0]);
  const [[fbHeight, fbWidth], setFbSize] = useState([0, 0]);
  const [[fbTop, fbLeft], setFbPosition] = useState([0, 0]);
  const attachElRef = useRef<HTMLDivElement>(null);
  const { rtcEngine, rdcEngine, publishedStreams, authorizedControlUids } =
    useEngines();
  const { profile } = useProfile();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isSelf = profileInSession.id === profile?.id;
  const rdcSignal = profileInSession.signals.find(
    (s) => s.kind === SignalKind.RDC,
  );
  const screenStream = profileInSession?.streams.find(
    (s) => s.kind === StreamKind.SCREEN,
  );

  const updateSize = useCallback(() => {
    const height = window.innerHeight - (WORK_AREA_HEIGHT_MAPS[process.platform] ?? 180);
    const width = window.innerWidth - 280;
    if (height < width * ASPECT_RATIO) {
      setSize([width * ASPECT_RATIO, width]);
    } else {
      setSize([height / ASPECT_RATIO, height]);
    }
  }, [setSize]);

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
    document.addEventListener('resize', updateSize);
    return () => {
      document.removeEventListener('resize', updateSize);
    };
  }, [updateSize]);

  useEffect(() => {
    const attachEl = attachElRef.current;
    if (!attachEl) {
      return;
    }
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const targetEl = mutation.target as HTMLDivElement;
        const renderingEl = targetEl.querySelector('canvas');
        if (mutation.addedNodes.length > 0 && renderingEl) {
          const { width: cWidth, height: cHeight, style } = renderingEl;
          // @ts-ignore TS2339: Property 'zoom' does not exist on type 'CSSStyleDeclaration'.
          const zoom = Number(style.zoom);
          setFbPosition([renderingEl.offsetTop, renderingEl.offsetLeft - 15]);
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

  return (
    <div
      className={cls({
        'a6y-screen-share': 1,
        playing: isSubscribed,
      })}
    >
      <div
        ref={attachElRef}
        style={{
          height: height === 0 ? '100%' : `${height}px`,
          // width: width === 0 ? '100%' : `${width}px`,
        }}
      ></div>
      <A6yFastBoard
        markable={profileInSession.markable}
        style={{ height: fbHeight, width: fbWidth, left: fbLeft, top: fbTop }}
      />
    </div>
  );
};
