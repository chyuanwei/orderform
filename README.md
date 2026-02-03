# orderform

表單與線上訂單相關頁面（form for online order）。

- 根目錄：表單 HTML（index.html、placeOrder.html、manual 等）與 images/
- **LineOrderForm/**：後端與專案整合（GAS、Jest 單元測試、clasp 等），詳見 [LineOrderForm/README.md](LineOrderForm/README.md)
- **專案脈絡**：開發與 AI 共用的專案 context 見 [.cursor/CONTEXT.md](.cursor/CONTEXT.md)

## LIFF 環境分離

| 環境 | LIFF ID | Endpoint URL | 頁面 |
|------|---------|--------------|------|
| **正式** | 2008892626-gElGdN7S | `https://chyuanwei.github.io/orderform/` 或 `.../placeOrder.html` | placeOrder.html、index.html |
| **測試** | 2008894056-few4uzMm | `https://chyuanwei.github.io/orderform/placeOrder-test.html` | placeOrder-test.html、index-test.html |

**測試環境若出現 404 或先看到正式頁再 404**：(1) 測試 LIFF 的 Endpoint URL 為 `https://chyuanwei.github.io/orderform/placeOrder-test.html`，**不要加尾斜線**。(2) 根目錄 Endpoint 可加尾斜線（如 `.../orderform/`）。(3) GitHub Pages 來源為 `main`、目錄 `/ (root)`。

### LIFF 路徑與重導向（Redirect）注意事項

PC 正常、LINE App 內瞬間 404，常是 **liff.state 解析後路徑遺失**：LINE 在 App 內會強制身分驗證與 state 重導向，若 SDK 誤導向至 `https://chyuanwei.github.io/placeOrder-test.html`（漏掉 `/orderform/`），GitHub Pages 即 404。

| 項目 | 說明 |
|------|------|
| **LINE Developers Console** | **「Method for converting additional information in the LIFF URL」** 務必選 **Concatenate**。根目錄 Endpoint 結尾可加斜線。 |
| **liff.state 優先** | index.html / index-test.html：若 URL 帶有 `liff.state`，**不手動跳轉**，交給 SDK 自動處理；僅在無 state 時才執行 `goToPlaceOrder`。 |
| **placeOrder-test.html** | 使用 `liff.login()` **不傳 redirectUri**，讓預設回傳至當前頁面，減少子目錄遺失。`preventTrailingSlash404` 已暫時註解，若仍 404 可再觀察是否與斜線邏輯衝突。 |
| **404.html 應變** | **404.html** 與 **index-test.html** 完全相同。當跳轉錯誤觸發 GitHub 404 時，載入 404.html 讓 LIFF SDK 再次啟動，有機會救回 liff.state 並導回 `/orderform/placeOrder-test.html`。 |

**快速偵錯**：確認 404 前網址是否變成 `https://chyuanwei.github.io/placeOrder-test.html`（少了 `orderform`）；可暫時註解 placeOrder-test.html 內 `preventTrailingSlash404` 測試。
