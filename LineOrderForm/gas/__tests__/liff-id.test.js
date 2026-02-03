/**
 * getLiffIdFromUrl 單元測試（邏輯在專案根目錄 liff-id.js）
 */
const path = require("path");
// 專案根目錄（與 index.html、placeOrder.html 同層）的 liff-id.js
const rootLiffId = path.resolve(__dirname, "..", "..", "..", "liff-id.js");
const { getLiffIdFromUrl } = require(rootLiffId);

describe("getLiffIdFromUrl", function () {
  const fallback = "2008894056-few4uzMm";

  it("liff.line.me + 標準 path 應回傳 LIFF ID（2008894056）", function () {
    expect(
      getLiffIdFromUrl("liff.line.me", "/2008894056-few4uzMm/placeOrder.html", fallback)
    ).toBe("2008894056-few4uzMm");
  });

  it("liff.line.me + 標準 path 應回傳 LIFF ID（2008892626）", function () {
    expect(
      getLiffIdFromUrl("liff.line.me", "/2008892626-gElGdN7S/placeOrder.html", fallback)
    ).toBe("2008892626-gElGdN7S");
  });

  it("liff.line.me + 僅 /{liffId} 無後續路徑也應回傳 LIFF ID", function () {
    expect(
      getLiffIdFromUrl("liff.line.me", "/2008892626-gElGdN7S", fallback)
    ).toBe("2008892626-gElGdN7S");
  });

  it("liff.line.me + path 無法解析時回傳 fallback", function () {
    expect(getLiffIdFromUrl("liff.line.me", "/", fallback)).toBe(fallback);
    expect(getLiffIdFromUrl("liff.line.me", "", fallback)).toBe(fallback);
  });

  it("非 liff.line.me 時回傳 fallback", function () {
    expect(
      getLiffIdFromUrl("chyuanwei.github.io", "/orderform/placeOrder.html", fallback)
    ).toBe(fallback);
    expect(getLiffIdFromUrl("localhost", "/placeOrder.html", fallback)).toBe(fallback);
  });

  it("fallback 為 null 時可回傳 null", function () {
    expect(getLiffIdFromUrl("example.com", "/", null)).toBe(null);
    expect(getLiffIdFromUrl("liff.line.me", "/", null)).toBe(null);
  });
});
