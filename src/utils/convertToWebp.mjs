import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';

const execAsync = promisify(exec);

/**
 * الحصول على مدة الفيديو باستخدام ffprobe.
 * @param {string} inputPath - مسار ملف الفيديو.
 * @returns {Promise<number>} - مدة الفيديو بالثواني.
 */
async function getVideoDuration(inputPath) {
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

/**
 * تحويل الفيديو إلى صيغة WebP.
 * @param {string} inputPath - مسار ملف الفيديو.
 * @param {string} outputDir - مسار المجلد الوجهة.
 * @returns {Promise<{ success: boolean, outputPath: string }>} - الكائن الذي يحتوي على حالة النجاح ومسار الملف الناتج.
 */
export async function convertVideoToWebp(inputPath, outputDir) {
    try {
        // تحقق من وجود الملف
        const fileExists = await fs.pathExists(inputPath);
        if (!fileExists) throw new Error(`Input file not found: ${inputPath}`);

        // الحصول على مدة الفيديو
        const duration = await getVideoDuration(inputPath);

        // التحقق من أن مدة الفيديو أقل من 15 ثانية
        const MAX_DURATION = 15; // الحد الأقصى للمدة بالثواني
        if (duration > MAX_DURATION) {
            return {
                success: false,
                outputPath: '',
                error: `فيديو طويل جداً! الحد الأقصى للمدة هو ${MAX_DURATION} ثانية.`
            };
        }

        // إنشاء المجلد الوجهة إذا لم يكن موجودًا
        await fs.ensureDir(outputDir);

        // إعداد الملفات المؤقتة
        const tempDir = path.join(outputDir, 'temp');
        await fs.ensureDir(tempDir);

        const tempMp4Path = path.join(tempDir, 'temp_video.mp4');
        const timestamp = Date.now(); // الحصول على الطابع الزمني الحالي
        const outputWebpPath = path.join(outputDir, `${timestamp}.webp`);

        // الخطوة 1: تحويل الفيديو إلى MP4 إذا كان بصيغة غير مدعومة
        await execAsync(`
            ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac -strict experimental -y "${tempMp4Path}"
        `.trim());

        // الخطوة 2: تحويل MP4 إلى WebP
        await execAsync(`
            ffmpeg -i "${tempMp4Path}" -vf "scale=512:-1:flags=lanczos,fps=30,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0" \
            -c:v libwebp -qscale 75 -loop 0 -preset photo -compression_level 6 -an -vsync 2 -y "${outputWebpPath}"
        `.trim());

        // التحقق من وجود الملف الناتج
        const outputExists = await fs.pathExists(outputWebpPath);
        if (!outputExists) throw new Error('Conversion failed: WebP file not created.');

        // تنظيف الملفات المؤقتة
        await fs.remove(tempDir);

        // إرجاع الكائن مع حالة النجاح والمسار
        return {
            success: true,
            outputPath: outputWebpPath
        };
    } catch (error) {
        console.error('Error during video to WebP conversion:', error.message);
        return {
            success: false,
            outputPath: '',
            error: error.message
        };
    }
}