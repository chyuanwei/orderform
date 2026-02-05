# GAS 目錄

此目錄存放 Google Apps Script 專案，透過 clasp 與 GAS 平台同步。

## 首次拉取

1. 在專案根目錄執行：`npm install`（可選，用於 npx clasp）
2. 執行：`npx clasp login`（在任意目錄，完成一次即可）
3. 在此目錄執行：`npx clasp clone <腳本_ID>`

腳本 ID 請從 GAS 編輯器 → 專案設定 → 腳本 ID 取得。

## 之後拉取更新

```bash
npx clasp pull
```

## Deploy 說明

每次更新 GAS 程式後，AI 會提供 **Comment for deploy**，可作為 `clasp push` 備註或 GAS 版本說明使用。

## 指令碼屬性（Script Properties）

在 GAS 編輯器 → 專案設定 → 指令碼屬性 設定：

### Log_Mode（DebugLog 寫入開關）

| 值 | 行為 |
|----|------|
| 0 | 不寫入 DebugLog |
| 1 | 僅寫入營運等級（系統繁忙、發現待處理訂單、AI/處理異常、Ragic 同步失敗） |
| 2 或未設定 | 寫入營運 + 除錯（含 doGet/doPost、botId、payload 等） |

未設定時預設為 2（與原本行為相同）。

### PRODUCT_LIST_REFRESH_SECONDS（正式環境產品清單快取時間）

- **單位**：分鐘
- **預設值**：360（6 小時）
- **說明**：正式環境 `doGet` 產品清單的快取過期時間
- **特殊值**：設為 `0` 表示停用快取（每次都重讀試算表）

### PRODUCT_LIST_REFRESH_SECONDS_TEST（測試環境產品清單快取時間）

- **單位**：分鐘
- **預設值**：60（1 小時）
- **說明**：測試環境 `doGet` 產品清單的快取過期時間（當請求帶 `botId=U7d234a2a4346dc8722c343c9cde29652` 時）
- **特殊值**：設為 `0` 表示停用快取（每次都重讀試算表）

**範例場景**：
- 產品清單有誤需緊急修正 → 暫時設為 `0` → 修正試算表後使用者立即看到新資料 → 修正完成後改回 `360`
- 測試環境頻繁調整產品 → 設為 `5` 分鐘或 `0`（停用快取）

## logcleanRules 工作表（DebugLog 清理規則）

`cleanDebugLogAndLeaveTrace` 會依 **logcleanRules** 工作表決定要移除的 DebugLog 訊息。若無此工作表或為空，則使用內建預設規則。

| 欄位 | 說明 |
|------|------|
| A 訊息內容 | 要比對的文字（精確字串或前綴） |
| B 比對方式 | `exact`（完全相符）或 `startsWith`（開頭相符） |
| C 僅在該小時執行 | 0～23，或留空表示每小時都執行 |

範例（等同預設行為）：

| 訊息內容 | 比對方式 | 僅在該小時執行 |
|----------|----------|----------------|
| 暫無資料須處理! | exact | （留空） |
| [系統自動清理]： | startsWith | 6 |
