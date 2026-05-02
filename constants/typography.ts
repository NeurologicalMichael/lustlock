import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography: Record<string, TextStyle> = {
  // Logo / hero numbers
  logoShine: {
    fontFamily: 'CinzelDecorative_900Black',
    fontSize: 20,
    letterSpacing: 3,
    color: Colors.gold,
  },
  bigNum: {
    fontFamily: 'CinzelDecorative_700Bold',
    fontSize: 80,
    lineHeight: 80,
    color: Colors.gold,
  },
  // Headings
  screenTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 26,
    letterSpacing: 1,
    color: Colors.white,
  },
  cardTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 14,
    letterSpacing: 1,
    color: Colors.white,
  },
  // Labels / eyebrows
  eyebrow: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.white3,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.white3,
    textTransform: 'uppercase',
  },
  tabLabel: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Body — Crimson Pro
  body: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 14,
    color: Colors.white2,
    lineHeight: 22,
  },
  bodyItalic: {
    fontFamily: 'CrimsonPro_400Regular_Italic',
    fontSize: 15,
    color: Colors.white2,
    lineHeight: 26,
  },
  scripture: {
    fontFamily: 'CrimsonPro_400Regular_Italic',
    fontSize: 17,
    color: Colors.white,
    lineHeight: 30,
    textAlign: 'center',
  },
  // Buttons
  btnPrimary: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.black,
    textTransform: 'uppercase',
  },
  btnOutline: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.gold,
    textTransform: 'uppercase',
  },
  btnDanger: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.white,
    textTransform: 'uppercase',
  },
};
