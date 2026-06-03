import { Platform, NativeModules } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASE_TYPE,
  STOREKIT_VERSION,
  type PurchasesPackage,
  type PurchasesStoreProduct,
  type CustomerInfo,
  type PurchasesOffering,
} from 'react-native-purchases';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

export const ENTITLEMENT_ID = 'LustLock Pro';

export const PRODUCT_IDS = {
  weekly: 'com.lustlock.app.weekly',
  quarterly: 'com.lustlock.app.quarterly',
  yearly: 'com.lustlock.app.yearly',
} as const;

export const PRODUCT_ID_LIST = [
  PRODUCT_IDS.weekly,
  PRODUCT_IDS.quarterly,
  PRODUCT_IDS.yearly,
] as const;

export const PLAN_COPY: Record<string, { title: string; duration: string; sort: number }> = {
  [PRODUCT_IDS.weekly]: { title: 'Weekly Pro', duration: '1 week', sort: 0 },
  [PRODUCT_IDS.quarterly]: { title: 'Quarterly Pro', duration: '3 months', sort: 1 },
  [PRODUCT_IDS.yearly]: { title: 'Yearly Pro', duration: '1 year', sort: 2 },
};

// Product identifier order for display
export const PRODUCT_ORDER: PACKAGE_TYPE[] = [
  PACKAGE_TYPE.WEEKLY,
  PACKAGE_TYPE.THREE_MONTH,
  PACKAGE_TYPE.ANNUAL,
];

const isNativeAvailable = () => !!NativeModules.RNPurchases;

let initialized = false;
let lastOfferingError: string | null = null;
let lastProductError: string | null = null;

function isUserCancelledPurchase(error: unknown) {
  const purchaseError = error as { userCancelled?: boolean; code?: string; message?: string };
  const msg = purchaseError?.message ?? String(error);
  return (
    purchaseError?.userCancelled === true ||
    purchaseError?.code === 'USER_CANCELLED' ||
    purchaseError?.code === 'PURCHASE_CANCELLED' ||
    purchaseError?.code === 'PurchaseCancelledError' ||
    msg.toLowerCase().includes('cancel')
  );
}

export function initPurchases() {
  if (initialized || Platform.OS !== 'ios' || !IOS_KEY || !isNativeAvailable()) return;
  try {
    Purchases.setLogHandler((level, message) => {
      const formatted = `[RevenueCat] ${message}`;
      if (level === LOG_LEVEL.ERROR || level === LOG_LEVEL.WARN) {
        console.warn(formatted);
      } else if (__DEV__) {
        console.debug(formatted);
      }
    });
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: IOS_KEY, storeKitVersion: STOREKIT_VERSION.STOREKIT_1 });
    initialized = true;
  } catch {
    // native module not ready — retries on next cold start
  }
}

export async function identifyUser(userId: string) {
  if (!initialized) return;
  try { await Purchases.logIn(userId); } catch {}
}

export async function logoutUser() {
  if (!initialized) return;
  try { await Purchases.logOut(); } catch {}
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    lastOfferingError = null;
    return offerings.current;
  } catch (error) {
    lastOfferingError = error instanceof Error ? error.message : String(error);
    return null;
  }
}

export function getLastOfferingError() {
  return lastOfferingError;
}

export async function getStoreProducts(): Promise<PurchasesStoreProduct[]> {
  if (!initialized) return [];
  try {
    const offering = await getOfferings();
    const offeringProducts = offering?.availablePackages
      .map((pkg) => pkg.product)
      .filter((product) => PRODUCT_ID_LIST.includes(product.identifier as typeof PRODUCT_ID_LIST[number]));

    if (offeringProducts?.length) {
      lastProductError = null;
      const productsById = new Map(offeringProducts.map((product) => [product.identifier, product]));

      return PRODUCT_ID_LIST
        .map((productId) => productsById.get(productId))
        .filter((product): product is PurchasesStoreProduct => !!product);
    }

    const products = await Purchases.getProducts([...PRODUCT_ID_LIST], PURCHASE_TYPE.SUBS);
    lastProductError = null;
    const productsById = new Map(products.map((product) => [product.identifier, product]));

    return PRODUCT_ID_LIST
      .map((productId) => productsById.get(productId))
      .filter((product): product is PurchasesStoreProduct => !!product);
  } catch (error) {
    lastProductError = error instanceof Error ? error.message : String(error);
    return [];
  }
}

export function getLastProductError() {
  return lastProductError;
}

async function getPackageForProductId(productId: string): Promise<PurchasesPackage | null> {
  const offering = await getOfferings();
  if (!offering) return null;
  return offering.availablePackages.find((pkg) => pkg.product.identifier === productId) ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!initialized) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isPro(customerInfo);
  } catch (e: unknown) {
    // Re-throw if not user-cancelled so callers can surface the error
    if (!isUserCancelledPurchase(e)) throw e;
    return false;
  }
}

export async function purchaseStoreProduct(product: PurchasesStoreProduct): Promise<boolean> {
  if (!initialized) return false;
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    return isPro(customerInfo);
  } catch (e: unknown) {
    if (!isUserCancelledPurchase(e)) throw e;
    return false;
  }
}

export async function purchaseProductId(productId: string): Promise<boolean> {
  if (!initialized) return false;

  const pkg = await getPackageForProductId(productId);
  if (pkg) {
    return purchasePackage(pkg);
  }

  const products = await getStoreProducts();
  const product = products.find((candidate) => candidate.identifier === productId);
  if (!product) {
    throw new Error('The App Store could not find this LustLock subscription. Please reload products and try again.');
  }

  return purchaseStoreProduct(product);
}

export async function restorePurchases(): Promise<boolean> {
  if (!initialized) return false;
  try {
    const customerInfo = await Purchases.restorePurchases();
    return isPro(customerInfo);
  } catch {
    return false;
  }
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  if (!initialized) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return isPro(customerInfo);
  } catch {
    return false;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function isPro(info: CustomerInfo): boolean {
  return ENTITLEMENT_ID in info.entitlements.active || Object.keys(info.entitlements.active).length > 0;
}

export function isInitialized() {
  return initialized;
}

export function getPurchasesDiagnostics() {
  return {
    initialized,
    hasIOSKey: !!IOS_KEY,
    nativeAvailable: isNativeAvailable(),
    lastOfferingError,
    lastProductError,
  };
}
