import { Platform, NativeModules } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type PurchasesPackage,
  type CustomerInfo,
  type PurchasesOffering,
} from 'react-native-purchases';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

export const ENTITLEMENT_ID = 'LustLock Pro';

// Product identifier order for display
export const PRODUCT_ORDER: PACKAGE_TYPE[] = [
  PACKAGE_TYPE.WEEKLY,
  PACKAGE_TYPE.THREE_MONTH,
  PACKAGE_TYPE.ANNUAL,
];

const isNativeAvailable = () => !!NativeModules.RNPurchases;

let initialized = false;

export function initPurchases() {
  if (initialized || Platform.OS !== 'ios' || !IOS_KEY || !isNativeAvailable()) return;
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: IOS_KEY });
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
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!initialized) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isPro(customerInfo);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Re-throw if not user-cancelled so callers can surface the error
    if (!msg.toLowerCase().includes('cancel')) throw e;
    return false;
  }
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
  return ENTITLEMENT_ID in info.entitlements.active;
}

export function isInitialized() {
  return initialized;
}
