const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const ExcelJS = require('exceljs');

function readJson(relativePath) {
  const filePath = path.resolve(__dirname, '..', 'data', relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readCsv(relativePath) {
  const filePath = path.resolve(__dirname, '..', 'data', relativePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function readExcel(relativePath, sheetName) {
  const filePath = path.resolve(__dirname, '..', 'data', relativePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  const rows = [];
  const headerRow = sheet.getRow(1).values.slice(1);
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1);
    const record = {};
    headerRow.forEach((key, idx) => (record[key] = values[idx]));
    rows.push(record);
  });
  return rows;
}

module.exports = { readJson, readCsv, readExcel };
