import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Linking, Alert, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Card, GoldBtn, CrimsonBtn, Eyebrow } from '../components/UI';
import { Colors } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';

// ── DNS mobileconfig templates ────────────────────────────────────────────────

const ADULT_DNS_PROFILE = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>Plain</string>
        <key>Servers</key>
        <array>
          <string>208.67.222.123</string>
          <string>208.67.220.123</string>
        </array>
        <key>SearchDomains</key>
        <array/>
      </dict>
      <key>PayloadDescription</key>
      <string>Blocks adult content via OpenDNS FamilyShield</string>
      <key>PayloadDisplayName</key>
      <string>LustLock Adult Content Filter</string>
      <key>PayloadIdentifier</key>
      <string>com.lustlock.dns.adult</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>A1B2C3D4-E5F6-7890-ABCD-EF1234567890</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Blocks 1M+ adult and pornographic domains at the DNS level. Cannot be bypassed by clearing browser history.</string>
  <key>PayloadDisplayName</key>
  <string>LustLock — Covenant DNS Shield</string>
  <key>PayloadIdentifier</key>
  <string>com.lustlock.profile.adult</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>B2C3D4E5-F6A7-8901-BCDE-F12345678901</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;

const SOCIAL_DNS_PROFILE = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>Plain</string>
        <key>Servers</key>
        <array>
          <string>208.67.222.123</string>
          <string>208.67.220.123</string>
        </array>
        <key>ServerAddresses</key>
        <array>
          <string>208.67.222.123</string>
          <string>208.67.220.123</string>
        </array>
      </dict>
      <key>PayloadDescription</key>
      <string>Blocks social media and adult content</string>
      <key>PayloadDisplayName</key>
      <string>LustLock Social + Adult Filter</string>
      <key>PayloadIdentifier</key>
      <string>com.lustlock.dns.social</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>C3D4E5F6-A7B8-9012-CDEF-123456789012</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Blocks adult content and enables social media time restrictions via Screen Time.</string>
  <key>PayloadDisplayName</key>
  <string>LustLock — Social Media Shield</string>
  <key>PayloadIdentifier</key>
  <string>com.lustlock.profile.social</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>D4E5F6A7-B8C9-0123-DEFA-234567890123</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;

// ── Shield group definitions ──────────────────────────────────────────────────

export interface ShieldGroup {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  domains: string[];
  apps: string[];
  iosProfile: string | null;    // mobileconfig XML
  androidAction: string | null; // deep link
  color: string;
}

