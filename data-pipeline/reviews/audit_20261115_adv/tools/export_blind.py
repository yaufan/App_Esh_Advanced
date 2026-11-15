#!/usr/bin/env python3
"""把題庫去掉答案與解題，輸出到各盲解資料夾（每個資料夾只放題目＋依據庫文字檔＋作業說明）。"""
import json, os, shutil, sys
BANK = '/home/claude/app_esh_advanced/data-pipeline/bank'
CORPUS = '/home/claude/app_esh_advanced/data-pipeline/corpus'
OUT = '/home/claude/audit_adv'
GROUPS = {
    'S1': ['SAF-A', 'SAF-B'], 'S2': ['SAF-C', 'SAF-D'], 'S3': ['SAF-E', 'SAF-F'],
    'S4': ['HYG-A', 'HYG-B'], 'S5': ['HYG-C', 'HYG-D'], 'S6': ['HYG-E'],
}
EXAM = {'safety': '職業安全管理甲級', 'hygiene': '職業衛生管理甲級'}
brief = open(os.path.join(OUT, 'tools', 'SOLVER_BRIEF.md')).read()
for s, batches in GROUPS.items():
    d = os.path.join(OUT, f'blind_{s}')
    if os.path.exists(d):
        shutil.rmtree(d)
    os.makedirs(d)
    shutil.copytree(os.path.join(CORPUS, 'text'), os.path.join(d, 'corpus', 'text'))
    shutil.copy(os.path.join(CORPUS, 'attachments_N0060017.json'), os.path.join(d, 'corpus'))
    qs = []
    for b in batches:
        for g in json.load(open(os.path.join(BANK, f'self_{b}.json'))):
            items = []
            for it in g['items']:
                q = {'itemId': it['id'], 'type': it['type'], 'points': it['points'], 'stem': it['stem']}
                if it['type'] == 'calc':
                    q['unit'] = it.get('unit', '')
                    if it.get('decimals') is not None:
                        q['decimals'] = it['decimals']
                if it['type'] == 'fill':
                    q['blanks'] = it['blanks']
                items.append(q)
            qs.append({'groupId': g['id'], 'exam': EXAM[g['exam']], 'title': g['title'], 'context': g.get('context', ''), 'items': items})
    json.dump(qs, open(os.path.join(d, 'questions.json'), 'w'), ensure_ascii=False, indent=1)
    open(os.path.join(d, 'SOLVER_BRIEF.md'), 'w').write(brief.replace('__DIR__', d))
    n = sum(len(g['items']) for g in qs)
    print(s, batches, len(qs), 'groups', n, 'items')
