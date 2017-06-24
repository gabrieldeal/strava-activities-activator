#!/usr/bin/env node

import Commander from 'commander';
import XLSX from 'xlsx';
// import Strava from 'strava-v3';

Commander.version('0.1.0')
  .option('-s, --spreadsheet <spreadsheet>', 'Spreadsheet containing the activity data')
  .parse(process.argv);

var wb = XLSX.readFile(Commander.spreadsheet);
var ws = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

ws.filter((row) => row['Day'])
  .forEach((row) => {
    console.log(row);
  });
