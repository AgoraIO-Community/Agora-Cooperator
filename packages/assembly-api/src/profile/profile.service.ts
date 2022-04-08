import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile, RDCStatus, SignalCommand } from 'assembly-shared';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ProfileEntity } from './profile.entity';
import { StreamKind, SignalKind } from 'assembly-shared';
import { StreamEntity } from '../stream/stream.entity';
import { SignalEntity } from '../signal/signal.entity';
import { SessionService } from '../session/session.service';
import { WhiteboardService } from '../whiteboard/whiteboard.service';
import { StreamService } from '../stream/stream.service';
import { SignalService } from '../signal/signal.service';
import { RobotService } from '../robot/robot.service';
import { PROFILE_IN_SESSION_SELECT } from './profile.constants';
import * as dayjs from 'dayjs';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private profileRepository: Repository<ProfileEntity>,
    @Inject(SessionService) private sessionService: SessionService,
    @Inject(WhiteboardService) private whiteboardService: WhiteboardService,
    @Inject(StreamService) private streamService: StreamService,
    @Inject(SignalService) private signalService: SignalService,
    @Inject(RobotService) private robotService: RobotService,
  ) {}

  async createProfile(
    sessionId: string,
    { username, role }: Pick<Profile, 'username' | 'role'>,
  ): Promise<ProfileEntity> {
    const session = await this.sessionService.findSession(sessionId);
    Logger.debug(
      `create profile for session ${JSON.stringify(session)}`,
      'ProfileService',
    );
    if (!session) {
      throw new Error('Session not found');
    }
    const streams = await this.createStreams(
      session.channel,
      session.expiredAt,
    );
    const signals = await this.createSignals(
      session.channel,
      session.expiredAt,
    );
    const whiteboard = await this.whiteboardService.createWhiteboard(
      session.wUUID,
      session.expiredAt,
      role,
    );

    const profile = this.profileRepository.create({
      username,
      role,
      rdcStatus: RDCStatus.IDLE,
      screenShare: false,
      markable: false,
      createdAt: new Date(),
      lastSeen: new Date(),
      expiredAt: session.expiredAt,
      session,
      streams,
      signals,
      whiteboard,
    });

    return await this.profileRepository.save(profile);
  }

  async findProfile(id: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['streams', 'signals', 'whiteboard'],
    });
    if (!profile) {
      throw new Error('Profile not found');
    }
    return profile;
  }

  async updateProfile(
    sessionId: string,
    profileId: string,
    {
      rdcStatus,
      screenShare,
      markable,
      streams,
    }: Pick<
      ProfileEntity,
      'rdcStatus' | 'screenShare' | 'markable' | 'streams'
    >,
  ): Promise<ProfileEntity> {
    const profileEntity = await this.findProfile(profileId);
    if (typeof rdcStatus !== 'undefined') {
      profileEntity.rdcStatus = rdcStatus;
    }
    if (typeof screenShare !== 'undefined') {
      profileEntity.screenShare = screenShare;
    }
    if (typeof markable !== 'undefined') {
      profileEntity.markable = markable;
    }
    if (typeof streams !== 'undefined') {
      profileEntity.streams = profileEntity.streams.map((stream) => {
        const s = streams.find((s) => s.id === stream.id);
        return {
          ...stream,
          ...s,
        };
      });
    }
    await this.profileRepository.save(profileEntity);
    const robotId = await this.sessionService.getRobotId(sessionId);
    const robot = await this.signalService.findById(robotId);
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      select: PROFILE_IN_SESSION_SELECT,
      relations: ['streams', 'signals', 'whiteboard'],
    });
    if (!profile) {
      throw new Error('Profile not found');
    }
    await this.robotService.broadcastMessage(sessionId, robot, {
      command: SignalCommand.PROFILE_CHANGE,
      payload: profile,
    });
    return profile;
  }

  async checkInOut(sessionId: string, profileId: string, isIn: boolean) {
    const robotId = await this.sessionService.getRobotId(sessionId);
    const robot = await this.signalService.findById(robotId);
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      select: { ...PROFILE_IN_SESSION_SELECT, session: { id: true } },
      relations: ['streams', 'signals', 'whiteboard', 'session'],
    });
    if (!profile) {
      throw new Error('Profile not found');
    }
    profile.lastSeen = new Date();
    await this.profileRepository.save(profile);
    const profiles = await this.profileRepository.find({
      where: {
        session: profile.session,
        lastSeen: MoreThanOrEqual(dayjs(new Date()).add(-3, 'minute').toDate()),
      },
      select: PROFILE_IN_SESSION_SELECT,
      relations: ['streams', 'signals', 'whiteboard'],
    });
    const signal = profile.signals.find(
      (signal) => signal.kind === SignalKind.NORMAL,
    );
    await this.robotService.sendMessage(robot, signal.uid, {
      command: SignalCommand.ALL_ONLINE_PROFILES,
      payload: profiles,
    });
    this.robotService.broadcastMessage(sessionId, robot, {
      command: isIn ? SignalCommand.USER_IN : SignalCommand.USER_OUT,
      payload: profile,
    });
  }

  private async createStreams(
    channel: string,
    expiredAt: Date,
  ): Promise<StreamEntity[]> {
    return await Promise.all([
      this.streamService.createStream(channel, StreamKind.CAMERA, expiredAt),
      this.streamService.createStream(channel, StreamKind.SCREEN, expiredAt),
    ]);
  }

  private async createSignals(
    channel: string,
    expiredAt: Date,
  ): Promise<SignalEntity[]> {
    return await Promise.all([
      this.signalService.createSignal(channel, SignalKind.RDC, expiredAt),
      this.signalService.createSignal(channel, SignalKind.NORMAL, expiredAt),
    ]);
  }
}
