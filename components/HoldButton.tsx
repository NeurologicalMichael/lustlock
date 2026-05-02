import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const HOLD_DURATION = 30000;

interface HoldButtonProps {
  onComplete: () => void;
}

export function HoldButton({ onComplete }: HoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [failed, setFailed] = useState(false);
  const progress = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
  };

  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const animatedBorderProps = useAnimatedProps(() => ({
    stroke:
      progress.value > 0
        ? Colors.gold
        : Colors.crimson,
  }));

  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    setFailed(false);
    setTimeLeft(30);
    startTimeRef.current = Date.now();
    progress.value = withTiming(1, {
      duration: HOLD_DURATION,
      easing: Easing.linear,
    });

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);
      if (elapsed >= HOLD_DURATION) {
        clearTimers();
        onComplete();
      }
    }, 250);

    hapticIntervalRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 5000);
  }, [onComplete]);

  const handlePressOut = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < HOLD_DURATION) {
      setIsHolding(false);
      setFailed(true);
      setTimeLeft(30);
      clearTimers();
      progress.value = withTiming(0, { duration: 400 });
    }
  }, []);

  useEffect(() => () => clearTimers(), []);

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.buttonOuter}
      >
        <Svg width={190} height={190} style={StyleSheet.absoluteFill}>
          {/* Background ring */}
          <Circle
            cx={95}
            cy={95}
            r={RADIUS}
            fill="transparent"
            stroke={Colors.crimson}
            strokeWidth={4}
            opacity={0.4}
          />
          {/* Progress ring */}
          <AnimatedCircle
            cx={95}
            cy={95}
            r={RADIUS}
            fill="transparent"
            stroke={Colors.gold}
            strokeWidth={4}
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedRingProps}
            strokeLinecap="round"
            rotation="-90"
            origin="95, 95"
          />
        </Svg>
        <View style={styles.innerCircle}>
          <Text style={styles.cross}>✝</Text>
          <Text style={styles.holdLabel}>HOLD TO PRAY</Text>
          <Text style={styles.timer}>
            0:{timeLeft.toString().padStart(2, '0')}
          </Text>
        </View>
      </Pressable>
      {failed && (
        <Text style={styles.failText}>
          Stay with it. You're stronger than this.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  buttonOuter: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(122,26,26,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.crimson,
  },
  cross: {
    fontSize: 40,
    color: Colors.white,
    fontFamily: 'Cinzel_700Bold',
  },
  holdLabel: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 11,
    letterSpacing: 3,
    color: Colors.white3,
    marginTop: 6,
  },
  timer: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 18,
    color: Colors.white,
    marginTop: 4,
  },
  failText: {
    fontFamily: 'CrimsonPro_400Regular_Italic',
    fontSize: 14,
    color: Colors.white3,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
