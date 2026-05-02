import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Modal,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { Toggle } from '../../components/UI';
import { useAppStore } from '../../store/useAppStore';
import { fetchPosts, createPost, toggleReaction, subscribeToFeed, type DBPost } from '../../lib/posts';
import { getCurrentUser } from '../../lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortMode = 'latest' | 'popular';

// ── Bad word filter ───────────────────────────────────────────────────────────

const BAD_WORDS = [
  'fuck','shit','asshole','bitch','bastard','dick','cock',
  'pussy','cunt','whore','slut','faggot','nigger','nigga',
  'retard','motherfucker','fucker','bullshit','jackass',
];

function containsBadWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some(w => new RegExp(`\\b${w}\\b`).test(lower));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  const c = filled ? Colors.crimson : Colors.white3;
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill={filled ? c : 'none'}>
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}
function ShieldIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L4 5v6c0 5.25 3.75 10.15 8 11.4C16.25 21.15 20 16.25 20 11V5z"
        stroke={Colors.gold} strokeWidth="1.8" strokeLinejoin="round"/>
    </Svg>
  );
}
function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke="#0A0520" strokeWidth="2.5" strokeLinecap="round"/>
      <Line x1="5" y1="12" x2="19" y2="12" stroke="#0A0520" strokeWidth="2.5" strokeLinecap="round"/>
    </Svg>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({
  post, onUpvote, onAmen,
}: {
  post: DBPost;
  onUpvote: (id: string) => void;
  onAmen: (id: string) => void;
}) {
  return (
    <View style={card.wrap}>
      <View style={card.header}>
        <View style={card.avatar}>
          {post.is_anonymous
            ? <ShieldIcon/>
            : <Text style={card.initial}>{(post.author_name?.[0] ?? '?').toUpperCase()}</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={card.author}>{post.is_anonymous ? 'Anonymous Warrior' : post.author_name}</Text>
          <Text style={card.time}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>
      <Text style={card.title}>{post.title}</Text>
      <Text style={card.content}>{post.content}</Text>
      <View style={card.divider}/>
      <View style={card.actions}>
        <TouchableOpacity style={card.btn} activeOpacity={0.75} onPress={() => onUpvote(post.id)}>
          <HeartIcon filled={post.upvotedByMe}/>
          <Text style={[card.count, post.upvotedByMe && { color: Colors.crimson }]}>{post.upvotes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.btn} activeOpacity={0.75} onPress={() => onAmen(post.id)}>
          <Text style={[card.amen, post.amenedByMe && card.amenActive]}>🙏</Text>
          <Text style={[card.count, post.amenedByMe && { color: Colors.gold }]}>
            {post.amens} Amen{post.amens !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  initial: { fontFamily: 'Cinzel_700Bold', fontSize: 14, color: Colors.gold },
  author: { fontFamily: 'Cinzel_600SemiBold', fontSize: 11, color: Colors.white },
  time: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: Colors.white3, marginTop: 1 },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 14, color: Colors.white, lineHeight: 21, marginBottom: 8 },
  content: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white2, lineHeight: 22 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  actions: { flexDirection: 'row', gap: 20 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, color: Colors.white3 },
  amen: { fontSize: 14, opacity: 0.55 },
  amenActive: { opacity: 1 },
});

// ── Compose sheet ─────────────────────────────────────────────────────────────

