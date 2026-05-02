import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { Card, Eyebrow } from '../../components/UI';
import { Colors } from '../../constants/colors';

const TRIGGER_OPTIONS = ['Late Night','Stress','Boredom','Pride','Phone in Bed','Loneliness','Idle Time','Other'];

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

  const dayStatus = (d: number) => {
    if (d > today) return 'future';
    if (relapseDays.has(d)) return 'relapse';
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
                onPress={() => s !== 'future' && setSelectedDay(d === selectedDay ? null : d)}
                style={[
                  cal.dayCircle,
                  s === 'clean'   && cal.cleanCircle,
                  s === 'relapse' && cal.relapseCircle,
                  (isSel || isToday) && cal.todayCircle,
                ]}
              >
                <Text style={[
                  cal.dayNum,
                  s === 'clean'   && { color: Colors.gold },
                  s === 'relapse' && { color: Colors.crimson },
                  s === 'future'  && { color: 'rgba(255,255,255,0.15)' },
                  !['clean','relapse','future'].includes(s) && { color: Colors.white3 },
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
            {monthName.split(' ')[0].toUpperCase()} {selectedDay} — {dayStatus(selectedDay) === 'relapse' ? 'RELAPSE LOGGED' : 'CLEAN'}
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function BattleLogScreen() {
  const insets = useSafeAreaInsets();
  const { battlefields, activeBattlefieldKeys, globalStreakDays, longestGlobalStreak } = useAppStore();
  const [activeTriggers, setActiveTriggers] = useState<string[]>(['Late Night', 'Phone in Bed']);

  const toggleTrigger = (t: string) =>
    setActiveTriggers(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const allRelapses = battlefields
    .flatMap(bf => bf.relapses.map(r => ({ ...r, bfName: bf.name })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const winRate = allRelapses.length === 0 ? 100 :
    Math.round((1 - allRelapses.length / Math.max(1, allRelapses.length + globalStreakDays)) * 100);

  const stats = [
    { label: 'Streak',   value: String(globalStreakDays) },
    { label: 'Best',     value: String(longestGlobalStreak) },
    { label: 'Win Rate', value: `${winRate}%` },
    { label: 'Tracked',  value: `${globalStreakDays}d` },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.px}>
        <Eyebrow>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Eyebrow>
        <Text style={styles.title}>Battle Log</Text>
      </View>

      {/* Stats */}
      <View style={[styles.px, styles.statsRow]}>
        {stats.map(s => (
          <Card key={s.label} padding={14} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.statNum}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Card>
        ))}
      </View>

      {/* Calendar */}
      <View style={styles.px}>
        <MonthCalendar/>
      </View>

      {/* Triggers */}
      <View style={[styles.px, { marginTop: 14 }]}>
        <Card>
          <Text style={styles.cardLabel}>COMMON TRIGGERS</Text>
          <View style={styles.chipWrap}>
            {TRIGGER_OPTIONS.map(t => {
              const on = activeTriggers.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.75}
                  onPress={() => toggleTrigger(t)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const cal = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 16, letterSpacing: 1, color: Colors.white },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 1, color: Colors.white3 },
  dayRow: { flexDirection: 'row', marginBottom: 6 },
  dayHeader: { flex: 1, textAlign: 'center', fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 1, color: Colors.white3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', alignItems: 'center', justifyContent: 'center', height: 38 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cleanCircle: { backgroundColor: 'rgba(240,112,32,0.14)', borderWidth: 1, borderColor: 'rgba(240,112,32,0.35)' },
  relapseCircle: { backgroundColor: 'rgba(192,57,43,0.18)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.50)' },
  todayCircle: { borderWidth: 2, borderColor: Colors.gold },
  dayNum: { fontFamily: 'CrimsonPro_600SemiBold', fontSize: 14 },
  detail: { marginTop: 14, padding: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 12 },
  detailLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2, color: Colors.white3 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  px: { paddingHorizontal: 16, marginBottom: 14 },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1, color: Colors.white, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statNum: { fontFamily: 'CinzelDecorative_700Bold', fontSize: 22, color: Colors.gold },
  statLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 7, letterSpacing: 1, color: Colors.white3, marginTop: 5, textTransform: 'uppercase' },
  cardLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.white3, textTransform: 'uppercase', marginBottom: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
  chipOn: { backgroundColor: 'rgba(192,57,43,0.14)', borderColor: 'rgba(192,57,43,0.50)' },
  chipText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white3 },
  chipTextOn: { color: Colors.crimsonBright },
});
