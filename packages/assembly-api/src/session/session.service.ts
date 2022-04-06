import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { SessionEntity } from './session.entity';
import * as dayjs from 'dayjs';
import { SignalService } from '../signal/signal.service';
import { SignalKind } from 'assembly-shared';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private repository: Repository<SessionEntity>,
    @Inject(ConfigService)
    private config: ConfigService,
    @Inject(SignalService)
    private signalService: SignalService,
  ) {}

  async createSession(
    channel: string,
  ): Promise<Omit<SessionEntity, 'robotId'>> {
    const [sessions, count] = await this.repository.findAndCount({
      where: { channel, expiredAt: MoreThanOrEqual(new Date()) },
      select: ['id', 'channel', 'expiredAt', 'createdAt'],
    });
    if (count === 1) {
      return sessions[0];
    }
    const expired = Number(
      this.config.get<string | undefined>('EXPIRED_DURATION') ?? 60 * 60 * 24,
    );
    const now = new Date();
    const expiredAt = dayjs(now).add(expired, 'second').toDate();
    const robot = await this.signalService.createSignal(
      channel,
      SignalKind.ROBOT,
      expiredAt,
    );
    const { robotId, ...reset } = await this.repository.save(
      this.repository.create({
        channel,
        expiredAt,
        createdAt: now,
        robot,
      }),
    );
    return { ...reset };
  }

  async findSession(id: string): Promise<SessionEntity | undefined> {
    return await this.repository.findOne({ where: { id } });
  }

  async getRobotId(id: string): Promise<string> {
    const session = await this.repository.findOne({
      where: { id },
    });
    if (!session) {
      throw new Error('Session not found');
    }
    return session.robotId;
  }
}
