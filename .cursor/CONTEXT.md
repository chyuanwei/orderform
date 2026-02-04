# LineOrderForm 專案 Context

本檔案為此專案專用脈絡，供 AI 與開發者快速掌握結構、流程與慣例。

---

## 1. 專案概述

- **前端**：表單 HTML（根目錄：index.html、placeOrder.html、manual 等），對外以 [GitHub chyuanwei/orderform](https://github.com/chyuanwei/orderform) 呈現，**不改變既有根目錄檔案架構**。index 為 LIFF 跳轉頁（登入後只帶 botId 轉 placeOrder）；placeOrder 為訂單表單。
- **後端**：Google Apps Script (GAS)，部署在 GAS 平台，本地程式碼在 `LineOrderForm/gas/`。
- **整合**：Jest 單元測試、clasp 與 GAS 同步，均在 `LineOrderForm/` 目錄下。

---

## 2. 目錄結構

```
專案根目錄（= orderform 倉庫根）
├── index.html, placeOrder.html, manual.html, manual2.html, ...
├── liff-id.js               # LIFF ID 從網址解析（getLiffIdFromUrl），供 index/placeOrder 使用，有 unittest
├── images/
├── README.md
├── .gitignore
├── .cursor/
│   ├── CONTEXT.md          ← 本檔案
│   └── rules/
│       └── gas-deploy-comment.mdc
└── LineOrderForm/
    ├── gas/                 # GAS 程式（clasp 同步此目錄）
    │   ├── .clasp.json      # 腳本 ID、rootDir（不提交 GitHub）
    │   ├── .claspignore
    │   ├── Main.js, Config.js, Utils.js, ...
    │   └── __tests__/       # Jest：Utils.test.js、liff-id.test.js（測 getLiffIdFromUrl）
    ├── jest.config.js
    ├── jest.setup.js
    ├── package.json
    ├── SETUP.md
    └── README.md
```

---

## 3. 資料流（重要）

### 產品清單（placeOrder 前端）

- **來源**：GAS `doGet` → 試算表「**Ragic 對照表**」**C 欄**，第 2 列～倒數第 2 列，原樣回傳給前端顯示。
- **快取**：`doGet` 使用 **PropertiesService.getScriptProperties()** 儲存產品清單，key `productList_C`（JSON 字串）、`productList_C_updatedAt`（上次更新時間，秒）。過期間隔由 `Main.js` 常數 **`PRODUCT_LIST_REFRESH_SECONDS`** 決定（預設 6 小時 = 21600 秒）；超過間隔後下一次 doGet 會從試算表重讀並更新 Properties。**正式與測試環境共用**同一 GAS、同一產品清單與快取。
- **前端**：`placeOrder.html` / `placeOrder-test.html` 在 onload **一開始**即發起 `fetch(GAS_URL)`（與 liff.init、getProfile 並行），需要時再 await 取得 JSON 陣列作為下拉選單；使用者選 C 欄送出。
- **後端入口**：`handleLiffOrder` 收到 payload 後**第一時間**用 `getRagicCToBMap()` 把 `payload.items[].name`（C 欄）轉成 B 欄，其餘流程不變。
- **寫入試算表與 Ragic**：一律使用已轉好的 **B 欄**（`getRagicNameMap`、`sendToRagicAPI` 等後端邏輯不需改動）。

### 訂單 Submit → Ragic

1. `placeOrder.html` POST 到 GAS 部署 URL，payload 含 `items`、`destination`（botId）、`isPc`（PC 偵測）。
2. GAS `doPost`：設 `botId`、`currentConfig`；若為 LIFF 訂單且無 botId（或 LIFF_DEFAULT）且 `isPc === true` → `currentConfig.name = "PC下單"`。
3. `handleLiffOrder(payload)`（LiffOrderService.js）：先以 `getRagicCToBMap()` 將品名 C→B，再寫 RawData、表單下單、組 ragicPayload、`sendToRagicAPI`。
4. Ragic API：POST 到 `RAGIC_URL`，Basic Auth，主表 + 子表 `_subtable_1000014`。

---

## 4. 開發與部署

### GitHub（orderform）

- **遠端**：`origin` → https://github.com/chyuanwei/orderform
- **慣例**：根目錄維持 orderform 既有檔案架構；可更新檔案內容；其餘後端與工具放 `LineOrderForm/`。
- 常用：`git pull`、`git add`、`git commit -m "..."`、`git push`。

### GAS（clasp）

- **腳本 ID**：存在 `LineOrderForm/gas/.clasp.json`（不提交）。
- **rootDir**：須指向實際 `gas` 目錄（從專案根目錄起為 `LineOrderForm/gas`）；若換機器或目錄後 push 失敗，請檢查並修正 `.clasp.json` 內 rootDir。
- **拉取**：`cd LineOrderForm/gas` → `npx clasp pull`
- **推送**：`cd LineOrderForm/gas` → `npx clasp push`
- 每次更新 GAS 程式後，依 `.cursor/rules/gas-deploy-comment.mdc` 提供 **Comment for deploy** 給使用者。

### Jest

- 執行目錄：`LineOrderForm/`（內有 `jest.config.js`）。
- 指令：`cd LineOrderForm` → `npm test` 或 `npx jest`。
- `jest.setup.js` 模擬 GAS 全域（SpreadsheetApp、ContentService、PropertiesService 等）。
- 測試檔：`gas/__tests__/Utils.test.js`（returnJson、filterDebugRows）、`gas/__tests__/liff-id.test.js`（getLiffIdFromUrl，邏輯在根目錄 `liff-id.js`）。

---

## 5. 專案慣例

| 項目 | 說明 |
|------|------|
| **go** / **commit and push** | 同義：一律包含 **GitHub**（git add / commit / push）**與 GAS**（`cd LineOrderForm/gas` → `npx clasp push`），兩邊都要執行。 |
| **GAS 更新** | 凡修改 `LineOrderForm/gas/**/*.js`，回覆結尾須附 **Comment for deploy**（見 `.cursor/rules/gas-deploy-comment.mdc`）。 |
| **GAS 執行 vs 版本控制** | 實際執行在 GAS 平台（clasp push）；GitHub 用於版本控制、備份與協作。 |
| **Utils.js** | 含 `filterDebugRows` 抽離供 Jest 測試；`if (typeof module...)` 區塊僅 Node 執行，GAS 不執行。 |
| **.clasp.json** | 已列入 .gitignore，勿提交；換機器或目錄時需修正 `rootDir`。 |
| **分析後先問再改** | 分析完問題或提出解法後，**須先詢問使用者意見**，經同意後才執行修改；不得直接進行程式修改。 |

---

## 6. 重要設定與路徑（參考用）

- **GAS 部署 URL**：由 GAS 專案「部署」取得；`placeOrder.html` 內 `GAS_URL` 需與實際一致。
- **試算表、Ragic、API Key**：在 GAS 專案屬性（PropertiesService）與 `Config.js` 常數中設定。
- **botId ↔ OA 名稱**：GAS **指令碼屬性**，key 為 `OA_CONFIG_JSON`，value 為 JSON 字串，格式 `{ "botId": { "name": "OA名稱", "token": "..." }, ... }`。無 botId 且 PC 下單時由 Main.js 設為「PC下單」。
- **Ragic 對照表**：試算表工作表 `Ragic 對照表`，**A 欄**=標準名稱，**B 欄**=Ragic 用名稱，**C 欄**=前端顯示用；doGet 回傳 C 欄，handleLiffOrder 入口用 `getRagicCToBMap()`（C→B）轉換後再往下流程。
- **產品清單快取**：`Main.js` 常數 `PRODUCT_LIST_REFRESH_SECONDS`（秒）為過期間隔；Script Properties 的 `productList_C`、`productList_C_updatedAt` 由 doGet 自動讀寫。若清單過大導致 Properties 寫入失敗（單一 value 約 9KB 上限），doGet 仍會回傳本次試算表結果並記 log。
- **Log_Mode**（指令碼屬性）：控制 DebugLog 寫入。`0`=不寫；`1`=僅營運等級（系統繁忙、發現待處理訂單、AI/處理異常）；`2` 或未設定=營運+除錯（含 doGet/doPost、botId、payload 等）。`logToSheet(msg, level)` 依此決定是否寫入。
- **logcleanRules**：試算表工作表「logcleanRules」，欄位 A=訊息內容、B=比對方式(exact/startsWith)、C=僅在該小時(0-23 或留空)。`cleanDebugLogAndLeaveTrace` 依此清理 DebugLog；無表或為空時使用內建預設規則（見 `LineOrderForm/gas/README.md`）。

---

## 7. 前端行為摘要

- **liff-id.js**（根目錄）：`getLiffIdFromUrl(hostname, pathname, fallback)`。當 `hostname === "liff.line.me"` 時從 pathname 用正則 `/^\/([^/]+)(?:\/|$)/` 取 LIFF ID（支援 `/{liffId}/placeOrder.html` 與 `/{liffId}`）；非 liff.line.me 時回傳 fallback。**不 hardcode 單一 LIFF ID**，可同時支援多個 LIFF App（如 2008894056、2008892626）。有單元測試 `gas/__tests__/liff-id.test.js`。
- **index.html**：先載入 `liff-id.js`，再 `getLiffIdFromUrl(hostname, pathname, fallback)` 取得 liffId 後 `liff.init`；已登入則轉 `placeOrder.html`（只帶 `?botId=xxx`）；init 失敗且為 OAuth callback 時仍嘗試轉訂單頁。
- **placeOrder.html** / **placeOrder-test.html**：先載入 `liff-id.js`，再以 `getLiffIdFromUrl` 取得 LIFF_ID 後 `liff.init`；以 userAgent 偵測 PC（`isPc`），payload 帶 `destination`、`isPc`。產品清單在 onload 一開始即並行 `fetch(GAS_URL)`，與 init/getProfile 同時進行；清單為 C 欄、送出後後端轉 B 欄。**下單日期**用當地日期（`getFullYear`/`getMonth`/`getDate`），不用 `toISOString`，避免 UTC 導致台灣等時區少一天。
- **placeOrder.html（正式）**：若 referrer 含 2008894056 則一進頁即導向 placeOrder-test。onload 一開始若 URL 有 `botId` 即寫入 sessionStorage（以目前頁為準）。`liff.init` 失敗時：僅在 **isTestContext** 時才導向測試頁；否則嘗試 **liff.login()**，不可用再顯示錯誤。
- **placeOrder-test.html（測試）**：onload 一開始若 URL 有 `botId` 寫入 sessionStorage，**若無**（如 OAuth 回傳 `?code=...&state=...`）則寫入測試 botId `TEST_BOT_ID`（U7d234a2a4346dc8722c343c9cde29652）；送單時 `destination` fallback 為 `TEST_BOT_ID` 而非 `LIFF_DEFAULT`。確保從測試頁送單時後端收到測試 botId，Ragic 註解顯示「泉威官方Line測試」等測試用 OA 名稱；不影響手機 LINE 有帶 botId 的正常流程。

---

## 8. 附錄：曾遇問題與注意

| 狀況 | 說明／解法 |
|------|------------|
| **Git index.lock** | 若 `git status` 報 index.lock 錯誤，多為上次操作中斷；可關閉其他 Git 程式後刪除 `.git/index.lock`，或暫時用 `GIT_INDEX_FILE` 繞過。 |
| **clasp push 失敗（rootDir）** | 錯誤提示 rootDir 不匹配時，編輯 `LineOrderForm/gas/.clasp.json`，將 `rootDir` 改為實際 gas 目錄路徑（例如 `LineOrderForm/gas`）。 |
| **多 LIFF ID 共用同一頁** | 多個 LIFF App 共用 index/placeOrder 時，若 hardcode 單一 LIFF ID 會導致 init 失敗；已改為使用 `liff-id.js` 的 `getLiffIdFromUrl` 從網址解析 LIFF ID；並支援 `?liffId=xxx` 參數優先。 |
| **index 轉 placeOrder** | 轉跳時帶 `?liffId=xxx&botId=xxx`，讓 placeOrder 在 Endpoint 載入時仍能取得正確 LIFF ID。 |
| **LIFF 環境分離** | **正式** 2008892626：Endpoint `.../orderform/` 或 `.../placeOrder.html`，fallback 2008892626。**測試** 2008894056：Endpoint `.../orderform/placeOrder-test.html`，fallback 2008894056。兩套頁面（placeOrder / placeOrder-test、index / index-test）互不干擾。 |
| **LIFF 內取不到 userId** | getProfile 失敗時改從 liff.getDecodedIDToken() 的 `sub` 取得；LIFF 需勾選 scope **profile**、**openid**。 |
| **正式 LIFF 在 PC 被導到測試頁** | 因 placeOrder.html 原在 init 失敗時一律導向 placeOrder-test；已改為僅 isTestContext 時才導向測試，正式情境改為嘗試 liff.login()。 |
| **404.html** | 與 index-test.html 相同；當 LINE 導向錯誤路徑（如漏掉 /orderform/）觸發 GitHub 404 時，由 404.html 載入 LIFF SDK 嘗試導回正確頁面。 |
| **測試環境送單 Ragic 顯示正式 OA 名稱** | OAuth 回傳 URL 無 botId，送單時若 sessionStorage 為先前正式頁留下的 botId 會帶錯。已改：兩頁 onload 一開始依 URL 寫入 botId；測試頁無 botId 時寫入/fallback 為測試 botId（TEST_BOT_ID），Ragic 註解即為 OA_CONFIG 中該 botId 的 name。 |

---

*本檔案為專案專用 context，請隨重要變更更新。*
