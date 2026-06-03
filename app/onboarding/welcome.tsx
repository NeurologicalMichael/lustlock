import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Dimensions, Animated as RNAnimated,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Linking, AppState,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Defs, RadialGradient as SvgRadial, Stop } from 'react-native-svg';
import type { PurchasesStoreProduct } from 'react-native-purchases';
import * as StoreReview from 'expo-store-review';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  Easing, runOnJS, interpolateColor,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { Colors } from '../../constants/colors';
import { ScreenTime } from '../../modules/ScreenTime';
import { signIn, signUp } from '../../lib/auth';
import {
  PLAN_COPY,
  PRODUCT_IDS,
  PRODUCT_ID_LIST,
  checkSubscriptionStatus,
  getLastProductError,
  getStoreProducts,
  isInitialized,
  purchaseProductId,
} from '../../lib/purchases';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../constants/legal';
import { syncDailyReminder } from '../../lib/notifications';

const { width: W, height: H } = Dimensions.get('window');
const TOTAL_STEPS = 35;
const QUIZ_COUNT = 17;
const REVIEW_EMAIL = 'michaelbreibart+lustlockreview@gmail.com';
const REVIEW_EMAIL_ALIASES = new Set([REVIEW_EMAIL, 'reviewer@lustlock.app']);
const REVIEW_PASSWORD = 'LustLockReview2026!';
const ONBOARDING_TEXT_SECONDARY = 'rgba(0,0,0,0.65)';
const ONBOARDING_TEXT_MUTED = 'rgba(0,0,0,0.40)';

function tenWeeksFrom(date: Date) {
  const target = new Date(date);
  target.setDate(target.getDate() + 70);
  return target;
}

async function openLegalUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', 'Please try again in a moment.');
  }
}

// ─── Quiz / static data ────────────────────────────────────────────────────────

const QUIZ = [
  { q: 'How long have you been struggling with pornography?',
    opts: ['Less than 1 year', '1–3 years', '3–7 years', 'More than 7 years'] },
  { q: 'How often do you currently view pornography?',
    opts: ['Multiple times daily', 'Once a day', 'Several times a week', 'A few times a month'] },
  { q: 'Have you tried to quit before?',
    opts: ['Many times without success', 'A few times', 'Once or twice', 'This is my first attempt'] },
  { q: 'What triggers your urges most often?',
    opts: ['Stress & anxiety', 'Loneliness & boredom', 'Late nights alone', 'Relationship tension'] },
  { q: 'How does pornography affect your relationships?',
    opts: ['Severely damaged them', 'Noticeably affected', 'Slight impact only', 'Not yet affected'] },
  { q: 'Do you use pornography to cope with emotional pain?',
    opts: ["Yes — it's my main coping tool", 'Sometimes I do', 'Rarely', 'Never'] },
  { q: 'What is your longest streak without pornography?',
    opts: ['A month or more', '2–4 weeks', 'Just a few days', 'Never past 24 hours'] },
  { q: 'How do you feel in the hours after viewing pornography?',
    opts: ['Deeply ashamed & defeated', 'Numb and hollow', 'Mildly guilty', 'Mostly indifferent'] },
  { q: 'Does pornography conflict with your faith or values?',
    opts: ["It's destroying my faith", 'Major spiritual conflict', 'Some guilt', 'Not applicable'] },
  { q: 'How does it affect your work or study performance?',
    opts: ['Significant daily impact', 'Noticeable drag on focus', 'Slight distraction', 'No impact yet'] },
  { q: 'Have you noticed escalation in what you seek out?',
    opts: ['Yes — drastically escalated', 'Yes, somewhat', 'Minor escalation', 'No escalation'] },
  { q: 'Do you keep your pornography use hidden from others?',
    opts: ['Completely secret from everyone', 'Mostly hidden', 'A few people know', "I'm open about it"] },
  { q: 'How does pornography impact your self-image?',
    opts: ['I despise myself for it', 'Significantly lowered self-worth', 'Some negative feelings', 'Minimal impact'] },
  { q: 'What motivates you most to quit?',
    opts: ['My faith in God', 'My relationships & family', 'My future & purpose', 'My self-respect'] },
  { q: 'What is your primary support system right now?',
    opts: ['Faith community & church', 'Close friends', 'Family members', 'Mostly on my own'] },
  { q: 'How confident are you in your ability to quit?',
    opts: ['Not confident at all', 'Somewhat uncertain', 'Fairly confident', 'Very determined'] },
  { q: 'When are you most vulnerable to relapse?',
    opts: ['Late at night alone', 'When feeling stressed', 'When bored or idle', 'Multiple situations'] },
];

const CHECKLIST = [
  'Analyzing your addiction patterns...',
  'Calculating relapse risk factors...',
  'Building your personalized roadmap...',
  'Curating daily devotionals...',
  'Setting up accountability checkpoints...',
  'Your 60-day plan is ready.',
];

const TESTIMONIALS = [
  { name: 'James R.', label: '30 DAYS CLEAN',
    text: '"LustLock gave me the structure I\'d been missing for years. After 30 days clean, my wife noticed the difference — and so did I."' },
  { name: 'Marcus T.', label: '60 DAYS CLEAN',
    text: '"I\'d tried everything for 8 years. The quiz helped me finally understand my triggers. 60 days clean — God is faithful."' },
  { name: 'Daniel K.', label: '90 DAYS CLEAN',
    text: '"90 days. I never thought I\'d say that. Watching Shieldo grow stronger every week kept me going on the hardest nights."' },
];

// ─── Light onboarding background ───────────────────────────────────────────────

