import React, { FC, useEffect, memo, useState } from 'react';
import {
  createFastboard,
  Fastboard,
  FastboardApp,
} from '@netless/fastboard-react';
import './index.css';
import { useProfile } from '../../hooks';

const LANGUAGES: { [key: string]: 'en' | 'zh-CN' } = {
  'en-US': 'en',
  'zh-CN': 'zh-CN',
};

export interface A6yFastBoardProps {
  scene?: string;
  aspectRatio?: number;
  style?: React.CSSProperties;
}

export const A6yFastBoard: FC<A6yFastBoardProps> = memo(
  ({ style, scene, aspectRatio }) => {
    const { profile } = useProfile();
    const [fastBoard, setFastBoard] = useState<FastboardApp | undefined>();
    const { language } = navigator;
    const { whiteboard, username } = profile ?? {};

    useEffect(() => {
      if (!whiteboard || !aspectRatio || !username) {
        return;
      }
      let instance: FastboardApp;
      const { appIdentifier, uuid, token } = whiteboard;
      createFastboard({
        sdkConfig: {
          appIdentifier,
          region: 'cn-hz', // "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon",
        },
        joinRoom: {
          uid: username,
          uuid: uuid,
          roomToken: token,
          hotKeys: {},
        },
        managerConfig: {
          containerSizeRatio: aspectRatio,
        },
      })
        .then((app) => {
          console.log('create fastboard app with aspectRatio:', aspectRatio);
          instance = app;
          setFastBoard(instance);
        })
        .catch((error) => {
          console.error(error);
        });
      return () => {
        if (instance && instance.room.phase === 'connected') {
          instance.destroy();
        }
      };
    }, [whiteboard, username, aspectRatio]);

    useEffect(() => {
      if (!fastBoard || !scene) {
        return;
      }
      const { room } = fastBoard.manager;
      const allScenes = room.entireScenes();
      const screenShareScenes = allScenes['/screen-share'];
      const currentScenesName = scene.split('/')[scene.split('/').length - 1];
      const currentScenes = (screenShareScenes ??[]).find(s => s.name == currentScenesName)
      if (!currentScenes || !currentScenes) {
        room.putScenes(`/screen-share`, [{
          name: currentScenesName,
        }]);
      }
      console.log('all cenes', room.entireScenes());
      room.setScenePath(scene);
      console.log('change scene to:', room.state.sceneState.scenePath);
    }, [fastBoard, scene]);

    return (
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
    );
  },
);
