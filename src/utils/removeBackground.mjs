import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { config } from '../../config.mjs'

/**
 * تقوم هذه الدالة بإزالة الخلفية من الصورة باستخدام أداة rembg.
 * 
 * @param {string} inputPath - مسار ملف الصورة المدخلة.
 * 
 * @returns {Promise<{success: boolean, outputPath?: string, error?: string}>} - 
 *   وعد يعيد كائن يحتوي على نتيجة العملية. 
 *   إذا كانت العملية ناجحة، سيكون `success` هو `true` و`outputPath` يحتوي على مسار الصورة التي تم معالجتها. 
 *   إذا فشلت العملية، سيكون `success` هو `false` و`error` يحتوي على رسالة الخطأ.
 * 
 * @throws {Error} قد يتم رمي خطأ إذا كان ملف الصورة المدخل غير موجود أو إذا فشلت عملية تنفيذ أمر rembg.
 */
export default async function removeBackground(inputPath) {
    try {
        // التحقق من وجود الملف المدخل
        if (!await fs.pathExists(inputPath)) {
            throw new Error('Input image file does not exist.');
        }

        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const tempDir = config.paths.temp; // مسار مجلد الصور
        const outputPath = path.resolve(tempDir, `output-${uniqueId}.png`); // مسار الصورة الناتجة

        // بناء أمر إزالة الخلفية باستخدام rembg
        const command = `rembg i -m u2netp "${inputPath}" "${outputPath}"`;

        // تنفيذ الأمر باستخدام وعد
        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Error executing rembg: ${stderr}`));
                } else {
                    resolve(stdout);
                }
            });
        });

        // console.log(`Background removed successfully: ${outputPath}`);
        return { success: true, outputPath };
    } catch (error) {
        console.error('Error removing background:', error);
        return { success: false, error: error.message };
    } finally {
        // التأكد من إزالة الملف المدخل بعد المعالجة
        await fs.remove(inputPath);
    }
}
