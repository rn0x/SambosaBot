// /events/loadingScreen.mjs

import client from '../client.mjs';

export default function loadingScreen(client) {
    client.on('loading_screen', (percent, message) => {
        // طباعة تقدم عملية التحميل
        console.log('Loading screen', percent, message);
    });
}
