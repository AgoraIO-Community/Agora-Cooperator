import { useContext } from 'react';
import { SignallingContext } from './context';

export const useSignalling = () => {
  const signalling = useContext(SignallingContext);
  return signalling;
};
