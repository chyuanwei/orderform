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

/** logcleanRules 工作表名稱 */
const LOGCLEAN_RULES_SHEET_NAME = 'logcleanRules';

/**
 * 取得預設清理規則（當 logcleanRules 工作表不存在或為空時使用）
 * @returns {Array<{text: string, matchType: string, hourRestrict: number|null}>}
 */
function getDefaultLogcleanRules() {
  return [
    { text: '暫無資料須處理!', matchType: 'exact', hourRestrict: null },
    { text: '[系統自動清理]：', matchType: 'startsWith', hourRestrict: 6 }
  ];
}

/**
 * 從「logcleanRules」工作表讀取清理規則
 * 欄位：A=訊息內容, B=比對方式(exact|startsWith), C=僅在該小時執行(0-23 或留空=每小時)
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @returns {Array<{text: string, matchType: string, hourRestrict: number|null}>}
 */
function getLogcleanRules(ss) {
  const sheet = ss.getSheetByName(LOGCLEAN_RULES_SHEET_NAME);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow, 3).getValues();
  const rules = [];
  for (let i = 0; i < data.length; i++) {
    const text = data[i][0] != null ? String(data[i][0]).trim() : '';
    if (!text) continue;
    const matchType = (data[i][1] != null ? String(data[i][1]).trim().toLowerCase() : 'exact') || 'exact';
    const hourCell = data[i][2];
    let hourRestrict = null;
    if (hourCell !== '' && hourCell != null) {
      const h = parseInt(String(hourCell).trim(), 10);
      if (!isNaN(h) && h >= 0 && h <= 23) hourRestrict = h;
    }
    rules.push({ text: text, matchType: matchType === 'startswith' ? 'startsWith' : 'exact', hourRestrict: hourRestrict });
  }
  return rules;
}

/**
 * 高效清理 DebugLog
 * 須移除的 log 訊息由「logcleanRules」工作表維護；若無該表或為空則使用內建預設規則。
 */
function cleanDebugLogAndLeaveTrace() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DEBUG_SHEET_NAME);
  
  if (!sheet) {
    console.error("找不到工作表：" + DEBUG_SHEET_NAME);
    return;
  }

  const range = sheet.getDataRange();
  const data = range.getValues();
  if (data.length <= 1) return;

  const now = new Date();
  const currentHour = now.getHours();
  const header = data[0];
  const rows = data.slice(1);

  let rules = getLogcleanRules(ss);
  if (!rules || rules.length === 0) rules = getDefaultLogcleanRules();

  const filteredRows = filterDebugRows(rows, currentHour, rules);
  const removedCount = rows.length - filteredRows.length;
  const isSixthHour = (currentHour === 6);

  if (removedCount > 0) {
    const finalData = [header, ...filteredRows];
    sheet.clearContents();
    sheet.getRange(1, 1, finalData.length, finalData[0].length)
          .setValues(finalData);

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
  module.exports = { returnJson, filterDebugRows, getDefaultLogcleanRules };
}

/**
 * DebugLog 過濾：依規則移除符合條件的列
 * @param {Array<Array>} rows - DebugLog 資料列（每列第二欄為訊息內容）
 * @param {number} currentHour - 目前小時 (0-23)
 * @param {Array<{text: string, matchType: string, hourRestrict: number|null}>} [rules] - 規則陣列，未傳則用 getDefaultLogcleanRules()
 */
function filterDebugRows(rows, currentHour, rules) {
  const activeRules = rules && rules.length > 0 ? rules : getDefaultLogcleanRules();
  return rows.filter((row) => {
    const cellValue = row[1] != null ? String(row[1]) : '';
    for (let i = 0; i < activeRules.length; i++) {
      const r = activeRules[i];
      if (r.hourRestrict !== null && r.hourRestrict !== currentHour) continue;
      if (r.matchType === 'exact' && cellValue === r.text) return false;
      if (r.matchType === 'startsWith' && cellValue.indexOf(r.text) === 0) return false;
    }
    return true;
  });
}