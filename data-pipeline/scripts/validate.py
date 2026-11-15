#!/usr/bin/env python3
"""Validate 甲級 question-bank JSON files against SCHEMA.md and the law corpus.

Usage: python3 validate.py bank/file1.json [bank/file2.json ...]
Exit code 0 when everything passes. Prints one line per problem.
"""
import json, os, re, sys

CORPUS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'corpus', 'laws.json')))
ART = {}
LAW_NAMES = {}
for L in CORPUS['laws']:
    LAW_NAMES[L['name']] = L['pcode']
    for a in L['articles']:
        ART[(L['pcode'], a['no'])] = (L, a)


def norm(s):
    return re.sub(r'\s+', '', s or '')


TYPES = {'essay', 'calc', 'fill'}
EXAMS = {'safety': 'SAF', 'hygiene': 'HYG'}
# 提示式、經驗式用語（CLAUDE.md、EXTRA_RULES.md）
BANNED = ['常考', '口訣', '得分重點', '陷阱', '注意不要混淆', '實務上', '一般而言', '考試重點', '必考', '易混淆', '考生']
QUOTE_RE = re.compile(r'「([^「」]{2,})」')


def texts_of(it):
    out = [('think', it.get('think') or '')]
    out += [('solve', s) for s in it.get('solve') or []]
    out += [('modelAnswer', s) for s in it.get('modelAnswer') or []]
    for k in ('lawChangeNote', 'basisNote'):
        if it.get(k): out.append((k, it[k]))
    return out


def check_item(g, it, errs):
    p = f"{g.get('id')}/{it.get('id')}"
    t = it.get('type')
    if t not in TYPES:
        errs.append(f"{p}: unknown type {t}"); return
    if not str(it.get('id', '')).startswith(str(g.get('id')) + '-'):
        errs.append(f"{p}: item id must start with group id")
    for k in ('id', 'stem', 'think', 'solve', 'modelAnswer', 'citations', 'points'):
        if k not in it: errs.append(f"{p}: missing {k}")
    if not isinstance(it.get('points'), (int, float)) or it.get('points', 0) <= 0:
        errs.append(f"{p}: points must be > 0")
    if not (it.get('think') or '').strip(): errs.append(f"{p}: empty think")
    for k in ('solve', 'modelAnswer'):
        v = it.get(k)
        if not isinstance(v, list) or not v or not all(isinstance(x, str) and x.strip() for x in v):
            errs.append(f"{p}: {k} must be a non-empty list of strings")
    need = it.get('need')
    if need is not None:
        if t != 'essay': errs.append(f"{p}: need only for essay")
        elif not isinstance(need, int) or not (1 <= need <= len(it.get('modelAnswer') or [])):
            errs.append(f"{p}: need must be an int between 1 and len(modelAnswer)")
    # citations
    cits = it.get('citations') or []
    if not cits and not it.get('basisNote'): errs.append(f"{p}: no citations (and no basisNote)")
    cited_text = norm(it.get('stem')) + norm(g.get('context')) + norm(g.get('originalText'))
    cited_laws = set()
    for c in cits:
        key = (c.get('pcode'), str(c.get('article')))
        if key not in ART:
            errs.append(f"{p}: citation not found {key}"); continue
        L, a = ART[key]
        cited_laws.add(L['name'])
        cited_text += norm(a['text'])
        if a.get('pending'):
            errs.append(f"{p}: cites NOT-YET-IN-FORCE article {L['name']} {key[1]}")
        if a.get('deleted'):
            errs.append(f"{p}: cites deleted article {L['name']} {key[1]}")
        q = norm(c.get('quote'))
        if len(q) < 8:
            errs.append(f"{p}: quote too short in {key}")
        elif q not in norm(a['text']):
            errs.append(f"{p}: quote NOT verbatim in {L['name']} 第{key[1]}條: {c.get('quote')[:40]}")
    # think must name at least one cited law; any law named in walkthrough text must be cited
    think = it.get('think') or ''
    if cits and not any(n in think for n in cited_laws):
        errs.append(f"{p}: think must name the cited law (full name)")
    for field, s in texts_of(it) + [('stem', it.get('stem') or '')]:
        for w in BANNED:
            if w in s: errs.append(f"{p}: banned phrase 「{w}」 in {field}")
    for field, s in texts_of(it):
        for name in LAW_NAMES:
            if name not in s or name in cited_laws or any(name in other and other != name for other in cited_laws):
                continue
            # 條文原文本身提到別部法規（例如「依職業安全衛生管理辦法設置之…」）時，照抄條文用語是允許的
            ok = True
            for m in re.finditer(re.escape(name), s):
                a, b = m.start(), m.end()
                windows = [s[max(0, a - 3):b], s[a:b + 3], s[max(0, a - 2):b + 2]]
                if not any(len(norm(w)) > len(name) and norm(w) in cited_text for w in windows):
                    ok = False
            if not ok:
                errs.append(f"{p}: {field} names {name} but it is not cited")
        for m in QUOTE_RE.finditer(s):
            qq = norm(m.group(1))
            if qq and qq not in cited_text:
                errs.append(f"{p}: quoted 「{m.group(1)[:30]}」 in {field} is not verbatim in cited articles or the question")
    # type specific
    ans = it.get('answer')
    if t == 'calc':
        if not isinstance(ans, (int, float)) or isinstance(ans, bool): errs.append(f"{p}: calc answer must be number")
        if not isinstance(it.get('tolerance'), (int, float)): errs.append(f"{p}: calc needs tolerance")
        if 'unit' not in it: errs.append(f"{p}: calc needs unit (use \"\" when unitless)")
    elif t == 'fill':
        b = [x.get('id') for x in it.get('blanks') or []]
        if not b: errs.append(f"{p}: fill needs blanks")
        for bid in b:
            if '{{%s}}' % bid not in it.get('stem', ''): errs.append(f"{p}: stem lacks {{{{{bid}}}}}")
        if not isinstance(ans, dict) or set(ans) != set(b): errs.append(f"{p}: fill answer keys must equal blank ids")
        elif any(not isinstance(v, (int, float)) or isinstance(v, bool) for v in ans.values()): errs.append(f"{p}: fill answers must be numbers")
        if not isinstance(it.get('tolerance'), (int, float)): errs.append(f"{p}: fill needs tolerance")


