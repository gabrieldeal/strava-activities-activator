#!/usr/bin/env node

import Commander from 'commander';
import XLSX from 'xlsx';
import Strava from 'strava-v3';

function handle_athlete_load(athlete) {
  console.log(athlete);
}

function load_athelete(access_token, on_athelete_load) {
  const handle_response = (err, payload) => {
    if(err) {
      throw new Error(err.msg);
    }
    on_athelete_load(payload);
  };
  const args = { access_token: '7c978e025222c704fd0bcf884dada3146ecda921' };

  Strava.athlete.get(args, handle_response);
}

function read_spreadsheet(spreadsheet) {
  var wb = XLSX.readFile(spreadsheet);
  var ws = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  ws.filter((row) => row['Day'])
    .forEach((row) => {
      console.log(row);
    });
}

function main() {
  Commander.version('0.1.0')
    .option('-s, --spreadsheet <spreadsheet>', 'Spreadsheet containing the activity data')
    .option('-a, --access-token <access_token>', 'Strava application access token')
    .parse(process.argv);

  read_spreadsheet(Commander.spreadsheet);
  load_athelete(Commander.access_token, handle_athlete_load);
}

main();
