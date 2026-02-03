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
