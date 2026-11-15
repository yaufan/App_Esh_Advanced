import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Tag } from '@/components/ui/primitives';
import { answerKey, essayNeed, gradeItem } from '@/lib/grading';
import { typeLabel, type AnswerValue, type EssayItem, type Item } from '@/lib/types';
import { radius, space, useTheme } from '@/theme';
import { ArticleCard } from './citation';
import { CalcQ, FillQ } from './inputs';
import { ItemTools } from './tools';

/**
 * 小題的呈現階段：
 * - answer：模擬考作答中，只顯示題目（計算題可輸入數值），在紙上作答
 * - learn：練習，先自己想，再一步一步看解題思路，最後自評
 * - review：已看過解題或已交卷，解題全部展開，可（再）自評
 * - study：直接看完整解題，不計分
 */
export type Phase = 'answer' | 'learn' | 'review' | 'study';

const STEPS = [
  { key: 'think', no: '①', title: '認題', icon: 'scan-outline' },
  { key: 'law', no: '②', title: '條文', icon: 'document-text-outline' },
  { key: 'solve', no: '③', title: '解題', icon: 'git-branch-outline' },
  { key: 'write', no: '④', title: '考卷上這樣寫', icon: 'create-outline' },
] as const;

function StepHead({ i, done }: { i: number; done?: boolean }) {
  const { colors } = useTheme();
  const s = STEPS[i];
  return (
    <View style={styles.stepHead}>
      <View style={[styles.stepNo, { backgroundColor: done ? colors.hero : colors.accent }]}>
        <AppText variant="smallStrong" color={done ? colors.heroInk : colors.accentInk}>
          {s.no}
        </AppText>
      </View>
      <AppText variant="smallStrong">{s.title}</AppText>
      <Ionicons name={s.icon} size={15} color={colors.inkMute} />
    </View>
  );
}

