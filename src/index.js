addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/add') {
        return handleAddKey();
    } else if (url.pathname === '/api/keys') {
        return handleListKeys();
    } else if (url.pathname === '/api/verify') {
        const key = url.searchParams.get('key');
        const username = url.searchParams.get('username');
        return handleVerifyKey(key, username);
    }

    return new Response("Not Found", { status: 404 });
}

async function handleAddKey() {
    try {
        const key = generateKey();
        const expiry = getCurrentTime() + 3 * 24 * 60 * 60; // 3 days in seconds

        await KEYS.put(key, JSON.stringify({ expiry, username: null }));

        return new Response(
            JSON.stringify({ success: true, key, expiresAt: expiry }),
            { status: 200 }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, message: "An error occurred while adding the key.", error: error.message }),
            { status: 200 }
        );
    }
}

async function handleListKeys() {
    try {
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
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, message: "An error occurred while listing keys.", error: error.message }),
            { status: 200 }
        );
    }
}

async function handleVerifyKey(key, username) {
    try {
        const currentTime = getCurrentTime();

        const value = await KEYS.get(key);
        if (!value) {
            return new Response(
                JSON.stringify({ valid: false, reason: 'invalid' }),
                { status: 200 }
            );
        }

        const data = JSON.parse(value);
        if (currentTime >= data.expiry) {
            await KEYS.delete(key); // Remove expired key
            return new Response(
                JSON.stringify({ valid: false, reason: 'expired' }),
                { status: 200 }
            );
        }

        if (data.username === null) {
            data.username = username;
            await KEYS.put(key, JSON.stringify(data));
        } else if (data.username !== username) {
            return new Response(
                JSON.stringify({ valid: false, reason: 'bound_to_other' }),
                { status: 200 }
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
    } catch (error) {
        return new Response(
            JSON.stringify({ valid: false, reason: 'error', message: error.message }),
            { status: 200 }
        );
    }
}

function generateKey() {
    return crypto.randomUUID();
}

function getCurrentTime() {
    return Math.floor(Date.now() / 1000);
                            }
