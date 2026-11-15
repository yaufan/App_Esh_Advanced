# 查核修正後的獨立複審說明（甲級）

你是獨立複審者：沒有參與出題、沒有參與之前任何一輪審題、盲解或比對裁定，也沒有參與這次修正。這是「職業安全管理／職業衛生管理甲級 術科」解題練習 APP 的題庫，委託人要求不能有幻覺、每個事實都要有法規依據。題庫剛做完全面查核（盲解＋比對裁定），依裁定修改了 17 個小題；你的工作是只針對這 17 個小題，確認修改正確、解決了裁定指出的問題、沒有引入新的錯誤。請從嚴。

## 資料
- 修改後的題庫：`/home/claude/app_esh_advanced/data-pipeline/bank/self_<批次>.json`
- 修改前的題庫（對照用）：`/home/claude/audit_adv/recheck/bank_before/self_<批次>.json`
- 修改清單：`/home/claude/app_esh_advanced/data-pipeline/reviews/audit_20261115_adv/modified_audit.json`
- 修改的理由（比對裁定，`result` 為 fix 的那幾筆）：同資料夾 `judge_*.json`
- 規則：`/home/claude/app_esh_advanced/data-pipeline/SCHEMA.md`、`REVIEW_BRIEF.md`、`EXTRA_RULES.md`
- 唯一事實來源：`/home/claude/app_esh_advanced/data-pipeline/corpus/text/` 的法規全文（結構化版本 `corpus/laws.json`）。不要上網，不要用記憶判斷條文內容。標 `[尚未施行-禁止出題]` 的條文不可引用。

## 每個被修改的小題都要做
1. 用程式列出修改前後的差異，看清楚改了什麼。
2. 對照裁定的 issue：修改後是否真的解決了問題（答案完整且唯一、但書已列入、題幹限定與條文相符、本題設定數值已標明）。
3. 打開所引條文全文與同法相關條文、但書，確認修改後每一個事實（數值、期限、主體、條號、項款、「應／得」）都與條文相符；新增或延長的引用 quote 是條文連續原文、條號正確；「」內的文字和條文逐字相同。
4. 計算題用 Python 重算，答案、solve、modelAnswer 三處數值一致；條文有兩種讀法時，題目數字要讓兩種讀法答案相同。
5. 概括條款（「其他…」）不列為得分要點；不寫條文以外的經驗或作答建議用語。
6. 同一大題的小題顯示在同一頁：整個大題一起讀，確認修改後的題幹、答案沒有洩漏同頁其他小題的答案。
7. 執行 `cd /home/claude/app_esh_advanced/data-pipeline && python3 scripts/validate.py bank/self_*.json`，應為 errors=0。

## 輸出
寫成 JSON 陣列到任務指定的路徑，每個被修改的小題一筆（17 筆，不可遺漏）：
```json
[
  {"itemId": "SAF-A-04-3", "verdict": "pass", "note": "一句話理由"},
  {"itemId": "SAF-A-05-3", "verdict": "fix", "issue": "…", "fix": "具體修正文字"},
  {"itemId": "…", "verdict": "fail", "issue": "…"}
]
```
**不要修改任何題庫檔。** 暫存檔放任務指定的資料夾。

## 回報
筆數、pass／fix／fail 各幾筆，並逐一列出 fix 與 fail 的 id、問題與具體修正文字。
