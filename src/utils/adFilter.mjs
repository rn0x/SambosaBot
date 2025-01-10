import fs from 'fs-extra';
import path from 'path';

/**
 * تحميل أنماط التصفية من ملف JSON.
 * @param {string} filePath - مسار ملف الأنماط.
 * @returns {Promise<Object>} - الكائن الذي يحتوي على الأنماط.
 */
export async function loadFilterConfig(filePath) {
    try {
        const patterns = await fs.readJSON(filePath);
        return patterns;
    } catch (error) {
        console.error('Error loading ad patterns:', error.message);
        throw new Error('Failed to load ad patterns.');
    }
}

/**
 * كشف ما إذا كانت الرسالة تحتوي على إعلان.
 * @param {string} message - النص المراد تحليله.
 * @param {Object} patterns - الأنماط والكلمات المحملة من الملف.
 * @returns {boolean} - إرجاع true إذا كانت الرسالة تحتوي على إعلان.
 */
export function filterMessage(message, patterns) {
    if (!message || !patterns) return false;

    // التحقق باستخدام الكلمات المفتاحية
    for (const keyword of patterns.keywords || []) {
        if (message.includes(keyword)) return true;
    }

    // التحقق باستخدام الأنماط التعبيرية
    for (const regexStr of patterns.regexPatterns || []) {
        const regex = new RegExp(regexStr, 'i');
        if (regex.test(message)) return true;
    }

    // التحقق من النطاقات المحظورة
    for (const domain of patterns.bannedDomains || []) {
        if (message.includes(domain)) return true;
    }

    return false;
}
