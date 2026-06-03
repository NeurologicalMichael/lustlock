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

export interface DailyCheckIn {
  id: string;
  mood: number;
  urgeLevel: number;
  energyLevel: number;
  relapseToday: boolean;
  notes: string;
  timestamp: string;
}

export interface RecoveryLesson {
  programDay: number;
  topic: 'dopamine' | 'habits' | 'triggers' | 'identity' | 'discipline';
  title: string;
  lessonContent: string;
  actionStep: string;
  reflectionPrompt: string;
  completed: boolean;
}

export interface UrgeSession {
  id: string;
  durationMinutes: number;
  startedAt: string;
  completedAt: string | null;
  completed: boolean;
}

export interface ReplacementActivity {
  id: string;
  type: 'physical' | 'mental' | 'spiritual';
  title: string;
  durationEstimate: number;
  completed: boolean;
}

export interface SavedPrayer {
  id: string;
  type: 'prewritten' | 'custom';
  content: string;
  saved: boolean;
  createdAt: string;
}

export interface IdentityMessage {
  id: string;
  content: string;
  trigger: 'login' | 'urge' | 'notification';
}

export interface AccountabilityPartner {
  partnerUserId: string;
  name: string;
  shareStreak: boolean;
  shareRelapse: boolean;
  alertOnRelapse: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  durationDays: number;
  participantsCount: number;
  leaderboardEnabled: boolean;
  joined: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  condition: string;
  unlocked: boolean;
}

export interface JournalEntry {
  id: string;
  content: string;
  promptUsed?: string;
  timestamp: string;
}

