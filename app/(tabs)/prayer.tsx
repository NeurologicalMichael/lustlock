import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line } from 'react-native-svg';
import { Dot, Eyebrow } from '../../components/UI';
import { Colors } from '../../constants/colors';

const PROMPTS = [
  'I need prayer right now',
  'Give me a verse for strength',
  'Help me stay on track today',
  'I relapsed — what do I do?',
];

const REPLIES: Record<string, string> = {
  'I need prayer right now':
    "Lord, in this moment of struggle, we ask for clarity and strength. Let this temptation pass without taking root. You are not alone in this — I'm praying with you right now.\n\n\"I can do all things through Christ who strengthens me.\" — Philippians 4:13",
  'Give me a verse for strength':
    "Here's one that carries real weight:\n\n\"No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.\"\n— 1 Corinthians 10:13\n\nYou were made to outlast this moment.",
  'Help me stay on track today':
    "Let's make today simple. One decision at a time. When the urge comes — pause, breathe, open this app. You don't have to white-knuckle it alone. What's your biggest risk point today?",
  'I relapsed — what do I do?':
    "First — you came here. That matters more than you know. A relapse isn't the end, it's data. Log it honestly, reset if needed, and look at what led up to it. Shame is the enemy of progress. Let's talk through what happened.",
};

interface Message { from: 'ai' | 'user'; text: string; }

function AiAvatar() {
  return (
    <View style={styles.aiAvatar}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3c-4 0-7 3-7 7 0 2.5 1.2 4.7 3 6v3h8v-3c1.8-1.3 3-3.5 3-6 0-4-3-7-7-7z" stroke={Colors.gold} strokeWidth="1.5" strokeLinejoin="round"/>
      </Svg>
    </View>
  );
}

function SendIcon({ active }: { active: boolean }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke={active ? '#000' : Colors.white3} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function PrayerScreen() {
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Message[]>([
    { from: 'ai', text: "Peace to you. I'm here whenever you need to talk, pray, or just process what's on your mind. What's going on today?" },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs(m => [...m, { from: 'user', text }]);
    setDraft('');
    setLoading(true);
    setTimeout(() => {
      const reply = REPLIES[text] ?? "I hear you. Tell me more about what's going on — the more specific you are, the better I can help.";
      setMsgs(m => [...m, { from: 'ai', text: reply }]);
      setLoading(false);
    }, 1100);
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [msgs, loading]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Eyebrow>AI Companion</Eyebrow>
        <Text style={styles.title}>Prayer Partner</Text>
        <View style={styles.statusRow}>
          <Dot color={Colors.success} size={6}/>
          <Text style={styles.statusText}>Always available · Private</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.msgList}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {msgs.map((m, i) =>
          m.from === 'ai' ? (
            <View key={i} style={styles.aiRow}>
              <AiAvatar/>
              <View style={styles.aiBubble}>
                <Text style={styles.aiText}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={i} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{m.text}</Text>
              </View>
            </View>
          )
        )}
        {loading && (
          <View style={styles.aiRow}>
            <AiAvatar/>
            <View style={[styles.aiBubble, { flexDirection: 'row', gap: 5, paddingVertical: 14 }]}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.typingDot, { opacity: 0.4 + i * 0.2 }]}/>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts */}
      {msgs.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptRow}
        >
          {PROMPTS.map(p => (
            <TouchableOpacity key={p} activeOpacity={0.75} onPress={() => send(p)} style={styles.promptChip}>
              <Text style={styles.promptText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => send(draft)}
          placeholder="Talk, pray, ask anything…"
          placeholderTextColor={Colors.white3}
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => send(draft)}
          style={[styles.sendBtn, { backgroundColor: draft.trim() ? Colors.gold : Colors.surfaceAlt }]}
        >
          <SendIcon active={!!draft.trim()}/>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 22, letterSpacing: 1, color: Colors.white, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3 },
  msgList: { flex: 1 },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15, flexShrink: 0,
    backgroundColor: 'rgba(240,112,32,0.12)',
    borderWidth: 1, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    borderRadius: 4, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16,
    padding: 12, maxWidth: '80%',
  },
  aiText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white, lineHeight: 22 },
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: 'rgba(240,112,32,0.10)',
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 16, borderTopRightRadius: 4,
    padding: 12, maxWidth: '80%',
  },
  userText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white, lineHeight: 22 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white3 },
  promptRow: { paddingHorizontal: 14, paddingBottom: 8, gap: 8 },
  promptChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border,
  },
  promptText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white3 },
  inputRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11,
    color: Colors.white, fontFamily: 'CrimsonPro_400Regular', fontSize: 13,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
