import { NativeModules, Platform } from 'react-native';

const { ScreenTimeBridge } = NativeModules;
const supported = Platform.OS === 'ios' && !!ScreenTimeBridge;

export type AuthStatus = 'approved' | 'denied' | 'notDetermined' | 'unsupported' | 'unknown';

export interface ScreenTimeState {
  authStatus: AuthStatus;
  adultContentBlocked: boolean;
  appShieldEnabled: boolean;
  shieldedAppCount: number;
  shieldedCategoryCount: number;
}

export interface AppPickerResult {
  success: boolean;
  appCount?: number;
  categoryCount?: number;
}

const fallback: ScreenTimeState = {
  authStatus: 'unsupported',
  adultContentBlocked: false,
  appShieldEnabled: false,
  shieldedAppCount: 0,
  shieldedCategoryCount: 0,
};

export const ScreenTime = {
  isSupported: supported,

  async getState(): Promise<ScreenTimeState> {
    if (!supported) return fallback;
    return ScreenTimeBridge.getState();
  },

  async requestAuthorization(): Promise<AuthStatus> {
    if (!supported) return 'unsupported';
    return ScreenTimeBridge.requestAuthorization();
  },

  async setAdultContentBlocked(blocked: boolean): Promise<boolean> {
    if (!supported) return false;
    return ScreenTimeBridge.setAdultContentBlocked(blocked);
  },

  async presentAppPicker(): Promise<AppPickerResult> {
    if (!supported) return { success: false };
    return ScreenTimeBridge.presentAppPicker();
  },

  async clearAppShield(): Promise<boolean> {
    if (!supported) return false;
    return ScreenTimeBridge.clearAppShield();
  },

  async clearAll(): Promise<boolean> {
    if (!supported) return false;
    return ScreenTimeBridge.clearAll();
  },

  async restoreRestrictions(): Promise<boolean> {
    if (!supported) return false;
    return ScreenTimeBridge.restoreRestrictions();
  },
};