const DEFAULT_BATTLEFIELDS: BattlefieldState[] = [
  { key: 'lust',    name: 'Lust',           streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
  { key: 'greed',   name: 'Greed',          streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
  { key: 'pride',   name: 'Pride',          streakStart: new Date().toISOString(), streakDays: 0, longestStreak: 0, relapses: [], paused: false },
];

const DEFAULT_LESSONS: RecoveryLesson[] = [
  {
    programDay: 1,
    topic: 'identity',
    title: 'You Are Not Your Urge',
    lessonContent: 'An urge is a signal, not a command. LustLock treats the first day as a return to identity: you are a son of God before you are a streak number.',
    actionStep: 'Write one sentence naming who you are becoming.',
    reflectionPrompt: 'What identity do you need to remember before temptation gets loud?',
    completed: false,
  },
  {
    programDay: 2,
    topic: 'dopamine',
    title: 'The Dopamine Loop',
    lessonContent: 'Compulsion grows through cue, craving, response, and reward. Breaking the loop means interrupting the cue early and replacing the response with a clean action.',
    actionStep: 'Identify your most common cue and pair it with one replacement activity.',
    reflectionPrompt: 'What cue tends to start the spiral?',
    completed: false,
  },
  {
    programDay: 3,
    topic: 'triggers',
    title: 'Map the Battlefield',
    lessonContent: 'Triggers are easier to resist when they are named. Time, mood, isolation, and device access often combine into a predictable risk window.',
    actionStep: 'Log today’s mood, energy, and urge level before bedtime.',
    reflectionPrompt: 'What time of day requires the strongest guard?',
    completed: false,
  },
  {
    programDay: 4,
    topic: 'habits',
    title: 'Build the Replacement',
    lessonContent: 'Recovery is not only saying no. It is building a stronger yes: prayer, movement, confession, service, and rest.',
    actionStep: 'Complete one physical, one mental, or one spiritual replacement activity.',
    reflectionPrompt: 'What clean action restored your focus today?',
    completed: false,
  },
  {
    programDay: 5,
    topic: 'discipline',
    title: 'Guardrails Before Grit',
    lessonContent: 'Willpower is strongest when guardrails are already in place. Blocking, accountability, and reminders reduce the number of battles you have to fight alone.',
    actionStep: 'Review your Shield settings and choose one high-risk app or site to block.',
    reflectionPrompt: 'Where do you need structure instead of more promises?',
    completed: false,
  },
];

const DEFAULT_ACTIVITIES: ReplacementActivity[] = [
  { id: 'walk', type: 'physical', title: 'Take a 10-minute walk', durationEstimate: 10, completed: false },
  { id: 'pushups', type: 'physical', title: 'Do 25 pushups or squats', durationEstimate: 5, completed: false },
  { id: 'cold-water', type: 'physical', title: 'Wash face with cold water', durationEstimate: 2, completed: false },
  { id: 'journal', type: 'mental', title: 'Write what triggered the urge', durationEstimate: 5, completed: false },
  { id: 'tidy', type: 'mental', title: 'Reset your room or desk', durationEstimate: 8, completed: false },
  { id: 'pray-psalm', type: 'spiritual', title: 'Pray Psalm 51:10 slowly', durationEstimate: 3, completed: false },
  { id: 'message', type: 'spiritual', title: 'Message an accountability partner', durationEstimate: 2, completed: false },
];

const DEFAULT_IDENTITY_MESSAGES: IdentityMessage[] = [
  { id: 'login-identity', trigger: 'login', content: 'You are not fighting for shame. You are fighting from grace.' },
  { id: 'urge-identity', trigger: 'urge', content: 'This urge can pass without owning you. Hold the line.' },
  { id: 'notification-identity', trigger: 'notification', content: 'Your future self is built by the next faithful choice.' },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-checkin', title: 'First Check-In', condition: 'Complete one daily check-in', unlocked: false },
  { id: 'urge-resisted', title: 'Held the Line', condition: 'Complete one urge delay', unlocked: false },
  { id: 'first-lesson', title: 'First Lesson', condition: 'Complete one recovery lesson', unlocked: false },
  { id: 'seven-day-streak', title: 'First Week', condition: 'Reach a 7 day streak', unlocked: false },
  { id: 'iron-will', title: 'Iron Will', condition: 'Reach a 30 day streak', unlocked: false },
];

const DEFAULT_CHALLENGES: Challenge[] = [
  { id: 'clean-week', title: 'Clean Week Covenant', durationDays: 7, participantsCount: 128, leaderboardEnabled: true, joined: false },
  { id: 'morning-prayer', title: 'Morning Prayer Guard', durationDays: 14, participantsCount: 84, leaderboardEnabled: false, joined: false },
  { id: 'ninety-reset', title: '90-Day Reset', durationDays: 90, participantsCount: 312, leaderboardEnabled: true, joined: false },
];

interface AppState {
  battlefields: BattlefieldState[];
  activeBattlefieldKeys: string[];
  globalStreakDays: number;
  longestGlobalStreak: number;
  relapseCount: number;
  emergencyCount: number;
  urgesResistedCount: number;
  lastRelapseTimestamp: string | null;

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

  // Recovery loop
  dailyCheckIns: DailyCheckIn[];
  recoveryLessons: RecoveryLesson[];
  urgeSessions: UrgeSession[];
  replacementActivities: ReplacementActivity[];
  savedPrayers: SavedPrayer[];
  identityMessages: IdentityMessage[];
  accountabilityPartners: AccountabilityPartner[];
  challenges: Challenge[];
  xpPoints: number;
  level: number;
  achievements: Achievement[];
  freezeAvailable: number;
  freezeUsed: boolean;
  journalEntries: JournalEntry[];
  dailyCheckinReminder: boolean;
  highRiskTimeAlert: boolean;
  motivationalMessage: boolean;
  relapseFollowup: boolean;
  customBlockRules: string[];
  lockEnabled: boolean;
  unlockMethod: 'delay_timer' | 'partner_approval';

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
  completeDailyCheckIn: (data: Omit<DailyCheckIn, 'id' | 'timestamp'>) => void;
  startUrgeDelay: (durationMinutes?: number) => string;
  completeUrgeDelay: (id: string) => void;
  completeReplacementActivity: (id: string) => void;
  completeRecoveryLesson: (programDay: number) => void;
  savePrayer: (content: string, type?: 'prewritten' | 'custom') => void;
  addJournalEntry: (content: string, promptUsed?: string) => void;
  joinChallenge: (id: string) => void;
  addAccountabilityPartner: (partner: AccountabilityPartner) => void;
  removeAccountabilityPartner: (partnerUserId: string) => void;
  setRecoveryNotificationPref: (key: 'dailyCheckinReminder' | 'highRiskTimeAlert' | 'motivationalMessage' | 'relapseFollowup', val: boolean) => void;
  setLockSettings: (enabled: boolean, method: 'delay_timer' | 'partner_approval') => void;
  addCustomBlockRule: (rule: string) => void;
  resetLocalAccount: () => void;
}

function localMidnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const start = new Date(iso);
  const diff = localMidnight(new Date()) - localMidnight(start);
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function awardXp(set: (partial: Partial<AppState>) => void, get: () => AppState, points: number) {
  const next = get().xpPoints + points;
  set({ xpPoints: next, level: levelForXp(next) });
}

function unlockAchievement(set: (partial: Partial<AppState>) => void, get: () => AppState, id: string) {
  set({
    achievements: get().achievements.map(a =>
      a.id === id ? { ...a, unlocked: true } : a
    ),
  });
}

const LUST_KEYS = ['porn', 'lust', 'fantasy'];

function normalizeBattlefieldData(state: Pick<AppState, 'battlefields' | 'activeBattlefieldKeys'>) {
  const lustSources = state.battlefields.filter(bf => LUST_KEYS.includes(bf.key));
  const otherBattlefields = state.battlefields.filter(bf => !LUST_KEYS.includes(bf.key));
  const allRelapses = lustSources
    .flatMap(bf => bf.relapses)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const existingLust = lustSources.find(bf => bf.key === 'lust');
  const latestRelapseDate = allRelapses[0]?.date ?? null;
  const lustStart = latestRelapseDate ?? existingLust?.streakStart ?? new Date().toISOString();
  const lustField: BattlefieldState = {
    key: 'lust',
    name: 'Lust',
    streakStart: lustStart,
    streakDays: daysSince(lustStart),
    longestStreak: Math.max(0, ...lustSources.map(bf => bf.longestStreak)),
    relapses: allRelapses,
    paused: lustSources.length > 0 ? lustSources.every(bf => bf.paused) : false,
  };
  const knownOtherKeys = new Set(DEFAULT_BATTLEFIELDS.filter(bf => bf.key !== 'lust').map(bf => bf.key));
  const mergedBattlefields = [
    lustField,
    ...otherBattlefields.filter(bf => knownOtherKeys.has(bf.key)),
  ];
  const nextActiveKeys = Array.from(new Set(
    state.activeBattlefieldKeys.map(key => LUST_KEYS.includes(key) ? 'lust' : key)
  )).filter(key => mergedBattlefields.some(bf => bf.key === key));

  return {
    battlefields: mergedBattlefields,
    activeBattlefieldKeys: nextActiveKeys.length ? nextActiveKeys : ['lust'],
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      battlefields: DEFAULT_BATTLEFIELDS,
      activeBattlefieldKeys: ['lust'],
      globalStreakDays: 0,
      longestGlobalStreak: 0,
      relapseCount: 0,
      emergencyCount: 0,
      urgesResistedCount: 0,
      lastRelapseTimestamp: null,
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
      dailyCheckIns: [],
      recoveryLessons: DEFAULT_LESSONS,
      urgeSessions: [],
      replacementActivities: DEFAULT_ACTIVITIES,
      savedPrayers: [
        {
          id: 'surrender-prayer',
          type: 'prewritten',
          content: 'Lord Jesus, I surrender this urge to You. Give me clean eyes, a steady heart, and the courage to take the next faithful step.',
          saved: true,
          createdAt: new Date().toISOString(),
        },
      ],
      identityMessages: DEFAULT_IDENTITY_MESSAGES,
      accountabilityPartners: [],
      challenges: DEFAULT_CHALLENGES,
      xpPoints: 0,
      level: 1,
      achievements: DEFAULT_ACHIEVEMENTS,
      freezeAvailable: 1,
      freezeUsed: false,
      journalEntries: [],
      dailyCheckinReminder: true,
      highRiskTimeAlert: true,
      motivationalMessage: true,
      relapseFollowup: true,
      customBlockRules: [],
      lockEnabled: false,
      unlockMethod: 'delay_timer',

      computeStreaks: () => {
        const state = get();
        const normalized = normalizeBattlefieldData(state);
        const updated = normalized.battlefields.map(bf => ({
          ...bf,
          streakDays: daysSince(bf.streakStart),
        }));
        const active = updated.filter(bf =>
          normalized.activeBattlefieldKeys.includes(bf.key) && !bf.paused
        );
        const global = active.length > 0
          ? Math.min(...active.map(bf => bf.streakDays))
          : 0;
        const longest = Math.max(state.longestGlobalStreak, global);
        const relapses = updated.flatMap(bf => bf.relapses);
        const lastRelapse = relapses
          .map(r => r.date)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
        const achievements = state.achievements.map(a => {
          if (a.id === 'seven-day-streak' && global >= 7) return { ...a, unlocked: true };
          if (a.id === 'iron-will' && global >= 30) return { ...a, unlocked: true };
          return a;
        });
        set({
          battlefields: updated,
          activeBattlefieldKeys: normalized.activeBattlefieldKeys,
          globalStreakDays: global,
          longestGlobalStreak: longest,
          relapseCount: relapses.length,
          lastRelapseTimestamp: lastRelapse,
          achievements,
        });
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
        set({
          battlefields: updated,
          relapseCount: state.relapseCount + 1,
          lastRelapseTimestamp: now,
          freezeUsed: false,
        });
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

      setActiveBattlefields: (keys) => set({
        activeBattlefieldKeys: Array.from(new Set(keys.map(key => LUST_KEYS.includes(key) ? 'lust' : key))),
      }),

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
      completeDailyCheckIn: (data) => {
        const entry: DailyCheckIn = { ...data, id: makeId('checkin'), timestamp: new Date().toISOString() };
        set(s => ({ dailyCheckIns: [entry, ...s.dailyCheckIns] }));
        awardXp(set, get, 15);
        unlockAchievement(set, get, 'first-checkin');
        if (data.relapseToday) {
          get().logRelapse('lust', ['Daily Check-In'], new Date().getHours());
        }
      },

      startUrgeDelay: (durationMinutes = 10) => {
        const id = makeId('urge');
        const session: UrgeSession = {
          id,
          durationMinutes,
          startedAt: new Date().toISOString(),
          completedAt: null,
          completed: false,
        };
        set(s => ({ urgeSessions: [session, ...s.urgeSessions] }));
        return id;
      },

      completeUrgeDelay: (id) => {
        set(s => ({
          urgeSessions: s.urgeSessions.map(u =>
            u.id === id ? { ...u, completed: true, completedAt: new Date().toISOString() } : u
          ),
          urgesResistedCount: s.urgesResistedCount + 1,
        }));
        awardXp(set, get, 20);
        unlockAchievement(set, get, 'urge-resisted');
      },

      completeReplacementActivity: (id) => {
        set(s => ({
          replacementActivities: s.replacementActivities.map(a =>
            a.id === id ? { ...a, completed: true } : a
          ),
        }));
        awardXp(set, get, 10);
      },

      completeRecoveryLesson: (programDay) => {
        set(s => ({
          recoveryLessons: s.recoveryLessons.map(l =>
            l.programDay === programDay ? { ...l, completed: true } : l
          ),
        }));
        awardXp(set, get, 25);
        unlockAchievement(set, get, 'first-lesson');
      },

      savePrayer: (content, type = 'custom') => {
        if (!content.trim()) return;
        const prayer: SavedPrayer = {
          id: makeId('prayer'),
          type,
          content: content.trim(),
          saved: true,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ savedPrayers: [prayer, ...s.savedPrayers] }));
      },

      addJournalEntry: (content, promptUsed) => {
        if (!content.trim()) return;
        const entry: JournalEntry = {
          id: makeId('journal'),
          content: content.trim(),
          promptUsed,
          timestamp: new Date().toISOString(),
        };
        set(s => ({ journalEntries: [entry, ...s.journalEntries] }));
        awardXp(set, get, 10);
      },

      joinChallenge: (id) => {
        set(s => ({
          challenges: s.challenges.map(c =>
            c.id === id ? { ...c, joined: true, participantsCount: c.participantsCount + (c.joined ? 0 : 1) } : c
          ),
        }));
      },

      addAccountabilityPartner: (partner) => {
        set(s => ({
          accountabilityPartners: [
            partner,
            ...s.accountabilityPartners.filter(p => p.partnerUserId !== partner.partnerUserId),
          ],
        }));
      },
      removeAccountabilityPartner: (partnerUserId) => {
        set(s => ({
          accountabilityPartners: s.accountabilityPartners.filter(p => p.partnerUserId !== partnerUserId),
        }));
      },

      setRecoveryNotificationPref: (key, val) => set({ [key]: val }),
      setLockSettings: (enabled, method) => set({ lockEnabled: enabled, unlockMethod: method }),
      addCustomBlockRule: (rule) => {
        const clean = rule.trim();
        if (!clean) return;
        set(s => ({ customBlockRules: [...s.customBlockRules.filter(r => r !== clean), clean] }));
      },

      resetLocalAccount: () => set({
        userId: null,
        battlefields: DEFAULT_BATTLEFIELDS,
        activeBattlefieldKeys: ['lust'],
        globalStreakDays: 0,
        longestGlobalStreak: 0,
        relapseCount: 0,
        emergencyCount: 0,
        urgesResistedCount: 0,
        lastRelapseTimestamp: null,
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
        dailyCheckIns: [],
        recoveryLessons: DEFAULT_LESSONS,
        urgeSessions: [],
        replacementActivities: DEFAULT_ACTIVITIES,
        savedPrayers: [
          {
            id: 'surrender-prayer',
            type: 'prewritten',
            content: 'Lord Jesus, I surrender this urge to You. Give me clean eyes, a steady heart, and the courage to take the next faithful step.',
            saved: true,
            createdAt: new Date().toISOString(),
          },
        ],
        identityMessages: DEFAULT_IDENTITY_MESSAGES,
        accountabilityPartners: [],
        challenges: DEFAULT_CHALLENGES,
        xpPoints: 0,
        level: 1,
        achievements: DEFAULT_ACHIEVEMENTS,
        freezeAvailable: 1,
        freezeUsed: false,
        journalEntries: [],
        dailyCheckinReminder: true,
        highRiskTimeAlert: true,
        motivationalMessage: true,
        relapseFollowup: true,
        customBlockRules: [],
        lockEnabled: false,
        unlockMethod: 'delay_timer',
      }),
    }),
    {
      name: 'lustlock-v2-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.computeStreaks();
      },
    }
  )
);
