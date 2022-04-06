import React, { FC, useEffect, useState } from 'react';
import { createFastboard, FastboardApp } from '@netless/fastboard-react';
import { FastBoardContext } from './context';
import { useProfile } from '../profile';

export const FastBoardProvider: FC = ({ children }) => {
  const [fastBoard, setFastBoard] = useState<FastboardApp | undefined>();
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile || !!fastBoard) {
      return;
    }
    let instance: FastboardApp;
    const {
      whiteboard: { appIdentifier, id, uuid, token },
    } = profile;
    createFastboard({
      sdkConfig: {
        appIdentifier,
        region: 'cn-hz', // "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon"
      },
      joinRoom: {
        uid: id,
        uuid: uuid,
        roomToken: token,
      },
    }).then((app) => {
      instance = app;
      setFastBoard(instance);
    }).catch((error) => {
      console.error(error);
    });
    // return () => {
    //   if (instance) {
    //     instance.destroy();
    //   }
    // };
  }, [profile, fastBoard]);

  return (
    <FastBoardContext.Provider value={fastBoard}>
      {children}
    </FastBoardContext.Provider>
  );
};
