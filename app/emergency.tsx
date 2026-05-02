import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSpring, withSequence, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { HoldButton } from '../components/HoldButton';
import { ShieldoComponent, getTierFromDays } from '../components/Shieldo';
import { getRandomScripture, Scripture } from '../constants/scriptures';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/colors';
import { GoldBtn } from '../components/UI';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 12;

function Particle({ x, y, size, speed, delay }: { x: number; y: number; size: number; speed: number; delay: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: delay }),
        withTiming(0.2, { duration: speed * 0.3 }),
        withTiming(0, { duration: speed * 0.3 })
      ),
      -1, false
    );
    translateY.value = withRepeat(
      withTiming(-SCREEN_HEIGHT, { duration: speed, easing: Easing.linear }),
      -1, false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: x, top: y, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    size: Math.random() * 2 + 2,
    speed: Math.random() * 4000 + 6000,
    delay: Math.random() * 2000,
  }));
}

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const { globalStreakDays, incrementEmergency } = useAppStore();
  const shieldState = getTierFromDays(globalStreakDays);
  const [scripture] = useState<Scripture>(() => getRandomScripture());
  const [victory, setVictory] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const particles = useRef(generateParticles(NUM_PARTICLES)).current;

  const bgFlash = useSharedValue(0);
  const victoryScale = useSharedValue(0.5);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgFlash.value }));
  const victoryTextStyle = useAnimatedStyle(() => ({ transform: [{ scale: victoryScale.value }] }));

  const handleVictory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    incrementEmergency();
    setVictory(true);
    bgFlash.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
    victoryScale.value = withSpring(1, { damping: 8, stiffness: 150 });
  };

  if (victory) {
    return (
      <View style={styles.screen}>
        {[...particles, ...generateParticles(20)].map(p => (
          <Particle key={p.id + 'v'} {...p}/>
        ))}
        <Animated.View style={[styles.goldFlash, bgStyle]}/>
        <View style={[styles.victoryContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
          <Animated.Text style={[styles.battleWon, victoryTextStyle]}>
            BATTLE WON
          </Animated.Text>
          <ShieldoComponent state={shieldState} size={120} showLabel={false}/>
          <Text style={styles.logged}>This victory has been logged.</Text>
          <GoldBtn onPress={() => router.back()}>RETURN TO THE FORTRESS</GoldBtn>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {particles.map(p => <Particle key={p.id} {...p}/>)}
      <Animated.View style={[styles.goldFlash, bgStyle]}/>
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.topSection}>
          <Text style={styles.holdTheLine}>HOLD THE LINE</Text>
          <Text style={styles.scriptureVerse}>{scripture.verse}</Text>
          <Text style={styles.scriptureRef}>— {scripture.reference}</Text>
        </View>

        <View style={styles.centerSection}>
          <HoldButton onComplete={handleVictory}/>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity activeOpacity={0.75} onPress={() => setHelpModal(true)}>
            <Text style={styles.helpText}>I need additional help</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={helpModal} transparent animationType="slide" onRequestClose={() => setHelpModal(false)}>
        <TouchableOpacity style={styles.helpBackdrop} activeOpacity={1} onPress={() => setHelpModal(false)}/>
        <View style={[styles.helpSheet, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.helpTitle}>ADDITIONAL HELP</Text>
          <View style={styles.helpCard}>
            <Text style={styles.helpLabel}>ACCOUNTABILITY PARTNER</Text>
            <Text style={styles.helpBody}>
              Send your accountability partner a message. Let them know you need support right now.
            </Text>
            <TouchableOpacity activeOpacity={0.75} style={styles.helpBtn}>
              <Text style={styles.helpBtnText}>SEND MESSAGE</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.helpCard}>
            <Text style={styles.helpLabel}>CRISIS LINE</Text>
            <Text style={styles.helpBody}>
              Covenant Eyes Support: 1-877-479-1119{'\n'}
              SA Hotline: 1-800-770-4887
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.75} onPress={() => setHelpModal(false)} style={styles.closeBtnWrap}>
            <Text style={styles.closeBtn}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  particle: { position: 'absolute', backgroundColor: Colors.gold },
  goldFlash: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.gold, pointerEvents: 'none' },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  topSection: { alignItems: 'center' },
  holdTheLine: {
    fontFamily: 'Cinzel_700Bold', fontSize: 13, letterSpacing: 5,
    color: Colors.white3, marginBottom: 20,
  },
  scriptureVerse: {
    fontFamily: 'CrimsonPro_400Regular_Italic', fontSize: 20,
    color: Colors.white, textAlign: 'center', lineHeight: 32, paddingHorizontal: 12,
  },
  scriptureRef: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2,
    color: Colors.gold, marginTop: 12,
  },
  centerSection: { alignItems: 'center' },
  bottomSection: { alignItems: 'center' },
  helpText: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 13,
    color: Colors.white3, textDecorationLine: 'underline',
  },
  victoryContent: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'space-between' },
  battleWon: {
    fontFamily: 'CinzelDecorative_900Black', fontSize: 42,
    color: Colors.gold, textAlign: 'center',
    textShadowColor: Colors.gold, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  logged: { fontFamily: 'CrimsonPro_400Regular', fontSize: 15, color: Colors.white2 },
  helpBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  helpSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
  },
  helpTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 16, letterSpacing: 1,
    color: Colors.gold, marginBottom: 16,
  },
  helpCard: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  helpLabel: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2,
    color: Colors.white3, textTransform: 'uppercase', marginBottom: 6,
  },
  helpBody: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white2, lineHeight: 22,
  },
  helpBtn: {
    marginTop: 10, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 999, paddingVertical: 10, alignItems: 'center',
  },
  helpBtnText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, color: Colors.gold, letterSpacing: 2 },
  closeBtnWrap: { alignItems: 'center', marginTop: 8 },
  closeBtn: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, color: Colors.white3, letterSpacing: 2 },
});
