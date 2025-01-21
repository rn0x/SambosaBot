// /events/authFailure.mjs

import client from '../client.mjs';

export default function authFailure(client) {
    client.on('auth_failure', (e) => {
        // طباعة تفاصيل الخطأ في حال فشل المصادقة
        console.error('Authentication failure', e);
    });
}
