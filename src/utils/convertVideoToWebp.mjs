import { exec } from 'child_process';
import fs from 'fs-extra';

export default async function convertVideoToWebp(inputPath, outputPath) {
    try {
        // التحقق من وجود الملف المدخل
        if (!await fs.pathExists(inputPath)) {
            throw new Error('Input video file does not exist.');
        }
        // بناء أمر ffmpeg
        const command = `ffmpeg -i "${inputPath}" -t 7 -vf "fps=10,scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=0x00000000" -c:v libwebp -lossless 0 -q:v 20 -loop 0 -preset default -an -fps_mode passthrough -pix_fmt yuva420p -y "${outputPath}"`;

        // تنفيذ الأمر باستخدام وعد
        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Error executing ffmpeg: ${stderr}`));
                } else {
                    resolve(stdout);
                }
            });
        });

        // console.log(`Video converted successfully to WebP: ${outputPath}`);
        return { success: true, outputPath };
    } catch (error) {
        console.error('Error converting video to WebP:', error);
        return { success: false, error: error.message };
    } finally {
        await fs.remove(inputPath);
    }
}
