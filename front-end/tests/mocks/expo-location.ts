export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export const PermissionStatus = {
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined',
  DENIED: 'denied',
};

export const requestForegroundPermissionsAsync = async () => ({
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
});

export const getForegroundPermissionsAsync = async () => ({
  status: 'granted',
  granted: true,
  canAskAgain: true,
  expires: 'never',
});

export const getCurrentPositionAsync = async (_options?: any) => ({
  coords: {
    latitude: -8.0597,
    longitude: -34.8877,
    altitude: null,
    accuracy: 10,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
});
