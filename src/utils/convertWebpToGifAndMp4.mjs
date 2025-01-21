import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * تحويل ملف WebP إلى GIF ثم إلى MP4.
 * 
 * يقوم هذا الدالة بتحويل ملف WebP إلى صيغة GIF باستخدام برنامج `magick` أو `convert` بناءً على النظام،
 * ومن ثم تحويل GIF إلى صيغة MP4 باستخدام `FFmpeg`، وأخيرًا حذف الملفات المؤقتة.
 * 
 * @param {string} inputPath - مسار ملف WebP المدخل.
 * @param {string} gifOutputPath - مسار ملف GIF الناتج.
 * @param {string} mp4OutputPath - مسار ملف MP4 الناتج.
 * 
 * @returns {Promise<Object>} - يعيد كائن يحتوي على مسار ملف MP4 الناتج ورسالة تفصيلية.
 *   - `outputPath` {string}: مسار ملف MP4 الناتج.
 *   - `message` {string}: رسالة تفصيلية توضح الوقت المستغرق في التحويل.
 * 
 * @throws {Error} - يرمي خطأ إذا فشلت أي خطوة من عملية التحويل أو إذا كان الملف المدخل غير موجود.
 * 
 * @example
 * const result = await convertWebpToGifAndMp4('input.webp', 'output.gif', 'output.mp4');
 * console.log(result.outputPath); // مسار ملف MP4 الناتج
 * console.log(result.message); // رسالة تفصيلية عن الوقت المستغرق
 */
export default async function convertWebpToGifAndMp4(inputPath, gifOutputPath, mp4OutputPath) {
    try {
        const startTime = Date.now(); // وقت البدء لتحليل الأداء
        // تحقق من وجود الملف المدخل
        const fileExists = await fs.pathExists(inputPath);
        if (!fileExists) {
            throw new Error(`الملف المدخل "${inputPath}" غير موجود.`);
        }

        // اختيار الأمر المناسب بناءً على النظام
        const isWindows = os.platform() === 'win32';
        const convertCommand = isWindows ? 'magick' : 'convert';

        // تحويل WebP إلى GIF
        const gifCommand = `${convertCommand} "${inputPath}" "${gifOutputPath}"`;
        const { stderr: gifError } = await execAsync(gifCommand);

        if (gifError) {
            throw new Error(`خطأ أثناء تحويل WebP إلى GIF: ${gifError}`);
        }

        // تحويل GIF إلى MP4 باستخدام FFmpeg
        const mp4Command = `ffmpeg -i "${gifOutputPath}" -c:v libx264 -pix_fmt yuv420p -crf 20 -preset veryfast -y "${mp4OutputPath}"`;
        const { stderr: mp4Error } = await execAsync(mp4Command);

        // حذف ملف GIF بعد التحويل إلى MP4
        await fs.remove(gifOutputPath);
        // حذف الملف المدخل بعد التحويل
        await fs.remove(inputPath);

        // حساب الوقت المستغرق في العملية
        const endTime = Date.now();
        return {
            outputPath: mp4OutputPath,
            message: `تم التحويل بنجاح في ${((endTime - startTime) / 1000).toFixed(2)} ثانية ⏱️🎉`
        };

    } catch (error) {
        console.error('حدث خطأ:', error.message);
        throw error; // إعادة تمرير الخطأ للمستدعي
    }
}