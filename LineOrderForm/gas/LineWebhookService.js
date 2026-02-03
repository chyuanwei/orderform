/**
 * 分支 A：處理 LINE Webhook 訊息
 */
function handleLineMessage(data) {
  botId = data.destination; 
  const events = data.events;

  // --- 必要修改：關鍵字過濾 ---
  if (events && events.length > 0 && events[0].message && events[0].message.text) {
    const userMessage = events[0].message.text;
    if (userMessage.includes('【Line表單】')) {
      console.log('系統訊息：偵測到表單彙整內容，已自動跳過防止重複下單。');
      return ContentService.createTextOutput(JSON.stringify({result: 'skipped'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (!events || events.length === 0) return ContentService.createTextOutput("OK");

  OA_CONFIG = JSON.parse(PropertiesService.getScriptProperties().getProperty('OA_CONFIG_JSON'));
  currentConfig = (typeof OA_CONFIG !== 'undefined' && OA_CONFIG[botId]) 
    ? OA_CONFIG[botId] 
    : { name: '未知OA', token: '' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID); 
  let rawSheet = ss.getSheetByName('RawData'); 
  
  if (!rawSheet) {
    rawSheet = ss.insertSheet('RawData');
    rawSheet.appendRow(["接收時間", "Bot_ID", "Bot_名稱", "LINE_UserID", "用戶名稱", "原始訊息內容", "處理狀態", "AI解析結果"]);
  }

  events.forEach(event => {
    if (event.type === 'message') {
      const uid = event.source.userId;
      const isText = (event.message.type === 'text');
      const txt = isText ? event.message.text : "非文字訊息";
      const userName = (currentConfig.token && typeof getUserProfile === 'function') 
        ? getUserProfile(uid, currentConfig.token) 
        : "未知用戶";
      
      const initialStatus = isText ? "待處理" : "已完成";
      rawSheet.appendRow([new Date(), botId, currentConfig.name, uid, userName, txt, initialStatus]);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({result: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}