import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, ScrollView, AppState } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RevenueCatUI from 'react-native-purchases-ui';
import type { PurchasesStoreProduct } from 'react-native-purchases';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/colors';
import {
  PLAN_COPY,
  PRODUCT_IDS,
  PRODUCT_ID_LIST,
  checkSubscriptionStatus,
  getLastProductError,
  getStoreProducts,
  isInitialized,
  purchaseProductId,
} from '../lib/purchases';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { setIsPro, isPro } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCT_IDS.quarterly);
  const [purchasing, setPurchasing] = useState(false);
  const purchaseInFlightRef = useRef(false);
  const purchaseStartedAtRef = useRef(0);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !purchaseInFlightRef.current) return;

      const purchaseAgeMs = Date.now() - purchaseStartedAtRef.current;
      if (purchaseAgeMs < 20_000) return;

      purchaseInFlightRef.current = false;
      purchaseStartedAtRef.current = 0;
      setPurchasing(false);
      void loadProducts();
    });

    return () => subscription.remove();
  }, []);

  async function loadProducts() {
    if (!isInitialized()) {
      setLoading(false);
      return;
    }

    try {
      const alreadyPro = await checkSubscriptionStatus();
      if (alreadyPro) {
        setIsPro(true);
      }
      const nextProducts = await getStoreProducts();
      setProducts(nextProducts);
      if (nextProducts.length > 0 && !nextProducts.some((product) => product.identifier === selectedProductId)) {
        const preferredProduct =
          nextProducts.find((product) => product.identifier === PRODUCT_IDS.quarterly) ?? nextProducts[0];
        setSelectedProductId(preferredProduct.identifier);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (purchaseInFlightRef.current) return;
    if (!isInitialized()) {
      Alert.alert(
        'Subscription unavailable',
        'RevenueCat is not initialized on this build. Check the iOS API key and native purchase setup, then try again.'
      );
      return;
    }

    purchaseInFlightRef.current = true;
    purchaseStartedAtRef.current = Date.now();
    setPurchasing(true);
    try {
      let productIdToBuy = selectedProductId;
      if (!products.some((product) => product.identifier === selectedProductId)) {
        const nextProducts = await getStoreProducts();
        setProducts(nextProducts);
        const nextProduct = nextProducts.find((product) => product.identifier === selectedProductId) ?? nextProducts[0];
        productIdToBuy = nextProduct?.identifier ?? selectedProductId;
      }

      if (!productIdToBuy) {
        const detail = getLastProductError();
        Alert.alert(
          'Subscription unavailable',
          `The App Store returned 0 LustLock subscription products for this build. Check the Paid Apps Agreement, App Store product IDs, bundle ID, RevenueCat iOS app/API key, and that subscriptions are submitted with this app version.${detail ? `\n\nRevenueCat detail: ${detail}` : ''}`
        );
        return;
      }

      const pro = await purchaseProductId(productIdToBuy);
      const unlocked = pro || await checkSubscriptionStatus();
      if (unlocked) {
        setIsPro(true);
        router.back();
        return;
      }

      await loadProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      Alert.alert(
        'Purchase unavailable',
        message || 'The App Store could not complete this subscription purchase. Please confirm the products work in sandbox and that the Paid Apps Agreement is active.'
      );
    } finally {
      purchaseInFlightRef.current = false;
      purchaseStartedAtRef.current = 0;
      setPurchasing(false);
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

  const productsById = new Map(products.map((product) => [product.identifier, product]));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Unlock Your Full Plan</Text>
      <Text style={styles.sub}>
        Requires a paid subscription. Choose a plan to access LustLock's recovery tools, prayer partner, and blocker setup.
      </Text>

      <View style={styles.planList}>
        {PRODUCT_ID_LIST.map((productId) => {
          const product = productsById.get(productId);
          const copy = PLAN_COPY[productId];
          const selected = selectedProductId === productId;
          const recommended = productId === PRODUCT_IDS.quarterly;
          return (
            <TouchableOpacity
              key={productId}
              activeOpacity={0.82}
              disabled={purchasing}
              onPress={() => {
                if (!purchasing) setSelectedProductId(productId);
              }}
              style={[
                styles.planCard,
                recommended && styles.planCardRecommended,
                selected && styles.planCardSelected,
                purchasing && styles.planCardLocked,
              ]}
            >
              <View style={styles.planTitleWrap}>
                <Text style={styles.planTitle}>{copy.title}</Text>
                {recommended && <Text style={styles.planBadge}>Recommended</Text>}
              </View>
              <View style={styles.planMeta}>
                <Text style={styles.planPrice}>{product?.priceString ?? 'Loading'}</Text>
                <Text style={styles.planDuration}>{copy.duration}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {products.length === 0 && (
        <TouchableOpacity style={styles.linkButton} onPress={loadProducts}>
          <Text style={styles.linkText}>Reload subscription products</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={handlePurchase} activeOpacity={0.86} disabled={purchasing}>
        <View style={styles.primaryBtnContent}>
          {purchasing && <ActivityIndicator color={Colors.white} size="small" />}
          <Text style={styles.primaryBtnText}>
            {purchasing ? 'Opening Apple Checkout' : `Start ${PLAN_COPY[selectedProductId]?.title ?? 'LustLock Pro'}`}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>Back</Text>
      </TouchableOpacity>

      {isPro && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleManageSubscription}>
          <Text style={styles.secondaryBtnText}>Manage subscription</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 28,
    color: Colors.black,
    letterSpacing: 1,
    textAlign: 'center',
  },
  sub: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 16,
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 22,
  },
  planList: {
    width: '100%',
    gap: 12,
  },
  planCard: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(10,10,10,0.12)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(184,111,58,0.12)',
    transform: [{ scale: 1.025 }],
  },
  planCardRecommended: {
    borderColor: 'rgba(184,111,58,0.42)',
  },
  planCardLocked: {
    opacity: 0.72,
  },
  planTitleWrap: {
    flex: 1,
    paddingRight: 12,
    gap: 5,
  },
  planTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 16,
    color: Colors.black,
  },
  planBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(184,111,58,0.42)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(184,111,58,0.10)',
    fontFamily: 'Cinzel_700Bold',
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.gold,
    textTransform: 'uppercase',
  },
  planMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  planPrice: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 17,
    color: Colors.gold,
  },
  planDuration: {
    fontFamily: 'CrimsonPro_600SemiBold',
    fontSize: 13,
    color: Colors.black,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    marginTop: 22,
    borderRadius: 999,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryBtnContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: {
    flexShrink: 1,
    fontFamily: 'Cinzel_700Bold',
    fontSize: 12,
    letterSpacing: 1.4,
    color: Colors.white,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  secondaryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.black,
    textTransform: 'uppercase',
  },
  linkButton: {
    paddingVertical: 10,
  },
  linkText: {
    fontFamily: 'CrimsonPro_600SemiBold',
    fontSize: 14,
    color: Colors.black,
    textDecorationLine: 'underline',
  },
});
