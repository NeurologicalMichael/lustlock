import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path, Line, Ellipse, Circle, Defs, LinearGradient, Stop, ClipPath, G,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ShieldoState = 'stone' | 'wood' | 'iron' | 'gold' | 'angelic';

const SHIELD_PATH = 'M 12,10 L 88,10 Q 94,10 94,18 L 94,72 Q 94,96 50,118 Q 6,96 6,72 L 6,18 Q 6,10 12,10 Z';

interface ShieldoCfg {
  fill: string; rim: string; hi: string;
  eyeC: string; pupil: string;
  mood: 'sad' | 'hopeful' | 'firm' | 'proud' | 'divine';
  crack: boolean; glow: boolean; halo: boolean;
}

const CONFIGS: Record<ShieldoState, ShieldoCfg> = {
  stone:   { fill:'#4A4A4A', rim:'#333', hi:'#666', eyeC:'#222', pupil:'#111', mood:'sad',    crack:true,  glow:false, halo:false },
  wood:    { fill:'#6B3E1E', rim:'#4A2A10', hi:'#8B5E2A', eyeC:'#3A1A05', pupil:'#1A0A02', mood:'hopeful', crack:false, glow:false, halo:false },
  iron:    { fill:'#2C3340', rim:'#1A1E28', hi:'#4A5468', eyeC:'#7A9AB0', pupil:'#1A2030', mood:'firm',   crack:false, glow:false, halo:false },
  gold:    { fill:'#C9A020', rim:'#8B6A10', hi:'#F5D050', eyeC:'#7A1010', pupil:'#3A0808', mood:'proud',  crack:false, glow:true,  halo:false },
  angelic: { fill:'#F0EDE8', rim:'#C9A020', hi:'#FFFFFF', eyeC:'#C9A020', pupil:'#8B6A10', mood:'divine', crack:false, glow:true,  halo:true  },
};

const STATE_LABELS: Record<ShieldoState, string> = {
  stone:   'Cracked Stone',
  wood:    'Rough Wood',
  iron:    'Iron Guardian',
  gold:    'Golden Knight',
  angelic: 'Angelic Warrior',
};

export function getTierFromDays(days: number): ShieldoState {
  if (days >= 90) return 'angelic';
  if (days >= 30) return 'gold';
  if (days >= 14) return 'iron';
  if (days >= 7) return 'wood';
  return 'stone';
}

