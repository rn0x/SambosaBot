import fetch from 'node-fetch';
import { logError, logInfo } from './logger.mjs';

/**
 * دالة للبحث عن آية في القرآن باستخدام API من quran.com.
 * @param {string} query - النص المراد البحث عنه.
 * @returns {Promise<object|null>} - بيانات الآية التي تحتوي على النص المطلوب أو null إذا لم يتم العثور على شيء.
 */
export async function searchAyah(query) {
    // التأكد من أن النص المدخل ليس فارغًا
    if (!query) {
        return null;
    }

    const apiUrl = `https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}`;

    try {
        // إرسال طلب إلى API
        const response = await fetch(apiUrl);

        // تحقق من حالة الاستجابة
        if (!response.ok) {
            logInfo(`HTTP error! status: ${response.status}`);
        }

        // تحويل الاستجابة إلى JSON
        const data = await response.json();
        const results = data.search.results;

        // التحقق من وجود نتائج
        if (results.length > 0) {
            const verse = results[0]; // أخذ أول نتيجة (يمكنك تحسينها حسب احتياجك)
            return {
                verseKey: verse.verse_key,
                verseText: verse.text,
                highlightedWords: verse.words,
            };
        } else {
            return null;
        }
    } catch (error) {
        logError('حدث خطأ أثناء البحث عن الآية:', error);
        return null; // معالجة الأخطاء وإرجاع null
    }
}