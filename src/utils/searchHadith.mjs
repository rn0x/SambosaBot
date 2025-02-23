import Fuse from 'fuse.js';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import removeDiacritics from './removeDiacritics.mjs';
import { logError } from './logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fuseOptions = {
    keys: ['textArabic'], // الحقول التي سيتم البحث فيها ['textArabic', 'textEnglish']
    threshold: 0.3, // درجة الغموض في البحث (قيمة أقل = أكثر دقة)
    distance: 50, // مسافة البحث الغامض
    ignoreLocation: true, // تجاهل موقع الكلمة في النص
    tokenize: true, // تقسيم النص إلى كلمات
    minMatchCharLength: 2, // الحد الأدنى لأحرف المطابقة
};

const hadithCache = {};

const hadithSources = ['bukhari', 'muslim', 'abudawud'];

// تحميل البيانات وإنشاء كائن Fuse.js لكل مصدر
for (const source of hadithSources) {
    try {
        const filePath = path.join(__dirname, `../data/hadith/${source}.json`);
        const data = await fs.readJSON(filePath);

        // إنشاء كائن Fuse.js مرة واحدة لكل مصدر
        hadithCache[source] = {
            fuse: new Fuse(
                data.hadiths.map((hadith, id) => ({
                    id,
                    source: source,
                    metadata: data.metadata,
                    idInBook: hadith.idInBook,
                    chapterId: hadith.chapterId,
                    bookId: hadith.bookId,
                    narrator: hadith.english.narrator,
                    textArabic: removeMarkdownSymbols(removeDiacritics(hadith.arabic || "")),
                    textEnglish: removeMarkdownSymbols(hadith.english.text) || "", 
                })),
                fuseOptions
            ),
        };
    } catch (error) {
        logError(`خطأ في تحميل بيانات ${source}:`, error);
    }
}

// دالة البحث في الأحاديث
export async function searchHadith(query, source) {
    const cachedData = hadithCache[source];

    if (!cachedData) {
        logError("يجب تحميل البيانات أولاً.");
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


/**
 * إزالة الرموز الخاصة من نص Markdown.
 * @param {string} text - النص الذي يحتوي على الرموز الخاصة.
 * @returns {string} - النص بدون رموز Markdown.
 */
function removeMarkdownSymbols(text) {
    return text
        .replace(/[_*`~]/g, '') // إزالة الرموز _ * ` ~
        .replace(/(?:\[\[(.*?)\]\])/g, '$1'); // إزالة العلامات الخاصة الأخرى إذا كانت موجودة
}