import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppStore } from '../../store/useAppStore';
import { ShieldoComponent, getTierFromDays } from '../../components/Shieldo';
import { Card, Bar, Dot, GoldBtn, CrimsonBtn, BFIcon, Eyebrow, GlassCard } from '../../components/UI';
import { ProgressCalendar } from '../../components/ProgressCalendar';
import { BATTLEFIELD_DEFS } from '../../constants/battlefields';
import { Colors } from '../../constants/colors';

const TRIGGER_OPTIONS = ['Late Night', 'Stress', 'Boredom', 'Pride', 'Phone in Bed', 'Loneliness', 'Idle Time', 'Other'];

function ShieldIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L4 7v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V7L12 3z"
        fill="rgba(255,215,0,0.20)" stroke={Colors.gold} strokeWidth="1.6" strokeLinejoin="round"/>
    </Svg>
  );
}

function SettingsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={Colors.white3} strokeWidth="1.5"/>
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={Colors.white3} strokeWidth="1.5"/>
    </Svg>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    battlefields, activeBattlefieldKeys, globalStreakDays, longestGlobalStreak,
    computeStreaks, logRelapse,
  } = useAppStore();

  const [relapseModal, setRelapseModal] = useState<string | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);

  useEffect(() => { computeStreaks(); }, []);

  const openRelapse = (bfKey: string) => {
    setSelectedTriggers([]);
    setRelapseModal(bfKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const confirmRelapse = () => {
    if (!relapseModal) return;
    logRelapse(relapseModal, selectedTriggers, new Date().getHours());
    setRelapseModal(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const toggleTrigger = (t: string) =>
    setSelectedTriggers(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  // Compute completed dates from current streak
  const completedDates = useMemo(() => {
    const dates: string[] = [];
    const now = Date.now();
    for (let i = 1; i <= globalStreakDays; i++) {
      const d = new Date(now - i * 86400000);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [globalStreakDays]);

  const shieldState = getTierFromDays(globalStreakDays);
  const activeBFs = battlefields.filter(bf => activeBattlefieldKeys.includes(bf.key));
  const cleanCount = activeBFs.filter(bf => bf.streakDays > 0 || bf.streakStart).length;
  const NEXT_MILESTONE = [7, 14, 30, 60, 90].find(m => m > globalStreakDays) ?? 90;
  const progress = Math.min(1, globalStreakDays / NEXT_MILESTONE);

  // Glow intensity increases with streak — visual reward
  const glowIntensity = Math.min(1, globalStreakDays / 30);
  const dynamicGoldGlow = `rgba(255,215,0,${0.08 + glowIntensity * 0.22})`;
  const dynamicBorderGlow = `rgba(255,215,0,${0.20 + glowIntensity * 0.30})`;

  return (
    <View style={{ flex: 1 }}>
      {/* Deep twilight background gradient */}
      <LinearGradient
        colors={['#1A0B2E', '#200D38', '#1A0B2E']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}><ShieldIcon /></View>
          <Text style={styles.logo}>LUSTLOCK</Text>
          <TouchableOpacity activeOpacity={0.75} style={styles.headerIconWrap} onPress={() => router.push('/(tabs)/profile')}>
            <SettingsIcon />
          </TouchableOpacity>
        </View>

        {/* ── Hero Card (glass) ────────────────────────────── */}
        <View style={styles.section}>
          <GlassCard style={{ borderColor: dynamicBorderGlow, borderWidth: 1 }} padding={22}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Eyebrow color={Colors.lavender}>Current Streak</Eyebrow>
                <View style={styles.bigNumRow}>
                  <Text style={[styles.bigNum, {
                    textShadowColor: `rgba(255,215,0,${0.20 + glowIntensity * 0.40})`,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 12,
                  }]}>
                    {globalStreakDays}
                  </Text>
                  <Text style={styles.daysLabel}>DAYS</Text>
                </View>
                <Text style={styles.heroSub}>Clean across all areas</Text>
              </View>
              <ShieldoComponent state={shieldState} size={76} showLabel={false} />
            </View>

            {/* Progress to next milestone */}
            <View style={{ marginTop: 18 }}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress to {NEXT_MILESTONE} days</Text>
                <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
              </View>
              <Bar value={progress} height={7} />
            </View>

            {/* Quick stats row */}
            <View style={styles.heroStats}>
              {[
                ['Best', `${longestGlobalStreak}d`],
                ['Areas', `${cleanCount}/${activeBFs.length}`],
                ['Target', `${NEXT_MILESTONE}d`],
              ].map(([label, val]) => (
                <View key={label} style={styles.heroStatItem}>
                  <Text style={styles.heroStatVal}>{val}</Text>
                  <Text style={styles.heroStatLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* ── Progress Calendar ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>30-Day Progress</Text>
          <View style={{ height: 10 }} />
          <ProgressCalendar
            completedDates={completedDates}
            streakDays={globalStreakDays}
            targetDays={30}
          />
        </View>

        {/* ── Focus Areas ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
            <Text style={styles.sectionMeta}>{cleanCount}/{activeBFs.length} clean today</Text>
          </View>
          <View style={{ gap: 8 }}>
            {activeBFs.map(bf => {
              const def = BATTLEFIELD_DEFS.find(d => d.key === bf.key);
              const isClean = bf.streakDays > 0;
              const lastRelapse = bf.relapses[0]
                ? (() => {
                    const d = Math.floor((Date.now() - new Date(bf.relapses[0].date).getTime()) / 86400000);
                    return d === 0 ? 'Today' : `${d} day${d !== 1 ? 's' : ''} ago`;
                  })()
                : 'No relapses logged';
              return (
                <GlassCard
                  key={bf.key}
                  padding={14}
                  style={{
                    borderWidth: 1,
                    borderColor: isClean ? dynamicBorderGlow : 'rgba(192,57,43,0.25)',
                  }}
                >
                  <View style={styles.bfRow}>
                    <View style={[styles.bfIconBox, {
                      backgroundColor: isClean ? dynamicGoldGlow : 'rgba(192,57,43,0.12)',
                    }]}>
                      <BFIcon type={def?.iconType ?? 'pride'} size={18} color={isClean ? Colors.gold : Colors.crimson} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bfName}>{bf.name}</Text>
                      <Text style={styles.bfSub}>{lastRelapse}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.bfStreak, {
                        color: isClean ? Colors.gold : Colors.crimson,
                        textShadowColor: isClean ? `rgba(255,215,0,${glowIntensity * 0.5})` : 'transparent',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: isClean ? 8 : 0,
                      }]}>
                        {bf.streakDays}
                      </Text>
                      <Text style={styles.bfDays}>DAYS</Text>
                    </View>
                    <Dot color={isClean ? Colors.success : Colors.crimson} size={7} />
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => openRelapse(bf.key)}
                    style={styles.relapseBtn}
                  >
                    <Text style={styles.relapseBtnText}>LOG RELAPSE</Text>
                  </TouchableOpacity>
                </GlassCard>
              );
            })}
          </View>
        </View>

        {/* ── Covenant Shield Banner ───────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/shield')}
          >
            <GlassCard padding={14} style={{ borderWidth: 1, borderColor: Colors.goldBorder }}>
              <View style={styles.shieldBannerInner}>
                <View style={styles.shieldBannerLeft}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 3L4 7v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V7L12 3z"
                      fill="rgba(255,215,0,0.15)" stroke={Colors.gold} strokeWidth="1.8" strokeLinejoin="round"/>
                  </Svg>
                  <View>
                    <Text style={styles.shieldBannerTitle}>Covenant Shield</Text>
                    <Text style={styles.shieldBannerSub}>Block porn sites & social media</Text>
                  </View>
                </View>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* ── CTAs ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <CrimsonBtn onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/emergency');
          }}>I Need Help Right Now</CrimsonBtn>
          <View style={{ height: 10 }} />
          <GoldBtn outline onPress={() => router.push('/devotional')}>
            Today's Reflection →
          </GoldBtn>
        </View>
      </ScrollView>

      {/* ── Relapse Modal ──────────────────────────────────── */}
      <Modal
        visible={!!relapseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRelapseModal(null)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setRelapseModal(null)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
          {/* Gold top accent */}
          <LinearGradient
            colors={['rgba(192,57,43,0.8)', 'rgba(192,57,43,0.2)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalTopBar}
          />
          <Text style={styles.modalTitle}>Log a Relapse</Text>
          <Text style={styles.modalSub}>Shame is the enemy of progress. Logging this takes courage.</Text>
          <Text style={styles.triggerLabel}>WHAT TRIGGERED IT?</Text>
          <View style={styles.triggerWrap}>
            {TRIGGER_OPTIONS.map(t => {
              const on = selectedTriggers.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.75}
                  onPress={() => toggleTrigger(t)}
                  style={[styles.triggerChip, on && styles.triggerChipOn]}
                >
                  <Text style={[styles.triggerChipText, on && styles.triggerChipTextOn]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <CrimsonBtn onPress={confirmRelapse}>Confirm & Reset Streak</CrimsonBtn>
          <View style={{ height: 10 }} />
          <GoldBtn outline onPress={() => setRelapseModal(null)}>Cancel</GoldBtn>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  logo: {
    fontFamily: 'CinzelDecorative_900Black',
    fontSize: 19, letterSpacing: 3, color: Colors.gold,
    textShadowColor: 'rgba(255,215,0,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 12,
    letterSpacing: 1, color: Colors.lavender,
  },
  sectionMeta: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3,
  },

  // Hero card
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  bigNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 6 },
  bigNum: {
    fontFamily: 'CinzelDecorative_700Bold',
    fontSize: 80, lineHeight: 80, color: Colors.gold,
  },
  daysLabel: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 14,
    letterSpacing: 2, color: Colors.white3, paddingBottom: 8,
  },
  heroSub: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white3,
  },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7,
  },
  progressLabel: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3,
  },
  progressPct: {
    fontFamily: 'Cinzel_700Bold', fontSize: 11, letterSpacing: 1, color: Colors.gold,
  },
  heroStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  heroStatItem: { alignItems: 'center' },
  heroStatVal: {
    fontFamily: 'Cinzel_700Bold', fontSize: 16, color: Colors.gold, letterSpacing: 0.5,
  },
  heroStatLabel: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 2,
    color: Colors.lavender, opacity: 0.65, marginTop: 2,
  },

  // Focus area rows
  bfRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bfIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bfName: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 12, letterSpacing: 1, color: Colors.white,
  },
  bfSub: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, marginTop: 1,
  },
  bfStreak: {
    fontFamily: 'CinzelDecorative_700Bold', fontSize: 24,
  },
  bfDays: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 7, letterSpacing: 1, color: Colors.white3,
  },
  relapseBtn: {
    marginTop: 10, borderTopWidth: 1,
    borderTopColor: 'rgba(192,57,43,0.12)',
    paddingTop: 8, alignItems: 'center',
  },
  relapseBtnText: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 8,
    letterSpacing: 2, color: 'rgba(192,57,43,0.50)',
  },

  // Shield banner
  shieldBannerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  shieldBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldBannerTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 13, letterSpacing: 0.5, color: Colors.gold,
  },
  shieldBannerSub: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, marginTop: 1,
  },
  arrowText: {
    fontFamily: 'Cinzel_700Bold', fontSize: 16, color: Colors.gold,
  },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6,2,16,0.75)' },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#2D1B44',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1, borderColor: 'rgba(192,57,43,0.30)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5, shadowRadius: 20,
  },
  modalTopBar: { height: 3, borderRadius: 2, marginBottom: 20, width: 60 },
  modalTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 18,
    color: Colors.crimsonBright, letterSpacing: 1, marginBottom: 6,
  },
  modalSub: {
    fontFamily: 'CrimsonPro_400Regular_Italic', fontSize: 13,
    color: Colors.white3, marginBottom: 16, lineHeight: 20,
  },
  triggerLabel: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9,
    letterSpacing: 2, color: Colors.white3, marginBottom: 10,
  },
  triggerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  triggerChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.border,
  },
  triggerChipOn: {
    backgroundColor: 'rgba(192,57,43,0.14)',
    borderColor: 'rgba(192,57,43,0.50)',
  },
  triggerChipText: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3,
  },
  triggerChipTextOn: { color: Colors.crimsonBright },
});
