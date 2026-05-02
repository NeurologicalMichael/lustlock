import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/colors';
import { ENTITLEMENT_ID, checkSubscriptionStatus, isInitialized } from '../lib/purchases';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { setIsPro, isPro } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    presentPaywall();
  }, []);

  async function presentPaywall() {
    if (!isInitialized()) {
      // RevenueCat not configured yet — show fallback
      setLoading(false);
      return;
    }

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
        displayCloseButton: true,
      });

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          setIsPro(true);
          router.back();
          break;
        case PAYWALL_RESULT.NOT_PRESENTED:
          // user already has entitlement
          router.back();
          break;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.ERROR:
        default:
          router.back();
          break;
      }
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    try {
      await RevenueCatUI.presentCustomerCenter();
      // Refresh pro status after customer center closes
      const pro = await checkSubscriptionStatus();
      setIsPro(pro);
    } catch {
      Alert.alert('Error', 'Unable to open subscription management.');
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  // Fallback UI shown when RevenueCat isn't configured (dev mode / no API key)
  return (
    <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>RevenueCat SDK</Text>
      <Text style={styles.sub}>
        Configure your API key in .env to enable purchasing.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>← BACK</Text>
      </TouchableOpacity>

      {isPro && (
        <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={handleManageSubscription}>
          <Text style={styles.btnText}>MANAGE SUBSCRIPTION</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 20,
    color: Colors.white,
    letterSpacing: 1,
  },
  sub: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 14,
    color: Colors.white3,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.white3,
  },
});
