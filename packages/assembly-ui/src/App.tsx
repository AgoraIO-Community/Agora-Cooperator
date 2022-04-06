import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Locale } from 'antd/lib/locale-provider';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import { IntlProvider } from 'react-intl';
import Landing from './pages/Landing';
import Session from './pages/Session';
import enUSMessages from './i18n/enUS';
import zhCNMessages from './i18n/zhCN';
import 'antd/dist/antd.dark.min.css';

const LOCALES: { [key: string]: Locale } = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

const LOCALE_MESSAGES: { [key: string]: any } = {
  'en-US': enUSMessages,
  'zh-CN': zhCNMessages,
};

const App = () => {
  const { language } = navigator;
  const locale = LOCALES[language] ?? enUS;
  const localMessages = LOCALE_MESSAGES[language] ?? enUSMessages;
  return (
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
  );
};

export default App;
