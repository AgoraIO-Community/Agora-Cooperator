import { app, BrowserWindow, ipcMain, screen, Menu } from 'electron';
const __DEV__ = process.env.NODE_ENV === 'development';

const toggleFocusMode = (mainWindow: BrowserWindow, enabled: boolean) => {
  if (enabled) {
    const { width, height, x, y } = screen.getPrimaryDisplay().bounds;
    mainWindow.setPosition(x, y);
    mainWindow.setSize(width, height);
  } else {
    const { height, width } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setSize(width, height);
    mainWindow.center();
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
  mainWindow.setBackgroundColor('#00000000');
  mainWindow.setFullScreen(enabled && process.platform !== 'darwin');
  mainWindow.setClosable(!enabled);
  mainWindow.setIgnoreMouseEvents(enabled, { forward: true });
  mainWindow.setAlwaysOnTop(enabled, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(enabled);
};

function registerIpcListeners(mainWindow: BrowserWindow) {
  ipcMain.handle('screenShareStarted', async () => {
    toggleFocusMode(mainWindow, true);
  });

  ipcMain.handle('screenShareStopped', async () => {
    toggleFocusMode(mainWindow, false);
  });
  ipcMain.on(
    'set-ignore-mouse-events',
    (event, ...args: [ignore: boolean, opts: { forward: boolean }]) => {
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
    height,
    width,
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
  });
  toggleFocusMode(mainWindow, false);
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
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
