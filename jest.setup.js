/**
 * Jest 全域設定：模擬 Google Apps Script 環境
 * 在執行 gas/*.js 前注入這些全域變數，避免 require 時報錯
 */

// --- 常數（對應 Config.js，測試用假值）---
global.SPREADSHEET_ID = global.SPREADSHEET_ID || 'test-spreadsheet-id';
global.RAW_SHEET_NAME = 'RawData';
global.DEBUG_SHEET_NAME = 'DebugLog';
global.PRODUCT_SHEET_NAME = '產品名稱對照表';
global.GEMINI_API_KEY = global.GEMINI_API_KEY || 'test-api-key';
global.GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + (global.GEMINI_API_KEY || '');
global.RAGIC_ACCOUNT = 'chyuanwei';
global.RAGIC_API_KEY = global.RAGIC_API_KEY || 'test-ragic-key';
global.RAGIC_URL = `https://ap14.ragic.com/${global.RAGIC_ACCOUNT}/ragicsales-order-management/1?v=3`;
global.RAGIC_MAPPING_SHEET_NAME = 'Ragic 對照表';
global.OA_CONFIG = global.OA_CONFIG || {};

const mockAppendRow = jest.fn();
const mockGetRange = jest.fn(() => ({
  getValues: jest.fn(() => []),
  setValues: jest.fn(),
}));
const mockSheet = {
  getLastRow: jest.fn(() => 10),
  getRange: mockGetRange,
  getDataRange: jest.fn(() => ({ getValues: jest.fn(() => [[]]) })),
  appendRow: mockAppendRow,
  clearContents: jest.fn(),
  insertSheet: jest.fn(() => mockSheet),
};
const mockSpreadsheet = {
  getSheetByName: jest.fn(() => mockSheet),
  insertSheet: jest.fn(() => mockSheet),
};

global.SpreadsheetApp = {
  openById: jest.fn(() => mockSpreadsheet),
  getActiveSpreadsheet: jest.fn(() => mockSpreadsheet),
};

global.PropertiesService = {
  getScriptProperties: jest.fn(() => ({
    getProperty: jest.fn((key) => {
      const props = {
        SPREADSHEET_ID: 'test-spreadsheet-id',
        GEMINI_API_KEY: 'test-gemini-key',
        RAGIC_API_KEY: 'test-ragic-key',
        OA_CONFIG_JSON: '{}',
      };
      return props[key] || null;
    }),
  })),
};

const mockTextOutput = {
  setMimeType: jest.fn(function () { return this; }),
};
global.ContentService = {
  createTextOutput: jest.fn(() => mockTextOutput),
  MimeType: { JSON: 'application/json' },
};

global.Utilities = {
  formatDate: jest.fn((date) => date.toISOString()),
};
