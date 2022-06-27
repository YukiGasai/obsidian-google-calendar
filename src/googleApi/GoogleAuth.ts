/* eslint-disable @typescript-eslint/no-var-requires */
import type GoogleCalendarPlugin from './../GoogleCalendarPlugin';
import {
	settingsAreComplete,
	settingsAreCompleteAndLoggedIn,
} from "../view/GoogleCalendarSettingTab";
import {
	getAT,
	getET,
	getRT,
	setAT,
	setET,
	setRT,
} from "../helper/LocalStorage";
import { Notice, Platform } from "obsidian";


export async function getGoogleAuthToken(plugin: GoogleCalendarPlugin): Promise<string> {
	if (!settingsAreCompleteAndLoggedIn(plugin)) return;

	if (
		getET(plugin) == 0 ||
		getET(plugin) == undefined ||
		isNaN(getET(plugin)) ||
		getET(plugin) < +new Date()
	) {
		if (getRT() != "") {
			const refreshBody = {
				client_id: plugin.settings.googleClientId,
				client_secret: plugin.settings.googleClientSecret,
				grant_type: "refresh_token",
				refresh_token: getRT(),
			};
			const response = await fetch(
				"https://oauth2.googleapis.com/token",
				{
					method: "POST",
					body: JSON.stringify(refreshBody),
				}
			);

			const tokenData = await response.json();

			setAT(tokenData.access_token);
			setET(+new Date() + tokenData.expires_in);
		}
	}

	return getAT();
}

export async function LoginGoogle(plugin: GoogleCalendarPlugin): Promise<void> {
	if (Platform.isDesktop) {
		if (!settingsAreComplete(plugin)) return;
		const { OAuth2Client } = require("google-auth-library");
		const http = require("http");
		const open = require("open");
		const url = require("url");
		const destroyer = require("server-destroy");
		const oAuth2Client = new OAuth2Client(
			plugin.settings.googleClientId,
			plugin.settings.googleClientSecret,
			"http://127.0.0.1:42813/callback"
		);
		const authorizeUrl = oAuth2Client.generateAuthUrl({
			scope: [
				"https://www.googleapis.com/auth/tasks",
				"https://www.googleapis.com/auth/calendar",
			],
			access_type: "offline",
		});

		const server = http
			.createServer(async (req: any, res: any) => {
				try {
					if (req.url.indexOf("/callback") > -1) {
						// acquire the code from the querystring, and close the web server.
						const qs = new url.URL(
							req.url,
							"http://localhost:42813"
						).searchParams;
						const code = qs.get("code");
						res.end(
							"Authentication successful! Please return to obsidian."
						);
						server.destroy();

						// Now that we have the code, use that to acquire tokens.
						const r = await oAuth2Client.getToken(code);

						setRT(r.tokens.refresh_token);
						setAT(r.tokens.access_token);
						setET(r.tokens.expiry_date);

						console.info("Tokens acquired.");
					}
				} catch (e) {
					console.log("Auth failed")
				}
			})
			.listen(42813, () => {
				// open the browser to the authorize url to start the workflow
				open(authorizeUrl, { wait: false }).then((cp: any) =>
					cp.unref()
				);
			});

		destroyer(server);
	} else {
		new Notice("Can't use OAuth on this device");
	}
}