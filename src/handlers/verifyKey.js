export async function handleVerifyKey(key, username) {
    const currentTime = getCurrentTime();

    const value = await KEYS.get(key);
    if (!value) {
        return new Response(JSON.stringify({ valid: false, reason: 'invalid' }), { status: 404 });
    }

    const data = JSON.parse(value);
    if (currentTime >= data.expiry) {
        await KEYS.delete(key);
        return new Response(JSON.stringify({ valid: false, reason: 'expired' }), { status: 410 });
    }

    if (data.username === null) {
        data.username = username;
        await KEYS.put(key, JSON.stringify(data));
    } else if (data.username !== username) {
        return new Response(JSON.stringify({ valid: false, reason: 'bound_to_other' }), { status: 403 });
    }

    return new Response(
        JSON.stringify({ valid: true, expiresAt: data.expiry, username: data.username }),
        { status: 200 }
    );
}

function getCurrentTime() {
    return Math.floor(Date.now() / 1000);
}
