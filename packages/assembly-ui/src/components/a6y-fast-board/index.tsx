import React, { FC, useEffect } from 'react';
import { Fastboard } from '@netless/fastboard-react';
import { useFastBoard, useIgnoreMouseEvent } from '../../hooks';

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
