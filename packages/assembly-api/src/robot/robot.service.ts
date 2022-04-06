import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Signal, SignalPayload } from 'assembly-shared';
import axios from 'axios';

const SIGNALLING_ENDPOINT = 'https://api.agora.io/dev/v2/project';
@Injectable()
export class RobotService {
  constructor(
    @Inject(ConfigService)
    private configService: ConfigService,
  ) {}

  async sendMessage<T>(
    robot: Signal,
    normalSignalUID: string,
    message: SignalPayload<T>,
  ) {
    return await axios.post(
      `${this.endpoint}/rtm/users/${robot.uid}/peer_messages`,
      {
        destination: normalSignalUID,
        enable_offline_messaging: false,
        enable_historical_messaging: false,
        payload: JSON.stringify(message),
      },
      {
        headers: {
          'Content-type': 'application/json;charset=utf-8',
          'x-agora-uid': robot.uid,
          'x-agora-token': robot.token,
        },
      },
    );
  }

  async broadcastMessage<T>(
    sessionId: string,
    robot: Signal,
    message: SignalPayload<T>,
  ) {
    try {
      return await axios.post(
        `${this.endpoint}/rtm/users/${robot.uid}/channel_messages`,
        {
          channel_name: sessionId,
          enable_historical_messaging: false,
          payload: JSON.stringify(message),
        },
        {
          headers: {
            'Content-type': 'application/json;charset=utf-8',
            'x-agora-uid': robot.uid,
            'x-agora-token': robot.token,
          },
        },
      );
    } catch (error) {
      Logger.error('RobotService.broadcastMessage Failed:',error);
    }
  }

  private get endpoint() {
    const appId = this.configService.get<string>('AGORA_APP_ID');
    return `${SIGNALLING_ENDPOINT}/${appId}`;
  }
}
