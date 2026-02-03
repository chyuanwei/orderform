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
- **前端**：`placeOrder.html` 用 `fetch(GAS_URL)` GET 取得 JSON 陣列（C 欄），作為下拉選單；使用者選 C 欄送出。
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

---

## 6. 重要設定與路徑（參考用）

- **GAS 部署 URL**：由 GAS 專案「部署」取得；`placeOrder.html` 內 `GAS_URL` 需與實際一致。
- **試算表、Ragic、API Key**：在 GAS 專案屬性（PropertiesService）與 `Config.js` 常數中設定。
- **botId ↔ OA 名稱**：GAS **指令碼屬性**，key 為 `OA_CONFIG_JSON`，value 為 JSON 字串，格式 `{ "botId": { "name": "OA名稱", "token": "..." }, ... }`。無 botId 且 PC 下單時由 Main.js 設為「PC下單」。
- **Ragic 對照表**：試算表工作表 `Ragic 對照表`，**A 欄**=標準名稱，**B 欄**=Ragic 用名稱，**C 欄**=前端顯示用；doGet 回傳 C 欄，handleLiffOrder 入口用 `getRagicCToBMap()`（C→B）轉換後再往下流程。

---

## 7. 前端行為摘要

- **liff-id.js**（根目錄）：`getLiffIdFromUrl(hostname, pathname, fallback)`。當 `hostname === "liff.line.me"` 時從 pathname 用正則 `/^\/([^/]+)(?:\/|$)/` 取 LIFF ID（支援 `/{liffId}/placeOrder.html` 與 `/{liffId}`）；非 liff.line.me 時回傳 fallback。**不 hardcode 單一 LIFF ID**，可同時支援多個 LIFF App（如 2008894056、2008892626）。有單元測試 `gas/__tests__/liff-id.test.js`。
- **index.html**：先載入 `liff-id.js`，再 `getLiffIdFromUrl(hostname, pathname, fallback)` 取得 liffId 後 `liff.init`；已登入則轉 `placeOrder.html`（只帶 `?botId=xxx`）；init 失敗且為 OAuth callback 時仍嘗試轉訂單頁。
- **placeOrder.html**：先載入 `liff-id.js`，再以 `getLiffIdFromUrl` 取得 LIFF_ID 後 `liff.init`；以 userAgent 偵測 PC（`isPc`），payload 帶 `destination`、`isPc`；產品清單為 C 欄、送出後後端轉 B 欄。

---

## 8. 附錄：曾遇問題與注意

| 狀況 | 說明／解法 |
|------|------------|
| **Git index.lock** | 若 `git status` 報 index.lock 錯誤，多為上次操作中斷；可關閉其他 Git 程式後刪除 `.git/index.lock`，或暫時用 `GIT_INDEX_FILE` 繞過。 |
| **clasp push 失敗（rootDir）** | 錯誤提示 rootDir 不匹配時，編輯 `LineOrderForm/gas/.clasp.json`，將 `rootDir` 改為實際 gas 目錄路徑（例如 `LineOrderForm/gas`）。 |
| **多 LIFF ID 共用同一頁** | 多個 LIFF App 共用 index/placeOrder 時，若 hardcode 單一 LIFF ID 會導致 init 失敗；已改為使用 `liff-id.js` 的 `getLiffIdFromUrl` 從網址解析 LIFF ID；並支援 `?liffId=xxx` 參數優先。 |
| **index 轉 placeOrder** | 轉跳時帶 `?liffId=xxx&botId=xxx`，讓 placeOrder 在 Endpoint 載入時仍能取得正確 LIFF ID。 |
| **LIFF Endpoint URL** | 可設為根目錄 `https://chyuanwei.github.io/orderform/` 或 `.../placeOrder.html`。placeOrder 以 path → query → **sessionStorage** → fallback 取得 LIFF ID；呼叫 liff.login() 前會將 liffId、botId 存入 sessionStorage，OAuth 回傳後（redirect_uri 不含 query）仍可從 sessionStorage 還原，避免用到錯的 fallback。 |

---

*本檔案為專案專用 context，請隨重要變更更新。*
