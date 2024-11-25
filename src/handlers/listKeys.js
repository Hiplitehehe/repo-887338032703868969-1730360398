export async function handleListKeys() {
    const keysList = [];
    const currentTime = getCurrentTime();

    const entries = await KEYS.list(); // List all keys in the KV namespace
    for (const { name } of entries.keys) {
        // Retrieve the data associated with the key
        const data = await KEYS.get(name);

        try {
            // Attempt to parse the data as JSON
            const parsedData = JSON.parse(data);

            // Push the parsed data into the keys list
            keysList.push({
                key: name,
                expiresAt: parsedData.expiry,
                username: parsedData.username,
                valid: currentTime < parsedData.expiry,
            });
        } catch (e) {
            // If parsing fails, log the error and add the key as invalid
            console.error(`Error parsing data for key ${name}:`, e);
            keysList.push({
                key: name,
                valid: false,
                error: 'Invalid data format',
            });
        }
    }

    // Return the list of keys
    return new Response(JSON.stringify(keysList), { status: 200 });
}

function getCurrentTime() {
    return Math.floor(Date.now() / 1000); // Get current time in seconds
}
