import { KEYS } from '@cloudflare/workers-kv';

export async function handleAddKey() {
    const key = generateKey();
    const expiry = getCurrentTime() + 3 * 24 * 60 * 60;

    await KEYS.put(key, JSON.stringify({ expiry, username: null }));

    return new Response(
        JSON.stringify({ success: true, key, expiresAt: expiry }),
        { status: 201 }
    );
}

function generateKey() {
    return crypto.randomUUID();
}

function getCurrentTime() {
    return Math.floor(Date.now() / 1000);
}
