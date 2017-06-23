#!/usr/bin/env node

var options = require('commander');
var xlsx = require('xlsx');
var strava = require('strava-v3');

options.version('0.1.0')
  .option('-s, --spreadsheet <spreadsheet>', 'Spreadsheet containing the activity data')
  .parse(process.argv);
 
console.log('Reading "%s".', options.spreadsheet);
var wb = xlsx.readFile(options.spreadsheet);
var ws = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
console.log(ws);

ws.forEach((row) => {
  console.log(row);
});
