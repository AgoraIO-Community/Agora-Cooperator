import { FastboardApp } from '@netless/fastboard-react';
import { createContext } from 'react';

export const FastBoardContext = createContext<FastboardApp | undefined>(
  undefined,
);
