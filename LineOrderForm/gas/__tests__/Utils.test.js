/**
 * Utils.js 單元測試
 * 需在 Jest 環境執行，jest.setup.js 已注入 GAS 全域 mock
 */
const { returnJson, filterDebugRows, getDefaultLogcleanRules } = require('../Utils.js');

describe('returnJson', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應呼叫 ContentService.createTextOutput 並設定 JSON MIME 類型', () => {
    const data = { foo: 'bar' };
    const result = returnJson(data);

    expect(ContentService.createTextOutput).toHaveBeenCalledWith(JSON.stringify(data));
    expect(result.setMimeType).toHaveBeenCalledWith(ContentService.MimeType.JSON);
  });

  it('應正確序列化陣列', () => {
    const data = [1, 2, 3];
    returnJson(data);
    expect(ContentService.createTextOutput).toHaveBeenCalledWith('[1,2,3]');
  });
});

describe('getDefaultLogcleanRules', () => {
  it('應回傳兩筆預設規則', () => {
    const rules = getDefaultLogcleanRules();
    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({ text: '暫無資料須處理!', matchType: 'exact', hourRestrict: null });
    expect(rules[1]).toEqual({ text: '[系統自動清理]：', matchType: 'startsWith', hourRestrict: 6 });
  });
});

describe('filterDebugRows', () => {
  it('未傳 rules 時使用預設規則，應移除「暫無資料須處理!」列（不論何時）', () => {
    const rows = [
      [new Date(), '一般訊息'],
      [new Date(), '暫無資料須處理!'],
      [new Date(), '另一則一般'],
    ];
    const result = filterDebugRows(rows, 10);
    expect(result).toHaveLength(2);
    expect(result[0][1]).toBe('一般訊息');
    expect(result[1][1]).toBe('另一則一般');
  });

  it('未傳 rules 時，非 6 點應保留「[系統自動清理]」列', () => {
    const rows = [
      [new Date(), '[系統自動清理]：已移除 1 筆'],
    ];
    const result = filterDebugRows(rows, 14);
    expect(result).toHaveLength(1);
  });

  it('未傳 rules 時，6 點應移除「[系統自動清理]」列', () => {
    const rows = [
      [new Date(), '一般'],
      [new Date(), '[系統自動清理]：已移除 2 筆'],
    ];
    const result = filterDebugRows(rows, 6);
    expect(result).toHaveLength(1);
    expect(result[0][1]).toBe('一般');
  });

  it('傳入自訂 rules 時依規則過濾', () => {
    const rows = [
      [new Date(), '要刪的'],
      [new Date(), '保留的'],
    ];
    const rules = [{ text: '要刪的', matchType: 'exact', hourRestrict: null }];
    const result = filterDebugRows(rows, 3, rules);
    expect(result).toHaveLength(1);
    expect(result[0][1]).toBe('保留的');
  });

  it('傳入 rules 且 hourRestrict 為 6 時，僅在 6 點移除', () => {
    const rows = [
      [new Date(), '[TEST]：訊息'],
    ];
    const rules = [{ text: '[TEST]：', matchType: 'startsWith', hourRestrict: 6 }];
    expect(filterDebugRows(rows, 6, rules)).toHaveLength(0);
    expect(filterDebugRows(rows, 14, rules)).toHaveLength(1);
  });

  it('空陣列應回傳空陣列', () => {
    expect(filterDebugRows([], 0)).toEqual([]);
  });
});
