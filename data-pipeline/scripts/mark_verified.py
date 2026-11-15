#!/usr/bin/env python3
"""審題閘門：一批題目要通過才可以進 APP。

Usage (在 data-pipeline/ 執行): python3 scripts/mark_verified.py <批次> [bank/self_<批次>.json]

檢查：
1. validate.py 零錯誤；
2. 每個小題都有第一輪審題紀錄（reviews/review_<批次>.json），fail 的小題已刪除；
3. 第一輪被修改的小題（reviews/modified_<批次>.json）都經過複審，而且最後一次複審是 pass
   （複審紀錄依序為 reviews/recheck_*.json、reviews/recheck_round3.json、reviews/audit_*/recheck_audit*.json；後面的輪次蓋過前面的）。
4. 全面查核後修改的小題（reviews/audit_*/modified_audit*.json）也要有複審且最後一次是 pass。
通過後把題庫複製到 verified/。
"""
import glob, json, os, subprocess, sys

X = sys.argv[1]
bank_path = sys.argv[2] if len(sys.argv) > 2 else f'bank/self_{X}.json'
here = os.path.dirname(os.path.abspath(__file__))
r = subprocess.run([sys.executable, os.path.join(here, 'validate.py'), bank_path], capture_output=True, text=True)
if r.returncode:
    sys.exit(r.stdout)
rev = json.load(open(f'reviews/review_{X}.json'))
bank = json.load(open(bank_path))
ids = {it['id'] for g in bank for it in g['items']}
verdict = {x['itemId']: x['verdict'] for x in rev}
fails = {k for k, v in verdict.items() if v == 'fail'}
assert not (ids & fails), f'failed items still present: {ids & fails}'
unreviewed = ids - set(verdict)
assert not unreviewed, f'items without review: {unreviewed}'

# 修正後複審：後面的輪次蓋過前面的
final = {}
rounds = (sorted(f for f in glob.glob('reviews/recheck_*.json') if 'round3' not in f)
          + sorted(glob.glob('reviews/recheck_round3.json'))
          + sorted(glob.glob('reviews/audit_*/recheck_audit*.json')))
for f in rounds:
    for x in json.load(open(f)):
        final[x['itemId']] = x['verdict']
mod_path = f'reviews/modified_{X}.json'
modified = set(json.load(open(mod_path))) if os.path.exists(mod_path) else set()
# 全面查核（盲解＋比對裁定）後修改的小題，也要經過複審
for f in glob.glob('reviews/audit_*/modified_audit*.json'):
    modified |= set(json.load(open(f)))
fixed_first_round = {k for k, v in verdict.items() if v == 'fix'}
need_recheck = (modified | fixed_first_round) & ids
missing = {k for k in need_recheck if k not in final}
assert not missing, f'modified items without recheck: {sorted(missing)}'
not_pass = {k: final[k] for k in need_recheck if final[k] != 'pass'}
assert not not_pass, f'latest recheck is not pass: {not_pass}'

for x in rev:
    if x['verdict'] == 'fix':
        x.setdefault('resolution', '已依審題意見修正，validate.py 通過')
    if x['verdict'] == 'fail':
        x.setdefault('resolution', '已刪除')
json.dump(rev, open(f'reviews/review_{X}.json', 'w'), ensure_ascii=False, indent=1)
os.makedirs('verified', exist_ok=True)
json.dump(bank, open(f'verified/{os.path.basename(bank_path)}', 'w'), ensure_ascii=False, indent=1)
print(X, 'verified:', len(bank), 'groups', len(ids), 'items;', len(fails), 'removed;', len(need_recheck), 'rechecked')
