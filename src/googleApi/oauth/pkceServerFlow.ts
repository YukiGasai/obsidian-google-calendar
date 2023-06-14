import { setAccessToken, setExpirationTime, setRefreshToken } from "../../helper/LocalStorage";
import { generateRsaKeys, rsaKeyToString } from "../../helper/crypt/pkceHelper";
import type { PKCEServerSession } from "../../helper/types";
import GoogleCalendarPlugin from "../../GoogleCalendarPlugin";

let session: PKCEServerSession = null;

export const pkceFlowServerStart = async () => {
    const plugin = GoogleCalendarPlugin.getInstance();

    if (!session?.state) {

        const keys = await generateRsaKeys();
        const publicKey = await rsaKeyToString(keys);
        session = {
            keys,
            state: publicKey,
        }
    }

    window.location.href = `${plugin.settings.googleOAuthServer}/api/google/login?key=${session.state}`;
}

export const pkceFlowServerEnd = async (encryptedText) => {

    const plugin = GoogleCalendarPlugin.getInstance();

    if (!session?.state) {
        return;
    }

    const tokenEncoded = await window.crypto.subtle.decrypt(
        "RSA-OAEP",
        session.keys.privateKey,
        Buffer.from(encryptedText, 'base64')
    )

    const tokenString = Buffer.from(tokenEncoded).toString('utf-8');

    const token = JSON.parse(tokenString);

    const { access_token, refresh_token, expires_in } = token;

    await setRefreshToken(refresh_token);
    await setAccessToken(access_token);
    setExpirationTime(+new Date() + expires_in * 1000)

    session = null;
    plugin.settingsTab.display();
}