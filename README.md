# LineOrderForm

LINE 訂單表單專案：前端 HTML 存放於 GitHub，後端 Google Apps Script (GAS) 部署於 GAS 平台。

## 專案結構

```
LineOrderForm/
├── html/              # 前端 HTML（從 GitHub 拉取）
├── gas/               # Google Apps Script 後端（從 GAS 拉取）
│   └── __tests__/     # GAS 單元測試（Jest）
├── jest.config.js     # Jest 設定
├── jest.setup.js      # GAS 全域 mock
├── README.md
└── .gitignore
```

## 環境準備與拉取檔案

### 一、從 GitHub 拉取 HTML

1. 若有現有 GitHub 倉庫網址，在專案根目錄執行：

   ```bash
   git clone <你的_GitHub_倉庫_URL> html
   ```

   會將整個倉庫內容拉進 `html/` 資料夾。

2. 若 HTML 只是某倉庫中的子目錄，可先 clone 到暫存目錄再複製到 `html/`，或使用 sparse checkout / 手動複製。

### 二、從 GAS 拉取 GS 腳本（使用 clasp）

1. **安裝 Node.js**（若尚未安裝）。

2. **安裝 clasp**（二擇一）：
   - 全域：`npm install -g @google/clasp`
   - 或在本專案：`npm install` 後用 `npx clasp` 執行

3. **登入與授權**：
   ```bash
   npx clasp login
   ```
   瀏覽器會開啟，請使用擁有該 GAS 專案權限的 Google 帳號登入，並同意「建立與更新 Google Apps Script 專案」等權限。

4. **啟用 Apps Script API**  
   至 [Google Cloud Console](https://console.cloud.google.com/) 選擇對應專案（或建立專案），啟用「Google Apps Script API」。

5. **拉取 GAS 專案**：
   ```bash
   cd gas
   npx clasp clone <你的_GAS_腳本_ID>
   ```
   腳本 ID 可在 GAS 編輯器：**專案設定** → **腳本 ID** 取得。  
   執行後會將 `.gs`、`appsscript.json` 等檔案下載到 `gas/` 目錄。

6. **之後只更新遠端變更**：
   ```bash
   cd gas
   npx clasp pull
   ```

## 單元測試（Jest）

- 執行全部測試：`npm test`
- 監聽模式：`npm run test:watch`
- 產出覆蓋率：`npm run test:coverage`

測試檔放在 `gas/__tests__/*.test.js`，`jest.setup.js` 會模擬 GAS 環境（SpreadsheetApp、ContentService 等）。

## 常用 clasp 指令（在 gas/ 目錄下）

| 指令 | 說明 |
|------|------|
| `clasp pull` | 從 GAS 拉取最新程式到本地 |
| `clasp push` | 將本地程式推送到 GAS |
| `clasp open` | 在瀏覽器開啟 GAS 編輯器 |
| `clasp logs --watch` | 即時查看執行紀錄 |

## 注意事項

- `gas/.clasp.json` 含腳本 ID，已列入 `.gitignore`，勿提交到公開倉庫。
- 若 GAS 專案綁定在 Google 試算表/文件，`clasp login` 時需勾選與 Drive、Apps Script 相關的權限。
