import React, { FC, useEffect, memo } from 'react';
import { Fastboard } from '@netless/fastboard-react';
import { useFastBoard } from '../../hooks';
import './index.css';

const LANGUAGES: { [key: string]: 'en' | 'zh-CN' } = {
  'en-US': 'en',
  'zh-CN': 'zh-CN',
};

export interface A6yFastBoardProps {
  markable?: boolean;
  style?: React.CSSProperties;
}

export const A6yFastBoard: FC<A6yFastBoardProps> = memo(
  ({ markable, style }) => {
    const { language } = navigator;
    const fastBoard = useFastBoard();
    useEffect(() => {
      if (!fastBoard || !markable) {
        return;
      }
      fastBoard.cleanCurrentScene();
    }, [fastBoard, markable]);
    console.log('whiteboard', markable, fastBoard);
    return markable ? (
      <div style={style} className="a6y-fastboard-wrap">
        <Fastboard
          app={fastBoard}
          language={LANGUAGES[language] ?? 'en'}
          theme="dark"
          config={{
            toolbar: { enable: true, apps: { enable: false } },
            redo_undo: { enable: true },
            zoom_control: { enable: false },
            page_control: { enable: false },
          }}
        />
      </div>
    ) : null;
  },
);
