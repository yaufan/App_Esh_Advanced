# 修正後複審（甲級・複審 agent 共用）

你是複審者：沒有參與這些題目的出題、第一輪審題或修題。第一輪審題者提出 fix 意見後，修題者已改好題庫；你要確認**改過的題目**現在完全正確、有依據。委託人要求：**不能有幻覺。**

## 資料
- 題庫格式：`/home/claude/app_esh_advanced/data-pipeline/SCHEMA.md`；補充規則：`EXTRA_RULES.md`；審題標準：`REVIEW_BRIEF.md`（照它的 9 項檢查）
- 依據庫（唯一事實來源）：`/home/claude/app_esh_advanced/data-pipeline/corpus/text/`
- 題庫：`/home/claude/app_esh_advanced/data-pipeline/bank/self_<批次>.json`
- 第一輪審題紀錄（含 issue、fix、修題者的 resolution）：`reviews/review_<批次>.json`
- 要複審的小題清單：`reviews/modified_<批次>.json`

## 每個要複審的小題
1. 讀第一輪的 issue 與 resolution，確認問題真的解決了，沒有改出新問題。
2. 照 REVIEW_BRIEF 的 9 項檢查完整再審一次（不是只看改的那一行）：答案正確且唯一、每一行要點有條文依據、題幹限定足夠、解題沒有條文以外的說法、計算用 Python 重算、但書與例外、施行狀態、洩題（含同一大題其他小題的題幹，以及大題 title／topic／context）、配分。
3. 有 `basisNote` 的純計算原理題：依 SCHEMA 鐵則 6，你要明確表示同意或不同意收錄。

## 判定與輸出
- `pass`／`fix`（附具體修正內容）／`fail`。
- 寫成 JSON 陣列到任務指定的路徑：`[{"itemId": "...", "verdict": "pass"}, {"itemId": "...", "verdict": "fix", "issue": "...", "fix": "..."}]`，清單內每個小題一筆。
- **不要修改題庫檔與第一輪審題紀錄。**

## 回報
pass／fix／fail 各幾題，以及問題摘要。
