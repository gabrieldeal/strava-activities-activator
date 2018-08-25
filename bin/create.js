#!/usr/bin/env babel-node

import Commander from 'commander';
import Strava from 'strava-v3';
import XLSX from 'xlsx';
import authorize from 'strava-v3-cli-authenticator';
import moment from 'moment';

function createActivities (activities, accessToken) {
  const callback = (newActivity) => {
    console.log('Uploaded this activity: ', newActivity);
  };

  activities.forEach((activity) => {
    const options = {
      accessToken,
      activity
    };
    createActivity(options, callback);
  });
}

function createActivity ({ accessToken, activity }, callback) {
  const handleResponse = (err, payload) => {
    if (err) {
      throw new Error(err.msg);
    }
    callback(payload);
  };
  const args = {
    ...activity,
    access_token: accessToken
  };
  console.log(args);
  Strava.activities.create(args, handleResponse);
}

function toSeconds (duration) {
  if (!duration) {
    return undefined;
  }

  const match = duration.match(/^(\d+):(\d+)$/);
  if (!match) {
    return undefined;
  }

  const hours = match[1];
  const minutes = match[2];
  return hours * 60 * 60 + minutes * 60;
}

function convertToActivity (spreadsheetRow) {
  const activity = {
    type: 'Hike'
  };

  const startMoment = moment(spreadsheetRow['Start'], 'YYYY/MM/DD HH:mm');
  if (!startMoment.isValid()) {
    console.log("Missing or invalid 'Start'.");
    return undefined;
  }
  activity.start_date_local = startMoment.toISOString();

  activity.elapsed_time = toSeconds(spreadsheetRow['Duration']);
  if (!activity.elapsed_time) {
    console.log("Missing or invalid 'Duration'.");
    return undefined;
  }

  activity.name = 'Day ' + spreadsheetRow['Day'] + ': to ' + spreadsheetRow['Name'];
  if (!spreadsheetRow['Name'] || !spreadsheetRow['Day']) {
    console.log("Missing or 'Day' or 'Name'.");
    return undefined;
  }

  const miles = spreadsheetRow['Miles'];
  if (!miles) {
    console.log("Missing 'Miles'.");
    return undefined;
  }
  const metersPerMile = 1609.34;
  activity.distance = miles * metersPerMile;

  return activity;
}

function readSpreadsheet (spreadsheet) {
  var wb = XLSX.readFile(spreadsheet);
  var ws = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  return ws.map((row) => convertToActivity(row))
    .filter((activity) => activity);
}

function authorizeAndCreateActivities (activities) {
  const callback = (error, accessToken) => {
    if (error) {
      throw new Error(error);
    }
    createActivities(activities, accessToken);
  }
  const options = {
    clientId: Commander.clientId,
    clientSecret: Commander.clientSecret,
    scope: 'write',
    httpPort: Commander.port || 8888
  };
  authorize(options, callback);
}

function main () {
  Commander.version('0.1.0')
    .option('-s, --spreadsheet <spreadsheet>', 'Spreadsheet containing the activity data')
    .option('-a, --access-token <access_token>', 'Strava application access token')
    .option('-c, --client-id <client_id>', 'Strava application client ID')
    .option('-S, --client-secret <client_secret>', 'Strava application client secret')
    .option('-p, --port [port]', 'HTTP port to run webserver on')
    .option('-P, --name-prefix <name_prefix>', 'Activity name prefix', '')
    .option('-n, --upload', 'Print the activities but do not upload them to Strava')
    .parse(process.argv);

  const activities = readSpreadsheet(Commander.spreadsheet);
  activities.forEach((activity) => { activity.name = `${Commander.namePrefix}${activity.name}`; });
  if (!Commander.upload) {
    console.log(activities);
    console.log('Not uploading. Use --upload to upload.');
    return;
  }

  authorizeAndCreateActivities(activities);
}

main();
