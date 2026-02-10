import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Fallback to Replit domain if available
  const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_INTERNAL_APP_DOMAIN;
  if (replitDomain) {
    return `https://${replitDomain}`;
  }

  return 'http://localhost:5000';
};

export const Config = {
  API_BASE_URL: getBaseUrl(),
  IS_DEV: __DEV__,
};
