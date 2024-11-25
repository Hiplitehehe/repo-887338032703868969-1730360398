import { handleAddKey } from './handlers/addKey';
import { handleListKeys } from './handlers/listKeys';
import { handleVerifyKey } from './handlers/verifyKey';

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;

    if (path === '/api/add') {
        return handleAddKey();
    } else if (path === '/api/keys') {
        return handleListKeys();
    } else if (path === '/api/verify') {
        const key = params.get('key');
        const username = params.get('username');
        if (!key || !username) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
        }
        return handleVerifyKey(key, username);
    }
    return new Response('Not Found', { status: 404 });
}
