# orderform

表單與線上訂單相關頁面（form for online order）。

- 根目錄：表單 HTML（index.html、placeOrder.html、manual 等）與 images/
- **LineOrderForm/**：後端與專案整合（GAS、Jest 單元測試、clasp 等），詳見 [LineOrderForm/README.md](LineOrderForm/README.md)
- **專案脈絡**：開發與 AI 共用的專案 context 見 [.cursor/CONTEXT.md](.cursor/CONTEXT.md)

## LIFF Endpoint 導向頁

路徑為 **liff/{liffId}/placeOrder.html**（避免路徑第一段為數字導致 400）。  
目前：`liff/2008892626-gElGdN7S/placeOrder.html`、`liff/2008894056-few4uzMm/placeOrder.html`。  
LINE Developers 的 Endpoint URL 設為：`https://chyuanwei.github.io/orderform/liff/{liffId}/placeOrder.html`
