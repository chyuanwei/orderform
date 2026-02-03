/**
 * 從網址取得 LIFF ID（liff.line.me 時 pathname 為 /{liffId}/... 或 /{liffId}）
 * @param {string} hostname - location.hostname
 * @param {string} pathname - location.pathname
 * @param {string|null} fallback - 非 liff.line.me 或解析失敗時回傳
 * @returns {string|null} LIFF ID 或 fallback
 */
function getLiffIdFromUrl(hostname, pathname, fallback) {
  if (hostname === "liff.line.me" && pathname) {
    var m = pathname.match(/^\/([^/]+)(?:\/|$)/);
    return (m && m[1]) ? m[1] : (fallback || null);
  }
  return fallback || null;
}

if (typeof window !== "undefined") {
  window.getLiffIdFromUrl = getLiffIdFromUrl;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getLiffIdFromUrl };
}
