import { Signal, SignalKind } from 'assembly-shared';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProfileEntity } from '../profile/profile.entity';

@Entity()
export class SignalEntity implements Signal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @Column()
  uid: string;

  @Column()
  token: string;

  @Column()
  kind: SignalKind;

  @Column()
  createdAt: Date;

  @Column()
  expiredAt: Date;

  @ManyToOne((type) => ProfileEntity, (profile) => profile.signals)
  profile: ProfileEntity;
}
