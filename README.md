# orderform

表單與線上訂單相關頁面（form for online order）。

- 根目錄：表單 HTML（index.html、placeOrder.html、manual 等）與 images/
- **LineOrderForm/**：後端與專案整合（GAS、Jest 單元測試、clasp 等），詳見 [LineOrderForm/README.md](LineOrderForm/README.md)
- **專案脈絡**：開發與 AI 共用的專案 context 見 [.cursor/CONTEXT.md](.cursor/CONTEXT.md)

## LIFF Endpoint 導向頁

`2008892626-gElGdN7S/placeOrder.html`、`2008894056-few4uzMm/placeOrder.html` 為 hardcode 導向頁，轉至主頁並帶正確 `liffId`。新增 LIFF App 時需手動新增對應資料夾與導向頁。
