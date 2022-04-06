export enum RoleType {
  HOST = 0,
  NORMAL = 1,
}

export enum RDCStatus {
  IDLE = 0,
  ACTIVE = 1,
  PAUSED = 2,
}

export interface Profile {
  id: string;
  username: string;
  role: RoleType;
  rdcStatus: RDCStatus;
  screenShare: boolean;
  markable: boolean;
  createdAt: Date;
  expiredAt: Date;
}
