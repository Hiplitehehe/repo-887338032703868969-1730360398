addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Set headers for CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',  
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // Generate new key (without needing userId)
  if (url.pathname === "/genKey") {
    const key = generateRandomKey()
    const keyStoreResult = await storeKey(key)

    if (keyStoreResult.success) {
      return new Response(JSON.stringify({ success: true, apiKey: key }), { status: 200, headers })
    } else {
      return new Response(JSON.stringify({ success: false, message: `KV error because: ${keyStoreResult.errorMessage}` }), { status: 500, headers })
    }
  }

  // Bind an API key to a userId
  else if (url.pathname === "/bind") {
    const userId = url.searchParams.get("userId")
    const apiKey = url.searchParams.get("apiKey")

    if (!userId || !apiKey) {
      return new Response(JSON.stringify({ success: false, message: "userId or apiKey is missing" }), { status: 400, headers })
    }

    const bindResult = await bindKeyToUser(userId, apiKey)
    if (bindResult.success) {
      return new Response(JSON.stringify({ success: true, message: "API key bound successfully" }), { status: 200, headers })
    } else {
      return new Response(JSON.stringify({ success: false, message: `KV error because: ${bindResult.errorMessage}` }), { status: 400, headers })
    }
  }

  return new Response("Not Found", { status: 404, headers })
}

function generateRandomKey() {
  return Math.random().toString(36).substring(2, 15); // simple random key generation
}

async function storeKey(key) {
  try {
    const result = await KEYS_NAMESPACE.put("key-" + key, key) // Store the key in KV
    return { success: result === undefined }
  } catch (error) {
    console.error(error)
    return { success: false, errorMessage: error.message } 
  }
}

async function bindKeyToUser(userId, apiKey) {
  try {
    const existingKey = await KEYS_NAMESPACE.get(userId)
    if (existingKey) {
      return { success: false, errorMessage: "API key already bound to this user" }
    }

    await KEYS_NAMESPACE.put(userId, apiKey)
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, errorMessage: error.message }
  }
}
