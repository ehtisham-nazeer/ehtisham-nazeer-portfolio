/* ============================================================
   Free Fire Pakistan — Community Groups & Moderation Report
   "Generate New Month" automation
   ------------------------------------------------------------
   INSTALL (one time, ~2 minutes):
   1. Open the spreadsheet (as the owner: ehtishamnazeer54@gmail.com)
   2. Menu: Extensions -> Apps Script
   3. Delete any code in Code.gs, paste this entire file, Save (Ctrl+S)
   4. Reload the spreadsheet -> a new "Reporting" menu appears
      next to Help, with "Generate New Month".
   5. (Optional, for a real clickable button): Insert -> Drawing ->
      draw a rounded rectangle with text "Generate New Month" ->
      Save and Close -> click the drawing's 3-dot menu ->
      "Assign script" -> type: generateNewMonth -> OK.
   ============================================================ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Reporting')
    .addItem('Generate New Month', 'generateNewMonth')
    .addToUi();
}

function generateNewMonth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  // 1. ask for the month name
  var resp = ui.prompt(
    'Generate New Month',
    'Enter the reporting month (e.g. Nov 25):',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  var name = resp.getResponseText().trim();
  if (!name) {
    ui.alert('Month name cannot be empty.');
    return;
  }

  // 2. prevent duplicates — never overwrite an existing report
  if (ss.getSheetByName(name)) {
    ui.alert('A sheet named "' + name + '" already exists.\n' +
             'Duplicate months are not allowed — open the existing sheet instead.');
    return;
  }

  // 3. duplicate the template
  var tpl = ss.getSheetByName('_Template');
  if (!tpl) {
    ui.alert('Template sheet "_Template" not found. It may have been renamed or deleted.');
    return;
  }
  var sh = tpl.copyTo(ss);
  sh.setName(name);
  sh.showSheet();

  // 4. place it right before _Template (after the last monthly sheet)
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(tpl.getIndex());

  // 5. set the report title
  sh.getRange('A1').setValue('Monthly Report \u2014 ' + name);

  // 6. register the month on the Dashboard (formulas are pre-filled,
  //    so totals and charts pick it up automatically)
  var dash = ss.getSheetByName('Dashboard');
  if (!dash) {
    ui.alert('Dashboard sheet not found.');
    return;
  }
  var months = dash.getRange('A12:A31').getValues();
  var row = -1;
  for (var i = 0; i < months.length; i++) {
    if (!months[i][0]) { row = 12 + i; break; }
  }
  if (row === -1) {
    ui.alert('Dashboard month list is full (rows 12\u201331).');
    return;
  }
  dash.getRange(row, 1).setValue(name);

  ui.alert('Monthly report "' + name + '" is ready.\n' +
           'Enter this month\u2019s figures in the white cells — ' +
           'blue cells calculate automatically.');
}
