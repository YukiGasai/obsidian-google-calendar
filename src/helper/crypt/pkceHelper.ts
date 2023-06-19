export const base64UrlEncode = (buffer: ArrayBuffer | Uint8Array): string => {
    let base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return base64;
}

export const generateCodeVerifier = (): string => {
    const randomBytes = new Uint8Array(64);
    window.crypto.getRandomValues(randomBytes);
    const verifier = base64UrlEncode(randomBytes);
    return verifier;
}

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const codeChallenge = base64UrlEncode(hashBuffer);
    return codeChallenge;
}

export const generateState = () => {
    return generateCodeVerifier();
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


export function base64UrlDecode(base64Url: string): ArrayBuffer {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + '='.repeat(paddingLength);
    const binaryString = atob(paddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function arrayBufferToUtf8String(arrayBuffer: ArrayBuffer): string {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
}
