import React, { FC, useState } from 'react';
import { TitlebarContext } from './context';

export const TitlebarProvider: FC = ({ children }) => {
  const [visible, setVisible] = useState(true);
  return (
    <TitlebarContext.Provider
      value={{
        visible,
        setVisible,
      }}>
      {children}
    </TitlebarContext.Provider>
  );
};
