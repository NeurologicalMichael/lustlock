import React, { useEffect, useRef } from 'react';
import {
  Animated, Easing, View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useAppStore } from '../../store/useAppStore';
import { Eyebrow } from '../../components/UI';
import { Colors } from '../../constants/colors';

function SettingsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={Colors.black} strokeWidth="1.5"/>
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={Colors.black} strokeWidth="1.5"/>
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L4 5v6c0 5.5 3.75 10.15 8 11.4C16.25 21.15 20 16.5 20 11V5L12 2z" stroke={Colors.black} strokeWidth="1.6" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { globalStreakDays, computeStreaks } = useAppStore();
  const helpPulse = useRef(new Animated.Value(1)).current;
  const quickPulse = useRef(new Animated.Value(0)).current;
  const profileSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => { computeStreaks(); }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(helpPulse, {
          toValue: 1.045,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(helpPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [helpPulse]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(quickPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(quickPulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [quickPulse]);

  const openEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/emergency');
  };

  const openProfile = () => {
    Haptics.selectionAsync();
    profileSlide.setValue(0);
    Animated.timing(profileSlide, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      router.push('/(tabs)/profile');
      profileSlide.setValue(0);
    });
  };

  const helpDiameter = Math.min(width - 56, Math.max(286, height * 0.37));
  const reflectionScale = quickPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018],
  });
  const logScale = quickPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1.018, 1],
  });
  const profileTranslateX = profileSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });
  const profileOpacity = profileSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  return (
    <Animated.View style={[styles.root, { opacity: profileOpacity, transform: [{ translateX: profileTranslateX }] }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.75} style={styles.headerIconWrap} onPress={openProfile}>
            <ShieldIcon/>
          </TouchableOpacity>
          <Text style={styles.logo}>LustLock</Text>
          <TouchableOpacity activeOpacity={0.75} style={styles.headerIconWrap} onPress={openProfile}>
            <SettingsIcon/>
          </TouchableOpacity>
        </View>

        <View style={styles.streakCard}>
          <Eyebrow color={Colors.black}>Current Streak</Eyebrow>
          <View style={styles.streakRow}>
            <Text style={styles.streakNum}>{globalStreakDays}</Text>
            <Text style={styles.streakLabel}>days</Text>
          </View>
        </View>

        <View style={[styles.centerPane, { minHeight: helpDiameter + 56 }]}>
          <Animated.View style={{ width: helpDiameter, height: helpDiameter, transform: [{ scale: helpPulse }] }}>
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.helpButton, { width: helpDiameter, height: helpDiameter, borderRadius: helpDiameter / 2 }]}
              onPress={openEmergency}
            >
              <Text style={styles.helpText}>I Need Help Now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.quickGrid}>
          <Animated.View style={{ transform: [{ scale: reflectionScale }] }}>
            <TouchableOpacity activeOpacity={0.75} style={styles.quickCard} onPress={() => router.push('/devotional')}>
              <Text style={styles.quickTitle}>Today's Reflection</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: logScale }] }}>
            <TouchableOpacity activeOpacity={0.75} style={styles.quickCard} onPress={() => router.push('/(tabs)/battle-log')}>
              <Text style={styles.quickTitle}>Open Log</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 22,
    letterSpacing: 1,
    color: Colors.black,
  },
  streakCard: {
    marginHorizontal: 18,
    marginTop: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    backgroundColor: Colors.card,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginTop: 4 },
  streakNum: {
    fontFamily: 'CinzelDecorative_700Bold',
    fontSize: 76,
    lineHeight: 82,
    color: Colors.gold,
  },
  streakLabel: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 17,
    letterSpacing: 2,
    color: Colors.black,
    textTransform: 'uppercase',
  },
  centerPane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  helpButton: {
    backgroundColor: '#111111',
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  helpText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 18,
    letterSpacing: 2,
    color: '#fff',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 27,
  },
  quickGrid: { paddingHorizontal: 18, gap: 10 },
  quickCard: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: 17,
  },
  quickTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
    color: Colors.white,
  },
});
