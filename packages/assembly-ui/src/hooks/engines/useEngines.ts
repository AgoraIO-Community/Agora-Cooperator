import { useContext } from 'react';
import { EnginesContext } from './context';

export const useEngines = () => {
  const rtc = useContext(EnginesContext);
  return rtc;
};
