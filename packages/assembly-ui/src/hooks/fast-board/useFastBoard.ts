import { useContext } from 'react';
import { FastBoardContext } from './context';

export const useFastBoard = () => {
  const fastBoardContext = useContext(FastBoardContext);
  return fastBoardContext;
};
