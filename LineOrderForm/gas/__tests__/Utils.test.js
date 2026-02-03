/**
 * Utils.js 單元測試
 * 需在 Jest 環境執行，jest.setup.js 已注入 GAS 全域 mock
 */
const { returnJson, filterDebugRows } = require('../Utils.js');

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

describe('filterDebugRows', () => {
  it('應移除「暫無資料須處理!」列（不論何時）', () => {
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

  it('非 6 點時應保留「[系統自動清理]」列', () => {
    const rows = [
      [new Date(), '[系統自動清理]：已移除 1 筆'],
    ];
    const result = filterDebugRows(rows, 14);
    expect(result).toHaveLength(1);
  });

  it('6 點時應移除「[系統自動清理]」列', () => {
    const rows = [
      [new Date(), '一般'],
      [new Date(), '[系統自動清理]：已移除 2 筆'],
    ];
    const result = filterDebugRows(rows, 6);
    expect(result).toHaveLength(1);
    expect(result[0][1]).toBe('一般');
  });

  it('空陣列應回傳空陣列', () => {
    expect(filterDebugRows([], 0)).toEqual([]);
  });
});
