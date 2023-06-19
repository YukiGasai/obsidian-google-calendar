import { refreshAccessToken } from "../googleApi/oauth/RefreshToken";
import { getAccessToken, getExpirationTime } from "./LocalStorage"

export const getValidAccessToken = async (): Promise<string> => {

    const accessToken = await getAccessToken();
    const expirationTime = await getExpirationTime();

    if (accessToken && expirationTime > +new Date()) {
        return accessToken;
    }

    return (await refreshAccessToken())
}