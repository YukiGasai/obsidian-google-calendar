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
	setAccessToken,
	setExpirationTime,
	setRefreshToken,
} from "../helper/LocalStorage";
import { Notice, Platform, requestUrl } from "obsidian";
import { createNotice } from 'src/helper/NoticeHelper';


const PORT = 42813;
const REDIRECT_URL = `http://127.0.0.1:${PORT}/callback`;
const REDIRECT_URL_MOBILE = `https://google-auth-obsidian-redirect.vercel.app/callback`;
const PUBLIC_CLIENT_ID = `783376961232-v90b17gr1mj1s2mnmdauvkp77u6htpke.apps.googleusercontent.com`

let lastRefreshTryMoment = window.moment().subtract(100, "seconds");
let authSession = {server: null, verifier: null, challenge: null, state:null};


function generateState(): string {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
  
async function generateVerifier(): Promise<string> {
	const array = new Uint32Array(56);
	await window.crypto.getRandomValues(array);
	return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}
  
async function generateChallenge(verifier: string): Promise<string> {
	const data = new TextEncoder().encode(verifier);
	const hash = await window.crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)))
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}


export function getAccessIfValid(): string {
	//Check if the token exists
	if (!getAccessToken() || getAccessToken() == "") return;

	//Check if Expiration time is not set or default 0
	if (!getExpirationTime()) return;

	//Check if Expiration time is set to text
	if (isNaN(getExpirationTime())) return

	//Check if Expiration time is in the past so the token is expired
	if (getExpirationTime() < +new Date()) return;

	return getAccessToken();
}


const refreshAccessToken = async (plugin: GoogleCalendarPlugin): Promise<string> => {
	const useCustomClient = plugin.settings.useCustomClient;

	// if(lastRefreshTryMoment.diff(window.moment(), "seconds") < 60){
	// 	return;
	// }

	let refreshBody = {
		grant_type: "refresh_token",
		client_id: useCustomClient ? plugin.settings.googleClientId?.trim() : PUBLIC_CLIENT_ID,
		client_secret: useCustomClient ? plugin.settings.googleClientSecret?.trim() : null,
		refresh_token: getRefreshToken(),
	};

	const {json: tokenData} = await requestUrl({
		method: 'POST',
		url: useCustomClient ? `https://oauth2.googleapis.com/token` : `${plugin.settings.googleOAuthServer}/api/google/refresh`,
		headers: {'content-type': 'application/json'},
		body: JSON.stringify(refreshBody)
	})

	if (!tokenData) {
		createNotice("Error while refreshing authentication");
		return;
	}
	
	//Save new Access token and Expiration Time
	setAccessToken(tokenData.access_token);
	setExpirationTime(+new Date() + tokenData.expires_in * 1000);
	return tokenData.access_token;
}

const exchangeCodeForTokenDefault = async (plugin: GoogleCalendarPlugin, state:string, verifier:string, code: string): Promise<boolean> => {

	const request = await requestUrl({
		method: 'POST',
		url: `${plugin.settings.googleOAuthServer}/api/google/token`,
		headers: {'content-type': 'application/json'},
		body: JSON.stringify({
			"client_id": PUBLIC_CLIENT_ID,
			"code_verifier": verifier,
			"code": code,
			"state": state,
		})
	})

	return request.json;
}

const exchangeCodeForTokenCustom = async (plugin: GoogleCalendarPlugin, state: string, verifier:string, code: string, isMobile: boolean): Promise<any> => {
	const url = `https://oauth2.googleapis.com/token`
	+ `?grant_type=authorization_code`
	+ `&client_id=${plugin.settings.googleClientId?.trim()}`
	+ `&client_secret=${plugin.settings.googleClientSecret?.trim()}`
	+ `&code_verifier=${verifier}`
	+ `&code=${code}`
	+ `&state=${state}`
	+ `&redirect_uri=${isMobile ? REDIRECT_URL_MOBILE :REDIRECT_URL}`

	const response = await fetch(url,{
		method: 'POST',
		headers: {'content-type': 'application/x-www-form-urlencoded'},
	});

	return response.json();
}

/**
 * Function the get the access token used in every request to the Google Calendar API
 * 
 * Function will check if a access token exists and if its still valid
 * if not it will request a new access token using the refresh token
 * 
 * @returns A valid access Token
 */
export async function getGoogleAuthToken(plugin: GoogleCalendarPlugin): Promise<string> {
	// Check if refresh token is set
	if (!settingsAreCompleteAndLoggedIn()) return;

	let accessToken = getAccessIfValid();

	//Check if the Access token is still valid or if it needs to be refreshed
	if (!accessToken) {
		accessToken = await refreshAccessToken(plugin);		
	}

	// Check if refresh of access token did non work
	if(!accessToken)return

	return accessToken;
}


