import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText, Button, Card, HazardStripe, IconButton, ProgressBar, Screen, SectionTitle, Tag } from '@/components/ui/primitives';
import { getGroup } from '@/lib/bank';
import { gradeItem } from '@/lib/grading';
import { startMock, startWrongReview } from '@/lib/start';
import { fmtDate } from '@/lib/stats';
import { sessionScore, ungradedEssays, useAppStore } from '@/lib/store';
import type { Group } from '@/lib/types';
import { categoryMeta, radius, space, useTheme } from '@/theme';

function ScoreRing({ score, max, pass }: { score: number; max: number; pass?: number }) {
  const { colors } = useTheme();
  const size = 168;
  const r = 70;
  const c = 2 * Math.PI * r;
  const ratio = max ? score / max : 0;
  const passRatio = pass && max ? pass / max : null;
  const ok = passRatio == null ? true : ratio >= passRatio;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={14} fill="none" />
        {ratio > 0 && <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={ok ? colors.accent : colors.danger}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />}
        {passRatio != null && (
          <Circle
            cx={size / 2 + r * Math.cos(2 * Math.PI * passRatio - Math.PI / 2)}
            cy={size / 2 + r * Math.sin(2 * Math.PI * passRatio - Math.PI / 2)}
            r={5}
            fill="#fff"
          />
        )}
      </Svg>
      <AppText variant="display" mono color={colors.heroInk} style={{ fontSize: 44, lineHeight: 52 }}>
        {Math.round(score * 10) / 10}
      </AppText>
      <AppText variant="caption" color={colors.inkMute}>
        / {max} 分
      </AppText>
    </View>
  );
}

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const s = useAppStore((st) => st.sessions[id]);
  const setIndex = useAppStore((st) => st.setIndex);

  if (!s) {
    return (
      <Screen>
        <AppText variant="heading">找不到這份紀錄</AppText>
        <Button title="回首頁" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const gs = s.groupIds.map((g) => getGroup(g)).filter(Boolean) as Group[];
  const itemsOf = (g: Group) => (s.itemIds ? g.items.filter((i) => s.itemIds!.includes(i.id)) : g.items);
  const rows = gs.map((g, idx) => {
    const its = itemsOf(g);
    const res = its.map((it) => ({ it, r: gradeItem(it, s.answers[it.id]) }));
    const earned = res.reduce((n, x) => n + x.r.earned, 0);
    const max = its.reduce((n, it) => n + it.points, 0);
    const pending = its.filter((it) => it.type === 'essay' && !(s.answers[it.id]?.type === 'essay' && s.answers[it.id]?.value != null)).length;
    return { g, idx, earned: Math.round(earned * 100) / 100, max, res, pending };
  });
  // 已自評或已判分、但沒拿滿分的小題
  const wrongIds: string[] = [];
  for (const row of rows) for (const { it, r } of row.res) if (s.revealed[it.id] && !r.correct) wrongIds.push(it.id);

  const { score, max } = sessionScore(s);
  const toGrade = ungradedEssays(s);
  const isMock = s.mode === 'mock';
  const pass = isMock && toGrade === 0 ? score >= 60 : undefined;
  const used = s.submittedAt ? Math.round((s.submittedAt - s.startedAt) / 60000) : null;

  const reviewAt = (i: number) => {
    setIndex(s.id, i);
    router.push({ pathname: '/session/[id]', params: { id: s.id } });
  };

  return (
    <Screen edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: space.sm }}>
        <IconButton icon="home-outline" label="回首頁" onPress={() => router.replace('/')} />
        <AppText variant="heading" style={{ flex: 1, textAlign: 'center' }}>
          成績
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <Card tone="hero" padded={false} style={{ overflow: 'hidden' }}>
        <HazardStripe height={8} />
        <View style={{ alignItems: 'center', padding: space.xl, gap: space.md }}>
          <AppText variant="bodyStrong" color={colors.heroInk}>
            {s.title}
          </AppText>
          <ScoreRing score={score} max={max} pass={isMock ? 60 : undefined} />
          {toGrade > 0 && (
            <AppText variant="small" color={colors.heroInk} style={{ textAlign: 'center' }}>
              還有 {toGrade} 題問答題沒自評，目前以 0 分計。點「逐題自評」對照解題勾選你寫到的要點。
            </AppText>
          )}
          {pass != null && (
            <View style={[styles.stamp, { borderColor: pass ? colors.accent : colors.danger }]}>
              <AppText variant="heading" color={pass ? colors.accent : colors.danger}>
                {pass ? '及格' : '未達 60 分'}
              </AppText>
            </View>
          )}
          <AppText variant="caption" color={colors.inkMute}>
            {s.submittedAt ? fmtDate(s.submittedAt) : ''}
            {used != null ? `・用時 ${used} 分鐘` : ''}
          </AppText>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button title={toGrade > 0 ? '逐題自評' : '逐題看解題'} icon="search" variant="primary" style={{ flex: 1 }} onPress={() => reviewAt(0)} />
        {wrongIds.length > 0 && (
          <Button title={`重練沒拿滿分的 ${wrongIds.length} 題`} icon="refresh" variant="outline" style={{ flex: 1 }} onPress={() => startWrongReview(wrongIds)} />
        )}
      </View>

      <SectionTitle title="各大題得分" />
      <Card padded={false}>
        {rows.map((row, i) => {
          const tint = colors[categoryMeta[row.g.category].key];
          return (
            <Pressable
              key={row.g.id}
              onPress={() => reviewAt(row.idx)}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
              <AppText variant="smallStrong" mono color={colors.inkMute} style={{ width: 24 }}>
                {i + 1}
              </AppText>
              <View style={[styles.catBar, { backgroundColor: tint }]} />
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {row.g.title}
                </AppText>
                {row.max > 0 && <ProgressBar value={row.earned / row.max} color={row.earned === row.max ? colors.success : colors.accent} height={5} />}
              </View>
              {row.pending > 0 && <Tag label={`${row.pending} 題待自評`} />}
              {row.max > 0 ? (
                <AppText variant="bodyStrong" mono>
                  {row.earned}
                  <AppText variant="caption" color={colors.inkMute}>
                    /{row.max}
                  </AppText>
                </AppText>
              ) : (
                <Tag label="自評" />
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.inkMute} />
            </Pressable>
          );
        })}
      </Card>

      {isMock && <Button title="再考一份" icon="timer-outline" variant="accent" onPress={startMock} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stamp: { borderWidth: 2, borderRadius: radius.sm, paddingHorizontal: space.lg, paddingVertical: 4, transform: [{ rotate: '-4deg' }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg },
  catBar: { width: 4, height: 28, borderRadius: 2 },
});
