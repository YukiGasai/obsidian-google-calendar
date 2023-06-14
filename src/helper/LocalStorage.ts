import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { PasswordEnterModal } from "../modal/PasswordEnterModal";
import { aesGcmDecrypt, aesGcmEncrypt } from "./crypt/aes";

const GOOGLE_CALENDAR_PLUGIN_REFRESH_KEY = 'google_calendar_plugin_refresh_key';
const GOOGLE_CALENDAR_PLUGIN_ACCESS_KEY = 'google_calendar_plugin_access_key';
const GOOGLE_CALENDAR_PLUGIN_EXPIRATION_KEY = 'google_calendar_plugin_expiration_key';
const GOOGLE_CALENDAR_PLUGIN_CLIENT_ID_KEY = 'google_calendar_plugin_client_id_key';
const GOOGLE_CALENDAR_PLUGIN_CLIENT_SECRET_KEY = 'google_calendar_plugin_client_secret_key';

let tokenPassword = null;
let getPasswordModalIsOpen = false;
export const setTokenPassword = (password: string) => {
	tokenPassword = password;
}

async function waitForPassword() {
	while (!tokenPassword)
		await new Promise(resolve => setTimeout(resolve, 1000));
}

const getPassword = async (): Promise<string> => {
	if (tokenPassword) return tokenPassword;
	if (!getPasswordModalIsOpen) {
		new PasswordEnterModal(GoogleCalendarPlugin.getInstance().app, (enteredPassword: string) => {
			setTokenPassword(enteredPassword);
			getPasswordModalIsOpen = false;
		}).open();
		getPasswordModalIsOpen = true;
	}

	await waitForPassword()
	return tokenPassword;
}

export const isLoggedIn = (): boolean => {
	return (window.localStorage.getItem(GOOGLE_CALENDAR_PLUGIN_REFRESH_KEY) ?? "") !== "";
}

//===================
//GETTER
//===================

/**
 * getAccessToken from LocalStorage
 * @returns googleAccessToken
 */
export const getAccessToken = async (): Promise<string> => {
	const accessToken = window.localStorage.getItem(GOOGLE_CALENDAR_PLUGIN_ACCESS_KEY) ?? "";

	if (!GoogleCalendarPlugin.getInstance().settings.encryptToken || accessToken == "") {
		return accessToken;
	}
	return (await aesGcmDecrypt(accessToken, (await getPassword())));
};

/**
 * getRefreshToken from LocalStorage
 * @returns googleRefreshToken
 */
export const getRefreshToken = async (): Promise<string> => {
	const refreshToken = window.localStorage.getItem(GOOGLE_CALENDAR_PLUGIN_REFRESH_KEY) ?? "";

	if (!GoogleCalendarPlugin.getInstance().settings.encryptToken || refreshToken == "") {
		return refreshToken;
	}
	return (await aesGcmDecrypt(refreshToken, (await getPassword())));
};

/**
 * getExpirationTime from LocalStorage
 * @returns googleExpirationTime
 */
export const getExpirationTime = (): number => {
	const expirationTimeString =
		window.localStorage.getItem(GOOGLE_CALENDAR_PLUGIN_EXPIRATION_KEY) ?? "0";
	return parseInt(expirationTimeString, 10);
};

/**
 * getClientId from LocalStorage
 * @returns googleClientId
 * */
export const getClientId = async (): Promise<string> => {
	const clientId = window.localStorage.getItem(GOOGLE_CALENDAR_PLUGIN_CLIENT_ID_KEY) ?? "";

	if (!GoogleCalendarPlugin.getInstance().settings.encryptToken || clientId == "") {
		return clientId;
	}
	return (await aesGcmDecrypt(clientId, (await getPassword())));
};

/**
 * getClientSecret from LocalStorage
 * @returns googleClientSecret
 * */
export const getClientSecret = async (): Promise<string> => {
	const clientSecret = window.localStorage.getItem(GOOGLE_CALENDAR_PLUGIN_CLIENT_SECRET_KEY) ?? "";

	if (!GoogleCalendarPlugin.getInstance().settings.encryptToken || clientSecret == "") {
		return clientSecret;
	}
	return (await aesGcmDecrypt(clientSecret, (await getPassword())));
};


//===================
//SETTER
//===================

/**
 * set AccessToken into LocalStorage
 * @param googleAccessToken googleAccessToken
 * @returns googleAccessToken
 */
export const setAccessToken = async (googleAccessToken: string): Promise<void> => {
	if (GoogleCalendarPlugin.getInstance().settings.encryptToken) {
		const password = await getPassword();
		googleAccessToken = await aesGcmEncrypt(googleAccessToken, password);
	}
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_ACCESS_KEY, googleAccessToken);
};

/**
 * set RefreshToken from LocalStorage
 * @param googleRefreshToken googleRefreshToken
 * @returns googleRefreshToken
 */
export const setRefreshToken = async (googleRefreshToken: string): Promise<void> => {
	if (GoogleCalendarPlugin.getInstance().settings.encryptToken) {
		const password = await getPassword();
		googleRefreshToken = await aesGcmEncrypt(googleRefreshToken, password);
	}
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_REFRESH_KEY, googleRefreshToken);
};

/**
 * set ExpirationTime from LocalStorage
 * @param googleExpirationTime googleExpirationTime
 * @returns googleExpirationTime
 */
export const setExpirationTime = (googleExpirationTime: number): void => {
	if (isNaN(googleExpirationTime)) return;
	window.localStorage.setItem(
		GOOGLE_CALENDAR_PLUGIN_EXPIRATION_KEY,
		googleExpirationTime + ""
	);
};

export const setClientId = async (clientId: string): Promise<void> => {
	if (GoogleCalendarPlugin.getInstance().settings.encryptToken) {
		const password = await getPassword();
		clientId = await aesGcmEncrypt(clientId, password);
	}
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_CLIENT_ID_KEY, clientId);
};

export const setClientSecret = async (clientSecret: string): Promise<void> => {
	if (GoogleCalendarPlugin.getInstance().settings.encryptToken) {
		const password = await getPassword();
		clientSecret = await aesGcmEncrypt(clientSecret, password);
	}
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_CLIENT_SECRET_KEY, clientSecret);
};

// ===================
// CLEAR
// ===================

export const clearTokens = (): void => {
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_ACCESS_KEY, "");
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_REFRESH_KEY, "");
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_EXPIRATION_KEY, "");
}

export const clearClient = (): void => {
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_CLIENT_ID_KEY, "");
	window.localStorage.setItem(GOOGLE_CALENDAR_PLUGIN_CLIENT_SECRET_KEY, "");
}