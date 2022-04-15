import React, { FC, useEffect, memo, useState } from 'react';
import { useFastboard, Fastboard } from '@netless/fastboard-react';
import { useUnmount } from 'react-use';
import './index.css';
import { useProfile } from '../../hooks';
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
      },
      managerConfig: {
        containerSizeRatio: aspectRatio,
      },
    }));

    useEffect(() => {
      if (!fastboard || !scene) {
        return;
      }
      const { room } = fastboard.manager;
      if (room.phase !== 'connected') {
        return;
      }
      const allScenes = room.entireScenes();
      const screenShareScenes = allScenes['/screen-share'];
      const currentScenesName = scene.split('/')[scene.split('/').length - 1];
      const currentScenes = (screenShareScenes ?? []).find(
        (s) => s.name === currentScenesName,
      );
      if (!currentScenes || !currentScenes) {
        room.putScenes(`/screen-share`, [
          {
            name: currentScenesName,
          },
        ]);
      }
      console.log('all cenes', room.entireScenes());
      room.setScenePath(scene);
      console.log('change scene to:', room.state.sceneState.scenePath);
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
