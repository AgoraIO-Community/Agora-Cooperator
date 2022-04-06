import React, { FC, useState } from 'react';
import { useInterval } from 'react-use';

export interface TimerProps {
  beginTime: string;
}

export const Timer: FC<TimerProps> = ({ beginTime }) => {
  const [time, setTime] = useState<string>('00:00:00');
  useInterval(() => {
    const now = new Date();
    const begin = new Date(beginTime);
    const diff = now.getTime() - begin.getTime();
    const h = `${Math.floor(diff / (1000 * 60 * 60))}`.padStart(2, '0');
    const m = `${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}`.padStart(
      2,
      '0',
    );
    const s = `${Math.floor((diff % (1000 * 60)) / 1000)}`.padStart(2, '0');
    setTime(`${h}:${m}:${s}`);
  }, 1000);
  return <span className="a6y-timer">{time}</span>;
};
