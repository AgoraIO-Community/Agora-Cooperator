import React, { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Locale } from 'antd/lib/locale-provider';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import { IntlProvider } from 'react-intl';
import TitleBar from 'frameless-titlebar';
import { remote } from 'electron';
import Landing from './pages/Landing';
import Session from './pages/Session';
import enUSMessages from './i18n/enUS';
import zhCNMessages from './i18n/zhCN';
import { useTitlebar } from './hooks';
import 'antd/dist/antd.dark.min.css';

const LOCALES: { [key: string]: Locale } = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

const LOCALE_MESSAGES: { [key: string]: any } = {
  'en-US': enUSMessages,
  'zh-CN': zhCNMessages,
};

const currentWindow = remote.getCurrentWindow();

const App = () => {
  const titlebar = useTitlebar();
  const { language } = navigator;
  const locale = LOCALES[language] ?? enUS;
  const localMessages = LOCALE_MESSAGES[language] ?? enUSMessages;
  const [maximized, setMaximized] = useState(currentWindow.isMaximized());

  // add window listeners for currentWindow
  useEffect(() => {
    const onMaximized = () => setMaximized(true);
    const onRestore = () => setMaximized(false);
    currentWindow.on('maximize', onMaximized);
    currentWindow.on('unmaximize', onRestore);
    return () => {
      currentWindow.removeListener('maximize', onMaximized);
      currentWindow.removeListener('unmaximize', onRestore);
    };
  }, []);

  // used by double click on the titlebar
  // and by the maximize control button
  const handleMaximize = () => {
    if (maximized) {
      currentWindow.restore();
    } else {
      currentWindow.maximize();
    }
  };

  return (
    <>
      {titlebar.visible ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999,
          }}>
          <TitleBar
            title="Assembly"
            currentWindow={currentWindow} // electron window instance
            platform={window.process.platform as any}
            onMinimize={() => currentWindow.minimize()}
            onMaximize={handleMaximize}
            // when the titlebar is double clicked
            onDoubleClick={handleMaximize}
            // hide minimize windows control
            disableMinimize={false}
            // hide maximize windows control
            disableMaximize={false}
            // is the current window maximized?
            maximized={maximized}
            theme={{
              bar: {
                height: window.process.platform === 'darwin' ? 36 : undefined,
              },
            }}
          />
        </div>
      ) : null}
      <ConfigProvider locale={locale}>
        <IntlProvider locale={language} messages={localMessages}>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/session/:sessionId/profile/:profileId"
                element={<Session />}
              />
            </Routes>
          </HashRouter>
        </IntlProvider>
      </ConfigProvider>
    </>
  );
};

export default App;
