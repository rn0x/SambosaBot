import { exec } from 'child_process';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { config } from '../../config.mjs'

// إنشاء مجلد إذا لم يكن موجودًا
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// توليد اسم فريد
const generateUniqueName = () => {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// تنفيذ أمر shell مع دعم async/await
const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
};

/**
 * تحويل الفيديو إلى صورة WebP متحركة دائرية.
 * @param {string} inputVideo - مسار الفيديو المدخل.
 * @returns {Promise<string>} - مسار ملف الإخراج WebP.
 * @throws {Error} - إذا حدث خطأ أثناء المعالجة.
 */
const convertVideoToCircleWebp = async (inputVideo) => {
    const uniqueId = generateUniqueName();
    const tempDir = path.join(config.paths.temp, uniqueId); // مجلد مؤقت للإطارات
    const outputDir = path.join(config.paths.temp, 'output'); // مجلد الإخراج
    const outputWebP = path.join(outputDir, `${uniqueId}.webp`); // ملف الإخراج

    // إنشاء المجلدات إذا لم تكن موجودة
    ensureDir(tempDir);
    ensureDir(outputDir);

    try {
        // 1. تحويل الفيديو إلى إطارات PNG
        await execCommand(
            `ffmpeg -i ${inputVideo} -t 7 -vf "fps=10,scale=200:200" ${path.join(tempDir, 'frame-%04d.png')}`
        );

        // 2. قراءة الإطارات من المجلد المؤقت
        const frames = fs.readdirSync(tempDir)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) // ترتيب الإطارات
            .map((frame) => path.join(tempDir, frame));

        // 3. تحويل كل إطار إلى شكل دائري
        const circularFramesDir = path.join(tempDir, 'circular');
        ensureDir(circularFramesDir);

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const outputFrame = path.join(circularFramesDir, `circular-frame-${i.toString().padStart(4, '0')}.png`);

            await sharp(frame)
                .resize(200, 200) // تغيير الحجم إلى 200x200
                .composite([
                    {
                        input: Buffer.from(`
              <svg width="200" height="200">
                <circle cx="100" cy="100" r="100"/>
              </svg>
            `),
                        blend: 'dest-in', // تطبيق شكل دائري
                    },
                ])
                .toFile(outputFrame); // حفظ الإطار الدائري
        }

        // 4. دمج الإطارات الدائرية في صورة WebP متحركة
        await execCommand(
            `ffmpeg -framerate 10 -i ${path.join(circularFramesDir, 'circular-frame-%04d.png')} -vf "format=yuva420p" ${outputWebP}`
        );

        return outputWebP; // إرجاع مسار الملف الناتج
    } catch (error) {
        console.error('حدث خطأ أثناء المعالجة:', error);
        throw error; // إعادة رمي الخطأ للتعامل معه في الكود الذي يستدعي هذه الوظيفة
    } finally {
        // 5. تنظيف الملفات المؤقتة حتى في حالة حدوث خطأ
        if (fs.existsSync(tempDir)) {
            fs.rm(tempDir, { recursive: true }, () => {
                // console.log('تم حذف المجلد المؤقت.');
            });
        }
    }
};

// تصدير الوظيفة كـ default
export default convertVideoToCircleWebp;