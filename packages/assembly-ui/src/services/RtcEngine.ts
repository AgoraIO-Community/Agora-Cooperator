import AgoraRtcEngine from 'agora-electron-sdk';
import { isWindows, isMacOS } from '../utils';
import EventEmitter from 'eventemitter3';

const LOGS_FOLDER = isMacOS()
  ? `${window.process.env.HOME}/Library/Logs/RDCClient`
  : '.';

export const DEFAULT_RECT = { x: 0, y: 0, height: 0, width: 0 };

export interface DisplayConfiguration {
  bitrate: number;
  frameRate: number;
  height: number;
  width: number;
}

export enum RtcEngineEvents {
  PUBLISHED = 'published',
  UNPUBLISHED = 'unpublished',
  NETWORK_QUALITY_CHANGE = 'networkQualityChange',
}

export class RtcEngine extends EventEmitter {
  private static instance: RtcEngine;
  private audio = false;
  private video = false;

  static singleton(appId: string) {
    if (!this.instance) {
      this.instance = new RtcEngine(appId);
    }
    return this.instance;
  }

  instance: AgoraRtcEngine;

  constructor(appId: string) {
    super();
    this.instance = new AgoraRtcEngine();
    this.instance.initialize(appId, 1, {
      filePath: `${LOGS_FOLDER}/agora_rtc_sdk.log`,
      level: 1,
      fileSize: 2048,
    });
    this.bindEvents();
  }

  async joinChannel(token: string, channel: string, uid: number) {
    this.instance.setChannelProfile(0);
    this.instance.setClientRole(1);
    this.instance.enableVideo();
    this.instance.enableAudio();
    this.instance.muteLocalAudioStream(true);
    this.instance.muteLocalVideoStream(true);
    this.instance.enableLocalAudio(false);
    this.instance.enableLocalVideo(false);
    const code = this.instance.joinChannel(token, channel, '', uid);
    if (code !== 0) {
      throw new Error(`Failed to join channel with error code: ${code}`);
    }
    return code;
  }

  async leaveChannel() {
    const code = this.instance.leaveChannel();
    if (code !== 0) {
      throw new Error(`Failed to leave channel with error code: ${code}`);
    }
    return code;
  }

  publishOrUnpublish(audio?: boolean, video?: boolean) {
    if (this.audio !== audio) {
      this.instance.muteLocalAudioStream(!audio);
      this.instance.muteLocalVideoStream(!video);
    }
    if (this.video !== video) {
      this.instance.enableLocalVideo(!!video);
      this.instance.enableLocalAudio(!!audio);
    }
    this.audio = !!audio;
    this.video = !!video;
  }

  async subscribe(
    streamId: number,
    attachEl: HTMLElement,
    isLocalStream?: boolean,
  ): Promise<number> {
    let code = 0;
    if (isLocalStream) {
      code = this.instance.setupLocalVideo(attachEl, { append: false });
    } else {
      code = this.instance.subscribe(streamId, attachEl);
      console.log('subscribe', streamId, code);
      this.instance.setupViewContentMode(streamId, 1, undefined);
    }

    if (code !== 0) {
      throw new Error(`Failed to subscribe stream with error code: ${code}`);
    }
    return code;
  }

  unsubscribe(streamId: number, isLocalStream?: boolean) {
    if (isLocalStream) {
      this.instance.destroyRender('local', '');
    } else {
      this.instance.destroyRender(streamId, '');
      console.log('unsubscribe', streamId);
    }
  }

  async release() {
    const code = this.instance.release();
    if (code !== 0) {
      throw new Error(`Failed to release rtc engine with error code: ${code}`);
    }
    return code;
  }

  public async initializeFSSRtcEngine(appId: string) {
    const code = this.instance.videoSourceInitialize(appId);
    if (code !== 0) {
      throw new Error(
        `Failed to initialize rtc engine for screen share with error code: ${code}`,
      );
    }
    return code;
  }

  public async releaseFSSRtcEngine() {
    const code = this.instance.videoSourceRelease();
    if (code !== 0) {
      throw new Error(
        `Failed to release rtc engine for screen share with error code: ${code}`,
      );
    }
    return code;
  }

  public async joinFSSChannel(token: string, uid: number, channel: string) {
    const code = this.instance.videoSourceJoin(token, channel, '', uid);
    if (code !== 0) {
      throw new Error(
        `Failed to join channel for screen share with error code: ${code}`,
      );
    }
    return code;
  }

  public async leaveFSSChannel() {
    const code = this.instance.videoSourceLeave();
    if (code !== 0) {
      throw new Error(
        `Failed to leave channel for screen share with error code: ${code}`,
      );
    }
    return code;
  }

  public getFSSDisplays() {
    return this.instance.getScreenDisplaysInfo();
  }

  public getFSSWindows() {
    return this.instance.getScreenWindowsInfo();
  }

  public async publishFSS(
    symbol: any,
    config: DisplayConfiguration,
    withAudio?: boolean,
    isDisplay: boolean = true,
  ) {
    let code = 0;
    if (isWindows() && withAudio) {
      this.instance.enableLoopbackRecording(true);
    }
    if (isMacOS() && withAudio) {
      console.warn('Loopback is not supported on macOS');
    }
    if (isDisplay) {
      const excludeWindowList = (this.getFSSWindows() as any[])
        .filter(
          (w) =>
            w.ownerName === 'Electron' ||
            w.ownerName === 'Assembly' ||
            w.name === 'Assembly',
        )
        .map((w) => w.windowId) as number[];
      const captureParams = {
        excludeWindowCount: 0,
        excludeWindowList,
        windowFocus: false,
        captureMouseCursor: true,
        ...config,
      };
      console.log('publish screen share -> captureParams', captureParams);
      code = this.instance.videoSourceStartScreenCaptureByScreen(
        symbol,
        DEFAULT_RECT,
        captureParams,
      );
    } else {
      code = this.instance.videoSourceStartScreenCaptureByWindow(
        symbol,
        DEFAULT_RECT,
        {
          excludeWindowCount: 0,
          excludeWindowList: [],
          windowFocus: false,
          captureMouseCursor: true,
          ...config,
        },
      );
    }
    if (code !== 0) {
      throw new Error(
        `Failed to publish screen share stream with error code: ${code}`,
      );
    }
    return code;
  }

  public async unpublishFSS(isDisplay: boolean = true) {
    let code = this.instance.stopScreenCapture2();
    if (code !== 0) {
      throw new Error(
        `Failed to unpublish screen share stream with error code: ${code}`,
      );
    }
    return code;
  }

  private bindEvents() {
    this.instance.on('remoteVideoStateChanged', (uid, state, _reason) => {
      if ([1, 2, 3].includes(state)) {
        this.emit(RtcEngineEvents.PUBLISHED, uid);
      }
      if ([0, 4].includes(state)) {
        this.emit(RtcEngineEvents.UNPUBLISHED, uid);
      }
    });
    this.instance.on('networkQuality', (_uid, up, down) => {
      this.emit(RtcEngineEvents.NETWORK_QUALITY_CHANGE, { up, down });
    });
  }
}
