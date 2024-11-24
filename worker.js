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

  // MongoDB setup (assuming you have a MongoDB Atlas instance or a key-value store)
  const KEYS_NAMESPACE = KV_NAMESPACE; // Replace with your actual KV namespace

  // Handle the /genKey request to generate an API key
  if (url.pathname === "/genKey") {
    const apiKey = generateApiKey();

    // Store the API key in KV
    const keyId = `key_${Date.now()}`; // Unique key ID based on timestamp or UUID
    await KEYS_NAMESPACE.put(keyId, apiKey);

    return new Response(JSON.stringify({
      success: true,
      message: "API Key generated but hasn't been bound to a user yet.",
      apiKey: apiKey
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Handle the /bindKey request to bind the API key to a user
  else if (url.pathname === "/bindKey") {
    const apiKey = url.searchParams.get('apiKey');
    const userId = url.searchParams.get('userId');

    if (!apiKey || !userId) {
      return new Response(JSON.stringify({ success: false, message: "Missing apiKey or userId" }), { status: 400, headers });
    }

    // Check if the key exists in the KV store
    const keyData = await KEYS_NAMESPACE.get(apiKey);
    if (!keyData) {
      return new Response(JSON.stringify({ success: false, message: "API Key not found or invalid" }), { status: 404, headers });
    }

    // Bind the key to the user by storing the mapping in KV
    const bindingId = `user_${userId}_key`; // Key format to bind a user to a key
    await KEYS_NAMESPACE.put(bindingId, apiKey);

    return new Response(JSON.stringify({
      success: true,
      message: `API Key successfully bound to user ${userId}`,
      userId: userId,
      apiKey: apiKey
    }), { status: 200, headers });
  }

  // Return 404 for any other routes
  return new Response("Not Found", { status: 404, headers })
}

// Generate a simple API key (could be improved with a better method)
function generateApiKey() {
  return 'api_' + Math.random().toString(36).substring(2, 15);
}
