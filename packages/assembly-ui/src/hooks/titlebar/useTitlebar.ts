import { useContext } from 'react';
import { TitlebarContext } from './context';

export const useTitlebar = () => {
  const titlebar = useContext(TitlebarContext);
  return titlebar;
};
