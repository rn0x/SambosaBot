import fetch from 'node-fetch';
import { logError, logInfo } from './logger.mjs';

/**
 * وظيفة جلب صورة من خدمة HTML Snapshot.
 * @param {object} params - كائن يحتوي على جميع المتغيرات المطلوبة.
 * @param {string} params.htmlTemplate - قالب الـ HTML الذي سيتم تحويله إلى صورة.
 * @param {object} [params.data] - الكائن الذي يحتوي على المتغيرات ليتم دمجها في HTML (اختياري).
 * @returns {Promise<Buffer>} - Buffer للصورة المولدة.
 * @throws {Error} - في حال حدوث خطأ أثناء الطلب.
 */
export async function fetchImageFromSnapshot({ htmlTemplate, data = {} }) {
    try {
        // إعداد الطلب إلى خدمة HTML Snapshot
        const response = await fetch('https://htmlsnapshot.i8x.net/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                htmlTemplate: htmlTemplate,
                data: data,
            }),
        });

        // تحقق من استجابة الطلب
        if (!response.ok) {
            logInfo(`Error fetching image: ${response.statusText}`);
        }

        // جلب الصورة كـ base64
        const json = await response.json();

        if (!json.image) {
            logInfo('Image not found in the response');
        }

        return json.image;

    } catch (error) {
        logError('Error fetching image:', error);
    }
}