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

/**
 * 抓取產品清單入口 (doGet)
 */
function doGet(e) {
  logToSheet("doGet");
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Ragic 對照表'); 
    if (!sheet) throw new Error("找不到『Ragic 對照表』分頁");

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return returnJson([]); 

    // 產品清單改為讀取 C 欄給前端顯示，後端收到訂單後會先轉成 B 欄再往下流程
    const options = sheet.getRange(2, 3, lastRow - 1, 1).getValues()
      .map(row => row[0])
      .filter(item => item !== "" && item !== null); 
    
    return returnJson(options);
  } catch (err) {
    console.error("doGet 發生錯誤: " + err.message);
    return returnJson({ error: err.message });
  }
}