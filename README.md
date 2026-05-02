# LustLock

A React Native / Expo app for Christians overcoming pornography addiction.  
Dark. Sacred. Minimal. This is armor.

## Stack

- Expo SDK 54 (React Native + TypeScript)
- Expo Router v3 (file-based navigation)
- Zustand + AsyncStorage (persistent global state)
- react-native-reanimated 3 (animations)
- expo-haptics, expo-linear-gradient, react-native-svg
- Cinzel + Inter fonts via expo-google-fonts

## Setup

```bash
cd lustlock
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android).

## Dependencies installed

```bash
npm install expo-router zustand expo-haptics expo-linear-gradient \
  react-native-reanimated react-native-svg \
  @expo-google-fonts/cinzel @expo-google-fonts/inter \
  expo-notifications @expo/vector-icons \
  react-native-safe-area-context react-native-screens \
  @react-native-async-storage/async-storage \
  @react-navigation/bottom-tabs @react-navigation/native
```

## Screens

| Route | Screen |
|-------|--------|
| `/(tabs)/` | Dashboard — The Fortress |
| `/(tabs)/battle-log` | Battle Log — The War Room |
| `/(tabs)/brotherhood` | Brotherhood — The Garrison (Pro gated) |
| `/emergency` | Emergency Mode (full screen modal) |
| `/devotional` | Daily Devotional |
| `/onboarding/welcome` | Onboarding Step 1 |
| `/onboarding/battlefield` | Onboarding Step 2 |
| `/onboarding/covenant` | Onboarding Step 3 |
| `/onboarding/mascot` | Onboarding Step 4 |
| `/onboarding/account` | Onboarding Step 5 (paywall stub) |

## Mascot Tiers

| Days | Tier | Name |
|------|------|------|
| 0 | 0 | Broken Conscript |
| 1–6 | 1 | Wooden Shield |
| 7–29 | 2 | Iron Guardian |
| 30–89 | 3 | Golden Knight |
| 90+ | 4 | Angelic Warrior |
