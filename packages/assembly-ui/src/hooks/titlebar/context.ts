import { createContext } from 'react';

export const TitlebarContext = createContext<{
  visible: boolean;
  setVisible: (visible: boolean) => void;
}>({
  visible: true,
  setVisible: (visible: boolean) => {},
});
