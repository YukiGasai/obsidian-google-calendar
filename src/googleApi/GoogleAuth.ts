/* eslint-disable @typescript-eslint/no-var-requires */


/*
	This file is used to authenticate the user to the google google cloud service 
	and refresh the access token if needed 
*/


import type { IncomingMessage, ServerResponse } from 'http';

import GoogleCalendarPlugin from './../GoogleCalendarPlugin';
import {
	settingsAreComplete,
	settingsAreCompleteAndLoggedIn,
} from "../view/GoogleCalendarSettingTab";
import {
	getAccessToken,
	getExpirationTime,
	getRefreshToken,
	getUserId,
	setAccessToken,
	setExpirationTime,
	setRefreshToken,
} from "../helper/LocalStorage";
import { Notice, Platform, requestUrl } from "obsidian";



const PORT = 42813


function checkAccessTokenValid(): boolean {
	//Check if the token exists
	if(!getAccessToken() || getAccessToken() == "")return false;

	//Check if Expiration time is not set or deafault 0
	if(!getExpirationTime())return false;

	//Check if Expiration time is set to text
	if(isNaN(getExpirationTime()))return false
	
	//Check if Expiration time is in the past so the token is expired
	if(getExpirationTime() < +new Date())return false;

	return true;
}


const refreshWithCustomClient = async (plugin:GoogleCalendarPlugin): Promise<boolean>  => {

	const refreshBody = {
		client_id: plugin.settings.googleClientId,
		client_secret: plugin.settings.googleClientSecret,
		grant_type: "refresh_token",
		refresh_token: getRefreshToken(),
	};

	const response = await requestUrl({
		method: "POST",
		url: "https://oauth2.googleapis.com/token",
		body: JSON.stringify(refreshBody)
	});

	if (response.status != 200) return false;

	//Save new Access token and Expiration Time
	const tokenData = await response.json;
	setAccessToken(tokenData.access_token);
	setExpirationTime(+new Date() + tokenData.expires_in*1000);
	return true;
}


const refreshWithDefaultClient = async (plugin:GoogleCalendarPlugin): Promise<boolean>  => {

	const refreshBody = {
		uid: getUserId(),
	};

	const response = await requestUrl({
		url:`${plugin.settings.googleOAuthServer}/api/google/refresh`,
		method: "POST",
		body: JSON.stringify(refreshBody),
		headers: {"Content-Type":"application/json"}
	});



	if (response.status != 200) return false;

	//Save new Access token and Expiration Time
	const {tokenData} = await response.json;
	setAccessToken(tokenData.access_token);
	setExpirationTime(+new Date() + tokenData.expires_in*1000);
	return true;
}

/**
 * Function the get the acces token used in every request to the Google Calendar API
 * 
 * Function will check if a accses token exists and if its still valid
 * if not it will request a new access token using the refersh token
 * 
 * @returns A valid access Token
 */
export async function getGoogleAuthToken(): Promise<string> {
	const plugin = GoogleCalendarPlugin.getInstance();
	if (!settingsAreCompleteAndLoggedIn()) return "";
	let gotRefreshToken = false;
	//Check if the Access token is still valid
	if (
		checkAccessTokenValid() == false
	) {
		//Acceess token is no loger valid have to create a new one
		if (getRefreshToken() != "" || getUserId() != "") {

			if(plugin.settings.useCustomClient){

				gotRefreshToken = await refreshWithCustomClient(plugin);

				if(gotRefreshToken == false){
					gotRefreshToken = await refreshWithDefaultClient(plugin)
				}
			}else{
				gotRefreshToken = await refreshWithDefaultClient(plugin)
			}
		}
	}
	return getAccessToken();
}

/**
 * Function to allow the user to grant the APplication access to his google calendar by OAUTH authentication
 * 
 * Function will start a local server 
 * User is redirected to OUATh screen
 * If authentication is sucessfull user is redirected to local server
 * Server will read the tokens and save it to local storage
 * Local server will shut down
 * 
 */
export async function LoginGoogle(): Promise<void> {

	const plugin = GoogleCalendarPlugin.getInstance();
	if (Platform.isDesktop) {
		if (!settingsAreComplete()) return;
		const { OAuth2Client } = require("google-auth-library");
		const http = require("http");
		const open = require("open");
		const url = require("url");
		const destroyer = require("server-destroy");
		const oAuth2Client = new OAuth2Client(
			plugin.settings.googleClientId,
			plugin.settings.googleClientSecret,
			`http://127.0.0.1:${PORT}/callback`
		);
		const authorizeUrl = oAuth2Client.generateAuthUrl({
			scope: [
				"https://www.googleapis.com/auth/calendar",
			],
			access_type: "offline",
			prompt: "consent"
		});

		const server = http
			.createServer(async (req: IncomingMessage, res: ServerResponse) => {
				try {
					if (req.url.indexOf("/callback") > -1) {
						// acquire the code from the querystring, and close the web server.
						const qs = new url.URL(
							req.url,
							`http://localhost:${PORT}`
						).searchParams;
						const code = qs.get("code");
						res.end(
							"Authentication successful! Please return to obsidian."
						);
						server.destroy();

						// Now that we have the code, use that to acquire tokens.
						const r = await oAuth2Client.getToken(code);

						setRefreshToken(r.tokens.refresh_token);
						setAccessToken(r.tokens.access_token);
						setExpirationTime(r.tokens.expiry_date);

						console.info("Tokens acquired.");
						plugin.settingsTab.display();
					}
				} catch (e) {
					console.log("Auth failed")
				}
			})
			.listen(PORT, async () => {
				// open the browser to the authorize url to start the workflow
				const cp = await open(authorizeUrl, { wait: false })
				cp.unref()		
			});

		destroyer(server);
	} else {
		new Notice("Can't use OAuth on this device");
	}
}