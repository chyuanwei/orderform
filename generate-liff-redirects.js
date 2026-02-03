/**
 * 依 liff-endpoints.json 產生各 LIFF ID 的導向頁 {liffId}/placeOrder.html
 * 使用方式：node generate-liff-redirects.js
 */
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "liff-endpoints.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const liffIds = config.liffIds;

if (!Array.isArray(liffIds) || liffIds.length === 0) {
  console.error("liff-endpoints.json 需包含 liffIds 陣列");
  process.exit(1);
}

const template = (liffId) => `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>跳轉中...</title>
</head>
<body>
    <p>跳轉中...</p>
    <script>
        (function() {
            var q = new URLSearchParams(window.location.search);
            q.set("liffId", "${liffId}");
            var target = "../placeOrder.html?" + q.toString();
            window.location.replace(target);
        })();
    </script>
</body>
</html>
`;

for (const liffId of liffIds) {
  const dir = path.join(__dirname, liffId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, "placeOrder.html");
  fs.writeFileSync(filePath, template(liffId), "utf8");
  console.log("Generated:", filePath);
}

console.log("Done. " + liffIds.length + " redirect page(s).");
