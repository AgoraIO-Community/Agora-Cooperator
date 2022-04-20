import React, { FC, useEffect, memo } from 'react';
import { useFastboard, Fastboard } from '@netless/fastboard-react';
import './index.css';
import { ProfileEntity } from '../../services/api';

const LANGUAGES: { [key: string]: 'en' | 'zh-CN' } = {
  'en-US': 'en',
  'zh-CN': 'zh-CN',
};

export interface A6yFastBoardProps {
  profile: ProfileEntity;
  aspectRatio: number;
  scene?: string;
  style?: React.CSSProperties;
}

export const A6yFastBoard: FC<A6yFastBoardProps> = memo(
  ({ style, scene, aspectRatio, profile }) => {
    const { language } = navigator;
    const { whiteboard, username } = profile;
    const { appIdentifier, uuid, token } = whiteboard;
    const fastboard = useFastboard(() => ({
      sdkConfig: {
        appIdentifier,
        region: 'cn-hz', // "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon",
      },
      joinRoom: {
        uid: username,
        uuid: uuid,
        roomToken: token,
        hotKeys: {},
        disableNewPencil: true,
      },
      managerConfig: {
        containerSizeRatio: aspectRatio,
      },
    }));

    useEffect(() => {
      if (!fastboard || !scene) {
        return;
      }
      const { room, displayer } = fastboard.manager;
      if (room.phase !== 'connected') {
        return;
      }
      const allScenes = displayer.entireScenes();
      const rootScenes = allScenes['/'];
      const currentScenes = (rootScenes ?? []).find((s) => s.name === scene);
      if (!currentScenes) {
        fastboard.manager.addPage({ scene: { name: scene } });
      }
      console.log('all scenes', displayer.entireScenes());
      fastboard.manager.setMainViewScenePath(`/${scene}`);
      console.log('change scene to:', displayer.state.sceneState.scenePath);
    }, [fastboard, scene]);

    return (
      <div style={style} className="a6y-fastboard-wrap">
        <Fastboard
          app={fastboard}
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
    );
  },
);
