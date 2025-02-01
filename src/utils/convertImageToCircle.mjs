// /utils/convertImageToCircle.mjs
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';

/**
 * تحويل صورة إلى دائرة.
 * 
 * @param {string} inputPath - مسار الصورة المدخلة.
 * @param {string} outputPath - مسار الصورة الناتجة.
 * @returns {Promise<void>} - يعيد وعودًا عند اكتمال التحويل.
 */
export default async function convertImageToCircle(inputPath, outputPath) {
    // التحقق من وجود الصورة المدخلة
    if (!fs.existsSync(inputPath)) {
        throw new Error(`الصورة المدخلة غير موجودة: ${inputPath}`);
    }

    try {
        // قراءة الصورة الأصلية باستخدام sharp
        const image = sharp(inputPath);

        // الحصول على أبعاد الصورة الأصلية
        const { width, height } = await image.metadata();

        // تحديد القطر الأصغر لتقليص الصورة إلى مربع
        const size = Math.min(width, height);

        // إنشاء قناع دائري باستخدام SVG
        const mask = Buffer.from(
            `<svg width="${size}" height="${size}">
                <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
            </svg>`
        );

        // تطبيق القناع الدائري
        await image
            .resize(size, size) // التأكد من أن الصورة مربعة
            .composite([{ input: mask, blend: 'dest-in' }]) // دمج القناع مع الصورة
            .toFile(outputPath); // حفظ الصورة الناتجة

        // console.log(`تم تحويل الصورة إلى دائرة بنجاح. الصورة محفوظة في ${outputPath}`);
    } catch (err) {
        // التعامل مع الأخطاء بشكل صحيح
        console.error('حدث خطأ أثناء تحويل الصورة:', err.message);
        throw err; // إعادة الخطأ لتمكين المعالجة في المستوى الأعلى إذا لزم الأمر
    } finally {
        await fs.remove(inputPath);
    }
}