import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import RevenueCatUI from 'react-native-purchases-ui';
import { useAppStore } from '../../store/useAppStore';
import { Card, Toggle, Eyebrow } from '../../components/UI';
import { Colors } from '../../constants/colors';
import { checkSubscriptionStatus, isInitialized } from '../../lib/purchases';
import { deleteCurrentAccount } from '../../lib/auth';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../../constants/legal';
import { syncDailyReminder } from '../../lib/notifications';

const FIGHTING_FOR_OPTIONS = [
  'My marriage', 'My children', 'My faith', 'My mental health',
  'My future spouse', 'My integrity', 'My calling', 'My freedom',
];

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

function Row({ label, value, onPress, last, first }: {
  label: string; value?: string; onPress?: () => void; last?: boolean; first?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[s.row, first && s.rowFirst, last && s.rowLast, !last && s.rowBorder]}
    >
      <Text style={s.rowLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
        {onPress ? <Text style={s.chevron}>›</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    userName, userTagline, joinDate, fightingFor, covenantScripture,
    globalStreakDays, longestGlobalStreak, emergencyCount,
    isPro, activeShields,
    notifDaily, accountabilityPartners,
    setUserProfile, setNotifPref, setIsPro, resetLocalAccount,
    addAccountabilityPartner, removeAccountabilityPartner,
  } = useAppStore();

  const [editModal, setEditModal] = useState(false);
  const [draftName, setDraftName] = useState(userName);
  const [draftTagline, setDraftTagline] = useState(userTagline);
  const [draftScripture, setDraftScripture] = useState(covenantScripture);
  const [draftFighting, setDraftFighting] = useState<string[]>(fightingFor);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [updatingReminder, setUpdatingReminder] = useState(false);
  const [partnerModal, setPartnerModal] = useState(false);
  const [draftPartnerName, setDraftPartnerName] = useState('');
  const [draftPartnerEmail, setDraftPartnerEmail] = useState('');
  const [draftShareStreak, setDraftShareStreak] = useState(true);
  const [draftShareRelapse, setDraftShareRelapse] = useState(false);
  const [draftAlertOnRelapse, setDraftAlertOnRelapse] = useState(false);

  const joinYear = joinDate ? new Date(joinDate).getFullYear() : new Date().getFullYear();
  const avatarInitial = userName.trim().charAt(0).toUpperCase() || 'U';
  const accountabilityPartner = accountabilityPartners[0];

  function openEdit() {
    setDraftName(userName);
    setDraftTagline(userTagline);
    setDraftScripture(covenantScripture);
    setDraftFighting([...fightingFor]);
    setEditModal(true);
  }

  async function openUrl(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again in a moment.');
    }
  }

  function saveEdit() {
    setUserProfile({
      userName: draftName.trim() || 'Warrior',
      userTagline: draftTagline.trim(),
      covenantScripture: draftScripture.trim(),
      fightingFor: draftFighting,
    });
    setEditModal(false);
  }

  function toggleFighting(opt: string) {
    setDraftFighting(prev =>
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    );
  }

  function openPartnerSettings() {
    setDraftPartnerName(accountabilityPartner?.name ?? '');
    setDraftPartnerEmail(accountabilityPartner?.partnerUserId ?? '');
    setDraftShareStreak(accountabilityPartner?.shareStreak ?? true);
    setDraftShareRelapse(accountabilityPartner?.shareRelapse ?? false);
    setDraftAlertOnRelapse(accountabilityPartner?.alertOnRelapse ?? false);
    setPartnerModal(true);
  }

  function savePartnerSettings() {
    const cleanName = draftPartnerName.trim();
    const cleanEmail = draftPartnerEmail.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Complete partner details', 'Enter your partner’s name and a valid email address.');
      return;
    }
    if (accountabilityPartner && accountabilityPartner.partnerUserId !== cleanEmail) {
      removeAccountabilityPartner(accountabilityPartner.partnerUserId);
    }
    addAccountabilityPartner({
      partnerUserId: cleanEmail,
      name: cleanName,
      shareStreak: draftShareStreak,
      shareRelapse: draftShareRelapse,
      alertOnRelapse: draftAlertOnRelapse,
    });
    setPartnerModal(false);
  }

  function removePartner() {
    if (!accountabilityPartner) return;
    Alert.alert(
      'Remove accountability partner?',
      'You can add a trusted partner again at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeAccountabilityPartner(accountabilityPartner.partnerUserId);
            setPartnerModal(false);
          },
        },
      ]
    );
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your LustLock account and clears your local progress, journals, check-ins, posts, streaks, and subscription access from this device. App Store subscriptions must still be cancelled in Apple subscription settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final confirmation',
              'This cannot be undone. Do you want to permanently delete this account now?',
              [
                { text: 'Keep Account', style: 'cancel' },
                { text: 'Delete Forever', style: 'destructive', onPress: deleteAccount },
              ]
            );
          },
        },
      ]
    );
  }

  async function deleteAccount() {
    if (deletingAccount) return;
    setDeletingAccount(true);
    try {
      try {
        await deleteCurrentAccount();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.toLowerCase().includes('auth session missing')) {
          throw error;
        }
      }

      resetLocalAccount();
      Alert.alert(
        'Account deleted',
        'Your account deletion flow is complete on this device. If an active App Store subscription remains, cancel it from Apple subscription settings.',
        [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
      );
    } catch {
      Alert.alert(
        'Deletion unavailable',
        'We could not complete account deletion right now. Please check your connection and try again from Profile → Delete Account.'
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  async function toggleDailyReminder() {
    const next = !notifDaily;
    setUpdatingReminder(true);
    try {
      const scheduled = await syncDailyReminder(next, true);
      setNotifPref('notifDaily', next && scheduled);
      if (next && !scheduled) {
        Alert.alert('Notifications Disabled', 'Enable notifications in iOS Settings to receive the daily reminder.');
      }
    } finally {
      setUpdatingReminder(false);
    }
  }

  return (
    <>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.px}>
          <Eyebrow>Your Journey</Eyebrow>
          <Text style={s.title}>Profile</Text>
        </View>

        {/* Hero card */}
        <View style={s.px}>
          <LinearGradient
            colors={['rgba(240,112,32,0.12)', 'rgba(240,112,32,0.04)', 'transparent']}
            style={s.heroCard}
          >
            <View style={s.avatarRing}>
              <Text style={s.avatarInitial}>{avatarInitial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroName}>{userName || 'Warrior'}</Text>
              {userTagline ? (
                <Text style={s.heroTagline}>{userTagline}</Text>
              ) : (
                <Text style={[s.heroTagline, { color: Colors.white3 }]}>Add a motto...</Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Text style={s.joinText}>Since {joinYear}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openEdit} style={s.editBtn} activeOpacity={0.75}>
              <Text style={s.editText}>EDIT</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={[s.px, s.statsRow]}>
          <StatBox value={globalStreakDays} label="Day Streak" />
          <View style={s.statDivider} />
          <StatBox value={longestGlobalStreak} label="Best Streak" />
          <View style={s.statDivider} />
          <StatBox value={emergencyCount} label="Prayers" />
        </View>

        {/* Fighting For */}
        {fightingFor.length > 0 && (
          <View style={s.px}>
            <SectionLabel>Fighting For</SectionLabel>
            <View style={s.chipRow}>
              {fightingFor.map(f => (
                <View key={f} style={s.chip}>
                  <Text style={s.chipText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Covenant Scripture */}
        {covenantScripture ? (
          <View style={s.px}>
            <SectionLabel>Covenant Scripture</SectionLabel>
            <Card padding={16} style={{ borderWidth: 1, borderColor: Colors.goldBorder }}>
              <Text style={s.scriptureText}>"{covenantScripture}"</Text>
            </Card>
          </View>
        ) : (
          <View style={s.px}>
            <TouchableOpacity onPress={openEdit} activeOpacity={0.75}>
              <Card padding={14} style={{ borderWidth: 1, borderColor: Colors.border }}>
                <Text style={[s.rowLabel, { color: Colors.white3 }]}>+ Add your covenant scripture</Text>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Subscription */}
        <View style={s.px}>
          <SectionLabel>Subscription</SectionLabel>
          <Row
            label="Current Plan"
            value={isPro ? 'Covenant Pro' : 'Free Tier'}
            onPress={() => !isPro && router.push('/paywall')}
            first
          />
          {!isPro && (
            <Row
              label="Upgrade to Covenant Pro"
              value="$7.99/mo"
              onPress={() => router.push('/paywall')}
              last
            />
          )}
          {isPro && (
            <Row label="Manage Subscription" onPress={async () => {
              if (!isInitialized()) return;
              try {
                await RevenueCatUI.presentCustomerCenter();
                const pro = await checkSubscriptionStatus();
                setIsPro(pro);
              } catch {}
            }} last />
          )}
        </View>

        {/* Covenant Shield */}
        <View style={s.px}>
          <SectionLabel>Covenant Shield</SectionLabel>
          <Row
            label="Content Blocking"
            value={activeShields.length > 0 ? `${activeShields.length} active` : 'Off'}
            onPress={() => router.push('/blocker')}
            first last
          />
        </View>

        {/* Notifications */}
        <View style={s.px}>
          <SectionLabel>Notifications</SectionLabel>
          <View style={[s.row, s.rowFirst, s.rowLast, updatingReminder && { opacity: 0.6 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Daily reminder</Text>
              <Text style={s.rowSub}>One private check-in at 8:00 PM</Text>
            </View>
            <Toggle on={notifDaily} onToggle={toggleDailyReminder}/>
          </View>
        </View>

        {/* Accountability */}
        <View style={s.px}>
          <SectionLabel>Accountability</SectionLabel>
          <Row
            label="Accountability Partner"
            value={accountabilityPartner?.name ?? 'Not set'}
            onPress={openPartnerSettings}
            first last
          />
        </View>

        {/* App */}
        <View style={s.px}>
          <SectionLabel>App</SectionLabel>
          <Row label="Version" value="1.0.0" first />
          <Row label="Privacy Policy" onPress={() => openUrl(PRIVACY_POLICY_URL)} />
          <Row label="Terms of Use" onPress={() => openUrl(TERMS_OF_USE_URL)} last />
        </View>

        <View style={s.px}>
          <SectionLabel>Account</SectionLabel>
          <TouchableOpacity
            onPress={confirmDeleteAccount}
            disabled={deletingAccount}
            activeOpacity={0.75}
            style={[s.deleteRow, deletingAccount && { opacity: 0.6 }]}
          >
            <View>
              <Text style={s.deleteLabel}>{deletingAccount ? 'Deleting Account...' : 'Delete Account'}</Text>
              <Text style={s.deleteSub}>Permanently remove your account and app data</Text>
            </View>
            <Text style={s.deleteChevron}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setEditModal(false)} activeOpacity={0.75}>
                <Text style={s.modalCancel}>CANCEL</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={saveEdit} activeOpacity={0.75}>
                <Text style={s.modalSave}>SAVE</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <View>
                <Text style={s.fieldLabel}>DISPLAY NAME</Text>
                <TextInput
                  style={s.input}
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Your warrior name"
                  placeholderTextColor={Colors.white3}
                  autoCapitalize="words"
                  returnKeyType="done"
                  maxLength={40}
                />
              </View>

              {/* Tagline */}
              <View>
                <Text style={s.fieldLabel}>MOTTO / TAGLINE</Text>
                <TextInput
                  style={s.input}
                  value={draftTagline}
                  onChangeText={setDraftTagline}
                  placeholder="e.g. Walking in the light"
                  placeholderTextColor={Colors.white3}
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  maxLength={60}
                />
              </View>

              {/* Scripture */}
              <View>
                <Text style={s.fieldLabel}>COVENANT SCRIPTURE</Text>
                <TextInput
                  style={[s.input, { height: 90, textAlignVertical: 'top' }]}
                  value={draftScripture}
                  onChangeText={setDraftScripture}
                  placeholder="e.g. Flee the evil desires of youth... (2 Tim 2:22)"
                  placeholderTextColor={Colors.white3}
                  autoCapitalize="sentences"
                  multiline
                  maxLength={200}
                />
              </View>

              {/* Fighting For */}
              <View>
                <Text style={s.fieldLabel}>FIGHTING FOR</Text>
                <View style={s.chipRow}>
                  {FIGHTING_FOR_OPTIONS.map(opt => {
                    const selected = draftFighting.includes(opt);
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => toggleFighting(opt)}
                        activeOpacity={0.75}
                        style={[s.chip, selected && s.chipSelected]}
                      >
                        <Text style={[s.chipText, selected && s.chipTextSelected]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Accountability Partner Modal */}
      <Modal visible={partnerModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPartnerModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setPartnerModal(false)} activeOpacity={0.75}>
                <Text style={s.modalCancel}>CANCEL</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Accountability Partner</Text>
              <TouchableOpacity onPress={savePartnerSettings} activeOpacity={0.75}>
                <Text style={s.modalSave}>SAVE</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
              <View>
                <Text style={s.fieldLabel}>TRUSTED PARTNER</Text>
                <Text style={s.modalDescription}>
                  Save one trusted contact for quick support. LustLock will not send messages automatically.
                </Text>
              </View>
              <View>
                <Text style={s.fieldLabel}>NAME</Text>
                <TextInput
                  style={s.input}
                  value={draftPartnerName}
                  onChangeText={setDraftPartnerName}
                  placeholder="Partner name"
                  placeholderTextColor={Colors.white3}
                  autoCapitalize="words"
                  returnKeyType="next"
                  maxLength={60}
                />
              </View>
              <View>
                <Text style={s.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={s.input}
                  value={draftPartnerEmail}
                  onChangeText={setDraftPartnerEmail}
                  placeholder="partner@email.com"
                  placeholderTextColor={Colors.white3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  maxLength={120}
                />
              </View>
              <View>
                <Text style={s.fieldLabel}>SHARING PREFERENCES</Text>
                <View style={s.preferenceGroup}>
                  <PreferenceRow label="Share streak progress" on={draftShareStreak} onToggle={() => setDraftShareStreak(v => !v)} />
                  <PreferenceRow label="Share relapse updates" on={draftShareRelapse} onToggle={() => setDraftShareRelapse(v => !v)} />
                  <PreferenceRow label="Alert partner after relapse" on={draftAlertOnRelapse} onToggle={() => setDraftAlertOnRelapse(v => !v)} last />
                </View>
                <Text style={s.preferenceNote}>These preferences are saved for your accountability setup. Automatic partner alerts require a connected messaging service.</Text>
              </View>
              {accountabilityPartner ? (
                <TouchableOpacity style={s.removePartnerBtn} activeOpacity={0.75} onPress={removePartner}>
                  <Text style={s.removePartnerText}>REMOVE PARTNER</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function PreferenceRow({ label, on, onToggle, last }: {
  label: string; on: boolean; onToggle: () => void; last?: boolean;
}) {
  return (
    <View style={[s.preferenceRow, !last && s.rowBorder]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Toggle on={on} onToggle={onToggle}/>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  px: { paddingHorizontal: 16, marginBottom: 12 },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1, color: Colors.white, marginTop: 4, marginBottom: 10 },

  heroCard: { borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceAlt, borderWidth: 2, borderColor: Colors.goldBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarInitial: { fontFamily: 'Cinzel_700Bold', fontSize: 28, color: Colors.gold },
  heroName: { fontFamily: 'Cinzel_700Bold', fontSize: 18, color: Colors.white },
  heroTagline: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white2, marginTop: 2 },
  joinText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: Colors.white3 },
  editBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  editText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 1, color: Colors.white3 },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingVertical: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'CinzelDecorative_700Bold', fontSize: 22, color: Colors.gold },
  statLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 1.5, color: Colors.white3, marginTop: 3, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: Colors.goldDim, borderColor: Colors.goldBorder },
  chipText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white3 },
  chipTextSelected: { color: Colors.gold },

  scriptureText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 15, color: Colors.white2, fontStyle: 'italic', lineHeight: 24 },

  sectionLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.white3, textTransform: 'uppercase', marginTop: 8, marginBottom: 8 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: Colors.surface },
  rowFirst: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  rowLast: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white },
  rowSub: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: Colors.white3, marginTop: 1 },
  rowValue: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white3 },
  chevron: { color: Colors.white3, fontSize: 18 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 14, letterSpacing: 1, color: Colors.white },
  modalCancel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11, letterSpacing: 1, color: Colors.white3 },
  modalSave: { fontFamily: 'Cinzel_700Bold', fontSize: 11, letterSpacing: 1, color: Colors.gold },
  fieldLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.white3, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontFamily: 'CrimsonPro_400Regular', fontSize: 15, color: Colors.white, paddingTop: 14 },
  modalDescription: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, lineHeight: 21, color: Colors.white2 },
  preferenceGroup: { backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden' },
  preferenceRow: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preferenceNote: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, lineHeight: 18, color: Colors.white3, marginTop: 8 },
  removePartnerBtn: { borderWidth: 1, borderColor: 'rgba(192,57,43,0.35)', borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
  removePartnerText: { fontFamily: 'Cinzel_700Bold', fontSize: 10, letterSpacing: 1.2, color: Colors.crimson },

  deleteRow: {
    backgroundColor: 'rgba(192,57,43,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.35)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteLabel: { fontFamily: 'Cinzel_700Bold', fontSize: 12, letterSpacing: 0.8, color: Colors.crimson },
  deleteSub: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, marginTop: 2 },
  deleteChevron: { color: Colors.crimson, fontSize: 20 },
});
