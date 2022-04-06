import { Inject, Injectable } from '@nestjs/common';
import { SignalKind } from 'assembly-shared';
import { SignalEntity } from './signal.entity';
import { RtmRole, RtmTokenBuilder } from 'agora-access-token';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as dayjs from 'dayjs';

@Injectable()
export class SignalService {
  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @InjectRepository(SignalEntity)
    private signalRepository: Repository<SignalEntity>,
  ) {}
  async createSignal(
    channel: string,
    kind: SignalKind,
    expiredAt: Date,
  ): Promise<SignalEntity> {
    const uid = this.buildSignalUid(channel);
    const token = this.buildSignalToken(uid, expiredAt);
    const signal = this.signalRepository.create({
      uid,
      appId: this.configService.get('AGORA_APP_ID'),
      token,
      kind,
      createdAt: new Date(),
      expiredAt: expiredAt,
    });
    return await this.signalRepository.save(signal);
  }

  async findById(id: string): Promise<SignalEntity> {
    const signal = await this.signalRepository.findOne({
      where: { id },
    });
    if (!signal) {
      throw new Error('signal not found');
    }
    return signal;
  }

  private buildSignalUid(channel: string): string {
    return `${channel}-${nanoid()}`;
  }

  private buildSignalToken(signalId: string, expiredAt: Date) {
    return RtmTokenBuilder.buildToken(
      this.configService.get('AGORA_APP_ID'),
      this.configService.get('AGORA_APP_CERTIFICATE'),
      signalId,
      RtmRole.Rtm_User,
      dayjs(expiredAt).unix(),
    );
  }
}
