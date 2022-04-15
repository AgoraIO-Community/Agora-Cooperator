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
  markable?: boolean;
  aspectRatio?: number;
  style?: React.CSSProperties;
}

export const A6yFastBoard: FC<A6yFastBoardProps> = memo(
  ({ markable, style, scene, aspectRatio }) => {
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
      if (fastBoard) {
        fastBoard.destroy().then(() => {
          setFastBoard(undefined);
        });
      }
      if (!fastBoard) {
        return;
      }
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
          instance = app;
          setFastBoard(instance);
        })
        .catch((error) => {
          console.error(error);
        });
      return () => {
        if (instance) {
          instance.destroy();
        }
      };
    }, [whiteboard, username, aspectRatio, fastBoard]);

    useEffect(() => {
      if (!fastBoard || !markable || !scene) {
        return;
      }
      const { displayer, room } = fastBoard.manager;
      const allScenes = displayer.entireScenes();
      const currentScenes = allScenes[scene];
      if (!currentScenes) {
        room.putScenes(scene, []);
      }
      displayer.state.sceneState.scenePath = scene;
    }, [fastBoard, markable, scene]);

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
