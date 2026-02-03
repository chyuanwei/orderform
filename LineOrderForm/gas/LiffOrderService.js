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
        console.error("❌ Ragic 同步失敗：" + (result ? result.msg : "未知原因"));
      }
    }
  } catch (e) {
    console.error("即時同步 Ragic 過程發生崩潰: " + e.message);
  }
  
  return ContentService.createTextOutput("Success")
    .setMimeType(ContentService.MimeType.TEXT);
}