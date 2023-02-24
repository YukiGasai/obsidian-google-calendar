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


//===================
//SETTER
//===================

/**
 * set AccessToken into LocalStorage
 * @param googleAccessToken googleAccessToken
 * @returns googleAccessToken
 */
export const setAccessToken = (googleAccessToken: string): void => {
	window.localStorage.setItem("googleCalendarAccessToken", googleAccessToken);
};

/**
 * set RefreshToken from LocalStorage
 * @param googleRefreshToken googleRefreshToken
 * @returns googleRefreshToken
 */
export const setRefreshToken = (googleRefreshToken: string): void => {
	if (googleRefreshToken == "undefined") return;
	window.localStorage.setItem("googleCalendarRefreshToken", googleRefreshToken);
};

/**
 * set ExpirationTime from LocalStorage
 * @param googleExpirationTime googleExpirationTime
 * @returns googleExpirationTime
 */
export const setExpirationTime = (googleExpirationTime: number): void => {
	if (isNaN(googleExpirationTime)) return;
	window.localStorage.setItem(
		"googleCalendarExpirationTime",
		googleExpirationTime + ""
	);
};
