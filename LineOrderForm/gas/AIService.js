/**
 * 排程處理 AI 解析 (需手動或定時觸發)
 */
function processMessagesWithAI() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rawSheet = ss.getSheetByName(RAW_SHEET_NAME);
  if (!rawSheet) return;

  const data = rawSheet.getDataRange().getValues();
  const hasPending = data.some(row => row[6] === "待處理"); 

  if (!hasPending) {
    logToSheet("暫無資料須處理!", 2);
    return; 
  }

  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(30000)) {
      logToSheet("【系統繁忙】前一次 AI 解析尚未結束，本次執行跳過。", 1);
      return; 
    }

    logToSheet("【智慧巡邏】發現待處理訂單，開始執行...", 1);

    // 在迴圈外取得一次產品清單與語意對照表
    const validProducts = getProductList(); 
    const semanticList = getSemanticList();
    
    for (let i = 1; i < data.length; i++) {
      let [time, botId, botName, uid, userName, msg, status] = data[i];
      
      if (status === "待處理") {
        try {
          // 傳入文字、產品清單、語意清單
          const aiResult = callGemini(msg, validProducts, semanticList,userName);
          
          executeAction(aiResult, uid, time, botId, msg);
          
          rawSheet.getRange(i + 1, 7).setValue("已完成");
          rawSheet.getRange(i + 1, 8).setValue(JSON.stringify(aiResult));

          Utilities.sleep(2000); // 正常執行下縮短等待時間
        } catch (e) {
          logToSheet("AI 處理錯誤: " + e.message, 1);
          if (e.message.includes("429")) break; 
        }
      }
    }

    // 呼叫位於 Utils.gs 與 RagicService.gs 的函式
    transferToMessageOrder();
    uploadOrdersToRagic();

  } catch (e) {
    logToSheet("處理程序發生異常: " + e.toString(), 1);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 執行動作：將 AI 解析結果寫入訊息轉訂單
 */
function executeAction(aiResult, uid, time, botId, msg) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const currentConfig = OA_CONFIG[botId] || { name: '未知OA', token: '' };
  const userName = currentConfig.token ? getUserProfile(uid, currentConfig.token) : "未知";

  if (aiResult.category === 'order') {
    let orderSheet = ss.getSheetByName('訊息轉訂單');
    if (!orderSheet) {
      orderSheet = ss.insertSheet('訊息轉訂單');
      orderSheet.appendRow([
        "日期", "來源OA", "用戶名", "轉換狀態", "產品明細", "UserID", "Ragic同步狀態", "原始訊息", "客戶指定日期","店家"
      ]);
    }

    // 將 items 陣列轉換為文字格式
    const itemDetails = aiResult.items.map(item => `${item.name} x ${item.qty}`).join(", ");
    const userMap = getUserMap();

    // 寫入 9 個欄位的資料，對應到 A~I 欄
    orderSheet.appendRow([
      time,                   // A: 日期
      currentConfig.name,     // B: 來源OA
      userName,               // C: 用戶名
      "待轉換",                // D: 轉換狀態
      itemDetails,            // E: 產品明細
      uid,                    // F: UserID
      "待同步",                // G: Ragic同步狀態
      msg,                    // H: 原始訊息
      aiResult.requested_date, // I: 客戶指定日期
      userMap[userName]        // J: 店家
    ]);
  }
}

/**
 * 呼叫 Gemini API 進行語意解析
 */
function callGemini(text, productList, semanticList, userName) {
  // 取得今天日期，幫助 AI 換算「明天」、「後天」
  const today = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd");
  const prompt = `你是一個食品公司的行政助理。請解析顧客訊息，並根據提供的「語意對照表」與「標準產品名稱」進行處理。
【背景資訊】：
  -今天是 ${today}
  -顧客姓名：${userName}
【1. 語意對照表】(若顧客提及原文，請對應至實際意思)：
${semanticList}
  
【2. 標準產品清單】：
${productList}
  
【任務指令】：
1. 判斷類別 (category)：請分類為 order (訂單), inquiry (詢問), 或 complaint (客訴)。
2. 提取日期 (requested_date)：
   - **若客戶提到特定日期（如：1/20、下週三、後天等），請統一換算為 YYYY/MM/DD 格式。**
   - 若未提到任何日期，此欄位請回傳 null。
3. 提取品項 (items)：
   - **如果訊息有"【Line表單】" 字樣，則不須做任何比對與轉換，直接使用所提供的產品名稱。
   - **優先對照語意對照表**：若顧客說法符合「原文提及」，請將其轉換為「實際意思」。
   - **多品項自動拆分**：若轉換後的「實際意思」包含多個產品（例如：A+B+C），請務必將其拆分為獨立的物件放入陣列中。
   - **標準名稱若為多項產品，將每個產品獨立為一筆資料。
   - **100% 匹配原則**：若品項名稱與「標準產品清單」沒有 100% 匹配且在對照表中也找不到，請直接保留顧客原本的說法，完全不要進行任何修改。
   - 提取對應的數量 (qty)，若未提及則預設為 1。

【輸入內容】：
顧客訊息：「顧客${userName}說: ${text}」

【輸出要求】：
請只回傳 JSON 格式，不需包含 summary，格式如下：
{"category": "...", "requested_date": "YYYY/MM/DD 或 null","items": [{"name": "產品名稱", "qty": 數量}]}`;

  const payload = {
    "contents": [{
      "parts": [{ "text": prompt }]
    }]
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(GEMINI_URL, options);
  const resText = response.getContentText();
  
  try {
    const jsonRes = JSON.parse(resText);
    if (!jsonRes.candidates || !jsonRes.candidates[0]) {
      throw new Error("Gemini 回傳格式異常: " + resText);
    }
    
    let content = jsonRes.candidates[0].content.parts[0].text;
    // 去除 Markdown 標籤
    content = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
    return JSON.parse(content);
  } catch (e) {
    throw new Error("解析 AI 回傳失敗: " + e.message);
  }
}

/**
 * 取得語意對照表並格式化為 Prompt 字串
 */
function getSemanticList() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('語意對照表');
  if (!sheet) return "無提供語意對照資訊";
  
  const data = sheet.getDataRange().getValues();
  let listText = "";
  
  // 從第 2 列開始讀取 (A: 原文提及, B: 實際意思)
  for (let i = 1; i < data.length; i++) {
    const original = data[i][0];
    const actual = data[i][1];
    if (original && actual) {
      listText += `- 「${original}」是指「${actual}」\n`;
    }
  }
  return listText || "無提供語意對照資訊";
}