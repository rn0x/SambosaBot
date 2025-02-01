import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs-extra';


const execAsync = promisify(exec);

// تحقق من وجود الأوامر المطلوبة
async function checkDependencies() {
    const commands = ['ffmpeg', os.platform() === 'win32' ? 'magick' : 'convert'];
    for (const cmd of commands) {
        try {
            await execAsync(`${cmd} -version`);
        } catch {
            throw new Error(`❌ ${cmd} غير مثبت على النظام!`);
        }
    }
}

// تحويل فيديو إلى WebP متحرك دائري
export default async function convertToCircularWebp(inputPath, outputPath) {
    try {
        await checkDependencies();

        // اسم الملف المؤقت
        const tempWebp = `temp_${Date.now()}.webp`;

        // 1️⃣ تحويل أول 7 ثوانٍ فقط وضغط الفيديو إلى WebP متحرك
        await execAsync(`ffmpeg -i "${inputPath}" -t 7 -vf "scale=300:300:force_original_aspect_ratio=decrease,fps=10" -q:v 20 -loop 0 "${tempWebp}"`);

        // 2️⃣ قص الصورة إلى دائرة
        const convertCmd = os.platform() === 'win32' ? 'magick' : 'convert';
        await execAsync(`${convertCmd} "${tempWebp}" -alpha set -background none -channel A -evaluate set 0% +channel -size 300x300 xc:none -fill "${tempWebp}" -draw "circle 150,150 150,0" "${outputPath}"`);

        // console.log(`✅ تمت معالجة ${inputPath} وحفظه في ${outputPath}`);
        return { success: true, path: outputPath, message: 'تم تحويل الفيديو إلى WebP دائري وضغطه بنجاح!' };
    } catch (error) {
        console.error(`❌ خطأ: ${error.message}`);
        return { success: false, path: null, message: `فشل تحويل ${inputPath}: ${error.message}` };
    } finally {
        // حذف الملف المؤقت
        await fs.remove(tempWebp);
        await fs.remove(inputPath);
    }
}

// ✅ مثال استخدام
// (async () => {
//     const result = await convertToCircularWebp('input.mp4', 'output.webp');
//     console.log(result);
// })();
