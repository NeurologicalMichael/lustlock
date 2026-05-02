import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../constants/colors';

interface CalendarGridProps {
  relapses: Array<{ date: string }>;
  streakStart: string | null;
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function CalendarGrid({ relapses, streakStart }: CalendarGridProps) {
  const [tooltip, setTooltip] = useState<{ date: string; status: string } | null>(null);

  const today = new Date();
  const relapseDates = new Set(
    relapses.map((r) => formatDate(new Date(r.date)))
  );

  const cells: Array<{ date: Date; key: string }> = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    cells.push({ date: d, key: formatDate(d) });
  }

  const getCellColor = (key: string, date: Date) => {
    const isToday = key === formatDate(today);
    if (relapseDates.has(key)) return Colors.crimson;
    if (streakStart && date >= new Date(streakStart) && date <= today)
      return Colors.gold;
    if (date > today) return Colors.surface;
    return Colors.card;
  };

  const getStatus = (key: string, date: Date) => {
    if (relapseDates.has(key)) return 'Relapse';
    if (streakStart && date >= new Date(streakStart) && date <= today) return 'Clean';
    if (date > today) return 'Future';
    return 'No data';
  };

  const weeks: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View>
      <View style={styles.row}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={styles.dayLabel}>
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map(({ date, key }) => {
            const isToday = key === formatDate(today);
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.75}
                onPress={() =>
                  setTooltip(
                    tooltip?.date === key
                      ? null
                      : { date: key, status: getStatus(key, date) }
                  )
                }
                style={[
                  styles.cell,
                  { backgroundColor: getCellColor(key, date) },
                  isToday && styles.todayCell,
                ]}
              />
            );
          })}
        </View>
      ))}
      {tooltip && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {tooltip.date} · {tooltip.status}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 3,
  },
  dayLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.white3,
    width: 34,
    textAlign: 'center',
    marginHorizontal: 3,
    marginBottom: 4,
  },
  cell: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginHorizontal: 3,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  tooltip: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tooltipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.white2,
  },
});
