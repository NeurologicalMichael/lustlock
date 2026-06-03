import React, { useState } from 'react';
import {
  Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { Card, Eyebrow } from '../../components/UI';
import { Colors } from '../../constants/colors';

const CHECK_VALUES = [1, 3, 5, 7, 10];

function MonthCalendar() {
  const { battlefields, activeBattlefieldKeys } = useAppStore();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build relapse set for this month
  const activeBFs = battlefields.filter(bf => activeBattlefieldKeys.includes(bf.key));
  const relapseDays = new Set<number>();
  activeBFs.forEach(bf => {
    bf.relapses.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        relapseDays.add(d.getDate());
      }
    });
  });

  // Days before month start (blanks)
  const cells: Array<number | null> = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  const dayStatus = (d: number) => {
    if (relapseDays.has(d)) return 'relapse';
    if (d > today) return 'open';
    return 'clean';
  };

  return (
    <Card padding={18}>
      <View style={cal.header}>
        <Text style={cal.monthTitle}>{monthName}</Text>
        <View style={cal.legend}>
          <View style={cal.legendItem}>
            <View style={[cal.legendDot, { backgroundColor: 'rgba(240,112,32,0.25)', borderColor: Colors.gold, borderWidth: 1 }]}/>
            <Text style={cal.legendText}>CLEAN</Text>
          </View>
          <View style={cal.legendItem}>
            <View style={[cal.legendDot, { backgroundColor: 'rgba(192,57,43,0.25)', borderColor: Colors.crimson, borderWidth: 1 }]}/>
            <Text style={cal.legendText}>RELAPSE</Text>
          </View>
        </View>
      </View>

      {/* Day headers */}
      <View style={cal.dayRow}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={cal.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={cal.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={cal.cell}/>;
          const s = dayStatus(d);
          const isToday = d === today;
          const isSel = selectedDay === d;
          return (
            <View key={i} style={cal.cell}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setSelectedDay(d === selectedDay ? null : d)}
                style={[
                  cal.dayCircle,
                  s === 'clean'   && cal.cleanCircle,
                  s === 'relapse' && cal.relapseCircle,
                  s === 'open'    && cal.openCircle,
                  (isSel || isToday) && cal.todayCircle,
                ]}
              >
                <Text style={[
                  cal.dayNum,
                  s === 'clean'   && { color: Colors.gold },
                  s === 'relapse' && { color: Colors.crimson },
                  s === 'open'    && { color: Colors.black },
                ]}>{d}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Selected day detail */}
      {selectedDay && (
        <View style={cal.detail}>
          <Text style={cal.detailLabel}>
            {monthName.split(' ')[0].toUpperCase()} {selectedDay} — {dayStatus(selectedDay) === 'relapse' ? 'RELAPSE LOGGED' : dayStatus(selectedDay) === 'open' ? 'OPEN DAY' : 'CLEAN'}
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function BattleLogScreen() {
  const insets = useSafeAreaInsets();
  const {
    globalStreakDays,
    longestGlobalStreak,
    journalEntries,
    completeDailyCheckIn,
    addJournalEntry,
    logRelapse,
  } = useAppStore();
  const [mood, setMood] = useState(7);
  const [urgeLevel, setUrgeLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [journalDraft, setJournalDraft] = useState('');

  const stats = [
    { label: 'Streak',   value: String(globalStreakDays) },
    { label: 'Best',     value: String(longestGlobalStreak) },
  ];

  const saveCheckIn = () => {
    completeDailyCheckIn({
      mood,
      urgeLevel,
      energyLevel,
      relapseToday: false,
      notes: checkInNotes.trim(),
    });
    setCheckInNotes('');
  };

  const saveJournal = () => {
    const clean = journalDraft.trim();
    if (!clean) return;
    addJournalEntry(clean, 'Battle Log');
    setJournalDraft('');
  };

  const confirmRelapse = () => {
    Alert.alert(
      'Log a relapse?',
      'This records today in your calendar and resets your current streak.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Relapse',
          style: 'destructive',
          onPress: () => logRelapse('lust', ['Manual log'], new Date().getHours()),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 190 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.px}>
          <Eyebrow>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Eyebrow>
          <Text style={styles.title}>Battle Log</Text>
        </View>

        <View style={[styles.px, styles.statsRow]}>
          {stats.map(s => (
            <Card key={s.label} padding={14} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.px}>
          <MonthCalendar/>
        </View>

        <View style={styles.px}>
          <Card padding={14}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardLabel}>DAILY CHECK-IN</Text>
                <Text style={styles.subtleText}>Log how you feel today</Text>
              </View>
              <TouchableOpacity activeOpacity={0.75} onPress={saveCheckIn} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>SAVE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricGrid}>
              <MetricSelector label="Mood" value={mood} onChange={setMood}/>
              <MetricSelector label="Urge" value={urgeLevel} onChange={setUrgeLevel}/>
              <MetricSelector label="Energy" value={energyLevel} onChange={setEnergyLevel}/>
            </View>

            <TextInput
              value={checkInNotes}
              onChangeText={setCheckInNotes}
              placeholder="Optional note"
              placeholderTextColor={Colors.black}
              style={styles.compactInput}
            />
          </Card>
        </View>

        <View style={styles.px}>
          <Card padding={14}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardLabel}>JOURNAL</Text>
                <Text style={styles.subtleText}>{journalEntries.length ? `${journalEntries.length} entries` : 'Private entry'}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={saveJournal}
                disabled={!journalDraft.trim()}
                style={[styles.actionButton, !journalDraft.trim() && styles.actionButtonDisabled]}
              >
                <Text style={styles.actionButtonText}>ADD</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={journalDraft}
              onChangeText={setJournalDraft}
              placeholder="Write what happened"
              placeholderTextColor={Colors.black}
              style={[styles.compactInput, styles.journalInput]}
              multiline
            />
          </Card>
        </View>
      </ScrollView>

      <View style={[styles.relapseDock, { bottom: insets.bottom + 10 }]}>
        <TouchableOpacity activeOpacity={0.75} onPress={confirmRelapse} style={styles.relapseButton}>
          <Text style={styles.relapseButtonText}>LOG A RELAPSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MetricSelector({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.valueRow}>
        {CHECK_VALUES.map(v => {
          const on = v === value;
          return (
            <TouchableOpacity
              key={v}
              activeOpacity={0.75}
              onPress={() => onChange(v)}
              style={[styles.valuePill, on && styles.valuePillOn]}
            >
              <Text style={[styles.valueText, on && styles.valueTextOn]}>{v}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 16, letterSpacing: 1, color: Colors.white },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 1, color: Colors.black },
  dayRow: { flexDirection: 'row', marginBottom: 6 },
  dayHeader: { flex: 1, textAlign: 'center', fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 1, color: Colors.black },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', alignItems: 'center', justifyContent: 'center', height: 38 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cleanCircle: { backgroundColor: 'rgba(240,112,32,0.14)', borderWidth: 1, borderColor: 'rgba(240,112,32,0.35)' },
  relapseCircle: { backgroundColor: 'rgba(192,57,43,0.18)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)' },
  openCircle: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt },
  todayCircle: { borderWidth: 2, borderColor: Colors.gold },
  dayNum: { fontFamily: 'CrimsonPro_600SemiBold', fontSize: 14 },
  detail: { marginTop: 14, padding: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 12 },
  detailLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2, color: Colors.black },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, backgroundColor: Colors.bg },
  px: { paddingHorizontal: 16, marginBottom: 14 },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1, color: Colors.white, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statNum: { fontFamily: 'CinzelDecorative_700Bold', fontSize: 22, color: Colors.gold },
  statLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 7, letterSpacing: 1, color: Colors.black, marginTop: 5, textTransform: 'uppercase' },
  cardLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.black, textTransform: 'uppercase' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 12 },
  subtleText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.black },
  metricGrid: { gap: 10 },
  metricBlock: { gap: 6 },
  metricLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 1, color: Colors.gold, textTransform: 'uppercase' },
  valueRow: { flexDirection: 'row', gap: 6 },
  valuePill: {
    minWidth: 30,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  valuePillOn: { backgroundColor: 'rgba(240,112,32,0.16)', borderColor: Colors.goldBorder },
  valueText: { fontFamily: 'CrimsonPro_600SemiBold', fontSize: 12, color: Colors.black },
  valueTextOn: { color: Colors.gold },
  compactInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.white,
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 14,
  },
  journalInput: { minHeight: 86, textAlignVertical: 'top' },
  actionButton: {
    minWidth: 70,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
  },
  actionButtonDisabled: { opacity: 0.4 },
  actionButtonText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    color: '#0A0520',
  },
  relapseDock: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.bg,
  },
  relapseButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.crimson,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  relapseButtonText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.crimson,
  },
});
