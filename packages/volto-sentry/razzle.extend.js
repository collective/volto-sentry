module.exports = {
  modify: (config) => config,
  plugins: (defaultPlugins) =>
    defaultPlugins.concat([{ object: require('./webpack-sentry-plugin') }]),
};
