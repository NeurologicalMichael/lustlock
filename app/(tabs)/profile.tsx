import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import RevenueCatUI from 'react-native-purchases-ui';
import { useAppStore } from '../../store/useAppStore';
import { ShieldoComponent, getTierFromDays } from '../../components/Shieldo';
import { Card, Toggle, Eyebrow } from '../../components/UI';
import { Colors } from '../../constants/colors';
import { checkSubscriptionStatus, isInitialized } from '../../lib/purchases';

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
    notifDaily, notifCheckin, notifStreak,
    setUserProfile, setNotifPref, setIsPro,
  } = useAppStore();

  const [editModal, setEditModal] = useState(false);
  const [draftName, setDraftName] = useState(userName);
  const [draftTagline, setDraftTagline] = useState(userTagline);
  const [draftScripture, setDraftScripture] = useState(covenantScripture);
  const [draftFighting, setDraftFighting] = useState<string[]>(fightingFor);

  const tier = getTierFromDays(globalStreakDays);

  const joinYear = joinDate ? new Date(joinDate).getFullYear() : new Date().getFullYear();

  function openEdit() {
    setDraftName(userName);
    setDraftTagline(userTagline);
    setDraftScripture(covenantScripture);
    setDraftFighting([...fightingFor]);
    setEditModal(true);
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
              <ShieldoComponent state={tier} size={52} showLabel={false} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroName}>{userName || 'Warrior'}</Text>
              {userTagline ? (
                <Text style={s.heroTagline}>{userTagline}</Text>
              ) : (
                <Text style={[s.heroTagline, { color: Colors.white3 }]}>Add a motto...</Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <View style={s.tierBadge}>
                  <Text style={s.tierBadgeText}>{tier.toUpperCase()} TIER</Text>
                </View>
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
            onPress={() => router.push('/shield')}
            first last
          />
        </View>

        {/* Notifications */}
        <View style={s.px}>
          <SectionLabel>Notifications</SectionLabel>
          {([
            { key: 'notifDaily'   as const, label: 'Daily check-in',     sub: '8:00 PM each evening' },
            { key: 'notifCheckin' as const, label: 'Brotherhood alerts',  sub: 'When a partner reaches out' },
            { key: 'notifStreak'  as const, label: 'Streak milestones',   sub: '7, 14, 30, 60, 90 days' },
          ]).map(({ key, label, sub }, i, arr) => (
            <View
              key={key}
              style={[s.row, i === 0 && s.rowFirst, i === arr.length - 1 && s.rowLast, i < arr.length - 1 && s.rowBorder]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={s.rowSub}>{sub}</Text>
              </View>
              <Toggle
                on={key === 'notifDaily' ? notifDaily : key === 'notifCheckin' ? notifCheckin : notifStreak}
                onToggle={() => setNotifPref(key, !(key === 'notifDaily' ? notifDaily : key === 'notifCheckin' ? notifCheckin : notifStreak))}
              />
            </View>
          ))}
        </View>

        {/* App */}
        <View style={s.px}>
          <SectionLabel>App</SectionLabel>
          <Row label="Version" value="1.0.0" first />
          <Row label="Privacy Policy" onPress={() => {}} />
          <Row label="Terms of Service" onPress={() => {}} last />
        </View>

        {/* Sign out */}
        <View style={s.px}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={s.signOutBtn}
            onPress={() => Alert.alert('Sign Out', 'Sign out and clear all data?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: () => {} },
            ])}
          >
            <Text style={s.signOutText}>SIGN OUT</Text>
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
    </>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  px: { paddingHorizontal: 16, marginBottom: 12 },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1, color: Colors.white, marginTop: 4, marginBottom: 10 },

  heroCard: { borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceAlt, borderWidth: 2, borderColor: Colors.goldBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroName: { fontFamily: 'Cinzel_700Bold', fontSize: 18, color: Colors.white },
  heroTagline: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white2, marginTop: 2 },
  tierBadge: { backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.goldBorder, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  tierBadgeText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 1.5, color: Colors.gold },
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

  signOutBtn: { borderWidth: 1, borderColor: 'rgba(192,57,43,0.30)', borderRadius: 999, padding: 14, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  signOutText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11, letterSpacing: 2, color: 'rgba(192,57,43,0.80)' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 14, letterSpacing: 1, color: Colors.white },
  modalCancel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11, letterSpacing: 1, color: Colors.white3 },
  modalSave: { fontFamily: 'Cinzel_700Bold', fontSize: 11, letterSpacing: 1, color: Colors.gold },
  fieldLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2, color: Colors.white3, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontFamily: 'CrimsonPro_400Regular', fontSize: 15, color: Colors.white, paddingTop: 14 },
});
