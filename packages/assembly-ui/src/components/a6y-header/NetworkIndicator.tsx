import React, { FC } from 'react';
import { BiWifi0, BiWifi1, BiWifi2, BiWifi, BiWifiOff } from 'react-icons/bi';

export interface NetworkIndicatorProps {
  quality: number;
}

enum QUALITY {
  Excellent = 1,
  Good = 2,
  Poor = 3,
  Bad = 4,
  VeryBad = 5,
  Down = 6,
}

export const NetworkIndicator: FC<NetworkIndicatorProps> = ({ quality }) => {
  switch (quality) {
    case QUALITY.VeryBad:
      return <BiWifi0 size={16} color="#d9363e" />;
    case QUALITY.Bad:
      return <BiWifi1 size={16} color="#d48806" />;
    case QUALITY.Poor:
      return <BiWifi2 size={16} color="#ffc53d" />;
    case QUALITY.Good:
      return <BiWifi size={16} color="#73d13d" />;
    case QUALITY.Excellent:
      return <BiWifi size={16} color="#389e0d" />;
    case QUALITY.Down:
      return <BiWifiOff size={16} color="#d9363e" />;
    default:
      return <BiWifi size={16} color="#389e0d" />;
  }
};
