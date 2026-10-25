import { ENCRYPTION_KEY } from '$app/env/private'

export const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(Buffer.from(ENCRYPTION_KEY, 'hex')),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
)

// encrypt a given array of bytes
export async function encrypt(encrypt_target: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
    if ((key.algorithm as AesKeyAlgorithm).length < 256) {
        throw new Error("Misconfigured key (too short)")
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, new Uint8Array(encrypt_target))
    const final = new Uint8Array(iv.length + enc.byteLength)

    final.set(iv)
    final.set(new Uint8Array(enc), iv.length)
    return final;
}

// decrypt a given array of bytes
export async function decrypt(decrypt_target: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
    if ((key.algorithm as AesKeyAlgorithm).length < 256) {
        throw new Error("Misconfigured key (too short)")
    }

    const iv = decrypt_target.slice(0, 12);
    const enc = decrypt_target.slice(12, decrypt_target.length);
    const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, key, new Uint8Array(enc))
    return new Uint8Array(decrypted)
}