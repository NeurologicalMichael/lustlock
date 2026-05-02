import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { Card, Eyebrow } from '../components/UI';
import { Colors } from '../constants/colors';

const TODAY_SCRIPTURE = {
  verse: 'Flee from sexual immorality. Every other sin a person commits is outside the body, but the sexually immoral person sins against his own body. Or do you not know that your body is a temple of the Holy Spirit?',
  reference: '1 Corinthians 6:18-19',
};

const REFLECTION = [
  "Paul doesn't say \"resist\" sexual immorality. He says flee. The word in Greek is pheugo — to run, to escape, to put distance between yourself and the danger. Paul understood something modern neuroscience is just catching up to: you cannot white-knuckle your way out of temptation. You must move.",
  "Your body is not your own. This isn't shame — it's glory. You were bought at the highest price in the universe. The cross was the purchase. When you indulge what destroys you, you are burning down a temple. But when you fight — when you open this app at 2am instead of giving in — you are honoring that purchase.",
  "The battleground is always the mind before it's the body. Paul knew this too: \"Do not be conformed to this world, but be transformed by the renewal of your mind.\" The war room is between your ears. That is where today's battle is won or lost.",
  "You don't have to be strong today. You have to be obedient. Strength comes through the covenant, not before it. Show up. Open the Word. Run when you need to. That is faithfulness.",
];

const CHALLENGE =
  'Today, identify the one place or time of day where temptation is strongest for you. Write it down. Then build a concrete plan: what will you do instead when you are there, at that time? Specificity is armor.';

export default function DevotionalScreen() {
  const insets = useSafeAreaInsets();
  const { isPro } = useAppStore();
  const [complete, setComplete] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity activeOpacity={0.75} onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>THE FORTRESS</Text>
      </TouchableOpacity>

      <Eyebrow>{dateStr}</Eyebrow>
      <Text style={styles.pageTitle}>Daily Devotion</Text>

      {isPro && (
        <View style={styles.planRow}>
          <Text style={styles.planText}>Day 1 of 40: The Wilderness Plan</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '2.5%' }]}/>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>TODAY'S WORD</Text>

      <Card style={{ borderWidth: 1, borderColor: Colors.goldBorder, marginBottom: 28 }} padding={24}>
        <View style={styles.scriptureTopBorder}/>
        <Text style={styles.scriptureText}>{TODAY_SCRIPTURE.verse}</Text>
        <Text style={styles.scriptureRef}>{TODAY_SCRIPTURE.reference}</Text>
      </Card>

      <Text style={styles.sectionLabel}>REFLECTION</Text>
      {REFLECTION.map((para, i) => (
        <Text key={i} style={styles.reflectionText}>{para}</Text>
      ))}

      <Text style={[styles.sectionLabel, { marginTop: 8 }]}>TODAY'S CHALLENGE</Text>
      <Card style={{ borderLeftWidth: 2, borderLeftColor: Colors.gold, marginBottom: 28 }} padding={18}>
        <Text style={styles.challengeText}>{CHALLENGE}</Text>
      </Card>

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setComplete(true)}
        style={styles.completeBtn}
        disabled={complete}
      >
        <LinearGradient
          colors={complete ? ['rgba(240,112,32,0.15)', 'rgba(240,112,32,0.05)'] : ['#b84e0a', '#f07020']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.completeGradient}
        >
          <Text style={[styles.completeText, complete && { color: Colors.gold }]}>
            {complete ? '✝  COMPLETED' : '✝  MARK AS COMPLETE'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backArrow: { fontFamily: 'Cinzel_700Bold', fontSize: 16, color: Colors.gold },
  backText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2, color: Colors.white3 },
  pageTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1,
    color: Colors.white, marginTop: 4, marginBottom: 16,
  },
  planRow: { marginBottom: 20 },
  planText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white3, marginBottom: 8 },
  progressTrack: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  sectionLabel: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2,
    color: Colors.white3, textTransform: 'uppercase', marginBottom: 12,
  },
  scriptureTopBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.gold,
  },
  scriptureText: {
    fontFamily: 'CrimsonPro_400Regular_Italic', fontSize: 18,
    color: Colors.white, lineHeight: 30, textAlign: 'center', marginTop: 8,
  },
  scriptureRef: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2,
    color: Colors.gold, textAlign: 'center', marginTop: 12,
  },
  reflectionText: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 15,
    color: Colors.white2, lineHeight: 26, marginBottom: 16,
  },
  challengeText: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white2, lineHeight: 24,
  },
  completeBtn: { borderRadius: 999, overflow: 'hidden' },
  completeGradient: {
    height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 999,
  },
  completeText: {
    fontFamily: 'Cinzel_700Bold', fontSize: 14, color: Colors.black, letterSpacing: 1,
  },
});
