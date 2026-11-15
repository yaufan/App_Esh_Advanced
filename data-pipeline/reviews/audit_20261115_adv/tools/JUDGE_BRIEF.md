# 盲解比對裁定說明（甲級）

背景：甲級題庫每一題都已交給沒看過答案的查核者「盲解」——只看題目、只依法規條文作答。計算題的數值程式已比對，44 題全部一致；所有題目查核者找到的條文也都和題庫引用的條文有交集。你的工作是**逐題比對問答題的內容**，並處理查核者寫的疑問（doubt／note），判斷題庫有沒有錯、漏、不唯一。你沒有參與出題與審題。

## 資料
- 比對包：`/home/claude/audit_adv/compare/packet_<批次>.json`，每個小題有：題目（title、context、stem）、題庫答案（bank：think、引用條文 articles、modelAnswer、need、計算答案）、盲解答案（solver：basis、answer、doubt、note）。
- 依據庫（唯一事實來源）：`/home/claude/app_esh_advanced/data-pipeline/corpus/text/`；格式與規則：`/home/claude/app_esh_advanced/data-pipeline/SCHEMA.md`、`EXTRA_RULES.md`、`REVIEW_BRIEF.md`。
- 題庫原檔（看完整欄位用，不要修改）：`/home/claude/app_esh_advanced/data-pipeline/bank/self_<批次>.json`

## 每一題怎麼判
1. 把 solver 的答案和 bank 的 modelAnswer 逐點對照。**以條文為準**，打開條文核對，不要因為兩邊一致就略過，也不要假設 solver 一定對。
2. 分成三種結果：
   - `ok`：題庫答案正確完整；solver 的差異是 solver 自己多寫（題目沒問的）、少寫、寫錯，或是 `need` 已經涵蓋（列舉題題庫列全、要求 N 項）。
   - `fix`：題庫需要修改。常見情形：題庫漏列條文中屬於題意的項目（而且該題沒有 need 可以涵蓋）、題庫把不屬題意或概括條款列成要點、題幹沒有排除另一條也能正確作答的條文（答案不唯一）、解題或答案用語和條文不符、計算題題幹要求的判斷沒有寫進 modelAnswer。必須寫出具體修正內容（哪個欄位、改成什麼）。
   - `fail`：題庫答案錯誤或無法用條文確定唯一答案，修不好。
3. solver 的 doubt／note 每一條都要回應：成立（並據以判 fix）或不成立（說明理由）。
4. 已知的設計限制，不必判 fix：計算題（calc／fill）只能輸入數值，題幹另外要求的「是否符合」等判斷寫在 modelAnswer 讓使用者自評；只要 modelAnswer 有寫出正確判斷即可。

## 輸出
寫成 JSON 陣列到任務指定的路徑，每個小題一筆：
```json
[
  {"itemId": "SAF-A-01-1", "result": "ok", "note": "一句話理由（可省略）"},
  {"itemId": "SAF-A-01-2", "result": "fix", "issue": "問題（指出條文怎麼寫）", "fix": "具體修正內容"},
  {"itemId": "SAF-A-01-3", "result": "fail", "issue": "..."}
]
```
不要修改題庫檔。暫存檔放任務指定的資料夾。

## 回報
ok／fix／fail 各幾題，以及每個 fix／fail 的一句話摘要。
