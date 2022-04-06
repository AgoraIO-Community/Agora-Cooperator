export interface Session {
    id: string;
    channel: string;
    expiredAt: Date;
    createdAt: Date;
}