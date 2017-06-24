#!/usr/bin/env node

import Commander from 'commander';
import HTTP from 'http';
import QueryString from 'querystring';
import Strava from 'strava-v3';
import XLSX from 'xlsx';
import opn from 'opn';
import request from 'request';
import { URL } from 'url';

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

function handleAuthorizeRedirectRequest({ handleAuthorizeCode, request, response }) {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname !== '/code') {
    console.info(`Ignoring request to ${request.url}`);
    return;
  }

  const query = QueryString.parse(request.url);
  handleAuthorizeCode(query.code);
  response.end('OK.  Done now.  You can close this browser.');
}

function makeTokenExchangeRequest({ clientId, clientSecret, code, handleAccessToken }) {
  const url = 'https://www.strava.com/oauth/token';
  const form = {
    client_id: clientId,
    client_secret: clientSecret,
    code: code
  };

  const handleTokenExchangeResponse = (error, response, bodyJson) => {
    const body = JSON.parse(bodyJson);
    handleAccessToken(body.access_token);
  };

  request.post({ url, form }, handleTokenExchangeResponse);
}

function startWebserver(handleAuthorizeCode, port) {
  const culledHandleRequest = (request, response) =>
        handleAuthorizeRedirectRequest({ handleAuthorizeCode, request, response });
  const server = HTTP.createServer(culledHandleRequest);
  server.listen(port, (err) => {
    if (err) {
      throw Error(err);
    }
  })
}

function doStravaAuthorization({ handleAccessToken, clientId, clientSecret, port }) {
  const handleAuthorizeCode = (code) =>
        makeTokenExchangeRequest({ clientId, clientSecret, code, handleAccessToken });
  startWebserver(handleAuthorizeCode, port)

  const redirectUrl = `http://localhost:${port}/code`;

  const authUrl = new URL('https://www.strava.com/oauth/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUrl);
  authUrl.searchParams.append('scope', 'write');
  authUrl.searchParams.append('approval_prompt', 'auto');
  // There is also an optional 'state' param.

  opn(authUrl.href);
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
