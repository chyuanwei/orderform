function getRagicNameMap() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RAGIC_MAPPING_SHEET_NAME);
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    const stdName = data[i][0] ? data[i][0].toString().trim() : "";
    const ragicName = data[i][1] ? data[i][1].toString().trim() : "";
    if (stdName) map[stdName] = ragicName;
  }
  return map;
}

/**
 * C 欄 → B 欄對照（Ragic 對照表：C 為顯示用，B 為系統/Ragic 用）
 * 前端顯示 C 欄，送進後端後先轉成 B 欄再往下流程
 */
function getRagicCToBMap() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RAGIC_MAPPING_SHEET_NAME);
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    const colB = data[i][1] ? data[i][1].toString().trim() : "";
    const colC = data[i][2] ? data[i][2].toString().trim() : "";
    if (colC) map[colC] = colB;
  }
  return map;
}

function uploadOrdersToRagic() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const orderSheet = ss.getSheetByName('訊息轉訂單');
  if (!orderSheet) return;

  const ragicMap = getRagicNameMap();
  const userMap = getUserMap(); 
  const data = orderSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[3] === "已轉入訊息下單表" && row[6] !== "已同步Ragic") {
      const originalDate = new Date(row[0]);
      let shipDate;

      if (row[8] && row[8] !== "") {
        shipDate = Utilities.formatDate(new Date(row[8]), "GMT+8", "yyyy/MM/dd");
      } else {
        const nextDay = new Date(row[0]);
        nextDay.setDate(nextDay.getDate() + 1);
        shipDate = Utilities.formatDate(nextDay, "GMT+8", "yyyy/MM/dd");
      }

      const orderDate = Utilities.formatDate(originalDate, "GMT+8", "yyyy/MM/dd");
      const payload = {
        "1000006": userMap[row[2]] || row[2],
        "1000008": shipDate,
        "1000009": orderDate,
        "1000012": row[1] + ":\n" + "下單時間:"+Utilities.formatDate(originalDate, "GMT+8", "yyyy/MM/dd HH:mm:ss")+"\n"+ row[7],
        "_subtable_1000014": {}
      };

      const detailStr = row[4];
      if (detailStr && typeof detailStr === 'string') {
        const items = detailStr.split(',');
        items.forEach((item, index) => {
          const parts = item.split(' x ');
          if (parts.length === 2) {
            const stdName = parts[0].trim();
            payload["_subtable_1000014"]["-" + (index + 1)] = { 
              "1000010": ragicMap[stdName] || stdName,
              "1000011": parseInt(parts[1].trim())
            };
          }
        });
      }

      const result = sendToRagicAPI(payload);
      if (result && result.status === "SUCCESS") {
        orderSheet.getRange(i + 1, 7).setValue("已同步Ragic");
      } else {
        // 失敗時留下可追蹤的營運紀錄（避免卡在「待同步」卻無訊息）
        const httpCode = result && result.httpCode != null ? result.httpCode : 'N/A';
        const msg = result && (result.msg || result.message) ? (result.msg || result.message) : '';
        const status = result && result.status ? result.status : 'UNKNOWN';
        const summary = `Ragic同步失敗：status=${status}, http=${httpCode}, msg=${msg}`;
        if (typeof logToSheet === 'function') {
          logToSheet(`${summary} | 訊息轉訂單第${i + 1}列 | OA=${row[1]} | 用戶=${row[2]}`, 1);
        } else {
          console.error(summary);
        }
      }
    }
  }
}

function sendToRagicAPI(payload) {
  let ragicUrl = RAGIC_URL.replace("www.ragic.com", "ap14.ragic.com");
  if (!ragicUrl.includes("v=3")) ragicUrl += (ragicUrl.includes("?") ? "&v=3" : "?v=3");
  const authHeader = "Basic " + Utilities.base64Encode(RAGIC_API_KEY + ":");
  const options = { "method": "post", "contentType": "application/json", "headers": { "Authorization": authHeader, "Accept": "application/json" }, "payload": JSON.stringify(payload), "muteHttpExceptions": true };

  try {
    const response = UrlFetchApp.fetch(ragicUrl, options);
    const httpCode = response.getResponseCode();
    const rawText = response.getContentText();
    let resJson = null;
    try {
      resJson = JSON.parse(rawText);
    } catch (parseErr) {
      // 非 JSON 回傳（常見於 401/403 HTML），保留 raw 以利追查
      return { status: "ERROR", httpCode: httpCode, msg: "Non-JSON response: " + String(parseErr), raw: rawText };
    }
    // 統一補上 httpCode，方便上層記錄
    if (resJson && typeof resJson === 'object') resJson.httpCode = httpCode;
    return resJson;
  } catch (e) {
    return { status: "ERROR", httpCode: null, msg: e.toString() };
  }
}