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

**測試環境若出現 404 或先看到正式頁再 404**：(1) **建議**測試 LIFF 的 Endpoint URL 設為 `.../placeOrder-test.html`，不要設成根目錄。若曾設成根目錄，`index.html` 會依 referrer 或 sessionStorage 的 liffId 判斷為測試環境並導向 `placeOrder-test.html`。(2) GitHub Pages 來源為 `main`、目錄 `/ (root)`。(3) 測試頁用絕對路徑載入 `liff-id.js`。
