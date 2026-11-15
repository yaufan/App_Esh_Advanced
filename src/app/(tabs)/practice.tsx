import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, EmptyState, ProgressBar, Screen, Tag } from '@/components/ui/primitives';
import { officialSessions, searchGroups, topicsOf } from '@/lib/bank';
import { startOfficial, startOfficialStudy, startPractice, startStudy } from '@/lib/start';
import { useAppStore, useExam } from '@/lib/store';
import { examMeta, type Group } from '@/lib/types';
import { categoryMeta, radius, space, useTheme } from '@/theme';

function Segmented({ value, onChange }: { value: 'self' | 'official'; onChange: (v: 'self' | 'official') => void }) {
  const { colors } = useTheme();
  const opts: { v: 'self' | 'official'; label: string }[] = [
    { v: 'self', label: '自編大題' },
    { v: 'official', label: '官方歷屆題' },
  ];
  return (
    <View style={[styles.seg, { backgroundColor: colors.surfaceAlt }]}>
      {opts.map((o) => (
        <Pressable
          key={o.v}
          onPress={() => onChange(o.v)}
          style={[styles.segBtn, value === o.v && { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <AppText variant="smallStrong" color={value === o.v ? colors.ink : colors.inkSoft}>
            {o.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

/** 題庫頁的讀題方式：先想再一步一步看解題（自評計分），或直接看完整解題 */
function ModeSwitch() {
  const { colors } = useTheme();
  const study = useAppStore((s) => !!s.settings.studyMode);
  const setSetting = useAppStore((s) => s.setSetting);
  const opts: { v: boolean; label: string; icon: 'create-outline' | 'eye-outline' }[] = [
    { v: false, label: '先想再看・自評', icon: 'create-outline' },
    { v: true, label: '直接看完整解題', icon: 'eye-outline' },
  ];
  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.seg, { backgroundColor: colors.surfaceAlt }]}>
        {opts.map((o) => {
          const active = study === o.v;
          return (
            <Pressable
              key={o.label}
              onPress={() => setSetting('studyMode', o.v)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.segBtn, styles.modeBtn, active && { backgroundColor: o.v ? colors.successSoft : colors.surface, borderColor: o.v ? colors.success : colors.line }]}>
              <Ionicons name={o.icon} size={16} color={active ? (o.v ? colors.success : colors.ink) : colors.inkSoft} />
              <AppText variant="smallStrong" color={active ? (o.v ? colors.success : colors.ink) : colors.inkSoft}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {study && (
        <AppText variant="caption" color={colors.inkSoft}>
          點任何大題都會直接展開每個小題的認題、條文、解題與作答示範，不計分，也不列入錯題本。
        </AppText>
      )}
    </View>
  );
}

function GroupRow({ g }: { g: Group }) {
  const { colors } = useTheme();
  const study = useAppStore((s) => !!s.settings.studyMode);
  const stats = useAppStore((s) => s.itemStats);
  const bookmarked = useAppStore((s) => !!s.bookmarks[g.id]);
  const toggle = useAppStore((s) => s.toggleBookmark);
  const done = g.items.filter((i) => stats[i.id]).length;
  const ok = g.items.filter((i) => stats[i.id]?.last).length;
  const sub = g.topic.split('｜')[1];
  return (
    <Pressable
      onPress={() => (study ? startStudy : startPractice)(g.title, [g.id])}
      accessibilityLabel={`${g.title}・${study ? '看完整解題' : '開始練習'}`}
      style={({ pressed }) => [styles.groupRow, { borderTopColor: colors.line, opacity: pressed ? 0.75 : 1 }]}>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="bodyStrong">{g.title}</AppText>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {sub ? (
            <AppText variant="caption" color={colors.inkMute}>
              {sub}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.inkMute}>
            ・{g.items.length} 小題
          </AppText>
          {done > 0 && (
            <AppText variant="caption" color={ok === g.items.length ? colors.success : colors.inkSoft}>
              ・滿分 {ok}/{g.items.length}
            </AppText>
          )}
        </View>
      </View>
      <Pressable hitSlop={10} onPress={() => toggle(g.id)} accessibilityLabel="收藏大題">
        <Ionicons name={bookmarked ? 'star' : 'star-outline'} size={20} color={bookmarked ? colors.accent : colors.inkMute} />
      </Pressable>
      <Ionicons name={study ? 'eye' : 'play-circle'} size={study ? 26 : 28} color={study ? colors.success : colors.ink} />
    </Pressable>
  );
}

function TopicCard({ category, topic, groups }: { category: 1 | 2 | 3; topic: string; groups: Group[] }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const study = useAppStore((s) => !!s.settings.studyMode);
  const stats = useAppStore((s) => s.itemStats);
  const ids = groups.flatMap((g) => g.items.map((i) => i.id));
  const done = ids.filter((id) => stats[id]).length;
  const tint = colors[categoryMeta[category].key];
  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.topicHead}>
        <View style={[styles.topicBar, { backgroundColor: tint }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <AppText variant="bodyStrong">{topic}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <AppText variant="caption" color={colors.inkSoft}>
              {groups.length} 大題・{ids.length} 小題
            </AppText>
            <View style={{ flex: 1 }}>
              <ProgressBar value={ids.length ? done / ids.length : 0} color={tint} height={5} />
            </View>
          </View>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.inkSoft} />
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
          {groups.map((g) => (
            <GroupRow key={g.id} g={g} />
          ))}
          <Button
            title={study ? `整個主題看解題（${groups.length} 大題）` : `整個主題依序練習（${groups.length} 大題）`}
            compact
            variant="outline"
            icon={study ? 'eye-outline' : 'list'}
            style={{ marginTop: space.sm }}
            onPress={() => (study ? startStudy : startPractice)(topic, groups.map((g) => g.id))}
          />
        </View>
      )}
    </Card>
  );
}

function SelfBank() {
  const { colors } = useTheme();
  const study = useAppStore((s) => !!s.settings.studyMode);
  const exam = useExam();
  const [cat, setCat] = useState<1 | 2 | 3>(1);
  const topics = topicsOf(exam, cat);
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {([1, 2, 3] as const).map((c) => {
          const m = categoryMeta[c];
          const active = c === cat;
          const tint = colors[m.key];
          return (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              style={[
                styles.catChip,
                { borderColor: active ? tint : colors.line, backgroundColor: active ? tint : colors.surface },
              ]}>
              <AppText variant="caption" color={active ? '#fff' : colors.inkSoft}>
                第{['一', '二', '三'][c - 1]}類
              </AppText>
              <AppText variant="smallStrong" color={active ? '#fff' : colors.ink} numberOfLines={1}>
                {m.short}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="small" color={colors.inkSoft}>
        {examMeta[exam].name}・{categoryMeta[cat].name}。點主題展開大題，{study ? '點大題直接看完整解題（不計分）' : '點 ▶ 開始練習：先自己想，再一步一步看解題，最後勾選寫到的要點自評'}
      </AppText>
      {topics.length === 0 ? (
        <EmptyState icon="construct-outline" title="這一類還沒有大題" />
      ) : (
        topics.map((t) => <TopicCard key={t.topic} category={cat} topic={t.topic} groups={t.groups} />)
      )}
    </View>
  );
}

function OfficialBank() {
  const { colors } = useTheme();
  const exam = useExam();
  const sessions = officialSessions(exam);
  const study = useAppStore((s) => !!s.settings.studyMode);
  const stats = useAppStore((s) => s.itemStats);
  return (
    <View style={{ gap: space.md }}>
      <Card tone="accent" style={{ gap: 6 }}>
        <AppText variant="smallStrong">關於官方歷屆題</AppText>
        <AppText variant="small" color={colors.inkSoft}>
          題目照錄技能檢定中心公開的術科試題；解題是本 APP 依「現行」法規撰寫，與當年法規不同處會特別標註。需要教科書原理、圖表或依據庫以外資料才能作答的小題不收錄，並註明原因。
        </AppText>
      </Card>
      {sessions.length === 0 && <EmptyState icon="document-outline" title={`${examMeta[exam].name}的官方歷屆題整理中`} body="收錄前會逐題依現行條文撰寫解題並經獨立審題。" />}
      {sessions.map((s) => {
        const ids = s.groups.flatMap((g) => g.items.map((i) => i.id));
        const done = ids.filter((id) => stats[id]).length;
        const [y, b] = s.session.split('-');
        return (
          <Card key={s.session} onPress={() => (study ? startOfficialStudy : startOfficial)(s.session)} style={styles.sessionCard}>
            <View style={[styles.sessionBadge, { backgroundColor: colors.hero }]}>
              <AppText variant="heading" mono color={colors.accent}>
                {y}
              </AppText>
              <AppText variant="caption" color={colors.heroInk}>
                第 {b} 梯次
              </AppText>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="bodyStrong">{y} 年度第 {b} 梯次 術科</AppText>
              <AppText variant="caption" color={colors.inkSoft} numberOfLines={2}>
                {s.groups.map((g) => g.title).slice(0, 3).join('、')}…
              </AppText>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Tag label={`${s.groups.length} 題`} />
                {done > 0 && <Tag label={`已看 ${done}/${ids.length}`} color={colors.success} bg={colors.successSoft} />}
              </View>
            </View>
            <Ionicons name={study ? 'eye' : 'chevron-forward'} size={20} color={study ? colors.success : colors.inkMute} />
          </Card>
        );
      })}
    </View>
  );
}

function SearchResults({ q }: { q: string }) {
  const { colors } = useTheme();
  const study = useAppStore((s) => !!s.settings.studyMode);
  const exam = useExam();
  const hits = searchGroups(exam, q);
  if (hits.length === 0) return <EmptyState icon="search-outline" title="找不到符合的題目" body="換個關鍵字試試；多個關鍵字用空白隔開。" />;
  return (
    <View style={{ gap: space.md }}>
      <AppText variant="caption" color={colors.inkSoft}>
        找到 {hits.length} 個大題{hits.length >= 40 ? '（只顯示前 40 個）' : ''}・點一下{study ? '看完整解題' : '開始練習'}
      </AppText>
      {hits.map(({ group: g, snippet }) => (
        <Card key={g.id} onPress={() => (study ? startStudy : startPractice)(g.title, [g.id])} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Tag
              label={g.source === 'official' ? `${g.session} 官方歷屆題` : categoryMeta[g.category].short}
              color="#fff"
              bg={colors[categoryMeta[g.category].key]}
            />
            <AppText variant="caption" color={colors.inkMute} style={{ flex: 1 }} numberOfLines={1}>
              {g.topic}
            </AppText>
            <Ionicons name={study ? 'eye' : 'play-circle'} size={22} color={study ? colors.success : colors.ink} />
          </View>
          <AppText variant="bodyStrong">{g.title}</AppText>
          {!!snippet && (
            <AppText variant="small" color={colors.inkSoft} numberOfLines={2}>
              {snippet}
            </AppText>
          )}
        </Card>
      ))}
    </View>
  );
}

export default function Practice() {
  const { colors } = useTheme();
  const exam = useExam();
  const [q, setQ] = useState('');
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'self' | 'official'>(params.tab === 'official' ? 'official' : 'self');
  const [prevParam, setPrevParam] = useState(params.tab);
  if (params.tab !== prevParam) {
    setPrevParam(params.tab);
    if (params.tab === 'official') setTab('official');
  }
  return (
    <Screen>
      <View style={{ paddingTop: space.md }}>
        <AppText variant="display">題庫</AppText>
        <AppText variant="small" color={colors.inkSoft}>
          {examMeta[exam].name}（在首頁切換職類）
        </AppText>
      </View>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Ionicons name="search" size={18} color={colors.inkMute} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="搜尋題目：例如 承攬、局部排氣、安全係數"
          placeholderTextColor={colors.inkMute}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 10 }}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="清除搜尋">
            <Ionicons name="close-circle" size={20} color={colors.inkMute} />
          </Pressable>
        )}
      </View>
      <ModeSwitch />
      {q.trim() ? (
        <SearchResults q={q} />
      ) : (
        <>
          <Segmented value={tab} onChange={setTab} />
          {tab === 'self' ? <SelfBank /> : <OfficialBank />}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md },
  modeBtn: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  catChip: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 10, gap: 2 },
  topicHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingLeft: 0 },
  topicBar: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  sessionBadge: { width: 68, height: 68, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
