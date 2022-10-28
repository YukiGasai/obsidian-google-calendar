import GoogleCalendarPlugin from 'src/GoogleCalendarPlugin';
//===================
//GETTER
//===================

/**
 * getAccessToken from LocalStorage
 * @returns googleAccessToken
 */
export const getAccessToken = (): string => {
	return window.localStorage.getItem("googleCalendarAccessToken") ?? "";
};

/**
 * getRefreshToken from LocalStorage
 * @returns googleRefreshToken
 */
export const getRefreshToken = (): string => {
	return window.localStorage.getItem("googleCalendarRefreshToken") ?? "";
};

/**
 * getExpirationTime from LocalStorage
 * @returns googleExpirationTime
 */
export const getExpirationTime = (): number => {
	const expirationTimeString =
		window.localStorage.getItem("googleCalendarExpirationTime") ?? "0";
	return parseInt(expirationTimeString, 10);
};


/**
 * getToken from LocalStorage
 * @returns googleToken
 */
 export const getToken = (): string => {
	const plugin:GoogleCalendarPlugin = GoogleCalendarPlugin.getInstance();

	if(plugin.settings.useCustomClient && plugin.settings.googleApiToken){
		return plugin.settings.googleApiToken ?? "";
	}

	if(window.localStorage.getItem("googleCalendarToken") == "") {
		return plugin.settings.googleApiToken ?? "";
	}

	return window.localStorage.getItem("googleCalendarToken") ?? "";

};


//===================
//SETTER
//===================

/**
 * set AccessToken into LocalStorage
 * @param googleAccessToken googleAccessToken
 * @returns googleAccessToken
 */
export const setAccessToken = (googleAccessToken: string): void => {
	if(googleAccessToken == "undefined")return;
	window.localStorage.setItem("googleCalendarAccessToken", googleAccessToken);
};

/**
 * set RefreshToken from LocalStorage
 * @param googleRefreshToken googleRefreshToken
 * @returns googleRefreshToken
 */
export const setRefreshToken = (googleRefreshToken: string): void => {
	if(googleRefreshToken == "undefined")return;
	window.localStorage.setItem("googleCalendarRefreshToken", googleRefreshToken);
};

/**
 * set ExpirationTime from LocalStorage
 * @param googleExpirationTime googleExpirationTime
 * @returns googleExpirationTime
 */
export const setExpirationTime = (googleExpirationTime: number): void => {
	if(isNaN(googleExpirationTime))return;
	window.localStorage.setItem(
		"googleCalendarExpirationTime",
		googleExpirationTime + ""
	);
};

/**
 * setToken from LocalStorage
 * @returns googleToken
 */
 export const setToken = (googleToken: string): void => {
	if(googleToken == "undefined")return;
	window.localStorage.setItem(
		"googleCalendarToken",
		googleToken
	); 
};
