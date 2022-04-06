import { createContext } from 'react';
import { AgoraRemoteDesktopControl } from 'agora-rdc-electron';
import { DisplayConfiguration, RtcEngine } from '../../services/RtcEngine';

export const EnginesContext = createContext<{
  rtcEngine?: RtcEngine;
  rdcEngine?: AgoraRemoteDesktopControl;
  setDisplayConfig?: (config: DisplayConfiguration) => void;
  setDisplayId?: (disPlayId: any) => void;
  networkQuality: { up: number; down: number };
  publishedStreams: number[];
  authorizedControlUids: string[];
}>({
  networkQuality: { up: 0, down: 0 },
  publishedStreams: [],
  authorizedControlUids: [],
});
