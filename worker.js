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

  // Handle the /bind request to bind an API key to a user
  if (url.pathname === "/bind") {
    const userId = url.searchParams.get("userId")
    const apiKeyParam = url.searchParams.get("apiKey")

    if (!userId || !apiKeyParam) {
      return new Response(JSON.stringify({ success: false, message: "Error: Missing userId or apiKey" }), { status: 400, headers })
    }

    try {
      // Ensure that apiKeyParam is a string before storing it in KV store
      await API_KEYS.put(userId, String(apiKeyParam))  // Convert to string

      return new Response(JSON.stringify({ success: true, message: "API Key bound successfully!" }), { status: 200, headers })

    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: `Error reason: ${error.message}` }), { status: 500, headers })
    }
  }

  // Handle the /getKey request to retrieve the API key for a user
  else if (url.pathname === "/getKey") {
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: "Error: Missing userId" }), { status: 400, headers })
    }

    try {
      // Retrieve the API key from KV store
      const apiKey = await API_KEYS.get(userId)

      if (apiKey) {
        return new Response(JSON.stringify({ apiKey: apiKey }), { status: 200, headers })
      } else {
        return new Response(JSON.stringify({ success: false, message: "Error reason: API Key not found or not bound" }), { status: 404, headers })
      }

    } catch (error) {
      return new Response(JSON.stringify({ success: false, message: `Error reason: ${error.message}` }), { status: 500, headers })
    }
  }

  // Return 404 for any other routes
  return new Response("Not Found", { status: 404, headers })
}
