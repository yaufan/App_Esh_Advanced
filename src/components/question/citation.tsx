import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui/primitives';
import { getArticle } from '@/lib/bank';
import type { Citation } from '@/lib/types';
import { radius, space, useTheme, useType } from '@/theme';

function norm(s: string) {
  return s.replace(/\s+/g, '');
}

/** 在條文中標出引用的那段原文 */
function highlight(text: string, quote: string) {
  const q = norm(quote);
  // 建立「去空白後位置 → 原文位置」的對照
  const map: number[] = [];
  let compact = '';
  for (let i = 0; i < text.length; i++) {
    if (!/\s/.test(text[i])) {
      map.push(i);
      compact += text[i];
    }
  }
  const at = compact.indexOf(q);
  if (at < 0) return null;
  const start = map[at];
  const end = map[at + q.length - 1] + 1;
  return [text.slice(0, start), text.slice(start, end), text.slice(end)] as const;
}

/** 在條文中標出多段引用（去空白比對），回傳 [文字, 是否標示] 片段 */
function highlightAll(text: string, quotes: string[]): [string, boolean][] {
  const map: number[] = [];
  let compact = '';
  for (let i = 0; i < text.length; i++) {
    if (!/\s/.test(text[i])) {
      map.push(i);
      compact += text[i];
    }
  }
  const mark = new Array(text.length).fill(false);
  for (const q of quotes) {
    const n = norm(q);
    const at = n ? compact.indexOf(n) : -1;
    if (at < 0) continue;
    for (let k = map[at]; k < map[at + n.length - 1] + 1; k++) mark[k] = true;
  }
  const out: [string, boolean][] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last[1] === mark[i]) last[0] += text[i];
    else out.push([text[i], mark[i]]);
  }
  return out;
}

const FULL_LIMIT = 700;

/** 解題第 ② 步：一條條文，標出所有引用段落；條文不長時整條顯示 */
export function ArticleCard({ pcode, article, quotes }: { pcode: string; article: string; quotes: string[] }) {
  const { colors } = useTheme();
  const type = useType();
  const found = getArticle(pcode, article);
  const isTable = article.startsWith('附表');
  const label = isTable ? article : `第 ${article} 條`;
  let parts: [string, boolean][] = found ? highlightAll(found.article.text, quotes) : [];
  let cut = false;
  if (found && found.article.text.length > FULL_LIMIT) {
    // 太長：只留標示段落前後各 120 字
    const keep: [string, boolean][] = [];
    parts.forEach((p, i) => {
      if (p[1]) keep.push(p);
      else {
        const before = i > 0 ? p[0].slice(0, 120) : '';
        const after = i < parts.length - 1 ? p[0].slice(-120) : '';
        const t = p[0].length <= 240 ? p[0] : (before ? before + ' … ' : '… ') + (after || '');
        keep.push([t, false]);
      }
    });
    parts = keep;
    cut = true;
  }
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/law/[pcode]', params: { pcode, a: article } })}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.rail, { backgroundColor: colors.accent }]} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.head}>
          <Ionicons name="document-text-outline" size={15} color={colors.inkSoft} />
          <AppText variant="smallStrong" style={{ flex: 1 }}>
            {found?.law.name ?? pcode}　<AppText variant="smallStrong" mono>{label}</AppText>
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.inkMute} />
        </View>
        {found ? (
          (() => {
            const body = (
              <Text style={[type.small, { color: colors.inkSoft }]}>
                {parts.map(([t, on], i) =>
                  on ? (
                    <Text key={i} style={{ backgroundColor: colors.accentSoft, color: colors.ink, fontWeight: '700' }}>
                      {t}
                    </Text>
                  ) : (
                    <Text key={i}>{t}</Text>
                  ),
                )}
              </Text>
            );
            // 條文含表格或分數式（框線字元）時不換行，改左右捲動，避免表格被折斷
            return /[│┌└├┼─]/.test(found.article.text) ? (
              <ScrollView horizontal showsHorizontalScrollIndicator>
                {body}
              </ScrollView>
            ) : (
              body
            );
          })()
        ) : (
          quotes.map((q, i) => (
            <Text key={i} style={[type.small, { color: colors.ink }]}>
              「{q}」
            </Text>
          ))
        )}
        {found && (
          <AppText variant="caption" color={colors.inkMute}>
            {cut ? '節錄・點一下看全文・' : ''}版本：{found.law.modified}修正・全國法規資料庫
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

export function CitationCard({ c, expanded = false }: { c: Citation; expanded?: boolean }) {
  const { colors } = useTheme();
  const type = useType();
  const found = getArticle(c.pcode, c.article);
  const lawName = found?.law.name ?? c.pcode;
  const isTable = c.article.startsWith('附表');
  const label = isTable ? c.article : `第 ${c.article} 條`;
  const parts = found ? highlight(found.article.text, c.quote) : null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/law/[pcode]', params: { pcode: c.pcode, a: c.article } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.rail, { backgroundColor: colors.accent }]} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.head}>
          <Ionicons name="document-text-outline" size={15} color={colors.inkSoft} />
          <AppText variant="smallStrong" style={{ flex: 1 }}>
            {lawName}　<AppText variant="smallStrong" mono>{label}</AppText>
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.inkMute} />
        </View>
        {expanded && parts ? (
          <Text style={[type.small, { color: colors.inkSoft }]}>
            {parts[0].slice(-60).length < parts[0].length ? '…' : ''}
            {parts[0].slice(-60)}
            <Text style={{ backgroundColor: colors.accentSoft, color: colors.ink, fontWeight: '700' }}>{parts[1]}</Text>
            {parts[2].slice(0, 60)}
            {parts[2].length > 60 ? '…' : ''}
          </Text>
        ) : (
          <Text style={[type.small, { color: colors.ink }]}>
            <Text style={{ color: colors.inkMute }}>「</Text>
            {c.quote}
            <Text style={{ color: colors.inkMute }}>」</Text>
          </Text>
        )}
        {found && (
          <AppText variant="caption" color={colors.inkMute}>
            版本：{found.law.modified}修正・全國法規資料庫
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    overflow: 'hidden',
  },
  rail: { width: 3, borderRadius: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
