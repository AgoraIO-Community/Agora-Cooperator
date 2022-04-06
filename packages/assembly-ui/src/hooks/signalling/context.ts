import { createContext } from 'react';
import { Signalling } from '../../services/Signalling';
import { SignallingStatus } from '../../services/Signalling';

export const SignallingContext = createContext<{
  signalling?: Signalling;
  status: SignallingStatus;
}>({
  status: SignallingStatus.DISCONNECTED,
});
