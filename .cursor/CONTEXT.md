# LineOrderForm 專案 Context

本檔案為此專案專用脈絡，供 AI 與開發者快速掌握結構、流程與慣例。

---

## 1. 專案概述

- **前端**：表單 HTML（根目錄：index.html、placeOrder.html、manual 等），對外以 [GitHub chyuanwei/orderform](https://github.com/chyuanwei/orderform) 呈現，**不改變既有根目錄檔案架構**。
- **後端**：Google Apps Script (GAS)，部署在 GAS 平台，本地程式碼在 `LineOrderForm/gas/`。
- **整合**：Jest 單元測試、clasp 與 GAS 同步，均在 `LineOrderForm/` 目錄下。

---

## 2. 目錄結構

```
專案根目錄（= orderform 倉庫根）
├── index.html, placeOrder.html, manual.html, manual2.html, ...
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
    │   └── __tests__/       # Jest 測試
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

1. `placeOrder.html` POST 到 GAS 部署 URL，payload 含 `items`。
2. GAS `doPost` → `handleLiffOrder(payload)`（LiffOrderService.js）。
3. 寫入試算表：RawData、表單下單。
4. `getRagicNameMap()`、`getUserMap()` 對照後組 `ragicPayload`，呼叫 `sendToRagicAPI(ragicPayload)`（RagicService.js）。
5. Ragic API：POST 到 `RAGIC_URL`（Config.js），Basic Auth，主表 + 子表 `_subtable_1000014`。

---

## 4. 開發與部署

### GitHub（orderform）

- **遠端**：`origin` → https://github.com/chyuanwei/orderform
- **慣例**：根目錄維持 orderform 既有檔案架構；可更新檔案內容；其餘後端與工具放 `LineOrderForm/`。
- 常用：`git pull`、`git add`、`git commit -m "..."`、`git push`。

### GAS（clasp）

- **腳本 ID**：存在 `LineOrderForm/gas/.clasp.json`（不提交）。
- **rootDir**：須指向實際 `gas` 目錄（目前為 `.../LineOrderForm/LineOrderForm/gas`）。
- **拉取**：`cd LineOrderForm/gas` → `npx clasp pull`
- **推送**：`cd LineOrderForm/gas` → `npx clasp push`
- 每次更新 GAS 程式後，依 `.cursor/rules/gas-deploy-comment.mdc` 提供 **Comment for deploy** 給使用者。

### Jest

- 執行目錄：`LineOrderForm/`（內有 `jest.config.js`）。
- 指令：`cd LineOrderForm` → `npm test` 或 `npx jest`。
- `jest.setup.js` 模擬 GAS 全域（SpreadsheetApp、ContentService、PropertiesService 等）。

---

## 5. 專案慣例

| 項目 | 說明 |
|------|------|
| **GAS 更新** | 凡修改 `LineOrderForm/gas/**/*.js`，回覆結尾須附 **Comment for deploy**（見 `.cursor/rules/gas-deploy-comment.mdc`）。 |
| **GAS 執行 vs 版本控制** | 實際執行在 GAS 平台（clasp push）；GitHub 用於版本控制、備份與協作。 |
| **Utils.js** | 含 `filterDebugRows` 抽離供 Jest 測試；`if (typeof module...)` 區塊僅 Node 執行，GAS 不執行。 |
| **.clasp.json** | 已列入 .gitignore，勿提交；換機器或目錄時需修正 `rootDir`。 |

---

## 6. 重要設定與路徑（參考用）

- **GAS 部署 URL**：由 GAS 專案「部署」取得；`placeOrder.html` 內 `GAS_URL` 需與實際一致。
- **試算表、Ragic、API Key**：在 GAS 專案屬性（PropertiesService）與 `Config.js` 常數中設定。
- **Ragic 對照表**：試算表工作表名稱 `Ragic 對照表`，A 欄=標準名稱，B 欄=Ragic 用名稱。

---

*本檔案為專案專用 context，請隨重要變更更新。*
