import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Cinzel_400Regular,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
  Cinzel_900Black,
} from '@expo-google-fonts/cinzel';
import {
  CinzelDecorative_400Regular,
  CinzelDecorative_700Bold,
  CinzelDecorative_900Black,
} from '@expo-google-fonts/cinzel-decorative';
import {
  CrimsonPro_400Regular,
  CrimsonPro_400Regular_Italic,
  CrimsonPro_600SemiBold,
  CrimsonPro_600SemiBold_Italic,
} from '@expo-google-fonts/crimson-pro';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { ShieldoComponent } from '../components/Shieldo';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/colors';
import { ScreenTime } from '../modules/ScreenTime';
import { supabase } from '../lib/supabase';
import { initPurchases, checkSubscriptionStatus } from '../lib/purchases';

function LoadingScreen() {
  const pulse = useSharedValue(0.3);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);
  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <View style={styles.loading}>
      <ShieldoComponent state="stone" showLabel={false} size={100}/>
      <Animated.View style={[styles.dot, dotStyle]}/>
    </View>
  );
}

export default function RootLayout() {
  const { onboardingComplete, syncScreenTimeState, setUserId, setIsPro } = useAppStore();
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Cinzel_900Black,
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
    CinzelDecorative_900Black,
    CrimsonPro_400Regular,
    CrimsonPro_400Regular_Italic,
    CrimsonPro_600SemiBold,
    CrimsonPro_600SemiBold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded && !onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [fontsLoaded, onboardingComplete]);

  // Init RevenueCat once on first render
  useEffect(() => { initPurchases(); }, []);

  // Restore Supabase session + subscription status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        checkSubscriptionStatus().then(pro => setIsPro(pro));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        checkSubscriptionStatus().then(pro => setIsPro(pro));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync Screen Time state from native on cold start and restore active restrictions
  useEffect(() => {
    if (!fontsLoaded) return;
    ScreenTime.restoreRestrictions();
    ScreenTime.getState().then(state => {
      syncScreenTimeState({
        screenTimeAuthStatus: state.authStatus,
        adultContentBlocked: state.adultContentBlocked,
        appShieldEnabled: state.appShieldEnabled,
        shieldedAppCount: state.shieldedAppCount,
        shieldedCategoryCount: state.shieldedCategoryCount,
      });
    });
  }, [fontsLoaded]);

  if (!fontsLoaded) return <LoadingScreen/>;

  return (
    <SafeAreaProvider>
      <StatusBar style="light"/>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg }, animation: 'fade' }}>
        <Stack.Screen name="(tabs)"/>
        <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal' }}/>
        <Stack.Screen name="devotional"/>
        <Stack.Screen name="onboarding"/>
        <Stack.Screen name="paywall"/>
        <Stack.Screen name="shield"/>
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
});
