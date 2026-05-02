import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, Rect, Ellipse } from 'react-native-svg';
import { Colors } from '../constants/colors';

// ── GoldBtn ───────────────────────────────────────────────────────────────────
// Gold-to-orange gradient matching calendar success circles
interface GoldBtnProps {
  children: string;
  onPress?: () => void;
  outline?: boolean;
  sm?: boolean;
  disabled?: boolean;
}
export function GoldBtn({ children, onPress, outline = false, sm = false, disabled = false }: GoldBtnProps) {
  const height = sm ? 44 : 54;
  const fontSize = sm ? 11 : 13;
  if (outline) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        disabled={disabled}
        style={[styles.btnBase, {
          height, borderRadius: 999,
          borderWidth: 1.5, borderColor: disabled ? Colors.white3 : Colors.goldBorder,
          backgroundColor: 'transparent', opacity: disabled ? 0.4 : 1,
        }]}
      >
        <Text style={[styles.btnTextOutline, { fontSize }]}>{children}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.5 : 1 }}>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.btnBase, {
          height, borderRadius: 999,
          shadowColor: '#FFD700',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.40,
          shadowRadius: 14,
          elevation: 8,
        }]}
      >
        <Text style={[styles.btnTextPrimary, { fontSize }]}>{children}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── CrimsonBtn ────────────────────────────────────────────────────────────────
interface CrimsonBtnProps {
  children: string;
  onPress?: () => void;
  sm?: boolean;
}
export function CrimsonBtn({ children, onPress, sm = false }: CrimsonBtnProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.btnBase, {
        height: sm ? 44 : 54, borderRadius: 999,
        backgroundColor: Colors.crimson,
        shadowColor: Colors.crimson,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.40,
        shadowRadius: 14,
        elevation: 8,
      }]}
    >
      <Text style={[styles.btnTextDanger, { fontSize: sm ? 11 : 13 }]}>{children}</Text>
    </TouchableOpacity>
  );
}

// ── Card (Glassmorphism) ──────────────────────────────────────────────────────
// Frosted-glass feel: dark purple semi-transparent + subtle border + depth shadow
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  onPress?: () => void;
  glass?: boolean;
}
export function Card({ children, style, padding = 16, onPress, glass = false }: CardProps) {
  const inner = (
    <View style={[glass ? styles.cardGlass : styles.card, { padding }, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

// ── GlassCard ─────────────────────────────────────────────────────────────────
// Dedicated glassmorphism card component
export function GlassCard({ children, style, padding = 16 }: {
  children: React.ReactNode; style?: ViewStyle; padding?: number;
}) {
  return (
    <View style={[styles.cardGlass, { padding }, style]}>
      {children}
    </View>
  );
}

// ── Bar ───────────────────────────────────────────────────────────────────────
// Gold gradient progress bar on deep purple track
interface BarProps {
  value: number;
  height?: number;
  color?: string;
}
export function Bar({ value, height = 6, color = Colors.gold }: BarProps) {
  const pct = Math.max(0, Math.min(1, value));
  const isGold = color === Colors.gold;
  return (
    <View style={{
      height, backgroundColor: 'rgba(255,255,255,0.07)',
      borderRadius: 99, overflow: 'hidden',
      borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)',
    }}>
      <LinearGradient
        colors={isGold ? ['#FFD700', '#FFA500', '#FF8C00'] : [color, color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: '100%',
          width: `${pct * 100}%`,
          borderRadius: 99,
          shadowColor: isGold ? '#FFD700' : color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
        }}
      />
    </View>
  );
}

// ── Dot ───────────────────────────────────────────────────────────────────────
export function Dot({ color = Colors.success, size = 8 }: { color?: string; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: color,
      shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 5,
    }} />
  );
}

// ── Eyebrow ───────────────────────────────────────────────────────────────────
export function Eyebrow({ children, color = Colors.lavender }: { children: string; color?: string }) {
  return <Text style={[styles.eyebrow, { color, opacity: 0.7 }]}>{children}</Text>;
}

// ── BFIcon ────────────────────────────────────────────────────────────────────
type BFIconType = 'porn' | 'lust' | 'fantasy' | 'greed' | 'pride';
export function BFIcon({ type, size = 20, color = Colors.white3 }: { type: BFIconType; size?: number; color?: string }) {
  switch (type) {
    case 'porn':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="4" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
          <Line x1="9" y1="8" x2="15" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <Line x1="15" y1="8" x2="9" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </Svg>
      );
    case 'lust':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M2 12C4 7 8 4 12 4s8 3 10 8c-2 5-6 8-10 8S4 17 2 12z" stroke={color} strokeWidth="1.5"/>
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5"/>
        </Svg>
      );
    case 'fantasy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4c-4.4 0-7 2.7-7 6 0 1.8.8 3.3 2 4.4V17h10v-2.6c1.2-1.1 2-2.6 2-4.4 0-3.3-2.6-6-7-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
          <Line x1="9" y1="17" x2="9" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <Line x1="15" y1="17" x2="15" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <Line x1="9" y1="20" x2="15" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </Svg>
      );
    case 'greed':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Ellipse cx="12" cy="7" rx="7" ry="3" stroke={color} strokeWidth="1.5"/>
          <Path d="M5 7v4c0 1.66 3.13 3 7 3s7-1.34 7-3V7" stroke={color} strokeWidth="1.5"/>
          <Path d="M5 11v4c0 1.66 3.13 3 7 3s7-1.34 7-3v-4" stroke={color} strokeWidth="1.5"/>
        </Svg>
      );
    case 'pride':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 17L6 8L12 13L18 8L21 17H3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
          <Line x1="3" y1="20" x2="21" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </Svg>
      );
    default:
      return null;
  }
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[styles.toggleTrack, {
        backgroundColor: on ? 'rgba(255,215,0,0.20)' : Colors.surfaceAlt,
        borderColor: on ? Colors.gold : Colors.border,
      }]}
    >
      <View style={[styles.toggleThumb, {
        left: on ? 21 : 3,
        backgroundColor: on ? Colors.gold : Colors.white3,
        shadowColor: on ? Colors.gold : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: on ? 0.6 : 0,
        shadowRadius: on ? 5 : 0,
      }]} />
    </TouchableOpacity>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btnBase: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextPrimary: {
    fontFamily: 'Cinzel_700Bold',
    color: '#0A0520',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  btnTextOutline: {
    fontFamily: 'Cinzel_700Bold',
    color: Colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  btnTextDanger: {
    fontFamily: 'Cinzel_700Bold',
    color: Colors.white,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Standard card (solid dark purple)
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },

  // Glassmorphism card
  cardGlass: {
    backgroundColor: Colors.glassCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#7B4FBE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },

  eyebrow: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
