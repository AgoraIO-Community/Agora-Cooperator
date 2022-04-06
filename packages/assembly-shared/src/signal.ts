export enum SignalKind {
  RDC = 0,
  NORMAL = 1,
  ROBOT = 3,
}

export interface Signal {
  id: string;
  appId: string;
  uid: string;
  token: string;
  kind: SignalKind;
  createdAt: Date;
  expiredAt: Date;
}

export enum SignalCommand {
  USER_IN = 0,
  USER_OUT = 1,
  PROFILE_CHANGE = 2,
  ALL_ONLINE_PROFILES = 3,
  REQUEST_CHANGE_DEVICE_STATE = 4,
}

export interface SignalPayload<T = any> {
  command: SignalCommand;
  payload: T;
}
