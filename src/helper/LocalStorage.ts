import type GoogleCalendarPlugin from "src/GoogleCalendarPlugin";

//===================
//GETTER
//===================

/**
 * getAccessToken from LocalStorage
 * @returns googleAccessToken
 */
export const getAT = (): string => {
	return window.localStorage.getItem("googleAccessToken") ?? "";
};

/**
 * getRefreshToken from LocalStorage
 * @returns googleRefreshToken
 */
export const getRT = (): string => {
	return window.localStorage.getItem("googleRefreshToken") ?? "";
};

/**
 * getExpirationTime from LocalStorage
 * @returns googleExpirationTime
 */
export const getET = (plugin: GoogleCalendarPlugin): number => {
	const expirationTimeString =
		window.localStorage.getItem("googleExpirationTime") ?? "0";
	return parseInt(expirationTimeString, 10);
};

//===================
//SETTER
//===================

/**
 * set AccessToken into LocalStorage
 * @param googleAccessToken googleAccessToken
 * @returns googleAccessToken
 */
export const setAT = (googleAccessToken: string) => {
	window.localStorage.setItem("googleAccessToken", googleAccessToken);
};

/**
 * set RefreshToken from LocalStorage
 * @param googleRefreshToken googleRefreshToken
 * @returns googleRefreshToken
 */
export const setRT = (googleRefreshToken: string) => {
	window.localStorage.setItem("googleRefreshToken", googleRefreshToken);
};

/**
 * set ExpirationTime from LocalStorage
 * @param googleExpirationTime googleExpirationTime
 * @returns googleExpirationTime
 */
export const setET = (googleExpirationTime: number) => {
	window.localStorage.setItem(
		"googleExpirationTime",
		googleExpirationTime + ""
	);
};
