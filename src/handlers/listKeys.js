import { KEYS } from '@cloudflare/workers-kv';

export async function handleListKeys() {
    const keysList = [];
    const currentTime = getCurrentTime();

    const entries = await KEYS.list();
    for (const { name } of entries.keys) {
        const data = JSON.parse(await KEYS.get(name));
        keysList.push({
            key: name,
            expiresAt: data.expiry,
            username: data.username,
            valid: currentTime < data.expiry,
        });
    }

    return new Response(JSON.stringify(keysList), { status: 200 });
}

function getCurrentTime() {
    return Math.floor(Date.now() / 1000);
}
