#!/usr/bin/env node

import Commander from 'commander';
import XLSX from 'xlsx';
import Strava from 'strava-v3';

function handle_create(payload) {
  console.log(payload);
}

function create_activity({ access_token,
                           on_create,
                           activity })
{
  const handle_response = (err, payload) => {
    if(err) {
      throw new Error(err.msg);
    }
    on_create(payload);
  };
  const args = { access_token, ...activity, };

  Strava.activities.create(args, handle_response);
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

  const activity = {
    name: "The name",
    type: "Hike",
    start_date_local: new Date().toISOString(),
    elapsed_time: 600,
    distance: 100,
    'private': 1
  };
  create_activity({ access_token: Commander.accessToken,
                    on_create: handle_create,
                    activity });
}

main();
