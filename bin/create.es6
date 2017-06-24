#!/usr/bin/env node

import Commander from 'commander';
import XLSX from 'xlsx';
import Strava from 'strava-v3';
import HTTP from 'http';
import opn from 'opn';

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

  // http://yizeng.me/2017/01/11/get-a-strava-api-access-token-with-write-permission/
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

function start_webserver(requestHandler, port) {
  const server = HTTP.createServer(requestHandler)

  server.listen(port, (err) => {
    if (err) {
      throw Error(err);
    }
  })
}

function dumpAuthorizationRedirect(request) {
  console.log(request);
}

function main() {
  Commander.version('0.1.0')
    .option('-s, --spreadsheet <spreadsheet>', 'Spreadsheet containing the activity data')
    .option('-a, --access-token <access_token>', 'Strava application access token')
    .option('-p, --port [port]', 'HTTP port to run webserver on')
    .parse(process.argv);

  read_spreadsheet(Commander.spreadsheet);

  start_webserver(dumpAuthorizationRedirect, Commander.port || 8888);
  opn('https://www.strava.com/oauth/authorize');


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