function ShieldoSvg({ state, size }: { state: ShieldoState; size: number }) {
  const cfg = CONFIGS[state];
  const h = size * 1.24;
  const gradId = `sg${state}`;
  const clipId = `sc${state}`;

  const pulseOpacity = useSharedValue(0.3);
  useEffect(() => {
    if (state === 'angelic') {
      pulseOpacity.value = withRepeat(
        withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1, true
      );
    }
  }, [state]);
  const animProps = useAnimatedProps(() => ({ opacity: pulseOpacity.value }));

  // Brow paths by mood
  const Brows = () => {
    switch (cfg.mood) {
      case 'sad':
        return (<G>
          <Line x1="29" y1="48" x2="41" y2="51" stroke={cfg.rim} strokeWidth="2.2" strokeLinecap="round"/>
          <Line x1="59" y1="51" x2="71" y2="48" stroke={cfg.rim} strokeWidth="2.2" strokeLinecap="round"/>
        </G>);
      case 'hopeful':
        return (<G>
          <Path d="M28,46 Q35,42 42,46" stroke={cfg.hi} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <Path d="M58,46 Q65,42 72,46" stroke={cfg.hi} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        </G>);
      case 'firm':
        return (<G>
          <Line x1="27" y1="48" x2="43" y2="48" stroke={cfg.hi} strokeWidth="2.5" strokeLinecap="round"/>
          <Line x1="57" y1="48" x2="73" y2="48" stroke={cfg.hi} strokeWidth="2.5" strokeLinecap="round"/>
        </G>);
      case 'proud':
        return (<G>
          <Path d="M27,44 Q35,40 43,44" stroke={cfg.rim} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <Path d="M57,44 Q65,40 73,44" stroke={cfg.rim} strokeWidth="2" fill="none" strokeLinecap="round"/>
        </G>);
      case 'divine':
        return (<G>
          <Path d="M26,43 Q35,38 44,43" stroke={cfg.hi} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <Path d="M56,43 Q65,38 74,43" stroke={cfg.hi} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </G>);
    }
  };

  const Eyes = () => {
    switch (cfg.mood) {
      case 'sad':
        return (<G>
          <Ellipse cx="35" cy="57" rx="7" ry="6" fill={cfg.eyeC}/>
          <Ellipse cx="65" cy="57" rx="7" ry="6" fill={cfg.eyeC}/>
          <Ellipse cx="35" cy="58" rx="3.5" ry="3" fill={cfg.pupil}/>
          <Ellipse cx="65" cy="58" rx="3.5" ry="3" fill={cfg.pupil}/>
        </G>);
      case 'hopeful':
        return (<G>
          <Ellipse cx="35" cy="55" rx="7" ry="7.5" fill={cfg.eyeC}/>
          <Ellipse cx="65" cy="55" rx="7" ry="7.5" fill={cfg.eyeC}/>
          <Ellipse cx="35" cy="55" rx="4" ry="4.5" fill={cfg.pupil}/>
          <Ellipse cx="65" cy="55" rx="4" ry="4.5" fill={cfg.pupil}/>
        </G>);
      case 'firm':
        return (<G>
          <Ellipse cx="35" cy="55" rx="7" ry="4.5" fill={cfg.eyeC}/>
          <Ellipse cx="65" cy="55" rx="7" ry="4.5" fill={cfg.eyeC}/>
          <Ellipse cx="35" cy="55.5" rx="4" ry="2.5" fill={cfg.pupil}/>
          <Ellipse cx="65" cy="55.5" rx="4" ry="2.5" fill={cfg.pupil}/>
        </G>);
      case 'proud':
        return (<G>
          <Circle cx="35" cy="54" r="8" fill={cfg.eyeC}/>
          <Circle cx="65" cy="54" r="8" fill={cfg.eyeC}/>
          <Circle cx="35" cy="54" r="4.5" fill={cfg.pupil}/>
          <Circle cx="65" cy="54" r="4.5" fill={cfg.pupil}/>
          <Circle cx="38" cy="51" r="1.5" fill="rgba(255,255,255,0.8)"/>
          <Circle cx="68" cy="51" r="1.5" fill="rgba(255,255,255,0.8)"/>
        </G>);
      case 'divine':
        return (<G>
          <Circle cx="35" cy="54" r="9" fill={cfg.eyeC} opacity={0.25}/>
          <Circle cx="65" cy="54" r="9" fill={cfg.eyeC} opacity={0.25}/>
          <Circle cx="35" cy="54" r="5" fill={cfg.eyeC}/>
          <Circle cx="65" cy="54" r="5" fill={cfg.eyeC}/>
          <Circle cx="35" cy="54" r="2" fill="#FFF8E0"/>
          <Circle cx="65" cy="54" r="2" fill="#FFF8E0"/>
        </G>);
    }
  };

  const Mouth = () => {
    switch (cfg.mood) {
      case 'sad':
        return <Path d="M38,80 Q50,74 62,80" stroke={cfg.rim} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
      case 'hopeful':
        return <Path d="M38,78 Q50,84 62,78" stroke={cfg.hi} strokeWidth="2" fill="none" strokeLinecap="round"/>;
      case 'firm':
        return <Line x1="38" y1="78" x2="62" y2="78" stroke={cfg.hi} strokeWidth="2.5" strokeLinecap="round"/>;
      case 'proud':
        return <Path d="M36,77 Q50,88 64,77" stroke={cfg.rim} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
      case 'divine':
        return <Path d="M38,77 Q50,84 62,77" stroke={cfg.eyeC} strokeWidth="1.5" fill="none" strokeLinecap="round"/>;
    }
  };

  return (
    <View style={{ width: size, height: h, alignItems: 'center' }}>
      {cfg.halo && (
        <Svg width={size * 0.7} height={size * 0.22} viewBox="0 0 70 22" style={{ marginBottom: -6 }}>
          <Ellipse cx="35" cy="11" rx="30" ry="8" fill="none" stroke={Colors.gold} strokeWidth="3" opacity={0.9}/>
        </Svg>
      )}
      {cfg.glow && state === 'angelic' && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          animatedProps={animProps as any}
        />
      )}
      <Svg width={size} height={h} viewBox="0 0 100 124">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={cfg.hi} stopOpacity={0.5}/>
            <Stop offset="55%" stopColor={cfg.fill}/>
            <Stop offset="100%" stopColor={cfg.rim} stopOpacity={0.9}/>
          </LinearGradient>
          <ClipPath id={clipId}>
            <Path d={SHIELD_PATH}/>
          </ClipPath>
        </Defs>

        <Path d={SHIELD_PATH} fill={`url(#${gradId})`} stroke={cfg.rim} strokeWidth="2"/>
        <Path d={SHIELD_PATH} fill="none" stroke={cfg.hi} strokeWidth="1.5" opacity={0.4}/>

        {cfg.crack && (
          <G clipPath={`url(#${clipId})`} stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" opacity={0.7}>
            <Path d="M30,20 L38,38 L34,55 L42,72"/>
            <Path d="M60,30 L65,50 L58,65"/>
          </G>
        )}

        {state !== 'stone' && (
          <G>
            <Line x1="50" y1="24" x2="50" y2="42" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round"/>
            <Line x1="42" y1="32" x2="58" y2="32" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round"/>
          </G>
        )}

        <Brows/>
        <Eyes/>
        <Mouth/>
      </Svg>
    </View>
  );
}

interface ShieldoProps {
  state?: ShieldoState;
  size?: number;
  showLabel?: boolean;
}

export function ShieldoComponent({ state = 'stone', size = 100, showLabel = true }: ShieldoProps) {
  return (
    <View style={styles.wrapper}>
      <ShieldoSvg state={state} size={size}/>
      {showLabel && (
        <View style={styles.labelBox}>
          <Text style={styles.name}>SHIELDO</Text>
          <Text style={styles.tier}>{STATE_LABELS[state]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  labelBox: { alignItems: 'center', marginTop: 6 },
  name: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.gold, textTransform: 'uppercase' },
  tier: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 1, color: Colors.white3, textTransform: 'uppercase', marginTop: 2 },
});
