const { getDefaultConfig } = require('expo/metro-config');

/**
 * woff2 אינו ברשימת הנכסים של Metro כברירת מחדל.
 * בדפדפן הגופנים נטענים כ-WOFF2 · ראו src/theme/fonts.web.ts.
 */
const config = getDefaultConfig(__dirname);
if (!config.resolver.assetExts.includes('woff2')) {
  config.resolver.assetExts.push('woff2');
}

module.exports = config;
