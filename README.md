# 職安甲級術科解題（App_Esh_Advanced）

職業安全管理甲級（22000）、職業衛生管理甲級（22100）技術士**術科**的手機練習 APP（Expo / React Native）。甲級術科是紙筆問答（5 大題、每題 20 分、2 小時、60 分及格），所以這個 APP 以「**看解題思路**」為主，而不是模擬電腦化作答。

- **解題四步**：每個小題拆成 ① 認題（題目關鍵字對應哪部法規第幾條）→ ② 條文（標出引用段落的條文全文）→ ③ 解題（條文怎麼對到題目、計算步驟）→ ④ 考卷上這樣寫（一行一個得分要點）。
- **練習**：先自己想或寫在紙上，再一步一步點開解題；最後對照「考卷上這樣寫」勾選自己寫到的要點，自動算分。計算題輸入數值自動判分。
- **看完整解題**：直接展開所有小題的四步，不計分。
- **模擬考**：5 大題、120 分鐘，在紙上作答；交卷後計算題自動判分，問答題逐題看解題並勾選要點自評，算出總分與是否及格。
- **兩個職類**：首頁切換職業安全管理甲級／職業衛生管理甲級，題庫、模擬考、錯題本、統計都分開計算。
- **錯題本與間隔複習**：沒拿滿分的小題隔 1、3、7、14 天各複習一次；另有收藏、筆記、要點速記卡（正面題目、背面考卷寫法）、學習分析、考試倒數、搜尋、法規全文與法條反查、備份與還原、字體大小。
- APP 不連網、沒有帳號、沒有廣告；作答紀錄只存在手機。

## 下載（Android）

用 Android 手機掃描下面的 QR code，會開到最新版的下載頁，點 `esh-advanced-版本-arm64.apk` 下載安裝（很舊的手機改下載 `armv7`）。第一次安裝時，手機會問是否允許「安裝不明來源的應用程式」，允許瀏覽器安裝即可。

<img src="docs/download-qr.png" width="240" alt="下載最新版">

## 題庫內容

| 職類 | 大題 | 小題 | 題型 | 類別 |
|---|---|---|---|---|
| 職業安全管理甲級（自編） | 30 | 121 | 問答 97、計算 24 | 第一類 5、第二類 5、第三類 20 大題 |
| 職業衛生管理甲級（自編） | 25 | 96 | 問答 76、計算 20 | 第一類 5、第二類 6、第三類 14 大題 |
| 官方歷屆題 | 整理中 | | | |

審題紀錄：第一輪 217 小題全部逐題審（pass 178、fix 39、fail 0）；39 題修正後（連同受影響的同大題小題共 52 題）交另一位審題者複審，複審再修的 6 題交第三位審題者，最後全部通過。

法規依據庫：44 部法規、2,525 條（含有機溶劑中毒預防規則附表一、二、四）。其中 30 部與乙級 APP 相同，曾與全國法規資料庫官方網站逐條比對；2026-11-15 新增 14 部（鍋爐及壓力容器安全規則、高壓氣體勞工安全規則、工業用機器人危害預防標準、高架作業勞工保護措施標準、妊娠與分娩後女性及未滿十八歲勞工禁止從事危險性或有害性工作認定標準、機械設備器具安全資訊申報登錄辦法、機械類產品型式驗證實施及監督管理辦法、優先管理化學品之指定及運作管理辦法、管制性化學品之指定及運作許可管理辦法、新化學物質登記管理辦法、危害性化學品評估及分級管理辦法、職場霸凌防治措施準則、工程安全設計及整體工程統合管理辦法、勞動檢查法第二十八條所定勞工有立即發生危險之虞認定標準），取自全國法規資料庫官方 API 的公開鏡像，2026-11-15 已和官方網站逐條比對（551 條中 12 條有字形或排版差異，處理方式見 `data-pipeline/reviews/audit_20261115_adv/official_compare.md`）。

## 題庫怎麼確保「有依據、不幻覺」

