export type Citation = {
  pcode: string;
  article: string;
  quote: string;
};

export type Option = { id: string; text: string };

type ItemBase = {
  id: string;
  points: number;
  stem: string;
  /** 甲級題庫不用（改用解題四步），保留給舊格式 */
  explanation?: string;
  citations: Citation[];
  /** ① 認題：題目關鍵字對應哪部法規第幾條 */
  think?: string;
  /** ③ 解題：條文怎麼對到題目；計算題為計算步驟 */
  solve?: string[];
  /** ④ 考卷上這樣寫：一行一個得分要點 */
  modelAnswer?: string[];
  /** 官方舊題：說明現行法與出題當時不同之處 */
  lawChangeNote?: string;
  /** 不是法規題（例如純計算原理）時，說明依據 */
  basisNote?: string;
};

export type TrueFalseItem = ItemBase & { type: 'truefalse'; answer: boolean };
export type SingleItem = ItemBase & { type: 'single'; options: Option[]; answer: string };
export type MultiItem = ItemBase & { type: 'multi'; options: Option[]; answer: string[] };
export type MatchingItem = ItemBase & {
  type: 'matching';
  options: Option[];
  blanks: { id: string; label: string }[];
  answer: Record<string, string>;
};
export type FillItem = ItemBase & {
  type: 'fill';
  blanks: { id: string; unit?: string }[];
  answer: Record<string, number>;
  tolerance?: number;
  steps?: string[];
};
export type OrderingItem = ItemBase & {
  type: 'ordering';
  options: Option[];
  answer: string[];
  orderHint?: string;
};
export type LinkingItem = ItemBase & {
  type: 'linking';
  left: Option[];
  columns: { title: string; options: Option[] }[];
  answer: Record<string, string[]>;
};
export type CalcItem = ItemBase & {
  type: 'calc';
  answer: number;
  unit: string;
  tolerance: number;
  decimals?: number;
  steps: string[];
};
export type EssayItem = ItemBase & {
  type: 'essay';
  /** 參考答案要點（依現行法規撰寫） */
  modelAnswer: string[];
  /** 題目要求列舉的項數；勾滿這麼多行即滿分 */
  need?: number;
};

export type Item =
  | TrueFalseItem
  | SingleItem
  | MultiItem
  | MatchingItem
  | FillItem
  | OrderingItem
  | LinkingItem
  | CalcItem
  | EssayItem;

export type ItemType = Item['type'];

export type Exam = 'safety' | 'hygiene';

export const examMeta: Record<Exam, { name: string; short: string; code: string }> = {
  safety: { name: '職業安全管理甲級', short: '安全管理', code: '22000' },
  hygiene: { name: '職業衛生管理甲級', short: '衛生管理', code: '22100' },
};

export type Group = {
  id: string;
  exam: Exam;
  source: 'self' | 'official';
  category: 1 | 2 | 3;
  topic: string;
  title: string;
  context?: string;
  items: Item[];
  /** 官方歷屆題 */
  session?: string;
  no?: number;
  originalText?: string;
  hasFigure?: boolean;
  figureNote?: string;
  /** 官方舊題中因缺乏法規依據而未收錄的小題 */
  partial?: boolean;
  omittedParts?: { part: string; reason: string }[] | string[];
};

export type LawArticle = { no: string; text: string; chapter: string; pending?: boolean };
export type Law = {
  pcode: string;
  name: string;
  modified: string;
  effectiveNote?: string;
  url: string;
  articles: LawArticle[];
};

/** 使用者作答值，依題型而異 */
export type AnswerValue =
  | { type: 'truefalse'; value: boolean | null }
  | { type: 'single'; value: string | null }
  | { type: 'multi'; value: string[] }
  | { type: 'matching'; value: Record<string, string> }
  | { type: 'fill'; value: Record<string, string> }
  | { type: 'ordering'; value: string[] }
  | { type: 'linking'; value: Record<string, (string | null)[]> }
  | { type: 'calc'; value: string }
  /** 問答題自評：勾選的「考卷上這樣寫」行號；null 表示還沒自評 */
  | { type: 'essay'; value: number[] | null };

export const typeLabel: Record<ItemType, string> = {
  truefalse: '是非題',
  single: '單選題',
  multi: '複選題',
  matching: '配合題',
  fill: '計算題',
  ordering: '排序題',
  linking: '連連看',
  calc: '計算題',
  essay: '問答題',
};
