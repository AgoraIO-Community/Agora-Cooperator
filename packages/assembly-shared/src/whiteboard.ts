export enum NetlessRole {
  ADMIN = "admin",
  WRITER = "writer",
  READER = "reader",
}

export interface Whiteboard {
  id: string;
  uuid: string;
  token: string;
  appIdentifier: string;
  role: NetlessRole;
  sdkToken: string;
  createdAt: Date;
  expiredAt: Date;
}
