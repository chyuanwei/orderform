/**
 * LIFF ID 格式：數字 + 連字號 + 英數字（例如 2008892626-gElGdN7S）
 */
var LIFF_ID_PATTERN = /([0-9]+-[A-Za-z0-9]+)/;

/**
 * 從網址取得 LIFF ID。
 * 1. liff.line.me 時：pathname 為 /{liffId}/... 或 /{liffId}，取第一段。
 * 2. 非 liff.line.me（例如 Endpoint 為 GitHub Pages）：pathname 可能為 /xxx/2008892626-gElGdN7S/placeOrder.html，從 path 中抓符合 LIFF ID 格式的片段。
 * @param {string} hostname - location.hostname
 * @param {string} pathname - location.pathname
 * @param {string|null} fallback - 解析失敗時回傳
 * @returns {string|null} LIFF ID 或 fallback
 */
function getLiffIdFromUrl(hostname, pathname, fallback) {
  if (!pathname) return fallback || null;
  if (hostname === "liff.line.me") {
    var m = pathname.match(/^\/([^/]+)(?:\/|$)/);
    return (m && m[1]) ? m[1] : (fallback || null);
  }
  var pathMatch = pathname.match(LIFF_ID_PATTERN);
  return (pathMatch && pathMatch[1]) ? pathMatch[1] : (fallback || null);
}

if (typeof window !== "undefined") {
  window.getLiffIdFromUrl = getLiffIdFromUrl;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getLiffIdFromUrl };
}
