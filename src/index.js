const KEYS = keys;

async function handleAddKey() {
    const key = generateKey();
    const expiry = getCurrentTime() + 3 * 24 * 60 * 60; // 3 days in seconds

    await KEYS.put(key, JSON.stringify({ expiry, username: null }));

    return new Response(
        JSON.stringify({
            success: true,
            key,
            message: `Key ${key} added successfully.`,
            expiresAt: expiry,
        }),
        { status: 201 }
    );
}

async function handleListKeys() {
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

async function handleVerifyKey(key, username) {
    const currentTime = getCurrentTime();

    const value = await KEYS.get(key);
    if (!value) {
        return new Response(
            JSON.stringify({ valid: false, reason: 'invalid' }),
            { status: 404 }
        );
    }

    const data = JSON.parse(value);
    if (currentTime >= data.expiry) {
        await KEYS.delete(key); // Remove expired key
        return new Response(
            JSON.stringify({ valid: false, reason: 'expired' }),
            { status: 410 }
        );
    }

    if (data.username === null) {
        data.username = username;
        await KEYS.put(key, JSON.stringify(data));
    } else if (data.username !== username) {
        return new Response(
            JSON.stringify({ valid: false, reason: 'bound_to_other' }),
            { status: 403 }
        );
    }

    return new Response(
        JSON.stringify({
            valid: true,
            expiresAt: data.expiry,
            username: data.username,
        }),
        { status: 200 }
    );
}
