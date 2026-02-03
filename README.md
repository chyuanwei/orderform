# orderform

表單與線上訂單相關頁面（form for online order）。

- 根目錄：表單 HTML（index.html、placeOrder.html、manual 等）與 images/
- **LineOrderForm/**：後端與專案整合（GAS、Jest 單元測試、clasp 等），詳見 [LineOrderForm/README.md](LineOrderForm/README.md)
- **專案脈絡**：開發與 AI 共用的專案 context 見 [.cursor/CONTEXT.md](.cursor/CONTEXT.md)

## 新增 LIFF App（Endpoint 導向頁）

1. 編輯 **liff-endpoints.json**，在 `liffIds` 陣列加入新的 LIFF ID（例如 `"2008899999-xxxx"`）。
2. 執行：`node generate-liff-redirects.js`
3. 將產生的 `{liffId}/placeOrder.html` 與 liff-endpoints.json 一併 commit 並 push。
4. 在 LINE Developers 將該 LIFF App 的 Endpoint URL 設為：`https://chyuanwei.github.io/orderform/{liffId}/placeOrder.html`
