import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Line, Circle } from 'react-native-svg';
import { Colors } from '../constants/colors';

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? Colors.gold : Colors.black;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M5 21V10l7-7 7 7v11" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
      <Rect x="9" y="14" width="6" height="7" stroke={c} strokeWidth="1.6"/>
    </Svg>
  );
}
function LogIcon({ active }: { active: boolean }) {
  const c = active ? Colors.gold : Colors.black;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={c} strokeWidth="1.6"/>
      <Line x1="8" y1="9"  x2="16" y2="9"  stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <Line x1="8" y1="13" x2="16" y2="13" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <Line x1="8" y1="17" x2="12" y2="17" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}
function PrayerIcon({ active }: { active: boolean }) {
  const c = active ? Colors.gold : Colors.black;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3c-4 0-7 3-7 7 0 2.5 1.2 4.7 3 6v3h8v-3c1.8-1.3 3-3.5 3-6 0-4-3-7-7-7z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
      <Line x1="9" y1="19" x2="15" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <Line x1="10" y1="22" x2="14" y2="22" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}
function BlockerIcon({ active }: { active: boolean }) {
  const c = active ? Colors.gold : Colors.black;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L4 5v6c0 5.5 3.75 10.15 8 11.4C16.25 21.15 20 16.5 20 11V5L12 2z"
        stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
      <Path d="M9 12l2 2 4-4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function BrothersIcon({ active }: { active: boolean }) {
  const c = active ? Colors.gold : Colors.black;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="7" r="3" stroke={c} strokeWidth="1.6"/>
      <Circle cx="16" cy="7" r="3" stroke={c} strokeWidth="1.6"/>
      <Path d="M2 21c1-4 3.5-6 6-6s5 2 6 6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <Path d="M16 15c2.5 0 5 2 6 6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}
function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? Colors.gold : Colors.black;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6"/>
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

const TAB_CONFIG = {
  index:         { label: 'Home',     Icon: HomeIcon },
  'battle-log':  { label: 'Log',      Icon: LogIcon },
  prayer:        { label: 'Prayer',   Icon: PrayerIcon },
  brotherhood:   { label: 'Brothers', Icon: BrothersIcon },
  blocker:       { label: 'Shield',   Icon: BlockerIcon },
  profile:       { label: 'Profile',  Icon: ProfileIcon },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TabBar({ state, navigation }: any) {
  return (
    <View style={styles.container}>
      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const tab = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
        if (!tab) return null;
        const isFocused = state.index === index;
        const Icon = tab.Icon;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} activeOpacity={0.75} onPress={onPress} style={styles.tab}>
            <View style={[styles.tabInner, isFocused && styles.tabInnerActive]}>
              <Icon active={isFocused}/>
              <Text style={[styles.label, { color: isFocused ? Colors.gold : Colors.black }]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: 'rgba(10,10,10,0.16)',
    paddingBottom: 18,
    paddingTop: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 18,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    width: 52,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabInnerActive: {
    backgroundColor: 'rgba(232,118,44,0.08)',
    borderColor: 'rgba(232,118,44,0.22)',
  },
  label: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 7.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});