/** ④ 自評：勾選自己寫到的行 */
function SelfCheck({ item, answer, onSelfGrade }: { item: EssayItem; answer: AnswerValue | undefined; onSelfGrade?: (checked: number[]) => void }) {
  const { colors } = useTheme();
  const saved = answer?.type === 'essay' ? answer.value : null;
  const [checked, setChecked] = useState<number[]>(saved ?? []);
  const need = essayNeed(item);
  const got = Math.min(checked.length, need);
  const score = Math.round(((item.points * got) / need) * 100) / 100;
  const dirty = saved == null || saved.length !== checked.length || saved.some((x) => !checked.includes(x));
  const toggle = (i: number) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  return (
    <View style={{ gap: space.sm }}>
      <AppText variant="caption" color={colors.inkSoft}>
        {onSelfGrade ? '對照你寫的答案，勾選寫到的要點' : '參考答案'}
        {need < item.modelAnswer.length ? `・題目要求 ${need} 項，勾滿 ${need} 行即滿分` : ''}
      </AppText>
      {item.modelAnswer.map((line, i) => {
        const on = checked.includes(i);
        return (
          <Pressable
            key={i}
            disabled={!onSelfGrade}
            onPress={() => toggle(i)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={({ pressed }) => [
              styles.line,
              {
                borderColor: on ? colors.success : colors.line,
                backgroundColor: on ? colors.successSoft : colors.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            {onSelfGrade && <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.success : colors.inkMute} />}
            <AppText variant="body" style={{ flex: 1 }}>
              {line}
            </AppText>
          </Pressable>
        );
      })}
      {onSelfGrade && (
        <Button
          title={saved == null ? `完成自評・${score} / ${item.points} 分` : dirty ? `更新自評・${score} / ${item.points} 分` : `已自評・${score} / ${item.points} 分`}
          variant={saved == null ? 'accent' : 'outline'}
          icon="checkmark-done"
          disabled={saved != null && !dirty}
          onPress={() => onSelfGrade(checked)}
        />
      )}
    </View>
  );
}

function AnswerLines({ lines }: { lines: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.model, { backgroundColor: colors.successSoft }]}>
      {lines.map((m, i) => (
        <AppText key={i} variant="body">
          {m}
        </AppText>
      ))}
    </View>
  );
}

/** 同一條文的多段引用合併成一張卡 */
function groupCitations(item: Item) {
  const out: { pcode: string; article: string; quotes: string[] }[] = [];
  for (const c of item.citations) {
    const hit = out.find((x) => x.pcode === c.pcode && x.article === c.article);
    if (hit) hit.quotes.push(c.quote);
    else out.push({ pcode: c.pcode, article: c.article, quotes: [c.quote] });
  }
  return out;
}

/** 解題四步。steps 模式一步一步點開；all 模式全部展開 */
export function Walkthrough({
  item,
  mode,
  onComplete,
  answer,
  onSelfGrade,
}: {
  item: Item;
  mode: 'steps' | 'all';
  onComplete?: () => void;
  answer?: AnswerValue;
  onSelfGrade?: (checked: number[]) => void;
}) {
  const { colors } = useTheme();
  const [shown, setShown] = useState(mode === 'all' ? 4 : 0);
  const visible = mode === 'all' ? 4 : shown;
  const open = (n: number) => {
    setShown(n);
    if (n >= 4) onComplete?.();
  };
  const solve = item.solve ?? [];
  const lines = item.modelAnswer ?? [];
  return (
    <View style={{ gap: space.md }}>
      {visible >= 1 && (
        <View style={styles.step}>
          <StepHead i={0} done />
          <AppText variant="body">{item.think}</AppText>
        </View>
      )}
      {visible >= 2 && (
        <View style={styles.step}>
          <StepHead i={1} done />
          {groupCitations(item).map((c) => (
            <ArticleCard key={c.pcode + '#' + c.article} pcode={c.pcode} article={c.article} quotes={c.quotes} />
          ))}
          {item.basisNote && (
            <View style={[styles.note, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="calculator-outline" size={18} color={colors.ink} />
              <AppText variant="small" style={{ flex: 1 }}>
                {item.basisNote}
              </AppText>
            </View>
          )}
        </View>
      )}
      {visible >= 3 && (
        <View style={styles.step}>
          <StepHead i={2} done />
          <View style={[styles.solve, { backgroundColor: colors.surfaceAlt }]}>
            {solve.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
                <Ionicons name="arrow-forward" size={14} color={colors.inkMute} style={{ marginTop: 6 }} />
                <AppText variant="body" style={{ flex: 1 }}>
                  {s}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}
      {visible >= 4 && (
        <View style={styles.step}>
          <StepHead i={3} done />
          {item.type === 'essay' ? (
            <SelfCheck key={answer?.type === 'essay' ? String(answer.value) : 'none'} item={item} answer={answer} onSelfGrade={onSelfGrade} />
          ) : (
            <AnswerLines lines={lines} />
          )}
          {item.lawChangeNote && (
            <View style={[styles.note, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.ink} />
              <AppText variant="small" style={{ flex: 1 }}>
                {item.lawChangeNote}
              </AppText>
            </View>
          )}
        </View>
      )}
      {visible < 4 && (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title={visible === 0 ? '看解題思路：① 認題' : `下一步：${STEPS[visible].no} ${STEPS[visible].title}`}
            variant={visible === 0 ? 'primary' : 'outline'}
            icon={visible === 0 ? 'bulb-outline' : 'chevron-down'}
            compact
            style={{ flex: 1 }}
            onPress={() => open(visible + 1)}
          />
          {visible > 0 && <Button title="全部展開" variant="ghost" compact onPress={() => open(4)} />}
        </View>
      )}
      {visible >= 4 && <ItemTools item={item} />}
    </View>
  );
}

/** 一個小題：題號＋題型＋配分＋題幹＋（計算題）輸入＋解題四步 */
export function QuestionCard({
  item,
  index,
  answer,
  onChange,
  phase,
  graded,
  onReveal,
  onSelfGrade,
  flagged,
  onFlag,
}: {
  item: Item;
  index: number;
  answer: AnswerValue | undefined;
  onChange: (a: AnswerValue) => void;
  phase: Phase;
  /** 這一題已看過解題（計算題已判分、問答題已自評） */
  graded?: boolean;
  /** 解題看完第 ④ 步：計算題記錄對錯 */
  onReveal?: () => void;
  onSelfGrade?: (checked: number[]) => void;
  flagged?: boolean;
  onFlag?: () => void;
}) {
  const { colors } = useTheme();
  const study = phase === 'study';
  const shownAnswer = study && item.type !== 'essay' ? answerKey(item) : answer;
  const isNum = item.type === 'calc' || item.type === 'fill';
  // 計算題：看完解題或交卷後鎖定並判分
  const numReview = study || phase === 'review' || (phase === 'learn' && !!graded);
  const result = gradeItem(item, shownAnswer);
  const essayDone = item.type === 'essay' && answer?.type === 'essay' && answer.value != null;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.head}>
        <View style={[styles.no, { backgroundColor: colors.hero }]}>
          <AppText variant="smallStrong" mono color={colors.heroInk}>
            {index}
          </AppText>
        </View>
        <Tag label={typeLabel[item.type]} />
        <Tag label={`${item.points} 分`} icon="star-outline" />
        <View style={{ flex: 1 }} />
        {study && <Tag label="解題" color={colors.success} bg={colors.successSoft} icon="eye-outline" />}
        {!study && isNum && numReview && (
          <Tag
            label={result.correct ? '答對' : result.earned > 0 ? `部分 ${result.earned} 分` : result.answered ? '答錯' : '未作答'}
            color={result.correct ? colors.success : colors.danger}
            bg={result.correct ? colors.successSoft : colors.dangerSoft}
            icon={result.correct ? 'checkmark' : 'close'}
          />
        )}
        {!study && essayDone && (
          <Tag
            label={`自評 ${result.earned}/${item.points}`}
            color={result.correct ? colors.success : colors.ink}
            bg={result.correct ? colors.successSoft : colors.accentSoft}
          />
        )}
        {onFlag && phase === 'answer' && (
          <Pressable onPress={onFlag} hitSlop={10} accessibilityLabel="標記此題">
            <Ionicons name={flagged ? 'flag' : 'flag-outline'} size={20} color={flagged ? colors.accent : colors.inkMute} />
          </Pressable>
        )}
      </View>

      {item.type !== 'fill' && (
        <AppText variant="body" style={{ fontWeight: '600' }}>
          {item.stem}
        </AppText>
      )}

      {item.type === 'calc' && <CalcQ item={item} answer={shownAnswer} onChange={onChange} review={numReview} result={result} study={study} />}
      {item.type === 'fill' && <FillQ item={item} answer={shownAnswer} onChange={onChange} review={numReview} result={result} study={study} />}

      {phase === 'answer' && item.type === 'essay' && (
        <View style={[styles.paper, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="create-outline" size={20} color={colors.inkSoft} />
          <AppText variant="small" color={colors.inkSoft} style={{ flex: 1 }}>
            請在紙上作答。交卷後逐題看解題，並勾選自己寫到的要點計分。
          </AppText>
        </View>
      )}
      {phase === 'answer' && isNum && (
        <AppText variant="caption" color={colors.inkMute}>
          計算過程寫在紙上，結果輸入上方欄位；交卷後自動判分。
        </AppText>
      )}

      {phase === 'learn' && !graded && (
        <View style={[styles.paper, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="bulb-outline" size={20} color={colors.inkSoft} />
          <AppText variant="small" color={colors.inkSoft} style={{ flex: 1 }}>
            {isNum ? '先自己算（可用右上角計算機），輸入答案後再看解題。' : '先想一想：這題考哪部法規、哪一條？要寫哪幾點？可以先寫在紙上。'}
          </AppText>
        </View>
      )}

      {phase !== 'answer' && (
        <View style={[styles.walk, { borderTopColor: colors.line }]}>
          <Walkthrough
            item={item}
            mode={phase === 'learn' && !graded ? 'steps' : 'all'}
            onComplete={onReveal}
            answer={answer}
            onSelfGrade={study ? undefined : onSelfGrade}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  no: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  walk: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md },
  step: { gap: space.sm },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepNo: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  solve: { borderRadius: radius.md, padding: space.md, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, borderWidth: 1, borderRadius: radius.md, padding: space.md },
  model: { borderRadius: radius.md, padding: space.md, gap: 6 },
  note: { flexDirection: 'row', gap: space.sm, borderRadius: radius.md, padding: space.md, alignItems: 'flex-start' },
  paper: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderRadius: radius.md, padding: space.md },
});
