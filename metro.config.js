// Enable Metro to resolve .mjs modules (required by Supabase packages)
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').ConfigT} */
module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  config.resolver.sourceExts = [
    ...new Set([...(config.resolver.sourceExts || []), 'mjs'])
  ];
  return config;
})();


