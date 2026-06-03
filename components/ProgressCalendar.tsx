import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

const { width: W } = Dimensions.get('window');
const SECTION_PAD = 16;
const CARD_PAD = 20;
const CELL_GAP = 8;
const CELL_SIZE = Math.floor((W - 2 * SECTION_PAD - 2 * CARD_PAD - 6 * CELL_GAP) / 7);

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type DayStatus = 'completed' | 'current' | 'future' | 'missed' | 'empty';

interface DayCell {
  dateStr: string | null;
  day: number | null;
  status: DayStatus;
}

interface Props {
  completedDates: string[];
  currentDate?: string;
  streakDays?: number;
  targetDays?: number;
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function TrophyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M8 21h8M12 17v4M7 4H4v5a5 5 0 0010 0V4H7z" stroke={Colors.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M7 4h10M4 9c0 1.7 1.3 3 3 3M17 9c0 1.7-1.3 3-3 3" stroke={Colors.gold} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="1.5"/>
      <Path d="M3 9h18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M8 2v4M16 2v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <Circle cx="9" cy="14" r="1" fill="white"/>
      <Circle cx="15" cy="14" r="1" fill="white"/>
    </Svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M2.5 7.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function CurrentDayCell({ day }: { day: number }) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.45, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[cellS.cell, { width: CELL_SIZE, height: CELL_SIZE }]}>
      {/* Pulsing glow ring */}
      <Animated.View style={[cellS.currentGlow, pulseStyle, { width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2 }]} />
      {/* Main circle */}
      <View style={[cellS.currentCircle, { width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2 }]}>
        <Text style={cellS.currentNum}>{day}</Text>
      </View>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ProgressCalendar({
  completedDates,
  currentDate,
  streakDays = 0,
  targetDays = 30,
}: Props) {
  const today = currentDate ?? new Date().toISOString().split('T')[0];
  const todayObj = new Date(today + 'T12:00:00');

  const [viewMonth, setViewMonth] = useState(todayObj.getMonth());
  const [viewYear, setViewYear] = useState(todayObj.getFullYear());
  const [recapDate, setRecapDate] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build grid cells
  const cells: DayCell[] = [];
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  for (let i = 0; i < firstDow; i++) {
    cells.push({ dateStr: null, day: null, status: 'empty' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${viewYear}-${m}-${dd}`;
    let status: DayStatus;
    if (dateStr < today) {
      status = completedDates.includes(dateStr) ? 'completed' : 'missed';
    } else if (dateStr === today) {
      status = 'current';
    } else {
      status = 'future';
    }
    cells.push({ dateStr, day: d, status });
  }

  const handleDayPress = useCallback((cell: DayCell) => {
    if (!cell.dateStr || cell.status === 'empty') return;
    if (cell.status === 'completed' || cell.status === 'missed') {
      setRecapDate(cell.dateStr);
    } else if (cell.status === 'future') {
      setTooltipVisible(true);
      setTimeout(() => setTooltipVisible(false), 2200);
    }
  }, []);

  const renderCell = (cell: DayCell, idx: number) => {
    if (cell.status === 'empty' || !cell.day) {
      return <View key={idx} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
    }

    if (cell.status === 'completed') {
      return (
        <TouchableOpacity
          key={idx}
          activeOpacity={0.75}
          onPress={() => handleDayPress(cell)}
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
        >
          <LinearGradient
            colors={['#FFD700', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[cellS.completedCircle, {
              width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2,
            }]}
          >
            <CheckIcon size={Math.floor(CELL_SIZE * 0.38)} />
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (cell.status === 'current') {
      return <CurrentDayCell key={idx} day={cell.day} />;
    }

    if (cell.status === 'future') {
      return (
        <TouchableOpacity
          key={idx}
          activeOpacity={0.6}
          onPress={() => handleDayPress(cell)}
          style={[cellS.futureCircle, { width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2 }]}
        >
          <Text style={[cellS.futureDayNum, { fontSize: CELL_SIZE * 0.36 }]}>{cell.day}</Text>
        </TouchableOpacity>
      );
    }

    // missed
    return (
      <TouchableOpacity
        key={idx}
        activeOpacity={0.75}
        onPress={() => handleDayPress(cell)}
        style={[cellS.missedCircle, { width: CELL_SIZE, height: CELL_SIZE, borderRadius: CELL_SIZE / 2 }]}
      >
        <Text style={[cellS.missedDayNum, { fontSize: CELL_SIZE * 0.36 }]}>{cell.day}</Text>
      </TouchableOpacity>
    );
  };

  // Format date nicely for modal
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const isRecapCompleted = recapDate ? completedDates.includes(recapDate) : false;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.headerToday}>Today</Text>
        </TouchableOpacity>
        <Text style={s.headerMonth}>{MONTHS[viewMonth]} {viewYear}</Text>
        <CalendarIcon />
      </View>

      {/* Day-of-week headers */}
      <View style={s.dayHeaderRow}>
        {DAY_LABELS.map(d => (
          <View key={d} style={{ width: CELL_SIZE, alignItems: 'center' }}>
            <Text style={s.dayHeaderLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={s.grid}>
        {cells.map((cell, idx) => renderCell(cell, idx))}
      </View>

      {/* Tooltip overlay */}
      {tooltipVisible && (
        <View style={s.tooltipBanner}>
          <Text style={s.tooltipText}>🛡  Stay Focused! Your future awaits.</Text>
        </View>
      )}

      {/* Status bar */}
      <View style={s.statusBar}>
        <TrophyIcon />
        <Text style={s.statusText}>{streakDays} / {targetDays} Days Clean</Text>
      </View>

      {/* Daily Recap Modal */}
      <Modal
        visible={!!recapDate}
        transparent
        animationType="fade"
        onRequestClose={() => setRecapDate(null)}
      >
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRecapDate(null)}
        />
        <View style={s.recapSheet}>
          {/* Gold top border accent */}
          <LinearGradient
            colors={['#FFD700', '#FF8C00', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.recapTopBar}
          />

          {isRecapCompleted ? (
            <LinearGradient
              colors={['#FFD700', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.recapIcon}
            >
              <CheckIcon size={28} />
            </LinearGradient>
          ) : (
            <View style={[s.recapIcon, { backgroundColor: 'rgba(192,57,43,0.14)', borderWidth: 1.5, borderColor: 'rgba(192,57,43,0.40)' }]}>
              <Text style={{ fontSize: 24 }}>•</Text>
            </View>
          )}

          <Text style={s.recapDate}>{recapDate ? formatDate(recapDate) : ''}</Text>
          <Text style={[s.recapStatus, { color: isRecapCompleted ? Colors.gold : Colors.crimsonBright }]}>
            {isRecapCompleted ? 'You Stayed Clean' : 'Day Not Logged'}
          </Text>
          <Text style={s.recapQuote}>
            {isRecapCompleted
              ? '"Every day you stand firm is a stone in the wall of your freedom."'
              : '"Stumbling is not falling. Rising again is what defines you."'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRecapDate(null)}
            style={s.recapClose}
          >
            <LinearGradient
              colors={['#FFD700', '#FF8C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.recapCloseGradient}
            >
              <Text style={s.recapCloseText}>Onward, Warrior</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ─── Cell Styles ──────────────────────────────────────────────────────────────

const cellS = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  completedCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 7,
    elevation: 6,
  },
  currentGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,215,0,0.30)',
  },
  currentCircle: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.60,
    shadowRadius: 8,
    elevation: 8,
  },
  currentNum: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 14,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  futureCircle: {
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.32,
  },
  futureDayNum: {
    fontFamily: 'Cinzel_400Regular',
    color: Colors.white,
  },
  missedCircle: {
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedDayNum: {
    fontFamily: 'Cinzel_400Regular',
    color: Colors.white3,
  },
});

// ─── Calendar Styles ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassCard,
    borderRadius: 24,
    padding: CARD_PAD,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#7B4FBE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerToday: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerMonth: {
    fontFamily: 'CrimsonPro_600SemiBold',
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Day header row
  dayHeaderRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    marginBottom: 10,
  },
  dayHeaderLabel: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 7,
    letterSpacing: 1.5,
    color: Colors.lavender,
    opacity: 0.65,
    textAlign: 'center',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },

  // Tooltip
  tooltipBanner: {
    position: 'absolute',
    bottom: 56,
    left: CARD_PAD,
    right: CARD_PAD,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  tooltipText: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 13,
    color: Colors.white2,
    textAlign: 'center',
  },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statusText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    color: Colors.white,
    letterSpacing: 1,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  recapSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255,215,0,0.20)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  recapTopBar: {
    height: 3,
    width: 60,
    borderRadius: 2,
    marginBottom: 20,
  },
  recapIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  recapDate: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.white3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  recapStatus: {
    fontFamily: 'CrimsonPro_600SemiBold',
    fontSize: 22,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  recapQuote: {
    fontFamily: 'CrimsonPro_400Regular_Italic',
    fontSize: 14,
    color: Colors.white2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  recapClose: {
    width: '100%',
    borderRadius: 999,
  },
  recapCloseGradient: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  recapCloseText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.black,
    textTransform: 'uppercase',
  },
});
