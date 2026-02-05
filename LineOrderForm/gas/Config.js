/**
 * --- 配置區 ---
 */
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const RAW_SHEET_NAME = 'RawData';
const DEBUG_SHEET_NAME = 'DebugLog';
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
const PRODUCT_SHEET_NAME = '產品名稱對照表'; 

// Ragic 配置資訊
const RAGIC_ACCOUNT = 'chyuanwei'; 
const RAGIC_API_KEY = PropertiesService.getScriptProperties().getProperty('RAGIC_API_KEY');
const RAGIC_URL = `https://ap14.ragic.com/${RAGIC_ACCOUNT}/ragicsales-order-management/1?v=3`;
const RAGIC_MAPPING_SHEET_NAME = 'Ragic 對照表';

// 好友名單配置（測試環境用）
const FRIEND_LIST_SHEET_NAME = '好友名單'; 

// 全域變數宣告
var botId;
var currentConfig;
var OA_CONFIG = JSON.parse(PropertiesService.getScriptProperties().getProperty('OA_CONFIG_JSON'));