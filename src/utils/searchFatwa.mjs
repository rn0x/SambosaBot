import Fuse from 'fuse.js';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import removeDiacritics from './removeDiacritics.mjs';
import { logError } from './logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد خيارات Fuse.js للبحث
const fuseOptions = {
    keys: ['question', 'answer', 'title'], // الحقول التي سيتم البحث فيها ['question', 'answer', 'title']
    threshold: 0.3, // درجة الغموض في البحث (قيمة أقل = أكثر دقة)
    distance: 50, // مسافة البحث الغامض
    ignoreLocation: true, // تجاهل موقع الكلمة في النص
    tokenize: true, // تقسيم النص إلى كلمات
    minMatchCharLength: 2, // الحد الأدنى لأحرف المطابقة
};

// تخزين بيانات الفتاوى
const fatwaCache = {};

// تحميل بيانات الفتاوى من ملف fatwas.json
const filePath = path.join(__dirname, '../data/fatwas.json');
try {
    const data = await fs.readJSON(filePath);

    // إنشاء كائن Fuse.js لبيانات الفتاوى
    fatwaCache['fatwas'] = {
        fuse: new Fuse(
            data.map((fatwa, id) => ({
                id,
                question: removeDiacritics(fatwa.question || ""), // إزالة التشكيل من السؤال
                answer: removeDiacritics(fatwa.answer || ""), // إزالة التشكيل من الإجابة
                title: removeDiacritics(fatwa.title || ""), // إزالة التشكيل من العنوان
                categories: fatwa.categories || [], // تصنيفات الفتوى
                link: fatwa.link || "", // الرابط للفتوى
                audio: fatwa.audio || "", // الرابط الصوتي للفتوى
            })),
            fuseOptions
        ),
    };
} catch (error) {
    logError(`خطأ في تحميل بيانات الفتاوى:`, error);
}

// دالة البحث في الفتاوى
export async function searchFatwa(query) {
    const cachedData = fatwaCache['fatwas'];

    if (!cachedData) {
        logError("يجب تحميل بيانات الفتاوى أولاً.");
        return [];
    }

    const fuse = cachedData.fuse;

    // إزالة التشكيل من الاستعلام لتطابق أفضل مع النصوص
    const searchTerm = removeDiacritics(query);

    // تنفيذ البحث باستخدام Fuse.js
    const results = fuse.search(searchTerm);

    if (results.length === 0) {
        return [];
    }

    // إرجاع النتائج
    return results.map(result => result.item);
}