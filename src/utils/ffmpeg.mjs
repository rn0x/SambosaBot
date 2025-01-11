import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execAsync = promisify(exec);

export async function convertVideoToWebp(inputPath, outputDir) {
    try {
        // تحقق من وجود الملف
        if (!(await fs.pathExists(inputPath))) {
            throw new Error(`الملف غير موجود: ${inputPath}`);
        }

        // إعداد ملف الإخراج
        const timestamp = Date.now();
        const outputWebpPath = path.join(outputDir, `${timestamp}.webp`);

        // تحويل الفيديو إلى Webp باستخدام ffmpeg
        await execAsync(`
            ffmpeg -i "${inputPath}" -vcodec libwebp -loop 0 -preset default -an -vsync 0 -s 512x512 -f webp -y "${outputWebpPath}"
        `.trim());

        // التحقق من وجود الملف الناتج
        const outputExists = await fs.pathExists(outputWebpPath);
        if (!outputExists) throw new Error('فشل التحويل: ملف Webp لم يتم إنشاؤه.');

        return {
            success: true,
            outputPath: outputWebpPath,
        };
    } catch (error) {
        console.error('حدث خطأ أثناء تحويل الفيديو إلى Webp:', error.message);
        return {
            success: false,
            outputPath: '',
            error: error.message,
        };
    } finally {
        // تنظيف الملفات المؤقتة
        await fs.remove(inputPath);
    }
}


/**
 * الحصول على مدة الفيديو باستخدام ffprobe.
 * @param {string} inputPath - مسار ملف الفيديو.
 * @returns {Promise<number>} - مدة الفيديو بالثواني.
 */
export async function getVideoDuration(inputPath) {
    try {
        const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`);

        const duration = parseFloat(stdout);
        if (isNaN(duration)) {
            throw new Error('Could not determine video duration.');
        }
        return duration;
    } catch (error) {
        throw new Error('Could not determine video duration.');
    }
}