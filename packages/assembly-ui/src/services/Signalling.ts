import AgoraRTM, { RtmClient, RtmChannel } from 'agora-rtm-sdk';
import EventEmitter from 'eventemitter3';
import { SignalCommand, SignalPayload } from 'assembly-shared';

export enum Commands {
  USER_IN = 'userIn',
  USER_OUT = 'userOut',
  PROFILE_CHANGE = 'profileChange',
  CONNECTION_CHANGE = 'connectionChange',
  ALL_ONLINE_PROFILES = 'allOnlineProfiles',
  REQUEST_CHANGE_DEVICE_STATE = 'requestChangeDeviceState',
}

export enum SignallingStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ABORTED = 'ABORTED',
}

const COMMANDS_MAP: { [k: number]: string } = {
  [SignalCommand.USER_IN]: 'userIn',
  [SignalCommand.USER_OUT]: 'userOut',
  [SignalCommand.PROFILE_CHANGE]: 'profileChange',
  [SignalCommand.ALL_ONLINE_PROFILES]: 'allOnlineProfiles',
  [SignalCommand.REQUEST_CHANGE_DEVICE_STATE]: 'requestChangeDeviceState',
};

export class Signalling extends EventEmitter {
  static create(appId: string, channel: string) {
    return new Signalling(appId, channel);
  }

  private rtmClient: RtmClient;
  private rtmChannel: RtmChannel;

  constructor(appId: string, channel: string) {
    super();
    this.rtmClient = AgoraRTM.createInstance(appId);
    this.rtmChannel = this.rtmClient.createChannel(channel);
  }

  async join(uid: string, token: string) {
    this.bindEvents();
    await this.rtmClient.login({ uid, token });
    await this.rtmChannel.join();
  }

  async leave() {
    this.unbindEvents();
    await this.rtmChannel.leave();
    await this.rtmClient.logout();
  }

  async sendMessage<T>(uid: string, message: SignalPayload<T>) {
    this.rtmClient.sendMessageToPeer(
      {
        messageType: 'TEXT',
        text: JSON.stringify(message),
      },
      uid,
    );
  }

  async broadcastMessage<T>(message: SignalPayload<T>) {
    this.rtmChannel.sendMessage({
      messageType: 'TEXT',
      text: JSON.stringify(message),
    });
  }

  private bindEvents() {
    this.rtmClient.on('MessageFromPeer', this.handleEvents);
    this.rtmClient.on(
      'ConnectionStateChanged',
      this.handleConnectionStateChange,
    );
    this.rtmChannel.on('ChannelMessage', this.handleEvents);
  }

  private unbindEvents() {
    this.rtmClient.off('MessageFromPeer', this.handleEvents);
    this.rtmClient.off(
      'ConnectionStateChanged',
      this.handleConnectionStateChange,
    );
    this.rtmChannel.off('ChannelMessage', this.handleEvents);
  }

  private handleConnectionStateChange = (...message: any[]) => {
    const [status] = message;
    this.emit(Commands.CONNECTION_CHANGE, status);
  };

  private handleEvents = (...message: any[]) => {
    const [event] = message as [
      { messageType: string; text: string },
      string,
    ];
    if (event.messageType !== 'TEXT') {
      return;
    }
    try {
      const data = JSON.parse(event.text);
      this.emit(COMMANDS_MAP[data.command], data.payload);
    } catch (error) {}
  };
}
