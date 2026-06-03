import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/colors';

function ShieldIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5v6c0 5.5 3.75 10.15 8 11.4C16.25 21.15 20 16.5 20 11V5L12 2z"
        stroke={Colors.gold}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <Path d="M8.5 12.5l2.2 2.2 4.8-5" stroke={Colors.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function BlockedScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.iconWrap}>
        <ShieldIcon/>
      </View>

      <Text style={styles.eyebrow}>Protected Moment</Text>
      <Text style={styles.title}>Hold the Line</Text>
      <Text style={styles.body}>
        This app or website is blocked because you chose freedom before this moment arrived.
      </Text>

      <View style={styles.quoteCard}>
        <Text style={styles.quote}>
          "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest."
        </Text>
        <Text style={styles.ref}>Joshua 1:9 KJV</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtn} onPress={() => router.push('/emergency')}>
          <Text style={styles.primaryText}>Breathe Through This</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/prayer')}>
          <Text style={styles.secondaryText}>Open Prayer</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.75} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  eyebrow: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 10,
    letterSpacing: 3,
    color: Colors.gold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 30,
    letterSpacing: 1,
    color: Colors.white,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 16,
    color: Colors.white2,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 320,
  },
  quoteCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    padding: 22,
    marginTop: 30,
  },
  quote: {
    fontFamily: 'CrimsonPro_400Regular_Italic',
    fontSize: 18,
    lineHeight: 29,
    color: Colors.white,
    textAlign: 'center',
  },
  ref: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.gold,
    textAlign: 'center',
    marginTop: 16,
  },
  actions: { width: '100%', marginTop: 28, gap: 12 },
  primaryBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#0A0520',
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.gold,
    textTransform: 'uppercase',
  },
  backText: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 14,
    color: Colors.white3,
    textAlign: 'center',
    marginTop: 2,
  },
});
