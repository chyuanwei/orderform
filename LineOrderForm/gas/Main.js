/**
 * 整合型接收中心 (doPost)
 */
function doPost(e) {
  logToSheet("doPost", 2);
  try {
    if (!e || !e.postData) return ContentService.createTextOutput("No Data");

    const postData = e.postData.contents;
    const data = JSON.parse(postData);
    botId = data.destination;
    logToSheet("botId : "+botId, 2);
    // 先用 botId 對應 OA 名稱（正式/測試皆會帶 botId）
    currentConfig = (typeof OA_CONFIG !== "undefined" && OA_CONFIG[botId])
      ? OA_CONFIG[botId]
      : { name: "未知OA", token: "" };

    // 情境 B（LIFF 訂單）且 PC 下單：OA 名稱標記為「PC下單+OA名稱」
    if (data.items && data.isPc === true) {
      const baseName = currentConfig && currentConfig.name ? String(currentConfig.name) : "未知OA";
      const prefixed = baseName.indexOf("PC下單+") === 0 ? baseName : ("PC下單+" + baseName);
      currentConfig = Object.assign({}, currentConfig, { name: prefixed });
    }
    logToSheet("currentConfig : "+currentConfig, 2);
    // 情境 A：來自 LINE OA 的 Webhook
    if (data.events) {
      logToSheet("handleLineMessage : "+data, 2);
      return handleLineMessage(data);
    } 
    
    // 情境 B：來自 LIFF 的訂單表單
    else if (data.items) {
      logToSheet("handleLiffOrder : "+data, 2);
      return handleLiffOrder(data);
    } 
    
    else {
      return ContentService.createTextOutput("Unknown source");
    }

  } catch (err) {
    console.error("doPost 總進入點發生錯誤: " + err.message);
    return ContentService.createTextOutput("Error: " + err.message);
  }
}

/**
 * 抓取產品清單入口 (doGet)，使用 PropertiesService 儲存，過期後自動從試算表重讀
 * 快取設定由指令碼屬性控制：
 * - PRODUCT_LIST_REFRESH_SECONDS：正式環境快取時間（分鐘），預設 360 分鐘（6 小時）
 * - PRODUCT_LIST_REFRESH_SECONDS_TEST：測試環境快取時間（分鐘），預設 60 分鐘（1 小時）
 * - 設為 0 表示停用快取（每次都重讀試算表）
 * 
 * 支援 action 參數：
 * - action=getShopName&username=xxx：查詢好友名單，回傳店家名稱
 */
function doGet(e) {
  logToSheet("doGet", 2);
  try {
    // 檢查是否為 getShopName 請求
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : "";
    if (action === "getShopName") {
      return handleGetShopName(e);
    }
    const prop = PropertiesService.getScriptProperties();
    
    // 判斷是否為測試環境（從 URL 參數 botId 或請求來源判斷）
    const urlBotId = e && e.parameter && e.parameter.botId ? e.parameter.botId : "";
    const isTestEnv = urlBotId === "U7d234a2a4346dc8722c343c9cde29652"; // TEST_BOT_ID
    
    // 讀取快取設定（單位：分鐘），未設定時使用預設值
    const refreshMinutes = isTestEnv
      ? parseInt(prop.getProperty("PRODUCT_LIST_REFRESH_SECONDS_TEST") || "60", 10)
      : parseInt(prop.getProperty("PRODUCT_LIST_REFRESH_SECONDS") || "360", 10);
    
    // 轉換為秒數，0 表示停用快取
    const refreshSeconds = refreshMinutes * 60;
    const cacheEnabled = refreshMinutes > 0;
    
    logToSheet(`doGet 快取設定：${isTestEnv ? '測試' : '正式'}環境，${refreshMinutes} 分鐘 (${cacheEnabled ? '啟用' : '停用'})`, 2);
    
    const cached = prop.getProperty("productList_C");
    const updatedAtStr = prop.getProperty("productList_C_updatedAt");
    const nowSec = Math.floor(Date.now() / 1000);
    const updatedAt = updatedAtStr ? parseInt(updatedAtStr, 10) : 0;
    const isStale = !cacheEnabled || !cached || !updatedAt || (nowSec - updatedAt >= refreshSeconds);

    if (!isStale && cached) {
      logToSheet("doGet 使用快取", 2);
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
    
    logToSheet("doGet 重讀試算表", 2);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Ragic 對照表'); 
    if (!sheet) throw new Error("找不到『Ragic 對照表』分頁");

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return returnJson([]); 

    // 產品清單改為讀取 C 欄（名稱）+ D 欄（分類），回傳結構化資料
    const data = sheet.getRange(2, 3, lastRow - 1, 2).getValues();
    const options = data
      .filter(row => row[0] !== "" && row[0] !== null)
      .map(row => ({
        name: row[0],           // C 欄：產品名稱
        category: row[1] || ""  // D 欄：分類（可能為空）
      }));
    
    const json = JSON.stringify(options);
    try {
      prop.setProperties({
        "productList_C": json,
        "productList_C_updatedAt": String(nowSec)
      });
    } catch (putErr) {
      console.warn("PropertiesService 寫入失敗（可能超過 9KB），仍回傳本次結果: " + putErr.message);
    }
    return returnJson(options);
  } catch (err) {
    console.error("doGet 發生錯誤: " + err.message);
    return returnJson({ error: err.message });
  }
}

/**
 * 處理 getShopName 請求：依 username 查詢好友名單，回傳店家名稱
 */
function handleGetShopName(e) {
  logToSheet("handleGetShopName", 2);
  try {
    const username = e && e.parameter && e.parameter.username ? e.parameter.username : "";
    if (!username) {
      return returnJson({ shopName: null, error: "缺少 username 參數" });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const friendSheet = ss.getSheetByName(FRIEND_LIST_SHEET_NAME);
    if (!friendSheet) {
      logToSheet("找不到『好友名單』分頁", 2);
      return returnJson({ shopName: null });
    }

    const data = friendSheet.getDataRange().getValues();
    // 從第 2 列開始（跳過標題），B 欄為 username，C 欄為店家名稱
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && String(data[i][1]).trim() === username.trim()) {
        const shopName = data[i][2] ? String(data[i][2]).trim() : null;
        logToSheet(`找到 username: ${username}, 店家名稱: ${shopName}`, 2);
        return returnJson({ shopName: shopName });
      }
    }

    logToSheet(`未找到 username: ${username}`, 2);
    return returnJson({ shopName: null });
  } catch (err) {
    console.error("handleGetShopName 發生錯誤: " + err.message);
    return returnJson({ shopName: null, error: err.message });
  }
}