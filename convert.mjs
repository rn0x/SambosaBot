import { exec } from 'child_process';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// حل مشكلة __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// تحويل الفيديو إلى WebP متحرك دائري
const convertVideoToAnimatedWebP = async (inputVideo) => {
  const uniqueId = generateUniqueName();
  const tempDir = path.join(__dirname, 'temp', uniqueId); // مجلد مؤقت للإطارات
  const outputDir = path.join(__dirname, 'output'); // مجلد الإخراج
  const outputWebP = path.join(outputDir, `${uniqueId}.webp`); // ملف الإخراج

  // إنشاء المجلدات إذا لم تكن موجودة
  ensureDir(tempDir);
  ensureDir(outputDir);

  try {
    // 1. تحويل الفيديو إلى إطارات PNG
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -i ${inputVideo} -t 7 -vf "fps=10,scale=200:200" ${path.join(tempDir, 'frame-%04d.png')}`,
        (error) => (error ? reject(error) : resolve())
      );
    });

    console.log('تم تحويل الفيديو إلى إطارات PNG.');

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

    console.log('تم تحويل الإطارات إلى أشكال دائرية.');

    // 4. دمج الإطارات الدائرية في صورة WebP متحركة
    await new Promise((resolve, reject) => {
      exec(
        `ffmpeg -framerate 10 -i ${path.join(circularFramesDir, 'circular-frame-%04d.png')} -vf "format=yuva420p" ${outputWebP}`,
        (error) => (error ? reject(error) : resolve())
      );
    });

    console.log('تم إنشاء صورة WebP متحركة:', outputWebP);

  } catch (error) {
    console.error('حدث خطأ أثناء المعالجة:', error);
  } finally {
    // 5. تنظيف الملفات المؤقتة
    fs.rm(tempDir, { recursive: true }, () => {
      console.log('تم حذف المجلد المؤقت.');
    });
  }
};

// تشغيل البرنامج
const inputVideo = 'input.mp4'; // الفيديو المدخل
convertVideoToAnimatedWebP(inputVideo);