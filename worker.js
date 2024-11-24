addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Set headers for CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',  // Allow all origins, adjust as needed
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // Handle the /genKey request to generate an API key
  if (url.pathname === "/genKey") {
    const apiKey = generateApiKey();  // Implement the function to generate a unique key

    // Store the key in KV (make sure to replace 'API_KEYS' with your KV namespace)
    await API_KEYS.put(apiKey, { bound: false });

    const response = {
      success: true,
      message: "API Key generated but hasn't been bound to a user yet.",
      apiKey: apiKey
    }

    // Return the formatted response with pretty print (indented JSON)
    return new Response(JSON.stringify(response, null, 2), { status: 200, headers })
  }

  // Handle the /bindKey request to bind an API key to a user
  if (url.pathname === "/bindKey") {
    const apiKey = url.searchParams.get("apiKey");
    const userId = url.searchParams.get("userId");

    if (!apiKey || !userId) {
      return new Response("Missing API Key or User ID", { status: 400, headers });
    }

    const existingKey = await API_KEYS.get(apiKey);

    if (!existingKey) {
      return new Response("API Key not found or invalid", { status: 404, headers });
    }

    const keyData = JSON.parse(existingKey);

    // Check if the key is already bound
    if (keyData.bound) {
      const response = {
        success: false,
        message: `API Key already bound to user ${keyData.userId}`
      };
      return new Response(JSON.stringify(response, null, 2), { status: 400, headers });
    }

    // Bind the API key to the user
    keyData.bound = true;
    keyData.userId = userId;

    // Update the KV store with the bound data
    await API_KEYS.put(apiKey, JSON.stringify(keyData));

    const response = {
      success: true,
      message: `API Key bound to user ${userId}`
    }

    // Return the formatted response with pretty print (indented JSON)
    return new Response(JSON.stringify(response, null, 2), { status: 200, headers })
  }

  // Handle any other paths
  return new Response("Not Found", { status: 404, headers })
}

// Simple function to generate an API key (you can use a more complex method)
function generateApiKey() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
