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

  // Handle /genKey request to generate API key
  if (url.pathname === '/genKey') {
    const generatedKey = generateAPIKey()

    // Store the generated key in KV storage
    const kvKey = `apiKey_${generatedKey}` // Store by key name for uniqueness
    await API_KEYS.put(kvKey, generatedKey)

    // Return the generated API key in the response
    return new Response(
      JSON.stringify({ success: true, apiKey: generatedKey }),
      { status: 200, headers }
    )
  }

  // Handle /bind request to associate a user with an API key
  if (url.pathname === '/bind') {
    const userId = url.searchParams.get('userId')
    const apiKey = url.searchParams.get('apiKey')

    if (!userId || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing userId or apiKey" }),
        { status: 400, headers }
      )
    }

    // Check if the API key exists in KV
    const kvKey = `apiKey_${apiKey}`
    const storedKey = await API_KEYS.get(kvKey)

    if (!storedKey) {
      return new Response(
        JSON.stringify({ success: false, message: "API key not found" }),
        { status: 404, headers }
      )
    }

    // Store the binding of the userId with the API key
    const userBindingKey = `user_${userId}_key`
    await API_KEYS.put(userBindingKey, apiKey)

    return new Response(
      JSON.stringify({ success: true, message: "API key bound successfully!" }),
      { status: 200, headers }
    )
  }

  // Default 404 if the endpoint doesn't match
  return new Response("Not Found", { status: 404, headers })
}

// Function to generate a unique API key (using UUID)
function generateAPIKey() {
  return crypto.randomUUID() // Generate a random unique API key
}
