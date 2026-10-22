import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Expo Go ships fixed native code: no background-audio service, no lock-screen
 * controls and no full media-library access. Those need a development build.
 */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
