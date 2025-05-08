
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Add Node.js polyfills
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  events: require.resolve('events'),
  'stream-http': require.resolve('stream-http'),
};

module.exports = config;
