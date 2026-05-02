import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Scripture } from '../constants/scriptures';

interface ScriptureCardProps {
  scripture: Scripture;
  compact?: boolean;
}

export function ScriptureCard({ scripture, compact = false }: ScriptureCardProps) {
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.topBorder} />
      <Text style={[styles.verse, compact && styles.verseCompact]}>
        {scripture.verse}
      </Text>
      <Text style={styles.reference}>— {scripture.reference}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    overflow: 'hidden',
  },
  compact: {
    padding: 16,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.gold,
  },
  verse: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 18,
    color: Colors.white,
    lineHeight: 30,
    textAlign: 'center',
    marginTop: 8,
  },
  verseCompact: {
    fontSize: 15,
    lineHeight: 24,
  },
  reference: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.gold,
    textAlign: 'center',
    marginTop: 12,
  },
});
