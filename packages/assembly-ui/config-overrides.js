const { override, addWebpackExternals, addWebpackPlugin, setWebpackStats } = require('customize-cra');
const webpack = require('webpack');

const env = process.env.NODE_ENV || 'development';

const API_HOSTS = {
  development: 'http://localhost:3030', // disable this line for using remote server
  // development: 'https://assembly-api.gz3.agoralab.co', // enable this line for using remote server
  production: 'https://assembly-api.gz3.agoralab.co',
};

module.exports = override(
  (config) => {
    config.ignoreWarnings = [
      {
        module: /@netless\/window-manager/,
      },
    ];
    return config;
  },
  addWebpackExternals([
    {
      'agora-rdc-core': 'commonjs2 agora-rdc-core',
      'agora-electron-sdk': 'commonjs2 agora-electron-sdk',
      'electron': 'commonjs2 electron',
      'util': 'commonjs2 util',
      'ps-tree': 'commonjs2 ps-tree',
      'ps-node': 'commonjs2 ps-node',
    },
  ]),
  addWebpackPlugin(
    new webpack.DefinePlugin({
      API_HOST: JSON.stringify(API_HOSTS[env]),
    }),
  ),
);
