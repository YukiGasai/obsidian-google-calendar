import * as crypto from 'crypto';

export const generateCodeVerifier = () => {
    return crypto.randomBytes(32)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export const generateCodeChallenge = (codeVerifier) => {
    return crypto.createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export const generateState = () => {
    return crypto.randomBytes(16)
        .toString('hex');
}


export async function generateRsaKeys() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    return keyPair;
}

export async function rsaKeyToString(keyPair) {

    const spki = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
    );
    const hexPublicKey = Array.from(new Uint8Array(spki))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return hexPublicKey
}