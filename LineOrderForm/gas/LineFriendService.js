function getUserProfile(userId, token) {
  var url = 'https://api.line.me/v2/bot/profile/' + userId;
  try {
    var response = UrlFetchApp.fetch(url, { 'headers': { 'Authorization': 'Bearer ' + token }, 'method': 'get', 'muteHttpExceptions': true });
    if (response.getResponseCode() === 200) return JSON.parse(response.getContentText()).displayName;
    return "未知用戶";
  } catch (e) { return "Error"; }
}

function syncLineFollowersToSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('好友名單') || ss.insertSheet('好友名單').appendRow(['uid', 'name']);
  const botId = "U1e2d1ee2a09bd678fb29b4c60fd156d7"; 
  const config = OA_CONFIG[botId];
  if (!config) return;
  const token = config.token;

  let allUserIds = [];
  let nextToken = null;
  do {
    let url = 'https://api.line.me/v2/bot/followers/ids' + (nextToken ? '?start=' + nextToken : '');
    const response = UrlFetchApp.fetch(url, { 'method': 'get', 'headers': { 'Authorization': 'Bearer ' + token }, 'muteHttpExceptions': true });
    const resJson = JSON.parse(response.getContentText());
    if (resJson.userIds) allUserIds = allUserIds.concat(resJson.userIds);
    nextToken = resJson.next || null;
  } while (nextToken);

  const finalData = allUserIds.map(uid => {
    const profileRes = UrlFetchApp.fetch('https://api.line.me/v2/bot/profile/' + uid, { 'headers': { 'Authorization': 'Bearer ' + token }, 'muteHttpExceptions': true });
    const profileJson = JSON.parse(profileRes.getContentText());
    return [uid, profileJson.displayName || "未提供名稱"];
  });

  if (finalData.length > 0) {
    sheet.getRange(2, 1, sheet.getLastRow() > 1 ? sheet.getLastRow()-1 : 1, 2).clearContent();
    sheet.getRange(2, 1, finalData.length, 2).setValues(finalData);
  }
}

function updateFriendList(ss, uid, name) {
  let friendSheet = ss.getSheetByName('好友名單') || ss.insertSheet('好友名單').appendRow(['uid', 'name']);
  const isExist = friendSheet.getDataRange().getValues().some(row => row[0] === uid);
  if (!isExist) friendSheet.appendRow([uid, name]);
}

function getUserMap() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('好友名單');
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    const username = data[i][1] ? data[i][1].toString().trim() : "";
    const shopPerson = data[i][3] ? data[i][3].toString().trim() : "";
    if (username) map[username] = shopPerson;
  }
  return map;
}