1. **法規依據庫**（`data-pipeline/corpus/`）：各法規的施行註記中「已公布但尚未施行」的條文會被標記，**不能拿來出題**。
2. **出題規則**（`data-pipeline/SCHEMA.md`、`AGENT_BRIEF.md`、`EXTRA_RULES.md`）：題目與解題四步的每個事實都只能來自依據庫；每個小題附條文逐字摘錄。概括條款（「其他…事項」）不當得分要點；題幹要寫足適用條件，使答案唯一；同一大題的小題不可互相洩題；不寫「常考」「口訣」這類條文以外的說法。
3. **程式驗證**（`data-pipeline/scripts/validate.py`）：檢查格式、配分（每大題 20 分）、摘錄是否**逐字**出現在條文、引號「」內的條文用語是否逐字、認題是否寫出法規全名、是否出現禁用語、是否引用尚未施行的條文。
4. **獨立審題**：每批題目交給沒參與出題的審題者逐題審（計算全部用 Python 重算），紀錄在 `data-pipeline/reviews/review_*.json`。
5. **修正與複審**：依審題意見修改後，再交給另一位沒看過的審題者複審（`reviews/recheck_*.json`）；複審又有修改的，再交第三位審題者。

## 開發

```bash
npm install
npx expo start          # 手機安裝 Expo Go 後掃 QR code 即可實測
npx tsc --noEmit        # 型別檢查
npx eslint src          # lint
npx expo export -p web  # 輸出網頁版（預覽用）
```

### 更新題庫資料

```bash
cd data-pipeline/scripts
python3 validate.py ../bank/*.json                       # 驗證
python3 build_app_data.py ../../src/data ../bank/*.json  # 產生 src/data/bank.json、laws.json、meta.json
```

### 發布新版本（GitHub Actions 自動打包 APK）

和 yaufan 其他 APP 同一套流程：

1. 版本號三處一致：`app.json` 的 `expo.version`、`package.json` 的 `version`、`CHANGELOG.md` 最上面一段 `## X.Y.Z 測試版（日期）`（`npm run check:version` 會檢查）。
2. 推到 `main`：
   - **App** 工作流程（`.github/workflows/app.yml`）跑版本、型別、lint、題庫驗證與網頁打包，約 2～5 分鐘。
   - **Release** 工作流程（`.github/workflows/release.yml`）在版本還沒發布過時，用 Expo prebuild＋Gradle 打包 arm64／armv7／x86_64 三個 APK，以測試金鑰簽章、檢查簽章指紋與權限，放上 GitHub Releases，約 15～40 分鐘。
3. 本專案是公開的，GitHub Actions 不扣每月額度。
4. 簽章用和其他 APP 同一把測試金鑰：在 GitHub 專案頁 Settings → Secrets and variables → Actions → **Repository secrets** 加 `ANDROID_KEYSTORE_BASE64`、`ANDROID_KEYSTORE_PASSWORD`。金鑰與密碼不可放進 git。正式上架 Google Play 前要換成正式的上傳金鑰。
5. 做某一版的下載 QR code：`python3 tools/make_qr.py "<APK 網址>" qr.png "職安甲級術科解題 X.Y.Z" "Android 手機掃描，直接下載安裝" "github.com/yaufan/App_Esh_Advanced|releases/download/vX.Y.Z/<檔名>"`（需要 `pip install segno pillow`）。

APP 識別碼：`com.yaufan.eshadvanced`。簽章、分機型打包、正式版移除網路與檔案權限，都寫在 `plugins/withAndroidRelease.js`（Expo config plugin），不要手動改 `android/`（它是 prebuild 產生的，不放進 git）。

## 專案結構

```
src/
  app/                 畫面（Expo Router）
    (tabs)/            首頁、題庫、錯題本、法規
    session/[id].tsx   作答（模擬考／練習／看解題／官方歷屆題／錯題複習）
    result/[id].tsx    成績與逐題自評
    law/[pcode].tsx    法規全文
    stats.tsx          學習分析
    cards.tsx          要點速記卡
    about.tsx          資料來源、設定、備份與還原
  components/question/ 解題四步（renderer.tsx）、計算題輸入、條文卡片
  components/ui/       基本元件、數字鍵盤、計算機
  lib/                 題庫存取與搜尋、計分、作答紀錄與間隔複習（zustand + AsyncStorage）、備份
  data/                由 data-pipeline 產生的題庫與法規資料
plugins/               Expo config plugin：Android 簽章、分機型、權限
scripts/check-version.js 版本號三處一致檢查
tools/make_qr.py       下載 QR code
tools/make_icons.py    APP 圖示
data-pipeline/         法規依據庫、題庫原始檔、驗證與打包腳本、審題紀錄
```

## 免責聲明

本 APP 的自編大題為依法規自行編寫的練習題，並非官方試題；官方歷屆題照錄技能檢定中心公開的試題，解題由本專案依現行法規撰寫，與官方或任何補習班的解答無關。官方沒有公布標準答案，實際評分以閱卷為準。法規內容以全國法規資料庫與主管機關公告為準。
