// /events/authenticated.mjs

import client from '../client.mjs';

export default function authenticated(client) {
    client.on('authenticated', () => {
        // طباعة رسالة عند النجاح في المصادقة
        console.log('Authenticated');
    });
}
