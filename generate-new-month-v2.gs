/* ============================================================
   Free Fire Pakistan — Community Groups & Moderation Report
   "Generate New Month" automation (v2 — mobile friendly)
   ------------------------------------------------------------
   HOW IT WORKS:
   - DESKTOP: menu Reporting -> Generate New Month (asks month name)
   - MOBILE: on the Dashboard, pick the month from the dropdown
     (cell C5), then tick the checkbox (cell F6). The new sheet is
     created automatically — no authorization prompt, no button.
   ============================================================ */

var MONTH_LIST = ['Nov 26', 'Dec 26', 'Jan 27', 'Feb 27', 'Mar 27', 'Apr 27',
                  'May 27', 'Jun 27', 'Jul 27', 'Aug 27', 'Sep 27', 'Oct 27'];
var PANEL_MONTH_CELL = 'C5';   // dropdown
var PANEL_CHECK_CELL = 'F6';   // checkbox
var PANEL_STATUS_CELL = 'A7';  // status message

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Reporting')
    .addItem('Generate New Month', 'generateNewMonth')
    .addToUi();
}

// Mobile flow: ticking the Dashboard checkbox creates the month.
function onEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== 'Dashboard') return;
  if (e.range.getRow() !== 6 || e.range.getColumn() !== 6) return;
  if (e.value !== 'TRUE') return;  // only on tick, not untick
  var ss = e.source;
  var dash = ss.getSheetByName('Dashboard');
  var raw = dash.getRange(PANEL_MONTH_CELL).getValue();
  try {
    var msg = createMonth(ss, raw);
    dash.getRange(PANEL_STATUS_CELL).setValue(msg);
  } catch (err) {
    dash.getRange(PANEL_STATUS_CELL).setValue('\u26A0\uFE0F ' + err.message);
  }
  dash.getRange(PANEL_CHECK_CELL).setValue(false);  // untick
}

// Converts a cell value to a valid "Mon yy" month name.
// Handles Date objects (if the cell was date-parsed) and rejects
// anything not in MONTH_LIST — never creates a garbage sheet.
function normalizeMonth(raw) {
  if (Object.prototype.toString.call(raw) === '[object Date]' && !isNaN(raw)) {
    var mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    raw = mons[raw.getMonth()] + ' ' + String(raw.getFullYear()).slice(2);
  }
  var name = String(raw).trim();
  if (MONTH_LIST.indexOf(name) === -1) {
    throw new Error('Please pick a valid month from the dropdown (e.g. Dec 25).');
  }
  return name;
}

// Shared core: creates the monthly sheet, never overwrites.
function createMonth(ss, rawName) {
  var name = normalizeMonth(rawName);
  if (ss.getSheetByName(name)) {
    throw new Error('"' + name + '" already exists \u2014 open it instead.');
  }
  var tpl = ss.getSheetByName('_Template');
  if (!tpl) {
    throw new Error('Template "_Template" not found.');
  }
  var sh = tpl.copyTo(ss);
  sh.setName(name);
  sh.showSheet();
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(tpl.getIndex());
  sh.getRange('A1').setValue('Monthly Report \u2014 ' + name);

  var dash = ss.getSheetByName('Dashboard');
  var months = dash.getRange('A12:A31').getValues();
  var row = -1;
  for (var i = 0; i < months.length; i++) {
    if (!months[i][0]) { row = 12 + i; break; }
  }
  if (row === -1) {
    throw new Error('Dashboard month list is full.');
  }
  dash.getRange(row, 1).setNumberFormat('@');  // text, not a date
  dash.getRange(row, 1).setValue(name);

  // advance the dropdown to the next month
  var idx = MONTH_LIST.indexOf(name);
  if (idx >= 0 && idx + 1 < MONTH_LIST.length) {
    dash.getRange(PANEL_MONTH_CELL).setNumberFormat('@');  // text, not a date
    dash.getRange(PANEL_MONTH_CELL).setValue(MONTH_LIST[idx + 1]);
  }
  return '\u2705 "' + name + '" is ready \u2014 enter figures in the white cells.';
}

// Desktop flow: menu prompts for the month name.
function generateNewMonth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt(
    'Generate New Month',
    'Enter the reporting month (e.g. Nov 25):',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  try {
    var msg = createMonth(ss, resp.getResponseText().trim());
    ui.alert(msg);
  } catch (err) {
    ui.alert('\u26A0\uFE0F ' + err.message);
  }
}
