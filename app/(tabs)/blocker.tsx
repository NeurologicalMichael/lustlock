import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Toggle } from '../../components/UI';
import { ScreenTime, type ScreenTimeState } from '../../modules/ScreenTime';
import { useAppStore } from '../../store/useAppStore';

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShieldIcon({ size = 22, color = Colors.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L4 5v6c0 5.5 3.75 10.15 8 11.4C16.25 21.15 20 16.5 20 11V5L12 2z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </Svg>
  );
}
function LockIcon({ color = Colors.white3 }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5"/>
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}
function GlobeIcon({ color = Colors.white3 }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
      <Path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}
function PhoneIcon({ color = Colors.white3 }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.5"/>
      <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}
function CheckCircle({ color = Colors.success }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// ── Permission gate ───────────────────────────────────────────────────────────

function PermissionGate({ onGranted }: { onGranted: () => void }) {
  const insets = useSafeAreaInsets();
  const [requesting, setRequesting] = useState(false);

  const request = async () => {
    setRequesting(true);
    try {
      const status = await ScreenTime.requestAuthorization();
      if (status === 'approved') {
        onGranted();
      } else {
        Alert.alert(
          'Permission Required',
          'LustLock needs Screen Time access to shield apps and block adult web content. You can enable this in Settings → Screen Time.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={[pg.root, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 40 }]}>
      {/* Glow ring */}
      <View style={pg.glowWrap}>
        <LinearGradient
          colors={['rgba(255,215,0,0.18)', 'rgba(255,215,0,0.04)']}
          style={pg.glowRing}
        />
        <ShieldIcon size={52} color={Colors.gold}/>
      </View>

      <Text style={pg.eyebrow}>SCREEN TIME BLOCKER</Text>
      <Text style={pg.title}>Covenant{'\n'}Shield</Text>
      <Text style={pg.body}>
        LustLock uses Apple's Screen Time API to block adult web content and shield distraction apps — enforced at the OS level, active even when the app is closed.
      </Text>

      <View style={pg.bullets}>
        {[
          [GlobeIcon,  'Blocks adult web content in Safari'],
          [PhoneIcon,  'Shields apps you choose (Instagram, TikTok, etc.)'],
          [LockIcon,   'Restrictions persist in the background'],
        ].map(([Icon, label], i) => (
          <View key={i} style={pg.bullet}>
            {/* @ts-ignore */}
            <Icon color={Colors.gold}/>
            <Text style={pg.bulletText}>{label as string}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={request}
        disabled={requesting}
        style={[pg.btn, requesting && { opacity: 0.6 }]}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={pg.btnGrad}
        >
          {requesting
            ? <ActivityIndicator color="#0A0520" size="small"/>
            : <Text style={pg.btnText}>ALLOW SCREEN TIME ACCESS</Text>
          }
        </LinearGradient>
      </TouchableOpacity>

      <Text style={pg.note}>
        iOS will show a system dialog. Your data never leaves your device.
      </Text>
    </View>
  );
}

const pg = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28,
  },
  glowWrap: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject, borderRadius: 50,
    borderWidth: 1.5, borderColor: Colors.goldBorder,
  },
  eyebrow: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 3,
    color: Colors.gold, marginBottom: 8,
  },
  title: {
    fontFamily: 'Cinzel_700Bold', fontSize: 30, letterSpacing: 1,
    color: Colors.white, textAlign: 'center', lineHeight: 40, marginBottom: 16,
  },
  body: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 14,
    color: Colors.white2, textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  bullets: { width: '100%', gap: 14, marginBottom: 32 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white2, flex: 1 },
  btn: { width: '100%', borderRadius: 999, overflow: 'hidden' },
  btnGrad: { height: 54, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: 'Cinzel_700Bold', fontSize: 12, letterSpacing: 2, color: '#0A0520' },
  note: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 11,
    color: Colors.white3, textAlign: 'center', marginTop: 14, lineHeight: 17,
  },
});

// ── Main blocker screen ───────────────────────────────────────────────────────

export default function BlockerScreen() {
  const insets = useSafeAreaInsets();
  const { syncScreenTimeState, screenTimeAuthStatus, adultContentBlocked, appShieldEnabled, shieldedAppCount } = useAppStore();
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const state = await ScreenTime.getState();
    syncScreenTimeState({
      screenTimeAuthStatus: state.authStatus,
      adultContentBlocked: state.adultContentBlocked,
      appShieldEnabled: state.appShieldEnabled,
      shieldedAppCount: state.shieldedAppCount,
      shieldedCategoryCount: state.shieldedCategoryCount,
    });
  }, []);

  useEffect(() => { refresh(); }, []);

  const handleGranted = useCallback(async () => {
    await refresh();
    // Auto-enable adult content blocking right after authorization
    await ScreenTime.setAdultContentBlocked(true);
    await refresh();
  }, [refresh]);

  const toggleAdultBlock = useCallback(async (on: boolean) => {
    setLoading(true);
    try {
      await ScreenTime.setAdultContentBlocked(on);
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const openAppPicker = useCallback(async () => {
    const result = await ScreenTime.presentAppPicker();
    if (result.success) await refresh();
  }, [refresh]);

  const clearShield = useCallback(async () => {
    Alert.alert(
      'Remove App Shield?',
      'All shielded app restrictions will be lifted immediately.',
      [
        { text: 'Remove', style: 'destructive', onPress: async () => {
          await ScreenTime.clearAppShield();
          await refresh();
        }},
        { text: 'Keep', style: 'cancel' },
      ]
    );
  }, [refresh]);

  // Show permission gate until authorized
  if (screenTimeAuthStatus === 'notDetermined' || screenTimeAuthStatus === 'unknown') {
    return <PermissionGate onGranted={handleGranted}/>;
  }

  const authorized = screenTimeAuthStatus === 'approved';
  const denied     = screenTimeAuthStatus === 'denied';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <LinearGradient
        colors={['#1A0B2E', '#200D38']}
        style={[s.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>COVENANT SHIELD</Text>
          <Text style={s.title}>Blocker</Text>
        </View>
        <View style={[s.statusBadge, { borderColor: authorized ? Colors.goldBorder : Colors.border }]}>
          <View style={[s.statusDot, { backgroundColor: authorized ? Colors.success : Colors.crimson }]}/>
          <Text style={[s.statusText, { color: authorized ? Colors.success : Colors.white3 }]}>
            {authorized ? 'Active' : denied ? 'Denied' : 'Inactive'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Denied state */}
        {denied && (
          <View style={s.deniedCard}>
            <Text style={s.deniedTitle}>Screen Time Access Denied</Text>
            <Text style={s.deniedBody}>
              Go to Settings → Screen Time → enable Screen Time, then allow LustLock under "Always Allowed" or re-run setup.
            </Text>
          </View>
        )}

        {/* Adult content block row */}
        <View style={s.sectionLabel}>
          <GlobeIcon color={Colors.white3}/>
          <Text style={s.sectionLabelText}>WEB CONTENT</Text>
        </View>
        <View style={[s.card, adultContentBlocked && s.cardActive]}>
          <View style={s.cardLeft}>
            <View style={[s.iconBox, adultContentBlocked && s.iconBoxActive]}>
              <GlobeIcon color={adultContentBlocked ? Colors.gold : Colors.white3}/>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Block Adult Web Content</Text>
              <Text style={s.cardSub}>
                {adultContentBlocked
                  ? 'Adult sites blocked via Screen Time'
                  : 'Enable to restrict all adult websites in Safari'}
              </Text>
            </View>
          </View>
          {loading
            ? <ActivityIndicator color={Colors.gold} size="small"/>
            : <Toggle on={adultContentBlocked} onToggle={() => toggleAdultBlock(!adultContentBlocked)}/>
          }
        </View>
        {adultContentBlocked && (
          <View style={s.activeRow}>
            <CheckCircle color={Colors.success}/>
            <Text style={s.activeText}>Active — blocking all web content in Safari</Text>
          </View>
        )}

        {/* App shield section */}
        <View style={[s.sectionLabel, { marginTop: 24 }]}>
          <PhoneIcon color={Colors.white3}/>
          <Text style={s.sectionLabelText}>APP SHIELD</Text>
        </View>

        <View style={[s.card, appShieldEnabled && s.cardActive]}>
          <View style={s.cardLeft}>
            <View style={[s.iconBox, appShieldEnabled && s.iconBoxActive]}>
              <ShieldIcon size={16} color={appShieldEnabled ? Colors.gold : Colors.white3}/>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Shielded Apps</Text>
              <Text style={s.cardSub}>
                {appShieldEnabled && shieldedAppCount > 0
                  ? `${shieldedAppCount} app${shieldedAppCount !== 1 ? 's' : ''} shielded`
                  : 'No apps selected — tap Manage to choose'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={openAppPicker} style={s.manageBtn} activeOpacity={0.75}>
            <Text style={s.manageBtnText}>MANAGE</Text>
          </TouchableOpacity>
        </View>

        {appShieldEnabled && (
          <View style={s.activeRow}>
            <CheckCircle color={Colors.success}/>
            <Text style={s.activeText}>
              {shieldedAppCount} app{shieldedAppCount !== 1 ? 's' : ''} will show a Screen Time intervention screen
            </Text>
          </View>
        )}

        {appShieldEnabled && (
          <TouchableOpacity onPress={clearShield} style={s.clearBtn} activeOpacity={0.75}>
            <Text style={s.clearBtnText}>REMOVE APP SHIELD</Text>
          </TouchableOpacity>
        )}

        {/* How it works */}
        <View style={[s.sectionLabel, { marginTop: 28 }]}>
          <LockIcon color={Colors.white3}/>
          <Text style={s.sectionLabelText}>HOW IT WORKS</Text>
        </View>
        <View style={s.infoCard}>
          {[
            ['🔐', 'OS-Level Enforcement', 'Restrictions live inside iOS itself — not inside this app. They remain active even if LustLock is closed.'],
            ['🌐', 'Web Content Filter', 'When enabled, Safari will block all web browsing. Works in conjunction with your DNS shield for maximum coverage.'],
            ['🛡', 'App Shield', 'Shielded apps show an intervention screen when opened, giving you a moment to choose differently.'],
          ].map(([emoji, title, body]) => (
            <View key={title} style={s.infoRow}>
              <Text style={s.infoEmoji}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.infoTitle}>{title}</Text>
                <Text style={s.infoBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  eyebrow: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 3,
    color: Colors.gold, opacity: 0.7, marginBottom: 2,
  },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1, color: Colors.white },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 1 },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabelText: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 2, color: Colors.white3,
  },

  card: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 8,
  },
  cardActive: { borderColor: Colors.goldBorder, backgroundColor: 'rgba(45,27,68,0.95)' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: Colors.goldDim },
  cardTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 12, letterSpacing: 0.3, color: Colors.white },
  cardSub: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, marginTop: 2 },

  activeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 4, paddingHorizontal: 4,
  },
  activeText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.success, flex: 1 },

  manageBtn: {
    borderWidth: 1, borderColor: Colors.goldBorder, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.goldDim,
  },
  manageBtnText: { fontFamily: 'Cinzel_700Bold', fontSize: 8, letterSpacing: 1.5, color: Colors.gold },

  clearBtn: {
    borderWidth: 1, borderColor: 'rgba(192,57,43,0.35)', borderRadius: 999,
    paddingVertical: 10, alignItems: 'center', marginTop: 6, marginBottom: 4,
  },
  clearBtnText: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.crimson,
  },

  deniedCard: {
    backgroundColor: 'rgba(192,57,43,0.10)', borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.30)', borderRadius: 16, padding: 16, marginBottom: 20,
  },
  deniedTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 13, color: Colors.crimson, marginBottom: 6 },
  deniedBody: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white2, lineHeight: 20 },

  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 16,
  },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoEmoji: { fontSize: 18, marginTop: 1 },
  infoTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11, letterSpacing: 0.3, color: Colors.white, marginBottom: 3 },
  infoBody: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white3, lineHeight: 19 },
});
