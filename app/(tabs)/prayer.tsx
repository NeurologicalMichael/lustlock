import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Dot, Eyebrow } from '../../components/UI';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

const DAILY_LIMIT = 5;
const USAGE_KEY = 'prayer_chat_usage';

const PROMPTS = [
  'I need prayer',
  'Verse for strength',
  'Stay on track today',
  'I relapsed',
];

interface Message { from: 'ai' | 'user'; text: string; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface UsageRecord { date: string; count: number; }

async function getUsage(): Promise<UsageRecord> {
  try {
    const raw = await AsyncStorage.getItem(USAGE_KEY);
    if (!raw) return { date: today(), count: 0 };
    const record: UsageRecord = JSON.parse(raw);
    if (record.date !== today()) return { date: today(), count: 0 };
    return record;
  } catch {
    return { date: today(), count: 0 };
  }
}

async function incrementUsage(current: UsageRecord): Promise<UsageRecord> {
  const updated = { date: today(), count: current.count + 1 };
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(updated));
  return updated;
}

async function saveUsage(record: UsageRecord): Promise<UsageRecord> {
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(record));
  return record;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localPrayerFallback(): string {
  return "I'm having trouble connecting to the prayer partner right now, but you're not alone. Take one slow breath, step away from the trigger, and pray this simply: Lord Jesus, give me strength for the next right choice. I will stay here with you while you reset.";
}

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
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<UsageRecord>({ date: today(), count: 0 });
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getUsage().then(setUsage);
  }, []);

  const remaining = Math.max(0, DAILY_LIMIT - usage.count);
  const limitReached = remaining === 0;

  const send = async (text: string) => {
    if (!text.trim() || loading || limitReached) return;

    const currentUsage = await getUsage();
    if (currentUsage.count >= DAILY_LIMIT) {
      setUsage(currentUsage);
      setMsgs(m => [...m, { from: 'ai', text: "You've used all 5 prayers for today. Rest in His peace — come back tomorrow and I'll be here." }]);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextHistory = [...history, userMsg];
    setMsgs(m => [...m, { from: 'user', text }]);
    setHistory(nextHistory);
    setDraft('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('prayer-chat', {
        body: { messages: nextHistory.slice(-12) },
      });

      if (data?.error === 'daily_limit_reached') {
        const updated = await saveUsage({ date: today(), count: DAILY_LIMIT });
        setUsage(updated);
        setMsgs(m => [...m, { from: 'ai', text: "You've used all 5 prayers for today. Rest in His peace — come back tomorrow and I'll be here." }]);
        return;
      }

      if (error || data?.error || !data?.reply) {
        console.warn('[Prayer] prayer-chat failed', error ?? data?.error);
        const fallback = localPrayerFallback();
        setMsgs(m => [...m, { from: 'ai', text: fallback }]);
        setHistory(h => [...h, { role: 'assistant', content: fallback }]);
        return;
      }

      const reply: string = data.reply;
      setMsgs(m => [...m, { from: 'ai', text: reply }]);
      setHistory(h => [...h, { role: 'assistant', content: reply }]);

      const updated = typeof data.remaining === 'number'
        ? await saveUsage({ date: today(), count: DAILY_LIMIT - data.remaining })
        : await incrementUsage(currentUsage);
      setUsage(updated);
    } catch {
      const fallback = localPrayerFallback();
      setMsgs(m => [...m, { from: 'ai', text: fallback }]);
      setHistory(h => [...h, { role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
    }
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

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: 8 }]}>
        {msgs.length <= 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptScroller}
            contentContainerStyle={styles.promptRow}
          >
            {PROMPTS.map(p => (
              <TouchableOpacity key={p} activeOpacity={0.75} onPress={() => send(p)} style={styles.promptChip}>
                <Text style={styles.promptText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {remaining <= 2 && (
          <Text style={styles.limitText}>
            {limitReached
              ? 'Daily limit reached · Come back tomorrow'
              : `${remaining} prayer${remaining === 1 ? '' : 's'} left today`}
          </Text>
        )}
        <View style={styles.inputInner}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => send(draft)}
            placeholder={limitReached ? 'Come back tomorrow…' : 'Talk, pray, ask anything…'}
            placeholderTextColor={Colors.white3}
            style={[styles.input, limitReached && styles.inputDisabled]}
            multiline
            editable={!limitReached}
          />
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => send(draft)}
            disabled={limitReached}
            style={[styles.sendBtn, { backgroundColor: draft.trim() && !limitReached ? Colors.gold : Colors.surfaceAlt }]}
          >
            <SendIcon active={!!draft.trim() && !limitReached}/>
          </TouchableOpacity>
        </View>
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
  promptScroller: { flexGrow: 0, maxHeight: 42 },
  promptRow: { paddingHorizontal: 2, paddingBottom: 0, gap: 8, alignItems: 'center' },
  promptChip: {
    alignSelf: 'flex-start',
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: 170,
    minHeight: 32,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  promptText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, lineHeight: 15, color: Colors.white3, textAlign: 'center' },
  inputRow: {
    paddingHorizontal: 14, paddingTop: 8, gap: 6,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  limitText: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 11,
    color: Colors.gold, textAlign: 'center',
  },
  inputInner: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11,
    color: Colors.white, fontFamily: 'CrimsonPro_400Regular', fontSize: 13,
    maxHeight: 100,
  },
  inputDisabled: { opacity: 0.4 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});