function ComposeSheet({ userName, onClose, onSubmit }: {
  userName: string;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; is_anonymous: boolean; author_name: string | null }) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle]         = useState('');
  const [content, setContent]     = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [hasBadWord, setHasBadWord] = useState(false);
  const [posting, setPosting]     = useState(false);

  const check = useCallback((t: string, c: string) => setHasBadWord(containsBadWord(t + ' ' + c)), []);

  const canPost = title.trim().length > 0 && content.trim().length > 0 && !hasBadWord && !posting;

  const handleSubmit = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        is_anonymous: anonymous,
        author_name: anonymous ? null : (userName || 'Warrior'),
      });
      onClose();
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={compose.kav}>
        <TouchableOpacity style={compose.backdrop} activeOpacity={1} onPress={onClose}/>
        <View style={[compose.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={compose.handle}/>
          <View style={compose.headerRow}>
            <Text style={compose.sheetTitle}>Share with Brothers</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              <Text style={compose.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={compose.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={compose.toggleLabel}>Post Anonymously</Text>
              <Text style={compose.toggleSub}>
                {anonymous ? 'Hidden as "Anonymous Warrior"' : `Shown as "${userName || 'Warrior'}"`}
              </Text>
            </View>
            <Toggle on={anonymous} onToggle={() => setAnonymous(v => !v)}/>
          </View>

          <TextInput
            style={compose.titleInput}
            placeholder="Post title…"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={title}
            onChangeText={t => { setTitle(t); check(t, content); }}
            maxLength={80}
          />
          <TextInput
            style={compose.contentInput}
            placeholder="Share your battle, victory, or prayer request…"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={content}
            onChangeText={c => { setContent(c); check(title, c); }}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={compose.charCount}>{content.length}/500</Text>

          {hasBadWord && (
            <View style={compose.warningRow}>
              <Text style={compose.warningText}>⚠  Inappropriate language detected. Please keep the community respectful.</Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={canPost ? 0.80 : 1}
            onPress={handleSubmit}
            style={[compose.postBtn, !canPost && compose.postBtnOff]}
          >
            {posting
              ? <ActivityIndicator color="#0A0520" size="small"/>
              : <Text style={[compose.postBtnText, !canPost && compose.postBtnTextOff]}>Post to Brotherhood</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const compose = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.60)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderColor: Colors.border, paddingHorizontal: 20, paddingTop: 10,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 16, color: Colors.white },
  closeX: { fontFamily: 'Cinzel_600SemiBold', fontSize: 16, color: Colors.white3 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surfaceAlt, borderRadius: 14, padding: 14, marginBottom: 14 },
  toggleLabel: { fontFamily: 'Cinzel_600SemiBold', fontSize: 12, color: Colors.white },
  toggleSub: { fontFamily: 'CrimsonPro_400Regular', fontSize: 12, color: Colors.white3, marginTop: 2 },
  titleInput: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Cinzel_600SemiBold', fontSize: 13, color: Colors.white, marginBottom: 10 },
  contentInput: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white, minHeight: 100 },
  charCount: { fontFamily: 'CrimsonPro_400Regular', fontSize: 11, color: Colors.white3, textAlign: 'right', marginTop: 4, marginBottom: 10 },
  warningRow: { backgroundColor: 'rgba(192,57,43,0.12)', borderWidth: 1, borderColor: 'rgba(192,57,43,0.30)', borderRadius: 10, padding: 10, marginBottom: 10 },
  warningText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 13, color: '#E07060', lineHeight: 19 },
  postBtn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gold, shadowColor: Colors.gold, shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:12, elevation:6, marginTop:4 },
  postBtnOff: { backgroundColor: Colors.surfaceAlt, shadowOpacity: 0 },
  postBtnText: { fontFamily: 'Cinzel_700Bold', fontSize: 13, letterSpacing: 2, color: '#0A0520' },
  postBtnTextOff: { color: Colors.white3 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BrotherhoodScreen() {
  const insets = useSafeAreaInsets();
  const { userName } = useAppStore();
  const [posts, setPosts]       = useState<DBPost[]>([]);
  const [sort, setSort]         = useState<SortMode>('latest');
  const [composing, setComposing] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchPosts(sort);
      setPosts(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sort]);

  // Initial load + sort change
  useEffect(() => { load(); }, [load]);

  // Real-time subscription
  useEffect(() => {
    const channel = subscribeToFeed(() => load());
    return () => { channel.unsubscribe(); };
  }, [load]);

  const sorted = useMemo(() => (
    [...posts].sort((a, b) =>
      sort === 'latest'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : b.upvotes - a.upvotes
    )
  ), [posts, sort]);

  const handleUpvote = useCallback(async (id: string) => {
    // Optimistic
    setPosts(prev => prev.map(p => p.id !== id ? p : {
      ...p, upvotedByMe: !p.upvotedByMe, upvotes: p.upvotes + (p.upvotedByMe ? -1 : 1),
    }));
    await toggleReaction(id, 'upvote');
  }, []);

  const handleAmen = useCallback(async (id: string) => {
    setPosts(prev => prev.map(p => p.id !== id ? p : {
      ...p, amenedByMe: !p.amenedByMe, amens: p.amens + (p.amenedByMe ? -1 : 1),
    }));
    await toggleReaction(id, 'amen');
  }, []);

  const handleSubmit = useCallback(async (data: Parameters<typeof createPost>[0]) => {
    const newPost = await createPost(data);
    if (newPost) {
      setPosts(prev => [newPost, ...prev]);
    }
  }, []);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>COMMUNITY FEED</Text>
          <Text style={s.title}>Brotherhood</Text>
        </View>
        <View style={s.sortRow}>
          {(['latest', 'popular'] as SortMode[]).map(mode => (
            <TouchableOpacity
              key={mode} activeOpacity={0.75}
              onPress={() => setSort(mode)}
              style={[s.sortPill, sort === mode && s.sortPillActive]}
            >
              <Text style={[s.sortText, sort === mode && s.sortTextActive]}>
                {mode === 'latest' ? 'Latest' : 'Popular'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={Colors.gold} size="large"/>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.gold}/>}
        >
          {sorted.map(post => (
            <PostCard key={post.id} post={post} onUpvote={handleUpvote} onAmen={handleAmen}/>
          ))}
          {sorted.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>No posts yet. Be the first to share.</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={[s.fabWrap, { bottom: insets.bottom + 90 }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => setComposing(true)} style={s.fab}>
          <PlusIcon/>
        </TouchableOpacity>
      </View>

      {composing && (
        <ComposeSheet
          userName={userName || 'Warrior'}
          onClose={() => setComposing(false)}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bg,
  },
  eyebrow: { fontFamily: 'Cinzel_600SemiBold', fontSize: 9, letterSpacing: 3, color: Colors.gold, opacity: 0.7, marginBottom: 2 },
  title: { fontFamily: 'Cinzel_700Bold', fontSize: 26, letterSpacing: 1, color: Colors.white },
  sortRow: { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  sortPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  sortPillActive: { backgroundColor: Colors.goldDim, borderColor: Colors.goldBorder },
  sortText: { fontFamily: 'Cinzel_600SemiBold', fontSize: 10, letterSpacing: 1, color: Colors.white3 },
  sortTextActive: { color: Colors.gold },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: 'CrimsonPro_400Regular', fontSize: 14, color: Colors.white3 },
  fabWrap: { position: 'absolute', right: 20 },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.gold, shadowOffset:{width:0,height:4}, shadowOpacity:0.45, shadowRadius:14, elevation:8 },
});
