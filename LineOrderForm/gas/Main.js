/**
 * 整合型接收中心 (doPost)
 */
function doPost(e) {
   logToSheet("doPost");
  try {
    if (!e || !e.postData) return ContentService.createTextOutput("No Data");

    const postData = e.postData.contents;
    const data = JSON.parse(postData);
    botId = data.destination;
    logToSheet("botId : "+botId);
    // 情境 B 專用：無 botId 且從 PC 下單 → OA 名稱設為「PC下單」
    if (data.items && (!botId || botId === "LIFF_DEFAULT") && data.isPc) {
      currentConfig = { name: "PC下單", token: "" };
    } else {
      currentConfig = (typeof OA_CONFIG !== "undefined" && OA_CONFIG[botId])
        ? OA_CONFIG[botId]
        : { name: "未知OA", token: "" };
    }
    logToSheet("currentConfig : "+currentConfig);
    // 情境 A：來自 LINE OA 的 Webhook
    if (data.events) {
      logToSheet("handleLineMessage : "+data);
      return handleLineMessage(data);
    } 
    
    // 情境 B：來自 LIFF 的訂單表單
    else if (data.items) {
      logToSheet("handleLiffOrder : "+data);
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

/** 產品清單過期間隔（秒），超過此時間未更新則從試算表重讀。6 小時 = 21600，改這裡即可。 */
var PRODUCT_LIST_REFRESH_SECONDS = 21600;

/**
 * 抓取產品清單入口 (doGet)，使用 PropertiesService 儲存，過期後自動從試算表重讀
 */
function doGet(e) {
  logToSheet("doGet");
  try {
    const prop = PropertiesService.getScriptProperties();
    const cached = prop.getProperty("productList_C");
    const updatedAtStr = prop.getProperty("productList_C_updatedAt");
    const nowSec = Math.floor(Date.now() / 1000);
    const updatedAt = updatedAtStr ? parseInt(updatedAtStr, 10) : 0;
    const isStale = !cached || !updatedAt || (nowSec - updatedAt >= PRODUCT_LIST_REFRESH_SECONDS);

    if (!isStale && cached) {
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Ragic 對照表'); 
    if (!sheet) throw new Error("找不到『Ragic 對照表』分頁");

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return returnJson([]); 

    // 產品清單改為讀取 C 欄給前端顯示，後端收到訂單後會先轉成 B 欄再往下流程
    const options = sheet.getRange(2, 3, lastRow - 1, 1).getValues()
      .map(row => row[0])
      .filter(item => item !== "" && item !== null); 
    
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