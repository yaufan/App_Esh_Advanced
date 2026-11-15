# data-pipeline

題庫的依據、原始檔與核對紀錄。APP 讀取的是 `src/data/`（由 `scripts/build_app_data.py` 產生）。

| 路徑 | 內容 |
|---|---|
| `laws_raw/` | 44 部法規的原始 JSON（全國法規資料庫官方 API 的公開鏡像 kong0107/mojLawSplitJSON） |
| `corpus/laws.json` | 依據庫：逐條文字＋章節＋施行狀態。44 部都已與 law.moj.gov.tw 官方網站逐條比對雜湊值：原 30 部有 4 條、新增 14 部有 8 條不一致處改用官方原文（`corpus/official_patch_20261115.json`），比對紀錄見 `reviews/audit_20261115_adv/official_compare.md` |
| `corpus/text/` | 每部法規一個文字檔（給出題與審題用），標出 `[尚未施行-禁止出題]`、`[附表尚未施行]` |
| `corpus/attachments_N0060017.json` | 有機溶劑中毒預防規則附表一、二、四（自官方網站 PDF 轉文字） |
| `bank/self_SAF-*.json` | 職業安全管理甲級自編大題（A 法規、B 管理、C 機械電氣、D 營造墜落、E 起重鍋爐與危險性機械、F 高壓氣體火災爆炸局限空間缺氧） |
| `bank/self_HYG-*.json` | 職業衛生管理甲級自編大題（A 健康保護與母性保護、B 化學品管理、C 作業環境監測與物理性危害、D 有機溶劑特化鉛粉塵、E 衛生設備檢查與特殊作業、職場霸凌） |
| `examples/example.json` | 格式示範大題（不進 APP） |
| `reviews/review_*.json` | 獨立審題紀錄，每個小題一筆：verdict（pass／fix／fail）、問題、修正與處理結果 |
| `reviews/recheck_*.json` | 修正後的題目由另一位審題者複審的紀錄 |
| `reviews/audit_20261115_adv/` | 2026-11-15 全面查核：盲解答案（`blind/`，查核者只看題目與條文作答）、逐題比對裁定（`judge_*.json`）、依裁定修改的小題（`modified_audit.json`）與修改後的獨立複審（`recheck_audit.json`）；作業說明在 `tools/` |
| `SCHEMA.md` | 題庫格式（大題 20 分；小題的解題四步：think、citations、solve、modelAnswer）與出題鐵則 |
| `EXTRA_RULES.md` | 審題後確立的補充規則（概括條款、洩題、重複、限定詞等） |
| `AGENT_BRIEF.md`／`REVIEW_BRIEF.md` | 出題、審題的作業規範 |
| `scripts/validate.py` | 格式、配分、引用逐字比對、「」內文字逐字、think 寫出法規全名、禁用語、禁止引用尚未施行條文 |
| `scripts/mark_verified.py` | 審題閘門：fail 必須已移除、所有小題都有審題紀錄、validate 通過 |
| `scripts/build_corpus.py` | 由 `laws_raw/` 重建依據庫（施行狀態清單寫在檔內） |

法規修正時：更新 `laws_raw/`（`curl https://raw.githubusercontent.com/kong0107/mojLawSplitJSON/arranged/ch/<pcode>.json`）→ 檢查各法規 `effectiveNote` 更新 `build_corpus.py` 的施行狀態清單 → 重跑 `build_corpus.py` → `validate.py ../bank/*.json` 會列出引用文字已不存在的題目 → 重新審題。

已知要追蹤的施行日：
- 危險性機械及設備安全檢查規則第 3、19、29 條：2026-12-23 施行。
- 勞工作業場所容許暴露標準第 2 條附表、職業安全衛生設施規則第 21-3、57、116、185-1～185-4 條、教育訓練規則附表一～三、作業環境監測實施辦法部分條文、妊娠與分娩後女性…認定標準附表一工作別五：2027-01-01 施行。
- 有機溶劑中毒預防規則第 12、17、18 條部分、營造安全衛生設施標準第 11-2 條、勞工健康保護規則部分條文：2027-07-01 起陸續施行。
- 工程安全設計及整體工程統合管理辦法第 5～8、10～14、18、19 條：適用範圍及施行日期依附表三（依據庫未收錄），一律不出題。
