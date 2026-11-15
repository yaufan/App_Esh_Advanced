import json, glob, os, re
BANK = '/home/claude/app_esh_advanced/data-pipeline/bank'
OUT = '/home/claude/audit_adv/compare'
L = {l['name']: l['pcode'] for l in json.load(open('/home/claude/app_esh_advanced/data-pipeline/corpus/laws.json'))['laws']}
bank = {}
for f in glob.glob(f'{BANK}/*.json'):
    for g in json.load(open(f)):
        for it in g['items']:
            bank[it['id']] = (g, it)
ans = {}
for f in glob.glob('/home/claude/audit_adv/blind_S*/answers.json'):
    for a in json.load(open(f)):
        ans[a['itemId']] = a
missing = set(bank) - set(ans)
print('items', len(bank), 'answered', len(ans), 'missing', sorted(missing))
num_rows = []
packets = {}
def art_norm(a):
    return str(a).replace('第', '').replace('條', '').replace('之', '-').strip()
for iid, (g, it) in sorted(bank.items()):
    a = ans.get(iid)
    bank_arts = {(c['pcode'], c['article']) for c in it['citations']}
    solver_arts = set()
    for b in (a or {}).get('basis', []) or []:
        p = L.get(b.get('law', '').strip())
        if p:
            for x in re.split(r'[、,，及]', str(b.get('article', ''))):
                x = art_norm(x.split('第')[0] if False else x)
                x = re.sub(r'[^0-9\-]', '', x.split('項')[0]) if x else x
                if x: solver_arts.add((p, x))
    overlap = bool(bank_arts & solver_arts)
    if it['type'] in ('calc', 'fill'):
        sa = a.get('answer') if a else None
        ok = None
        if it['type'] == 'calc':
            try: ok = abs(float(sa) - it['answer']) <= it['tolerance'] + 1e-9
            except Exception: ok = False
        else:
            try: ok = all(abs(float(sa[k]) - v) <= it['tolerance'] + 1e-9 for k, v in it['answer'].items())
            except Exception: ok = False
        num_rows.append((iid, ok, it['answer'], sa, overlap, (a or {}).get('doubt', '')))
    batch = iid.rsplit('-', 2)[0]
    packets.setdefault(batch, []).append({
        'itemId': iid, 'type': it['type'], 'title': g['title'], 'context': g.get('context', ''), 'stem': it['stem'],
        'bank': {'think': it['think'], 'articles': sorted(f'{p}#{n}' for p, n in bank_arts), 'modelAnswer': it['modelAnswer'], 'need': it.get('need'),
                 'answer': it.get('answer')},
        'solver': {'basis': (a or {}).get('basis'), 'answer': (a or {}).get('answer'), 'doubt': (a or {}).get('doubt', ''), 'note': (a or {}).get('note', '')},
        'articleOverlap': overlap,
    })
bad = [r for r in num_rows if not r[1]]
print('numeric items', len(num_rows), 'mismatch', len(bad))
for r in bad: print('  ', r)
no_overlap = [p['itemId'] for b in packets.values() for p in b if not p['articleOverlap']]
print('items whose solver articles do not overlap bank citations:', len(no_overlap), no_overlap)
for b, items in packets.items():
    json.dump(items, open(f'{OUT}/packet_{b}.json', 'w'), ensure_ascii=False, indent=1)
