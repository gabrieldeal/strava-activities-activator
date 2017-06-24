#!/usr/bin/env node

import Commander from 'commander';
import Strava from 'strava-v3';
import XLSX from 'xlsx';

import { doStravaAuthorization } from '../lib/strava/authenticator.es6';

function handleCreatedActivity(payload) {
  console.log('Created this activity: ', payload);
}

function createActivity({ accessToken,
                          handleCreatedActivity,
                           activity })
{
  const handleResponse = (err, payload) => {
    if(err) {
      throw new Error(err.msg);
    }
    handleCreatedActivity(payload);
  };
  const args = {
    ...activity,
    access_token: accessToken
  };

  Strava.activities.create(args, handleResponse);
}

function readSpreadsheet(spreadsheet) {
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
    .option('-c, --client-id <client_id>', 'Strava application client ID')
    .option('-S, --client-secret <client_secret>', 'Strava application client secret')
    .option('-p, --port [port]', 'HTTP port to run webserver on')
    .parse(process.argv);

  //readSpreadsheet(Commander.spreadsheet);

  const activity = {
    name: "The name",
    type: "Hike",
    start_date_local: new Date().toISOString(),
    elapsed_time: 600,
    distance: 100,
    'private': 1
  };
  const culledCreateActivity = (accessToken) =>
        createActivity({ activity,
                         accessToken,
                         handleCreatedActivity });
  doStravaAuthorization({ handleAccessToken: culledCreateActivity,
                          clientId: Commander.clientId,
                          clientSecret: Commander.clientSecret,
                          port: Commander.port || 8888 });
}

main();
