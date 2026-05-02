import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BattlefieldRelapse {
  date: string;
  hour: number;
  triggers: string[];
}

export interface BattlefieldState {
  key: string;
  name: string;
  streakStart: string | null;
  streakDays: number;
  longestStreak: number;
  relapses: BattlefieldRelapse[];
  paused: boolean;
}

const DEFAULT_BATTLEFIELDS: BattlefieldState[] = [
  { key: 'porn',    name: 'Pornography',    streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
  { key: 'lust',    name: 'Lust of Eyes',   streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
  { key: 'fantasy', name: 'Sexual Fantasy', streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
  { key: 'greed',   name: 'Greed',          streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
  { key: 'pride',   name: 'Pride',          streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
];

interface AppState {
  battlefields: BattlefieldState[];
  activeBattlefieldKeys: string[];
  globalStreakDays: number;
  longestGlobalStreak: number;
  emergencyCount: number;

  // Auth
  userId: string | null;          // Supabase auth UUID

  // User profile
  isPro: boolean;
  onboardingComplete: boolean;
  userName: string;
  userTagline: string;
  userEmail: string;
  joinDate: string;
  quizAnswers: Record<string, number>;
  fightingFor: string[];
  covenantScripture: string;

  // Shield / blocking (legacy DNS)
  activeShields: string[];

  // Screen Time (FamilyControls) state — synced from native on each app open
  screenTimeAuthStatus: 'approved' | 'denied' | 'notDetermined' | 'unsupported' | 'unknown';
  adultContentBlocked: boolean;
  appShieldEnabled: boolean;
  shieldedAppCount: number;
  shieldedCategoryCount: number;

  // Notification prefs
  notifDaily: boolean;
  notifCheckin: boolean;
  notifStreak: boolean;

  // Actions
  setShieldActive: (key: string, active: boolean) => void;
  syncScreenTimeState: (state: Partial<AppState>) => void;
  setUserId: (id: string | null) => void;
  computeStreaks: () => void;
  logRelapse: (bfKey: string, triggers: string[], hour: number) => void;
  resetBattlefieldStreak: (bfKey: string) => void;
  togglePauseBattlefield: (bfKey: string) => void;
  setActiveBattlefields: (keys: string[]) => void;
  setIsPro: (val: boolean) => void;
  incrementEmergency: () => void;
  setOnboardingData: (data: Partial<AppState>) => void;
  setUserProfile: (data: { userName?: string; userTagline?: string; covenantScripture?: string; fightingFor?: string[] }) => void;
  setNotifPref: (key: 'notifDaily' | 'notifCheckin' | 'notifStreak', val: boolean) => void;
}

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      battlefields: DEFAULT_BATTLEFIELDS,
      activeBattlefieldKeys: ['porn', 'lust', 'fantasy'],
      globalStreakDays: 0,
      longestGlobalStreak: 0,
      emergencyCount: 0,
      activeShields: [],
      screenTimeAuthStatus: 'notDetermined',
      adultContentBlocked: false,
      appShieldEnabled: false,
      shieldedAppCount: 0,
      shieldedCategoryCount: 0,
      isPro: false,
      fightingFor: [],
      covenantScripture: '',
      onboardingComplete: false,
      userName: '',
      userTagline: '',
      joinDate: new Date().toISOString(),
      notifDaily: true,
      notifCheckin: true,
      notifStreak: true,
      userEmail: '',
      quizAnswers: {},

      computeStreaks: () => {
        const state = get();
        const updated = state.battlefields.map(bf => ({
          ...bf,
          streakDays: daysSince(bf.streakStart),
        }));
        const active = updated.filter(bf =>
          state.activeBattlefieldKeys.includes(bf.key) && !bf.paused
        );
        const global = active.length > 0
          ? Math.min(...active.map(bf => bf.streakDays))
          : 0;
        const longest = Math.max(state.longestGlobalStreak, global);
        set({ battlefields: updated, globalStreakDays: global, longestGlobalStreak: longest });
      },

      logRelapse: (bfKey, triggers, hour) => {
        const state = get();
        const now = new Date().toISOString();
        const updated = state.battlefields.map(bf => {
          if (bf.key !== bfKey) return bf;
          const newLongest = Math.max(bf.longestStreak, bf.streakDays);
          return {
            ...bf,
            longestStreak: newLongest,
            relapses: [{ date: now, hour, triggers }, ...bf.relapses],
            streakStart: now,
            streakDays: 0,
          };
        });
        set({ battlefields: updated });
        get().computeStreaks();
      },

      resetBattlefieldStreak: (bfKey) => {
        const now = new Date().toISOString();
        const state = get();
        const updated = state.battlefields.map(bf =>
          bf.key === bfKey
            ? { ...bf, longestStreak: Math.max(bf.longestStreak, bf.streakDays), streakStart: now, streakDays: 0 }
            : bf
        );
        set({ battlefields: updated });
        get().computeStreaks();
      },

      togglePauseBattlefield: (bfKey) => {
        const state = get();
        const updated = state.battlefields.map(bf =>
          bf.key === bfKey ? { ...bf, paused: !bf.paused } : bf
        );
        set({ battlefields: updated });
      },

      setActiveBattlefields: (keys) => set({ activeBattlefieldKeys: keys }),

      setShieldActive: (key, active) =>
        set(s => ({
          activeShields: active
            ? [...s.activeShields.filter(k => k !== key), key]
            : s.activeShields.filter(k => k !== key),
        })),

      syncScreenTimeState: (state) => set(state as Partial<AppState>),
      setUserId: (id) => set({ userId: id }),
      setIsPro: (val) => set({ isPro: val }),
      incrementEmergency: () => set(s => ({ emergencyCount: s.emergencyCount + 1 })),
      setOnboardingData: (data) => set(data as Partial<AppState>),

      setUserProfile: (data) => set(data),

      setNotifPref: (key, val) => set({ [key]: val }),
    }),
    {
      name: 'lustlock-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
