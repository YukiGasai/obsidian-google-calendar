//===================
//GETTER
//===================

/**
 * getAccessToken from LocalStorage
 * @returns googleAccessToken
 */
export const getAT = (): string => {
	return window.localStorage.getItem("googleCalendarAccessToken") ?? "";
};

/**
 * getRefreshToken from LocalStorage
 * @returns googleRefreshToken
 */
export const getRT = (): string => {
	return window.localStorage.getItem("googleCalendarRefreshToken") ?? "";
};

/**
 * getExpirationTime from LocalStorage
 * @returns googleExpirationTime
 */
export const getET = (): number => {
	const expirationTimeString =
		window.localStorage.getItem("googleCalendarExpirationTime") ?? "0";
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
export const setAT = (googleAccessToken: string): void => {
	window.localStorage.setItem("googleCalendarAccessToken", googleAccessToken);
};

/**
 * set RefreshToken from LocalStorage
 * @param googleRefreshToken googleRefreshToken
 * @returns googleRefreshToken
 */
export const setRT = (googleRefreshToken: string): void => {
	window.localStorage.setItem("googleCalendarRefreshToken", googleRefreshToken);
};

/**
 * set ExpirationTime from LocalStorage
 * @param googleExpirationTime googleExpirationTime
 * @returns googleExpirationTime
 */
export const setET = (googleExpirationTime: number): void => {
	window.localStorage.setItem(
		"googleCalendarExpirationTime",
		googleExpirationTime + ""
	);
};
