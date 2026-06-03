import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Toggle } from '../../components/UI';
import { Colors } from '../../constants/colors';
import { ScreenTime } from '../../modules/ScreenTime';
import { syncDailyReminder } from '../../lib/notifications';
import { useAppStore } from '../../store/useAppStore';

function ShieldIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L4 5v6c0 5.5 3.75 10.15 8 11.4C16.25 21.15 20 16.5 20 11V5L12 2z"
        stroke={Colors.gold} strokeWidth="1.8" strokeLinejoin="round"/>
      <Path d="M9 12l2 2 4-4" stroke={Colors.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function GlobeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={Colors.black} strokeWidth="1.5"/>
      <Path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18"
        stroke={Colors.black} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}

function PhoneIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="2" width="14" height="20" rx="3" stroke={Colors.black} strokeWidth="1.5"/>
      <Line x1="12" y1="18" x2="12.01" y2="18" stroke={Colors.black} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M14 21h-4"
        stroke={Colors.black} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function ControlCard({
  icon, title, body, action, actionLabel, toggle, onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: () => void;
  actionLabel?: string;
  toggle?: boolean;
  onToggle?: () => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.iconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={s.cardBody}>{body}</Text>
        </View>
        {typeof toggle === 'boolean' && onToggle ? <Toggle on={toggle} onToggle={onToggle}/> : null}
      </View>
      {action && actionLabel ? (
        <TouchableOpacity activeOpacity={0.75} onPress={action} style={s.action}>
          <Text style={s.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function BlockerScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeShields, screenTimeAuthStatus, appShieldEnabled, shieldedAppCount,
    notifDaily, syncScreenTimeState, setNotifPref,
  } = useAppStore();
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const state = await ScreenTime.getState();
    syncScreenTimeState({
      screenTimeAuthStatus: state.authStatus,
      adultContentBlocked: state.adultContentBlocked,
      appShieldEnabled: state.appShieldEnabled,
      shieldedAppCount: state.shieldedAppCount,
      shieldedCategoryCount: state.shieldedCategoryCount,
    });
  }, [syncScreenTimeState]);

  useEffect(() => { refresh(); }, [refresh]);

  const ensureAccess = useCallback(async () => {
    if (screenTimeAuthStatus === 'approved') return true;
    setBusy('access');
    try {
      const status = await ScreenTime.requestAuthorization();
      await refresh();
      if (status === 'approved') return true;
      Alert.alert('Screen Time Access Needed', 'Allow Screen Time access to choose apps for blocking.');
      return false;
    } finally {
      setBusy(null);
    }
  }, [refresh, screenTimeAuthStatus]);

  const editApps = useCallback(async () => {
    if (!await ensureAccess()) return;
    setBusy('apps');
    try {
      const result = await ScreenTime.presentAppPicker();
      if (result.success) await refresh();
    } finally {
      setBusy(null);
    }
  }, [ensureAccess, refresh]);

  const toggleApps = useCallback(async () => {
    if (!appShieldEnabled) {
      await editApps();
      return;
    }
    Alert.alert('Disable app blocking?', 'Your selected apps will become available immediately.', [
      { text: 'Keep Enabled', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          setBusy('apps');
          try {
            await ScreenTime.clearAppShield();
            await refresh();
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  }, [appShieldEnabled, editApps, refresh]);

  const toggleReminder = useCallback(async () => {
    const next = !notifDaily;
    setBusy('notifications');
    try {
      const scheduled = await syncDailyReminder(next, true);
      setNotifPref('notifDaily', next && scheduled);
      if (next && !scheduled) {
        Alert.alert('Notifications Disabled', 'Enable notifications in iOS Settings to receive your daily reminder.');
      }
    } finally {
      setBusy(null);
    }
  }, [notifDaily, setNotifPref]);

  const dnsEnabled = activeShields.length > 0;
  const screenTimeEnabled = appShieldEnabled && screenTimeAuthStatus === 'approved';
  const anyEnabled = dnsEnabled || screenTimeEnabled || notifDaily;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>PROTECTION CENTER</Text>
          <Text style={s.title}>Shield</Text>
        </View>
        <View style={s.badge}>
          <View style={[s.badgeDot, { backgroundColor: anyEnabled ? Colors.success : Colors.border }]}/>
          <Text style={s.badgeText}>{anyEnabled ? 'Enabled' : 'Off'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.summary}>
          <ShieldIcon size={26}/>
          <Text style={s.summaryText}>Choose the protection that fits your day. Each control can be adjusted independently.</Text>
        </View>

        <ControlCard
          icon={<GlobeIcon/>}
          title="DNS Web Filter"
          body={dnsEnabled ? 'A DNS profile is marked active on this device.' : 'Set up a device-wide web filter profile.'}
          action={() => router.push('/shield')}
          actionLabel={dnsEnabled ? 'MANAGE DNS FILTER' : 'SET UP DNS FILTER'}
        />

        <ControlCard
          icon={<PhoneIcon/>}
          title="Screen Time App Blocking"
          body={screenTimeEnabled ? `${shieldedAppCount} app${shieldedAppCount === 1 ? '' : 's'} selected.` : 'Choose the apps that should show an intervention screen.'}
          toggle={screenTimeEnabled}
          onToggle={toggleApps}
          action={editApps}
          actionLabel={screenTimeEnabled ? 'EDIT BLOCKED APPS' : 'CHOOSE APPS'}
        />

        <ControlCard
          icon={<BellIcon/>}
          title="Daily Reminder"
          body="One private check-in reminder each evening at 8:00 PM."
          toggle={notifDaily}
          onToggle={toggleReminder}
        />

        {busy ? (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={Colors.gold}/>
            <Text style={s.loadingText}>Updating protection...</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 14,
    borderBottomWidth: 1.5, borderBottomColor: Colors.border,
  },
  eyebrow: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2.5, color: Colors.gold },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, color: Colors.black, marginTop: 3 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 999,
    backgroundColor: Colors.card, paddingHorizontal: 11, paddingVertical: 7,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, color: Colors.black, letterSpacing: 0.8, textTransform: 'uppercase' },
  summary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: Colors.goldBorder, borderRadius: 16,
    backgroundColor: Colors.card, padding: 15,
  },
  summaryText: { flex: 1, fontFamily: 'CrimsonPro_400Regular', fontSize: 15, lineHeight: 20, color: Colors.black },
  card: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 16,
    backgroundColor: Colors.card, padding: 15,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  cardTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 13, color: Colors.black },
  cardBody: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, lineHeight: 18, color: Colors.black, marginTop: 3 },
  action: {
    alignSelf: 'flex-start', marginTop: 13,
    borderWidth: 1.5, borderColor: Colors.goldBorder, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  actionText: { fontFamily: 'Cinzel_700Bold', fontSize: 9, letterSpacing: 1.2, color: Colors.gold },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 4 },
  loadingText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.black },
});