function MountainBg() {
  const cx = W / 2;
  const crossTop = H * 0.085;
  const crossBottom = H * 0.175;
  const crossMid = crossTop + (crossBottom - crossTop) * 0.4;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#FFF8EF', '#FFF1EA', '#F8E6EE', '#FFFFFF']}
        locations={[0, 0.36, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgRadial id="cg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#B86F3A" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#D9A66F" stopOpacity="0" />
          </SvgRadial>
        </Defs>
        {[[28,52],[72,38],[118,82],[188,30],[248,65],[308,42],[352,80],[55,115],
          [168,105],[295,95],[342,125],[18,148],[108,158],[228,140],[368,152],
          [42,188],[152,172],[275,182],[335,168],[85,215],[195,208]].map(([x,y],i)=>(
          <Circle key={i} cx={x} cy={y} r={i%4===0?1.4:0.9} fill={`rgba(184,111,58,${i%3===0?0.16:0.08})`}/>
        ))}
        <Path d={`M${-10},${H} L${-10},${H*.58} L${W*.12},${H*.35} L${W*.28},${H*.50} L${W*.5},${H*.26} L${W*.66},${H*.42} L${W*.82},${H*.31} L${W+10},${H*.48} L${W+10},${H} Z`} fill="rgba(184,111,58,0.06)"/>
        <Path d={`M${-10},${H} L${-10},${H*.65} L${W*.18},${H*.44} L${W*.38},${H*.52} L${cx},${H*.175} L${W*.62},${H*.50} L${W*.82},${H*.42} L${W+10},${H*.60} L${W+10},${H} Z`} fill="rgba(123,79,190,0.07)"/>
        <Path d={`M${-10},${H} L${-10},${H*.74} Q${W*.22},${H*.64} ${cx},${H*.70} Q${W*.78},${H*.76} ${W+10},${H*.66} L${W+10},${H} Z`} fill="rgba(255,255,255,0.70)"/>
        <Circle cx={cx} cy={crossMid} r={32} fill="url(#cg)"/>
        <Rect x={cx-1.8} y={crossTop} width={3.6} height={crossBottom-crossTop} rx={1.8} fill="rgba(184,111,58,0.72)"/>
        <Rect x={cx-12} y={crossMid-1.8} width={24} height={3.6} rx={1.8} fill="rgba(184,111,58,0.72)"/>
      </Svg>
    </View>
  );
}

// ─── Local gold button (onboarding-only) ──────────────────────────────────────

function GoldButton({ children, onPress, outline = false, style, disabled = false }: {
  children: React.ReactNode; onPress: () => void; outline?: boolean; style?: object; disabled?: boolean;
}) {
  const content = typeof children === 'string' || typeof children === 'number'
    ? <Text style={outline ? s.btnOutlineText : s.btnGoldText}>{children}</Text>
    : <View style={s.btnContent}>{children}</View>;

  if (outline) {
    return (
      <TouchableOpacity activeOpacity={0.82} onPress={onPress} disabled={disabled} style={[s.btnOutline, disabled && s.btnDisabled, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} disabled={disabled} style={[s.btnGoldWrap, disabled && s.btnDisabled, style]}>
      <LinearGradient
        colors={['#191715', '#0A0A0A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.btnGold}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { setOnboardingData, setUserId, setNotifPref, addAccountabilityPartner } = useAppStore();

  // ── State ──
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pulsedIdx, setPulsedIdx] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [checklistDone, setChecklistDone] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [openingPaywall, setOpeningPaywall] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(PRODUCT_IDS.quarterly);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  const [freedomDate, setFreedomDate] = useState(() => tenWeeksFrom(new Date()));
  const hasName = name.trim().length > 0;

  const transitioning = useRef(false);
  const purchaseInFlightRef = useRef(false);
  const purchaseStartedAtRef = useRef(0);

  // ── RN Animated (for analysis pulsing + bar) ──
  const analysisAnim = useRef(new RNAnimated.Value(0)).current;
  const analysisPulse = useRef(new RNAnimated.Value(1)).current;
  const pulseLoopRef = useRef<RNAnimated.CompositeAnimation | null>(null);

  // ── Reanimated shared values ──
  // Quiz card slide / fade
  const cardX   = useSharedValue(0);
  const cardOp  = useSharedValue(1);
  // Smooth progress bar
  const progAnim = useSharedValue(0);
  // Option card pulse scale (one at a time)
  const cardScale = useSharedValue(1);
  // Continue button activation (0 = inactive, 1 = active)
  const btnAct = useSharedValue(0);

  const isQuiz = step >= 1 && step <= 17;
  const qIdx   = step - 1; // current quiz question index (only valid during quiz)
  const hasAnswer = answers[qIdx] !== undefined;

  const loadSubscriptionProducts = useCallback(async () => {
    if (!isInitialized()) return;
    setProductsLoading(true);
    try {
      const nextProducts = await getStoreProducts();
      setProducts(nextProducts);
      if (nextProducts.length > 0 && !nextProducts.some((product) => product.identifier === selectedProductId)) {
        const preferredProduct =
          nextProducts.find((product) => product.identifier === PRODUCT_IDS.quarterly) ?? nextProducts[0];
        setSelectedProductId(preferredProduct.identifier);
      }
    } finally {
      setProductsLoading(false);
    }
  }, [selectedProductId]);

  // ── Animated styles ──
  const quizCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardX.value }],
    opacity: cardOp.value,
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${progAnim.value * 100}%` as `${number}%`,
  }));

  const pulsedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const continueBtnStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      btnAct.value, [0, 1],
      ['rgba(10,10,10,0.08)', '#111111']
    ),
  }));

  // ── Button active state ──
  useEffect(() => {
    btnAct.value = withTiming(hasAnswer ? 1 : 0, { duration: 220, easing: Easing.out(Easing.ease) });
  }, [hasAnswer, step]);

  // ── Smooth progress bar ──
  useEffect(() => {
    if (isQuiz) {
      progAnim.value = withTiming((step - 1) / QUIZ_COUNT, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [step]);

  useEffect(() => {
    if (step === 30) {
      loadSubscriptionProducts();
    }
  }, [loadSubscriptionProducts, step]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !purchaseInFlightRef.current) return;

      const purchaseAgeMs = Date.now() - purchaseStartedAtRef.current;
      if (purchaseAgeMs < 20_000) return;

      purchaseInFlightRef.current = false;
      purchaseStartedAtRef.current = 0;
      setBuyingProductId(null);
      setOpeningPaywall(false);
      void loadSubscriptionProducts();
    });

    return () => subscription.remove();
  }, [loadSubscriptionProducts]);

  // ── Analysis screen ──
  useEffect(() => {
    if (step === 18) {
      analysisAnim.setValue(0);
      RNAnimated.timing(analysisAnim, { toValue: 1, duration: 3400, useNativeDriver: false })
        .start(() => setTimeout(next, 500));
      const loop = RNAnimated.loop(RNAnimated.sequence([
        RNAnimated.timing(analysisPulse, { toValue: 1.18, duration: 750, useNativeDriver: true }),
        RNAnimated.timing(analysisPulse, { toValue: 1.0,  duration: 750, useNativeDriver: true }),
      ]));
      pulseLoopRef.current = loop;
      loop.start();
    } else {
      pulseLoopRef.current?.stop();
      analysisPulse.setValue(1);
    }
  }, [step]);

  // ── Checklist ──
  useEffect(() => {
    if (step === 19) {
      setChecklistDone(0);
      let i = 0;
      const t = setInterval(() => {
        i++;
        setChecklistDone(i);
        if (i >= CHECKLIST.length) {
          clearInterval(t);
          setFreedomDate(tenWeeksFrom(new Date()));
          setTimeout(next, 900);
        }
      }, 620);
      return () => clearInterval(t);
    }
  }, [step]);

  // ── Testimonial rotate ──
  useEffect(() => {
    if (step === 28) {
      setTestimonialIdx(0);
      const t = setInterval(() => setTestimonialIdx(p => (p + 1) % TESTIMONIALS.length), 3800);
      return () => clearInterval(t);
    }
  }, [step]);

  const next = useCallback(() => setStep(p => Math.min(p + 1, TOTAL_STEPS - 1)), []);

  const completeReviewerLogin = useCallback((userId?: string) => {
    if (userId) setUserId(userId);
    setOnboardingData({
      userName: 'App Reviewer',
      userEmail: REVIEW_EMAIL,
      isPro: true,
      onboardingComplete: true,
      joinDate: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  }, [setOnboardingData, setUserId]);

  const handleExistingLogin = useCallback(async () => {
    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !loginPassword) {
      Alert.alert('Login required', 'Enter your email and password to continue.');
      return;
    }

    if (REVIEW_EMAIL_ALIASES.has(cleanEmail) && loginPassword === REVIEW_PASSWORD) {
      setLoggingIn(true);
      try {
        let userId: string | undefined;
        try {
          const { user } = await signIn(REVIEW_EMAIL, REVIEW_PASSWORD);
          userId = user?.id;
        } catch {
          const { user } = await signUp(REVIEW_EMAIL, REVIEW_PASSWORD, 'App Reviewer');
          userId = user?.id;
        }
        completeReviewerLogin(userId);
      } catch {
        completeReviewerLogin();
      } finally {
        setLoggingIn(false);
      }
      return;
    }

    setLoggingIn(true);
    try {
      const { user } = await signIn(cleanEmail, loginPassword);
      if (user) setUserId(user.id);
      const pro = await checkSubscriptionStatus();
      setOnboardingData({
        userEmail: cleanEmail,
        userName: user?.user_metadata?.username || 'Warrior',
        isPro: pro,
        onboardingComplete: true,
        joinDate: new Date().toISOString(),
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login failed', 'We could not sign in with those credentials. Check them and try again.');
    } finally {
      setLoggingIn(false);
    }
  }, [loginEmail, loginPassword, completeReviewerLogin, setUserId, setOnboardingData]);

  // ── Quiz option selection (no auto-advance) ──
  const selectOption = useCallback((qIndex: number, optIndex: number) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
    setPulsedIdx(optIndex);
    cardScale.value = 1;
    cardScale.value = withSequence(
      withTiming(0.985, { duration: 90, easing: Easing.out(Easing.ease) }),
      withTiming(1.0,   { duration: 150, easing: Easing.inOut(Easing.ease) })
    );
  }, []);

  // ── Quiz advance with slide transition ──
  const advanceQuiz = useCallback(() => {
    const nextStep = step + 1;
    const nextIsQuiz = nextStep >= 1 && nextStep <= 17;
    // Position card off-screen right (instant, invisible)
    cardX.value  = W * 0.30;
    cardOp.value = 0;
    setPulsedIdx(null);
    setStep(nextStep);
    transitioning.current = false;

    if (nextIsQuiz) {
      // Slide in from right
      cardX.value  = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      cardOp.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
    } else {
      // Non-quiz next screen: just show normally
      cardX.value  = 0;
      cardOp.value = 1;
    }
  }, [step]);

  const handleContinue = useCallback(() => {
    if (!hasAnswer || transitioning.current) return;
    transitioning.current = true;
    // Exit: slide left + fade out
    cardX.value  = withTiming(-W * 0.28, { duration: 300, easing: Easing.in(Easing.cubic) });
    cardOp.value = withTiming(0, { duration: 240, easing: Easing.in(Easing.ease) },
      finished => { if (finished) runOnJS(advanceQuiz)(); }
    );
  }, [hasAnswer, advanceQuiz]);

  // ── Back with reverse slide ──
  const goBackStep = useCallback(() => {
    cardX.value  = -W * 0.28;
    cardOp.value = 0;
    setPulsedIdx(null);
    setStep(p => Math.max(p - 1, 0));
    transitioning.current = false;
    cardX.value  = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    cardOp.value = withTiming(1, { duration: 280 });
  }, []);

  const handleBack = useCallback(() => {
    if (transitioning.current) return;
    if (!isQuiz) { setStep(p => Math.max(p - 1, 0)); return; }
    transitioning.current = true;
    cardX.value  = withTiming(W * 0.28, { duration: 300, easing: Easing.in(Easing.cubic) });
    cardOp.value = withTiming(0, { duration: 240 },
      finished => { if (finished) runOnJS(goBackStep)(); }
    );
  }, [isQuiz, goBackStep]);

  // ── Finish ──
  const finish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);

    const trimEmail = email.trim();
    const trimName  = name.trim() || 'Warrior';

    if (trimEmail && password.length >= 8) {
      try {
        const { user } = await signUp(trimEmail, password, trimName);
        if (user) setUserId(user.id);
      } catch {
        // Sign-up failed (duplicate email, network, etc.) — continue as guest
      }
    }

    setOnboardingData({
      userName: trimName,
      userEmail: trimEmail,
      quizAnswers: answers as Record<string, number>,
      onboardingComplete: true,
      joinDate: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  }, [name, email, password, answers, finishing]);

  const saveAccountabilityPartner = useCallback(() => {
    const cleanName = partnerName.trim();
    const cleanEmail = partnerEmail.trim().toLowerCase();
    if (!cleanName && !cleanEmail) {
      next();
      return;
    }
    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Complete partner details', 'Enter both your partner’s name and a valid email, or skip this step for now.');
      return;
    }
    addAccountabilityPartner({
      partnerUserId: cleanEmail,
      name: cleanName,
      shareStreak: true,
      shareRelapse: false,
      alertOnRelapse: false,
    });
    next();
  }, [partnerName, partnerEmail, addAccountabilityPartner, next]);

  // ─── Non-quiz screen renderers ─────────────────────────────────────────────

  const renderAccountChoice = () => (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.centeredFlex}>
      <View style={s.inputCard}>
        <Text style={s.inputCardEyebrow}>WELCOME TO LUSTLOCK</Text>
        <Text style={s.inputCardTitle}>
          {loginMode ? 'Sign In to Continue' : 'Are you new here?'}
        </Text>
        <Text style={s.inputCardSub}>
          {loginMode
            ? 'Log into an existing account, or use the reviewer credentials provided in App Store Connect.'
            : 'Start fresh with the assessment, or sign into a previous account if you already have one.'}
        </Text>

        {loginMode ? (
          <>
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="rgba(0,0,0,0.32)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={loginEmail}
              onChangeText={setLoginEmail}
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor="rgba(0,0,0,0.32)"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={loginPassword}
              onChangeText={setLoginPassword}
            />
            <GoldButton onPress={handleExistingLogin} style={{marginTop:16}}>
              {loggingIn ? <ActivityIndicator color="#FFFFFF" size="small"/> : 'Sign In →'}
            </GoldButton>
            <TouchableOpacity onPress={() => setLoginMode(false)} style={{marginTop:14,alignItems:'center'}}>
              <Text style={s.skipText}>I’m new to LustLock</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <GoldButton onPress={() => setStep(0)} style={{marginTop:16}}>I’m New Here</GoldButton>
            <GoldButton onPress={() => setLoginMode(true)} outline style={{marginTop:12}}>
              I Already Have an Account
            </GoldButton>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );

  const renderLanding = () => (
    <View style={s.centeredFlex}>
      <View style={s.landingIconWrap}>
        <Svg width={70} height={70} viewBox="0 0 70 70">
          <Rect x={32.25} y={6}    width={5.5} height={58} rx={2.75} fill={Colors.gold}/>
          <Rect x={13}    y={32.25} width={44}  height={5.5} rx={2.75} fill={Colors.gold}/>
        </Svg>
      </View>
      <Text style={s.logoText}>LUSTLOCK</Text>
      <Text style={s.tagline}>"The battle is real. So is victory."</Text>
      <View style={{width:'100%',marginTop:32}}>
        <GoldButton onPress={next}>Begin Assessment</GoldButton>
      </View>
    </View>
  );

  const renderAnalysis = () => {
    const barW = analysisAnim.interpolate({inputRange:[0,1],outputRange:['0%','100%']});
    return (
      <View style={s.centeredFlex}>
        <RNAnimated.View style={{transform:[{scale:analysisPulse}]}}>
          <View style={s.analysisBadge}>
            <Svg width={52} height={52} viewBox="0 0 52 52">
              <Circle cx={26} cy={26} r={24} stroke={Colors.gold} strokeWidth={2.5} fill="none"/>
              <Path d="M14 27l8 8 16-16" stroke={Colors.gold} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </Svg>
          </View>
        </RNAnimated.View>
        <Text style={[s.darkTitle,{marginTop:28}]}>Analyzing Your Responses</Text>
        <Text style={s.darkSub}>Building a plan tailored to your journey...</Text>
        <View style={s.analysisTracks}>
          <View style={s.analysisTrack}>
            <RNAnimated.View style={[s.analysisFill,{width:barW}]}/>
          </View>
        </View>
        <Text style={s.analysisHint}>This may take a moment</Text>
      </View>
    );
  };

  const renderChecklist = () => (
    <View style={s.centeredFlex}>
      <Text style={s.darkTitle}>Building Your Plan</Text>
      <Text style={s.darkSub}>Personalizing your 60-day recovery roadmap</Text>
      <View style={s.checklistWrap}>
        {CHECKLIST.map((item,i)=>{
          const done=i<checklistDone; const active=i===checklistDone-1;
          return (
            <View key={i} style={[s.checklistRow,{opacity:done?1:0.35}]}>
              <View style={[s.checklistCircle,done&&s.checklistCircleDone]}>
                {done&&<Text style={s.checklistCheckmark}>✓</Text>}
              </View>
              <Text style={[s.checklistText,active&&{color:Colors.white}]}>{item}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderFreedomDate = () => (
    <View style={s.centeredFlex}>
      <Text style={s.readyEyebrow}>YOUR FREEDOM DATE</Text>
      <Text style={s.freedomDate}>
        {freedomDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
      <Text style={s.freedomTitle}>Ten Weeks To A{'\n'}Stronger Life</Text>
      <View style={s.freedomCard}>
        <Text style={s.freedomCardText}>
          This is your clear target: ten focused weeks to quit porn, rebuild your habits, and step into lasting freedom.
        </Text>
      </View>
      <GoldButton onPress={next} style={{ width: '100%', marginTop: 24 }}>
        Commit To This Date →
      </GoldButton>
    </View>
  );

  const renderReviewPrompt = () => (
    <View style={s.centeredFlex}>
      <View style={s.reviewIcon}>
        <Text style={s.reviewStars}>★★★★★</Text>
      </View>
      <Text style={s.darkTitle}>Help Another Man{'\n'}Find A Way Forward</Text>
      <Text style={s.darkSub}>
        A quick App Store review helps more men discover LustLock when they need support.
      </Text>
      <GoldButton
        onPress={async () => {
          try {
            if (await StoreReview.hasAction()) {
              await StoreReview.requestReview();
            }
          } catch {}
          next();
        }}
        style={{ width: '100%', marginTop: 28 }}
      >
        Leave A Review
      </GoldButton>
      <TouchableOpacity onPress={next} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={s.skipText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmail = () => (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.centeredFlex}>
      <View style={s.inputCard}>
        <Text style={s.inputCardEyebrow}>SAVE YOUR PROGRESS</Text>
        <Text style={s.inputCardTitle}>Where should we{'\n'}send your plan?</Text>
        <Text style={s.inputCardSub}>We'll send your personalized recovery plan to your inbox.</Text>
        <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor="rgba(0,0,0,0.32)"
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail}/>
        <GoldButton onPress={next} style={{marginTop:16}}>Continue →</GoldButton>
        <TouchableOpacity onPress={next} style={{marginTop:14,alignItems:'center'}}>
          <Text style={s.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <Text style={s.privacyNote}>🔒 We never share your information.</Text>
      </View>
    </KeyboardAvoidingView>
  );

  const renderName = () => (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.centeredFlex}>
      <View style={s.inputCard}>
        <Text style={s.inputCardEyebrow}>YOUR IDENTITY</Text>
        <Text style={s.inputCardTitle}>What should we{'\n'}call you?</Text>
        <TextInput style={s.input} placeholder="Your first name" placeholderTextColor="rgba(0,0,0,0.32)"
          autoCapitalize="words" autoCorrect={false} value={name} onChangeText={setName}/>
        <GoldButton
          onPress={() => {
            if (!hasName) {
              Alert.alert('Name required', 'Please enter your first name to continue.');
              return;
            }
            next();
          }}
          style={{marginTop:16, opacity: hasName ? 1 : 0.55}}
        >
          Continue →
        </GoldButton>
      </View>
    </KeyboardAvoidingView>
  );

  const renderPassword = () => (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.centeredFlex}>
      <View style={s.inputCard}>
        <Text style={s.inputCardEyebrow}>SECURE YOUR ACCOUNT</Text>
        <Text style={s.inputCardTitle}>Create a Password</Text>
        <Text style={s.inputCardSub}>Minimum 8 characters. Your data is encrypted locally.</Text>
        <View style={s.pwWrap}>
          <TextInput style={[s.input,{flex:1,marginBottom:0}]} placeholder="Password"
            placeholderTextColor="rgba(0,0,0,0.32)" secureTextEntry={!showPw}
            autoCapitalize="none" autoCorrect={false} value={password} onChangeText={setPassword}/>
          <TouchableOpacity onPress={()=>setShowPw(v=>!v)} style={s.pwToggle}>
            <Text style={s.pwToggleText}>{showPw?'HIDE':'SHOW'}</Text>
          </TouchableOpacity>
        </View>
        <GoldButton onPress={next} style={{marginTop:16}}>Create Account →</GoldButton>
        <TouchableOpacity onPress={next} style={{marginTop:14,alignItems:'center'}}>
          <Text style={s.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderAccountabilityPartner = () => (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.centeredFlex}>
      <View style={s.inputCard}>
        <Text style={s.inputCardEyebrow}>OPTIONAL ACCOUNTABILITY</Text>
        <Text style={s.inputCardTitle}>Add A Trusted Partner</Text>
        <Text style={s.inputCardSub}>
          Choose someone you can contact when temptation gets loud. You can change this later in Profile settings.
        </Text>
        <TextInput
          style={s.input}
          placeholder="Partner name"
          placeholderTextColor="rgba(0,0,0,0.32)"
          autoCapitalize="words"
          autoCorrect={false}
          value={partnerName}
          onChangeText={setPartnerName}
        />
        <TextInput
          style={[s.input, { marginTop: 10 }]}
          placeholder="Partner email"
          placeholderTextColor="rgba(0,0,0,0.32)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={partnerEmail}
          onChangeText={setPartnerEmail}
        />
        <Text style={s.partnerPrivacyNote}>
          Private by default. LustLock saves this contact so you can reach out quickly; it does not message them automatically.
        </Text>
        <GoldButton onPress={saveAccountabilityPartner} style={{marginTop:16}}>Save Partner →</GoldButton>
        <TouchableOpacity onPress={next} style={{marginTop:14,alignItems:'center'}}>
          <Text style={s.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderScreenTimePermission = () => (
    <View style={s.centeredFlex}>
      <View style={s.notifIcon}>
        <Svg width={56} height={56} viewBox="0 0 56 56">
          <Path d="M28 6L8 14v16c0 12 8.5 23.2 20 26 11.5-2.8 20-14 20-26V14L28 6z"
            stroke={Colors.gold} strokeWidth={2.5} fill="none" strokeLinejoin="round"/>
          <Path d="M20 28l6 6 10-10" stroke={Colors.gold} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      </View>
      <Text style={s.darkTitle}>Activate Your Shield</Text>
      <Text style={s.darkSub}>
        LustLock uses Apple's Screen Time API to block adult websites and shield distraction apps — active even when the app is closed.
      </Text>
      <View style={s.notifBullets}>
        {[['🌐 Web Filter', 'Blocks adult sites in Safari via Screen Time'],
          ['🛡 App Shield', 'Choose apps to restrict with an intervention screen'],
          ['🔐 Always On', 'Restrictions live at the OS level, not inside the app'],
        ].map(([title, desc]) => (
          <View key={title} style={s.notifBullet}>
            <View style={s.notifDot}/>
            <View style={{ flex: 1 }}>
              <Text style={s.notifBulletTitle}>{title}</Text>
              <Text style={s.notifBulletDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <GoldButton onPress={async () => {
        try { await ScreenTime.requestAuthorization(); } catch {}
        next();
      }}>
        Allow Screen Time Access
      </GoldButton>
      <TouchableOpacity onPress={next} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={s.skipText}>Set up later in the Blocker tab</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNotifications = () => (
    <View style={s.centeredFlex}>
      <View style={s.notifIcon}>
        <Svg width={56} height={56} viewBox="0 0 56 56">
          <Path d="M28 10c-8 0-14 6-14 14 0 5 2.4 9.4 6 12v6h16v-6c3.6-2.6 6-7 6-12 0-8-6-14-14-14z"
            stroke={Colors.gold} strokeWidth={2.5} fill="none" strokeLinejoin="round"/>
          <Rect x={22} y={42} width={12} height={3} rx={1.5} fill={Colors.gold}/>
          <Rect x={24} y={45} width={8}  height={3} rx={1.5} fill={Colors.gold}/>
        </Svg>
      </View>
      <Text style={s.darkTitle}>Stay Accountable Daily</Text>
      <Text style={s.darkSub}>Private reminders help you stay steady when it matters most.</Text>
      <View style={s.notifBullets}>
        {[['Morning check-in','Start each day with intention'],
          ['Streak reminders','Never lose your momentum'],
          ['Quick support','One tap when you need backup']].map(([title,desc])=>(
          <View key={title} style={s.notifBullet}>
            <View style={s.notifDot}/>
            <View style={{flex:1}}>
              <Text style={s.notifBulletTitle}>{title}</Text>
              <Text style={s.notifBulletDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <GoldButton onPress={async()=>{
              try {
                const scheduled = await syncDailyReminder(true, true);
                setNotifPref('notifDaily', scheduled);
              } catch {
                setNotifPref('notifDaily', false);
              }
        next();
      }}>Enable Notifications</GoldButton>
      <TouchableOpacity onPress={next} style={{marginTop:16,alignItems:'center'}}>
        <Text style={s.skipText}>Not right now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTestimonials = () => {
    const t = TESTIMONIALS[testimonialIdx];
    return (
      <View style={s.centeredFlex}>
        <Text style={s.darkTitle}>Real Men. Real Freedom.</Text>
        <View style={s.testimonialCard}>
          <View style={s.testimonialBadge}><Text style={s.testimonialBadgeText}>{t.label}</Text></View>
          <Text style={s.testimonialQuote}>{t.text}</Text>
          <Text style={s.testimonialName}>— {t.name}</Text>
        </View>
        <View style={s.testimonialDots}>
          {TESTIMONIALS.map((_,i)=>(
            <TouchableOpacity key={i} onPress={()=>setTestimonialIdx(i)}>
              <View style={[s.testimonialDot,i===testimonialIdx&&s.testimonialDotActive]}/>
            </TouchableOpacity>
          ))}
        </View>
        <GoldButton onPress={next}>Continue →</GoldButton>
      </View>
    );
  };

  const renderStats = () => (
    <View style={s.centeredFlex}>
      <Text style={s.darkTitle}>You're Not Alone</Text>
      <Text style={s.darkSub}>Thousands of men are fighting this battle alongside you.</Text>
      <View style={s.statsWrap}>
        {[['10,247','Men Clean Today'],['4.8 ★','Average Rating'],
          ['63,492','Days Clean in Our Community'],['94%','Report Fewer Relapses After 30 Days']
        ].map(([num,label])=>(
          <View key={label} style={s.statCard}>
            <Text style={s.statNum}>{num}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <GoldButton onPress={next} style={{marginTop:8}}>Continue →</GoldButton>
    </View>
  );

  const renderPremium = () => {
    const productsById = new Map(products.map((product) => [product.identifier, product]));
    const selectedProduct = productsById.get(selectedProductId);
    const productsReady = products.length > 0;
    const purchaseLocked = openingPaywall || Boolean(buyingProductId);

    return (
    <View style={s.centeredFlex}>
      <Text style={s.darkTitle}>Unlock Your Full{'\n'}60-Day Plan</Text>
      <Text style={s.darkSub}>Choose your plan to continue into LustLock.</Text>
      <View style={s.revenueCatCard}>
        <Text style={s.revenueCatTitle}>LustLock Pro</Text>
        <Text style={s.revenueCatSub}>
          Requires a paid subscription. Includes the recovery program, blocker tools, prayer partner, and accountability features.
        </Text>
      </View>
      <View style={s.planGrid}>
        {PRODUCT_ID_LIST.map((productId) => {
          const product = productsById.get(productId);
          const copy = PLAN_COPY[productId];
          const selected = selectedProductId === productId;
          const recommended = productId === PRODUCT_IDS.quarterly;
          return (
            <TouchableOpacity
              key={productId}
              activeOpacity={0.82}
              disabled={purchaseLocked}
              onPress={() => {
                if (!purchaseLocked) setSelectedProductId(productId);
              }}
              style={[
                s.planCard,
                recommended && s.planCardRecommended,
                selected && s.planCardSelected,
                purchaseLocked && s.planCardLocked,
              ]}
            >
              <View style={s.planTitleWrap}>
                <Text style={s.planTitle}>{copy.title}</Text>
                {recommended && <Text style={s.planBadge}>Recommended</Text>}
              </View>
              <Text style={s.planPrice}>{product?.priceString ?? 'Loading'}</Text>
              <Text style={s.planDuration}>{copy.duration}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!productsReady && (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={loadSubscriptionProducts}
          style={s.reloadProductsButton}
        >
          <Text style={s.reloadProductsText}>
            {productsLoading ? 'Loading App Store products...' : 'Reload subscription products'}
          </Text>
        </TouchableOpacity>
      )}
      <GoldButton
        onPress={async () => {
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
          setOpeningPaywall(true);
          try {
            const alreadyPro = await checkSubscriptionStatus();
            if (alreadyPro) {
              setOnboardingData({ isPro: true });
              next();
              return;
            }

            let productIdToBuy = selectedProductId;
            if (!selectedProduct) {
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

            setBuyingProductId(productIdToBuy);
            const pro = await purchaseProductId(productIdToBuy);
            const unlocked = pro || await checkSubscriptionStatus();
            if (unlocked) {
              setOnboardingData({ isPro: true });
              next();
              return;
            }

            await loadSubscriptionProducts();
          } catch (error) {
            console.warn('RevenueCat product purchase failed', error);
            const message = error instanceof Error ? error.message : '';
            Alert.alert(
              'Purchase unavailable',
              message || 'The App Store could not complete this subscription purchase. Please confirm the products work in sandbox and that the Paid Apps Agreement is active.'
            );
          } finally {
            purchaseInFlightRef.current = false;
            purchaseStartedAtRef.current = 0;
            setBuyingProductId(null);
            setOpeningPaywall(false);
          }
        }}
        disabled={openingPaywall}
        style={{ marginTop: 18, width: '100%' }}
      >
        {openingPaywall ? (
          <View style={s.paywallButtonContent}>
            <ActivityIndicator color={Colors.white} size="small"/>
            <Text style={s.btnGoldText}>
              {buyingProductId ? 'Opening Apple Checkout' : 'Preparing Checkout'}
            </Text>
          </View>
        ) : (
          `Start ${PLAN_COPY[selectedProductId]?.title ?? 'LustLock Pro'}`
        )}
      </GoldButton>
      {__DEV__ && (
        <TouchableOpacity
          onPress={() => {
            setOnboardingData({ isPro: true });
            next();
          }}
          style={s.devSkipButton}
          activeOpacity={0.75}
        >
          <Text style={s.devSkipText}>DEV ONLY: Skip Paywall</Text>
        </TouchableOpacity>
      )}
      <Text style={s.privacyNote}>Purchases and restores are managed securely through the App Store.</Text>
      <View style={s.legalLinks}>
        <TouchableOpacity onPress={() => openLegalUrl(PRIVACY_POLICY_URL)} activeOpacity={0.7}>
          <Text style={s.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={s.legalDivider}>•</Text>
        <TouchableOpacity onPress={() => openLegalUrl(TERMS_OF_USE_URL)} activeOpacity={0.7}>
          <Text style={s.legalLink}>Terms of Use</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const renderReady = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.readyScroll}>
      <View style={s.readyIconWrap}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx={40} cy={40} r={36} stroke={Colors.gold} strokeWidth={3} fill={Colors.goldDim}/>
          <Path d="M22 42l12 12 24-26" stroke={Colors.gold} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </Svg>
      </View>
      <Text style={s.readyEyebrow}>PLAN CONFIRMED</Text>
      <Text style={s.readyTitle}>Everything{'\n'}Is Ready</Text>
      <View style={s.readyMessageCard}>
        <Text style={s.readyMessage}>
          Your plan has been created to help you quit porn entirely in only 2 months.
        </Text>
      </View>
      <View style={s.timeline}>
        {[{label:'WEEK 1',title:'Breaking the Pattern',desc:'Identify triggers · Emergency tools'},
          {label:'WEEK 4',title:'Building New Habits',desc:'Streak momentum · Daily devotionals'},
          {label:'WEEK 8',title:'Lasting Freedom',desc:'Full accountability · Community support'}
        ].map((item,i)=>(
          <View key={i} style={s.timelineItem}>
            <View style={s.timelineDotWrap}>
              <View style={s.timelineDot}/>
              {i<2&&<View style={s.timelineLine}/>}
            </View>
            <View style={s.timelineContent}>
              <Text style={s.timelineLabel}>{item.label}</Text>
              <Text style={s.timelineTitle}>{item.title}</Text>
              <Text style={s.timelineDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <GoldButton onPress={next} style={{marginTop:8}}>See Your Scripture →</GoldButton>
    </ScrollView>
  );

  const renderScripture = () => (
    <View style={s.centeredFlex}>
      <View style={s.scriptureCard}>
        <Text style={s.scriptureQuote}>
          "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear."
        </Text>
        <View style={s.scriptureDivider}/>
        <Text style={s.scriptureRef}>1 CORINTHIANS 10:13</Text>
      </View>
      <Text style={[s.darkSub,{textAlign:'center',marginTop:20}]}>
        This verse will anchor you on the hardest days.
      </Text>
      <GoldButton onPress={next} style={{marginTop:28,width:'100%'}}>Continue →</GoldButton>
    </View>
  );

  const renderProfilePreview = () => (
    <View style={s.centeredFlex}>
      <Text style={s.darkTitle}>Your Warrior Profile</Text>
      <Text style={s.darkSub}>This is who you're becoming.</Text>
      <View style={s.profileCard}>
        <View style={s.profileAvatar}>
          <Svg width={52} height={52} viewBox="0 0 52 52">
            <Circle cx={26} cy={20} r={10} stroke={Colors.gold} strokeWidth={2} fill={Colors.goldDim}/>
            <Path d="M8 48c0-10 8-17 18-17s18 7 18 17" stroke={Colors.gold} strokeWidth={2} strokeLinecap="round" fill="none"/>
          </Svg>
        </View>
        <Text style={s.profileName}>{name.trim()||'Warrior'}</Text>
        <View style={s.profileBadge}><Text style={s.profileBadgeText}>DAY 0 · NEW RECRUIT</Text></View>
        <View style={s.profileStats}>
          {[['0','Day Streak'],['0','Best Streak'],['∞','Potential']].map(([val,lbl])=>(
            <View key={lbl} style={s.profileStat}>
              <Text style={s.profileStatVal}>{val}</Text>
              <Text style={s.profileStatLbl}>{lbl}</Text>
            </View>
          ))}
        </View>
      </View>
      <GoldButton onPress={next} style={{marginTop:24,width:'100%'}}>Looks Good →</GoldButton>
    </View>
  );

  const renderFinalCTA = () => (
    <View style={s.centeredFlex}>
      <View style={s.finalGlow}>
        <Svg width={90} height={110} viewBox="0 0 90 110">
          <Circle cx={45} cy={55} r={42} fill={Colors.goldDim}/>
          <Rect x={40} y={4}  width={10} height={68} rx={3} fill={Colors.gold}/>
          <Rect x={14} y={28} width={62} height={10} rx={3} fill={Colors.gold}/>
        </Svg>
      </View>
      <Text style={s.finalTitle}>Your Journey{'\n'}Begins Now</Text>
      <Text style={[s.darkSub,{textAlign:'center'}]}>
        "The battle is real. So is your victory."{'\n'}Stand firm. Shieldo rises with you.
      </Text>
      <View style={s.finalDivider}/>
      <GoldButton onPress={finish} style={{width:'100%'}}>
        {finishing ? <ActivityIndicator color={Colors.black} size="small"/> : 'Begin Your Journey →'}
      </GoldButton>
      {!finishing && (
        <TouchableOpacity onPress={finish} style={{marginTop:16,alignItems:'center'}}>
          <Text style={s.skipText}>I'll set up my profile later</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNonQuizStep = () => {
    if (step === -1) return renderAccountChoice();
    if (step === 0)  return renderLanding();
    if (step === 18) return renderAnalysis();
    if (step === 19) return renderChecklist();
    if (step === 20) return renderFreedomDate();
    if (step === 21) return renderReviewPrompt();
    if (step === 22) return renderEmail();
    if (step === 23) return renderName();
    if (step === 24) return renderPassword();
    if (step === 25) return renderAccountabilityPartner();
    if (step === 26) return renderNotifications();
    if (step === 27) return renderScreenTimePermission();
    if (step === 28) return renderTestimonials();
    if (step === 29) return renderStats();
    if (step === 30) return renderPremium();
    if (step === 31) return renderReady();
    if (step === 32) return renderScripture();
    if (step === 33) return renderProfilePreview();
    return renderFinalCTA();
  };

  // ─── Quiz layout (separate from other screens) ─────────────────────────────
  if (isQuiz) {
    const q = QUIZ[qIdx];

    return (
      <View style={s.root}>
        <MountainBg/>
        {/* Cream-to-pink overlay */}
        <LinearGradient
          colors={['rgba(248,238,220,0.95)','rgba(240,218,220,0.94)','rgba(228,190,202,0.93)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* ── Progress bar (fixed top) ── */}
        <View style={[s.quizTopBar, { paddingTop: insets.top + 8 }]}>
          {/* Back chevron */}
          {step > 1 && (
            <TouchableOpacity onPress={handleBack} style={s.backBtn} hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Text style={s.backChevron}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            {/* Animated progress fill */}
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, progressFillStyle]}>
                <LinearGradient
                  colors={['#C9874E','#A45E31']}
                  start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{flex:1, borderRadius:3}}
                />
                {/* Glow tip at leading edge */}
                <View style={s.progressGlowTip}/>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* ── Animated quiz card ── */}
        <Animated.View style={[s.quizCardWrap, quizCardStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.quizScroll, { paddingBottom: 24 }]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.quizEyebrow}>Question {qIdx + 1} of 17</Text>
            <Text style={s.quizTitle}>{q.q}</Text>

            <View style={s.optionsWrap}>
              {q.opts.map((opt, i) => {
                const isSelected = answers[qIdx] === i;
                const isPulsed   = pulsedIdx === i;
                return (
                  <Animated.View key={i} style={isPulsed ? pulsedCardStyle : undefined}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => selectOption(qIdx, i)}
                      style={[s.optionCard, isSelected && s.optionCardSel]}
                    >
                      <View style={[s.optionBullet, isSelected && s.optionBulletSel]}>
                        {isSelected && <Text style={s.optionCheck}>✓</Text>}
                      </View>
                      <Text style={[s.optionText, isSelected && s.optionTextSel]}>{opt}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>

        {/* ── Continue footer ── */}
        <View style={[s.continueFooter, { paddingBottom: insets.bottom + 16 }]}>
          <Animated.View style={[s.continueBtn, continueBtnStyle, hasAnswer && s.continueBtnShadow]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={handleContinue}
              disabled={!hasAnswer}
              activeOpacity={0.85}
            />
            <Text style={[s.continueBtnLabel, !hasAnswer && s.continueBtnLabelInactive]}>
              Continue
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ─── Non-quiz screens ──────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <MountainBg/>

      {/* Back button (post-quiz input screens) */}
      {step >= 22 && step <= 25 && (
        <TouchableOpacity
          style={[s.backBtn, s.backBtnDark, {top: insets.top + 14}]}
          onPress={() => setStep(p => Math.max(p-1,0))}
          hitSlop={{top:12,bottom:12,left:12,right:12}}
        >
          <Text style={s.backChevronLight}>‹</Text>
        </TouchableOpacity>
      )}

      <View style={[s.content, {
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }]}>
        {renderNonQuizStep()}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: 22 },
  centeredFlex: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Quiz layout ──
  quizTopBar: {
    paddingHorizontal: 22,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  quizCardWrap: {
    flex: 1,
    paddingHorizontal: 22,
  },

  // ── Progress bar ──
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(45,16,96,0.18)',
    borderRadius: 3,
    // no overflow hidden — allows glow tip to peek outside
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'visible',
    minWidth: 6,
  },
  progressGlowTip: {
    position: 'absolute',
    right: -5,
    top: '50%',
    marginTop: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 4,
  },
  // ── Back button ──
  backBtn: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -2,
  },
  backBtnDark: {
    position: 'absolute', left: 18, zIndex: 20,
  },
  backChevron: {
    fontSize: 30, color: '#2D1060', lineHeight: 34,
  },
  backChevronLight: {
    fontSize: 30, color: Colors.gold, lineHeight: 34,
  },

  // ── Continue footer ──
  continueFooter: {
    paddingHorizontal: 22,
    paddingTop: 10,
    backgroundColor: 'rgba(248,238,220,0.60)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(45,16,96,0.12)',
  },
  continueBtn: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  continueBtnShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  continueBtnLabel: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  continueBtnLabelInactive: {
    color: 'rgba(255,255,255,0.28)',
  },

  // ── Quiz content ──
  quizScroll: { paddingTop: 4 },
  quizEyebrow: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 9, letterSpacing: 3,
    color: '#7A3AAE', textTransform: 'uppercase', marginBottom: 10,
  },
  quizTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 20, letterSpacing: 0.5,
    color: '#1A0A3D', lineHeight: 30, marginBottom: 24,
  },
  optionsWrap: { gap: 10, paddingHorizontal: 2 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 2,
    borderColor: 'rgba(45,16,96,0.10)',
    borderRadius: 16, padding: 14,
  },
  optionCardSel: {
    backgroundColor: 'rgba(184,111,58,0.08)',
    borderColor: Colors.gold,
  },
  optionBullet: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: 'rgba(90,42,144,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionBulletSel: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  optionCheck: { fontSize: 12, color: '#fff', fontFamily: 'Cinzel_700Bold' },
  optionText: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 14, color: '#2D1060', flex: 1, lineHeight: 20,
  },
  optionTextSel: { color: '#2B1810', fontFamily: 'CrimsonPro_600SemiBold' },

  // ── Landing ──
  landingIconWrap: {
    width: 86,
    height: 104,
    borderRadius: 28,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(184,111,58,0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  logoText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 31, letterSpacing: 4, color: '#111111', textAlign: 'center',
  },
  tagline: {
    fontFamily: 'CrimsonPro_400Regular_Italic',
    fontSize: 15, color: ONBOARDING_TEXT_MUTED, marginTop: 8, textAlign: 'center',
  },
  // ── Gold buttons ──
  btnGoldWrap: {
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  btnGold: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(184,111,58,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnGoldText: {
    fontFamily: 'Cinzel_700Bold', fontSize: 12, letterSpacing: 1.2, color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  btnContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.92,
  },
  btnOutline: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'rgba(10,10,10,0.14)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.78)',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontFamily: 'Cinzel_700Bold', fontSize: 12, letterSpacing: 1.15, color: '#111111',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  skipText: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 13,
    color: ONBOARDING_TEXT_MUTED, textDecorationLine: 'underline',
  },

  // ── Analysis ──
  analysisBadge: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: Colors.goldBorder,
    backgroundColor: Colors.goldDim,
    alignItems: 'center', justifyContent: 'center',
  },
  darkTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 22, letterSpacing: 1,
    color: Colors.white, textAlign: 'center', marginBottom: 8,
  },
  darkSub: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 14,
    color: ONBOARDING_TEXT_SECONDARY, textAlign: 'center', lineHeight: 22,
  },
  analysisTracks: { width: '100%', marginTop: 32, marginBottom: 12 },
  analysisTrack: {
    height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 3, overflow: 'hidden',
  },
  analysisFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },
  analysisHint: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 12,
    color: ONBOARDING_TEXT_MUTED, textAlign: 'center', marginTop: 10,
  },

  // ── Checklist ──
  checklistWrap: { width: '100%', marginTop: 28, gap: 14 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checklistCircle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  checklistCircleDone: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  checklistCheckmark: { fontSize: 12, color: '#0A0520', fontFamily: 'Cinzel_700Bold' },
  checklistText: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: ONBOARDING_TEXT_MUTED, flex: 1,
  },

  // ── Input screens ──
  inputCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  inputCardEyebrow: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 3, color: Colors.gold, marginBottom: 8,
  },
  inputCardTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 22, letterSpacing: 0.5,
    color: Colors.white, lineHeight: 32, marginBottom: 8,
  },
  inputCardSub: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 13,
    color: ONBOARDING_TEXT_MUTED, lineHeight: 20, marginBottom: 18,
  },
  input: {
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'CrimsonPro_400Regular', fontSize: 15, color: Colors.white,
  },
  pwWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pwToggle: { paddingHorizontal: 10, paddingVertical: 14 },
  pwToggleText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.gold },
  privacyNote: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 11,
    color: ONBOARDING_TEXT_MUTED, textAlign: 'center', marginTop: 14,
  },
  partnerPrivacyNote: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 12,
    color: ONBOARDING_TEXT_MUTED,
    lineHeight: 18,
    marginTop: 12,
  },

  // ── Freedom date + review ──
  freedomDate: {
    fontFamily: 'CinzelDecorative_700Bold',
    fontSize: 31,
    color: Colors.gold,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  freedomTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 24,
    letterSpacing: 1,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 34,
  },
  freedomCard: {
    width: '100%',
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  freedomCardText: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: ONBOARDING_TEXT_SECONDARY,
    textAlign: 'center',
  },
  reviewIcon: {
    width: 112,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldDim,
    borderWidth: 1.5,
    borderColor: Colors.goldBorder,
    marginBottom: 24,
  },
  reviewStars: {
    color: Colors.gold,
    fontSize: 17,
    letterSpacing: 2,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  legalLink: {
    fontFamily: 'Cinzel_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.gold,
  },
  legalDivider: {
    color: ONBOARDING_TEXT_MUTED,
    fontSize: 10,
  },

  // ── Notifications ──
  notifIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.goldDim,
    borderWidth: 1.5, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  notifBullets: { width: '100%', gap: 14, marginTop: 24, marginBottom: 32 },
  notifBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold, marginTop: 6 },
  notifBulletTitle: { fontFamily: 'Cinzel_600SemiBold', fontSize: 12, letterSpacing: 0.5, color: Colors.white },
  notifBulletDesc: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: ONBOARDING_TEXT_MUTED, marginTop: 2 },

  // ── Testimonials ──
  testimonialCard: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1.5, borderColor: Colors.goldBorder,
    borderRadius: 20, padding: 24, marginTop: 20, marginBottom: 20, width: '100%',
  },
  testimonialBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.gold,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  testimonialBadgeText: { fontFamily: 'Cinzel_700Bold', fontSize: 9, letterSpacing: 2, color: '#0A0520' },
  testimonialQuote: {
    fontFamily: 'CrimsonPro_400Regular_Italic', fontSize: 15, color: ONBOARDING_TEXT_SECONDARY, lineHeight: 26,
  },
  testimonialName: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 11, letterSpacing: 1, color: Colors.gold, marginTop: 14,
  },
  testimonialDots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  testimonialDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(0,0,0,0.16)' },
  testimonialDotActive: { backgroundColor: Colors.gold, width: 18 },

  // ── Stats ──
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  statNum: { fontFamily: 'Cinzel_700Bold', fontSize: 22, letterSpacing: 1, color: Colors.gold },
  statLabel: {
    fontFamily: 'CrimsonPro_400Regular', fontSize: 12,
    color: ONBOARDING_TEXT_MUTED, textAlign: 'center', marginTop: 4, lineHeight: 17,
  },

  // ── Premium ──
  revenueCatCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
  },
  revenueCatTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 18,
    color: Colors.gold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  revenueCatSub: {
    fontFamily: 'CrimsonPro_400Regular',
    fontSize: 13,
    color: ONBOARDING_TEXT_SECONDARY,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  planGrid: {
    width: '100%',
    gap: 10,
    marginTop: 14,
  },
  planCard: {
    width: '100%',
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(10,10,10,0.12)',
    backgroundColor: 'rgba(255,255,255,0.82)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  paywallButtonContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  planTitleWrap: {
    flex: 1,
    paddingRight: 8,
    gap: 4,
  },
  planTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
    color: '#111111',
  },
  planBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(184,111,58,0.42)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(184,111,58,0.10)',
    fontFamily: 'Cinzel_700Bold',
    fontSize: 8,
    letterSpacing: 0.9,
    color: Colors.gold,
    textTransform: 'uppercase',
  },
  planPrice: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 14,
    color: Colors.gold,
    marginRight: 10,
  },
  planDuration: {
    width: 70,
    fontFamily: 'CrimsonPro_600SemiBold',
    fontSize: 12,
    color: '#111111',
    textAlign: 'right',
  },
  reloadProductsButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reloadProductsText: {
    fontFamily: 'CrimsonPro_600SemiBold',
    fontSize: 13,
    color: '#111111',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  devSkipButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.45)',
    backgroundColor: 'rgba(192,57,43,0.10)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  devSkipText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.crimson,
  },

  // ── Ready ──
  readyScroll: { paddingTop: 8, paddingBottom: 24, alignItems: 'center' },
  readyIconWrap: { marginBottom: 20 },
  readyEyebrow: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 3,
    color: Colors.gold, marginBottom: 8,
  },
  readyTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 28, letterSpacing: 1.5,
    color: Colors.white, textAlign: 'center', lineHeight: 38, marginBottom: 24,
  },
  readyMessageCard: {
    borderWidth: 2, borderColor: Colors.gold, borderRadius: 18,
    backgroundColor: Colors.goldDim, padding: 22,
    marginHorizontal: 4, marginBottom: 28,
  },
  readyMessage: {
    fontFamily: 'Cinzel_700Bold', fontSize: 16, letterSpacing: 0.5,
    color: Colors.white, textAlign: 'center', lineHeight: 26,
  },
  timeline: { width: '100%', marginBottom: 24 },
  timelineItem: { flexDirection: 'row', gap: 16 },
  timelineDotWrap: { alignItems: 'center', width: 14 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.gold, marginTop: 3 },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.goldBorder, marginTop: 4, minHeight: 32 },
  timelineContent: { flex: 1, paddingBottom: 24 },
  timelineLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.gold },
  timelineTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 14, letterSpacing: 0.5, color: Colors.white, marginTop: 2 },
  timelineDesc: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: ONBOARDING_TEXT_MUTED, marginTop: 2 },

  // ── Scripture ──
  scriptureCard: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, padding: 26, width: '100%',
  },
  scriptureQuote: {
    fontFamily: 'CrimsonPro_400Regular_Italic', fontSize: 17,
    color: ONBOARDING_TEXT_SECONDARY, lineHeight: 30, textAlign: 'center',
  },
  scriptureDivider: {
    width: 32, height: 1, backgroundColor: Colors.goldBorder,
    alignSelf: 'center', marginVertical: 16,
  },
  scriptureRef: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 3,
    color: Colors.gold, textAlign: 'center',
  },

  // ── Profile preview ──
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1.5, borderColor: Colors.goldBorder,
    borderRadius: 20, padding: 24, width: '100%', alignItems: 'center',
  },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.goldDim,
    borderWidth: 2, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileName: {
    fontFamily: 'Cinzel_700Bold', fontSize: 20, letterSpacing: 1, color: Colors.white, marginBottom: 8,
  },
  profileBadge: {
    backgroundColor: Colors.goldDim, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.goldBorder, marginBottom: 20,
  },
  profileBadgeText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.gold },
  profileStats: { flexDirection: 'row', gap: 20 },
  profileStat: { alignItems: 'center' },
  profileStatVal: { fontFamily: 'Cinzel_700Bold', fontSize: 20, color: Colors.gold },
  profileStatLbl: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: ONBOARDING_TEXT_MUTED, marginTop: 2 },

  // ── Final CTA ──
  finalGlow: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.goldDim,
    borderWidth: 1.5, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  finalTitle: {
    fontFamily: 'Cinzel_700Bold', fontSize: 28, letterSpacing: 1.5,
    color: Colors.white, textAlign: 'center', lineHeight: 38, marginBottom: 16,
  },
  finalDivider: { width: 40, height: 1, backgroundColor: Colors.goldBorder, marginVertical: 24 },
});
