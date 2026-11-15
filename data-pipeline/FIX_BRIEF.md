# 依審題意見修題（甲級・修題 agent 共用）

你負責把一批題目依「獨立審題紀錄」修正。你不是出題者，也不是審題者。委託人要求：**不能有幻覺，每一題都要有法規依據。**

## 資料
- 題庫格式：`/home/claude/app_esh_advanced/data-pipeline/SCHEMA.md`；補充規則：`EXTRA_RULES.md`
- 依據庫（唯一事實來源）：`/home/claude/app_esh_advanced/data-pipeline/corpus/text/`
- 驗證：`python3 /home/claude/app_esh_advanced/data-pipeline/scripts/validate.py <檔案>`

## 做法
1. 讀審題紀錄（`reviews/review_<批次>.json`）每一筆：
   - `fail`：從題庫刪掉該小題。刪除後該大題配分必須仍合計 20：把刪掉的分數依要點數合理分給同大題其餘小題；若剩不到 2 個小題或已無法成題，整個大題刪除。**不要**另外出新題補位。
   - `fix`：依 `fix` 欄位修改；修改內容必須能由條文推得，自己讀條文確認。審題意見若和條文不符，以條文為準，在回報中說明你沒有照做的原因。
   - `pass`：不要動。
2. 改完後確認：同一大題的小題之間沒有互相洩題；大題標題、topic 不洩題；計算題用 Python 重算。
3. `validate.py` 必須 errors=0。
4. 在審題紀錄每筆 fix／fail 加上 `"resolution"` 欄位，用一句話寫你實際怎麼處理（例如「已刪除；配分移到 -3」「已改 modelAnswer 第 2 行為……」「未照改：條文第 X 條寫……」）。只加 resolution，不要改審題者原本寫的欄位。
5. 另外輸出被你改過或配分有變的小題 id 清單到 `/home/claude/app_esh_advanced/data-pipeline/reviews/modified_<批次>.json`（JSON 陣列），供另一位審題者複審。

## 回報
刪了幾題、改了幾題、哪些沒照改及理由。
