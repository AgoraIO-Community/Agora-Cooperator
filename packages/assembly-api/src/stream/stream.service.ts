import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StreamEntity } from './stream.entity';
import { StreamKind } from 'assembly-shared';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import * as dayjs from 'dayjs';

@Injectable()
export class StreamService {
  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @InjectRepository(StreamEntity)
    private readonly streamRepository: Repository<StreamEntity>,
  ) {}

  async createStream(
    channel: string,
    kind: StreamKind,
    expiredAt: Date,
  ): Promise<StreamEntity> {
    const uid = this.buildStreamUid();
    const token = this.buildStreamToken(channel, uid, expiredAt);
    const stream = this.streamRepository.create({
      uid,
      token,
      kind,
      appId: this.configService.get('AGORA_APP_ID'),
      audio: false,
      video: false,
      createdAt: new Date(),
      expiredAt: expiredAt,
    });
    return await this.streamRepository.save(stream);
  }

  private buildStreamUid(): number {
    return Math.floor(10000 + Math.random() * 90000);
  }

  private buildStreamToken(
    channel: string,
    streamId: number,
    expiredAt: Date,
  ): string {
    return RtcTokenBuilder.buildTokenWithUid(
      this.configService.get('AGORA_APP_ID'),
      this.configService.get('AGORA_APP_CERTIFICATE'),
      channel,
      streamId,
      RtcRole.PUBLISHER,
      dayjs(expiredAt).unix(),
    );
  }
}