def check_group(g, errs, seen):
    gid = g.get('id')
    if gid in seen: errs.append(f"duplicate group id {gid}")
    seen.add(gid)
    for k in ('id', 'exam', 'source', 'category', 'topic', 'title', 'items'):
        if k not in g: errs.append(f"{gid}: missing {k}")
    if g.get('exam') not in EXAMS: errs.append(f"{gid}: exam must be safety/hygiene")
    if g.get('source') not in ('self', 'official'): errs.append(f"{gid}: source must be self/official")
    pre = EXAMS.get(g.get('exam'), '?')
    want = pre if g.get('source') == 'self' else 'O' + pre
    if not str(gid).startswith(want + '-'): errs.append(f"{gid}: id must start with {want}-")
    if g.get('source') == 'official':
        for k in ('session', 'no', 'originalText'):
            if k not in g: errs.append(f"{gid}: official group needs {k}")
    if g.get('category') not in (1, 2, 3): errs.append(f"{gid}: category must be 1/2/3")
    for w in BANNED:
        for k in ('title', 'topic', 'context'):
            if w in (g.get(k) or ''): errs.append(f"{gid}: banned phrase 「{w}」 in {k}")
    items = g.get('items') or []
    if not (1 <= len(items) <= 6): errs.append(f"{gid}: needs 1-6 items")
    tot = sum(float(i.get('points', 0)) for i in items)
    if g.get('partial'):
        if not (0 < tot <= 20 + 1e-6): errs.append(f"{gid}: partial group points {tot} must be in (0,20]")
        if not g.get('omittedParts'): errs.append(f"{gid}: partial group needs omittedParts")
    elif abs(tot - 20) > 1e-6: errs.append(f"{gid}: points sum {tot} != 20")
    iids = set()
    for it in items:
        if it.get('id') in iids: errs.append(f"{gid}: duplicate item id {it.get('id')}")
        iids.add(it.get('id'))
        check_item(g, it, errs)


def main(paths):
    errs = []; seen = set(); n_g = n_i = 0; types = {}
    for path in paths:
        try:
            data = json.load(open(path))
        except Exception as e:
            print(f"{path}: JSON error {e}"); errs.append('json'); continue
        for g in data:
            n_g += 1; n_i += len(g.get('items', []))
            for it in g.get('items', []): types[it.get('type')] = types.get(it.get('type'), 0) + 1
            check_group(g, errs, seen)
    for e in errs: print('ERR', e)
    print(f"groups={n_g} items={n_i} types={types} errors={len(errs)}")
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
