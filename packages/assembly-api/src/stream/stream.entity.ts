import { Stream, StreamKind } from 'assembly-shared';
import { ProfileEntity } from '../profile/profile.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StreamEntity implements Stream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @Column()
  uid: number;

  @Column()
  token: string;

  @Column()
  kind: StreamKind;

  @Column()
  audio: boolean;

  @Column()
  video: boolean;

  @Column()
  createdAt: Date;

  @Column()
  expiredAt: Date;

  @ManyToOne((type) => ProfileEntity, (profile) => profile.streams)
  profile: ProfileEntity;
}
