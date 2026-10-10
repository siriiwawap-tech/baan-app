/**
 * 🏠 บ้านของเรา – Google Sheet auto-save (Apps Script)
 * วิธีใช้: วางโค้ดนี้ใน Extensions > Apps Script ของชีต → เลือกฟังก์ชัน setup → Run
 * → Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone) → คัดลอก URL ไปใส่ในแอพ
 */
var TABS = ['บัญชีรับจ่าย','คลังของ','สมาชิก','เมนู','งานบ้าน','ชอปปิ้ง','บิล','ออม','หนี้','ประวัติจ่ายหนี้','สรุป'];
var BACKUP = '_backup';

function setup() {
  var p = PropertiesService.getScriptProperties();
  var code = p.getProperty('SYNC_CODE');
  if (!code) {
    code = Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase();
    p.setProperty('SYNC_CODE', code);
  }
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('ตั้งค่า') || ss.insertSheet('ตั้งค่า', 0);
  sh.getRange('A1:B3').setValues([
    ['รหัสซิงค์ (ใส่ในแอพ)', code],
    ['ขั้นต่อไป', 'Deploy > New deployment > Web app > Execute as: Me, Access: Anyone แล้วคัดลอก URL ไปใส่ในแอพ'],
    ['อย่าแชร์รหัสนี้', 'ใครมี URL + รหัส จะเขียน/อ่านข้อมูลได้']
  ]);
  sh.getRange('B1').setFontSize(18).setFontWeight('bold').setBackground('#FFF1D6');
  sh.autoResizeColumns(1, 2);
  Logger.log('รหัสซิงค์ของคุณ: ' + code);
  return code;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function checkSecret_(s) {
  var code = PropertiesService.getScriptProperties().getProperty('SYNC_CODE');
  if (!code) throw new Error('ยังไม่ได้รัน setup ในสคริปต์');
  if (String(s || '').trim().toUpperCase() !== code) throw new Error('รหัสซิงค์ไม่ถูกต้อง');
}
function cleanVal_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? '✔' : '';
  if (typeof v === 'object') return JSON.stringify(v);
  var s = String(v);
  if (/^data:image\//.test(s)) return '[รูป]';
  return typeof v === 'number' ? v : (s.length > 45000 ? s.slice(0, 45000) : s);
}
function writeTable_(ss, name, rows) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  rows = rows || [];
  var heads = [];
  rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (heads.indexOf(k) < 0) heads.push(k); }); });
  if (!heads.length) { sh.getRange(1, 1).setValue('(ยังไม่มีข้อมูล)'); return 0; }
  var data = [heads].concat(rows.map(function (r) { return heads.map(function (h) { return cleanVal_(r[h]); }); }));
  sh.getRange(1, 1, data.length, heads.length).setValues(data);
  sh.getRange(1, 1, 1, heads.length).setFontWeight('bold').setBackground('#F1E3CB');
  sh.setFrozenRows(1);
  return rows.length;
}
function saveBackup_(ss, str) {
  var sh = ss.getSheetByName(BACKUP) || ss.insertSheet(BACKUP);
  sh.clearContents();
  var parts = [];
  for (var i = 0; i < str.length; i += 40000) parts.push([str.slice(i, i + 40000)]);
  if (parts.length) sh.getRange(1, 1, parts.length, 1).setValues(parts);
  sh.hideSheet();
}
function loadBackup_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(BACKUP);
  if (!sh || sh.getLastRow() < 1) return null;
  var v = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (r) { return r[0]; }).join('');
  return v ? JSON.parse(v) : null;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    checkSecret_(req.secret);
    if (req.action === 'ping') return json_({ ok: true, sheet: SpreadsheetApp.getActive().getName(), url: SpreadsheetApp.getActive().getUrl() });
    if (req.action === 'get') return json_({ ok: true, data: loadBackup_(), savedAt: PropertiesService.getScriptProperties().getProperty('SAVED_AT') });
    lock.waitLock(20000);
    var ss = SpreadsheetApp.getActive(), counts = {};
    var t = req.tables || {};
    TABS.forEach(function (n) { if (t[n]) counts[n] = writeTable_(ss, n, t[n]); });
    if (req.backup) saveBackup_(ss, typeof req.backup === 'string' ? req.backup : JSON.stringify(req.backup));
    var now = new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty('SAVED_AT', now);
    return json_({ ok: true, savedAt: now, counts: counts });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet(e) {
  try {
    checkSecret_(e && e.parameter && e.parameter.secret);
    return json_({ ok: true, data: loadBackup_(), savedAt: PropertiesService.getScriptProperties().getProperty('SAVED_AT') });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}
