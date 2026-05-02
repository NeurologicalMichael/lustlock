import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useDerivedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface StreakCounterProps {
  value: number;
}

export function StreakCounter({ value }: StreakCounterProps) {
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = 0;
    animValue.value = withTiming(value, {
      duration: 1200,
      easing: Easing.out(Easing.quad),
    });
  }, [value]);

  const displayedText = useDerivedValue(() =>
    String(Math.floor(animValue.value))
  );

  return (
    <View style={styles.wrapper}>
      {/* Glow blob behind number */}
      <View style={styles.glow} />
      <Animated.Text style={[Typography.streakNumber, styles.number]}>
        {String(value)}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.goldGlow2,
  },
  number: {
    minWidth: 120,
    textAlign: 'center',
    zIndex: 1,
  },
});
