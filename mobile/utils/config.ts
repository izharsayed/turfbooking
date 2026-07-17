import Constants from 'expo-constants';

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api/v1`;
  }
  return 'http://localhost:5000/api/v1';
};

export const CONFIG = {
  API_URL: getBaseUrl(),
  REQUEST_TIMEOUT_MS: 10000,
  PAGINATION_LIMIT: 20,
  
  DEFAULTS: {
    PEAK_START_HOUR: 18,
    PEAK_END_HOUR: 22,
    PEAK_SURCHARGE: 300,
    WEEKEND_SURCHARGE: 200,
  },
  
  DEFAULT_LOCATION: {
    latitude: 19.0948,
    longitude: 74.7480,
    label: 'Ahmednagar, MH',
  },
};
