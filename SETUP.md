# LineOrderForm 拉取設定步驟

依序完成以下步驟，即可將 GitHub 的 HTML 與 GAS 的腳本拉回本地。

---

## 第一步：從 GitHub 拉取 HTML

在專案根目錄（`LineOrderForm`）執行，將 `<你的_GitHub_倉庫_URL>` 換成實際網址：

```powershell
git clone <你的_GitHub_倉庫_URL> html
```

例如：
```powershell
git clone https://github.com/你的帳號/LineOrderForm-html.git html
```

若倉庫名稱不同或只有一個總倉庫，把 URL 和最後的 `html` 改成你想要的資料夾名稱即可。

---

## 第二步：從 GAS 拉取 GS 腳本

### 2.1 登入 clasp（只需做一次）

在任意目錄執行：

```powershell
npx clasp login
```

瀏覽器會開啟，請用**擁有該 GAS 專案**的 Google 帳號登入，並同意權限（需包含「建立與更新 Google Apps Script 專案」）。

### 2.2 取得腳本 ID

1. 開啟 [Google Apps Script](https://script.google.com/)
2. 開啟你的 LineOrderForm 專案
3. 左側點 **專案設定**（齒輪圖示）
4. 在 **腳本 ID** 旁點複製

### 2.3 拉取 GAS 專案

在專案根目錄執行（將 `<腳本_ID>` 換成上一步複製的 ID）：

```powershell
cd gas
npx clasp clone <腳本_ID>
cd ..
```

例如：
```powershell
cd gas
npx clasp clone 1ABC...xyz
cd ..
```

完成後，`gas/` 底下會出現 `Code.gs`、`appsscript.json` 等檔案。

---

## 之後日常拉取

- **只更新 HTML**：進入 `html` 目錄執行 `git pull`。
- **只更新 GAS**：在專案根目錄執行 `npm run gas:pull`，或進入 `gas` 執行 `npx clasp pull`。

若你提供 **GitHub 倉庫 URL** 與 **GAS 腳本 ID**，可請 Cursor 協助代為執行上述指令（需自行完成 `clasp login` 瀏覽器授權）。
