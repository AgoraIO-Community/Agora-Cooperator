import React, { FC, useEffect } from 'react';
import { Fastboard } from '@netless/fastboard-react';
import { useFastBoard, useIgnoreMouseEvent } from '../../hooks';
import './index.css';

const LANGUAGES: { [key: string]: 'en' | 'zh-CN' } = {
  'en-US': 'en',
  'zh-CN': 'zh-CN',
};

export interface A6yFastBoardProps {
  markable?: boolean;
  style?: React.CSSProperties;
}

export const A6yFastBoard: FC<A6yFastBoardProps> = ({ markable, style }) => {
  const { language } = navigator;
  const fastBoard = useFastBoard();
  const ignoreMouseEvent = useIgnoreMouseEvent();
  useEffect(() => {
    if (!fastBoard || !markable) {
      return;
    }
    fastBoard.cleanCurrentScene();
  }, [fastBoard, markable]);

  useEffect(() => {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        console.log('mutation', mutation);
        mutation.addedNodes.forEach((node) => {
          console.log('fastboard-panel added', node);
          if (node.nodeName === 'DIV') {
            const element = node as HTMLDivElement;
            const panelEl = element.querySelector('.fastboard-panel');
            if (panelEl) {
              panelEl.addEventListener(
                'mouseenter',
                ignoreMouseEvent.onMouseEnter,
              );
              panelEl.addEventListener(
                'mouseleave',
                ignoreMouseEvent.onMouseLeave,
              );
            }
          }
        });
        mutation.removedNodes.forEach((node) => {
          console.log('fastboard-panel removed', node);
          if (node.nodeName === 'DIV') {
            const element = node as HTMLDivElement;
            const panelEl = element.querySelector('.fastboard-panel');
            if (panelEl) {
              panelEl.removeEventListener(
                'mouseenter',
                ignoreMouseEvent.onMouseEnter,
              );
              panelEl.removeEventListener(
                'mouseleave',
                ignoreMouseEvent.onMouseLeave,
              );
            }
          }
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true });
    return () => {
      mutationObserver.disconnect();
    };
  }, [ignoreMouseEvent]);

  return markable ? (
    <div {...ignoreMouseEvent} style={style} className="a6y-fastboard-wrap">
      <Fastboard
        app={fastBoard}
        language={LANGUAGES[language] ?? 'en'}
        theme="dark"
        config={{
          toolbar: { enable: true },
          redo_undo: { enable: true },
          zoom_control: { enable: false },
          page_control: { enable: false },
        }}
      />
    </div>
  ) : null;
};
