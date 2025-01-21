// /events/authFailure.mjs

import fs from 'fs-extra';

export default function authFailure(client) {
    // عند حصول الخطأ EBUSY، نقوم بحذف الملف وإعادة المحاولة
    client.on('auth_failure', async (e) => {
        // عند حصول الخطأ EBUSY، نقوم بحذف الملف وإعادة المحاولة
        if (e.message.includes('EBUSY')) {
            console.error('File is busy, attempting to delete and retry...');
            const sessionFolderPath = './.wwebjs_auth';
            try {
                // حذف الملف
                await fs.remove(sessionFolderPath);
                console.log('Session file deleted. Retrying authentication...');
                // إعادة التهيئة بعد حذف الملف
                await client.initialize();
            } catch (deleteError) {
                console.error('Error deleting session file:', deleteError);
            }
        } else {
            console.error('Authentication failed for another reason:', e);
        }
    });
}
