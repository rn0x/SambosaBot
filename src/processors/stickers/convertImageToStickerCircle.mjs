// /processors/stickers/convertImageToStickerCircle.mjs

import fs from 'fs-extra';
import path from 'path';
import { config } from '../../../config.mjs';
import hasMatchingKeywords from '../../utils/hasMatchingKeywords.mjs';
import convertImageToCircle from '../../utils/convertImageToCircle.mjs';
import { exec } from 'child_process';

export async function convertImageToStickerCircle(message, MessageMedia, messageMeta) {
    try {
        const hasQuotedMsg = message.hasQuotedMsg;
        if (!hasQuotedMsg) return;

        const keywords = ["!دائرة", "!دائره", "!circle"];
        if (!hasMatchingKeywords(message.body, keywords)) return;

        const getQuotedMessage = await message.getQuotedMessage();

        if (!getQuotedMessage.hasMedia) return;
        const mediaType = getQuotedMessage?.type;

        let inputPath, outputPath;
        const uniqueId = Date.now(); // لتجنب تداخل الملفات
        const tempDir = config.paths.temp; // مسار مجلد الصور
        inputPath = path.resolve(tempDir, `input-${uniqueId}`); // مسار الصورة المدخلة
        outputPath = path.resolve(tempDir, `output-circle-${uniqueId}.png`); // مسار الصورة الناتجة

        await fs.ensureDir(tempDir);
        
        if (mediaType === 'image') {
            // إذا كانت الميديا صورة، حفظ الصورة مباشرة
            const media = await getQuotedMessage.downloadMedia();
            await fs.outputFile(inputPath + '.png', media.data, 'base64');
        } else if (mediaType === 'video') {
            // إذا كانت الميديا فيديو، استخراج أول إطار أو عدة إطارات
            const media = await getQuotedMessage.downloadMedia();
            if (media.mimetype !== 'video/mp4') return;

            const tempVideoPath = path.resolve(tempDir, `video-${uniqueId}.mp4`);
            await fs.outputFile(tempVideoPath, media.data, 'base64');

            // استخراج أول إطار من الفيديو (أو 5 إطارات)
            await new Promise((resolve, reject) => {
                const command = `ffmpeg -i ${tempVideoPath} -vf "fps=1" -vframes 1 ${inputPath}.png`;
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error extracting frame from video: ${stderr}`);
                        reject(new Error('فشل في استخراج الإطار من الفيديو'));
                    } else {
                        resolve();
                    }
                });
            });

            await fs.remove(tempVideoPath); // حذف الفيديو المؤقت
        }

        // تحويل الصورة (أو الإطار من الفيديو) إلى دائرة باستخدام الوظيفة
        await convertImageToCircle(inputPath + '.png', outputPath);

        // قراءة الصورة الناتجة
        const imageBuffer = await fs.readFile(outputPath);
        const base64Image = imageBuffer.toString('base64');
        const processedMedia = new MessageMedia('image/png', base64Image, 'processed-circle-sticker.png');

        // إرسال الصورة المعدلة كملصق
        await message.reply(processedMedia, undefined, { sendMediaAsSticker: true, stickerAuthor: messageMeta.pushname || messageMeta.number, stickerName: config.stickerName });

        // إرجاع رد للمستخدم
        await message.reply("✨ *تم تحويل الصورة إلى ملصق دائري بنجاح!* ✨\n🎉 استمتع بالملصق!");

        // حذف الملفات المؤقتة
        await fs.remove(inputPath + '.png');
        await fs.remove(outputPath);
    } catch (error) {
        console.error('Error converting image to circular sticker:', error);
        throw error;
    }
}
