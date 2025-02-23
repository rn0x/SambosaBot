import Fuse from 'fuse.js';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import removeDiacritics from './removeDiacritics.mjs';
import { logError } from './logger.mjs';

// تحديد المسارات
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const khutbahsPath = path.join(__dirname, '../data/khutbahs.json');

// الخيارات الخاصة بـ Fuse.js
const fuseOptions = {
  keys: ['title', 'rawContent'], // الحقول التي يتم البحث فيها
  threshold: 0.3, // درجة الغموض (قيمة أقل = دقة أعلى)
  distance: 50, // مسافة البحث
  ignoreLocation: true, // تجاهل موقع الكلمة
  tokenize: true, // تقسيم النص إلى كلمات
  minMatchCharLength: 2, // الحد الأدنى لعدد أحرف المطابقة
};

let KhutbahCache = null; // تخزين الـ Cache لنتائج التهيئة

/**
 * تحميل الخطب من الملف وتخزينها في الـ Cache.
 */
async function loadKhutbahs() {
  try {
    const khutbahs = await fs.readJson(khutbahsPath); // تحميل البيانات بشكل غير متزامن

    KhutbahCache = new Fuse(
      khutbahs.map((data, id) => ({
        title: data.title,
        slug: data.slug,
        author: data.author,
        category_text: data.category_text,
        rawContent: removeMarkdownSymbols(removeDiacritics(data.details.rawContent || "")),
        attachments: data.details.attachments,
        mainCategories: data.details.mainCategories,
        source_url: data.details.url,
      })),
      fuseOptions
    );
  } catch (error) {
    logError(`حدث خطأ أثناء تحميل الخطب: ${error.message}`);
  }
}

/**
 * إزالة الرموز الخاصة من نص Markdown.
 * @param {string} text - النص الذي يحتوي على الرموز الخاصة.
 * @returns {string} - النص بدون رموز Markdown.
 */
function removeMarkdownSymbols(text) {
  return text
    .replace(/[_*`~]/g, '') // إزالة الرموز _ * ` ~
    .replace(/(?:\[\[(.*?)\]\])/g, '$1'); // إزالة العلامات الخاصة الأخرى
}

// تحميل الخطب عند بدء التشغيل
await loadKhutbahs();

/**
 * البحث عن خطبة باستخدام Fuse.js.
 * @param {string} query - نص الاستعلام.
 * @returns {Promise<Array>} - نتائج البحث.
 */
export default async function searchKhutbah(query) {
  if (!KhutbahCache) {
    logError("يجب تحميل البيانات أولاً.");
    return [];
  }

  // إزالة التشكيل من نص الاستعلام
  const searchTerm = removeDiacritics(query);

  // تنفيذ البحث باستخدام Fuse.js
  const results = KhutbahCache.search(searchTerm);

  // إرجاع النتائج
  return results.map(result => result.item);
}