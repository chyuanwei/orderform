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