export async function StartLoginGoogleMobile(): Promise<void> {
	const plugin = GoogleCalendarPlugin.getInstance();
	const useCustomClient = plugin.settings.useCustomClient;

	const CLIENT_ID = useCustomClient ? plugin.settings.googleClientId : PUBLIC_CLIENT_ID;
	
	if(!authSession.state){
		authSession.state = generateState();
		authSession.verifier = await generateVerifier();
		authSession.challenge = await generateChallenge(authSession.verifier);
	}

	const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
	+ `?client_id=${CLIENT_ID}`
	+ `&response_type=code`
	+ `&redirect_uri=${REDIRECT_URL_MOBILE}`
	+ `&prompt=consent`
	+ `&access_type=offline`
	+ `&state=${authSession.state}`
	+ `&code_challenge=${authSession.challenge}`
	+ `&code_challenge_method=S256`
	+ `&scope=email%20profile%20https://www.googleapis.com/auth/calendar`;

	window.open(authUrl);
}

export async function FinishLoginGoogleMobile(code:string, state:string): Promise<void> {
	const plugin = GoogleCalendarPlugin.getInstance();

	if (state !== authSession.state) {
		return;
	}

	const token = await exchangeCodeForTokenCustom(GoogleCalendarPlugin.getInstance(), state, authSession.verifier, code, true);

	if(token?.refresh_token) {
		setRefreshToken(token.refresh_token);
		setAccessToken(token.access_token);
		setExpirationTime(+new Date() + token.expires_in * 1000);

		new Notice("Login successful!");
		plugin.settingsTab.display();
	}
	authSession = {server: null, verifier: null, challenge: null, state:null};
}

/**
 * Function to allow the user to grant the APplication access to his google calendar by OAUTH authentication
 * 
 * Function will start a local server 
 * User is redirected to OUATh screen
 * If authentication is successfully user is redirected to local server
 * Server will read the tokens and save it to local storage
 * Local server will shut down
 * 
 */
export async function LoginGoogle(): Promise<void> {
	const plugin = GoogleCalendarPlugin.getInstance();
	const useCustomClient = plugin.settings.useCustomClient;

	const CLIENT_ID = useCustomClient ? plugin.settings.googleClientId : PUBLIC_CLIENT_ID;

	if (!Platform.isDesktop) {
		new Notice("Can't use this OAuth method on this device");
		return;
	}

	if (!settingsAreComplete()) return;

	if(!authSession.state){
		authSession.state = generateState();
		authSession.verifier = await generateVerifier();
		authSession.challenge = await generateChallenge(authSession.verifier);
	}


	const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
	+ `?client_id=${CLIENT_ID}`
	+ `&response_type=code`
	+ `&redirect_uri=${REDIRECT_URL}`
	+ `&prompt=consent`
	+ `&access_type=offline`
	+ `&state=${authSession.state}`
	+ `&code_challenge=${authSession.challenge}`
	+ `&code_challenge_method=S256`
	+ `&scope=email%20profile%20https://www.googleapis.com/auth/calendar`;
	

	// Make sure no server is running before starting a new one
	if(authSession.server) {
		window.open(authUrl);
		return
	}

	const http = require("http");
	const url = require("url");

	authSession.server = http
		.createServer(async (req: IncomingMessage, res: ServerResponse) => {
		try {
			// Make sure the callback url is used
			if (req.url.indexOf("/callback") < 0)return; 
			
			// acquire the code from the querystring, and close the web server.
			const qs = new url.URL(
				req.url,
				`http://127.0.0.1:${PORT}`
			).searchParams;
			const code = qs.get("code");
			const received_state = qs.get("state");

			if (received_state !== authSession.state) {
				return;
			}
			let token;
			if(useCustomClient){
				token = await exchangeCodeForTokenCustom(plugin, authSession.state, authSession.verifier, code, false);
			}else{
				token = await exchangeCodeForTokenDefault(plugin, authSession.state, authSession.verifier, code);
			}

			if(token?.refresh_token) {
				setRefreshToken(token.refresh_token);
				setAccessToken(token.access_token);
				setExpirationTime(+new Date() + token.expires_in * 1000);
			}
			console.info("Tokens acquired.");

			res.end(
				"Authentication successful! Please return to obsidian."
			);

			authSession.server.close(()=>{
				console.log("Server closed")
			});

			plugin.settingsTab.display();
			
		} catch (e) {
			console.log("Auth failed")

			authSession.server.close(()=>{
				console.log("Server closed")
			});
		}
		authSession = {server: null, verifier: null, challenge: null, state:null};
	})
	.listen(PORT, async () => {
		// open the browser to the authorize url to start the workflow
		window.open(authUrl);
	});
}