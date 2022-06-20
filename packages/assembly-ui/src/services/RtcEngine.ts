import AgoraRtcEngine from 'agora-electron-sdk';
import { isWindows, isMacOS } from '../utils';
import EventEmitter from 'eventemitter3';
import {
  DisplayInfo,
  WindowInfo,
} from 'agora-electron-sdk/types/Api/native_type';

const LOGS_FOLDER = isMacOS()
  ? `${window.process.env.HOME}/Library/Logs/RDCClient`
  : './log';

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
    this.instance.setVideoEncoderConfiguration({
      width: 320,
      height: 180,
      minBitrate: 200,
      bitrate: 200,
      frameRate: 15,
      minFrameRate: 10,
      orientationMode: 0,
      degradationPreference: 0,
      mirrorMode: 0,
    });
    this.instance.enableVideo();
    this.instance.enableAudio();
    this.instance.enableLocalAudio(true);
    this.instance.adjustRecordingSignalVolume(0);
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
    if (audio) {
      this.instance.enableLocalAudio(true);
    } else {
      this.instance.enableLocalVideo(true);
    }
    if (video) {
      this.instance.enableLocalVideo(true);
    } else {
      this.instance.enableLocalVideo(false);
    }
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
    this.instance.videoSourceSetParameters(
      JSON.stringify({ 'che.video.mutigpu_exclude_window': true }),
    );
    this.instance.videoSourceSetScreenCaptureScenario(4);
    this.instance.videoSourceEnableAudio();
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
    let code = -1;
    return new Promise((resolve, reject) => {
      this.instance.once('videosourcejoinedsuccess', (_uid: number) => {
        if (code === 0 && _uid === uid) {
          resolve(code);
          console.log('videoSourceJoinedSuccess');
          return;
        }
        reject(
          new Error(
            `Failed to join channel for screen share with error code: ${code}`,
          ),
        );
      });
      code = this.instance.videoSourceJoin(token, channel, '', uid, {
        publishLocalAudio: true,
        publishLocalVideo: true,
        autoSubscribeAudio: false,
        autoSubscribeVideo: false,
      });
    });
  }

  public async leaveFSSChannel() {
    let code = -1;
    return new Promise((resolve, reject) => {
      this.instance.once('videoSourceLeaveChannel', () => {
        if (code === 0) {
          resolve(code);
          console.log('videoSourceLeaveChannel');
          return;
        }
        reject(
          new Error(
            `Failed to leave channel for screen share with error code: ${code}`,
          ),
        );
      });
      code = this.instance.videoSourceLeave();
    });
  }

  public getFSSDisplays(): Promise<DisplayInfo[]> {
    return new Promise((resolve) => {
      this.instance.getScreenDisplaysInfo((displays) => {
        resolve(displays);
      });
    });
  }

  public getFSSWindows(): Promise<WindowInfo[]> {
    return new Promise((resolve) => {
      this.instance.getScreenWindowsInfo((windows) => {
        resolve(windows);
      });
    });
  }

  public async publishFSS(
    symbol: any,
    config: DisplayConfiguration,
    withAudio?: boolean,
    isDisplay: boolean = true,
  ) {
    let code = 0;
    if (isWindows() && withAudio) {
      this.instance.videoSourceAdjustRecordingSignalVolume(0);
      this.instance.videoSourceEnableLoopbackRecording(true);
    }
    if (isMacOS() && withAudio) {
      console.warn('Loopback is not supported on macOS');
    }
    if (isDisplay) {
      const excludeWindowList = ((await this.getFSSWindows()) as any[])
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
      code = this.instance.videoSourceStartScreenCaptureByDisplayId(
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
    this.instance.videoSourceEnableLoopbackRecording(false);
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