export const SHIELD_GROUPS: ShieldGroup[] = [
  {
    key: 'adult',
    title: 'Adult Content Block',
    subtitle: 'DNS-level — blocks 1M+ sites',
    description: 'Installs a device-wide DNS filter that blocks pornographic and adult websites before they ever load. Works across ALL browsers — Safari, Chrome, Firefox.',
    domains: [
      'pornhub.com', 'xvideos.com', 'xhamster.com', 'redtube.com',
      'youporn.com', 'tube8.com', 'spankbang.com', 'xnxx.com',
      'onlyfans.com', 'chaturbate.com', '+ 1,000,000 more',
    ],
    apps: [],
    iosProfile: ADULT_DNS_PROFILE,
    androidAction: 'android.settings.WIRELESS_SETTINGS',
    color: Colors.crimson,
  },
  {
    key: 'social',
    title: 'Social Media Lockdown',
    subtitle: 'Screen Time limits — app & web',
    description: 'Sets strict time limits on social media apps and sites. These platforms are engineered to trigger the same dopamine loops as pornography.',
    domains: [
      'instagram.com', 'tiktok.com', 'twitter.com / x.com',
      'reddit.com', 'snapchat.com', 'facebook.com',
    ],
    apps: ['Instagram', 'TikTok', 'Twitter / X', 'Reddit', 'Snapchat', 'Facebook'],
    iosProfile: null,
    androidAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
    color: Colors.gold,
  },
  {
    key: 'gaming',
    title: 'Gaming Distraction Block',
    subtitle: 'Screen Time limits — idle time',
    description: 'Idle gaming is a gateway trigger. Limits casual gaming apps that waste time and lower your guard.',
    domains: ['miniclip.com', 'poki.com', 'y8.com', 'crazygames.com'],
    apps: ['Roblox', 'Clash of Clans', 'Candy Crush', 'Mobile Games'],
    iosProfile: null,
    androidAction: null,
    color: Colors.white2,
  },
  {
    key: 'full',
    title: 'Full Covenant Shield',
    subtitle: 'All protections — maximum armor',
    description: 'Activates every available shield. DNS content filter + Screen Time limits on all distraction apps. The strongest protection LustLock offers.',
    domains: ['Everything above combined'],
    apps: ['All social + gaming apps'],
    iosProfile: ADULT_DNS_PROFILE,
    androidAction: null,
    color: Colors.gold,
  },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShieldIcon({ color = Colors.white, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L4 7v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V7L12 3z"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </Svg>
  );
}
function CheckIcon({ color = Colors.gold }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function LockIcon({ size = 14, color = Colors.white3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5"/>
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}
function GlobeIcon({ color = Colors.white3 }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
      <Path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}
function PhoneIcon({ color = Colors.white3 }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.5"/>
      <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

function GroupCard({
  group, active, onToggle,
}: {
  group: ShieldGroup; active: boolean; onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = active ? group.color : Colors.border;

  return (
    <Card style={{ borderWidth: 1, borderColor, marginBottom: 12 }} padding={0}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setExpanded(e => !e)}>
        <View style={gc.header}>
          <View style={[gc.iconBox, { backgroundColor: active ? `${group.color}20` : Colors.surfaceAlt }]}>
            <ShieldIcon color={active ? group.color : Colors.white3} size={20}/>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[gc.title, active && { color: group.color }]}>{group.title}</Text>
            <Text style={gc.sub}>{group.subtitle}</Text>
          </View>
          <View style={[gc.toggle, { backgroundColor: active ? group.color : Colors.surfaceAlt, borderColor: active ? group.color : Colors.border }]}>
            <View style={[gc.thumb, { left: active ? 20 : 3 }]}/>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={gc.body}>
          <Text style={gc.desc}>{group.description}</Text>

          {group.domains.length > 0 && (
            <>
              <View style={gc.tagRow}>
                <GlobeIcon color={Colors.white3}/>
                <Text style={gc.tagLabel}>WEBSITES BLOCKED</Text>
              </View>
              <View style={gc.chipWrap}>
                {group.domains.map(d => (
                  <View key={d} style={gc.chip}>
                    <Text style={gc.chipText}>{d}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {group.apps.length > 0 && (
            <>
              <View style={[gc.tagRow, { marginTop: 12 }]}>
                <PhoneIcon color={Colors.white3}/>
                <Text style={gc.tagLabel}>APPS LIMITED</Text>
              </View>
              <View style={gc.chipWrap}>
                {group.apps.map(a => (
                  <View key={a} style={gc.chip}>
                    <Text style={gc.chipText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ marginTop: 16 }}>
            {active ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onToggle}
                style={[gc.actionBtn, { borderColor: Colors.crimson }]}
              >
                <Text style={[gc.actionBtnText, { color: Colors.crimson }]}>REMOVE SHIELD</Text>
              </TouchableOpacity>
            ) : (
              <GoldBtn onPress={onToggle}>ACTIVATE SHIELD →</GoldBtn>
            )}
          </View>
        </View>
      )}
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ShieldScreen() {
  const insets = useSafeAreaInsets();
  const { activeShields, setShieldActive } = useAppStore();
  const [permModal, setPermModal] = useState(false);
  const [pendingGroup, setPendingGroup] = useState<ShieldGroup | null>(null);
  const [installing, setInstalling] = useState(false);

  const totalActive = activeShields.length;

  const requestAndActivate = (group: ShieldGroup) => {
    setPendingGroup(group);
    setPermModal(true);
  };

  const confirmActivate = async () => {
    if (!pendingGroup) return;
    setPermModal(false);
    setInstalling(true);

    try {
      if (Platform.OS === 'ios') {
        if (pendingGroup.iosProfile) {
          // Write mobileconfig and share for installation as Configuration Profile
          const file = new File(Paths.document, `lustlock-${pendingGroup.key}.mobileconfig`);
          file.write(pendingGroup.iosProfile);
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(file.uri, {
              mimeType: 'application/x-apple-aspen-config',
              UTI: 'com.apple.mobileconfig',
              dialogTitle: `Install ${pendingGroup.title}`,
            });
          }
        }

        if (!pendingGroup.iosProfile || pendingGroup.key === 'social' || pendingGroup.key === 'gaming' || pendingGroup.key === 'full') {
          // Guide to Screen Time for app limits
          setTimeout(() => {
            Alert.alert(
              'Open Screen Time',
              'To block apps like Instagram and TikTok, enable Screen Time and add App Limits.\n\nWe\'ll take you there now.',
              [
                { text: 'Open Settings', onPress: () => Linking.openURL('App-Prefs:SCREENTIME') },
                { text: 'Later', style: 'cancel' },
              ]
            );
          }, 500);
        }
      } else {
        // Android — guide to Digital Wellbeing
        Alert.alert(
          'Android Setup',
          'Use Digital Wellbeing to set app timers and block websites.\n\nGo to Settings → Digital Wellbeing & Parental Controls → App Timers.',
          [
            { text: 'Open Settings', onPress: () => Linking.openURL('android.settings.ACTION_APPLICATION_SETTINGS') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }

      setShieldActive(pendingGroup.key, true);
      // Also activate adult shield if full shield selected
      if (pendingGroup.key === 'full') {
        setShieldActive('adult', true);
        setShieldActive('social', true);
        setShieldActive('gaming', true);
      }
    } catch (e) {
      Alert.alert('Setup Error', 'Could not install the shield. Please try again.');
    } finally {
      setInstalling(false);
      setPendingGroup(null);
    }
  };

  const deactivate = (group: ShieldGroup) => {
    Alert.alert(
      'Remove Shield?',
      `This will mark ${group.title} as inactive. To fully remove the DNS filter you must go to Settings → General → VPN & Device Management and delete the LustLock profile.`,
      [
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setShieldActive(group.key, false);
            if (group.key === 'full') {
              setShieldActive('adult', false);
              setShieldActive('social', false);
              setShieldActive('gaming', false);
            }
          },
        },
        { text: 'Keep It', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 40, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity activeOpacity={0.75} onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>

        <Eyebrow>{totalActive > 0 ? `${totalActive} SHIELD${totalActive > 1 ? 'S' : ''} ACTIVE` : 'PROTECTION DISABLED'}</Eyebrow>
        <Text style={styles.title}>Covenant Shield</Text>
        <Text style={styles.sub}>
          Block the content that steals your focus — at the network level. Shields activate across every browser and app on your device.
        </Text>

        {/* Status banner */}
        <Card
          style={{ borderWidth: 1, borderColor: totalActive > 0 ? Colors.goldBorder : Colors.border, marginBottom: 24 }}
          padding={16}
        >
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: totalActive > 0 ? Colors.gold : Colors.white3 }]}/>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, totalActive > 0 && { color: Colors.gold }]}>
                {totalActive > 0 ? 'Shield Active' : 'No Shield Installed'}
              </Text>
              <Text style={styles.statusSub}>
                {totalActive > 0
                  ? `${totalActive} protection layer${totalActive > 1 ? 's' : ''} running on this device`
                  : 'Tap a shield below to activate protection'}
              </Text>
            </View>
            <ShieldIcon color={totalActive > 0 ? Colors.gold : Colors.white3} size={28}/>
          </View>
        </Card>

        {/* How it works */}
        <View style={styles.howRow}>
          {[
            { n: '1', l: 'Choose a shield group below' },
            { n: '2', l: 'Approve the system prompt' },
            { n: '3', l: 'Protection runs device-wide' },
          ].map(s => (
            <View key={s.n} style={styles.howStep}>
              <View style={styles.howNum}><Text style={styles.howNumText}>{s.n}</Text></View>
              <Text style={styles.howLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>CHOOSE YOUR SHIELDS</Text>

        {SHIELD_GROUPS.map(group => (
          <GroupCard
            key={group.key}
            group={group}
            active={activeShields.includes(group.key)}
            onToggle={() =>
              activeShields.includes(group.key)
                ? deactivate(group)
                : requestAndActivate(group)
            }
          />
        ))}

        {/* iOS note */}
        {Platform.OS === 'ios' && (
          <View style={styles.noteBox}>
            <LockIcon size={12} color={Colors.white3}/>
            <Text style={styles.noteText}>
              DNS shields install as Configuration Profiles (Settings → General → VPN &amp; Device Management). Website blocking works on all browsers — not just Safari.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Permission modal */}
      <Modal visible={permModal} transparent animationType="slide" onRequestClose={() => setPermModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPermModal(false)}/>
        {pendingGroup && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={[styles.sheetIcon, { backgroundColor: `${pendingGroup.color}18` }]}>
              <ShieldIcon color={pendingGroup.color} size={28}/>
            </View>
            <Text style={styles.sheetTitle}>Activate Shield?</Text>
            <Text style={styles.sheetGroup}>{pendingGroup.title}</Text>
            <Text style={styles.sheetDesc}>
              {Platform.OS === 'ios'
                ? pendingGroup.iosProfile
                  ? 'iOS will ask you to install a Configuration Profile. This enables DNS-level content filtering across your entire device. You can remove it in Settings → General → VPN & Device Management.'
                  : 'We\'ll open Screen Time so you can set app limits. Choose the apps you want to block and set a time limit of 1 minute/day.'
                : 'We\'ll guide you to Digital Wellbeing to configure app timers and restrictions.'}
            </Text>

            <View style={styles.permRow}>
              {[
                { icon: '🔐', t: 'System-level blocking' },
                { icon: '🌐', t: 'All browsers covered' },
                { icon: '🚫', t: 'Cannot be bypassed' },
              ].map(p => (
                <View key={p.t} style={styles.permItem}>
                  <Text style={styles.permEmoji}>{p.icon}</Text>
                  <Text style={styles.permLabel}>{p.t}</Text>
                </View>
              ))}
            </View>

            <GoldBtn onPress={confirmActivate}>
              {installing ? 'Setting Up...' : 'Allow & Install Shield'}
            </GoldBtn>
            <View style={{ height: 10 }}/>
            <TouchableOpacity activeOpacity={0.75} onPress={() => setPermModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>NOT NOW</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const gc = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 13, letterSpacing: 0.5, color: Colors.white },
  sub: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, marginTop: 2 },
  toggle: {
    width: 44, height: 26, borderRadius: 13, borderWidth: 1,
    position: 'relative', justifyContent: 'center',
  },
  thumb: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.white,
  },
  body: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  desc: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: Colors.white2, lineHeight: 20, marginTop: 12, marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 6 },
  tagLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 8, letterSpacing: 2, color: Colors.white3 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.surfaceAlt, borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  chipText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: Colors.white2 },
  actionBtn: { borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2 },
});

const styles = StyleSheet.create({
  back: { marginBottom: 16 },
  backText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2, color: Colors.gold },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1, color: Colors.white, marginTop: 4, marginBottom: 6 },
  sub: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white3, lineHeight: 22, marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  statusTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 14, letterSpacing: 0.5, color: Colors.white },
  statusSub: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, marginTop: 2 },
  howRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  howStep: { flex: 1, alignItems: 'center', gap: 6 },
  howNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.goldBorder, alignItems: 'center', justifyContent: 'center' },
  howNumText: { fontFamily: 'Cinzel_700Bold', fontSize: 11, color: Colors.gold },
  howLabel: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: Colors.white3, textAlign: 'center', lineHeight: 15 },
  sectionLabel: {
    fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 2,
    color: Colors.white3, textTransform: 'uppercase', marginBottom: 12,
  },
  noteBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginTop: 8, padding: 14,
    backgroundColor: Colors.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  noteText: { flex: 1, fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, lineHeight: 18 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
  },
  sheetIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' },
  sheetTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 20, color: Colors.white, textAlign: 'center' },
  sheetGroup: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11, letterSpacing: 2, color: Colors.gold, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  sheetDesc: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white2, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  permRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  permItem: { alignItems: 'center', gap: 4, flex: 1 },
  permEmoji: { fontSize: 22 },
  permLabel: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: Colors.white3, textAlign: 'center' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 2, color: Colors.white3 },
});
