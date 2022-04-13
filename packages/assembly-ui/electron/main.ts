import { app, BrowserWindow, ipcMain, screen } from 'electron';
import process from 'process';
import ps from 'ps-node';
import utils from 'util';
import psTreeCBify from 'ps-tree';

const psTree = utils.promisify(psTreeCBify);
const kill = utils.promisify(ps.kill);

const __DEV__ = process.env.NODE_ENV === 'development';

const killVSChildProcess = async () => {
  const childrenProcess = await psTree(process.pid);
  const videoSourceProcess = childrenProcess.find((ps) =>
    ps.COMMAND.includes('VideoSource'),
  );
  if (!videoSourceProcess) {
    return;
  }
  await kill(videoSourceProcess.PID);
  console.log('-> kill', JSON.stringify(videoSourceProcess));
};

const toggleFocusMode = (mainWindow: BrowserWindow, enabled: boolean) => {
  if (enabled) {
    const { width, height, x, y } = screen.getPrimaryDisplay().bounds;
    mainWindow.setPosition(x, y);
    mainWindow.setSize(width, height);
  }
  if (enabled && process.platform === 'darwin') {
    mainWindow.setTrafficLightPosition({ x: -20, y: -20 });
  }
  if (!enabled && process.platform === 'darwin') {
    mainWindow.setTrafficLightPosition({ x: 0, y: 0 });
  }
  mainWindow.setHasShadow(!enabled);
  mainWindow.setMovable(!enabled);
  mainWindow.setResizable(!enabled);
  mainWindow.setBackgroundColor(enabled ? '#00000000' : '#000000');
  mainWindow.setFullScreen(enabled && process.platform !== 'darwin');
  mainWindow.setClosable(!enabled);
  BrowserWindow.fromWebContents(mainWindow.webContents)?.setIgnoreMouseEvents(
    enabled,
    { forward: true },
  );
  mainWindow.setAlwaysOnTop(enabled, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(enabled);
  if (!enabled) {
    const { height, width } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setSize(width, height);
    mainWindow.center();
  }
};

function registerIpcListeners(mainWindow: BrowserWindow) {
  ipcMain.handle('screenShareStarted', async () => {
    toggleFocusMode(mainWindow, true);
  });

  ipcMain.handle('screenShareStopped', async () => {
    toggleFocusMode(mainWindow, false);
  });

  ipcMain.handle('killVSChildProcess', async () => {
    return await killVSChildProcess();
  });

  ipcMain.on(
    'set-ignore-mouse-events',
    (event, ...args: [ignore: boolean, opts: { forward: boolean }]) => {
      console.log('->', args);
      BrowserWindow.fromWebContents(event.sender)?.setIgnoreMouseEvents(
        ...args,
      );
    },
  );
}

const createWindow = async () => {
  let mainWindow: BrowserWindow | null = null;
  const { height, width } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    height: process.platform === 'win32' ? 768 : height,
    width: process.platform === 'win32' ? 1024 : width,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    transparent: true,
    frame: false,
    enableLargerThanScreen: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
  });
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.maximize();
  });
  registerIpcListeners(mainWindow);
  if (__DEV__) {
    mainWindow.loadURL('http://localhost:3000');
  }
  if (!__DEV__) {
    mainWindow.loadFile('build/index.html');
  }
  if (__DEV__) {
    mainWindow.webContents.openDevTools();
  }
};
app.whenReady().then(createWindow);
app.allowRendererProcessReuse = false;
app.on('window-all-closed', async () => {
  await killVSChildProcess();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
