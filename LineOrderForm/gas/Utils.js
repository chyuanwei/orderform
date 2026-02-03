function logToSheet(msg) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let debugSheet = ss.getSheetByName(DEBUG_SHEET_NAME) || ss.insertSheet(DEBUG_SHEET_NAME);
  debugSheet.appendRow([new Date(), msg]);
}

function getProductList() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(PRODUCT_SHEET_NAME);
  if (!sheet) return "目前無特定產品清單";
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return "清單為空";
  return sheet.getRange(2, 1, lastRow - 1, 2).getValues().map(row => `- 標準名稱：${row[0]} (別名：${row[1]})`).join("\n");
}

function transferToMessageOrder() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sourceSheet = ss.getSheetByName('訊息轉訂單');
  const finalSheet = ss.getSheetByName('訊息下單') || ss.insertSheet('訊息下單').appendRow(['訂單時間', '訂貨人', '產品', '數量','出貨日期','店家']);
  if (!sourceSheet) return;
  const data = sourceSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === "待轉換") {
      const detailStr = data[i][4];
      if (detailStr && typeof detailStr === 'string') {
        detailStr.split(',').forEach(item => {
          const parts = item.split(' x ');
          if (parts.length === 2) finalSheet.appendRow([data[i][0], data[i][2], parts[0].trim(), parts[1].trim(),data[i][8], data[i][9]]);
        });
        sourceSheet.getRange(i + 1, 4).setValue("已轉入訊息下單表");
      }
    }
  }
}

function returnJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 高效清理 DebugLog
 * - 每小時：移除「暫無資料須處理!」
 * - 每日 06:00：額外移除舊的「[系統自動清理]」追蹤紀錄
 */
function cleanDebugLogAndLeaveTrace() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("DebugLog");
  
  if (!sheet) {
    console.error("找不到工作表：DebugLog");
    return;
  }

  const range = sheet.getDataRange();
  const data = range.getValues();
  if (data.length <= 1) return;

  const TRACE_PREFIX = "[系統自動清理]：";
  const now = new Date();
  const currentHour = now.getHours();
  const isSixthHour = (currentHour === 6);

  const header = data[0];
  const rows = data.slice(1);

  // 1. 執行核心過濾邏輯（與 filterDebugRows 一致）
  const filteredRows = filterDebugRows(rows, currentHour);

  const removedCount = rows.length - filteredRows.length;

  // 2. 只有在有變動時才處理（包含 6 點的深度清理或例行的暫無資料清理）
  if (removedCount > 0) {
    const finalData = [header, ...filteredRows];

    sheet.clearContents();
    sheet.getRange(1, 1, finalData.length, finalData[0].length)
          .setValues(finalData);

    // 3. 紀錄本次清理結果
    const timestamp = Utilities.formatDate(now, "GMT+8", "yyyy-MM-dd HH:mm:ss");
    const logMessage = `[系統自動清理]：已移除 ${removedCount} 筆資料 (包含 ${isSixthHour ? '舊紀錄重置' : '例行清理'})。`;
    
    sheet.appendRow([timestamp, logMessage]);
    
    console.log(`${timestamp} 執行完畢，小時：${currentHour}，共移除：${removedCount} 筆`);
  } else {
    console.log(`小時：${currentHour}，無須清理。`);
  }
}

// 僅在 Node 環境（Jest）匯出，GAS 不支援 module，不會執行此塊
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { returnJson, filterDebugRows };
}

/**
 * 抽離的純邏輯：DebugLog 過濾條件（與 cleanDebugLogAndLeaveTrace 內邏輯一致，供單元測試）
 * 僅在 Node 環境存在；GAS 執行時會略過上方 export 塊，此函式不會被上傳。
 */
function filterDebugRows(rows, currentHour) {
  const TARGET_STRING = '暫無資料須處理!';
  const TRACE_PREFIX = '[系統自動清理]：';
  const isSixthHour = currentHour === 6;
  return rows.filter((row) => {
    const cellValue = row[1] ? row[1].toString() : '';
    if (cellValue === TARGET_STRING) return false;
    if (isSixthHour && cellValue.startsWith(TRACE_PREFIX)) return false;
    return true;
  });
}