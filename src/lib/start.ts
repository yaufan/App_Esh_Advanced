import { router } from 'expo-router';

import { composeMockExam, getGroup, getItem, officialSessions, selfGroupsOf, shuffled } from './bank';
import { examMeta, type Exam } from './types';
import { useAppStore } from './store';

export const MOCK_DURATION_SEC = 120 * 60;

export const currentExam = (): Exam => useAppStore.getState().settings.exam ?? 'safety';

/** 找進行中（未交卷）的同模式測驗 */
export function findOpen(mode: 'mock' | 'official', key?: string) {
  const st = useAppStore.getState();
  return st.history
    .map((id) => st.sessions[id])
    .find((s) => s && !s.submittedAt && s.mode === mode && (key == null || s.title === key));
}

export function startMock() {
  const st = useAppStore.getState();
  const exam = currentExam();
  const title = `${examMeta[exam].name}・模擬考`;
  const open = findOpen('mock', title);
  if (open) return router.push({ pathname: '/session/[id]', params: { id: open.id } });
  const seen = new Set(Object.keys(st.itemStats));
  const ids = composeMockExam(exam, seen);
  if (!ids.length) return;
  const id = st.startSession({ mode: 'mock', title, groupIds: ids, durationSec: MOCK_DURATION_SEC });
  router.push({ pathname: '/session/[id]', params: { id } });
}

export function startPractice(title: string, groupIds: string[]) {
  const id = useAppStore.getState().startSession({ mode: 'practice', title, groupIds });
  router.push({ pathname: '/session/[id]', params: { id } });
}

/** 直接看答案：不作答、不計分。舊的看答案紀錄用不到，順手清掉 */
export function startStudy(title: string, groupIds: string[]) {
  const st = useAppStore.getState();
  for (const sid of st.history) if (st.sessions[sid]?.mode === 'study') st.discard(sid);
  const id = st.startSession({ mode: 'study', title, groupIds: groupIds.filter((g) => getGroup(g)) });
  router.push({ pathname: '/session/[id]', params: { id } });
}

const officialTitle = (session: string) => `${session} ${examMeta[currentExam()].short}官方試題`;

export function startOfficialStudy(session: string) {
  const s = officialSessions(currentExam()).find((x) => x.session === session);
  if (s) startStudy(officialTitle(session), s.groups.map((g) => g.id));
}

export function startRandomPractice(n = 3) {
  const seen = new Set(Object.keys(useAppStore.getState().itemStats));
  const pool = selfGroupsOf(currentExam());
  const fresh = shuffled(pool.filter((g) => !g.items.some((it) => seen.has(it.id))));
  const rest = shuffled(pool.filter((g) => g.items.some((it) => seen.has(it.id))));
  const ids = [...fresh, ...rest].slice(0, n).map((g) => g.id);
  if (ids.length) startPractice('隨機練習', ids);
}

export function startOfficial(session: string) {
  const s = officialSessions(currentExam()).find((x) => x.session === session);
  if (!s) return;
  const title = officialTitle(session);
  const open = findOpen('official', title);
  if (open) return router.push({ pathname: '/session/[id]', params: { id: open.id } });
  const id = useAppStore.getState().startSession({ mode: 'official', title, groupIds: s.groups.map((g) => g.id) });
  router.push({ pathname: '/session/[id]', params: { id } });
}

export function startWrongReview(itemIds: string[]) {
  const gids: string[] = [];
  for (const iid of itemIds) {
    const f = getItem(iid);
    if (f && !gids.includes(f.group.id)) gids.push(f.group.id);
  }
  const id = useAppStore
    .getState()
    .startSession({ mode: 'review', title: '錯題複習', groupIds: gids, itemIds: itemIds.filter((x) => getItem(x)) });
  router.push({ pathname: '/session/[id]', params: { id } });
}

export function startGroups(title: string, groupIds: string[]) {
  startPractice(title, groupIds.filter((g) => getGroup(g)));
}
