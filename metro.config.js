const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const defaultConfig = getDefaultConfig(__dirname);

// Add support for SVG
defaultConfig.resolver.sourceExts.push("cjs");
defaultConfig.resolver.sourceExts.push("svg");
defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
defaultConfig.resolver.unstable_enablePackageExports = false;

// This ensures compatibility between nativewind and react-native-svg
module.exports = withNativeWind(defaultConfig, { input: "./global.css" });
