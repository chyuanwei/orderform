/**
 * 分支 B：處理 LIFF 訂單資料
 */
function handleLiffOrder(payload) {
  // 第一時間將前端送來的 C 欄品名轉成 B 欄，後續流程不變
  const cToBMap = typeof getRagicCToBMap === "function" ? getRagicCToBMap() : {};
  payload.items.forEach(function (item) {
    item.name = cToBMap[item.name] || item.name;
  });

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 檢查並更新好友名單（僅測試環境 botId）
  const TEST_BOT_ID = "U7d234a2a4346dc8722c343c9cde29652";
  if (payload.ordererName && botId === TEST_BOT_ID) {
    updateFriendList(ss, payload.ordererName, payload.userId, payload.shopName);
  }
  let itemsSummary;
  const orderTime = new Date();
  const formatOrderTime = Utilities.formatDate(orderTime, "GMT+8", "yyyy/MM/dd HH:mm:ss");
  
  // 1. 先寫入 RawData 留下紀錄
  let rawSheet = ss.getSheetByName('RawData');
  if (rawSheet) {
    itemsSummary = payload.items.map(i => `${i.name}x${i.count}`).join('\n');
    // 建構包含備註的訊息字串
    const displayMsg = `【Line表單】\n--------------------\n下單時間：${formatOrderTime}\n店家名稱：${payload.shopName}\n訂購人：${payload.ordererName}\n預計出貨日：${payload.shipDate}\n備註：${payload.remark || '無'}\n--------------------\n訂購明細：\n${itemsSummary}`;
    
    rawSheet.appendRow([
      orderTime, 
      botId, 
      currentConfig.name, 
      payload.userId || "N/A", 
      payload.ordererName, 
      displayMsg, 
      "LIFF即時同步", 
      `【Line表單】不須AI解析\n--------------------\n下單時間：${formatOrderTime}\n店家名稱：${payload.shopName}\n訂購人：${payload.ordererName}\n預計出貨日：${payload.shipDate}\n備註：${payload.remark || '無'}\n--------------------\n訂購明細：\n${itemsSummary}`
    ]);
  }

  const sheet = ss.getSheetByName('表單下單');
  if (!sheet) throw new Error("找不到『表單下單』分頁");

  // 2. 寫入試算表 (在最後一欄增加備註)
  payload.items.forEach(item => {
    sheet.appendRow([
      orderTime,   
      payload.shopName,    
      payload.ordererName, 
      payload.shipDate,    
      item.name,           
      item.count,          
      payload.userId || "",
      payload.remark || "" // 新增第八欄：備註
    ]);
  });

  // 3. 即時同步 Ragic
  try {
    if (typeof sendToRagicAPI === "function") {
      const ragicMap = typeof getRagicNameMap === 'function' ? getRagicNameMap() : {};
      const userMap = typeof getUserMap === 'function' ? getUserMap() : {};

      const finalCustomerName = userMap[payload.ordererName] || payload.ordererName;
      const formatOrderTime = Utilities.formatDate(orderTime, "GMT+8", "yyyy/MM/dd HH:mm:ss");
      
      const ragicPayload = {
        "1000006": finalCustomerName,
        "1000008": payload.shipDate,
        "1000009": payload.orderDate,
        // Ragic 的詳細說明欄位也同步加入備註
        "1000012": currentConfig.name + `\n【Line表單】\n--------------------\n下單時間：${formatOrderTime}\n店家名稱：${payload.shopName}\n訂購人：${payload.ordererName}\n預計出貨日：${payload.shipDate}\n備註：${payload.remark || '無'}\n--------------------\n訂購明細：\n${itemsSummary}`,
        "_subtable_1000014": {}
      };

      payload.items.forEach((item, index) => {
        const finalRagicName = ragicMap[item.name] || item.name;
        ragicPayload["_subtable_1000014"]["-" + (index + 1)] = {
          "1000010": finalRagicName,
          "1000011": item.count
        };
      });

      const result = sendToRagicAPI(ragicPayload);
      if (result && result.status === "SUCCESS") {
        console.log("✅ LIFF 訂單即時同步 Ragic 成功！");
      } else {
        const httpCode = result && result.httpCode != null ? result.httpCode : 'N/A';
        const msg = result && (result.msg || result.message) ? (result.msg || result.message) : '未知原因';
        const status = result && result.status ? result.status : 'UNKNOWN';
        const errSummary = `❌ LIFF即時同步Ragic失敗：status=${status}, http=${httpCode}, msg=${msg}`;
        console.error(errSummary);
        if (typeof logToSheet === "function") {
          logToSheet(errSummary, 1);
        }
      }
    }
  } catch (e) {
    console.error("即時同步 Ragic 過程發生崩潰: " + e.message);
    if (typeof logToSheet === "function") {
      logToSheet("LIFF即時同步Ragic崩潰: " + e.toString(), 1);
    }
  }
  
  return ContentService.createTextOutput("Success")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 更新好友名單：檢查 username 是否存在，不存在則新增，存在則更新店家名稱
 */
function updateFriendList(ss, username, userId, shopName) {
  try {
    const friendSheet = ss.getSheetByName(FRIEND_LIST_SHEET_NAME);
    if (!friendSheet) {
      logToSheet("找不到『好友名單』分頁，跳過更新", 2);
      return;
    }

    const data = friendSheet.getDataRange().getValues();
    const combinedName = shopName && username ? `${shopName}-${username}` : "";
    
    // 檢查 B 欄是否已有此 username
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && String(data[i][1]).trim() === username.trim()) {
        // 已存在：檢查店家名稱是否有變更
        const oldShopName = data[i][2] ? String(data[i][2]).trim() : "";
        const newShopName = shopName ? String(shopName).trim() : "";
        
        if (oldShopName !== newShopName) {
          // 店家名稱有變更，更新 C 欄和 D 欄
          friendSheet.getRange(i + 1, 3).setValue(shopName || "");  // C 欄
          friendSheet.getRange(i + 1, 4).setValue(combinedName);    // D 欄
          logToSheet(`好友名單已更新：username=${username}, 舊店家=${oldShopName}, 新店家=${newShopName}`, 1);
        } else {
          logToSheet(`好友名單已存在 username: ${username}，店家名稱相同，不更新`, 2);
        }
        return;
      }
    }

    // 不存在，新增一筆資料
    friendSheet.appendRow([
      userId || "",           // A 欄：uid
      username || "",         // B 欄：username
      shopName || "",         // C 欄：店家名稱
      combinedName            // D 欄：店家-username
    ]);
    logToSheet(`好友名單新增：username=${username}, 店家=${shopName}`, 1);
  } catch (err) {
    console.error("updateFriendList 發生錯誤: " + err.message);
    if (typeof logToSheet === "function") {
      logToSheet("updateFriendList 錯誤: " + err.toString(), 1);
    }
  }
}